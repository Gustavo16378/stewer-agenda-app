# stewer-agenda-app — guia para quem chega agora

App mobile do estúdio de visagismo **Stewer Gabriel**, cliente da `../stewer-agenda-api`
(Quarkus, REST + JWT, multi-tenant). Expo SDK 57 · RN 0.86 · TypeScript strict · Expo Router ·
NativeWind 4 + Tailwind 3 · TanStack Query 5 · openapi-fetch · date-fns. Tudo em pt-BR:
nomes, comentários, textos.

Estado (2026-09-18): 17 telas do design implementadas para os 3 papéis, `tsc`/`lint`/136 testes
verdes, bundle Android e web compilando, smoke web logando com as 3 contas do seed. Sem build
EAS ainda; ícone e splash são placeholders.

## Fontes de verdade, nesta ordem

1. `openapi.yaml` — contrato dos dados. `src/api/schema.d.ts` é **gerado** dele (`npm run api:types`); nunca editar.
2. `docs/api/API-PROBE.md` e `docs/api/CORRECOES-API.md` — o que a API **realmente** faz onde a spec é ambígua ou errada (medido por curl e lendo o backend). Têm precedência sobre qualquer spec de tela.
3. `design/Stewer Gabriel App.dc.html` — fonte visual. Linhas longuíssimas: ler com `sed -n 'A,Bp'`, não com Read. Mapa de frames em `docs/README.md`.
4. `docs/design/*.md` — análise do design (tokens exatos, componentes, navegação, tela a tela). **Atenção:** `screens-profissional.md` mapeou os frames 10–14 contra uma API inventada; use só o layout/textos dele, nunca os endpoints.

## Comandos

```bash
npm start            # Metro; QR para o Expo Go
npm run typecheck    # tsc --noEmit
npm run lint         # ESLint + Prettier (--max-warnings=0)
npm test             # Jest (TZ fixo em America/Sao_Paulo, ver jest.global-setup.js)
npm run format
npm run api:types    # regera src/api/schema.d.ts a partir do openapi.yaml
npm run smoke:web    # exporta web, sobe servidor, loga com os 3 papéis no Chrome (API precisa estar no ar)
```

API local: `cd ../stewer-agenda-api && ./mvnw quarkus:dev` (Postgres em Docker, `stewer-agenda-db`).
Contas do seed (senha `dev12345`): `admin@stewer.dev` ADMIN · `stewer@stewer.dev` PROFISSIONAL ·
`joana@exemplo.dev` / `marcos@exemplo.dev` CLIENTE. `.env` precisa do IP da máquina na Wi‑Fi
(`localhost` não funciona no celular) — ver `.env.example`.

## Regras inegociáveis

1. **Data/hora só por `src/lib/datetime.ts`.** Nunca `toISOString().slice(0,10)`, `toLocale*`, template de data na tela. Faltou formato? Adicione lá, com teste.
   - `inicio`/`fim`/`createdAt`/bloqueios/slots = **instante** (ISO com offset): exibe no fuso do aparelho, envia `toInstant()`.
   - `horaInicio`/`horaFim` da grade = **hora de parede**: `parseWallTime` (aceita `HH:mm:ss`, devolve `HH:mm`). Nunca passa por `Date`.
   - `?data=` = **dia de calendário local** `YYYY-MM-DD`: `toCalendarDate` / `hojeCalendarDate`.
   - `diaSemana` 0=domingo…6=sábado, igual `Date.getDay()`.
2. **Preço é inteiro em centavos.** `formatCentavos`, `parseCentavos`, `somaCentavos` (`src/lib/money.ts`). Nunca float.
3. **Nunca inventar endpoint ou campo.** Controle que o design pede e a API não sustenta: montar igual ao design, `disabled`, e `// TODO(API): <método + path + request/response que faltaria>`. `grep -rn "TODO(API)" app src` lista as lacunas atuais.
4. **Telas só falam com a API por `src/api/hooks.ts`** (TanStack Query). Nunca `api.GET` direto numa tela.
5. **Cor só por token semântico** (`bg-canvas`, `text-ink`, `text-gold`, `border-divider`, `text-ink/48`…). Valores vivem em `src/styles/global.css` (`:root` light, `.dark:root` dark); `tailwind.config.js` só dá nomes. Nada de `#hex`/`rgba` em tela, nada de `dark:` — os tokens trocam sozinhos.
6. **Caps por `LabelCaps`** (`src/components/ui/texto.tsx`). Tamanho e tracking têm de estar no MESMO `<Text>`: o NativeWind resolve o `em` do `letterSpacing` pelo `fontSize` do próprio elemento. Peso por `fontFamily` (`font-sans-semibold`), nunca `fontWeight`.
7. **Toda tela ligada à API tem 3 estados**: `Carregando`, `EstadoErro` (com `aoTentarDeNovo`), `EstadoVazio` (`src/components/ui/estados.tsx`).
8. **Erro de validação vai para o campo**: `erro.violacaoDe('nome')` no prop `erro` do `<Campo>`; erro sem violação vira uma linha vermelha. Ver `app/(auth)/entrar.tsx`.
9. Textos da interface **literais do design**, com acento. Comentários explicam o porquê, não o quê.
10. Design status bar (9:41) e home indicator são artefato de mockup — não reimplementar; `Tela`/`TelaRolavel` usam safe-area real.

