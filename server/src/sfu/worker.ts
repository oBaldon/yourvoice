// server/src/sfu/worker.ts
import * as mediasoup from "mediasoup";
import { config } from "../config.js";

let worker: mediasoup.types.Worker | null = null;

export async function getWorker() {
  if (worker) return worker;

  worker = await mediasoup.createWorker({
    logLevel: "warn",
    rtcMinPort: config.rtcMinPort,
    rtcMaxPort: config.rtcMaxPort
  });

  worker.on("died", () => {
    console.error("[mediasoup] worker died, exiting...");
    setTimeout(() => process.exit(1), 1500);
  });

  console.log("[mediasoup] worker ready", {
    rtcMinPort: config.rtcMinPort,
    rtcMaxPort: config.rtcMaxPort,
    announcedIp: config.announcedIp ?? "(unset)"
  });

  return worker;
}
