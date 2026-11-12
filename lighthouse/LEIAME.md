# Lighthouse

Roda na CI (job `lighthouse`), no celular (4G lento, CPU 4x mais lenta) e no
computador, tres rodadas cada, nas telas publicas (entrar e criar conta), com a
API de verdade por tras.

| | celular | computador |
|---|---|---|
| Desempenho | aviso abaixo de 45 | reprova abaixo de 80 |
| Acessibilidade | reprova abaixo de 95 | reprova abaixo de 95 |
| Boas práticas | reprova abaixo de 90 | reprova abaixo de 90 |
| SEO | reprova abaixo de 95 | reprova abaixo de 95 |
| CLS | reprova acima de 0,1 | reprova acima de 0,1 |
| Peso total | reprova acima de 1,4 MB | reprova acima de 1,4 MB |

O desempenho no celular so avisa: o app web e o mesmo codigo do app nativo
(React Native), e o pacote de JavaScript precisa rodar inteiro antes da primeira
tela. Com a CPU 4x mais lenta do teste, isso pesa. O que ja foi feito para
diminuir: fontes recortadas em woff2 (de 8 MB para menos de 1 MB), date-fns
importado por funcao (o pacote caiu de 4,0 para 2,7 MB) e o aviso de celular
fora do pacote da web. O proximo passo seria dividir o pacote por tela.

Para rodar na mao:

```bash
npm run build
node e2e/servidor.mjs dist 4173 &
npx @lhci/cli autorun --config=lighthouse/celular.json
```
