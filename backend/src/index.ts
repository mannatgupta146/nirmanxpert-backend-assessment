import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
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

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/users', userRoutes);

// Create HTTP server for Socket.io integration
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: frontendUrl,
    credentials: true,
  },
});

app.get('/', (req, res) => {
  res.json({ message: 'Nirmanxpert API is running' });
});

import { socketAuthMiddleware } from './sockets/auth.socket';
import { setupChatSockets } from './sockets/chat.socket';

io.use(socketAuthMiddleware);
setupChatSockets(io);

httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
