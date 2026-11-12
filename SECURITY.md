# Segurança

## Como reportar

Achou uma falha? Não abra issue pública. Escreva para **gustavo@gustavodev.dev** com o
passo a passo para reproduzir. A resposta vem em até 3 dias úteis.

## O que o app faz

- **CSP restrita**: só o script do próprio app roda; imagens e chamadas só para o app, a
  API e o mapa. Gerada a cada build em `dist/_headers` (ver `scripts/web-pos-build.mjs`).
- **Cabeçalhos**: `nosniff`, `X-Frame-Options: DENY`, HSTS, `Referrer-Policy`,
  `Permissions-Policy`.
- **Sessão**: token no armazenamento seguro do aparelho (no navegador, no
  `localStorage`), nunca na URL; some ao sair; papel mudou desde o login, o app pede
  para entrar de novo.
- **Texto do usuário** sempre como texto (React escapa), nunca como HTML.
- **Quem pode o quê** é decidido pela API; as guardas de rota do app só evitam mostrar
  uma tela que falharia. A matriz de acesso da API está no repositório dela.

Os testes estão em [`e2e/jornadas/seguranca.spec.ts`](e2e/jornadas/seguranca.spec.ts) e
o plano completo em [`docs/testes.md`](docs/testes.md).
