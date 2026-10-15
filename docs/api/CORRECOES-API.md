# Correcoes da API achadas por revisao adversarial — TEM PRECEDENCIA SOBRE OS SPECS

Achados conferidos contra o codigo do backend (`../stewer-agenda-api/src/main/java/`)
e contra curl no seed. Se um spec disser diferente, o spec esta errado.

## 1. `DELETE` e soft delete DE VERDADE, e e IRREVERSIVEL pela API

`ServicoService.remover` / `ProfissionalService.remover` gravam `deletedAt`, e TODA
consulta passa por `vivos(...)` (`deletedAt is null`).

Consequencia: um servico ou profissional DELETADO some ate de
`GET /servicos?incluirInativos=true`, e `GET /servicos/{id}` responde 404.
`PUT /servicos/{id}` tambem resolve por `buscarVivo`, entao **nao da para reativar**.

=> Na tela, "desativar" e `PUT` com `ativo:false` (reversivel, some so para o cliente).
`DELETE` e remocao definitiva: use so onde o design pedir remover mesmo, sempre com
confirmacao explicita dizendo que nao tem volta. Nao trate os dois como sinonimos.

`incluirInativos=true` traz linhas com `ativo=false`, NUNCA as deletadas.

## 2. Ordenacao ja vem pronta do backend — nao reordene "por seguranca"

`AgendamentoRepository`:

- `periodo=futuros` -> `inicio` ASC
- `periodo=historico` -> `inicio` DESC
- `periodo=todos` -> `inicio` DESC

`GET /clientes/{id}/anotacoes` -> mais nova primeiro.
`GET /servicos` -> por nome. `GET /disponibilidade` -> por dia e hora de inicio.

## 3. `periodo` invalido responde 422 `PERIODO_INVALIDO`

`GET /agendamentos/meus?periodo=` so aceita `futuros`, `historico`, `todos`
(`AgendamentoService.Periodo.de`). O openapi.yaml declara string livre, mas nao e.
Use o tipo `Periodo` de `src/api/types.ts`.

## 4. `ClienteDetalhe.agendamentos[]` NAO e filtrado

`AgendamentoRepository.doCliente` devolve todos os status **e tambem os futuros**,
ordenado por `inicio` DESC.

=> "HISTORICO DE VISITAS" (frame 14) tem de filtrar `status === 'CONCLUIDO'`, senao um
agendamento futuro, um cancelado e um nao-comparecido entram na lista como visita paga.
=> A metrica "N VISITAS" usa o mesmo criterio (`CONCLUIDO`), para os dois numeros baterem.

## 5. `GET /clientes/{id}` exige que o id seja de um usuario com role CLIENTE

`ClienteService.exigirCliente` -> `buscarVivoComRole(..., Role.CLIENTE)`.

E `POST /profissionais` faz `usuario.setRole(PROFISSIONAL)`. Ou seja: no instante em que
um cliente vira profissional, a ficha dele passa a responder **404**, mesmo com os
`Agendamento` antigos ainda carregando `clienteId`/`clienteNome`.

=> A ficha do cliente e o "VER FICHA COMPLETA" tem de tratar 404 como estado normal
("esse cliente nao esta mais na base de clientes"), nao como erro de sistema.

## 6. `horarios-livres` descarta silenciosamente os slots que ja passaram

`HorariosLivresService.fatiar` so guarda o slot quando `!cursor.isBefore(agora)`.
No dia de HOJE a lista encolhe ao longo do dia.

=> Nao da para distinguir "ocupado" de "ja passou" olhando so a resposta. Se a tela
reconstruir a grade teorica a partir de `GET /disponibilidade` para pintar os
indisponiveis em cinza, os slots vencidos ficam com a mesma aparencia de ocupado.
Nao e bug do app; e limitacao da resposta.

## 7. `GET /servicos/{id}` e `GET /profissionais/{id}` NAO checam `ativo`

Devolvem 200 para item inativo, para qualquer autenticado. Mas `POST /agendamentos` e
`horarios-livres` recusam com 422 `SERVICO_INATIVO` / `PROFISSIONAL_INATIVO`.

=> O "REPETIR" da home (que reusa um `servicoId` antigo) pode parecer valido na leitura e
falhar no agendamento. Trate o 422 na confirmacao com mensagem propria.

## 8. Limites de texto que diferem

- `AgendamentoRequest.observacao` -> maxLength **2000**
- `AnotacaoRequest.texto` -> maxLength **8000** (e `pattern: \S`, nao pode ser so espaco)

Nao reuse o 2000 no editor de anotacoes.

## 9. Fatiamento de slots e deterministico

Passo = `Servico.duracaoMinutos`, ancorado no inicio de CADA faixa da grade, descartando
o que nao cabe inteiro. Com faixa terminando 19:00 e servico de 60min, 18:00-19:00 e o
ultimo slot; 18:30 nunca existe.

## 10. Gating de papel confirmado no codigo (`@RolesAllowed`)

- `GET /agendamentos/agenda` e `GET /clientes*`: PROFISSIONAL + ADMIN (CLIENTE -> 403)
- `GET /profissionais*`, `/disponibilidade`, `/bloqueios`: qualquer autenticado
- `POST /clientes/{id}/anotacoes`: PROFISSIONAL (ADMIN -> 422, sem ficha)
- `/servicos` escrita: ADMIN
- `POST/PUT/DELETE /profissionais`: ADMIN
- `PATCH /agendamentos/{id}/status`: CLIENTE so consegue `CANCELADO`
- ADMIN em `GET /agendamentos/agenda` sem `profissionalId` -> **422**, nao 403
