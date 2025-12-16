// client/src/main.ts
import { YourVoiceSocket } from "./net/socket";
import { getMicStream } from "./rtc/audio";
import { setupPtt } from "./rtc/ptt";
import { RtcSession } from "./rtc/device";

const el = (id: string) => document.getElementById(id) as HTMLElement;
const logEl = el("log");
const statusEl = el("status");

function log(...args: any[]) {
  const line = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
  logEl.textContent += line + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(s: string) {
  statusEl.textContent = s;
}

let ys: YourVoiceSocket | null = null;
let rtc: RtcSession | null = null;
let currentRoom: string | null = null;
let micTrack: MediaStreamTrack | null = null;

let muted = false;
let mode: "open" | "ptt" = "open";
const ptt = setupPtt(
  () => {
    if (mode !== "ptt") return;
    rtc?.setMuted(false);
    log("[ptt] down -> unmute");
  },
  () => {
    if (mode !== "ptt") return;
    rtc?.setMuted(true);
    log("[ptt] up -> mute");
  }
);

function ensureSocket() {
  if (ys) return ys;
  ys = new YourVoiceSocket();

  ys.onConnect(async (id) => {
    setStatus(`conectado (${id})`);
    log("[ws] connected", id);
    const res = await ys!.echo("ping");
    log("[ws] echo", res);
  });

  ys.onDisconnect((reason) => {
    setStatus("desconectado");
    log("[ws] disconnected", reason ?? "");
    cleanupRtc();
  });

  ys.onPeerJoined((peer) => log("[room] peer-joined", peer));
  ys.onPeerLeft((p) => log("[room] peer-left", p));

  ys.onNewProducer(async ({ producerId, peerName }) => {
    log("[sfu] new-producer from", peerName, producerId);
    try {
      await rtc?.consumeProducer(producerId);
    } catch (e: any) {
      log("[sfu] consume failed", e?.message ?? String(e));
    }
  });

  return ys;
}

function cleanupRtc() {
  try { rtc?.close(); } catch {}
  rtc = null;

  try { micTrack?.stop(); } catch {}
  micTrack = null;

  currentRoom = null;
  muted = false;

  ptt.disable();
}

async function joinRoom() {
  const roomId = (el("roomId") as HTMLInputElement).value.trim();
  const name = (el("name") as HTMLInputElement).value.trim();
  const key = (el("key") as HTMLInputElement).value;

  if (!roomId || !name) {
    log("[err] preencha sala e nome");
    return;
  }

  const s = ensureSocket();
  const res = await s.join(roomId, name, key);

  if (!res.ok) {
    log("[err] join failed:", res.error);
    return;
  }

  currentRoom = roomId;
  rtc = new RtcSession(s, roomId);
  await rtc.init(res.rtpCapabilities);

  // create recv transport early
  await rtc.ensureRecvTransport();

  log("[room] joined", { roomId, id: res.id });
  log("[sfu] existing producers:", res.producers);

  // consume existing
  for (const p of res.producers) {
    try {
      await rtc.consumeProducer(p.producerId);
    } catch (e: any) {
      log("[sfu] consume existing failed", p.producerId, e?.message ?? String(e));
    }
  }
}

async function leaveRoom() {
  if (!ys || !currentRoom) {
    log("[ui] not in a room");
    return;
  }
  const r = await ys.leave(currentRoom);
  log("[room] leave", r);
  cleanupRtc();
}

async function enableMic() {
  if (!rtc || !currentRoom) {
    log("[err] entre na sala primeiro");
    return;
  }

  const aecVal = (el("aec") as HTMLSelectElement).value;
  const aec = aecVal === "on";

  // capture mic only once
  if (!micTrack) {
    const stream = await getMicStream(aec);
    micTrack = stream.getAudioTracks()[0];
    log("[media] mic ok (aec:", aec, ")");
  }

  // start producing
  await rtc.startProducing(micTrack);

  // apply mode behavior
  mode = (el("mode") as HTMLSelectElement).value as any;
  if (mode === "ptt") {
    ptt.enable();
    rtc.setMuted(true); // start muted; hold V to speak
    log("[mode] PTT enabled (hold V)");
  } else {
    ptt.disable();
    rtc.setMuted(false);
    log("[mode] open mic");
  }
}

function toggleMute() {
  if (!rtc) return;
  muted = !muted;
  rtc.setMuted(muted || (mode === "ptt")); // if PTT mode, keep muted unless key held
  log("[media] mute:", muted);
}

(el("join") as HTMLButtonElement).onclick = () => joinRoom().catch((e) => log("[err]", e?.message ?? String(e)));
(el("leave") as HTMLButtonElement).onclick = () => leaveRoom().catch((e) => log("[err]", e?.message ?? String(e)));
(el("mic") as HTMLButtonElement).onclick = () => enableMic().catch((e) => log("[err]", e?.message ?? String(e)));
(el("mute") as HTMLButtonElement).onclick = () => toggleMute();

(el("mode") as HTMLSelectElement).onchange = () => {
  mode = (el("mode") as HTMLSelectElement).value as any;
  log("[mode] changed:", mode);
};

log("[ready] join a room, then click 'Ativar mic'");
log("[vpn] if using Docker+VPN, set ANNOUNCED_IP in .env to host VPN IP");
