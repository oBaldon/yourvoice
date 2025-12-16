import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3000),
  roomKey: process.env.ROOM_KEY ?? '{{PLACEHOLDER}}',
  // CORS liberal por padrão (VPN/LAN). Em hardening a gente restringe.
  corsOrigin: process.env.CORS_ORIGIN ?? '*',

  rtcMinPort: Number(process.env.RTC_MIN_PORT ?? 40000),
  rtcMaxPort: Number(process.env.RTC_MAX_PORT ?? 40100),

  // Em docker + VPN, normalmente precisa setar pro IP da VPN do HOST.
  announcedIp: process.env.ANNOUNCED_IP && process.env.ANNOUNCED_IP !== '{{PLACEHOLDER}}'
    ? process.env.ANNOUNCED_IP
    : undefined
};
