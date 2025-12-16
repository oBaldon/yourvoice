// client/src/rtc/device.ts
import * as mediasoupClient from "mediasoup-client";
import type { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";
import type { YourVoiceSocket } from "../net/socket";

type TransportOptions = {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
};

export class RtcSession {
  private s: YourVoiceSocket;
  private roomId: string;

  device!: mediasoupClient.Device;
  sendTransport?: mediasoupClient.types.Transport;
  recvTransport?: mediasoupClient.types.Transport;
  producer?: mediasoupClient.types.Producer;

  constructor(s: YourVoiceSocket, roomId: string) {
    this.s = s;
    this.roomId = roomId;
  }

  async init(rtpCapabilities: RtpCapabilities) {
    this.device = new mediasoupClient.Device();
    await this.device.load({ routerRtpCapabilities: rtpCapabilities });
  }

  async ensureRecvTransport() {
    if (this.recvTransport) return;

    const res = (await this.s.createTransport(this.roomId, "recv")) as any;
    if (!res.ok) throw new Error(res.error);

    const opts = res as TransportOptions;
    const t = this.device.createRecvTransport(opts);

    t.on("connect", ({ dtlsParameters }, cb, errCb) => {
      this.s.connectTransport(this.roomId, "recv", dtlsParameters)
        .then((r: any) => (r.ok ? cb() : errCb(new Error(r.error))))
        .catch(errCb);
    });

    this.recvTransport = t;
  }

  async ensureSendTransport() {
    if (this.sendTransport) return;

    const res = (await this.s.createTransport(this.roomId, "send")) as any;
    if (!res.ok) throw new Error(res.error);

    const opts = res as TransportOptions;
    const t = this.device.createSendTransport(opts);

    t.on("connect", ({ dtlsParameters }, cb, errCb) => {
      this.s.connectTransport(this.roomId, "send", dtlsParameters)
        .then((r: any) => (r.ok ? cb() : errCb(new Error(r.error))))
        .catch(errCb);
    });

    t.on("produce", ({ kind, rtpParameters }, cb, errCb) => {
      this.s.produce(this.roomId, kind, rtpParameters)
        .then((r: any) => (r.ok ? cb({ id: r.id }) : errCb(new Error(r.error))))
        .catch(errCb);
    });

    this.sendTransport = t;
  }

  async startProducing(track: MediaStreamTrack) {
    await this.ensureSendTransport();
    this.producer = await this.sendTransport!.produce({ track });
    return this.producer;
  }

  async consumeProducer(producerId: string) {
    await this.ensureRecvTransport();

    const r = (await this.s.consume(this.roomId, producerId, this.device.rtpCapabilities as any)) as any;
    if (!r.ok) throw new Error(r.error);

    const consumer = await this.recvTransport!.consume({
      id: r.id,
      producerId: r.producerId,
      kind: r.kind,
      rtpParameters: r.rtpParameters
    });

    const stream = new MediaStream([consumer.track]);
    const audio = document.createElement("audio");
    audio.autoplay = true;
    audio.srcObject = stream;
    document.body.appendChild(audio);
  }

  setMuted(muted: boolean) {
    if (!this.producer) return;
    if (muted) this.producer.pause();
    else this.producer.resume();
  }

  close() {
    try { this.producer?.close(); } catch {}
    try { this.sendTransport?.close(); } catch {}
    try { this.recvTransport?.close(); } catch {}
  }
}
