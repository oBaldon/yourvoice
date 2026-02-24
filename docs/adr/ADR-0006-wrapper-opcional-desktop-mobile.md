# ADR-0006 — Web primeiro, wrapper opcional (desktop/mobile)

**Status:** Aceito

## Decisão
Começar como **web puro** e considerar wrappers (ex.: Tauri) apenas se houver necessidade real (ex.: PTT global).

## Contexto
Há interesse futuro em desktop dedicado e mobile, mas o MVP precisa ser leve e simples.

## Consequências
- MVP permanece simples e fácil de distribuir.
- Wrappers podem ser adicionados sem mudar a arquitetura do backend.

