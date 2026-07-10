import dotenv from 'dotenv'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cookieParser from "cookie-parser";
import { connectDB } from './config/db.js'
import userRouter from './routes/user.route.js'
import collaborationRequestRouter from './routes/collaborationRequest.route.js'
import meetingRouter from './routes/meeting.route.js'
import documentRouter from './routes/document.route.js'
import messageRouter from './routes/message.route.js'
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import Message from './models/message.model.js';
import User from './models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config()
const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }
})

app.use(express.json())
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const port = process.env.PORT || 5000

connectDB()

app.use('/', userRouter)
app.use('/collaboration-requests', collaborationRequestRouter)
app.use('/meetings', meetingRouter)
app.use('/documents', documentRouter)
app.use('/messages', messageRouter)

// Socket.IO - real-time chat
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  let connectedUserId = null;

  // Client sends their userId right after connecting
  socket.on('register', async (userId) => {
    if (!userId) return;
    connectedUserId = userId.toString();
    onlineUsers.set(connectedUserId, socket.id);
    await User.findByIdAndUpdate(connectedUserId, { isOnline: true }).catch(() => {});
    io.emit('user_online', { userId: connectedUserId });
    console.log(`User registered on socket: ${connectedUserId}`);
  });

  socket.on('send_message', async ({ senderId, receiverId, content }) => {
    try {
      if (!senderId || !receiverId || !content?.trim()) return;

      const message = await new Message({ senderId, receiverId, content: content.trim() }).save();
      const populated = await message.populate([
        { path: 'senderId', select: 'name avatarUrl isOnline' },
        { path: 'receiverId', select: 'name avatarUrl isOnline' },
      ]);

      // Deliver to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_message', populated);
      }

      // Confirm back to sender
      socket.emit('message_sent', populated);
    } catch (err) {
      console.error('send_message error:', err);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('disconnect', async () => {
    if (connectedUserId) {
      onlineUsers.delete(connectedUserId);
      await User.findByIdAndUpdate(connectedUserId, { isOnline: false }).catch(() => {});
      io.emit('user_offline', { userId: connectedUserId });
    }
  });
});

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
})
