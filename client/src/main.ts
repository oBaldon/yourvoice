const el = (id: string) => document.getElementById(id) as HTMLElement;
const logEl = el('log');
const statusEl = el('status');

function log(...args: any[]) {
  const line = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
  logEl.textContent += line + '\n';
  logEl.scrollTop = logEl.scrollHeight;
}

let socket: WebSocket | null = null;

function wsUrl() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  // socket.io usa um path próprio; no próximo passo a gente troca para socket.io-client.
  // aqui é só placeholder pra UI mínima (sem WS real ainda).
  return `${proto}//${location.host}/`;
}

function setStatus(s: string) {
  statusEl.textContent = s;
}

async function joinRoom() {
  // WS real vem no próximo passo (socket.io-client). Por enquanto só valida UI/HTTP.
  log('[ui] join clicked', {
    roomId: (el('roomId') as HTMLInputElement).value,
    name: (el('name') as HTMLInputElement).value
  });
  setStatus('ok (ws no próximo passo)');
}

async function leaveRoom() {
  log('[ui] leave clicked');
  setStatus('ok (ws no próximo passo)');
  socket?.close();
  socket = null;
}

(el('join') as HTMLButtonElement).onclick = () => joinRoom().catch(e => log('[err]', e?.message ?? String(e)));
(el('leave') as HTMLButtonElement).onclick = () => leaveRoom().catch(e => log('[err]', e?.message ?? String(e)));

log('[ready] open /health to check server');
log('[info] ws placeholder:', wsUrl());
