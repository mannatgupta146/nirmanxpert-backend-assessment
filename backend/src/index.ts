import express from 'express';
// Triggering backend restart for Prisma client update (updatedAt optional)
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

import authRoutes from './routes/auth.routes';
import channelRoutes from './routes/channel.routes';
import userRoutes from './routes/user.routes';

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/users', userRoutes);

// Create HTTP server for Socket.io integration
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // In production, restrict this to your frontend URL
  },
});

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Nirmanxpert API is running' });
});

import { socketAuthMiddleware } from './sockets/auth.socket';
import { setupChatSockets } from './sockets/chat.socket';

// Socket.io configuration & authentication
io.use(socketAuthMiddleware);

// Initialize chat socket events
setupChatSockets(io);

// Start the server
httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
