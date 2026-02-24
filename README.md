![YourVoice banner](assets/banner.png)

Chat de voz **auto-hosteado** para grupos pequenos, pensado para uso durante jogos: **latência mínima**, **impacto mínimo em FPS** e **sem servidor público obrigatório**.

O **host** (um amigo) roda **a interface web + sinalização + SFU** na própria máquina. Os demais entram pelo navegador.

> **Conectividade (do mais fácil ao mais “pesado”)**
> 1) **Direct (Free):** tenta conectar direto, “como LAN” pela internet  
> 2) **VPN/Overlay (Free / recomendado):** “Minecraft via VPN” (Tailscale/ZeroTier/Hamachi)  
> 3) **YourVoice Relay BR (Pro / opt-in):** sem VPN, com fallback garantido via relay no Brasil

---

## Objetivos

- Voz em tempo real com latência baixa (limitada principalmente pela rede)
- Cliente extremamente leve (preservar FPS)
- **Auto-host obrigatório:** UI + SFU sempre do lado do host
- Conectividade robusta em cenário “pior caso” (CGNAT, NAT chato, redes restritivas)
- Simplicidade: subir, compartilhar link/endereço, entrar

## Não objetivos (MVP)

- Escalar para dezenas de pessoas
- Gravação e armazenamento de áudio
- Mixagem/transcodificação no servidor
- Recursos “social” (avatars, chat de texto, feeds etc.)

---

# Como funciona (visão rápida)

## Modos de conexão

### 1) Direct (Free)
Você tenta conectar **direto** com o host, como se estivesse em uma LAN — funciona melhor quando:
- o host tem IP público / port-forward, ou
- a rede permite traversal de UDP sem complicações.

**Prós:** menor latência possível, zero setup extra.  
**Contras:** não funciona em boa parte dos cenários “pior caso”.

---

### 2) VPN/Overlay (Free / recomendado)
O modelo “Minecraft via VPN”: host e amigos entram numa VPN/overlay (Tailscale/ZeroTier/Hamachi) e acessam o host pelo **IP/hostname da VPN**.

**Prós:** ótimo para CGNAT; mantém tudo auto-hosteado; geralmente estável.  
**Contras:** exige instalar/entrar na VPN; às vezes a VPN pode cair em relay (latência sobe).

---

### 3) YourVoice Relay BR (Pro / opt-in)
Para quem quer **“clicou e entrou”** sem VPN — ou está em redes que quebram o direct — oferecemos um **relay de conectividade no Brasil** (TURN/relay) como fallback.

**Importante:**
- **O host continua sendo o host.** UI + sinalização + SFU rodam no PC do amigo.
- O relay é **opcional e explicitamente ativado** (modo Pro).
- O relay **só entra quando necessário** (direct-first).  

**Prós:** conecta em redes difíceis sem VPN; melhor experiência para convidados casuais.  
**Contras:** pode adicionar latência quando estiver realmente em relay; depende do serviço Pro.

> Transparência no app: o YourVoice deve mostrar claramente quando está **Direct / VPN / Relay**.

---

## Arquitetura

### Componentes
- **Cliente (browser):** WebRTC nativo
- **Host (um amigo):** servidor do grupo com:
  - **HTTP** (servir a UI)
  - **Sinalização** (WebSocket) para negociação/controle
  - **SFU forward-only** para encaminhar áudio (sem mixagem/transcode)
- **Conectividade:** Direct, VPN/overlay, ou Relay (Pro)

### Por que SFU forward-only
- O host **não mixa** e **não transcodifica**
- O host basicamente **encaminha fluxos**
- CPU do host permanece baixa; gargalo tende a ser **upload**
- O cliente continua leve: WebRTC nativo faz o trabalho pesado de forma otimizada

---

## Diagrama (alto nível)

```mermaid
flowchart TD
  subgraph Clients["Clientes (2–5)"]
    C1["Cliente A (WebRTC)"]
    C2["Cliente B (WebRTC)"]
    C3["Cliente C (WebRTC)"]
  end

  subgraph Host["Host (um amigo)"]
    H["YourVoice Host<br/>HTTP + WebSocket + SFU (forward-only)"]
  end

  VPN["VPN/Overlay (Free)<br/>Tailscale/ZeroTier/Hamachi"]
  RELAY["YourVoice Relay BR (Pro)<br/>(TURN/relay fallback)"]

  %% Direct path
  C1 -->|"Direct (ideal)"| H
  C2 -->|"Direct (ideal)"| H
  C3 -->|"Direct (ideal)"| H

  %% VPN path
  C1 <-->|"IP da VPN"| VPN
  C2 <-->|"IP da VPN"| VPN
  C3 <-->|"IP da VPN"| VPN
  VPN <-->|"UDP direto (ideal) ou relay (fallback)"| H

  %% Pro Relay fallback
  C1 -.->|"se necessário"| RELAY -.-> H
  C2 -.->|"se necessário"| RELAY -.-> H
  C3 -.->|"se necessário"| RELAY -.-> H
````

---

## Áudio

* **Codec:** Opus (voz)
* **Bitrate:** moderado (ex.: 24–48 kbps por participante, ajustável)
* **VAD/DTX:** habilitar para reduzir tráfego quando não há fala
* **AEC (eco):** habilitar quando necessário (alto-falante); com headset pode ser reduzido

---

## UX mínima (MVP)

Fluxo:

1. Campo **Sala** (string simples; ex.: `amigos`)
2. Campo **Nome**
3. Botão **Entrar**
4. Controles:

   * **Mute**
   * **Modo** (Aberto/PTT)
   * **Volume global**
5. Diagnóstico (MVP+):

   * status **Direct/VPN/Relay**
   * stats básicos (RTT/jitter/packet loss)

---

## Operação (como usar)

### A) Direct (Free)

1. Host sobe o servidor localmente
2. Host compartilha `http(s)://<ip>:<porta>` (ou hostname)
3. Amigos abrem o link e entram na sala

