import { Router } from 'express';
import { communityController } from '../controllers/community.controller';

const router = Router();

router.get('/', communityController.getPosts);
router.post('/', communityController.createPost);
router.put('/:postId', communityController.updatePost);
router.delete('/:postId', communityController.deletePost);
router.post('/:postId/comments', communityController.addComment);
router.post('/:postId/like', communityController.togglePostLike);
router.post('/comments/:commentId/like', communityController.toggleCommentLike);

export default router;
