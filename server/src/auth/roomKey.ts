// server/src/auth/roomKey.ts
import { config } from "../config.js";

export function isRoomKeyEnabled() {
  return config.roomKey !== "{{PLACEHOLDER}}";
}

export function assertRoomKey(key?: string) {
  if (!isRoomKeyEnabled()) return;
  if (!key || key !== config.roomKey) throw new Error("unauthorized");
}
