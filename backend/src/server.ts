import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth.routes';
import listingRoutes from './routes/listing.routes';
import usedItemRoutes from './routes/usedItem.routes';
import communityRoutes from './routes/community.routes';
import chatRoutes from './routes/chat.routes';
import userRoutes from './routes/user.routes';
import bookingRoutes from './routes/booking.routes';
import eventRoutes from './routes/event.routes';
import supportRoutes from './routes/support.routes';
import bloodRoutes from './routes/blood.routes';
import { authenticate } from './middleware/auth.middleware';
import { setSocketServer } from './socket';

export const prisma = new PrismaClient();

function getDatabaseInfo() {
  const dbUrl = process.env.DATABASE_URL || ''
  try {
    const url = new URL(dbUrl)
    return {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname,
      port: url.port || (url.protocol === 'postgres:' ? '5432' : ''),
      database: url.pathname.replace(/\//g, ''),
    }
  } catch {
    return null
  }
}

const dbInfo = getDatabaseInfo()
if (dbInfo) {
  console.log(`📦 Database: ${dbInfo.protocol}://${dbInfo.host}:${dbInfo.port}/${dbInfo.database}`)
} else {
  console.warn('⚠️ DATABASE_URL is not configured or is invalid')
}

const app = express();
const server = http.createServer(app);
const allowedOrigins = new Set<string>([
  process.env.FRONTEND_URL,
  process.env.BACKEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5003',
  'http://127.0.0.1:5003',
  'https://bachelorhub.onrender.com',
  'capacitor://localhost',
].filter(Boolean) as string[])

const isOriginAllowed = (origin?: string) => {
  if (!origin) return true
  if (allowedOrigins.has(origin)) return true
  if (origin.startsWith('file://')) return true
  if (/^https:\/\/.*\.onrender\.com$/i.test(origin)) return true
  if (/^https:\/\/.*\.vercel\.app$/i.test(origin)) return true
  if (/^http:\/\/localhost(:\d+)?$/i.test(origin)) return true
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/i.test(origin)) return true
  return false
}

