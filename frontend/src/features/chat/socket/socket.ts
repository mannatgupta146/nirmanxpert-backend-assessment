import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (socket) {
    socket.disconnect();
  }
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  socket = io(backendUrl, {
    withCredentials: true,
    reconnection: true,
  });
  
  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