## Papéis (o guarda de rota já aplica; a API é quem barra de verdade)

- `GET /agendamentos/agenda`: **ADMIN precisa de `profissionalId`** (senão 422 `PROFISSIONAL_OBRIGATORIO`); PROFISSIONAL não manda (usa o do token). `useAgendaDoDia` já trata.
- Catálogo (`/servicos` escrita) e equipe (`/profissionais` escrita): só ADMIN.
- Anotações: só PROFISSIONAL escreve (ADMIN → 422). `GET /clientes*`: PROFISSIONAL + ADMIN (CLIENTE → 403).
- CLIENTE só vê os próprios agendamentos e só consegue `CANCELADO` no PATCH de status.
- O token traz `usuarioId`; o `profissionalId` da ficha vem de `useMeuProfissional()`.

## Quirks reais da API (não tente "compensar" na tela)

- **Grade tratada como UTC** (`HorariosLivresService.java:52`): slot 09:00 chega `09:00Z` → aparece 06:00 em UTC‑3. App está certo; conserto é na API.
- **401 e 403 vêm sem corpo**; validação vem em **400** `codigo: VALIDACAO` com `violacoes: [{campo, mensagem}]` (a spec diz 422). `src/api/errors.ts` normaliza tudo.
- **Não existe `GET /agendamentos/{id}`**: o detalhe usa o objeto da lista — semear com `useSemearAgendamento()` antes do push; `useAgendamento` refaz a lista de origem se o cache estiver frio.
- `DELETE` de serviço/profissional é soft delete **irreversível** (some até de `incluirInativos=true`). "Desativar" reversível é `PUT` com `ativo:false`.
- `GET /clientes` é paginado mas devolve **array puro sem total**: acabou quando vier menos que `tamanho`.
- `ClienteDetalhe.agendamentos[]` vem **sem filtro** (todos os status, futuros também): histórico/visitas filtram `CONCLUIDO`.
- `GET /clientes/{id}` responde 404 para cliente promovido a profissional.
- Sem refresh token: guardamos o instante de expiração (`expiraEmSegundos`) junto do JWT no SecureStore.
- Sem CORS (só afeta o smoke web, que roda o Chrome com `--disable-web-security`).

## Onde está cada coisa

```
app/                      rotas (o arquivo é a rota); grupos (auth) (cliente) (profissional) (admin)
src/api/                  config · client (middleware Bearer/401) · errors · session-store · queries · hooks · types
src/auth/                 auth-context (sessão) · guarda (papel por grupo)
src/components/ui/        botao · campo · tela · texto (LabelCaps/Titulo) · tab-bar · superficies · estados · imagem · interruptor · losango · cabecalho
src/lib/                  datetime ⚠️ · money · cn
src/screens/              telas reusadas por mais de uma rota (disponibilidade)
src/styles/global.css     tokens de cor (variáveis CSS, par dark/light)
src/theme/                fonts (Playfair/Inter via expo-font) · theme-context (segue o sistema + toggle)
docs/                     análise do design e achados da API (índice em docs/README.md)
scripts/e2e/              smoke web com puppeteer-core + Chrome do sistema
```

Mapa frame → arquivo e a lista de lacunas por tela: `docs/README.md`.

## Antes de encerrar qualquer mudança

`npm run typecheck && npm run lint && npm test`. Mexeu em tela/rota/tema? `npx expo export --platform android --output-dir .expo/tmp` compila o bundle de verdade (apague depois). Com a API no ar, `npm run smoke:web`.
Não rode `eas build` nem publique nada sem o Gustavo pedir.