export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true)
        return
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`))
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 120000,
});

setSocketServer(io)

interface AuthPayload {
  userId: string;
  role?: string;
}

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      const err = new Error('Authentication error: Missing token');
      return next(err as any);
    }

    const secret = process.env.JWT_SECRET || 'secret';
    const payload = jwt.verify(token, secret) as AuthPayload;
    (socket as any).user = payload;

    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication error'))
  }
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(passport.initialize());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date(),
    status: 'online'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/used-items', usedItemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/blood', bloodRoutes);

app.get('/api/chat/unread-count', authenticate, async (req, res) => {
  try {
    const userId = String((req as any).user?.userId);
    const chatUnreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
        isDeleted: false,
      },
    });
    const usedItemUnreadCount = await prisma.usedItemMessage.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    const totalUnreadCount = chatUnreadCount + usedItemUnreadCount;
    console.log(`Unread message counts for user ${userId}: chat=${chatUnreadCount}, usedItem=${usedItemUnreadCount}, total=${totalUnreadCount}`);
    return res.json({
      unreadCount: chatUnreadCount,
      chatUnreadCount,
      usedItemUnreadCount,
      totalUnreadCount,
    });
  } catch (error) {
    console.error('Failed to fetch unread chat count:', error);
    return res.status(500).json({ error: 'Failed to fetch unread chat count' });
  }
});

app.patch('/api/chat/conversations/:conversationId/mark-as-read', authenticate, async (req, res) => {
  try {
    const conversationId = String(req.params.conversationId || '');
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required' });
    }

    const userId = String((req as any).user?.userId);
    const updatedMessages = await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false,
        isDeleted: false,
      },
      data: { isRead: true },
    });

    const userRoom = `user_${userId}`;
    io.to(userRoom).emit('messages_read', {
      conversationId,
      updatedCount: updatedMessages.count,
    });

    return res.json({ message: 'Conversation messages marked as read', updatedCount: updatedMessages.count });
  } catch (error) {
    console.error('Failed to mark chat conversation as read:', error);
    return res.status(500).json({ error: 'Failed to mark chat conversation as read' });
  }
});

app.get('/api/chat/history', async (req, res) => {
  const conversationId = String(req.query.conversationId || '')
  if (!conversationId) {
    return res.status(400).json({ error: 'conversationId is required' })
  }

  try {
    const messages = await prisma.message.findMany({
      where: { conversationId, isDeleted: false },
      orderBy: { createdAt: 'asc' },
    })

    return res.json({
      conversationId,
      messages: messages.map(formatDbMessage),
    })
  } catch (error) {
    console.error('Failed to fetch chat history:', error)
    return res.status(500).json({ error: 'Failed to fetch chat history' })
  }
})

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    const supportReportExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'SupportReport'
      ) AS exists
    `
    const supportFeedbackExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'SupportFeedback'
      ) AS exists
    `
    const reportTableExists = supportReportExists[0]?.exists ?? false
    const feedbackTableExists = supportFeedbackExists[0]?.exists ?? false

    return res.json({
      status: 'ok',
      timestamp: new Date(),
      database: dbInfo || null,
      supportReportTable: reportTableExists ? 'exists' : 'missing',
      supportFeedbackTable: feedbackTableExists ? 'exists' : 'missing',
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return res.status(500).json({
      status: 'error',
      error: 'Database connection failed or schema is incomplete',
      database: dbInfo || null,
    })
  }
});

// ✅ FIXED: 404 handler for undefined routes (remove the '*', just use app.use)
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Simple socket connection and chat events
interface ChatMessage {
  id?: string | number
  clientId?: string
  sender?: 'me' | 'them' | 'system'
  senderId?: string
  receiverId?: string
  content: string
  time: string
  status: 'sent' | 'read'
  type?: 'text' | 'image' | 'file' | 'audio'
  url?: string
  filename?: string
}

const parseConversationParticipants = (conversationId: string): [string, string] => {
  const parts = conversationId.split('_')
  if (parts.length >= 2) {
    const first = parts[0]
    const second = parts.slice(1).join('_')
    return [first, second]
  }

  return [conversationId, '']
}

const getOtherParticipantId = (conversationId: string, senderId: string): string => {
  const [userA, userB] = parseConversationParticipants(conversationId)
  if (userA === senderId) return userB
  if (userB === senderId) return userA
  return userA || userB
}

const formatDbMessage = (message: any): ChatMessage => ({
  id: message.id,
  senderId: message.senderId,
  receiverId: message.receiverId,
  content: message.content,
  type: message.type ?? 'text',
  url: message.url ?? undefined,
  filename: message.filename ?? undefined,
  time: message.createdAt ? new Date(message.createdAt).toISOString() : '',
  status: message.isRead ? 'read' : 'sent',
})

io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  socket.on('join_conversation', (conversationId: string) => {
    const room = `conversation_${conversationId}`
    socket.join(room)
    console.log(`Socket ${socket.id} joined room ${room}`)
  })

  // Join a personal room to receive notifications and unread count updates
  socket.on('join_user_room', () => {
    const user = (socket as any).user as AuthPayload | undefined
    if (!user?.userId) return
    const userRoom = `user_${user.userId}`
    socket.join(userRoom)
    console.log(`Socket ${socket.id} joined user room ${userRoom}`)
  })

  socket.on('get_history', async (conversationId: string) => {
    try {
      if (!conversationId) {
        socket.emit('conversation_history', { conversationId, messages: [] })
        return
      }

      const messages = await prisma.message.findMany({
        where: { conversationId, isDeleted: false },
        orderBy: { createdAt: 'asc' },
      })

      socket.emit('conversation_history', {
        conversationId,
        messages: messages.map(formatDbMessage),
      })
    } catch (error) {
      console.error('Failed to load conversation history:', error)
      socket.emit('conversation_history', { conversationId, messages: [] })
    }
  })

  socket.on('send_message', async (payload: { conversationId: string; message: ChatMessage }) => {
    const { conversationId, message } = payload
    const room = `conversation_${conversationId}`

    try {
      const senderId = message.senderId ?? ''
      const receiverId = getOtherParticipantId(conversationId, senderId)
      const [userA, userB] = parseConversationParticipants(conversationId)
      const [user1Id, user2Id] = [userA, userB].sort()

      if (userA && userB) {
        await prisma.conversation.upsert({
          where: { id: conversationId },
          update: {
            lastMessage: message.content,
            lastMessageAt: new Date(),
          },
          create: {
            id: conversationId,
            user1Id,
            user2Id,
            lastMessage: message.content,
          },
        })
      }

      const savedMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId: senderId || userA,
          receiverId: receiverId || userB,
          content: message.content,
          type: message.type,
          url: message.url,
          filename: message.filename,
          isRead: false,
        },
      }) as any

      const outgoingMessage: ChatMessage = {
        id: savedMessage.id,
        clientId: message.clientId,
        senderId: savedMessage.senderId,
        receiverId: savedMessage.receiverId,
        content: savedMessage.content,
        type: savedMessage.type ?? 'text',
        url: savedMessage.url ?? undefined,
        filename: savedMessage.filename ?? undefined,
        time: new Date(savedMessage.createdAt).toISOString(),
        status: savedMessage.isRead ? 'read' : 'sent',
      }

      socket.emit('message_saved', { conversationId, message: outgoingMessage })
      socket.to(room).emit('receive_message', { conversationId, message: outgoingMessage })

      // Notify the receiver's user room that a new unread message exists
      const receiverRoom = `user_${receiverId}`
      io.to(receiverRoom).emit('new_unread_message', {
        conversationId,
        messageId: savedMessage.id,
        senderId: savedMessage.senderId,
      })
    } catch (error) {
      console.error('Failed to save chat message:', error)
    }
  })

  socket.on('update_message', async (payload: { conversationId: string; messageId: string; content: string }) => {
    const { conversationId, messageId, content } = payload
    const room = `conversation_${conversationId}`

    try {
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { content },
      }) as any

      const outgoingMessage: ChatMessage = {
        id: updatedMessage.id,
        senderId: updatedMessage.senderId,
        receiverId: updatedMessage.receiverId,
        content: updatedMessage.content,
        type: updatedMessage.type ?? 'text',
        url: updatedMessage.url ?? undefined,
        filename: updatedMessage.filename ?? undefined,
        time: updatedMessage.createdAt ? new Date(updatedMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        status: updatedMessage.isRead ? 'read' : 'sent',
      }

      io.in(room).emit('message_updated', { conversationId, message: outgoingMessage })
    } catch (error) {
      console.error('Failed to update chat message:', error)
    }
  })

  socket.on('delete_message', async (payload: { conversationId: string; messageId: string }) => {
    const { conversationId, messageId } = payload
    const room = `conversation_${conversationId}`

    try {
      await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true } as any,
      })

      io.in(room).emit('message_deleted', { conversationId, messageId })
    } catch (error) {
      console.error('Failed to delete chat message:', error)
    }
  })

  socket.on('offer', (payload: { conversationId: string; callId?: string; callerId: string; callerName: string; type: 'audio' | 'video'; sdp: string }) => {
    const room = `conversation_${payload.conversationId}`
    socket.to(room).emit('offer', payload)

    const receiverId = getOtherParticipantId(payload.conversationId, payload.callerId)
    if (receiverId) {
      const userRoom = `user_${receiverId}`
      io.to(userRoom).emit('offer', payload)
    }
  })

  socket.on('answer', (payload: { conversationId: string; callId?: string; answer: string }) => {
    const room = `conversation_${payload.conversationId}`
    socket.to(room).emit('answer', payload)
  })

  socket.on('ice_candidate', (payload: { conversationId: string; callId?: string; candidate: any; senderId: string }) => {
    const room = `conversation_${payload.conversationId}`
    socket.to(room).emit('ice_candidate', payload)
  })

  socket.on('call_rejected', (payload: { conversationId: string; callId?: string }) => {
    const room = `conversation_${payload.conversationId}`
    socket.to(room).emit('call_rejected', payload)
  })

  socket.on('missed_call', (payload: { conversationId: string; callId?: string; type: 'audio' | 'video' }) => {
    const room = `conversation_${payload.conversationId}`
    // Broadcast to the entire room (including sender) so both sides see the missed-call state.
    io.in(room).emit('missed_call', payload)
  })

  socket.on('end_call', (payload: { conversationId: string; callId?: string }) => {
    const room = `conversation_${payload.conversationId}`
    // Broadcast to the whole conversation room so every participant sees the same end state.
    io.in(room).emit('end_call', payload)
  })

  socket.on('disconnect', (reason) => {
    try {
      const transport = (socket as any).conn?.transport?.name || 'unknown'
      console.log('Client disconnected', socket.id, { reason, transport })
    } catch (err) {
      console.log('Client disconnected', socket.id, { reason })
    }
  })
})

app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 5000;

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  if (error.code === 'EADDRINUSE') {
    console.error(`\n⚠️ Port ${PORT} is already in use. Please stop any other backend process or update PORT in backend/.env.\n`);
    process.exit(1);
  }

  throw error;
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready`);
  console.log(`📋 Test API: http://localhost:${PORT}/api/test`);
  console.log(`📋 Health Check: http://localhost:${PORT}/health`);
});