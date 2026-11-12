# Plano e relatório de testes · app da agenda

Como o app é verificado, o que cada suíte cobre e como rodar. Os testes da API (regras,
banco, segurança do servidor, carga) ficam no repositório
[stewer-agenda-api](https://github.com/Gustavo16378/stewer-agenda-api), em `docs/testes.md`.

## Resumo

| suíte                  | técnica      | o que roda                                                                                       | testes              |
| ---------------------- | ------------ | ------------------------------------------------------------------------------------------------ | ------------------- |
| Unitários              | caixa branca | datas, dinheiro, telefone, carteira de clientes, estúdio, sessão, cliente da API, telas isoladas | 211                 |
| Jornadas               | caixa preta  | o app de verdade no navegador, contra a API de verdade com banco, como cliente, Stewer e admin   | 36 por aparelho     |
| Aparelhos              | caixa preta  | as jornadas em iPhone, Android, computador e Safari (WebKit), e a galeria no tema escuro         | 5 filas na CI       |
| Acessibilidade         | caixa preta  | axe-core (WCAG 2 A e AA) nas telas principais                                                    | dentro das jornadas |
| Segurança no navegador | caixa preta  | CSP, script injetado, nome com HTML, token e saída                                               | 4 por aparelho      |
| Temas                  | caixa preta  | fundo em volta da tela no claro e no escuro, admin e cliente, no computador                      | 4                   |
| Lighthouse             | caixa preta  | celular e computador, telas públicas, três rodadas cada                                          | 2 telas             |

Na CI cada push roda: tipos e lint, unitários com cobertura, o build da web, a API
empacotada a partir da `main` dela, as jornadas em cinco filas paralelas (iPhone,
Android, computador, Safari, escuro) e o Lighthouse em duas. O relatório do Playwright,
com um print por passo de cada jornada, fica como artefato do job.

## As técnicas

**Caixa branca**, nos unitários (`src/**/__tests__`): cada regra isolada, com os casos
de borda. A máscara do telefone com e sem DDI, a data de nascimento impossível ou no
futuro, o ritmo de volta do cliente, o estúdio montado por cima do conteúdo padrão, o
papel lido de dentro do token, o 401 que desloga e o 5xx que não desloga.

**Caixa preta**, nas jornadas (`e2e/jornadas`): o app compilado como vai para o ar,
servido com os mesmos cabeçalhos da produção, falando com a API de verdade. Uma pessoa
cria a conta, marca, remarca e cancela; o Stewer abre a agenda, conclui, escreve na
ficha, guarda o antes e depois; o admin cuida de serviços, equipe, acesso, estúdio e
auditoria. Cada passo vira um print.

**Caixa cinza** fica no repositório da API (os testes abrem o banco depois do pedido).
Do lado do app, as jornadas usam a API para preparar o cenário (criar cliente, marcar
horário, preencher ficha) e conferem na tela o que a API devolveu.

## Segurança no navegador

O build gera o `dist/_headers` que o Cloudflare Pages aplica, e o servidor dos testes
aplica o mesmo arquivo. Assim uma regra de segurança que quebre alguma tela quebra o
teste antes de quebrar o app.

| o que             | como                                                                                                                                                                  |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSP               | só roda o script do próprio app; o único script em linha do Expo entra pelo hash, calculado a cada build. Imagens e chamadas só para o app, a API e os blocos do mapa |
| Script injetado   | o teste injeta um `<script>` na página: a CSP barra e ele não roda                                                                                                    |
| Nome com HTML     | um cliente chamado `<img src=x onerror=...>` aparece como texto, nada executa                                                                                         |
| Sessão            | o token nunca vai na URL; ao sair ele some do aparelho; tela de equipe aberta direto pelo endereço manda para o login                                                 |
| Outros cabeçalhos | `nosniff`, `DENY` (ninguém embute o app), HSTS, `Referrer-Policy`, `Permissions-Policy`                                                                               |

## Lighthouse

Configuração e orçamento em [`lighthouse/`](../lighthouse/LEIAME.md). Última medição
local (servidor com compressão, como a Cloudflare):

|                | celular | computador |
| -------------- | ------- | ---------- |
| Desempenho     | 54      | 89         |
| Acessibilidade | 100     | 100        |
| Boas práticas  | 100     | 96         |
| SEO            | 100     | 100        |
| Peso total     | 1,0 MB  | 1,1 MB     |

O ponto fraco é o desempenho no celular, porque o app web roda o mesmo código do app
nativo e o JavaScript precisa carregar inteiro antes da primeira tela. Nesta rodada o
peso caiu de 6 MB para 1 MB: fontes recortadas em woff2, date-fns importado por função,
aviso de celular fora da web. O próximo passo seria dividir o pacote por tela.

## Como rodar

```bash
npm test                 # unitários
npm run test -- --coverage
npm run build            # as jornadas usam o dist/
npx playwright test      # jornadas (precisa da API no ar em localhost:8080, perfil dev)
npx playwright test --project=desktop e2e/jornadas/seguranca.spec.ts
```

A API para as jornadas: no repositório dela, `./mvnw package -DskipTests
-Dquarkus.profile=dev` e `QUARKUS_PROFILE=dev JWT_SECRET=$(openssl rand -base64 48)
CORS_HABILITADO=true CORS_ORIGINS=http://localhost:4173 java -jar
target/quarkus-app/quarkus-run.jar`.
