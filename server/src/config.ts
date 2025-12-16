import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  roomKey: process.env.ROOM_KEY ?? '{{PLACEHOLDER}}',
  // CORS liberal por padrão (VPN/LAN). Em hardening a gente restringe.
  corsOrigin: process.env.CORS_ORIGIN ?? '*'
};
