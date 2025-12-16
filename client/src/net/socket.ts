// client/src/net/socket.ts
import { io, Socket } from "socket.io-client";

export type Peer = { id: string; name?: string };

export type JoinResult =
  | { ok: true; id: string; roomId: string }
  | { ok: false; error: string };

export type LeaveResult = { ok: true } | { ok: false; error: string };

export class YourVoiceSocket {
  private socket: Socket;

  constructor() {
    // same-origin (served by the host). Works over VPN IP as well.
    this.socket = io("/", {
      transports: ["websocket"],
      autoConnect: true
    });
  }

  onConnect(cb: (id: string) => void) {
    this.socket.on("connect", () => cb(this.socket.id));
  }

  onDisconnect(cb: (reason?: string) => void) {
    this.socket.on("disconnect", (reason) => cb(reason));
  }

  onPeerJoined(cb: (peer: Peer) => void) {
    this.socket.on("peer-joined", cb);
  }

  onPeerLeft(cb: (payload: { id: string }) => void) {
    this.socket.on("peer-left", cb);
  }

  echo(msg: string) {
    return new Promise<{ ok: boolean; msg: unknown }>((resolve) => {
      this.socket.emit("echo", msg, resolve);
    });
  }

  join(roomId: string, name: string) {
    return new Promise<JoinResult>((resolve) => {
      this.socket.emit("join", { roomId, name }, resolve);
    });
  }

  leave(roomId: string) {
    return new Promise<LeaveResult>((resolve) => {
      this.socket.emit("leave", { roomId }, resolve);
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
}
