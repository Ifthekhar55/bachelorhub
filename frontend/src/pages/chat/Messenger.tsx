import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Send, MoreVertical, Smile, Paperclip, Image, Mic, Check, CheckCheck, MessageCircle, Copy, Trash2, ExternalLink, Download, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { useSocket } from '../../contexts/SocketContext'
import { useAuthStore } from '../../store/authStore'
import api from '../../services/api'
import { toast } from 'react-hot-toast'

interface Conversation {
  id: string
  name: string
  phone: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
  avatar: string
}

interface ChatMessage {
  id: string
  clientId?: string
  sender: 'me' | 'them'
  senderId?: string
  content: string
  time: string
  status: 'sent' | 'read'
  type?: 'text' | 'image' | 'file' | 'audio'
  url?: string
  filename?: string
}

const initialConversations: Conversation[] = []

const initialMessages: Record<string, ChatMessage[]> = {}
const SELECTED_CHAT_KEY = 'messenger_selected_chat_v1'
const ATTACHMENT_CACHE_KEY = 'messenger_attachment_urls_v2'
const NICKNAMES_STORAGE_KEY = 'messenger_nicknames_v1'
const DELETED_CONVERSATIONS_STORAGE_KEY = 'messenger_deleted_conversations_v1'

const emojiOptions = ['😀', '😂', '😍', '👍', '🎉', '❤️', '😢', '🤔', '🙌']

const PLACEHOLDER_USER_ID = 'me'

const getStoredNicknames = (): Record<string, string> => {
  if (typeof window === 'undefined') return {}
  try {
    const stored = window.localStorage.getItem(NICKNAMES_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.warn('Failed to parse stored nicknames', error)
    return {}
  }
}

// Convert ISO timestamp or time string to formatted local time
const formatMessageTime = (time: string): string => {
  // If it's an ISO string (contains 'T'), parse and convert to local time
  if (time.includes('T')) {
    try {
      return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (error) {
      console.warn('Failed to parse time:', time, error)
      return time
    }
  }
  // Otherwise return as-is (already formatted local time string)
  return time
}

const saveStoredNicknames = (nicknames: Record<string, string>) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(NICKNAMES_STORAGE_KEY, JSON.stringify(nicknames))
  } catch (error) {
    console.warn('Failed to save messenger nicknames', error)
  }
}

const getDeletedConversations = (): string[] => {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(DELETED_CONVERSATIONS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.warn('Failed to read deleted messenger conversations', error)
    return []
  }
}

const saveDeletedConversations = (deletedIds: string[]) => {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(DELETED_CONVERSATIONS_STORAGE_KEY, JSON.stringify(deletedIds))
  } catch (error) {
    console.warn('Failed to save deleted messenger conversations', error)
  }
}

const getConversationRoomId = (userId: string | null | undefined, otherUserId: string) => {
  if (!otherUserId) return userId ?? PLACEHOLDER_USER_ID
  return [userId ?? PLACEHOLDER_USER_ID, otherUserId].sort().join('_')
}

const getOtherUserIdFromRoom = (roomId: string, userId?: string) => {
  if (!userId) return roomId
  const ids = roomId.split('_')
  return ids.find((id) => id !== userId) || roomId
}

