import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config.js';
import { registerEvents } from './events.js';

export function attachSocket(server: http.Server) {
  const io = new SocketIOServer(server, {
    cors: { origin: config.corsOrigin, credentials: true },
    transports: ['websocket'],
    maxHttpBufferSize: 1e6
  });

  io.on('connection', (socket) => {
    registerEvents(socket);
  });

  return io;
}
