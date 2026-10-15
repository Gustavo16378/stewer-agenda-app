# Stewer Gabriel — app de agendamento

App mobile do estúdio de visagismo e consultoria de imagem masculina **Stewer Gabriel**.
Cliente da [`stewer-agenda-api`](https://github.com/Gustavo16378/stewer-agenda-api)
(Quarkus, REST + JWT, multi-tenant). Clone os dois repositórios lado a lado — os comandos
abaixo assumem `stewer-agenda-api/` como pasta irmã desta.

Expo SDK 57 · React Native 0.86 · TypeScript strict · Expo Router · NativeWind 4 ·
TanStack Query 5 · openapi-fetch · date-fns

---

## Como rodar

### 1. Suba a API

```bash
cd ../stewer-agenda-api
docker compose up -d      # PostgreSQL 16
./mvnw quarkus:dev        # API em http://localhost:8080, com seed de dev
```

Confira que subiu:

```bash
curl -s -X POST http://localhost:8080/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"stewer@stewer.dev","senha":"dev12345"}'
```

**Contas do seed** (senha `dev12345` para todas):

| e-mail               | papel        | o que vê                                  |
| -------------------- | ------------ | ----------------------------------------- |
| `admin@stewer.dev`   | ADMIN        | visão geral, catálogo de serviços, equipe |
| `stewer@stewer.dev`  | PROFISSIONAL | agenda do dia, clientes, disponibilidade  |
| `joana@exemplo.dev`  | CLIENTE      | agendar, meus horários, perfil            |
| `marcos@exemplo.dev` | CLIENTE      | idem                                      |

### 2. Aponte o app para a API

```bash
cp .env.example .env
```

**No celular, `localhost` não funciona** — para o aparelho, `localhost` é o próprio
aparelho, e a requisição morre em `Network request failed`. Use o IP da sua máquina na
mesma rede Wi‑Fi:

```bash
# Windows
ipconfig                       # "Endereço IPv4" do adaptador Wi-Fi

# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'
```

e escreva no `.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.0.42:8080     # troque pelo SEU ip
```

Confirme abrindo `http://SEU_IP:8080/servicos` **no navegador do celular**. Se não
responder, libere a porta 8080 no firewall do Windows para a rede privada.

Quando usar emulador em vez de aparelho:

| destino                | URL                                          |
| ---------------------- | -------------------------------------------- |
| iOS Simulator          | `http://localhost:8080`                      |
| Emulador Android (AVD) | `http://10.0.2.2:8080` — `10.0.2.2` é o host |
| Web na própria máquina | `http://localhost:8080`                      |

`EXPO_PUBLIC_TENANT_SLUG` é opcional: omitido, a API usa o tenant padrão (que é o do seed).

### 3. Rode o app

```bash
npm install
npm start          # depois: i (iOS), a (Android), w (web)
```

### Qualidade

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint + Prettier
npm test            # Jest (jest-expo + Testing Library)
npm run format      # Prettier --write
```

---

## Estrutura de pastas

```
app/                          rotas do Expo Router (o arquivo É a rota)
  _layout.tsx                 provedores: Query, tema, auth, fontes; splash nativa
  index.tsx                   [01] splash + portão: resolve sessão e redireciona por papel
  (auth)/                     login e cadastro
    entrar.tsx                [02] aba ENTRAR
    criar-conta.tsx           [02] aba CRIAR CONTA
    _abas.tsx                 componente das abas (o "_" impede virar rota)
  (cliente)/                  área do CLIENTE (guarda de papel no _layout)
    (tabs)/                   INÍCIO · AGENDAR · MEUS HORÁRIOS · PERFIL
    novo-agendamento/         wizard de 4 passos, fora das tabs (sem tab bar, como no design)
  (profissional)/(tabs)/      AGENDA · CLIENTES · DISPONIBILIDADE
  (admin)/(tabs)/             VISÃO GERAL · SERVIÇOS · EQUIPE
  agendamento/[id].tsx        [11] detalhe — compartilhado por CLIENTE e PROFISSIONAL
  cliente/[id].tsx            [14] ficha do cliente

src/
  api/
    schema.d.ts               GERADO do openapi.yaml — não editar
    types.ts                  apelidos semânticos dos schemas gerados
    config.ts                 EXPO_PUBLIC_* (nenhuma URL hardcoded)
    client.ts                 openapi-fetch + middleware (Bearer, 401, erros)
    errors.ts                 ApiError: violações por campo, 401/403 sem corpo, rede
    session-store.ts          JWT no expo-secure-store + expiração calculada
    queries.ts                uma função por endpoint + as chaves de cache
    hooks.ts                  os hooks do TanStack Query que as telas usam
    query-client.ts           política de retry e staleTime
  auth/
    auth-context.tsx          sessão, entrar/registrar/sair, restauração ao abrir
    guarda.tsx                guarda de papel por grupo de rota
  components/ui/              os componentes do design (botão, campo, card, tab bar…)
  lib/
    datetime.ts               ⚠️ TODA data e hora passa por aqui
    money.ts                  centavos inteiros → "R$ 180,00"
    cn.ts                     junta classes condicionais
  styles/global.css           os tokens de cor (variáveis CSS, par dark/light)
  theme/
    fonts.ts                  Playfair Display + Inter (expo-font)
    theme-context.tsx         tema: segue o sistema, com toggle manual persistido

design/                       export do Claude Design (fonte de verdade visual)
openapi.yaml                  contrato da API (fonte de verdade dos dados)
tailwind.config.js            os NOMES das utilidades; os VALORES vêm do global.css
```

---

## Regenerar os tipos quando a spec mudar

O `openapi.yaml` da raiz é a fonte de verdade dos dados. Quando a API mudar:

```bash
# 1. traga a spec nova da API
curl -s http://localhost:8080/q/openapi?format=yaml -o openapi.yaml

# 2. regere os tipos
npm run api:types            # openapi-typescript openapi.yaml -o src/api/schema.d.ts

# 3. deixe o compilador apontar o que quebrou
npm run typecheck
```

`src/api/schema.d.ts` é **gerado**: não edite (está no ignore do ESLint e do Prettier).
Nada mais no app declara a forma dos dados na mão — `src/api/types.ts` só dá nomes
semânticos ao que foi gerado. Se um campo sumir da spec, o erro aparece no `tsc`, não na
tela do usuário.

> `openapi-typescript` ainda declara `peer typescript@^5`, e o Expo 57 traz o TypeScript 6.
> Por isso o `package.json` tem um `overrides` apontando o peer para o TS do projeto —
> sem ele o `npm install` falha com `ERESOLVE`.

---

## Documentação para quem chega agora

- [`CLAUDE.md`](CLAUDE.md) — o guia curto: fontes de verdade, regras inegociáveis, papéis, quirks da API, onde está cada coisa. Qualquer sessão do Claude Code lê este arquivo sozinha.
- [`docs/`](docs/README.md) — a análise completa do design (tokens exatos, 41 componentes, tela a tela) e os achados reais da API medidos por curl e lendo o backend. Inclui o mapa frame → arquivo e a lista de lacunas.

---

## Decisões que valem conhecer

### Datas: três coisas diferentes que parecem a mesma

Está tudo em [`src/lib/datetime.ts`](src/lib/datetime.ts), com testes em
[`src/lib/__tests__/datetime.test.ts`](src/lib/__tests__/datetime.test.ts).

| conceito               | campos                                                | regra                                                                                             |
| ---------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **instante**           | `inicio`, `fim`, `createdAt`, bloqueios, slots livres | ISO com offset. Exibe no fuso do aparelho, envia com `toISOString()`                              |
| **hora de parede**     | `horaInicio`, `horaFim` da grade                      | `"09:00"` é 9h no relógio do estúdio. **Não converte.** A API devolve `HH:mm:ss` e aceita `HH:mm` |
| **data de calendário** | `?data=`                                              | dia no calendário **local** do usuário, `YYYY-MM-DD`, derivado dos componentes locais             |

O erro clássico é `toISOString().slice(0,10)` para a data de calendário: em UTC‑3, às 21h
de 13/09 isso já diz `2026-09-14` e o usuário recebe a agenda do dia errado. Os testes
rodam com `TZ=America/Sao_Paulo` fixo justamente para travar esse caso — em CI rodando em
UTC o bug passaria despercebido.

### ⚠️ Quirk de fuso da API (não é bug do app)

A API interpreta a hora de parede da grade **como se fosse UTC** — está documentado no
próprio backend, em `HorariosLivresService.java:52`.

Com a grade do seed (seg–sáb, 09:00–19:00), `GET /horarios-livres` devolve slots
`09:00:00Z` … `19:00:00Z`. Num aparelho em `America/Sao_Paulo` (UTC‑3), esses instantes
são **06:00 … 16:00**.

O app está certo ao exibir o instante no fuso do aparelho — foi o comportamento pedido, e
é o correto para um instante. Mas isso significa que **um horário de 09:00 na grade
aparece como 06:00 na tela**. O conserto é na API: ela precisa carregar o `ZoneId` do
estabelecimento e montar os instantes com esse fuso. Enquanto isso não acontece, toda
formatação passa por `src/lib/datetime.ts`, que é o único ponto a mudar.

### Dinheiro

`precoCentavos` é inteiro em centavos (`int64`). Nada no app divide por 100 para
"trabalhar em reais" — a divisão só acontece na hora de escrever o texto, e por string.
Ver [`src/lib/money.ts`](src/lib/money.ts).

### Sessão

Não há refresh token. O login devolve `expiraEmSegundos`; guardamos o **instante** de
expiração junto do JWT no `expo-secure-store`. Passado esse instante o app trata como
deslogado sem nem chamar a API. Um `401` de qualquer chamada também desloga — menos no
`/auth/login`, onde `401` é só senha errada.

Ao abrir, se há token válido guardado, o app confirma com `GET /auth/eu` antes de entrar.

### Erros

`401` e `403` da API vêm com **corpo vazio** (são barrados pela camada de segurança do
Quarkus, antes do exception mapper), então a mensagem é sintetizada em
[`src/api/errors.ts`](src/api/errors.ts). Erro de validação vem em **HTTP 400** com
`codigo: "VALIDACAO"` (não 422, apesar do que a spec sugere) e `violacoes: [{campo, mensagem}]`,
que viram erro no campo certo do formulário. `422` sem violações é regra de negócio, com
`codigo` estável (`PROFISSIONAL_OBRIGATORIO`, `HORARIO_OCUPADO`, …).

### Tema

Os tokens de cor vivem uma única vez, como variáveis CSS em
[`src/styles/global.css`](src/styles/global.css): `:root` é o tema claro, `.dark:root` é o
escuro, e o `tailwind.config.js` só dá **nomes** (`bg-canvas`, `text-ink`, `text-gold`).
Nenhuma tela escreve cor literal.

Os pares dark/light não são simétricos — o divisor é `ink@.1` no escuro e `ink@.12` no
claro; e o dourado muda como **texto** (`#C9A96A` → `#A8894F`) mas **não** como borda.
Por isso token semântico, e não `dark:` repetido em cada classe.

O tema segue o sistema por padrão, com toggle manual persistido (`src/theme/theme-context.tsx`).

### Sem `GET /agendamentos/{id}`

A API não tem busca de agendamento por id. As listas (`/agendamentos/agenda` e
`/agendamentos/meus`) já devolvem o `Agendamento` completo, então a tela de detalhe usa o
objeto que veio na lista: quem navega semeia o cache (`useSemearAgendamento`) e o
`useAgendamento` cai de volta na lista de origem quando o cache está frio (deep link,
cold start, app morto pelo SO).

---

## Testes

O foco está no que mais quebra:

- **`src/lib/__tests__/datetime.test.ts`** — instante × hora de parede × data local, com
  os casos de borda perto da meia-noite em UTC‑3 (23:59:59, 00:00:00, virada de mês e de
  ano, 29 de fevereiro).
- **`src/lib/__tests__/money.test.ts`** — centavos, separador de milhar, ida e volta.
- **`src/api/__tests__/errors.test.ts`** — corpos de erro **reais**, capturados por curl
  contra o seed.
- **`src/api/__tests__/client.test.ts`** — o wrapper de ponta a ponta com `fetch` mockado:
  injeção do Bearer, 401 deslogando (e 401 do login **não** deslogando), 403 sem corpo,
  400/422 com violações indo para o campo, falha de rede, token expirado barrado antes de
  sair da máquina, e os 201 que a spec declara sem schema.

### Smoke web (ponta a ponta)

`npm run smoke:web` exporta o app para web, sobe um servidor local e, num Chrome headless,
loga com as três contas do seed e confere que a tela inicial de cada papel renderiza contra a
API real. Precisa da API no ar (na URL do `.env`) e do Chrome instalado
(`CHROME_PATH` para outro binário). As capturas vão para `scripts/e2e/capturas/`.

---

## Build

Perfis em [`eas.json`](eas.json): `development` (dev client, APK interno),
`preview` (APK interno) e `production` (loja, `autoIncrement`).

```bash
eas init          # preenche extra.eas.projectId no app.config.ts
eas build --profile preview --platform android
```

Ícone e splash em `assets/images/` são **placeholders** gerados por
`node scripts/make-placeholder-assets.mjs` (o losango dourado da marca sobre o preto do
design). Troque por arte final antes de publicar.
