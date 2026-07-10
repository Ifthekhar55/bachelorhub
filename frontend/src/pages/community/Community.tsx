import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  MessageSquare,
  Heart,
  Share2,
  Pin,
  TrendingUp,
  Users,
  Award,
  Calendar,
  Facebook,
  MessageCircle,
  Send,
  Trash2,
  Edit2,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'
import api from '../../services/api'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { buildShareUrl } from '../../utils/share'

interface Comment {
  id: number | string
  authorId: string
  author: string
  avatar?: string
  content: string
  time: string
  likes?: number
  likedBy?: string[]
}

interface Post {
  id: number | string
  authorId: string
  author: string
  avatar?: string
  time: string
  title: string
  content: string
  likes: number
  comments: number
  pinned: boolean
  tag: string
  createdAt?: string
  likedBy?: string[]
  commentsList?: Comment[]
}

interface Event {
  id: string
  title: string
  description?: string
  date: string
  location: string
  organizer: string
  organizerId: string
  attendees: number
}

const Community = () => {
  const [activeTab, setActiveTab] = useState<'trending' | 'latest' | 'top'>('latest') // Changed default to 'latest'
  const [posts, setPosts] = useState<Post[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostText, setNewPostText] = useState('')
  const [selectedPostTag, setSelectedPostTag] = useState('')
  const [editingPostId, setEditingPostId] = useState<number | string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [activePostId, setActivePostId] = useState<number | string | null>(null)
  const [commentTextByPost, setCommentTextByPost] = useState<Record<string, string>>({})
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [isLiking, setIsLiking] = useState<string | null>(null) // Track which post is being liked
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null)
  const [showMemberDetails, setShowMemberDetails] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showCreateEventModal, setShowCreateEventModal] = useState(false)
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
  })
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  const { user } = useAuthStore()

  const resolveAvatar = (avatar: string | null | undefined, authorId?: string) => {
    if (avatar) return avatar
    if (authorId && authorId === user?.id && user?.profilePhoto) return user.profilePhoto
    return undefined
  }

  const computedTrendingTopics = useMemo(() => {
    const counts = new Map<string, { total: number; recent: number; prev: number }>()
    const now = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(now.getDate() - 7)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(now.getDate() - 14)

    posts.forEach((p) => {
      const tag = p.tag || 'Community'
      const cur = counts.get(tag) ?? { total: 0, recent: 0, prev: 0 }
      cur.total += 1
      const created = p.createdAt ? new Date(p.createdAt) : now
      if (created >= sevenDaysAgo) cur.recent += 1
      else if (created >= fourteenDaysAgo) cur.prev += 1
      counts.set(tag, cur)
    })

    const arr = Array.from(counts.entries())
      .map(([name, { total, recent, prev }]) => {
        let trend = '+0%'
        if (prev === 0) {
          trend = recent > 0 ? `+${recent * 100}%` : '+0%'
        } else {
          const pct = Math.round(((recent - prev) / prev) * 100)
          trend = `${pct >= 0 ? '+' : ''}${pct}%`
        }
        return { name, posts: total, trend }
      })
      .sort((a, b) => b.posts - a.posts)

    if (arr.length === 0) return [{ name: 'Community', posts: posts.length, trend: '+0%' }]
    return arr.slice(0, 4)
  }, [posts])

  const postTags = [
    'Community',
    'Advice',
    'Roommate',
    'Rent',
    'Safety',
    'Events',
    'Housing',
  ]

  const topContributors = [
    { name: 'Rakib Hasan', posts: 45, likes: 892 },
    { name: 'Sadia Akter', posts: 38, likes: 756 },
    { name: 'Rafiqul Islam', posts: 32, likes: 623 },
  ]

  // Derive actual top contributors from loaded posts. Fall back to static list when no posts available.
  const computedTopContributors = useMemo(() => {
    if (!posts || posts.length === 0) return topContributors.map(c => ({ ...c, authorId: undefined }))

    const byAuthor = new Map<string, { name: string; authorId?: string; posts: number; likes: number; avatar?: string }>()
    posts.forEach((p) => {
      const key = p.authorId ?? p.author
      const cur = byAuthor.get(key)
      if (!cur) {
        byAuthor.set(key, { name: p.author, authorId: p.authorId, posts: 1, likes: p.likes ?? 0, avatar: p.avatar })
      } else {
        cur.posts += 1
        cur.likes += p.likes ?? 0
        if (!cur.avatar && p.avatar) cur.avatar = p.avatar
      }
    })

    return Array.from(byAuthor.values()).sort((a, b) => b.posts - a.posts || b.likes - a.likes).slice(0, 10)
  }, [posts])

  // Compute actual unique community member count from posts (fallback to 0)
  const computedMemberCount = useMemo(() => {
    const set = new Set<string>()
    posts.forEach((p) => {
      if (p.authorId) set.add(p.authorId)
      else if (p.author) set.add(p.author)
    })
    if (user?.id && !set.has(user.id)) set.add(user.id)
    return set.size
  }, [posts, user])

  // Compute member stats from posts data
  const memberStats = useMemo(() => {
    // Count new members this week (unique authors who posted in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const newMembersSet = new Set<string>()
    posts.forEach((p) => {
      const postDate = p.createdAt ? new Date(p.createdAt) : new Date()
      if (postDate >= sevenDaysAgo) {
        if (p.authorId) newMembersSet.add(p.authorId)
        else newMembersSet.add(p.author)
      }
    })
    const newThisWeek = newMembersSet.size

    // Count active discussions (posts with at least one comment)
    const activeDiscussions = posts.filter((p) => p.comments > 0 || (p.commentsList && p.commentsList.length > 0)).length

    // Find most popular tag
    const tagCount = new Map<string, number>()
    posts.forEach((p) => {
      const tag = p.tag || 'Community'
      tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1)
    })
    const popularTag = Array.from(tagCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Community'

    return {
      total: computedMemberCount,
      newThisWeek,
      activeDiscussions,
      popularTag,
    }
  }, [posts, computedMemberCount])

  // Define loadPosts before useEffect
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/community')
      const data = response.data
      const mapped: Post[] = (data.posts ?? []).map((p: any) => ({
        id: String(p.id),
        authorId: p.authorId,
        author: p.author,
        avatar: resolveAvatar(p.avatar, p.authorId),
        time: new Date(p.createdAt).toLocaleString(),
        title: p.title,
        content: p.content,
        likes: p.likes ?? 0,
        comments: p.comments ?? 0,
        pinned: p.pinned ?? false,
        tag: p.tag ?? 'Community',
        likedBy: Array.isArray(p.likedBy) ? p.likedBy.map(String) : [],
        commentsList: Array.isArray(p.commentsList)
          ? p.commentsList.map((c: any) => ({
              id: String(c.id),
              authorId: c.authorId,
              author: c.author,
              avatar: resolveAvatar(c.avatar, c.authorId),
              content: c.content,
              time: new Date(c.time).toLocaleString(),
              likes: c.likes ?? 0,
              likedBy: Array.isArray(c.likedBy) ? c.likedBy.map(String) : [],
            }))
          : [],
      }))
      setPosts(mapped)
    } catch (e) {
      console.error('Failed to load community posts', e)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Define loadEvents before useEffect
  const loadEvents = useCallback(async () => {
    try {
      const response = await api.get('/api/events')
      const data = response.data
      const mapped: Event[] = (data.events ?? []).map((e: any) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        date: new Date(e.date).toISOString(),
        location: e.location,
        organizer: e.organizer,
        organizerId: e.organizerId,
        attendees: e.attendees ?? 0,
      }))
      setEvents(mapped)
    } catch (e) {
      console.error('Failed to load events', e)
      setEvents([])
    }
  }, [])

  // Load posts from API
  useEffect(() => {
    loadPosts()
    loadEvents()
  }, [loadPosts, loadEvents])

  const handleCreatePost = async () => {
    const trimmed = newPostText.trim()
    if (!selectedPostTag) {
      toast.error('Please select a tag for your post')
      return
    }
    if (!trimmed) return
    if (isPosting) return
    setIsPosting(true)

    const authorName = user?.name ?? 'You'
    const avatar = user?.profilePhoto?.trim() || undefined

    try {
      const payload = {
        authorId: user?.id ?? 'local-user',
        author: authorName,
        avatar,
        title: trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed,
        content: trimmed,
        tag: selectedPostTag,
      }

      const response = await api.post('/api/community', payload)
      const created = response.data

      const newPost: Post = {
        id: String(created.id),
        authorId: created.authorId,
        author: created.author,
        avatar: resolveAvatar(created.avatar, created.authorId),
        time: new Date(created.createdAt).toLocaleString(),
        title: created.title,
        content: created.content,
        likes: created.likes ?? 0,
        comments: created.comments ?? 0,
        pinned: created.pinned ?? false,
        tag: created.tag ?? 'Community',
        likedBy: [],
        commentsList: [],
      }

      setPosts((prev) => [newPost, ...prev])
      setNewPostText('')
      setSelectedPostTag('')
      setActiveTab('latest')
      toast.success('Post created successfully')
    } catch (e) {
      console.error('Create post failed', e)
      toast.error('Failed to create post')
    } finally {
      setIsPosting(false)
    }
  }

  const openEventModal = (event?: Event) => {
    if (event) {
      const eventDate = new Date(event.date)
      setEditingEventId(event.id)
      setEventFormData({
        title: event.title,
        description: event.description || '',
        date: eventDate.toISOString().slice(0, 10),
        time: eventDate.toISOString().slice(11, 16),
        location: event.location,
      })
    } else {
      setEditingEventId(null)
      setEventFormData({ title: '', description: '', date: '', time: '', location: '' })
    }
    setShowCreateEventModal(true)
  }

  const handleSaveEvent = async () => {
    if (!eventFormData.title || !eventFormData.date || !eventFormData.time || !eventFormData.location) {
      toast.error('Please fill in all required fields')
      return
    }

    if (isCreatingEvent) return
    setIsCreatingEvent(true)

    const authorName = user?.name ?? 'You'
    const dateTime = new Date(`${eventFormData.date}T${eventFormData.time}`)
    const payload = {
      title: eventFormData.title,
      description: eventFormData.description || null,
      date: dateTime.toISOString(),
      location: eventFormData.location,
      organizer: authorName,
      organizerId: user?.id ?? 'local-user',
    }

    try {
      if (editingEventId) {
        const response = await api.put(`/api/events/${editingEventId}`, payload)
        const updated = response.data

        setEvents((prev) =>
          prev
            .map((e) =>
              e.id === editingEventId
                ? {
                    ...e,
                    title: updated.title,
                    description: updated.description,
                    date: new Date(updated.date).toISOString(),
                    location: updated.location,
                  }
                : e
            )
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        )
        toast.success('Event updated successfully')
      } else {
        const response = await api.post('/api/events', payload)
        const created = response.data

        const newEvent: Event = {
          id: created.id,
          title: created.title,
          description: created.description,
          date: new Date(created.date).toISOString(),
          location: created.location,
          organizer: created.organizer,
          organizerId: created.organizerId,
          attendees: created.attendees ?? 0,
        }

        setEvents((prev) => [...prev, newEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
        toast.success('Event created successfully')
      }

      setEventFormData({ title: '', description: '', date: '', time: '', location: '' })
      setEditingEventId(null)
      setShowCreateEventModal(false)
    } catch (e) {
      console.error(editingEventId ? 'Update event failed' : 'Create event failed', e)
      toast.error(editingEventId ? 'Failed to update event' : 'Failed to create event')
    } finally {
      setIsCreatingEvent(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Delete this event?')) return

    try {
      await api.delete(`/api/events/${eventId}`)
      setEvents((prev) => prev.filter((e) => e.id !== eventId))
      toast.success('Event deleted successfully')
    } catch (e) {
      console.error('Delete event failed', e)
      toast.error('Failed to delete event')
    }
  }

  const handleStartEdit = (postId: number | string) => {
    const p = posts.find((x) => x.id === postId)
    if (!p) return
    setEditingPostId(postId)
    setEditingText(p.content)
  }

  const handleSaveEdit = async (postId: number | string) => {
    const trimmed = editingText.trim()
    if (!trimmed) return

    const updatedTitle = trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed

    try {
      const response = await api.put(`/api/community/${postId}`, {
        title: updatedTitle,
        content: trimmed,
      })

      const updatedPost = response.data
      setPosts((prev) =>
        prev.map((post) =>
          String(post.id) === String(postId)
            ? { ...post, content: updatedPost.content, title: updatedPost.title }
            : post
        )
      )
      setEditingPostId(null)
      setEditingText('')
      toast.success('Post updated successfully')
    } catch (error) {
      console.error('Update post failed', error)
      toast.error('Failed to update post')
    }
  }

  const handleDeletePost = async (postId: number | string) => {
    if (!window.confirm('Delete this post? This action cannot be undone.')) return

    try {
      await api.delete(`/api/community/${postId}`)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      toast.success('Post deleted successfully')
    } catch (e) {
      console.error('Delete post failed', e)
      toast.error('Failed to delete post')
    }
  }

  // Fixed like handler - updates the specific post without causing re-sort confusion
  const handleLikePost = async (clickedPostId: number | string) => {
    if (!user?.id) {
      toast.error('Please login to like posts')
      return
    }

    // Prevent multiple clicks on same post
    if (isLiking === String(clickedPostId)) return
    setIsLiking(String(clickedPostId))

    // Find the target post
    const targetPost = posts.find(p => String(p.id) === String(clickedPostId))
    if (!targetPost) {
      setIsLiking(null)
      return
    }

    const userId = user.id
    const isCurrentlyLiked = targetPost.likedBy?.includes(userId) || false
    
    // Create updated post
    const updatedPost = {
      ...targetPost,
      likes: isCurrentlyLiked ? targetPost.likes - 1 : targetPost.likes + 1,
      likedBy: isCurrentlyLiked
        ? (targetPost.likedBy || []).filter(id => id !== userId)
        : [...(targetPost.likedBy || []), userId]
    }

    // Update the specific post while preserving order
    setPosts(prevPosts => 
      prevPosts.map(post => 
        String(post.id) === String(clickedPostId) ? updatedPost : post
      )
    )

    try {
      await api.post(`/api/community/${clickedPostId}/like`, { userId })
    } catch (error) {
      // Revert on error
      setPosts(prevPosts => 
        prevPosts.map(post => 
          String(post.id) === String(clickedPostId) ? targetPost : post
        )
      )
      console.error('Failed to like post:', error)
      toast.error('Failed to like post')
    } finally {
      setIsLiking(null)
    }
  }

  const handleToggleComments = (postId: number | string) => {
    setActivePostId((current) => (current === postId ? null : postId))
  }

  const handleCommentChange = (postId: number | string, value: string) => {
    setCommentTextByPost((prev) => ({ ...prev, [String(postId)]: value }))
  }

  const handleSubmitComment = async (postId: number | string) => {
    const key = String(postId)
    const text = (commentTextByPost[key] ?? '').trim()
    if (!text) return

    const authorName = user?.name ?? 'You'
    const userAvatar = user?.profilePhoto?.trim() || undefined
    const userId = user?.id ?? 'local-user'

    try {
      const response = await api.post(`/api/community/${postId}/comments`, {
        authorId: userId,
        author: authorName,
        avatar: userAvatar,
        content: text,
      })
      const created = response.data.comment

      const newComment: Comment = {
        id: String(created.id),
        authorId: created.authorId,
        author: created.author,
        avatar: resolveAvatar(created.avatar, created.authorId),
        content: created.content,
        time: new Date(created.time).toLocaleString(),
        likes: created.likes ?? 0,
        likedBy: Array.isArray(created.likedBy) ? created.likedBy.map(String) : [],
      }

      setPosts((prev) => prev.map((post) => {
        if (String(post.id) !== key) return post
        return {
          ...post,
          comments: post.comments + 1,
          commentsList: [...(post.commentsList ?? []), newComment],
        }
      }))
      setCommentTextByPost((prev) => ({ ...prev, [key]: '' }))
      toast.success('Comment added')
    } catch (e) {
      console.error('Failed to add comment', e)
      toast.error('Failed to add comment')
    }
  }

  const handleSharePost = (platform: string, post: Post) => {
    const shareUrl = buildShareUrl(`/community/post/${post.id}`)
    const encodedUrl = encodeURIComponent(shareUrl)
    const text = `Check out this community post: ${shareUrl}`
    const encodedText = encodeURIComponent(text)
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      messenger: `https://www.messenger.com/share?link=${encodedUrl}&redirect_uri=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      clipboard: '',
    }

    if (platform === 'clipboard') {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setShareStatus('Post link copied to clipboard!')
        window.setTimeout(() => setShareStatus(null), 2500)
      }).catch(() => {
        setShareStatus('Unable to copy link')
        window.setTimeout(() => setShareStatus(null), 2500)
      })
    } else if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    }
  }

  const handleStartEditComment = (commentId: number | string, commentText: string) => {
    setEditingCommentId(commentId)
    setEditingCommentText(commentText)
  }

  const handleSaveCommentEdit = (postId: number | string, commentId: number | string) => {
    const trimmed = editingCommentText.trim()
    if (!trimmed) return
    setPosts((prev) => prev.map((post) => {
      if (post.id !== postId) return post
      return {
        ...post,
        commentsList: (post.commentsList ?? []).map((c) =>
          c.id === commentId ? { ...c, content: trimmed } : c
        ),
      }
    }))
    setEditingCommentId(null)
    setEditingCommentText('')
    toast.success('Comment updated')
  }

  const handleDeleteComment = async (postId: number | string, commentId: number | string) => {
    if (!window.confirm('Delete this comment?')) return

    const previousPosts = posts

    setPosts((prev) => prev.map((post) => {
      if (post.id !== postId) return post
      return {
        ...post,
        comments: Math.max(0, post.comments - 1),
        commentsList: (post.commentsList ?? []).filter((c) => c.id !== commentId),
      }
    }))

    try {
      await api.delete(`/api/community/comments/${commentId}`)
      toast.success('Comment deleted')
    } catch (error) {
      setPosts(previousPosts)
      console.error('Failed to delete comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const handleLikeComment = async (postId: number | string, commentId: number | string) => {
    if (!user?.id) {
      toast.error('Please login to like comments')
      return
    }

    const targetPost = posts.find(p => String(p.id) === String(postId))
    if (!targetPost) return
    
    const targetComment = targetPost.commentsList?.find(c => String(c.id) === String(commentId))
    if (!targetComment) return

    const userId = user.id
    const isCurrentlyLiked = targetComment.likedBy?.includes(userId) || false
    
    const updatedComment = {
      ...targetComment,
      likes: isCurrentlyLiked ? (targetComment.likes || 0) - 1 : (targetComment.likes || 0) + 1,
      likedBy: isCurrentlyLiked
        ? (targetComment.likedBy || []).filter(id => id !== userId)
        : [...(targetComment.likedBy || []), userId]
    }

    const updatedPost = {
      ...targetPost,
      commentsList: (targetPost.commentsList || []).map(c => 
        String(c.id) === String(commentId) ? updatedComment : c
      )
    }

    setPosts(prevPosts => 
      prevPosts.map(post => 
        String(post.id) === String(postId) ? updatedPost : post
      )
    )

    try {
      await api.post(`/api/community/comments/${commentId}/like`, { userId })
    } catch (error) {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          String(post.id) === String(postId) ? targetPost : post
        )
      )
      console.error('Failed to like comment:', error)
      toast.error('Failed to like comment')
    }
  }

  // Sort posts for display - but preserve original IDs
  const getSortedPosts = useCallback(() => {
    const sorted = [...posts]
    
    if (activeTab === 'latest') {
      // For latest, keep original order (newest first based on creation date)
      return sorted.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id)
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id)
        return dateB - dateA
      })
    }
    
    if (activeTab === 'top') {
      return sorted.sort((a, b) => b.likes - a.likes)
    }
    
    if (activeTab === 'trending') {
      return sorted.sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return a.pinned ? -1 : 1
        }
        return b.likes - a.likes
      })
    }
    
    return sorted
  }, [posts, activeTab])

  const visiblePosts = useMemo(() => {
    const sorted = getSortedPosts()
    let filtered = sorted
    
    if (selectedContributor) {
      filtered = filtered.filter((post) => post.author === selectedContributor)
    }
    
    if (selectedTag) {
      filtered = filtered.filter((post) => post.tag === selectedTag)
    }
    
    return filtered
  }, [getSortedPosts, selectedContributor, selectedTag])

  const displayFilterBanner = Boolean(selectedContributor || selectedTag)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading community posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Community Forum</h1>
          <p className="text-gray-500">Connect, share, and learn from fellow renters and landlords</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed - Left Column */}
          <div className="lg:col-span-2">
            {/* Create Post */}
            <Card className="p-4 mb-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 md:flex-row items-start">
                  <Avatar className="w-10 h-10">
                    {user?.profilePhoto ? (
                      <AvatarImage src={user.profilePhoto} />
                    ) : (
                      <AvatarFallback>U</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 flex flex-col gap-3 md:flex-row">
                    <textarea
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      rows={3}
                      placeholder="Share your experience or ask a question..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex flex-col gap-2 w-full md:w-[190px]">
                      <label className="text-sm font-medium text-gray-700 dark:text-white">Post Tag</label>
                      <select
                        value={selectedPostTag}
                        onChange={(e) => setSelectedPostTag(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-slate-800 dark:text-white dark:border-slate-600 focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a tag</option>
                        {postTags.map((tag) => (
                          <option key={tag} value={tag}>
                            {tag}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-500">Be respectful and keep the discussion community-friendly.</span>
                  <Button onClick={handleCreatePost} disabled={!newPostText.trim() || !selectedPostTag || isPosting}>
                    {isPosting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
                {shareStatus && (
                  <div className="text-sm text-green-600">{shareStatus}</div>
                )}
              </div>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b">
              {['trending', 'latest', 'top'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as 'trending' | 'latest' | 'top')}
                  className={`px-4 py-2 font-medium transition ${
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Posts */}
            {displayFilterBanner && (
              <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-blue-700">Filtered by {selectedContributor && selectedTag ? 'contributor & tag' : selectedContributor ? 'contributor' : 'tag'}</p>
                    <p className="font-semibold">
                      {selectedContributor && selectedTag && `Showing posts by ${selectedContributor} with tag "${selectedTag}"`}
                      {selectedContributor && !selectedTag && `Showing posts by ${selectedContributor}`}
                      {!selectedContributor && selectedTag && `Showing posts with tag "${selectedTag}"`}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSelectedContributor(null)
                      setSelectedTag(null)
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
                <p className="text-sm text-gray-600">Click another contributor in the sidebar to view their posts.</p>
              </div>
            )}
            <div className="space-y-4">
              {visiblePosts.length === 0 ? (
                <Card className="p-6 text-center text-gray-600">
                  {selectedContributor ? (
                    <>
                      <p className="font-semibold">No posts found for {selectedContributor}.</p>
                      <p className="text-sm mt-2">Click a top contributor to clear the filter and see all posts.</p>
                    </>
                  ) : (
                    <p className="font-semibold">No community posts available yet.</p>
                  )}
                </Card>
              ) : (
                visiblePosts.map((post) => (
                  <Card key={String(post.id)} className="p-6">
                    {post.pinned && (
                      <div className="flex items-center gap-1 text-orange-500 text-sm mb-2">
                        <Pin className="w-4 h-4" />
                        Pinned
                      </div>
                    )}

                    <div className="flex items-start gap-3 mb-3 justify-between">
                      <div className="flex items-center gap-3">
                        {post.avatar ? (
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={post.avatar} />
                            <AvatarFallback>{post.author[0]}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <Avatar className="w-10 h-10 bg-slate-100 text-slate-600">
                            <AvatarFallback>{post.author?.[0] ?? 'U'}</AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{post.author}</span>
                            <Badge variant="outline" className="text-xs">{post.tag}</Badge>
                          </div>
                          <span className="text-xs text-gray-500">{post.time}</span>
                        </div>
                      </div>

                      {post.authorId === (user?.id ?? '') && (
                        <div className="ml-auto">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 rounded-full hover:bg-gray-100">
                                <MoreVertical className="w-5 h-5 text-gray-600" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onSelect={() => handleStartEdit(post.id)}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit Post
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleDeletePost(post.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Post
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                    {editingPostId === post.id ? (
                      <div className="mb-4">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <Button variant="outline" size="sm" onClick={() => { setEditingPostId(null); setEditingText('') }}>Cancel</Button>
                          <Button size="sm" onClick={() => handleSaveEdit(post.id)}>Save</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-600 mb-4">{post.content}</p>
                    )}

                    <div className="flex items-center gap-4 pt-3 border-t flex-wrap">
                      <button
                        className={`flex items-center gap-1 transition ${
                          isLiking === String(post.id)
                            ? 'opacity-50 cursor-wait'
                            : post.likedBy?.includes(user?.id ?? '')
                              ? 'text-red-500'
                              : 'text-gray-500 hover:text-red-500'
                        }`}
                        onClick={() => handleLikePost(post.id)}
                        disabled={isLiking === String(post.id)}
                      >
                        <Heart className="w-5 h-5" />
                        <span className="text-sm">{post.likes}</span>
                      </button>
                      <button
                        className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition"
                        onClick={() => handleToggleComments(post.id)}
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-sm">{post.comments} comments</span>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-1 text-gray-500 hover:text-green-500 transition">
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm">Share</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onSelect={() => handleSharePost('facebook', post)}>
                            <Facebook className="w-4 h-4 mr-2" /> Facebook
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleSharePost('messenger', post)}>
                            <MessageCircle className="w-4 h-4 mr-2" /> Messenger
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleSharePost('whatsapp', post)}>
                            <Send className="w-4 h-4 mr-2" /> WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleSharePost('telegram', post)}>
                            <Send className="w-4 h-4 mr-2" /> Telegram
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleSharePost('clipboard', post)}>
                            Copy Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {activePostId === post.id && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        {(post.commentsList ?? []).length > 0 && (
                          <div className="space-y-3 mb-4">
                            {(post.commentsList ?? []).map((c) => (
                              <div key={String(c.id)} className="flex items-start gap-3">
                                {c.avatar ? (
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={c.avatar} />
                                    <AvatarFallback>{c.author[0]}</AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <Avatar className="w-8 h-8 bg-slate-100 text-slate-600">
                                    <AvatarFallback>{c.author?.[0] ?? 'U'}</AvatarFallback>
                                  </Avatar>
                                )}
                                <div className="bg-white p-3 rounded-lg flex-1 border border-gray-100">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">{c.author}</span>
                                    <span className="text-xs text-gray-500">{c.time}</span>
                                  </div>
                                  {editingCommentId === c.id ? (
                                    <div className="mt-2">
                                      <textarea
                                        value={editingCommentText}
                                        onChange={(e) => setEditingCommentText(e.target.value)}
                                        rows={2}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                                      />
                                      <div className="flex gap-2 mt-2">
                                        <Button size="sm" variant="outline" onClick={() => { setEditingCommentId(null); setEditingCommentText('') }}>Cancel</Button>
                                        <Button size="sm" onClick={() => handleSaveCommentEdit(post.id, c.id)}>Save</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm text-gray-700">{c.content}</p>
                                      <div className="flex items-center gap-3 mt-2">
                                        <button
                                          className={`flex items-center gap-1 text-xs transition ${
                                            (c.likedBy ?? []).includes(user?.id ?? '')
                                              ? 'text-red-500'
                                              : 'text-gray-500 hover:text-red-500'
                                          }`}
                                          onClick={() => handleLikeComment(post.id, c.id)}
                                        >
                                          <Heart className="w-3 h-3" />
                                          <span>{c.likes ?? 0}</span>
                                        </button>
                                        {(c.authorId === (user?.id ?? '') || post.authorId === (user?.id ?? '')) && (
                                          <>
                                            <button
                                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 transition"
                                              onClick={() => handleStartEditComment(c.id, c.content)}
                                            >
                                              <Edit2 className="w-3 h-3" />
                                              Edit
                                            </button>
                                            <button
                                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition"
                                              onClick={() => handleDeleteComment(post.id, c.id)}
                                            >
                                              <Trash2 className="w-3 h-3" />
                                              Delete
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <textarea
                          value={commentTextByPost[String(post.id)] ?? ''}
                          onChange={(e) => handleCommentChange(post.id, e.target.value)}
                          rows={3}
                          placeholder="Write a comment..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        <div className="flex items-center justify-between mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActivePostId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmitComment(post.id)}
                          >
                            Post Comment
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                )))
              }
            </div>

            {/* Load More removed per request */}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-lg">Trending Topics</h3>
              </div>
              <div className="space-y-3">
                {computedTrendingTopics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedTag(selectedTag === topic.name ? null : topic.name)}
                    className={`w-full flex justify-between items-center p-3 rounded-lg transition border ${
                      selectedTag === topic.name
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{topic.name}</p>
                      <p className="text-xs text-gray-500">{topic.posts} posts</p>
                    </div>
                    <Badge variant="secondary" className="text-green-600">
                      {topic.trend}
                    </Badge>
                  </button>
                ))}
              </div>
            </Card>

            {/* Top Contributors */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-lg">Top Contributors</h3>
              </div>
              <div className="space-y-3">
                {computedTopContributors.map((contributor, index) => {
                  const active = selectedContributor === contributor.name
                  return (
                    <button
                      key={contributor.authorId ?? contributor.name}
                      type="button"
                      onClick={() => setSelectedContributor((current) => current === contributor.name ? null : contributor.name)}
                      className={`w-full flex items-center justify-between rounded-lg px-3 py-2 transition border ${active ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-2 text-left">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                          {index + 1}
                        </div>
                        <span className="font-medium text-sm">{contributor.name}</span>
                      </div>
                      <div className="text-sm text-gray-500">{contributor.likes} likes</div>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* Upcoming Events */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-lg">Upcoming Events</h3>
                </div>
                <button
                  onClick={() => {
                    setEditingEventId(null)
                    setEventFormData({ title: '', description: '', date: '', time: '', location: '' })
                    setShowCreateEventModal(true)
                  }}
                  className="p-2 rounded-lg hover:bg-purple-100 transition"
                  title="Create event"
                >
                  <Plus className="w-5 h-5 text-purple-500" />
                </button>
              </div>
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No upcoming events. Be the first to create one!</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-gray-500">{event.location}</p>
                        </div>
                        {event.organizerId === user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="p-1 rounded hover:bg-gray-100 transition"
                                title="Event actions"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => openEventModal(event)}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit Event
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleDeleteEvent(event.id)}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Event
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Community Stats */}
            <Card className="p-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <button
                type="button"
                onClick={() => setShowMemberDetails((current) => !current)}
                className="w-full text-left"
              >
                <Users className="w-12 h-12 mx-auto mb-3" />
                <div className="text-3xl font-bold mb-1">{computedMemberCount.toLocaleString()}</div>
                <p className="text-sm opacity-90">Community Members</p>
                <div className="mt-4 text-sm opacity-90">
                  <p>{showMemberDetails ? 'Hide member insights' : 'Tap for member insights'}</p>
                </div>
              </button>
            </Card>
            {showMemberDetails && (
              <Card className="p-4 bg-white border border-gray-200">
                <div className="space-y-3 text-sm text-gray-800">
                  <div className="flex justify-between">
                    <span>New members this week</span>
                    <span className="font-semibold text-gray-900">{memberStats.newThisWeek}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active discussions</span>
                    <span className="font-semibold text-gray-900">{memberStats.activeDiscussions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Popular tag</span>
                    <span className="font-semibold text-gray-900">{memberStats.popularTag}</span>
                  </div>
                  <div className="text-xs text-gray-500">Click the card again to collapse these details.</div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Create Event Modal */}
        {showCreateEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingEventId ? 'Edit Event' : 'Create Event'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateEventModal(false)
                    setEditingEventId(null)
                  }}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Event Title *</label>
                  <input
                    type="text"
                    value={eventFormData.title}
                    onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                    placeholder="e.g., Roommate Meetup"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={eventFormData.description}
                    onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                    placeholder="Event details..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date *</label>
                    <input
                      type="date"
                      value={eventFormData.date}
                      onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Time *</label>
                    <input
                      type="time"
                      value={eventFormData.time}
                      onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location *</label>
                  <input
                    type="text"
                    value={eventFormData.location}
                    onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                    placeholder="e.g., Dhanmondi, Dhaka"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateEventModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEvent}
                    disabled={isCreatingEvent}
                    className="flex-1"
                  >
                    {isCreatingEvent ? 'Saving...' : editingEventId ? 'Save Changes' : 'Create Event'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default Community