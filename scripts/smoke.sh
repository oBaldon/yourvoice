#!/usr/bin/env bash
set -euo pipefail

BASE="${1:-http://localhost:3000}"

echo "[smoke] GET /health"
curl -fsS "$BASE/health" | cat
echo

echo "[smoke] socket.io echo (rodando dentro do container)"
docker compose exec -T yourvoice node - <<'NODE'
import { io } from "socket.io-client";

const base = process.env.BASE || "http://localhost:3000";
const socket = io(base, { transports: ["websocket"] });

socket.on("connect", () => {
  socket.emit("echo", "ping", (res) => {
    console.log("[ok] echo response:", res);
    socket.disconnect();
    process.exit(0);
  });
});

socket.on("connect_error", (e) => {
  console.error("[fail] connect_error", e.message);
  process.exit(1);
});
NODE
