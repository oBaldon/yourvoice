#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://localhost:3000}"

echo "[smoke-room] socket.io join/leave room"
docker compose exec -T -e BASE="$BASE" yourvoice node - <<'NODE'
import { io } from "socket.io-client";

const base = process.env.BASE || "http://localhost:3000";
const roomId = `smoke-${Date.now()}`;
const key = process.env.ROOM_KEY && process.env.ROOM_KEY !== "{{PLACEHOLDER}}"
  ? process.env.ROOM_KEY
  : undefined;

function fail(message, extra) {
  console.error("[fail]", message, extra ?? "");
  process.exit(1);
}

function connect(name) {
  return new Promise((resolve, reject) => {
    const socket = io(base, {
      transports: ["websocket"],
      timeout: 5000,
      reconnection: false
    });

    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error(`${name}: connect_timeout`));
    }, 8000);

    socket.on("connect", () => {
      clearTimeout(timer);
      console.log(`[ok] ${name} connected`, socket.id);
      resolve(socket);
    });

    socket.on("connect_error", (err) => {
      clearTimeout(timer);
      socket.disconnect();
      reject(err);
    });
  });
}

function once(socket, event, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${event}_timeout`)), timeoutMs);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

function emitAck(socket, event, payload, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${event}_ack_timeout`)), timeoutMs);
    socket.emit(event, payload, (res) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
}

try {
  const alice = await connect("alice");
  const bob = await connect("bob");

  const aliceJoin = await emitAck(alice, "join", { roomId, name: "alice", key });
  if (!aliceJoin?.ok) fail("alice join failed", aliceJoin);
  console.log("[ok] alice joined", roomId);

  const peerJoined = once(alice, "peer-joined");

  const bobJoin = await emitAck(bob, "join", { roomId, name: "bob", key });
  if (!bobJoin?.ok) fail("bob join failed", bobJoin);
  if (!Array.isArray(bobJoin.producers)) fail("bob join response missing producers", bobJoin);
  console.log("[ok] bob joined", roomId);

  const joinedPayload = await peerJoined;
  if (joinedPayload?.name !== "bob") fail("alice did not receive bob peer-joined", joinedPayload);
  console.log("[ok] peer-joined delivered", joinedPayload);

  const peerLeft = once(alice, "peer-left");

  const bobLeave = await emitAck(bob, "leave", { roomId });
  if (!bobLeave?.ok) fail("bob leave failed", bobLeave);
  console.log("[ok] bob left");

  const leftPayload = await peerLeft;
  if (leftPayload?.id !== bob.id) fail("alice did not receive bob peer-left", leftPayload);
  console.log("[ok] peer-left delivered", leftPayload);

  const aliceLeave = await emitAck(alice, "leave", { roomId });
  if (!aliceLeave?.ok) fail("alice leave failed", aliceLeave);
  console.log("[ok] alice left");

  alice.disconnect();
  bob.disconnect();
  process.exit(0);
} catch (err) {
  fail(err?.message ?? String(err));
}
NODE
