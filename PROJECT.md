# YourVoice — PROJECT.md

Este documento transforma o planejamento do `README.md` em um plano executável: **milestones**, **issues (checklists)** e uma **matriz de critérios de aceite por semana**, já alinhado com a lógica de conectividade e mercado:

- **Free:** **Direct-first** + **VPN/Overlay recomendado**
- **Pro:** **YourVoice Relay BR (opt-in)** para “funciona sempre” sem VPN

> Regra de ouro do produto: **UI + Sinalização + SFU rodam sempre no host (auto-host obrigatório)**.  
> A YourVoice só entra como infra **opcional** para conectividade no modo **Pro**.

---

## Princípios (do README/ADRs)

- Cliente **web puro**
- Host **auto-hosteado** (UI + WS + SFU no PC do host)
- **Sinalização via WebSocket**
- **SFU forward-only** (sem mixagem/transcode)
- Foco em grupos **2–5** (baixa latência + baixo impacto em FPS)
- Conectividade em camadas (**Direct → VPN → Relay Pro**)
  - **Direct-first** sempre
  - **VPN/Overlay** como opção gratuita e recomendada para CGNAT/pior caso
  - **Relay Pro** como fallback opt-in e monetizável

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
- Offer/answer/ICE trafegam via WS (mock ok)
- Rejoin automático após queda do WS

---

### Milestone 3 — WebRTC áudio mínimo (Direct P2P baseline) (Semana 3)
**Meta:** Áudio **Direct** P2P para 2 pessoas com Mute + PTT na aba.

**Issues sugeridas**
- Captura de microfone (UX + permissões)
- RTCPeerConnection P2P (offer/answer/ICE via WS)
- **Direct-first:** STUN “best effort” (config básica)
- Controles: Mute, Aberto/PTT (na aba) + persistência local
- Estabilidade (recriar peer connection em reconexão)
- Checklist manual de 30 minutos

**Critério de aceite**
- 2 pessoas se ouvem por 30+ min em cenário Direct (quando disponível)
- Mute e PTT funcionam
- Reconectar (WS) permite retomar chamada (manual ou auto)

> Nota: aqui ainda não “garantimos funcionar em CGNAT”. O objetivo é ter o **pipeline WebRTC** validado.

---

### Milestone 4 — SFU forward-only (core) (Semana 4)
**Meta:** Modelo planejado (clientes publicam 1 áudio → SFU encaminha → todos consomem).

**Issues sugeridas**
- Integrar SFU (ex.: mediasoup) por sala
- Sinalização SFU (create/connect transport, produce/consume/resume)
- UI publish/subscribe (producers/consumers)
- Limites: cap 2–5 configurável
- Teste 3–5 pessoas por 30 minutos (rede “normal”)

**Critério de aceite**
- 3–5 pessoas se ouvem com estabilidade
- Sem mixagem/transcode no host
- Reconnect de 1 cliente não derruba a sala

---

### Milestone 5 — Conectividade Free “de verdade” (VPN) + Diagnóstico (Semana 5)
**Meta:** Deixar o Free **usável no pior caso** via VPN e com diagnóstico claro.

**Issues sugeridas**
- **Connectivity Manager (Free)**
  - Estados: `Direct`, `VPN`, `Unknown` (Relay ainda não entra aqui)
  - UI/Badge por sessão: “Direct / VPN / Desconhecido”
- **Diagnóstico WebRTC**
  - getStats(): RTT/jitter/loss/bitrate
  - Log exportável (copiar/colar) com timestamps
- **UX de VPN (guiado)**
  - Texto e fluxo: “Se não conectar, use VPN/overlay”
  - Checklist curto: Tailscale/ZeroTier/Hamachi + “abrir pelo IP/hostname da VPN”
- Documentar interpretação do diagnóstico (o que fazer quando piorar)
- Testes: cenários com VPN/overlay (manual + checklist)

**Critério de aceite**
- Free funciona de forma repetível em CGNAT via VPN/overlay
- App mostra claramente modo **Direct/VPN**
- Stats refletem degradação (throttling) e log exportável ajuda troubleshooting

---

### Milestone 6 — Pro: YourVoice Relay BR (TURN/relay) + Operação + CI (Semana 6)
**Meta:** Entregar o modo Pro como **opt-in** (“sem VPN, conecta em rede difícil”) e fechar pacote de release.

