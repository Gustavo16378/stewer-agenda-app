# docs/ — análise do design e achados da API

Material produzido em 2026-09-10 ao construir o app do zero. É **retrato daquele momento**:
quando divergir do código, o código está certo — atualize aqui.

## api/ — o que a API faz de verdade

| arquivo            | conteúdo                                                                                                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API-PROBE.md`     | medido por curl contra o seed: formato real dos erros (400 com `violacoes`, 401/403 sem corpo), corpos dos 201 que a spec não declara, `horaInicio` em `HH:mm:ss`, o quirk da grade em UTC, gating por papel, paginação sem total |
| `CORRECOES-API.md` | achados de uma revisão adversarial lendo o backend: soft delete irreversível, `agendamentos[]` sem filtro, 404 do cliente promovido, slots passados descartados, limites de texto. **Tem precedência sobre os specs de tela.**    |

## design/ — extração do `design/Stewer Gabriel App.dc.html`

| arquivo                   | conteúdo                                                                                                                                                       | confiança                                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `tokens.md`               | todas as cores, escalas de alfa, fontes, tamanhos, trackings, raios, ritmo de espaçamento; a proposta de `tailwind.config` + `global.css`                      | alta (conferida por script nos dois sentidos); os pares light marcados "(extrapolado)" não existem no design |
| `components.md`           | 41 componentes com o CSS literal de cada estado, e 22 pegadinhas de React Native (letterSpacing em px, fontWeight vs fontFamily, grid, rotate, dashed+radius…) | alta                                                                                                         |
| `navigation.md`           | tab bars por papel, fluxos, árvore de rotas proposta (é a que foi implementada), como alimentar o detalhe sem `GET /agendamentos/{id}`                         | alta                                                                                                         |
| `screens-cliente.md`      | frames 01–09, elemento a elemento                                                                                                                              | alta                                                                                                         |
| `screens-profissional.md` | frames 10–14                                                                                                                                                   | **layout e textos sim; as seções de API são INVENTADAS** — há um aviso no topo com a tabela errado→certo     |
| `screens-admin-light.md`  | frames 15–17 e a tabela dark→light dos frames 18–19                                                                                                            | alta                                                                                                         |
| `api-map.md`              | tela → endpoint → campo, e as lacunas por tela                                                                                                                 | boa; erros pontuais nos frames 14/16/17 (confundiu `ativo` com soft delete) corrigidos em `CORRECOES-API.md` |

## Mapa de frames do design

Linhas do `.dc.html` (ler com `sed -n 'A,Bp'`, as linhas são enormes):

| frame                      | linhas  | arquivo em `app/`                                                                                                         |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| 01 Splash                  | 49–63   | `index.tsx`                                                                                                               |
| 02 Acesso                  | 64–85   | `(auth)/entrar.tsx`, `(auth)/criar-conta.tsx`                                                                             |
| 03 Home do cliente         | 86–124  | `(cliente)/(tabs)/inicio.tsx`                                                                                             |
| 04 Escolha de serviço      | 125–145 | `(cliente)/novo-agendamento/servico.tsx`                                                                                  |
| 05 Escolha de profissional | 146–170 | `(cliente)/novo-agendamento/profissional.tsx`                                                                             |
| 06 Data e horário          | 171–230 | `(cliente)/novo-agendamento/horario.tsx`                                                                                  |
| 07 Confirmação             | 231–256 | `(cliente)/novo-agendamento/confirmar.tsx`                                                                                |
| 08 Meus agendamentos       | 257–290 | `(cliente)/(tabs)/meus-horarios.tsx`                                                                                      |
| 09 Perfil do cliente       | 291–328 | `(cliente)/(tabs)/perfil.tsx`                                                                                             |
| 10 Agenda do dia           | 334–366 | `(profissional)/(tabs)/agenda.tsx`                                                                                        |
| 11 Detalhe do agendamento  | 367–400 | `agendamento/[id].tsx` (cliente e profissional)                                                                           |
| 12 Disponibilidade         | 401–440 | `src/screens/disponibilidade.tsx` ← `(profissional)/(tabs)/disponibilidade.tsx` e `profissional/[id]/disponibilidade.tsx` |
| 13 Lista de clientes       | 441–472 | `(profissional)/(tabs)/clientes.tsx`                                                                                      |
| 14 Ficha do cliente        | 473–504 | `cliente/[id].tsx`                                                                                                        |
| 15 Dashboard               | 510–559 | `(admin)/(tabs)/visao-geral.tsx`                                                                                          |
| 16 Gestão de serviços      | 560–590 | `(admin)/(tabs)/servicos.tsx`                                                                                             |
| 17 Gestão de equipe        | 591–630 | `(admin)/(tabs)/equipe.tsx`                                                                                               |
| 18 Home light              | 636–674 | mesma tela do 03 (tema)                                                                                                   |
| 19 Data e horário light    | 675–764 | mesma tela do 06 (tema)                                                                                                   |

## Lacunas conhecidas (controle desabilitado + `TODO(API)` no código)

`grep -rn "TODO(API)" app src` é a lista viva. Resumo do que faltaria na API:

- remarcar (`PATCH /agendamentos/{id} { inicio }`) — frames 03 e 11
- editar o próprio perfil (`PUT /auth/eu`) e preferências de lembrete — frame 09
- `Usuario.createdAt` para "CLIENTE DESDE" — frames 09/14
- total e `ultimaVisita` em `GET /clientes` — frame 13
- editar/apagar anotação (`PUT/DELETE …/anotacoes/{id}`) — frame 14
- agendar em nome de terceiro (`clienteId` no `POST /agendamentos`) — frame 14
- convite de profissional por e-mail / listar usuários sem ficha — frame 17
- upload de foto — frames 05/17
- `primeiraVisita` no `Agendamento` — frame 10
- relatório agregado (`GET /relatorios/semana`) — frame 15 hoje agrega no app
- motivo do horário indisponível em `horarios-livres` — frame 06

Desvios de design assumidos: login por senha (não OTP), sem tela de sucesso após confirmar,
formulários (serviço, ficha, horário, bloqueio, anotação) são modais não desenhados, SAIR
acrescentado no cabeçalho do profissional, linha "Tema escuro" acrescentada no perfil.
