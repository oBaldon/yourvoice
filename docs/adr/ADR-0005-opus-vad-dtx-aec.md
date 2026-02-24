# ADR-0005 — Opus + VAD/DTX + AEC sob demanda

**Status:** Aceito

## Decisão
- Codec: **Opus** (voz)
- **VAD/DTX** habilitado para reduzir tráfego no silêncio
- **AEC** sob demanda (especialmente com alto-falante)

## Contexto
Precisamos boa qualidade com pouco tráfego e baixo custo computacional.

## Consequências
- Com headset, AEC pode ser reduzido.
- Com alto-falante, AEC pode aumentar custo, mas aceitável no escopo 2–5.