**Issues sugeridas**
- **YourVoice Relay BR (MVP)**
  - Serviço de credenciais TURN (tokens curtos) `GET /turn-credentials`
  - Lista de `iceServers` retornada ao cliente (somente quando Pro ativo)
  - Config no client: **Direct-first**, relay só se necessário
  - UI/Badge: `Relay (Pro)` visível quando em uso
- **Entitlement básico (MVP de monetização)**
  - Chave/assinatura simples por host (ex.: `PRO_KEY={{PLACEHOLDER}}`) — sem billing completo ainda
  - Rate limit + quotas básicas (por chave)
- **Hardening**
  - validação de origin/host
  - rate limit refinado
  - limites de sala por config
  - defaults seguros (não expor publicamente por padrão)
- **Testes automatizados**
  - k6 smoke (WS join/leave + reconnect)
  - (opcional) teste sintético “forçar relay” em ambiente controlado
  - CI (GitHub Actions): build + smoke
- **Release checklist**
  - versão `v0.1.0`
  - README operacional atualizado (Direct / VPN / Pro Relay)

**Critério de aceite**
- Pro Relay conecta em cenário “rede restritiva” sem exigir VPN (quando direct falhar)
- App mostra claramente quando está em `Relay (Pro)`
- CI passa e smoke é reproduzível
- Documentação explica trade-offs (latência vs compatibilidade)

---

## Matriz de critérios de aceite (por semana)

| Semana | Foco | Critérios de aceite (objetivos) |
|---|---|---|
| 1 | Base executável | `docker compose up --build` OK; UI abre; WS ecoa e reconecta; payload limit e headers mínimos |
| 2 | Sinalização + sala | Rooms consistentes; join/leave; rejoin após queda; schema/validação; smoke join/leave |
| 3 | WebRTC Direct baseline | 2 peers 30+ min (quando direct disponível); Mute/PTT; reconexão retoma chamada |
| 4 | SFU | 3–5 estável; forward-only; reconnect não derruba sala; cap 2–5 |
| 5 | Free robusto via VPN + diagnóstico | Funciona em CGNAT via VPN; badge `Direct/VPN`; stats + log exportável |
| 6 | Pro Relay BR + release | Pro conecta sem VPN quando direct falha; badge `Relay (Pro)`; quotas/rate limit; k6+CI OK; README completo |

---

## Convenções de Issues

### Labels sugeridas
- `type:feature`, `type:bug`, `type:chore`, `type:docs`, `type:spike`
- `area:web`, `area:server`, `area:infra`, `area:webrtc`, `area:sfu`, `area:connectivity`, `area:pro`
- `milestone:1` … `milestone:6`
- `priority:P0` (blocker), `priority:P1`, `priority:P2`

### Definition of Done (DoD)
- Checklist completa
- Critério de aceite validado (passos reproduzíveis)
- Documentação mínima atualizada (quando aplicável)
- Sem segredos em repo (use `{{PLACEHOLDER}}`)
- Se tocar em conectividade: **Direct-first** preservado e modo exibido na UI

---

## Smoke tests (padrão)

### WS
1. Conectar → join room → trocar mensagens
2. Derrubar rede/fechar aba → reconectar
3. Rejoin automático e estado consistente

### Áudio (Direct / VPN)
1. 2 participantes → validar áudio
2. Mute/PTT
3. Reconexão e retomada

### SFU
1. 3–5 participantes entram e saem
2. Reconectar 1 participante
3. Sala segue de pé

### Pro Relay
1. Habilitar Pro
2. Forçar cenário onde direct falha (rede restritiva ou ambiente de teste)
3. Confirmar `Relay (Pro)` no badge e áudio funcionando

---

## Roadmap pós-MVP (backlog)

- Billing completo (Stripe) + metering por GB/minuto/sala
- Ajustes de bitrate na UI
- Melhorias de perf e redução de re-renders
- “Room key” (evitar acesso acidental dentro da VPN e no modo Pro)
- Wrapper desktop (Tauri) apenas se PTT global for indispensável
- Multi-região do Relay (SP + outra região BR) se Pro crescer

---

## ADRs (projeto)

- ADR: Cliente web puro
- ADR: Host auto-hosteado
- ADR: SFU forward-only
- **ADR: Conectividade em camadas (Direct → VPN → Relay Pro opt-in)**
  - Direct-first sempre
  - VPN recomendado no Free
  - Relay BR é produto Pro (trade-off: compatibilidade vs latência/custo)