const Messenger = () => {
  const socket = useSocket()
  const location = useLocation()
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedChatId, setSelectedChatId] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(SELECTED_CHAT_KEY) ?? ''
  })
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(initialMessages)
  const contactChatId = (location.state as { contactChatId?: string | number } | null)?.contactChatId
  const [message, setMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<{ url: string; filename?: string } | null>(null)
  const [actionMenuMessageId, setActionMenuMessageId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [showChatOnMobile, setShowChatOnMobile] = useState(false)
  const [editingText, setEditingText] = useState('')
  const [showEditNicknameDialog, setShowEditNicknameDialog] = useState(false)
  const [nicknameDraft, setNicknameDraft] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const actualSelectedChatId = conversations.some((conv) => conv.id === selectedChatId)
    ? selectedChatId
    : conversations[0]?.id ?? ''
  const selectedChat = conversations.find((conv) => conv.id === actualSelectedChatId) ?? conversations[0]
  const selectedChatRoom = getConversationRoomId(user?.id, actualSelectedChatId)
  const currentMessages = messages[selectedChatRoom] ?? []

  useEffect(() => {
    if (!user?.id) return

    setMessages((prev) => {
      const migrated: Record<string, ChatMessage[]> = {}
      let changed = false

      Object.entries(prev).forEach(([roomId, msgs]) => {
        const parts = roomId.split('_')
        const hasPlaceholder = parts.includes(PLACEHOLDER_USER_ID)
        if (!hasPlaceholder) {
          migrated[roomId] = msgs
          return
        }

        const otherUserId = parts.find((id) => id !== PLACEHOLDER_USER_ID) ?? ''
        const actualRoom = getConversationRoomId(user.id, otherUserId)
        if (actualRoom === roomId) {
          migrated[roomId] = msgs
        } else {
          migrated[actualRoom] = msgs
          changed = true
        }
      })

      return changed ? migrated : prev
    })
  }, [user?.id])

  // Remove stale local caching keys and rely on the database-backed history instead
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem('messenger_messages_v1')
      window.localStorage.removeItem('messenger_deleted_v1')
      window.localStorage.removeItem('messenger_deleted_sigs_v1')
      window.localStorage.removeItem('messenger_attachments_v1')
    } catch (error) {
      console.warn('Could not clear legacy messenger storage', error)
    }
  }, [])

  const isMyMessage = (msg: ChatMessage) => {
    if (msg.senderId) {
      return msg.senderId === user?.id
    }
    return msg.sender === 'me'
  }

  const normalizeHistoryMessage = (message: ChatMessage): ChatMessage => {
    if (message.senderId) return message

    if (message.sender === 'me') {
      return {
        ...message,
        senderId: user?.id ?? 'me',
      }
    }

    return {
      ...message,
      sender: 'them',
      senderId: selectedChatId || 'them',
    }
  }

  const normalizeIncomingMessage = (message: ChatMessage): ChatMessage => {
    if (message.senderId) return message

    return {
      ...message,
      sender: 'them',
      senderId: selectedChatId || 'them',
    }
  }

  const generateClientMessageId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `client-${crypto.randomUUID()}`
    }
    return `client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  const makeAttachmentCacheKey = (roomId: string, filename: string, type: string) => `${roomId}::${type}::${filename}`

  const getAttachmentCache = (): Record<string, string> => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = window.localStorage.getItem(ATTACHMENT_CACHE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (error) {
      console.warn('Failed to parse attachment cache', error)
      return {}
    }
  }

  const saveAttachmentCache = (cache: Record<string, string>) => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(ATTACHMENT_CACHE_KEY, JSON.stringify(cache))
    } catch (error) {
      console.warn('Failed to save attachment cache', error)
    }
  }

  const persistAttachmentUrl = (roomId: string, filename: string, type: string, url: string) => {
    if (!filename || !type || !url) return
    const cache = getAttachmentCache()
    cache[makeAttachmentCacheKey(roomId, filename, type)] = url
    saveAttachmentCache(cache)
  }

  const findAttachmentUrl = (roomId: string, filename?: string, type?: string) => {
    if (!filename || !type) return undefined
    const roomMsgs = messages[roomId] ?? []
    for (let i = roomMsgs.length - 1; i >= 0; i--) {
      const m = roomMsgs[i]
      if (m.filename === filename && m.type === type && m.url) return m.url
    }

    const cache = getAttachmentCache()
    return cache[makeAttachmentCacheKey(roomId, filename, type)]
  }

  const upsertMessage = (conversationId: string, incomingMessage: ChatMessage) => {
    setMessages((prev) => {
      const roomMsgs = prev[conversationId] ?? []
      const existingIndex = roomMsgs.findIndex(
        (msg) =>
          msg.id === incomingMessage.id ||
          (incomingMessage.clientId && msg.clientId === incomingMessage.clientId)
      )

      if (existingIndex >= 0) {
        const nextRoom = [...roomMsgs]
        nextRoom[existingIndex] = { ...nextRoom[existingIndex], ...incomingMessage }
        return { ...prev, [conversationId]: nextRoom }
      }

      return { ...prev, [conversationId]: [...roomMsgs, incomingMessage] }
    })
  }

  const handleEditMessage = (message: ChatMessage) => {
    setEditingMessageId(message.id)
    setEditingText(message.content)
    setActionMenuMessageId(null)
  }

  const cancelEditMessage = () => {
    setEditingMessageId(null)
    setEditingText('')
  }

  const saveEditedMessage = async () => {
    if (!selectedChatRoom || !editingMessageId || !editingText.trim()) return

    const messageToUpdate = (messages[selectedChatRoom] ?? []).find((msg) => msg.id === editingMessageId)
    if (!messageToUpdate) {
      cancelEditMessage()
      return
    }

    const updatedMessage: ChatMessage = {
      ...messageToUpdate,
      content: editingText.trim(),
    }

    upsertMessage(selectedChatRoom, updatedMessage)

    if (socket && !editingMessageId.startsWith('client-')) {
      socket.emit('update_message', {
        conversationId: selectedChatRoom,
        messageId: editingMessageId,
        content: editingText.trim(),
      })
    }

    cancelEditMessage()
  }

  const handleMessageSaved = (payload: { conversationId: string; message: ChatMessage }) => {
    if (payload.conversationId !== selectedChatRoom) return
    const normalized = normalizeIncomingMessage(payload.message)
    if (normalized.url && normalized.filename && normalized.type) {
      persistAttachmentUrl(payload.conversationId, normalized.filename, normalized.type, normalized.url)
    }
    upsertMessage(payload.conversationId, normalized)
  }

  const handleMessageUpdated = (payload: { conversationId: string; message: ChatMessage }) => {
    if (payload.conversationId !== selectedChatRoom) return
    upsertMessage(payload.conversationId, normalizeIncomingMessage(payload.message))
  }

  const handleMessageDeleted = (payload: { conversationId: string; messageId: string }) => {
    if (payload.conversationId !== selectedChatRoom) return
    setMessages((prev) => {
      const roomMsgs = prev[payload.conversationId] ?? []
      return {
        ...prev,
        [payload.conversationId]: roomMsgs.filter((msg) => msg.id !== payload.messageId && msg.clientId !== payload.messageId),
      }
    })
  }

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to read file as data URL'))
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })
  }

  // Handle contact restoration when clicking "Contact Landlord" on a deleted conversation
  useEffect(() => {
    if (!contactChatId || typeof window === 'undefined') return
    
    const chatId = String(contactChatId)
    const deletedConversationIds = getDeletedConversations()
    
    // If this conversation was deleted, restore it
    if (deletedConversationIds.includes(chatId)) {
      // Remove from deleted list
      const updatedDeletedIds = deletedConversationIds.filter((id) => id !== chatId)
      saveDeletedConversations(updatedDeletedIds)
      
      // Clear old messages for this conversation
      setMessages((prev) => {
        const nextMessages = { ...prev }
        const roomId = getConversationRoomId(user?.id, chatId)
        delete nextMessages[roomId]
        return nextMessages
      })
      
      // Clear nickname for this conversation
      const storedNicknames = getStoredNicknames()
      if (storedNicknames[chatId]) {
        delete storedNicknames[chatId]
        saveStoredNicknames(storedNicknames)
      }
    }
  }, [contactChatId, user?.id])

  useEffect(() => {
    if (!user?.id) return

    const fetchUsers = async () => {
      try {
        const response = await api.get('/api/users/all')
        const users: Array<{ id: string; name: string; phone: string; profilePhoto?: string; email: string }> = response.data.users
        const deletedConversationIds = getDeletedConversations()
        const filteredUsers = users.filter((contact) => contact.id !== user.id && !deletedConversationIds.includes(contact.id))
        const storedNicknames = getStoredNicknames()
        const newConversations = filteredUsers.map((contact) => ({
          id: contact.id,
          name: storedNicknames[contact.id] || contact.name,
          phone: contact.phone,
          lastMessage: 'Start a conversation',
          time: '',
          unread: 0,
          online: Math.random() > 0.3,
          avatar: contact.profilePhoto || '',
        }))

        setConversations(newConversations)

        const hasSavedSelection = selectedChatId && newConversations.some((conv) => conv.id === selectedChatId)
        const fallbackSelection = newConversations[0]?.id ?? ''
        if (!hasSavedSelection && fallbackSelection) {
          setSelectedChatId(fallbackSelection)
        }
      } catch (error) {
        console.error('Failed to fetch users for messenger', error)
      }
    }

    fetchUsers()
  }, [user?.id, contactChatId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (selectedChatId) {
      window.localStorage.setItem(SELECTED_CHAT_KEY, selectedChatId)
    }
  }, [selectedChatId])

  useEffect(() => {
    if (!contactChatId) return
    const chatId = String(contactChatId)
    const match = conversations.find((conv) => conv.id === chatId)
    if (match) {
      setSelectedChatId(match.id)
    }
  }, [contactChatId, conversations])

  useEffect(() => {
    if (!selectedChatId || !user?.id) return

    const loadHistory = async () => {
      try {
        const response = await api.get('/api/chat/history', {
          params: { conversationId: selectedChatRoom },
        })
        const fetchedMessages = (response.data.messages as ChatMessage[]).map(normalizeHistoryMessage)
        const hydratedMessages = fetchedMessages.map((msg) => {
          if (msg.type && msg.filename && !msg.url) {
            const cachedUrl = findAttachmentUrl(selectedChatRoom, msg.filename, msg.type)
            if (cachedUrl) {
              return { ...msg, url: cachedUrl }
            }
          }
          return msg
        })

        hydratedMessages.forEach((msg) => {
          if (msg.type && msg.filename && msg.url) {
            persistAttachmentUrl(selectedChatRoom, msg.filename, msg.type, msg.url)
          }
        })

        setMessages((prev) => ({
          ...prev,
          [selectedChatRoom]: hydratedMessages,
        }))
      } catch (error) {
        console.error('Failed to load chat history via API:', error)
      }
    }

    loadHistory()
  }, [selectedChatRoom, selectedChatId, user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages, selectedChatId])

  useEffect(() => {
    if (!socket || !selectedChatId) return

    const handleHistory = (payload: { conversationId: string; messages: ChatMessage[] }) => {
      if (payload.conversationId !== selectedChatRoom) return
      setMessages((prev) => {
        const existing = prev[payload.conversationId] ?? []
        const incoming = payload.messages.map(normalizeHistoryMessage)

        const existingMap = new Map<string, ChatMessage>()
        existing.forEach((m) => {
          if (m.clientId) {
            existingMap.set(m.clientId, m)
          }
          existingMap.set(m.id, m)
        })

        const merged = incoming.map((m) => {
          const ex = m.clientId ? existingMap.get(m.clientId) : existingMap.get(m.id)
          if (ex && ex.url) {
            return { ...m, url: ex.url, filename: ex.filename ?? m.filename, clientId: ex.clientId }
          }
          return m
        })

        const localExtras = existing.filter(
          (e) =>
            !merged.some((m) => m.id === e.id || (e.clientId && m.clientId === e.clientId))
        )

        return {
          ...prev,
          [payload.conversationId]: [...merged, ...localExtras],
        }
      })
    }

    const handleReceive = (payload: { conversationId: string; message: ChatMessage }) => {
      if (payload.conversationId !== selectedChatRoom) return
      const normalized = normalizeIncomingMessage(payload.message)
      if (normalized.url && normalized.filename && normalized.type) {
        persistAttachmentUrl(payload.conversationId, normalized.filename, normalized.type, normalized.url)
      }
      upsertMessage(payload.conversationId, normalized)
    }

    socket.on('conversation_history', handleHistory)
    socket.on('receive_message', handleReceive)
    socket.on('message_saved', handleMessageSaved)
    socket.on('message_updated', handleMessageUpdated)
    socket.on('message_deleted', handleMessageDeleted)

    const requestHistory = () => {
      socket.emit('join_conversation', selectedChatRoom)
      socket.emit('get_history', selectedChatRoom)
    }

    if (socket.connected) {
      requestHistory()
    } else {
      socket.once('connect', requestHistory)
    }

    return () => {
      socket.off('conversation_history', handleHistory)
      socket.off('receive_message', handleReceive)
      socket.off('message_saved', handleMessageSaved)
      socket.off('message_updated', handleMessageUpdated)
      socket.off('message_deleted', handleMessageDeleted)
    }
  }, [socket, selectedChatId, selectedChatRoom])

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const updateConversation = (id: string, update: Partial<Conversation>) => {
    setConversations((prev) => {
      const nextConversations = prev.map((conv) => (conv.id === id ? { ...conv, ...update } : conv))

      if (update.name !== undefined) {
        const storedNicknames = getStoredNicknames()
        storedNicknames[id] = update.name
        saveStoredNicknames(storedNicknames)
      }

      return nextConversations
    })
  }

  const handleSelectChat = (conv: Conversation) => {
    setSelectedChatId(conv.id)
    setShowChatOnMobile(true)
    updateConversation(conv.id, { unread: 0 })

    const markMessagesAsRead = async () => {
      try {
        console.log('Marking chat conversation as read...')
        const response = await api.patch(`/api/chat/conversations/${getConversationRoomId(user?.id, conv.id)}/mark-as-read`)
        console.log('Mark as read response:', response.data)
        window.dispatchEvent(new Event('messages-read'))
        console.log('Dispatched messages-read event')
      } catch (error) {
        console.error('Failed to mark chat conversation as read:', error)
      }
    }
    markMessagesAsRead()
  }

  const openEditNicknameDialog = () => {
    if (!selectedChat) return
    setNicknameDraft(selectedChat.name)
    setShowEditNicknameDialog(true)
  }

  const handleSaveNickname = () => {
    if (!selectedChat) return

    const trimmedName = nicknameDraft.trim()
    updateConversation(selectedChat.id, {
      name: trimmedName || selectedChat.phone || 'Conversation',
    })
    setShowEditNicknameDialog(false)
    setNicknameDraft('')
    toast.success('Nickname updated')
  }

  const handleDeleteConversation = () => {
    if (!selectedChat) return

    const nextConversations = conversations.filter((conv) => conv.id !== selectedChat.id)
    const nextSelectedChatId = nextConversations[0]?.id ?? ''
    const storedNicknames = getStoredNicknames()
    const deletedConversationIds = getDeletedConversations()
    if (!deletedConversationIds.includes(selectedChat.id)) {
      deletedConversationIds.push(selectedChat.id)
      saveDeletedConversations(deletedConversationIds)
    }
    delete storedNicknames[selectedChat.id]
    saveStoredNicknames(storedNicknames)

    setConversations(nextConversations)
    setSelectedChatId(nextSelectedChatId)
    setMessages((prev) => {
      const nextMessages = { ...prev }
      delete nextMessages[selectedChatRoom]
      return nextMessages
    })
    setShowChatOnMobile(false)
    toast.success('Conversation deleted')
  }

  const addEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji)
    setShowEmojiPicker(false)
  }

  useEffect(() => {
    if (!selectedChatId || !user?.id) return

    const markChatAsRead = async () => {
      try {
        const response = await api.patch(`/api/chat/conversations/${selectedChatRoom}/mark-as-read`)
        console.log('Auto-marked chat as read:', response.data)
        window.dispatchEvent(new Event('messages-read'))
      } catch (error) {
        console.error('Failed to auto-mark chat as read:', error)
      }
    }

    markChatAsRead()
  }, [selectedChatId, selectedChatRoom, user?.id])

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const openImagePicker = () => {
    imageInputRef.current?.click()
  }

  const sendAttachment = (attachment: { type: 'image' | 'file' | 'audio'; url: string; filename: string }) => {
    if (!selectedChat) return

    const now = new Date()
    const content =
      attachment.type === 'image'
        ? attachment.filename
        : attachment.type === 'audio'
          ? 'Voice message'
          : `Sent file: ${attachment.filename}`

    const clientId = generateClientMessageId()
    const newMessage: ChatMessage = {
      id: clientId,
      clientId,
      sender: 'me',
      senderId: user?.id ?? 'me',
      content,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      type: attachment.type,
      url: attachment.url,
      filename: attachment.filename,
    }

    upsertMessage(selectedChatRoom, newMessage)
    persistAttachmentUrl(selectedChatRoom, attachment.filename, attachment.type, attachment.url)

    updateConversation(selectedChatId, {
      lastMessage: newMessage.content,
      time: 'Now',
    })

    if (socket) {
      socket.emit('send_message', {
        conversationId: selectedChatRoom,
        message: newMessage,
      })
    }
  }

  const openImagePreview = (url: string, filename?: string) => {
    setPreviewImage({ url, filename })
  }

  const closeImagePreview = () => {
    setPreviewImage(null)
  }

  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to convert blob to data URL'))
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  }

  const downloadPreviewImage = () => {
    if (!previewImage?.url || typeof document === 'undefined') return
    const anchor = document.createElement('a')
    anchor.href = previewImage.url
    anchor.download = previewImage.filename ?? 'image'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  const copyMessageText = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content)
      toast.success('Message copied')
    } catch (error) {
      toast.error('Could not copy message')
    }
  }

  const deleteMessage = (messageId: string, deleteForBoth = false) => {
    if (!selectedChatRoom) return

    setMessages((prev) => {
      const roomMsgs = prev[selectedChatRoom] ?? []
      return {
        ...prev,
        [selectedChatRoom]: roomMsgs.filter((msg) => msg.id !== messageId && msg.clientId !== messageId),
      }
    })

    setActionMenuMessageId(null)

    if (deleteForBoth && socket && !messageId.startsWith('client-')) {
      socket.emit('delete_message', {
        conversationId: selectedChatRoom,
        messageId,
      })
    }
  }

  const sendAudioAttachment = async (audioBlob: Blob) => {
    if (!selectedChat) return

    const url = await blobToDataUrl(audioBlob)
    const filename = `voice-message-${Date.now()}.webm`
    sendAttachment({ type: 'audio', url, filename })
  }

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Voice recording is not supported in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recordedChunksRef.current = []
      const recorder = new MediaRecorder(stream)

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())

        const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        if (audioBlob.size > 0) {
          sendAudioAttachment(audioBlob)
        }
        setIsRecording(false)
        mediaRecorderRef.current = null
      }

      recorder.onerror = (event) => {
        console.error('Recording error:', event)
        setRecordingError('Recording failed. Please try again.')
        setIsRecording(false)
        mediaRecorderRef.current = null
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setRecordingError(null)
    } catch (error) {
      console.error('Failed to start recording:', error)
      setRecordingError('Could not access microphone.')
      toast.error('Could not access microphone.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    } else {
      setIsRecording(false)
    }
  }

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const form = new FormData()
      form.append('profilePhoto', file)
      const resp = await api.post('/api/chat/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = resp.data?.url
      if (url) {
        sendAttachment({ type: 'file', url, filename: file.name })
      } else {
        const dataUrl = await fileToDataUrl(file)
        sendAttachment({ type: 'file', url: dataUrl, filename: file.name })
      }
    } catch (error) {
      console.warn('File upload failed, sending as data URL', error)
      const dataUrl = await fileToDataUrl(file)
      sendAttachment({ type: 'file', url: dataUrl, filename: file.name })
    }
    event.target.value = ''
  }

  const handleImageSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const form = new FormData()
      form.append('profilePhoto', file)
      const resp = await api.post('/api/chat/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = resp.data?.url
      if (url) {
        sendAttachment({ type: 'image', url, filename: file.name })
      } else {
        const dataUrl = await fileToDataUrl(file)
        sendAttachment({ type: 'image', url: dataUrl, filename: file.name })
      }
    } catch (error) {
      console.warn('Image upload failed, sending as data URL', error)
      const dataUrl = await fileToDataUrl(file)
      sendAttachment({ type: 'image', url: dataUrl, filename: file.name })
    }
    event.target.value = ''
  }

  const sendMessage = () => {
    if (!message.trim() || !selectedChat) return

    const now = new Date()
    const clientId = generateClientMessageId()
    const newMessage: ChatMessage = {
      id: clientId,
      clientId,
      sender: 'me',
      senderId: user?.id ?? 'me',
      content: message.trim(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      type: 'text',
    }

    upsertMessage(selectedChatRoom, newMessage)

    updateConversation(selectedChatId, {
      lastMessage: newMessage.content,
      time: 'Now',
    })

    if (socket) {
      socket.emit('send_message', {
        conversationId: selectedChatRoom,
        message: newMessage,
      })
    }

    setMessage('')
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-100">
      <div className="mx-auto h-full w-full max-w-7xl px-0 md:px-4">
        <div className="flex h-full bg-white rounded-none md:rounded-lg shadow-lg overflow-hidden">
          {/* Conversations Sidebar */}
          <div className={`flex flex-col ${showChatOnMobile ? 'hidden' : 'flex'} md:flex w-full md:w-80 border-b md:border-b-0 md:border-r`}>
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectChat(conv)}
                  className={`w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition ${
                    selectedChatId === conv.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      {conv.avatar ? (
                        <AvatarImage src={conv.avatar} />
                      ) : null}
                      <AvatarFallback>{conv.name[0]}</AvatarFallback>
                    </Avatar>
                    {conv.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{conv.name}</span>
                      <span className="text-xs text-gray-500">{conv.time}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">{conv.unread}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          {selectedChat ? (
            <div className={`flex-1 flex flex-col ${showChatOnMobile ? 'block' : 'hidden md:flex'}`}>
              {/* Chat Header */}
              <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="md:hidden p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                    onClick={() => setShowChatOnMobile(false)}
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <Avatar className="w-10 h-10">
                    {selectedChat.avatar ? (
                      <AvatarImage src={selectedChat.avatar} />
                    ) : null}
                    <AvatarFallback>{selectedChat.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedChat.name}</h3>
                    <p className="text-xs text-green-500">
                      {selectedChat.online ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Conversation actions"
                        type="button"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8} className="w-48">
                      <DropdownMenuItem onSelect={openEditNicknameDialog} className="cursor-pointer">
                        Edit Nickname
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={handleDeleteConversation}
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        Delete conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <Dialog open={showEditNicknameDialog} onOpenChange={setShowEditNicknameDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Nickname</DialogTitle>
                    <DialogDescription>Choose a friendly name for this conversation.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <input
                      value={nicknameDraft}
                      onChange={(e) => setNicknameDraft(e.target.value)}
                      placeholder="Enter nickname"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowEditNicknameDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveNickname}>
                        Save
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentMessages.map((msg, index) => {
                  const isMine = isMyMessage(msg)
                  return (
                    <div
                      key={`${msg.id}-${msg.time}-${index}`}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="relative max-w-[70%]"
                        onClick={() => setActionMenuMessageId((current) => (current === msg.id ? null : msg.id))}
                      >
                        {actionMenuMessageId === msg.id ? (
                          <div className={`absolute top-1/2 -translate-y-1/2 w-44 rounded-lg border bg-white shadow-lg text-sm text-gray-900 z-10 ${isMine ? 'right-full mr-2' : 'left-full ml-2'}`}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation()
                                copyMessageText(msg)
                                setActionMenuMessageId(null)
                              }}
                            >Copy</button>
                            {isMine ? (
                              <>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditMessage(msg)
                                  }}
                                >Edit</button>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteMessage(msg.id)
                                    setActionMenuMessageId(null)
                                  }}
                                >Delete for me</button>
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteMessage(msg.id, true)
                                    setActionMenuMessageId(null)
                                  }}
                                >Delete for both</button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteMessage(msg.id)
                                  setActionMenuMessageId(null)
                                }}
                              >Delete for me</button>
                            )}
                          </div>
                        ) : null}
                        <div
                          className={`rounded-lg p-3 ${
                            isMine
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                        {editingMessageId === msg.id ? (
                          <div className="mb-2">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full p-2 rounded-md border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="mt-2 flex gap-2 justify-end">
                              <button
                                type="button"
                                className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                                onClick={cancelEditMessage}
                              >Cancel</button>
                              <button
                                type="button"
                                className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white"
                                onClick={saveEditedMessage}
                              >Save</button>
                            </div>
                          </div>
                        ) : null}
                        {msg.type === 'image' ? (
                          (() => {
                            const displayUrl = msg.url ?? findAttachmentUrl(selectedChatRoom, msg.filename, 'image')
                            if (!displayUrl) return null
                            return (
                              <img
                                src={displayUrl}
                                alt={msg.filename}
                                className="rounded-lg w-48 max-h-48 mb-2 object-cover cursor-pointer transition-transform duration-150 hover:scale-[1.02]"
                                onClick={() => openImagePreview(displayUrl, msg.filename)}
                              />
                            )
                          })()
                        ) : null}
                        {msg.type === 'file' && msg.filename ? (
                          (() => {
                            const displayUrl = msg.url ?? findAttachmentUrl(selectedChatRoom, msg.filename, 'file')
                            if (!displayUrl) return (
                              <div className="flex items-center gap-2 p-3 bg-white rounded-lg text-sm text-gray-500">{msg.filename}</div>
                            )
                            return (
                              <a
                                href={displayUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 p-3 bg-white rounded-lg text-sm text-blue-700 hover:bg-blue-50"
                              >
                                <Paperclip className="w-4 h-4" />
                                <span>{msg.filename}</span>
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )
                          })()
                        ) : null}
                        {msg.type === 'audio' ? (
                          (() => {
                            const displayUrl = msg.url ?? findAttachmentUrl(selectedChatRoom, msg.filename, 'audio')
                            if (!displayUrl) return null
                            return <audio controls src={displayUrl} className="w-full rounded-lg mt-2" />
                          })()
                        ) : null}
                        <p className="text-sm">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          isMine ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          <span>{formatMessageTime(msg.time)}</span>
                          {isMine && (
                            msg.status === 'read' ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                })}
                <div ref={messagesEndRef} />
                <Dialog open={!!previewImage} onOpenChange={(open) => { if (!open) closeImagePreview() }}>
                  <DialogContent className="max-w-5xl p-0 bg-transparent shadow-none">
                    <div className="relative rounded-2xl overflow-hidden bg-black p-4">
                      <DialogHeader>
                        <DialogTitle className="text-white">{previewImage?.filename ?? 'Image preview'}</DialogTitle>
                        <DialogDescription className="text-sm text-slate-300">Click outside or press ESC to close.</DialogDescription>
                      </DialogHeader>
                      {previewImage?.url ? (
                        <img
                          src={previewImage.url}
                          alt={previewImage.filename ?? 'Preview'}
                          className="w-full max-h-[75vh] object-contain rounded-xl"
                        />
                      ) : null}
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={closeImagePreview}
                          className="bg-white/10 text-white border-white/20"
                        >
                          Close
                        </Button>
                        {previewImage?.url ? (
                          <a
                            href={previewImage.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                          >
                            Open full size
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : null}
                        {previewImage?.url ? (
                          <a
                            href={previewImage.url}
                            download={previewImage.filename ?? 'image'}
                            className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                          >
                            Download
                            <Download className="w-4 h-4" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelected}
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelected}
                  />

                  <Button variant="ghost" size="icon" onClick={() => setShowEmojiPicker((prev) => !prev)}>
                    <Smile className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={openFilePicker}>
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={openImagePicker}>
                    <Image className="w-5 h-5" />
                  </Button>
                </div>
                {showEmojiPicker && (
                  <div className="grid grid-cols-9 gap-2 p-3 bg-white border border-gray-200 rounded-md shadow-sm mt-2">
                    {emojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="text-lg"
                        onClick={() => addEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                {recordingError ? (
                  <div className="text-sm text-red-600 mb-2">{recordingError}</div>
                ) : null}
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant={isRecording ? 'destructive' : 'ghost'}
                    size="icon"
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={isRecording ? 'Recording voice message...' : 'Type a message...'}
                    disabled={isRecording}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                  <Button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700" disabled={isRecording}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {isRecording && (
                  <p className="text-sm text-red-600 mt-2">Recording... Tap the mic button again to stop.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Messenger