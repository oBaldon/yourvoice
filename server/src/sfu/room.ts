// server/src/sfu/room.ts
import * as mediasoup from "mediasoup";
import { getWorker } from "./worker.js";

export type Peer = {
  id: string; // socket.id
  name: string;
  sendTransport?: mediasoup.types.WebRtcTransport;
  recvTransport?: mediasoup.types.WebRtcTransport;
  producers: Map<string, mediasoup.types.Producer>;
  consumers: Map<string, mediasoup.types.Consumer>;
};

export type Room = {
  id: string;
  router: mediasoup.types.Router;
  peers: Map<string, Peer>;
};

const rooms = new Map<string, Room>();

const mediaCodecs: mediasoup.types.RtpCodecCapability[] = [
  { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 }
];

export async function getOrCreateRoom(roomId: string): Promise<Room> {
  const existing = rooms.get(roomId);
  if (existing) return existing;

  const worker = await getWorker();
  const router = await worker.createRouter({ mediaCodecs });

  const room: Room = { id: roomId, router, peers: new Map() };
  rooms.set(roomId, room);
  console.log("[room] created", roomId);

  return room;
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function removeRoomIfEmpty(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  if (room.peers.size === 0) {
    rooms.delete(roomId);
    console.log("[room] removed", roomId);
  }
}

export function listProducers(room: Room) {
  const out: Array<{ producerId: string; peerId: string; peerName: string }> = [];
  for (const peer of room.peers.values()) {
    for (const producerId of peer.producers.keys()) {
      out.push({ producerId, peerId: peer.id, peerName: peer.name });
    }
  }
  return out;
}