> Nota: pode exigir configuração de rede (port-forward) dependendo do provedor/roteador.

### B) VPN/Overlay (Free / recomendado)

1. Todo mundo entra na mesma VPN/overlay (Tailscale/ZeroTier/Hamachi)
2. Host sobe o servidor escutando no IP/hostname da VPN
3. Host compartilha `http://<ip-da-vpn-do-host>:<porta>`
4. Amigos abrem o link e entram na sala

### C) YourVoice Relay BR (Pro / opt-in)

1. Host sobe o servidor normalmente
2. Amigos abrem o link do host (ou do fluxo Pro)
3. App tenta **Direct**; se falhar, habilita **Relay BR** automaticamente (se Pro estiver ativo)

---

## Troubleshooting de latência

Sintomas:

* Voz com atraso perceptível
* Cortes e “robô”

Checklist:

* Verificar no app se está em **Direct / VPN / Relay**
* Se estiver em **VPN relay** (da própria VPN), tentar:

  * outra VPN/rota, ou
  * trocar de rede (Wi-Fi vs cabo), ou
  * testar outro host
* Se estiver em **YourVoice Relay (Pro)**:

  * espere latência um pouco maior; é o trade-off da compatibilidade máxima
* Preferir headset (reduz necessidade de AEC)
* Conferir stats no app: RTT/jitter/packet loss

---

## Segurança e privacidade (premissas)

* **Free (Direct/VPN):** por padrão, o servidor fica acessível apenas para quem tem o endereço (e/ou está na VPN).
* Recomendado: **room key** (chave da sala) para evitar acessos acidentais.
* **Pro Relay:** tráfego pode passar por infra da YourVoice quando em relay (fallback).
  O app deve ser transparente sobre isso e permitir desativar.

> Nota: no modelo SFU, o **host** é um endpoint WebRTC (ele recebe e encaminha áudio). Isso é esperado porque ele está auto-hospedando a sala.

---

## Modelo de mercado (Free vs Pro)

### Free

* **Direct-first**
* **VPN/Overlay recomendado**
* Diagnóstico básico (Direct/VPN/Relay + stats)

### Pro (YourVoice Relay BR)

* **Compatibilidade máxima sem VPN**
* Relay no Brasil para reduzir RTT quando for necessário
* Pensado para convidados casuais e redes restritivas

---

## Roadmap

* MVP: sala de voz, mute, volume, modos Aberto/PTT
* Conectividade:

  * Direct-first (Free)
  * VPN/overlay guiada (Free)
  * Relay BR opt-in (Pro)
* Diagnóstico:

  * indicador + log do modo (Direct/VPN/Relay)
  * stats (RTT/jitter/packet loss)
* Qualidade:

  * ajustes simples de bitrate e VAD/DTX
* Opcional futuro:

  * wrapper desktop (apenas se PTT global for indispensável)

---

# ADRs (Architecture Decision Records)

## ADR-0001 — Cliente web puro

**Status:** Aceito
**Decisão:** Cliente web puro (browser), servido pelo host.

## ADR-0002 — Host auto-hosteado (sem servidor central obrigatório)

**Status:** Aceito
**Decisão:** Um amigo hosteia UI + sinalização + SFU localmente.

## ADR-0003 — SFU forward-only (sem mixagem/transcode)

**Status:** Aceito
**Decisão:** SFU encaminha fluxos; sem mixagem/transcode.

## ADR-0004 — Conectividade em camadas (Direct → VPN → Relay)

**Status:** Aceito
**Decisão:** O app prioriza **Direct**, recomenda **VPN** e oferece **Relay (Pro)** como fallback opt-in.

**Motivação:** Maximizar adesão (A e B) sem abandonar o auto-host e sem depender de infraestrutura central obrigatória.

**Consequências:** Em modo Pro, quando cair em relay, parte do tráfego passa pela infra da YourVoice (trade-off por compatibilidade).

## ADR-0005 — Opus + VAD/DTX + AEC sob demanda

**Status:** Aceito
**Decisão:** Opus, VAD/DTX e AEC sob demanda.

---

## MVP de validação

### Objetivo

Validar se o YourVoice entrega voz competitiva para 2–5 pessoas com:

* latência baixa e consistente
* consumo mínimo de CPU no cliente
* conectividade robusta nos modos Direct, VPN e Relay (Pro)

### Critérios de sucesso

* 30+ minutos sem quedas frequentes; reconectar sem travar
* indicador claro do modo (Direct/VPN/Relay)
* stats aceitáveis (RTT/jitter/loss) na maior parte do tempo
* onboarding simples: host sobe; amigos entram

### Cenários de teste

* Direct (quando possível)
* VPN (padrão)
* Redes restritivas (4G/hotspot / Wi-Fi corporativo) com Pro Relay