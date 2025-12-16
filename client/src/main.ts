// client/src/main.ts
import { YourVoiceSocket } from "./net/socket";

const el = (id: string) => document.getElementById(id) as HTMLElement;
const logEl = el("log");
const statusEl = el("status");

function log(...args: any[]) {
  const line = args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ");
  logEl.textContent += line + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

function setStatus(s: string) {
  statusEl.textContent = s;
}

let ys: YourVoiceSocket | null = null;
let currentRoom: string | null = null;

function ensureSocket() {
  if (ys) return ys;

  ys = new YourVoiceSocket();

  ys.onConnect(async (id) => {
    setStatus(`conectado (${id})`);
    log("[ws] connected", id);
    try {
      const res = await ys!.echo("ping");
      log("[ws] echo", res);
    } catch (e: any) {
      log("[ws] echo failed", e?.message ?? String(e));
    }
  });

  ys.onDisconnect((reason) => {
    setStatus("desconectado");
    log("[ws] disconnected", reason ?? "");
    currentRoom = null;
  });

  ys.onPeerJoined((peer) => log("[room] peer-joined", peer));
  ys.onPeerLeft((p) => log("[room] peer-left", p));

  return ys;
}

async function joinRoom() {
  const roomId = (el("roomId") as HTMLInputElement).value.trim();
  const name = (el("name") as HTMLInputElement).value.trim();

  if (!roomId || !name) {
    log("[err] preencha sala e nome");
    return;
  }

  const s = ensureSocket();
  const res = await s.join(roomId, name);

  if (!res.ok) {
    log("[err] join failed:", res.error);
    return;
  }

  currentRoom = roomId;
  log("[room] joined", res);
}

async function leaveRoom() {
  if (!ys || !currentRoom) {
    log("[ui] not in a room");
    return;
  }

  const res = await ys.leave(currentRoom);
  log("[room] leave", res);

  currentRoom = null;
}

(el("join") as HTMLButtonElement).onclick = () =>
  joinRoom().catch((e) => log("[err]", e?.message ?? String(e)));

(el("leave") as HTMLButtonElement).onclick = () =>
  leaveRoom().catch((e) => log("[err]", e?.message ?? String(e)));

log("[ready] open /health to check server");
log("[ready] open in 2 tabs and join same room to see peer events");
