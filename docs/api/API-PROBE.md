# Achados reais da API (curl contra http://localhost:8080, seed de dev) — 2026-09-10

Isto é VERDADE OBSERVADA, tem precedência sobre o que o openapi.yaml deixa ambíguo.

## Credenciais do seed (senha igual para todos: `dev12345`)

| e-mail             | role         | id                                   |
| ------------------ | ------------ | ------------------------------------ |
| admin@stewer.dev   | ADMIN        | 22222222-0000-0000-0000-000000000001 |
| stewer@stewer.dev  | PROFISSIONAL | 22222222-0000-0000-0000-000000000002 |
| joana@exemplo.dev  | CLIENTE      | 22222222-0000-0000-0000-000000000003 |
| marcos@exemplo.dev | CLIENTE      | 22222222-0000-0000-0000-000000000004 |

tenantId padrão: `11111111-1111-1111-1111-111111111111` (login sem `tenantSlug` funciona).
profissional (ficha): `33333333-0000-0000-0000-000000000001` (usuarioId = ...0002, nome "Stewer Gabriel", especialidade "Visagismo").
serviços do seed: `44444444-...0001` Corte + Visagismo (60min, 18000), `...0002` Consultoria de Imagem (90min, 32000), `...0003` Barba (30min, 7000).

## 1. Erros — formato real

`violacoes` **NÃO** é um mapa arbitrário: cada item é exatamente `{ "campo": string, "mensagem": string }`.

Erro de validação de body volta com **HTTP 400** e `codigo: "VALIDACAO"`, **não** 422:

```json
{
  "codigo": "VALIDACAO",
  "mensagem": "Requisicao invalida",
  "status": 400,
  "timestamp": "2026-09-10T18:25:57.7874722Z",
  "violacoes": [
    { "campo": "precoCentavos", "mensagem": "precoCentavos nao pode ser negativo" },
    { "campo": "duracaoMinutos", "mensagem": "duracaoMinutos deve ser no minimo 5" },
    { "campo": "nome", "mensagem": "nome e obrigatorio" }
  ]
}
```

=> O cliente tem de tratar `violacoes` em **400 E 422**, não só 422.

422 de regra de negócio vem sem `violacoes`, só com `codigo` estável, ex.:
`{"codigo":"PROFISSIONAL_OBRIGATORIO","mensagem":"Como ADMIN, informe profissionalId para ver a agenda de alguem","status":422,...}`

404: `{"codigo":"RECURSO_NAO_ENCONTRADO","mensagem":"Servico nao encontrado: <id>","status":404,...}`

**401 e 403 vêm com CORPO VAZIO** (camada de segurança do Quarkus, não passa pelo mapper).
=> O wrapper precisa sintetizar mensagem própria para 401/403; não dá para ler `Erro.mensagem`.

401 do `/auth/login` com senha errada é a exceção, esse tem corpo:
`{"codigo":"NAO_AUTENTICADO","mensagem":"E-mail ou senha invalidos","status":401,...}`

## 2. Respostas 201 (a spec não declara schema; confirmado por curl)

| endpoint                           | corpo do 201                                                         | extra                                 |
| ---------------------------------- | -------------------------------------------------------------------- | ------------------------------------- |
| POST /auth/registrar               | `TokenResponse` completo (token + tipo + expiraEmSegundos + usuario) | —                                     |
| POST /agendamentos                 | `Agendamento` completo                                               | header `Location: /agendamentos/{id}` |
| POST /clientes/{id}/anotacoes      | `Anotacao` completa                                                  | —                                     |
| POST /profissionais                | `Profissional`                                                       | —                                     |
| POST /servicos                     | `Servico`                                                            | —                                     |
| POST /profissionais/{id}/bloqueios | `Bloqueio`                                                           | —                                     |

Campos nulos são **omitidos** do JSON (ex.: `fotoUrl`, `descricao`, `observacao`, `agendamentoId`),
então todo campo opcional tem de ser tratado como `| undefined`.

## 3. Hora de parede vs instante

`GET /profissionais/{id}/disponibilidade` devolve **`"09:00:00"` (HH:mm:ss)**.
`PUT` do mesmo recurso **aceita `"09:00"` (HH:mm)** e devolve HH:mm:ss. Confirmado.
=> Parse tem de aceitar HH:mm e HH:mm:ss; envio em HH:mm.

## 4. ⚠️ QUIRK CRÍTICO DE FUSO DA API

A API interpreta a hora de parede da grade **como UTC**. Está documentado no próprio backend
(`HorariosLivresService.java:52`: "a hora ... (LocalTime) e interpretada em UTC").

Grade do seed: seg–sáb 09:00–19:00. `GET /horarios-livres?data=2026-09-14&servicoId=...0001` devolve:
`{"inicio":"2026-09-14T09:00:00Z","fim":"2026-09-14T10:00:00Z"}` ... até `18:00Z–19:00Z`.

Ou seja o slot "09:00 da grade" chega como `09:00Z`, que em America/Sao_Paulo (UTC-3) é **06:00 local**.

Decisão do app: seguir a regra pedida (instantes exibidos no fuso do aparelho). A consequência é que
um slot de grade 09:00 aparece como 06:00 num aparelho em UTC-3. Isso é limitação da API, não do app.
O módulo de datas expõe o fuso de exibição num único ponto para virar one-liner quando a API for
corrigida para carregar o ZoneId do estabelecimento.

## 5. Papéis e gating observado

- `GET /agendamentos/agenda?data=` como PROFISSIONAL: 200, usa o profissional do token.
- Mesmo endpoint como ADMIN sem `profissionalId`: **422 PROFISSIONAL_OBRIGATORIO**.
- `GET /clientes` como CLIENTE: **403 corpo vazio**.
- `POST /profissionais` como PROFISSIONAL: **403 corpo vazio** (só ADMIN).
- `POST /servicos` como PROFISSIONAL: 403 (só ADMIN gerencia catálogo).
- `POST /clientes/{id}/anotacoes` como PROFISSIONAL: 201 (admin não anota — 422 sem ficha).

## 6. Paginação de /clientes

`GET /clientes?pagina=0&tamanho=2` devolve **array puro**, sem header de total, sem envelope.
=> Scroll infinito para quando `length < tamanho`.

## 7. Outros formatos

- `createdAt` volta às vezes com offset `-03:00`, às vezes `Z`. Ambos ISO válidos, parse genérico.
- `GET /clientes/{id}` devolve `ClienteDetalhe` com `agendamentos[]` embutido (histórico completo).
- `GET /agendamentos/meus?periodo=futuros|historico|todos` (default `todos`).
- **NÃO existe `GET /agendamentos/{id}`** — a tela de detalhe tem de usar o objeto da lista.
