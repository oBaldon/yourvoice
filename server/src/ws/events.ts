import type { Socket } from 'socket.io';

export function registerEvents(socket: Socket) {
  // echo básico (para smoke e para validar WS)
  socket.on('echo', (msg: unknown, cb?: (res: unknown) => void) => {
    cb?.({ ok: true, msg });
  });

  socket.on('join', (payload: { roomId?: string; name?: string }, cb?: (res: unknown) => void) => {
    const roomId = String(payload?.roomId ?? '').trim();
    const name = String(payload?.name ?? '').trim();
    if (!roomId || !name) {
      cb?.({ ok: false, error: 'bad_request' });
      return;
    }
    socket.join(roomId);
    socket.to(roomId).emit('peer-joined', { id: socket.id, name });
    cb?.({ ok: true, id: socket.id, roomId });
  });

  socket.on('leave', (payload: { roomId?: string }, cb?: (res: unknown) => void) => {
    const roomId = String(payload?.roomId ?? '').trim();
    if (!roomId) {
      cb?.({ ok: false, error: 'bad_request' });
      return;
    }
    socket.leave(roomId);
    socket.to(roomId).emit('peer-left', { id: socket.id });
    cb?.({ ok: true });
  });

  socket.on('disconnect', () => {
    // por enquanto, nada (mais tarde: state cleanup por sala)
  });
}
