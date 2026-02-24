# ADR-0004 — Conectividade em camadas (Direct → VPN → Relay Pro)

**Status:** Aceito

## Decisão
O app adota conectividade em camadas:
1) **Direct (Free)** — tentativa padrão (direct-first)
2) **VPN/Overlay (Free / recomendado)** — caminho robusto para CGNAT/pior caso
3) **Relay BR (Pro / opt-in)** — fallback garantido sem VPN

## Contexto
Parte relevante do público não consegue (ou não quer) configurar rede/VPN. Ao mesmo tempo, queremos preservar o modo auto-hosteado gratuito.

## Motivação
- Maximizar adesão: atender A (VPN ok) e B (clicou e entrou) sem quebrar o auto-host.
- Manter a melhor latência possível quando Direct/VPN “direct” está disponível.
- Oferecer compatibilidade máxima (Pro) com transparência.

## Consequências
- Em modo Pro, quando cair em relay, tráfego passa pela infra YourVoice (trade-off por compatibilidade).
- A UI precisa indicar claramente o modo: **Direct / VPN / Relay (Pro)**.
