# ADR-0001 — Cliente web puro

**Status:** Aceito

## Decisão
O cliente será **web puro (browser)**, servido pelo host.

## Contexto
Precisamos de um cliente extremamente leve (mínimo impacto em FPS), fácil de distribuir e com WebRTC otimizado.

## Motivação
WebRTC no browser é nativo e altamente otimizado; reduz atrito (zero instalação) e simplifica atualização (host atualiza, todos usam).

## Consequências
- PTT global fora da aba pode ser limitado.
- Permissões de microfone podem exigir interação inicial.

