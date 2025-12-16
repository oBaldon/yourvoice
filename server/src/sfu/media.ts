// server/src/sfu/media.ts
import type * as mediasoup from "mediasoup";
import type { Peer, Room } from "./room.js";

export async function connectTransport(
  peer: Peer,
  direction: "send" | "recv",
  dtlsParameters: mediasoup.types.DtlsParameters
) {
  const transport = direction === "send" ? peer.sendTransport : peer.recvTransport;
  if (!transport) throw new Error("transport_not_found");
  await transport.connect({ dtlsParameters });
}

export async function produce(
  peer: Peer,
  kind: mediasoup.types.MediaKind,
  rtpParameters: mediasoup.types.RtpParameters
) {
  if (!peer.sendTransport) throw new Error("send_transport_missing");

  const producer = await peer.sendTransport.produce({ kind, rtpParameters });
  peer.producers.set(producer.id, producer);

  producer.on("transportclose", () => peer.producers.delete(producer.id));
  producer.on("close", () => peer.producers.delete(producer.id));

  return producer;
}

export async function consume(
  room: Room,
  peer: Peer,
  producerId: string,
  rtpCapabilities: mediasoup.types.RtpCapabilities
) {
  if (!peer.recvTransport) throw new Error("recv_transport_missing");

  if (!room.router.canConsume({ producerId, rtpCapabilities })) {
    throw new Error("cannot_consume");
  }

  const consumer = await peer.recvTransport.consume({
    producerId,
    rtpCapabilities,
    paused: false
  });

  peer.consumers.set(consumer.id, consumer);

  consumer.on("transportclose", () => peer.consumers.delete(consumer.id));
  consumer.on("producerclose", () => peer.consumers.delete(consumer.id));

  return consumer;
}
