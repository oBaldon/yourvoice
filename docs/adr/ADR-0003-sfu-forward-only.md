# ADR-0003 — SFU forward-only (sem mixagem/transcode)

**Status:** Aceito

## Decisão
Usar uma SFU para encaminhar fluxos de áudio, **sem mixagem** e **sem transcodificação**.

## Contexto
Queremos baixo custo de CPU no host e cliente leve, com qualidade adequada para voz em grupos 2–5.

## Motivação
Forward-only reduz complexidade e custo computacional. Gargalo tende a ser banda (upload), não CPU.

## Consequências
- Consumo de upload do host cresce conforme participantes aumentam.
- Escopo ideal inicial: 2–5.

