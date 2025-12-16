// server/src/ws/events.ts
import type { Socket } from "socket.io";
import type * as mediasoup from "mediasoup";
import { config } from "../config.js";
import { getOrCreateRoom, getRoom, listProducers, removeRoomIfEmpty, type Peer } from "../sfu/room.js";
import { createWebRtcTransport } from "../sfu/transport.js";
import { connectTransport, consume, produce } from "../sfu/media.js";

function mustRoom(roomId: string) {
  const room = getRoom(roomId);
  if (!room) throw new Error("room_not_found");
  return room;
}

function mustPeer(roomId: string, socketId: string) {
  const room = mustRoom(roomId);
  const peer = room.peers.get(socketId);
  if (!peer) throw new Error("not_joined");
  return { room, peer };
}

export function registerEvents(socket: Socket) {
  socket.on("echo", (msg: unknown, cb?: (res: unknown) => void) => {
    cb?.({ ok: true, msg });
  });

  socket.on(
    "join",
    async (payload: { roomId?: string; name?: string; key?: string }, cb?: (res: unknown) => void) => {
      try {
        const roomId = String(payload?.roomId ?? "").trim();
        const name = String(payload?.name ?? "").trim();
        const key = String(payload?.key ?? "");
        if (!roomId || !name) throw new Error("bad_request");

        if (config.roomKey !== "{{PLACEHOLDER}}" && key !== config.roomKey) {
          throw new Error("unauthorized");
        }

        const room = await getOrCreateRoom(roomId);

        const peer: Peer = {
          id: socket.id,
          name,
          producers: new Map(),
          consumers: new Map()
        };
        room.peers.set(socket.id, peer);
        socket.join(room.id);

        // Send router RTP capabilities + existing producers in the room
        cb?.({
          ok: true,
          id: socket.id,
          roomId: room.id,
          rtpCapabilities: room.router.rtpCapabilities,
          producers: listProducers(room).filter((p) => p.peerId !== socket.id)
        });

        socket.to(room.id).emit("peer-joined", { id: peer.id, name: peer.name });
        console.log(`[room:${room.id}] joined`, peer.name, peer.id);
      } catch (e: any) {
        cb?.({ ok: false, error: e?.message ?? "join_failed" });
      }
    }
  );

  socket.on("leave", (payload: { roomId?: string }, cb?: (res: unknown) => void) => {
    try {
      const roomId = String(payload?.roomId ?? "").trim();
      if (!roomId) throw new Error("bad_request");

      const room = getRoom(roomId);
      if (room) {
        const peer = room.peers.get(socket.id);
        if (peer) cleanupPeer(peer);
        room.peers.delete(socket.id);
        socket.to(room.id).emit("peer-left", { id: socket.id });
        removeRoomIfEmpty(room.id);
      }

      socket.leave(roomId);
      cb?.({ ok: true });
    } catch (e: any) {
      cb?.({ ok: false, error: e?.message ?? "leave_failed" });
    }
  });

  socket.on(
    "create-transport",
    async (payload: { roomId?: string; direction?: "send" | "recv" }, cb?: (res: unknown) => void) => {
      try {
        const roomId = String(payload?.roomId ?? "").trim();
        const direction = payload?.direction;
        if (!roomId || (direction !== "send" && direction !== "recv")) throw new Error("bad_request");

        const { room, peer } = mustPeer(roomId, socket.id);

        const transport = await createWebRtcTransport(room.router);
        if (direction === "send") peer.sendTransport = transport;
        else peer.recvTransport = transport;

        cb?.({
          ok: true,
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters
        });
      } catch (e: any) {
        cb?.({ ok: false, error: e?.message ?? "create_transport_failed" });
      }
    }
  );

  socket.on(
    "connect-transport",
    async (
      payload: { roomId?: string; direction?: "send" | "recv"; dtlsParameters?: mediasoup.types.DtlsParameters },
      cb?: (res: unknown) => void
    ) => {
      try {
        const roomId = String(payload?.roomId ?? "").trim();
        const direction = payload?.direction;
        const dtlsParameters = payload?.dtlsParameters;
        if (!roomId || (direction !== "send" && direction !== "recv") || !dtlsParameters) {
          throw new Error("bad_request");
        }

        const { peer } = mustPeer(roomId, socket.id);
        await connectTransport(peer, direction, dtlsParameters);

        cb?.({ ok: true });
      } catch (e: any) {
        cb?.({ ok: false, error: e?.message ?? "connect_transport_failed" });
      }
    }
  );

  socket.on(
    "produce",
    async (
      payload: { roomId?: string; kind?: mediasoup.types.MediaKind; rtpParameters?: mediasoup.types.RtpParameters },
      cb?: (res: unknown) => void
    ) => {
      try {
        const roomId = String(payload?.roomId ?? "").trim();
        const kind = payload?.kind;
        const rtpParameters = payload?.rtpParameters;
        if (!roomId || !kind || !rtpParameters) throw new Error("bad_request");

        const { room, peer } = mustPeer(roomId, socket.id);
        const producer = await produce(peer, kind, rtpParameters);

        socket.to(room.id).emit("new-producer", {
          producerId: producer.id,
          peerId: peer.id,
          peerName: peer.name
        });

        cb?.({ ok: true, id: producer.id });
      } catch (e: any) {
        cb?.({ ok: false, error: e?.message ?? "produce_failed" });
      }
    }
  );

  socket.on(
    "consume",
    async (
      payload: {
        roomId?: string;
        producerId?: string;
        rtpCapabilities?: mediasoup.types.RtpCapabilities;
      },
      cb?: (res: unknown) => void
    ) => {
      try {
        const roomId = String(payload?.roomId ?? "").trim();
        const producerId = String(payload?.producerId ?? "").trim();
        const rtpCapabilities = payload?.rtpCapabilities;
        if (!roomId || !producerId || !rtpCapabilities) throw new Error("bad_request");

        const { room, peer } = mustPeer(roomId, socket.id);
        const consumer = await consume(room, peer, producerId, rtpCapabilities);

        cb?.({
          ok: true,
          id: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters
        });
      } catch (e: any) {
        cb?.({ ok: false, error: e?.message ?? "consume_failed" });
      }
    }
  );

  function cleanupPeer(peer: Peer) {
    peer.consumers.forEach((c) => c.close());
    peer.producers.forEach((p) => p.close());
    peer.recvTransport?.close();
    peer.sendTransport?.close();
    peer.consumers.clear();
    peer.producers.clear();
  }

  socket.on("disconnect", () => {
    // best-effort cleanup per joined roomId
    const roomIds = [...socket.rooms].filter((r) => r !== socket.id);
    for (const roomId of roomIds) {
      const room = getRoom(roomId);
      if (!room) continue;
      const peer = room.peers.get(socket.id);
      if (!peer) continue;
      cleanupPeer(peer);
      room.peers.delete(socket.id);
      socket.to(room.id).emit("peer-left", { id: socket.id });
      removeRoomIfEmpty(room.id);
      console.log(`[room:${room.id}] disconnected`, peer.name, socket.id);
    }
  });
}
