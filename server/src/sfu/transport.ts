// server/src/sfu/transport.ts
import * as mediasoup from "mediasoup";
import { config } from "../config.js";

export async function createWebRtcTransport(router: mediasoup.types.Router) {
  const transport = await router.createWebRtcTransport({
    listenIps: [{ ip: "0.0.0.0", announcedIp: config.announcedIp }],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    initialAvailableOutgoingBitrate: 800_000
  });

  transport.on("dtlsstatechange", (state) => {
    if (state === "closed") transport.close();
  });

  return transport;
}
