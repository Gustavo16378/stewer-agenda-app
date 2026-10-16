# docs/: achados da API e mapa das telas

Material produzido em 2026-09-10 ao construir o app do zero. É **retrato daquele momento**:
quando divergir do código, o código está certo, então atualize aqui.

## api/: o que a API faz de verdade

| arquivo            | conteúdo                                                                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `API-PROBE.md`     | medido por curl contra o seed: formato real dos erros (400 com `violacoes`, 401/403 sem corpo), corpos dos 201 que a spec não declara, `horaInicio` em `HH:mm:ss`, o quirk da grade em UTC, gating por papel, paginação sem total                 |
| `CORRECOES-API.md` | achados de uma revisão adversarial lendo o backend: soft delete irreversível, `agendamentos[]` sem filtro, 404 do cliente promovido, slots passados descartados, limites de texto. **Tem precedência sobre o `openapi.yaml` onde ele é ambíguo.** |

## Mapa de telas do design

| frame                      | arquivo em `app/`                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 01 Splash                  | `index.tsx`                                                                                                               |
| 02 Acesso                  | `(auth)/entrar.tsx`, `(auth)/criar-conta.tsx`                                                                             |
| 03 Home do cliente         | `(cliente)/(tabs)/inicio.tsx`                                                                                             |
| 04 Escolha de serviço      | `(cliente)/novo-agendamento/servico.tsx`                                                                                  |
| 05 Escolha de profissional | `(cliente)/novo-agendamento/profissional.tsx`                                                                             |
| 06 Data e horário          | `(cliente)/novo-agendamento/horario.tsx`                                                                                  |
| 07 Confirmação             | `(cliente)/novo-agendamento/confirmar.tsx`                                                                                |
| 08 Meus agendamentos       | `(cliente)/(tabs)/meus-horarios.tsx`                                                                                      |
| 09 Perfil do cliente       | `(cliente)/(tabs)/perfil.tsx`                                                                                             |
| 10 Agenda do dia           | `(profissional)/(tabs)/agenda.tsx`                                                                                        |
| 11 Detalhe do agendamento  | `agendamento/[id].tsx` (cliente e profissional)                                                                           |
| 12 Disponibilidade         | `src/screens/disponibilidade.tsx` ← `(profissional)/(tabs)/disponibilidade.tsx` e `profissional/[id]/disponibilidade.tsx` |
| 13 Lista de clientes       | `(profissional)/(tabs)/clientes.tsx`                                                                                      |
| 14 Ficha do cliente        | `cliente/[id].tsx`                                                                                                        |
| 15 Dashboard               | `(admin)/(tabs)/visao-geral.tsx`                                                                                          |
| 16 Gestão de serviços      | `(admin)/(tabs)/servicos.tsx`                                                                                             |
| 17 Gestão de equipe        | `(admin)/(tabs)/equipe.tsx`                                                                                               |
| 18 Home light              | mesma tela do 03 (tema)                                                                                                   |
| 19 Data e horário light    | mesma tela do 06 (tema)                                                                                                   |

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
