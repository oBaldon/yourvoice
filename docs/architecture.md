# Arquitetura — YourVoice

Este documento complementa o `README.md` com detalhes técnicos (alto nível) e explicita a estratégia de conectividade:
**Direct (Free) → VPN/Overlay (Free) → Relay BR (Pro, opt-in)**.

> Regra de ouro: **UI + Sinalização + SFU rodam no host** (auto-host obrigatório).

---

## Componentes

- **apps/web (Cliente Web)**
	- UI de sala (nome, sala, lista de participantes)
	- Captura de microfone (WebRTC)
	- Modo de fala: Aberto / PTT (na aba)
	- Diagnóstico via `getStats()`
	- **Connectivity Manager**: Direct-first; sugere VPN; habilita Relay Pro quando opt-in

- **apps/server (Host)**
	- Serve a UI (HTTP)
	- WebSocket de sinalização (rooms + negotiation)
	- SFU forward-only (encaminha áudio, sem mixagem/transcode)

- **Infra opcional (Pro)**
	- **YourVoice Relay BR (TURN/relay)**: usado apenas como fallback quando Direct falha e Pro está ativo.
	- Serviço de credenciais (tokens curtos) para `iceServers`.

---

## Modos de Conectividade

### 1) Direct (Free)
- Objetivo: menor latência, sem setup.
- Requisito: rede permitir caminho direto UDP (ou equivalente).
- Implementação: WebRTC + ICE; STUN pode ser “best effort”.

### 2) VPN/Overlay (Free / recomendado)
- Objetivo: funcionar no pior caso (CGNAT/NAT chato) sem depender de infra YourVoice.
- Implementação: usuários entram numa VPN/overlay (Tailscale/ZeroTier/Hamachi) e acessam o host pelo IP/hostname da VPN.

### 3) Relay BR (Pro / opt-in)
- Objetivo: “clicou e entrou” sem VPN, com compatibilidade máxima.
- Implementação: o cliente recebe `iceServers` (TURN/relay) do serviço Pro.
- Política: **Direct-first** sempre; Relay só entra quando necessário.

---

## State machine (conectividade) — sugestão

- `direct_trying`
- `direct_connected`
- `direct_failed` → sugere `vpn_recommended`
- `vpn_connected` (quando usuário usa VPN)
- `pro_relay_trying` (opt-in)
- `pro_relay_connected`

A UI deve exibir sempre um badge: **Direct / VPN / Relay (Pro)**.

---

## Observabilidade (MVP+)

Expor no cliente:
- RTT, jitter, packet loss
- bitrate up/down estimado
- modo de conexão (badge)
- log exportável (copiar/colar)

---

## Segurança (notas)

- Free via VPN: recomendado por padrão (menor superfície exposta).
- Direct: pode exigir port-forward e expor porta — recomendável usar **room key**.
- Pro Relay: quando em relay, tráfego passa pela infra YourVoice (trade-off por compatibilidade).

