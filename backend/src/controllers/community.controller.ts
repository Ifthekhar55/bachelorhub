import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../prisma';

export class CommunityController {
  getPosts = async (req: Request, res: Response) => {
    try {
      const posts = await prisma.communityPost.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          commentsList: {
            orderBy: { createdAt: 'asc' },
            include: { likedBy: true },
          },
          likedBy: true,
        },
      });

      const mapped = posts.map((p) => ({
        id: p.id,
        authorId: p.authorId,
        author: p.author,
        avatar: p.avatar,
        title: p.title,
        content: p.content,
        likes: p.likes,
        comments: p.comments,
        pinned: p.pinned,
        tag: p.tag,
        createdAt: p.createdAt,
        likedBy: p.likedBy.map((like) => like.userId),
        commentsList: p.commentsList.map((c) => ({
          id: c.id,
          authorId: c.authorId,
          author: c.author,
          avatar: c.avatar,
          content: c.content,
          time: c.createdAt.toISOString(),
          likes: c.likes,
          likedBy: c.likedBy.map((like) => like.userId),
        })),
      }));

      res.json({ posts: mapped });
    } catch (error) {
      console.error('Get community posts error:', error);
      res.status(500).json({ error: 'Failed to fetch community posts' });
    }
  };

  createPost = async (req: Request, res: Response) => {
    try {
      const { authorId, author, avatar, title, content, tag } = req.body;
      const post = await prisma.communityPost.create({
        data: {
          id: uuidv4(),
          authorId: authorId ?? 'anonymous',
          author: author ?? 'Anonymous',
          avatar: avatar ?? null,
          title,
          content,
          tag: tag ?? 'Community',
        },
      });

      res.status(201).json(post);
    } catch (error) {
      console.error('Create community post error:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  };

  updatePost = async (req: Request, res: Response) => {
    try {
      const postId = String(req.params.postId);
      const { title, content, tag } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Post content is required' });
      }

      const updatedPost = await prisma.communityPost.update({
        where: { id: postId },
        data: {
          title: title ?? undefined,
          content: content.trim(),
          tag: tag ?? undefined,
        },
      });

      res.json({
        id: updatedPost.id,
        authorId: updatedPost.authorId,
        author: updatedPost.author,
        avatar: updatedPost.avatar,
        title: updatedPost.title,
        content: updatedPost.content,
        likes: updatedPost.likes,
        comments: updatedPost.comments,
        pinned: updatedPost.pinned,
        tag: updatedPost.tag,
        createdAt: updatedPost.createdAt,
      });
    } catch (error) {
      console.error('Update community post error:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  };

  deletePost = async (req: Request, res: Response) => {
    try {
      const postId = String(req.params.postId);
      const comments = await prisma.communityComment.findMany({
        where: { postId },
        select: { id: true },
      });
      const commentIds = comments.map((comment) => comment.id);

      await prisma.$transaction([
        prisma.communityCommentLike.deleteMany({
          where: { commentId: { in: commentIds } },
        }),
        prisma.communityComment.deleteMany({
          where: { postId },
        }),
        prisma.communityPostLike.deleteMany({
          where: { postId },
        }),
        prisma.communityPost.delete({
          where: { id: postId },
        }),
      ]);

      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Delete community post error:', error);
      res.status(500).json({ error: 'Failed to delete post' });
    }
  };

  togglePostLike = async (req: Request, res: Response) => {
    try {
      const postId = req.params.postId;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const existingLike = await prisma.communityPostLike.findUnique({
        where: {
          postId_userId: {
            postId: String(postId),
            userId,
          },
        },
      });

      if (existingLike) {
        await prisma.$transaction([
          prisma.communityPostLike.delete({ where: { id: existingLike.id } }),
          prisma.communityPost.update({ where: { id: String(postId) }, data: { likes: { decrement: 1 } } }),
        ]);
      } else {
        await prisma.$transaction([
          prisma.communityPostLike.create({ data: { postId: String(postId), userId } }),
          prisma.communityPost.update({ where: { id: String(postId) }, data: { likes: { increment: 1 } } }),
        ]);
      }

      const updatedPost = await prisma.communityPost.findUnique({
        where: { id: String(postId) },
        include: { likedBy: true },
      });

      if (!updatedPost) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.json({
        postId,
        likes: updatedPost.likes,
        likedBy: updatedPost.likedBy.map((like) => like.userId),
      });
    } catch (error) {
      console.error('Toggle post like error:', error);
      res.status(500).json({ error: 'Failed to toggle post like' });
    }
  };

  addComment = async (req: Request, res: Response) => {
    try {
      const postId = req.params.postId;
      const { authorId, author, avatar, content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      const comment = await prisma.communityComment.create({
        data: {
          id: uuidv4(),
          postId: String(postId),
          authorId: authorId ?? 'anonymous',
          author: author ?? 'Anonymous',
          avatar: avatar ?? null,
          content,
        },
      });

      await prisma.communityPost.update({
        where: { id: String(postId) },
        data: { comments: { increment: 1 } },
      });

      const commentWithLikes = await prisma.communityComment.findUnique({
        where: { id: comment.id },
        include: { likedBy: true },
      });

      if (!commentWithLikes) {
        return res.status(500).json({ error: 'Comment saved but could not be loaded' });
      }

      res.status(201).json({
        comment: {
          id: commentWithLikes.id,
          authorId: commentWithLikes.authorId,
          author: commentWithLikes.author,
          avatar: commentWithLikes.avatar,
          content: commentWithLikes.content,
          time: commentWithLikes.createdAt.toISOString(),
          likes: commentWithLikes.likes,
          likedBy: commentWithLikes.likedBy.map((like) => like.userId),
        },
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  };

  toggleCommentLike = async (req: Request, res: Response) => {
    try {
      const commentId = req.params.commentId;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const existingLike = await prisma.communityCommentLike.findUnique({
        where: {
          commentId_userId: {
            commentId: String(commentId),
            userId,
          },
        },
      });

      if (existingLike) {
        await prisma.$transaction([
          prisma.communityCommentLike.delete({ where: { id: existingLike.id } }),
          prisma.communityComment.update({ where: { id: String(commentId) }, data: { likes: { decrement: 1 } } }),
        ]);
      } else {
        await prisma.$transaction([
          prisma.communityCommentLike.create({ data: { commentId: String(commentId), userId } }),
          prisma.communityComment.update({ where: { id: String(commentId) }, data: { likes: { increment: 1 } } }),
        ]);
      }

      const updatedComment = await prisma.communityComment.findUnique({
        where: { id: String(commentId) },
        include: { likedBy: true },
      });

      if (!updatedComment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      res.json({
        commentId,
        likes: updatedComment.likes,
        likedBy: updatedComment.likedBy.map((like) => like.userId),
      });
    } catch (error) {
      console.error('Toggle comment like error:', error);
      res.status(500).json({ error: 'Failed to toggle comment like' });
    }
  };
}

export const communityController = new CommunityController();
