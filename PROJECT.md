# YourVoice — PROJECT.md

Este documento transforma o planejamento do `README.md` em um plano executável: **milestones**, **issues (checklists)** e uma **matriz de critérios de aceite por semana**.

## Princípios (do README/ADRs)
- Cliente **web puro**
- Host **auto-hosteado** (sem servidor central)
- **Sinalização via WebSocket**
- **SFU forward-only** (sem mixagem/transcode)
- Operação por **VPN/overlay** (Tailscale/ZeroTier/Hamachi)
- Foco em grupos **2–5** (baixa latência + baixo impacto em FPS)

---

## Como usar este PROJECT.md
1. Crie **1 milestone por semana** (ou por fase) no GitHub.
2. Crie issues usando os **Issue Templates** em `.github/ISSUE_TEMPLATE/`.
3. Cada issue deve ter:
   - **Escopo fechado** (o que entra e o que não entra)
   - **Checklist de tarefas**
   - **Critério de aceite** (testável)
   - **Smoke test** (passo-a-passo para validar)

---

## Milestones (6 semanas)

### Milestone 1 — Base executável (Semana 1)
**Meta:** `docker compose up --build` + UI abre + WS conecta/eco/reconecta.

**Issues sugeridas**
- Scaffold monorepo (apps/web + apps/server)
- Docker infra (compose + Dockerfiles + healthchecks)
- Reverse proxy (Caddy) + WS upgrade
- Server mínimo (`/healthz` + WS echo + logs)
- Web mínimo (Sala, Nome, Entrar + status)
- Hardening mínimo (payload limit + rate limit + headers)

**Critério de aceite**
- Compose sobe limpo; healthchecks ok
- UI acessível no browser
- WS conecta, ecoa e reconecta após queda

---

### Milestone 2 — Sinalização real + modelo de sala (Semana 2)
**Meta:** Rooms e protocolo de sinalização definidos e funcionando (sem áudio).

**Issues sugeridas**
- Protocolo de sinalização v1 (mensagens tipadas + validação)
- Estado de sala no server (join/leave/peers + heartbeat)
- UI de sala (lista de participantes + controles mock)
- Reconexão + rejoin automático
- Testes smoke (join/leave + reconexão)

**Critério de aceite**
- 2+ clientes entram na mesma sala e veem peers
- Offer/answer/ICE trafegam via WS (mesmo que ainda mock)
- Rejoin automático após queda do WS

---

### Milestone 3 — WebRTC áudio mínimo (P2P baseline) (Semana 3)
**Meta:** Áudio P2P para 2 pessoas com Mute + PTT na aba.

**Issues sugeridas**
- Captura de microfone (UX + permissões)
- RTCPeerConnection P2P (offer/answer/ICE via WS)
- Controles: Mute, Aberto/PTT (na aba) + persistência local
- Estabilidade (recriar peer connection em reconexão)
- Checklist manual de 30 minutos

**Critério de aceite**
- 2 pessoas se ouvem por 30+ min
- Mute e PTT funcionam
- Reconectar (WS) permite retomar chamada (manual ou auto)

---

### Milestone 4 — SFU forward-only (core) (Semana 4)
**Meta:** Modelo planejado (clientes publicam 1 áudio → SFU encaminha → todos consomem).

**Issues sugeridas**
- Integrar SFU (ex.: mediasoup) por sala
- Sinalização SFU (create/connect transport, produce/consume/resume)
- UI publish/subscribe (producers/consumers)
- Limites: cap 2–5 configurável
- Teste 3–5 pessoas por 30 minutos

**Critério de aceite**
- 3–5 pessoas se ouvem com estabilidade
- Sem mixagem/transcode no host
- Reconnect de 1 cliente não derruba a sala

---

### Milestone 5 — Diagnóstico de rede e qualidade (Semana 5)
**Meta:** Stats úteis em tempo real + log exportável para troubleshooting.

**Issues sugeridas**
- Painel getStats(): RTT/jitter/loss/bitrate
- Indicador de qualidade (bom/ok/ruim)
- Log exportável (copiar/colar) com timestamps
- “Speaking” básico (detector simples)
- Documentar interpretação (o que fazer quando piorar)

**Critério de aceite**
- Stats atualizam e refletem degradação (throttling)
- Log exportável ajuda a comparar sessões

---

### Milestone 6 — Operação real (VPN/CGNAT) + hardening + testes (Semana 6)
**Meta:** pronto para uso semanal via VPN/overlay + automação de smoke/CI.

**Issues sugeridas**
- README operacional (host + amigos) com foco em VPN
- (Opcional) Cloudflare Tunnel via compose
- Hardening: origin/host, rate limit, caps e defaults seguros
- k6 smoke (WS join/leave + reconnect)
- CI (GitHub Actions): build + smoke
- Release checklist v0.1.0

**Critério de aceite**
- Host atrás de CGNAT funciona via IP/hostname da VPN
- Sessão 30–60 min com 3–5 sem quedas frequentes
- CI passa e smoke é reproduzível

---

## Matriz de critérios de aceite (por semana)

| Semana | Foco | Critérios de aceite (objetivos) |
|---|---|---|
| 1 | Base executável | `docker compose up --build` OK; UI abre; WS ecoa e reconecta; payload limit e headers mínimos |
| 2 | Sinalização + sala | Rooms consistentes; join/leave; rejoin após queda; schema/validação; smoke join/leave |
| 3 | Áudio P2P | 2 peers 30+ min; Mute/PTT funcionam; reconexão retoma chamada |
| 4 | SFU | 3–5 estável; forward-only; reconnect não derruba sala; cap 2–5 |
| 5 | Diagnóstico | getStats (RTT/jitter/loss/bitrate); indicador qualidade; log exportável |
| 6 | Operação real | VPN/CGNAT OK; hardening; k6 smoke + CI; README operacional completo |

---

## Convenções de Issues

### Labels sugeridas
- `type:feature`, `type:bug`, `type:chore`, `type:docs`, `type:spike`
- `area:web`, `area:server`, `area:infra`, `area:webrtc`, `area:sfu`
- `milestone:1` … `milestone:6`
- `priority:P0` (blocker), `priority:P1`, `priority:P2`

### Definition of Done (DoD)
- Checklist completa
- Critério de aceite validado (passos reproduzíveis)
- Documentação mínima atualizada (quando aplicável)
- Sem segredos em repo (use `{{PLACEHOLDER}}`)

---

## Smoke tests (padrão)
- **WS:** conectar → join room → trocar mensagens → derrubar rede → reconectar → rejoin
- **Áudio:** 2+ participantes → validar mute/PTT → validar reconexão
- **SFU:** 3–5 participantes → entrar/sair → reconectar 1 participante → sala segue de pé

---

## Roadmap pós-MVP (backlog)
- Ajustes de bitrate na UI
- Melhorias de perf e redução de re-renders
- “Room key” (evitar acesso acidental dentro da VPN)
- Wrapper desktop (Tauri) apenas se PTT global virar requisito
