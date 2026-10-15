# Mapa tela -> endpoint · Stewer Gabriel App (19 frames)

Fontes, em ordem de precedência:
1. `stewer-agenda-api/src/main/java/...` (código do backend — lido para resolver o gating de papel que a spec deixa ambíguo)
2. `scratchpad/API-PROBE.md` (curl real contra localhost:8080)
3. `stewer-agenda-app/openapi.yaml`
4. `design/Stewer Gabriel App.dc.html`

Nenhum endpoint neste documento é inventado. Tudo que aparece em **LACUNAS** é proposta explícita
de API inexistente, marcada como tal.

---

## 0. Verdade de base: superfície da API e quem cada rota aceita

Gating confirmado por `@RolesAllowed` / `@Authenticated` / `@PermitAll` no código, não só pela spec.

| # | Endpoint | Papéis aceitos | Observações duras |
|---|---|---|---|
| E1 | `POST /auth/registrar` | público (`@PermitAll`) | cria **sempre** role CLIENTE; 201 devolve `TokenResponse` inteiro. Exige `senha` 8..72 |
| E2 | `POST /auth/login` | público | body `{email, senha, tenantSlug?}`; 200 `TokenResponse{token,tipo,expiraEmSegundos,usuario}` |
| E3 | `GET /auth/eu` | qualquer autenticado | `Usuario{id,tenantId,nome,email,telefone,role}` — **sem `createdAt`, sem foto** |
| E4 | `POST /agendamentos` | **CLIENTE só** | `{profissionalId,servicoId,inicio,observacao?}`; cliente = usuário do token. 201 `Agendamento` + `Location` |
| E5 | `GET /agendamentos/meus?periodo=futuros\|historico\|todos` | **CLIENTE só** | array de `Agendamento` |
| E6 | `GET /agendamentos/agenda?data=&profissionalId=` | PROFISSIONAL, ADMIN | PROFISSIONAL ignora `profissionalId` (usa a própria ficha); ADMIN sem `profissionalId` = 422 `PROFISSIONAL_OBRIGATORIO`. Devolve **todos os status**, inclusive CANCELADO |
| E7 | `PATCH /agendamentos/{id}/status` | CLIENTE / PROFISSIONAL / ADMIN, com regra | CLIENTE: só o próprio agendamento e **só `CANCELADO`** (outro status = 403 "Cliente so pode cancelar..."). PROFISSIONAL: só agendamento da própria agenda. ADMIN: qualquer. Sai de `AGENDADO` apenas; status final = 409 `STATUS_FINAL`; voltar para AGENDADO = 422 `STATUS_INVALIDO` |
| E8 | `GET /clientes?busca=&pagina=&tamanho=` | PROFISSIONAL, ADMIN (CLIENTE = 403 vazio) | array puro, **sem total e sem envelope**; ordenado por `nome` ASC; `tamanho` máx 100; busca casa nome/email/telefone; lista **todos os CLIENTE do tenant**, não "meus clientes" |
| E9 | `GET /clientes/{id}` | PROFISSIONAL, ADMIN | `ClienteDetalhe{id,tenantId,nome,email,telefone,createdAt,agendamentos[]}` — histórico completo, mais recente primeiro |
| E10 | `GET /clientes/{id}/anotacoes` | PROFISSIONAL, ADMIN | mais nova primeiro |
| E11 | `POST /clientes/{id}/anotacoes` | **PROFISSIONAL só** (ADMIN = 403) | `{texto, agendamentoId?}`; autor vem do token, não do body; profissional sem ficha = 422 `SEM_FICHA_PROFISSIONAL` |
| E12 | `GET /profissionais?incluirInativos=` | qualquer autenticado | `incluirInativos` só vale para ADMIN |
| E13 | `GET /profissionais/{id}` | qualquer autenticado | |
| E14 | `POST /profissionais` | ADMIN só | `{usuarioId*, especialidade?, bio?, fotoUrl?, ativo?}` — **promove um usuário que já existe**; se ele era CLIENTE, a role vira PROFISSIONAL |
| E15 | `PUT /profissionais/{id}` | ADMIN só | mesmo body; `usuarioId` tem de ser o atual, senão 422 `USUARIO_NAO_ALTERAVEL` |
| E16 | `DELETE /profissionais/{id}` | ADMIN só | soft delete, 204 |
| E17 | `GET /profissionais/{pid}/disponibilidade` | qualquer autenticado | array `Disponibilidade{id,profissionalId,diaSemana,horaInicio,horaFim}`; devolve `"09:00:00"` |
| E18 | `PUT /profissionais/{pid}/disponibilidade` | PROFISSIONAL (só a própria) / ADMIN (qualquer) | `{faixas:[{diaSemana,horaInicio,horaFim}]}` — **substitui a semana inteira**; aceita `"09:00"`; várias faixas no mesmo dia se não sobrepuserem (encostar é permitido); `faixas:[]` zera a agenda |
| E19 | `GET /profissionais/{pid}/bloqueios` | qualquer autenticado | **todos os bloqueios vivos, inclusive passados**, `inicio` DESC |
| E20 | `POST /profissionais/{pid}/bloqueios` | PROFISSIONAL (própria) / ADMIN | `{inicio,fim,motivo?}`; `fim<=inicio` = 422 `BLOQUEIO_INVALIDO` |
| E21 | `DELETE /profissionais/{pid}/bloqueios/{bid}` | PROFISSIONAL (própria) / ADMIN | soft delete, 204 |
| E22 | `GET /profissionais/{pid}/horarios-livres?data=&servicoId=` | qualquer autenticado | `HorariosLivres{data,profissionalId,servicoId,duracaoMinutos,horarios[{inicio,fim}]}` |
| E23 | `GET /servicos?incluirInativos=` | qualquer autenticado | ordenado por `nome`; `incluirInativos` só para ADMIN |
| E24 | `GET /servicos/{id}` | qualquer autenticado | |
| E25 | `POST /servicos` | ADMIN só | `{nome*,descricao?,duracaoMinutos*(5..600),precoCentavos*(>=0),ativo?}` |
| E26 | `PUT /servicos/{id}` | ADMIN só | mesmo body (é substituição total) |
| E27 | `DELETE /servicos/{id}` | ADMIN só | soft delete, 204 |

### Fatos estruturais que atravessam quase todas as telas

- **Não existe `GET /agendamentos/{id}`.** Toda tela de detalhe tem de carregar o objeto vindo da lista (E5/E6/E9).
- **Não existe nenhum endpoint de usuários** (`GET /usuarios`, `POST /usuarios`, `PUT /auth/eu`...). Consequências: ninguém edita nome/e-mail/telefone depois do registro, e o ADMIN não tem como descobrir `usuarioId` para E14 a não ser pegando um `ClienteResumo.id` em E8.
- **Não existe upload de arquivo** em lugar nenhum. `Profissional.fotoUrl` é só uma string de até 500 chars.
- `Usuario` (E3) **não tem `createdAt`** — só `ClienteResumo`/`ClienteDetalhe` têm, e essas rotas são fechadas para CLIENTE.
- **Slots ocupados não voltam** em E22: o serviço fatia a faixa e descarta o que colide. O app recebe apenas os livres.
- Passo do slot = duração do serviço, ancorado no início de **cada faixa** da grade (`HorariosLivresService.fatiar`).
- **Fuso (quirk)**: a `LocalTime` da grade é interpretada como UTC (`HorariosLivresService:52`). Slot "09:00 da grade" chega `09:00Z` = 06:00 em UTC-3. Vale para E17/E18/E22/E4/E6.
- Erros: 400 e 422 carregam `violacoes:[{campo,mensagem}]` no caso de validação; **401 e 403 vêm com corpo vazio** (o app tem de sintetizar a mensagem).
- Campos nulos são omitidos do JSON (`fotoUrl`, `descricao`, `observacao`, `agendamentoId`, `bio`, `telefone`).

---

## Frame 01 · Splash (design l. 49-63)

### Dados exibidos
| O que esta na tela | Origem |
|---|---|
| Monograma "SG", "STEWER GABRIEL", "VISAGISMO & CONSULTORIA DE IMAGEM", "STEWERGABRIEL.COM" | estatico do app (marca) |
| barra de status 9:41, bateria, sinal | sistema operacional |

### Acoes
| Acao | Endpoint |
|---|---|
| decidir para onde ir (logado -> Home; nao logado -> Acesso) | `GET /auth/eu` (E3) com o token guardado; 200 = token vivo, 401 (corpo vazio) = manda para o frame 02 |

### LACUNAS
- **Nada de branding vem da API.** Nao existe `GET /tenants/{slug}` nem `GET /estabelecimento`: nome do atelie, logo, site e fuso do estabelecimento sao hardcode no app.
  - Faltaria: `GET /tenant` -> `200 {id, slug, nome, logoUrl, site, timezone, politicaCancelamentoHoras}`. O `timezone` e o que resolveria de raiz o quirk de fuso da secao 0.
- Nao ha refresh token. `TokenResponse.expiraEmSegundos` (28800) e a unica informacao; quando expira, o splash cai no login.
  - Faltaria: `POST /auth/refresh` req `{}` (token atual no header) -> `200 {token, expiraEmSegundos}`.

### Papel
Qualquer um (tela pre-autenticacao). E3 aceita CLIENTE, PROFISSIONAL e ADMIN - e ele que decide qual das tres shells abrir, via `Usuario.role`.

---

## Frame 02 · Acesso (design l. 64-85)

### Dados exibidos
| O que esta na tela | Origem |
|---|---|
| "O ATELIE, NO SEU TEMPO", "Bem-vindo.", abas ENTRAR / CRIAR CONTA | estatico |
| labels E-MAIL, TELEFONE e placeholders | estatico |
| "Enviaremos um codigo de confirmacao." | estatico e **falso para esta API** (ver lacunas) |
| Termos de uso / Politica de privacidade | estatico (links externos) |

### Acoes
| Acao no design | Endpoint que executa |
|---|---|
| aba ENTRAR + CONTINUAR | `POST /auth/login` (E2), body `{email, senha, tenantSlug?}` -> 200 `TokenResponse`; guardar `token` e `usuario.role`. Senha errada = 401 **com** corpo `{codigo:"NAO_AUTENTICADO"}` (unica 401 com corpo na API) |
| aba CRIAR CONTA + CONTINUAR | `POST /auth/registrar` (E1), body `{nome*, email*, senha*(8..72), telefone?, tenantSlug?}` -> 201 `TokenResponse` (ja entra logado). E-mail repetido = 409 |

### LACUNAS
1. **O fluxo desenhado e OTP por telefone; a API e e-mail + senha.** Os dois campos do frame (E-MAIL + TELEFONE) e a frase "Enviaremos um codigo de confirmacao" nao tem endpoint algum.
   - Faltaria: `POST /auth/codigo` req `{email|telefone, tenantSlug?}` -> `202 {canal, expiraEmSegundos}`; e `POST /auth/codigo/verificar` req `{email|telefone, codigo}` -> `200 TokenResponse`.
2. **Falta o campo SENHA no design** - sem ele E1/E2 nao sao chamaveis. O app tem de acrescentar SENHA (entrar) e NOME + SENHA (criar conta), porque `RegistrarRequest` exige `nome` e `senha` (minLength 8).
3. **Nao existe recuperacao de senha.** Nenhum endpoint de esqueci/redefinir.
   - Faltaria: `POST /auth/senha/esqueci` req `{email, tenantSlug?}` -> 202; `POST /auth/senha/redefinir` req `{token, novaSenha}` -> 204.
4. **Nao existe descoberta de estabelecimento.** `tenantSlug` e string livre; nao ha `GET /tenants` para listar/validar antes do login. Slug errado nao tem erro proprio documentado.
5. Nao existe logout no servidor nem revogacao de token (ver frame 09).

### Papel
Publico. Unica tela que funciona sem token. E1 cria **sempre CLIENTE**: nunca da para se registrar como PROFISSIONAL ou ADMIN pelo app - essas contas nascem no banco/seed, e a promocao a profissional so acontece por E14 (`POST /profissionais`).

---

## Frame 03 · Home do cliente (design l. 86-124) - e Frame 18, variante light identica

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| "TERCA-FEIRA, 1 DE SETEMBRO" | relogio do aparelho (nada da API) |
| "Boa tarde, **Rafael**." | `GET /auth/eu` (E3) -> `Usuario.nome` (primeiro nome). Alternativa sem chamada: `TokenResponse.usuario.nome` guardado no login |
| bloco PROXIMO AGENDAMENTO | `GET /agendamentos/meus?periodo=futuros` (E5), primeiro item por `inicio` |
| "Corte Assinatura" | E5 -> `Agendamento.servicoNome` |
| "SEX, 11 SET · 15:30 - 16:30" | E5 -> `Agendamento.inicio` e `Agendamento.fim` (formatado no fuso do aparelho; sujeito ao quirk de fuso) |
| "Stewer Gabriel · Visagista" | nome: E5 -> `Agendamento.profissionalNome`. **"Visagista" nao existe em `Agendamento`** -> `GET /profissionais` (E12) ou `GET /profissionais/{profissionalId}` (E13) -> `Profissional.especialidade` |
| bloco ULTIMA VISITA "Corte & Barba · 14 de agosto" | `GET /agendamentos/meus?periodo=historico` (E5) -> item mais recente: `servicoNome` + `inicio` |
| tab bar INICIO / AGENDAR / MEUS HORARIOS / PERFIL | estatico |

### Acoes
| Acao no design | Endpoint |
|---|---|
| NOVO AGENDAMENTO | navegacao -> frame 04 (`GET /servicos`, E23) |
| DETALHES | navegacao; **usa o objeto `Agendamento` que ja veio na lista** - nao existe `GET /agendamentos/{id}` |
| REPETIR (ultima visita) | composicao de 2 chamadas: (1) `GET /profissionais/{profissionalId}/horarios-livres?data=&servicoId=` (E22) com `servicoId` e `profissionalId` copiados do agendamento antigo; (2) `POST /agendamentos` (E4) `{profissionalId, servicoId, inicio}` com o slot escolhido. **Nao existe "repetir" numa chamada**, e nao ha como pedir "o mesmo horario na proxima semana" sem antes checar disponibilidade |
| REAGENDAR | **sem endpoint** (ver lacunas) |

### LACUNAS
1. **REAGENDAR nao existe.** Nao ha `PUT`/`PATCH /agendamentos/{id}` para trocar `inicio`, `servicoId` ou `profissionalId`. `PATCH /agendamentos/{id}/status` (E7) so muda status, e para CLIENTE aceita **somente `CANCELADO`**. O unico caminho e cancelar e criar outro: dois passos nao atomicos, com risco real de perder o slot entre um e outro e sem volta se o POST falhar, porque status final nao regride (409 `STATUS_FINAL`).
   - Faltaria: `PATCH /agendamentos/{id}` req `{inicio?, servicoId?, profissionalId?, observacao?}` -> `200 Agendamento`, reusando as validacoes de grade/bloqueio/sobreposicao do POST e liberando o slot antigo na mesma transacao. Erros: 409 `HORARIO_OCUPADO`, 422 `FORA_DA_DISPONIBILIDADE` / `HORARIO_NO_PASSADO`, 403 quando nao e o dono.
2. "PROXIMO AGENDAMENTO" exige trabalho no cliente: E5 com `periodo=futuros` filtra por **data, nao por status**, entao vem `CANCELADO` junto; o app precisa descartar `status != AGENDADO` e ordenar por `inicio` (a ordem nao e documentada).
3. A especialidade custa uma segunda chamada (E12/E13) porque `Agendamento` nao a carrega.
   - Faltaria (barato): `profissionalEspecialidade` em `Agendamento`.
4. "ULTIMA VISITA" precisa filtrar `status == CONCLUIDO` no historico - nada na API marca "visita realizada" separado de "agendamento passado".

### Papel
**CLIENTE so.** E5 e `@RolesAllowed(CLIENTE)`: PROFISSIONAL e ADMIN levam 403 com corpo vazio. Nao existe equivalente de "meus agendamentos" para quem atende, e nem o ADMIN consegue ver esta tela.

---

## Frame 04 · Escolha de servico (design l. 125-145)

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| "PASSO 01 DE 04" | estatico (contador do wizard) |
| "Analise de Visagismo", "Corte Assinatura", "Corte & Barba", "Ritual de Barba", "Camuflagem de Fios", "Consultoria de Imagem" | `GET /servicos` (E23) -> `Servico.nome` |
| "90 MIN", "60 MIN", "45 MIN", "120 MIN" | E23 -> `Servico.duracaoMinutos` |
| "R$ 320", "R$ 190", "R$ 260", "R$ 140", "R$ 210", "R$ 480" | E23 -> `Servico.precoCentavos` / 100 |

### Acoes
| Acao | Endpoint |
|---|---|
| tocar numa linha | nenhuma chamada; guarda `Servico.id` e `duracaoMinutos` no estado do wizard e vai ao frame 05 |
| voltar | navegacao |

### LACUNAS
1. **A ordem do design nao e reproduzivel.** E23 devolve ordenado por `nome` ASC; o design mostra ordem curada. Nao existe campo de ordenacao em `Servico`.
   - Faltaria: `ordem` (int32) em `Servico` e `ServicoRequest`, ou `GET /servicos?ordenarPor=ordem`.
2. Sem categoria/agrupamento em `Servico` - catalogo grande vira lista plana.
3. `Servico.descricao` existe e o design nao usa (campo sobrando, nao lacuna).
4. Servicos inativos nunca aparecem para CLIENTE (`incluirInativos` ignorado para nao-ADMIN) - correto para esta tela.

### Papel
Qualquer autenticado (E23 e `@Authenticated`), mas na pratica **CLIENTE**: o passo 04 do wizard (`POST /agendamentos`) e CLIENTE-only, entao um PROFISSIONAL navega ate o fim e toma 403 na confirmacao.

---

## Frame 05 · Escolha de profissional (design l. 146-170)

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| retrato grande (`image-slot` 330px) | `GET /profissionais` (E12) -> `Profissional.fotoUrl` - **campo omitido quando nulo** (no seed e nulo), logo o app precisa de placeholder |
| "Stewer Gabriel" | E12 -> `Profissional.nome` |
| "VISAGISTA & CONSULTOR DE IMAGEM" | E12 -> `Profissional.especialidade` |
| "Fundador do atelie" | E12 -> `Profissional.bio` (opcional, omitido quando nulo) |
| marca SELECIONADO | estado local |
| "Em breve, novos profissionais do atelie." | estatico (coerente: E12 devolve 1 item no seed) |

### Acoes
| Acao | Endpoint |
|---|---|
| selecionar | nenhuma chamada; guarda `Profissional.id` |
| CONTINUAR | frame 06 -> `GET /profissionais/{id}/horarios-livres?data=&servicoId=` (E22) |

### LACUNAS
1. **Nao existe vinculo servico x profissional.** E12 devolve a equipe inteira; nada diz quem executa o servico escolhido no passo 01, e a API tambem nao valida isso no POST. Com dois profissionais de catalogos diferentes, a tela oferece alguem que nao faz o servico e ninguem reclama.
   - Faltaria: tabela de vinculo + `GET /servicos/{id}/profissionais` -> `200 Profissional[]` (ou `GET /profissionais?servicoId=`), e recusa no `POST /agendamentos` com 422 `SERVICO_NAO_ATENDIDO`.
2. **Nao ha upload nem gestao de imagem** (ver frame 17): `fotoUrl` e URL externa de ate 500 chars, sem variantes de tamanho.
3. Nao ha campo curto de titulo; "Fundador do atelie" tem de morar em `bio` (4000 chars) usado como uma linha.
4. Sem ordenacao/destaque na equipe alem de `nome` ASC.

### Papel
Qualquer autenticado; na jornada, **CLIENTE**. ADMIN veria tambem os inativos com `incluirInativos=true`, toggle que esta desenhado apenas de forma indireta no frame 17.

---

## Frame 06 · Data e horario (design l. 171-230) - e Frame 19, variante light identica

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| "PASSO 03 DE 04" | estatico |
| "Setembro 2026" + navegacao de mes | calendario local do app |
| dias em cinza forte (6, 7, 13, 14, 20, 21, 27, 28 = dom e seg) | derivado de `GET /profissionais/{pid}/disponibilidade` (E17) -> conjunto de `Disponibilidade.diaSemana` (0=dom ... 6=sab): dia da semana ausente da grade = fechado. Fechamento pontual precisa tambem de `GET /profissionais/{pid}/bloqueios` (E19) cobrindo o dia inteiro |
| ponto dourado no dia 1 | marcador de "hoje" (local). Se a intencao for "dia em que voce ja tem agendamento", vem de `GET /agendamentos/meus?periodo=futuros` (E5) -> `inicio` |
| dia 11 selecionado | estado local |
| "HORARIOS · SEXTA, 11 SET" | data escolhida (local) |
| grade 09:00, 10:00, 13:30, 14:30, 15:30, 16:30, 17:30 (habilitados) | `GET /profissionais/{pid}/horarios-livres?data=2026-09-11&servicoId=...` (E22) -> `horarios[].inicio` formatado. Confirma o modelo: passo = `duracaoMinutos` do servico, ancorado no inicio de **cada faixa** da grade, o que so produz 13:30 se a grade do dia tiver duas faixas (ex. 09:00-12:30 e 13:30-19:00) |
| 11:00 e 18:30 em cinza (indisponiveis) | **nao vem da API** (ver lacunas) |

### Acoes
| Acao | Endpoint |
|---|---|
| trocar de mes / escolher dia | `GET /profissionais/{pid}/horarios-livres?data=&servicoId=` (E22) - **uma chamada por dia selecionado** |
| escolher horario | nenhuma chamada; guarda `HorarioLivre.inicio` (o instante ISO exato, nao a string exibida) |
| CONTINUAR | frame 07 |

### LACUNAS
1. **Horario ocupado nao existe na resposta.** E22 devolve so os livres (`HorariosLivresService.fatiar` descarta o que colide). Os slots 11:00 e 18:30 em cinza sao um estado que a API nao sabe expressar - o app so pode nao mostrar nada ali.
   - Faltaria: `GET /profissionais/{pid}/horarios?data=&servicoId=` -> `200 {data, duracaoMinutos, slots:[{inicio, fim, estado:"LIVRE"|"OCUPADO"|"BLOQUEADO"|"PASSADO"}]}` - a grade inteira do dia com o motivo de cada slot indisponivel, sem vazar quem e o cliente do slot ocupado.
2. **Nao existe visao mensal de disponibilidade.** Pintar o calendario exige 30 chamadas a E22 (uma por dia) ou aceitar so a aproximacao "dia da semana fechado" de E17, que ignora bloqueios e dias lotados.
   - Faltaria: `GET /profissionais/{pid}/dias-livres?mes=2026-09&servicoId=...` -> `200 {mes, dias:[{data, slotsLivres:int}]}`.
3. **Quirk de fuso e visivel aqui.** Grade seg-sab 09:00-19:00 chega como `09:00Z`..`18:00Z`; num aparelho em UTC-3 o primeiro slot aparece como 06:00. Enquanto a API interpretar a `LocalTime` da grade como UTC, as horas desta tela ficam deslocadas ou o app precisa mentir e renderizar em UTC.
   - Faltaria: `timezone` do tenant no payload (ou grade guardada com offset) - vide frame 01.
4. O calendario nao sabe distinguir "fechado" de "lotado": E17 diz o dia da semana, E19 diz bloqueios, mas "todos os slots vendidos" so aparece chamando E22 daquele dia.
5. E22 exige `servicoId`: nao existe consulta de disponibilidade generica, entao o wizard nao pode inverter a ordem (escolher horario antes do servico).

### Papel
Qualquer autenticado (E22 e `@Authenticated`), no fluxo **CLIENTE**. Um PROFISSIONAL consegue consultar horarios livres de qualquer colega - o gate esta na reserva, nao na consulta.

---

## Frame 07 · Confirmacao (design l. 231-256)

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| "SERVICO / Corte Assinatura" | `Servico.nome` de E23, escolhido no frame 04 (estado do wizard) |
| "PROFISSIONAL / Stewer Gabriel" | `Profissional.nome` de E12, frame 05 |
| "DATA / Sexta, 11 de setembro" e "HORARIO / 15:30 - 16:30" | `HorarioLivre.inicio` e `.fim` de E22, frame 06 |
| "VALOR / R$ 190" | `Servico.precoCentavos` / 100 |
| "Cancelamento sem custo ate 24 horas antes do horario marcado." | **texto estatico que a API nao conhece nem impoe** (ver lacunas) |

### Acoes
| Acao | Endpoint |
|---|---|
| CONFIRMAR AGENDAMENTO | `POST /agendamentos` (E4) req `{profissionalId, servicoId, inicio, observacao?}` -> 201 `Agendamento` completo + header `Location: /agendamentos/{id}`. Erros a tratar na tela: 409 `HORARIO_OCUPADO` / `HORARIO_BLOQUEADO` (alguem chegou antes), 422 `FORA_DA_DISPONIBILIDADE` / `HORARIO_NO_PASSADO`, 404 profissional/servico inexistente, 400 com `violacoes[]`, 403 corpo vazio se o token nao for CLIENTE |
| ALTERAR DATA OU HORARIO | volta ao frame 06 (nenhuma chamada) |

### LACUNAS
1. **A politica de cancelamento e ficcao do design.** Nao ha campo na API que diga "24 horas", e o backend nao restringe cancelamento tardio: `PATCH .../status` com `CANCELADO` funciona a qualquer momento antes do horario. Ou o numero fica hardcode no app (e desalinha do combinado real do atelie), ou:
   - Faltaria: `politicaCancelamentoHoras` no `GET /tenant` proposto no frame 01, e recusa no E7 com 422 `FORA_DA_JANELA_DE_CANCELAMENTO` quando o cliente cancela dentro da janela.
2. **O campo `observacao` (recado do cliente, ate 2000 chars) existe em `AgendamentoRequest` e nao esta desenhado** em nenhum frame. Ou o app perde a funcionalidade, ou a tela precisa de um campo "recado para o profissional".
3. Nao existe pre-reserva/hold: entre o frame 06 e o CONFIRMAR o slot fica aberto para todos, e a corrida so aparece como 409.
   - Faltaria: `POST /agendamentos/reservas` (hold com TTL) -> `201 {holdId, expiraEm}` e `POST /agendamentos` aceitando `holdId`.
4. Nao existe pagamento/sinal - nada na API (`Agendamento` nao tem status de pagamento), e o design tambem nao pede.

### Papel
**CLIENTE so.** E4 e `@RolesAllowed(CLIENTE)` e o `clienteId` vem do token (`usuarioLogado.usuarioId()`), nunca do body. Nao ha como confirmar em nome de outra pessoa nesta tela nem em nenhuma outra - o que derruba o botao do frame 14.

---

## Frame 08 · Meus agendamentos (design l. 257-290)

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| secao PROXIMOS: "11 / SET", "Corte Assinatura", "15:30 · STEWER GABRIEL" | `GET /agendamentos/meus?periodo=futuros` (E5) -> `inicio` (dia/mes/hora), `servicoNome`, `profissionalNome` |
| selo "CONFIRMADO" | E5 -> `Agendamento.status == AGENDADO` (a API **nao tem** o valor `CONFIRMADO`; e rotulo do app para `AGENDADO`) |
| secao HISTORICO: "14 AGO / Corte & Barba / CONCLUIDO", "10 JUL / Analise de Visagismo", "02 JUN / Corte Assinatura" | `GET /agendamentos/meus?periodo=historico` (E5) -> `inicio`, `servicoNome`, `status` (`CONCLUIDO`) |
| linha esmaecida "12 MAI / Ritual de Barba / CANCELADO" | E5 -> `status == CANCELADO` |
| (nao desenhado) `NAO_COMPARECEU` | 4o valor do enum `StatusAgendamento` sem rotulo no design - o app precisa inventar um ("NAO COMPARECEU") |

### Acoes
| Acao | Endpoint |
|---|---|
| abrir um item | navegacao com o objeto em memoria (nao existe `GET /agendamentos/{id}`) |
| (implicito) cancelar um proximo | `PATCH /agendamentos/{id}/status` (E7) body `{status:"CANCELADO"}` -> 200 `Agendamento`. **O design nao desenhou esse botao em nenhuma tela de cliente**, apesar de ser a unica acao de escrita que o CLIENTE tem sobre um agendamento |
| pull-to-refresh | `GET /agendamentos/meus?periodo=todos` (E5) |

### LACUNAS
1. **Falta o botao CANCELAR na jornada do cliente.** A capacidade existe (E7 com `CANCELADO`) e nenhum frame de cliente a expoe; o design oferece REAGENDAR (frame 03), que e justamente o que a API nao tem. Lacuna de design contra a API, nao o contrario.
2. Nao ha paginacao em E5: o historico vem inteiro, sempre. Cliente antigo = payload crescente.
   - Faltaria: `?pagina=&tamanho=` em `GET /agendamentos/meus`.
3. Nao existe filtro por status (so `periodo`), entao a separacao PROXIMOS/HISTORICO e feita no app - e um agendamento futuro cancelado aparece em PROXIMOS se o app nao filtrar.
4. `Agendamento` nao traz preco pago separado de `precoCentavos` do catalogo: se o preco do servico mudar, o historico reescreve o valor antigo (o campo vem do agendamento, mas nada garante versionamento no dominio).

### Papel
**CLIENTE so** (E5 e CLIENTE-only). Um PROFISSIONAL nao tem nenhuma tela equivalente para "meus atendimentos ao longo do tempo" - so a agenda de um dia (frame 10).

---

## Frame 09 · Perfil do cliente (design l. 291-328)

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| avatar "RD" (iniciais) | derivado de `Usuario.nome` (E3) - **nao existe foto de cliente na API** |
| "Rafael Duarte" | `GET /auth/eu` (E3) -> `Usuario.nome` |
| "CLIENTE DESDE MARCO DE 2024" | **sem origem** - `Usuario` nao tem `createdAt`; quem tem e `ClienteResumo`/`ClienteDetalhe`, e essas rotas sao 403 para CLIENTE (ver lacunas) |
| "E-mail / rafael.duarte@email.com" | E3 -> `Usuario.email` |
| "Telefone / +55 (11) 98244-1157" | E3 -> `Usuario.telefone` (omitido quando nulo) |
| toggle "Lembretes por WhatsApp" (ligado) | **sem origem** |
| toggle "Lembrete por e-mail" (desligado) | **sem origem** |
| "Profissional preferido / Stewer Gabriel" | **sem origem** |

### Acoes
| Acao | Endpoint |
|---|---|
| SAIR DA CONTA | **so local**: apagar o token do storage. Nao existe `POST /auth/logout` nem revogacao |
| editar e-mail/telefone (linhas parecem clicaveis) | **sem endpoint** |
| ligar/desligar toggles | **sem endpoint** |
| trocar profissional preferido | **sem endpoint** |

### LACUNAS
1. **Cliente nao pode editar o proprio perfil.** Nao existe `PUT/PATCH /auth/eu`, nem `PUT /clientes/{id}`, nem qualquer rota de usuario. Nome, e-mail e telefone ficam congelados no que foi digitado no registro.
   - Faltaria: `PATCH /auth/eu` req `{nome?, telefone?, email?}` -> `200 Usuario`; e `PATCH /auth/eu/senha` req `{senhaAtual, novaSenha}` -> 204 (409 quando o novo e-mail ja existe no tenant, 400 com `violacoes[]`).
2. **"CLIENTE DESDE ..." e inalcancavel pelo proprio cliente.** `Usuario` nao tem `createdAt` e `GET /clientes/{id}` (E9) responde 403 corpo vazio para CLIENTE - inclusive para o proprio id.
   - Faltaria: `createdAt` no schema `Usuario` (resolve com um campo, sem rota nova).
3. **Preferencias de notificacao nao existem** em nenhuma parte da API (nem coluna, nem endpoint, nem envio de lembrete).
   - Faltaria: `GET /auth/eu/preferencias` -> `200 {lembreteWhatsapp:bool, lembreteEmail:bool, profissionalPreferidoId:uuid|null}` e `PUT` com o mesmo corpo. Os lembretes em si sao trabalho de backend (job + integracao), nao so de contrato.
4. **Nao existe foto de perfil de cliente** (nem campo, nem upload) - o avatar de iniciais e a unica opcao honesta.
   - Faltaria: `POST /auth/eu/foto` (multipart `arquivo`) -> `201 {fotoUrl}` + `fotoUrl` em `Usuario`.
5. **Logout e apenas client-side**: token roubado continua valido ate expirar (28800s).
   - Faltaria: `POST /auth/logout` -> 204 com blacklist/versao de token.
6. Nao existe exclusao de conta / LGPD (o rodape do frame 02 promete politica de privacidade).
   - Faltaria: `DELETE /auth/eu` -> 204 e `GET /auth/eu/dados` (export).

### Papel
**CLIENTE** (E3 serve os tres papeis, mas o conteudo desenhado - "CLIENTE DESDE", preferencias de agendamento - e de cliente). PROFISSIONAL e ADMIN **nao tem tela de perfil nenhuma** no design, e tambem nao teriam endpoint para editar a propria ficha: `PUT /profissionais/{id}` (E15) e ADMIN-only, ou seja **o profissional nao consegue mudar a propria bio, especialidade ou foto**.

---

## Frame 10 · Agenda do dia (design l. 334-366)

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| "AGENDA · HOJE" / "Terca, 1 de setembro" | data local escolhida |
| setas de dia anterior/proximo | navegacao -> nova chamada a E6 |
| "4 ATENDIMENTOS" | `GET /agendamentos/agenda?data=2026-09-01` (E6) -> contagem dos itens com `status == AGENDADO` (E6 devolve **todos** os status, inclusive `CANCELADO`, entao contar cru da o numero errado) |
| "09:00 - 19:00" | `GET /profissionais/{pid}/disponibilidade` (E17) -> menor `horaInicio` e maior `horaFim` do `diaSemana` da data |
| cards de atendimento: "09:00", "Rafael Duarte", "CORTE ASSINATURA", "60 MIN" | E6 -> `inicio`, `clienteNome`, `servicoNome`, `duracaoMinutos` |
| "11:00 / Henrique Sales / ANALISE DE VISAGISMO / 90 MIN" e "13:30 / Bruno Costa", "16:30 / Otavio Lima" | idem E6 |
| selo "PRIMEIRA VISITA" | **sem origem direta** (ver lacunas) |
| faixas "DISPONIVEL" (10:00, 15:00, 17:15) | `GET /profissionais/{pid}/horarios-livres?data=&servicoId=` (E22) - **exige escolher um servico arbitrario**, e os buracos aparecem fatiados na duracao dele (ver lacunas) |
| faixa "INTERVALO" 12:30 | derivado do buraco entre duas faixas de E17 (ex. 09:00-12:30 e 13:30-19:00) **ou** de um `Bloqueio` recorrente; a API nao rotula nem distingue |
| tab bar AGENDA / CLIENTES / DISPONIBILIDADE | estatico |

### Acoes
| Acao | Endpoint |
|---|---|
| trocar de dia | `GET /agendamentos/agenda?data=YYYY-MM-DD` (E6). Como PROFISSIONAL, `profissionalId` e ignorado; como ADMIN e **obrigatorio** senao 422 `PROFISSIONAL_OBRIGATORIO` |
| abrir um card | frame 11, com o `Agendamento` da lista em memoria |
| tocar em "DISPONIVEL" (agendar no buraco) | **sem endpoint para este papel** (ver lacunas) |

### LACUNAS
1. **Profissional/admin nao consegue marcar horario para um cliente.** `POST /agendamentos` (E4) e `@RolesAllowed(CLIENTE)` e usa `usuarioLogado.usuarioId()` como cliente; `AgendamentoRequest` **nao tem `clienteId`**. Tocar em "DISPONIVEL" para encaixar alguem e impossivel: PROFISSIONAL e ADMIN levam 403 corpo vazio.
   - Faltaria: `POST /agendamentos/para-cliente` (ou `clienteId` opcional em `AgendamentoRequest` liberado para PROFISSIONAL/ADMIN) req `{clienteId*, profissionalId*, servicoId*, inicio*, observacao?}` -> `201 Agendamento`; 403 se PROFISSIONAL informar `profissionalId` que nao e o seu; 404 `Cliente nao encontrado`; mesmos 409/422 do POST atual.
2. **Buracos da agenda so via E22, que exige `servicoId`.** Para desenhar "DISPONIVEL" o app tem de escolher um servico (ex. o mais curto) e o resultado e uma lista de slots daquele tamanho, nao o buraco real. Uma janela de 90 min livre com servico de 60 min aparece como um slot de 60, escondendo 30 min.
   - Faltaria: `GET /profissionais/{pid}/agenda?data=` -> `200 {data, expediente:[{inicio,fim}], itens:[{tipo:"AGENDAMENTO"|"BLOQUEIO"|"LIVRE", inicio, fim, agendamento?, motivo?}]}` - uma unica chamada que devolve a linha do tempo do dia, que e literalmente o que esta tela desenha (hoje sao 3 chamadas: E6 + E17 + E22).
3. **"PRIMEIRA VISITA" nao existe na API.** Descobrir isso exige `GET /clientes/{clienteId}` (E9) por cliente do dia (4 chamadas extra) e contar `agendamentos[]` anteriores. Nenhum campo em `Agendamento` marca cliente novo.
   - Faltaria: `primeiraVisita: boolean` (ou `visitasAnteriores: int`) em `Agendamento` quando lido via E6/E9.
4. **"INTERVALO" nao e um conceito da API.** So existe como ausencia de faixa. Um bloqueio de almoco recorrente tambem nao existe: `Bloqueio` e sempre uma janela absoluta com data.
   - Faltaria: faixa de intervalo em `FaixaHoraria` (`intervaloInicio`/`intervaloFim`) ou `Bloqueio` recorrente (`recorrencia: "SEMANAL", diaSemana`).
5. Nao ha `GET /agendamentos/agenda?de=&ate=` (semana): trocar para visao semanal = 7 chamadas.
6. Agenda cancelada aparece junto e sem distincao visual no design - o app precisa decidir (a API entrega `status`, entao e so questao de design).

### Papel
**PROFISSIONAL** (usa a propria ficha automaticamente) **e ADMIN** (obrigado a passar `profissionalId`, portanto precisa antes de `GET /profissionais` para escolher de quem e a agenda - passo que o design nao tem). CLIENTE = 403. Detalhe real: usuario com role PROFISSIONAL **sem ficha** cadastrada recebe 403 "Voce nao tem uma ficha de profissional neste estabelecimento" - estado que o app tem de tratar com uma tela de erro propria.

---

## Frame 11 · Detalhe do agendamento (design l. 367-400)

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| "Rafael Duarte" | `Agendamento.clienteNome` do item vindo de E6 (**nao existe `GET /agendamentos/{id}`** - se o app for abrir por deep link, tem de recarregar a agenda do dia) |
| "HOJE · 09:00 - 10:00" | `Agendamento.inicio` / `.fim` |
| "SERVICO / Corte Assinatura" | `Agendamento.servicoNome` |
| "VALOR / R$ 190" | `Agendamento.precoCentavos` / 100 |
| "STATUS / CONFIRMADO" | `Agendamento.status == AGENDADO` (rotulo do app) |
| "RESUMO DO CLIENTE / 12 VISITAS" | `GET /clientes/{clienteId}` (E9) -> contar `agendamentos[]` com `status == CONCLUIDO` |
| "Mar 2024 / CLIENTE DESDE" | E9 -> `ClienteDetalhe.createdAt` |
| "14 Ago / ULTIMA VISITA" | E9 -> maior `inicio` entre os `agendamentos[]` concluidos |
| "ANOTACOES DE VISAGISMO" (texto) | `GET /clientes/{clienteId}/anotacoes` (E10) -> `Anotacao.texto` do item mais recente (a lista ja vem da mais nova para a mais antiga) |

### Acoes
| Acao | Endpoint |
|---|---|
| CONCLUIR ATENDIMENTO | `PATCH /agendamentos/{id}/status` (E7) body `{status:"CONCLUIDO"}` -> 200 `Agendamento`. 409 `STATUS_FINAL` se ja estava concluido/cancelado |
| CANCELAR | `PATCH /agendamentos/{id}/status` (E7) body `{status:"CANCELADO"}` |
| (nao desenhado) marcar falta | `PATCH .../status` `{status:"NAO_COMPARECEU"}` - valor do enum sem botao no design |
| VER FICHA COMPLETA | frame 14 -> `GET /clientes/{clienteId}` (E9) + `GET /clientes/{clienteId}/anotacoes` (E10) |
| REMARCAR | **sem endpoint** (ver lacunas) |

### LACUNAS
1. **REMARCAR nao existe** - mesma lacuna do REAGENDAR do frame 03, agravada: o profissional nao pode nem recriar o agendamento depois de cancelar, porque `POST /agendamentos` e CLIENTE-only. Para o profissional, "remarcar" e literalmente impossivel com a API atual.
   - Faltaria: `PATCH /agendamentos/{id}` (frame 03, lacuna 1) **e** liberacao do POST em nome de cliente (frame 10, lacuna 1). As duas sao necessarias.
2. **Nao existe `GET /agendamentos/{id}`** - o detalhe depende do objeto da lista, o que impede deep link, push "toque para ver o atendimento" e refresh isolado desta tela.
   - Faltaria: `GET /agendamentos/{id}` -> `200 Agendamento`, com 403 para quem nao e o cliente dono, o profissional da agenda ou ADMIN.
3. **"RESUMO DO CLIENTE" custa a ficha inteira.** E9 devolve `agendamentos[]` completo (todo o historico) so para calcular 3 numeros, e nao ha 3 numeros prontos.
   - Faltaria: `resumo:{visitas, primeiraVisitaEm, ultimaVisitaEm, ticketMedioCentavos}` em `ClienteDetalhe`, ou `GET /clientes/{id}/resumo`.
4. **Falta o botao de marcar falta** para `NAO_COMPARECEU`, que a API suporta - lacuna de design.
5. O bloco de anotacoes e read-only aqui, mas E11 permite anotar **vinculado a este atendimento** (`agendamentoId` em `AnotacaoRequest`), que e exatamente o caso de uso desta tela e nao esta desenhado.
6. `Agendamento.observacao` (recado do cliente) existe e **nao aparece** nesta tela - o profissional nunca ve o que o cliente escreveu.

### Papel
**PROFISSIONAL** (so agendamento da propria agenda: E7 recusa com 403 "Este agendamento e da agenda de outro profissional") **e ADMIN** (E7 libera qualquer um, mas E10/E9 tambem servem ADMIN, entao a tela funciona inteira para ele). CLIENTE nao pode: E9/E10 sao 403 para CLIENTE e E7 aceitaria dele apenas `CANCELADO`. Ou seja **esta tela nunca pode ser reutilizada para o cliente** como esta - o "DETALHES" do frame 03 precisa ser outra tela, sem resumo do cliente nem anotacoes.

---

## Frame 12 · Disponibilidade (design l. 401-440)

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| "SEU HORARIO PADRAO DE ATENDIMENTO" | estatico |
| chips D S T Q Q S S com T-Q-Q-S-S ativos | `GET /profissionais/{pid}/disponibilidade` (E17) -> conjunto de `Disponibilidade.diaSemana` presentes (0=dom..6=sab) |
| "Inicio / 09:00" | E17 -> menor `horaInicio` do dia (chega como `"09:00:00"`) |
| "Termino / 19:00" | E17 -> maior `horaFim` |
| "Intervalo / 12:30 - 13:30" | **derivado**: buraco entre duas faixas do mesmo `diaSemana`. Nao existe campo de intervalo |
| BLOQUEIOS PONTUAIS: "12 de setembro / DIA INTEIRO · CONGRESSO DE VISAGISMO" | `GET /profissionais/{pid}/bloqueios` (E19) -> `inicio`, `fim`, `motivo`. "DIA INTEIRO" e inferencia do app quando `inicio` = 00:00 e `fim` = 00:00 do dia seguinte |
| "25 de setembro / A PARTIR DAS 16:00" | E19 -> `inicio` 16:00 e `fim` no fim do dia; `motivo` omitido quando nulo |

### Acoes
| Acao | Endpoint |
|---|---|
| ligar/desligar um dia da semana | `PUT /profissionais/{pid}/disponibilidade` (E18) req `{faixas:[{diaSemana,horaInicio,horaFim}, ...]}` - **substitui a semana inteira**, entao o app precisa remontar TODAS as faixas de TODOS os dias a cada toque (ou acumular e salvar) |
| mudar Inicio / Termino | idem E18, reescrevendo `horaInicio`/`horaFim` de todos os dias ativos |
| definir Intervalo | idem E18, quebrando cada dia em duas faixas (09:00-12:30 e 13:30-19:00). Encostar e permitido; sobrepor = 422 `FAIXAS_SOBREPOSTAS`; invertida = 422 `FAIXA_INVALIDA` |
| ADICIONAR BLOQUEIO | `POST /profissionais/{pid}/bloqueios` (E20) req `{inicio, fim, motivo?}` -> 201 `Bloqueio`. `fim <= inicio` = 422 `BLOQUEIO_INVALIDO` |
| x (remover bloqueio) | `DELETE /profissionais/{pid}/bloqueios/{bloqueioId}` (E21) -> 204 |

### LACUNAS
1. **E18 e substituicao total, o design e edicao incremental.** Cada toque num chip de dia obriga o app a reenviar a grade inteira; um PUT concorrente (ADMIN mexendo ao mesmo tempo) sobrescreve silenciosamente. Nao ha ETag/If-Match nem endpoint por faixa.
   - Faltaria: `POST /profissionais/{pid}/disponibilidade` (adiciona faixa) e `DELETE .../disponibilidade/{id}`, ou `If-Match` com a versao da grade no GET.
2. **"Intervalo" nao e modelado.** Funciona como duas faixas, mas ler de volta e adivinhacao: um profissional com 3 faixas (dois intervalos) nao caberia nesta tela, e "das 09:00 as 12:30" mais "das 13:30 as 19:00" e indistinguivel de "intervalo de almoco" para a API.
   - Faltaria: `intervaloInicio`/`intervaloFim` em `FaixaHoraria`, ou aceitar a lista de faixas como cidada de primeira classe na UI.
3. **O design assume um horario igual para todos os dias**; a API guarda por dia. Um profissional que atende sabado meio periodo nao tem como ser exibido aqui sem perder informacao (a tela mostraria 09:00-19:00 e o PUT achataria o sabado).
   - Faltaria: nada na API - e o design que precisa de horario por dia.
4. **E19 devolve bloqueios passados tambem** (`inicio` DESC, sem filtro de data). O design lista so os futuros -> o app filtra no cliente. Sem paginacao: profissional antigo acumula bloqueios para sempre.
   - Faltaria: `GET /profissionais/{pid}/bloqueios?de=&ate=&pagina=&tamanho=`.
5. **Nao existe bloqueio "dia inteiro" nem recorrente.** "DIA INTEIRO" e convencao do app (00:00Z a 00:00Z do dia seguinte - e com o quirk de fuso isso nao coincide com o dia local do usuario).
   - Faltaria: `diaInteiro: boolean` + `data: LocalDate` em `BloqueioRequest`, e `recorrencia` para folga semanal.
6. Nao ha edicao de bloqueio (so criar e deletar) - "editar" seria delete + post.
7. **O profissional nao pode editar a propria ficha** (bio/especialidade/foto): E15 e ADMIN-only. Esta tela e a unica de "configuracoes" que o profissional tem, e nao inclui perfil justamente porque a API nao permitiria.
   - Faltaria: `PUT /profissionais/eu` (ou liberar E15 para o dono da ficha) req `{especialidade?, bio?, fotoUrl?}` -> `200 Profissional`.

### Papel
**PROFISSIONAL** (E18/E20/E21 checam `exigirDonoOuAdmin`: agenda alheia = 403 "Voce so pode alterar a sua propria agenda") **e ADMIN** (pode editar a grade de qualquer profissional - e por isso que o frame 17 tem "GERENCIAR"). CLIENTE consegue **ler** E17/E19 (`@Authenticated`) mas nao escrever - e o app nao deve expor esta tela para ele. Detalhe: como o `{pid}` esta no path e o token nao o carrega, o app precisa descobrir a propria ficha antes - e **nao existe `GET /profissionais/eu`**: hoje a unica forma e `GET /profissionais` (E12) e casar `Profissional.usuarioId` com `Usuario.id` de E3.
   - Faltaria: `GET /profissionais/eu` -> `200 Profissional` (404 se o usuario nao tem ficha).

---

## Frame 13 · Lista de clientes (design l. 441-472)

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| "Clientes" | estatico |
| "48 ATIVOS" | **sem origem** - `GET /clientes` (E8) devolve array puro, sem total e sem header de contagem (confirmado por curl) |
| campo "Buscar por nome" | entrada -> `GET /clientes?busca=` (E8), que casa nome, e-mail **ou** telefone |
| linhas "Rafael Duarte", "Henrique Sales", "Bruno Costa", "Otavio Lima", "Andre Meirelles", "Caio Bittencourt", "Vicente Rocha" | E8 -> `ClienteResumo.nome` |
| avatares "RD", "HS", "BC" | iniciais derivadas de `nome` - nao existe foto de cliente |
| "ULTIMA VISITA · 14 AGO" em cada linha | **sem origem** - `ClienteResumo` tem so `{id, nome, email, telefone, createdAt}`; o DTO documenta explicitamente que nao carrega totais para nao fazer uma query por linha |
| ordem da lista | E8 ordena por `nome` ASC. O design mostra ordem por atividade recente (14 AGO, 28 AGO, 22 AGO...), que **nao e nenhuma ordem que a API produz** |

### Acoes
| Acao | Endpoint |
|---|---|
| buscar | `GET /clientes?busca=<termo>&pagina=0&tamanho=20` (E8) |
| scroll infinito | E8 com `pagina++`; **para quando `length < tamanho`** (nao ha total nem `next`); `tamanho` maximo 100 |
| abrir cliente | frame 14 -> `GET /clientes/{id}` (E9) |
| (nao desenhado) cadastrar cliente | **sem endpoint** (ver lacunas) |

### LACUNAS
1. **"48 ATIVOS" nao tem como ser exibido.** Sem total na resposta, o app so pode contar o que baixou.
   - Faltaria: envelope `{itens:[...], total, pagina, tamanho}` em `GET /clientes`, ou header `X-Total-Count`.
2. **"ULTIMA VISITA" por linha nao existe** e nao ha caminho barato: seria 1x `GET /clientes/{id}` (E9) por linha, e cada uma traz o historico completo.
   - Faltaria: `ultimaVisitaEm` e `visitas` em `ClienteResumo` (o backend documenta que evitou isso de proposito - a alternativa correta e uma query agregada, nao N+1 no app).
3. **Nao existe ordenacao por atividade.** So `nome` ASC.
   - Faltaria: `GET /clientes?ordenarPor=ultimaVisita|nome|createdAt&ordem=asc|desc`.
4. **Nao existe cadastro de cliente pelo profissional/admin.** Nao ha `POST /clientes`. O unico jeito de um cliente passar a existir e ele mesmo se registrar em `POST /auth/registrar` (E1, publico, exige senha 8..72 escolhida por ele). Um profissional que atende alguem no balcao nao tem como criar a ficha - nem sem senha, nem com senha provisoria.
   - Faltaria: `POST /clientes` (PROFISSIONAL/ADMIN) req `{nome*, telefone?, email?}` -> `201 ClienteResumo`, criando usuario CLIENTE **sem senha** (conta "de balcao", que o cliente reivindica depois por telefone/e-mail); 409 quando o e-mail ja existe.
5. **A lista e de todos os clientes do tenant, nao "meus clientes"** (`buscarClientes` filtra apenas `role = CLIENTE` do tenant). Com dois profissionais, cada um ve a base do outro - e o design nao avisa isso em nenhum lugar.
   - Faltaria: `GET /clientes?meus=true` filtrando por quem ja foi atendido pelo profissional do token.
6. Nao ha "clientes ativos" como conceito: a API nao tem status/arquivamento de cliente, entao "48 ATIVOS" tambem nao tem semantica.
   - Faltaria: `ativo` em `Usuario`/cliente e `DELETE /clientes/{id}` (soft) se o produto quiser arquivar.

### Papel
**PROFISSIONAL e ADMIN** (E8 e `@RolesAllowed(PROFISSIONAL, ADMIN)`; CLIENTE = 403 corpo vazio, confirmado por curl). Nada nesta tela e restrito a um dos dois.

---

## Frame 14 · Ficha do cliente (design l. 473-504)

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| avatar "RD" | iniciais de `ClienteDetalhe.nome` |
| "Rafael Duarte" | `GET /clientes/{id}` (E9) -> `ClienteDetalhe.nome` |
| "DESDE MARCO DE 2024 · 12 VISITAS" | E9 -> `createdAt` + contagem de `agendamentos[]` com `status == CONCLUIDO` |
| bloco ANOTACOES DE VISAGISMO (texto longo) | `GET /clientes/{id}/anotacoes` (E10) -> `Anotacao.texto` (item mais recente) |
| "ATUALIZADO EM 14 AGO · STEWER GABRIEL" | E10 -> `Anotacao.updatedAt` (ou `createdAt`) + `Anotacao.profissionalNome` |
| HISTORICO DE VISITAS: "14 AGO / Corte & Barba / R$ 260", "10 JUL / Analise de Visagismo / R$ 320", "02 JUN", "28 ABR", "15 MAR" | E9 -> `agendamentos[].inicio`, `.servicoNome`, `.precoCentavos`/100 (a lista ja vem do mais recente para o mais antigo) |
| (nao desenhado) e-mail e telefone do cliente | E9 -> `ClienteDetalhe.email`, `.telefone` - disponiveis e nao usados; sem eles o profissional nao tem como ligar/mandar mensagem |

### Acoes
| Acao | Endpoint |
|---|---|
| EDITAR (anotacoes) | **so cria nova versao**: `POST /clientes/{id}/anotacoes` (E11) req `{texto*, agendamentoId?}` -> 201 `Anotacao`. **Nao existe PUT nem DELETE de anotacao** |
| NOVO AGENDAMENTO PARA ESTE CLIENTE | **sem endpoint** (ver lacunas) |
| voltar | navegacao |

### LACUNAS
1. **"NOVO AGENDAMENTO PARA ESTE CLIENTE" e impossivel.** `POST /agendamentos` (E4) e `@RolesAllowed(CLIENTE)` e monta o agendamento com `usuarioLogado.usuarioId()` como cliente. Um PROFISSIONAL recebe **403 corpo vazio**; se por absurdo passasse, criaria o agendamento no nome dele mesmo, nao do Rafael. E o request nao tem `clienteId`.
   - Faltaria: exatamente a proposta da lacuna 1 do frame 10 (`clienteId` aceito de PROFISSIONAL/ADMIN, ou `POST /agendamentos/para-cliente`).
2. **"EDITAR" anotacao nao existe.** Apenas append. O selo "ATUALIZADO EM ..." sugere um documento vivo, mas a API modela um diario: E10 devolve N anotacoes, da mais nova para a mais antiga, cada uma assinada por um profissional. O `updatedAt` existe em `Anotacao` mas nenhuma rota o altera.
   - Faltaria: `PUT /clientes/{id}/anotacoes/{anotacaoId}` req `{texto}` -> `200 Anotacao` (403 se o autor for outro profissional) e `DELETE .../{anotacaoId}` -> 204.
3. **O design mostra UMA anotacao; a API tem uma lista.** Ou a tela vira timeline (mostrando autor e data de cada uma, o que E10 permite), ou o app esconde o historico de anotacoes que existe no banco.
4. **ADMIN nao pode anotar** (E11 e `@RolesAllowed(PROFISSIONAL)`; e mesmo profissional sem ficha leva 422 `SEM_FICHA_PROFISSIONAL`). O botao EDITAR precisa desaparecer para ADMIN.
5. **"12 VISITAS" e "DESDE ..." exigem baixar o historico inteiro** (mesma lacuna 3 do frame 11) - `GET /clientes/{id}/resumo` resolveria.
6. Nao existem fotos de antes/depois nem anexos, o que e a expectativa natural de uma ficha de visagismo.
   - Faltaria: `POST /clientes/{id}/anotacoes/{id}/fotos` (multipart) -> `201 {fotoUrl}` e `fotos[]` em `Anotacao`.
7. `Agendamento.observacao` (recado do cliente) nao aparece no historico desta tela.

### Papel
**PROFISSIONAL** (leitura completa + unico que pode anotar) e **ADMIN** (leitura completa, sem anotar). CLIENTE = 403 em E9 e E10: nao ha versao "minha ficha de visagismo" para o cliente, e nem seria possivel construir uma sem novo endpoint.
   - Faltaria, se o produto quiser: `GET /auth/eu/anotacoes` -> `200 Anotacao[]` (as do proprio cliente logado).

**Onde o design mostra algo que o papel nao poderia fazer:** o botao "NOVO AGENDAMENTO PARA ESTE CLIENTE" (403 garantido) e o "EDITAR" de anotacao quando o usuario for ADMIN (403) ou profissional sem ficha (422).

---

## Frame 15 · Dashboard (design l. 510-559)

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| "VISAO GERAL" / "Esta semana" / "31 AGO - 06 SET" | datas locais |
| "32 / AGENDAMENTOS NA SEMANA" | **sem endpoint agregado.** Reconstrucao possivel: `GET /agendamentos/agenda?data=&profissionalId=` (E6) **7 vezes por profissional** (com `GET /profissionais`, E12, antes para ter a lista) e contar `status == AGENDADO`. Para 1 profissional = 8 chamadas; para 5 = 36 |
| mini barras por dia (S T Q Q S S D) | mesma reconstrucao: contagem por dia dos mesmos 7 GETs |
| "78% / TAXA DE OCUPACAO" | **sem endpoint.** Reconstrucao: minutos vendidos (soma de `duracaoMinutos` dos AGENDADO/CONCLUIDO de E6) dividido por minutos de expediente (E17, `horaFim - horaInicio` por dia) menos bloqueios (E19). 3 fontes, tudo calculado no app |
| "9 / CLIENTES NOVOS NO MES" | reconstrucao: `GET /clientes` (E8) paginado inteiro (max 100 por pagina, sem total) e contar `createdAt` dentro do mes |
| "+3 VS. JULHO" | idem, contando o mes anterior - exige baixar a base inteira de clientes |
| "Receita estimada da semana / R$ 7.240" | reconstrucao: somar `precoCentavos` dos itens de E6 na semana (decidindo se conta AGENDADO ou so CONCLUIDO - a API nao opina) |
| tab bar VISAO GERAL / SERVICOS / EQUIPE | estatico |

### Acoes
Nenhuma acao de escrita. Trocar de periodo (semana anterior/seguinte) nao esta desenhado, mas seria mais N chamadas a E6.

### LACUNAS
1. **Nao existe nenhum endpoint de metricas.** Zero. Nenhuma rota agrega nada: nao ha `/metricas`, `/dashboard`, `/relatorios`, nem `count` em resposta alguma. **Toda** esta tela e reconstrucao no cliente a partir de E6 + E12 + E17 + E19 + E8, com N chamadas proporcionais a (dias x profissionais) e a base inteira de clientes baixada.
   - Faltaria (uma rota resolve a tela toda): `GET /metricas/resumo?de=2026-08-31&ate=2026-09-06&profissionalId=` (ADMIN; PROFISSIONAL restrito a si) -> `200 { periodo:{de,ate}, agendamentos:{total, porStatus:{AGENDADO,CONCLUIDO,CANCELADO,NAO_COMPARECEU}, porDia:[{data,total}]}, ocupacao:{minutosVendidos, minutosDisponiveis, taxa}, receitaCentavos:{estimada, realizada}, clientes:{novosNoMes, novosNoMesAnterior} }`.
   - Alternativa minima, se agregacao for muito: `GET /agendamentos?de=&ate=&profissionalId=&status=` -> `200 Agendamento[]` (uma chamada por semana em vez de 7) e `X-Total-Count` em `GET /clientes?criadoDe=&criadoAte=`.
2. **ADMIN nao consegue nem listar agendamentos de forma ampla:** E6 e por dia **e** por profissional obrigatorio (422 `PROFISSIONAL_OBRIGATORIO`). Nao existe "agenda do estabelecimento".
   - Faltaria: `profissionalId` opcional em E6 para ADMIN (todos os profissionais), ou o `GET /agendamentos?de=&ate=` acima.
3. **"Receita" nao tem definicao na API:** nao ha pagamento, nem valor efetivamente cobrado, nem desconto - so `precoCentavos` copiado do catalogo. Qualquer numero exibido e estimativa do app.
4. **"Taxa de ocupacao" depende do quirk de fuso** (expediente em UTC) e de bloqueios paginados sem filtro: o denominador e uma conta cheia de suposicoes feita no cliente.
5. **"Clientes novos no mes" nao e consultavel por periodo:** E8 nao aceita filtro de data e nao devolve total; a unica via e paginar tudo.

### Papel
Design coloca no perfil **ADMIN**, e e o unico papel que faz sentido para os numeros do estabelecimento - mas a API nao ajuda: o ADMIN e justamente quem precisa de `profissionalId` em E6. Um **PROFISSIONAL** teria acesso mais facil aos proprios numeros (E6 sem parametro), e o design nao lhe da essa tela. Nada aqui e acessivel a CLIENTE.

---

## Frame 16 · Gestao de servicos (design l. 560-590)

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| "Servicos" | estatico |
| 6 linhas com nome | `GET /servicos?incluirInativos=true` (E23) -> `Servico.nome`. Como ADMIN, `incluirInativos=true` e o certo aqui (o rodape fala de inativos) |
| "90 MIN · R$ 320" etc. | E23 -> `duracaoMinutos` e `precoCentavos`/100 |
| "Servicos inativos nao aparecem para os clientes." | estatico, e verdadeiro: E23 ignora `incluirInativos` para nao-ADMIN |
| (nao desenhado) qual linha esta inativa | E23 -> `Servico.ativo` - a tela nao tem indicacao visual de inativo, apesar de listar inativos |

### Acoes
| Acao | Endpoint |
|---|---|
| NOVO SERVICO | `POST /servicos` (E25) req `{nome*, descricao?, duracaoMinutos*(5..600), precoCentavos*(>=0), ativo?}` -> 201 `Servico`. Nome repetido = 409; validacao = 400 com `violacoes[]` (ex. `{campo:"duracaoMinutos", mensagem:"duracaoMinutos deve ser no minimo 5"}`) |
| EDITAR | `PUT /servicos/{id}` (E26) com o **mesmo body completo** (substituicao, nao merge: omitir `descricao` a apaga) -> 200 `Servico` |
| (nao desenhado) desativar | `PUT /servicos/{id}` com `ativo:false`, **ou** `DELETE /servicos/{id}` (E27) -> 204 soft delete |

### LACUNAS
1. **A tela nao expoe `ativo` nem exclusao**, embora a API tenha as duas coisas (`ativo` no PUT e E27). O rodape fala de inativos e nao ha como criar/ver um.
   - Faltaria: nada na API - e o design que precisa de um toggle "visivel para clientes" e de uma acao de remover.
2. **PUT e substituicao total**, entao o formulario de edicao tem de ser preenchido com o objeto inteiro antes de salvar, senao apaga `descricao`/`ativo`.
   - Faltaria (conforto): `PATCH /servicos/{id}` com merge parcial.
3. **Sem ordenacao/destaque** (mesma lacuna do frame 04): a lista de gestao tambem sai em `nome` ASC e o admin nao tem como reordenar o que o cliente ve.
4. **Sem historico de preco**: mudar `precoCentavos` altera o catalogo; agendamentos antigos guardam o valor no proprio registro, mas nada expoe "preco na epoca" versus "preco atual" para conferencia.
5. Nao existe `DELETE` que avise sobre agendamentos futuros usando o servico: E27 e soft delete silencioso, e `GET /profissionais/{pid}/horarios-livres` com servico inativo passa a responder 422 `SERVICO_INATIVO` - o app precisa antecipar esse efeito.

### Papel
**ADMIN so** para escrever (E25/E26/E27 sao `@RolesAllowed(ADMIN)`; PROFISSIONAL levou 403 no curl). A leitura (E23) e de qualquer autenticado, entao a tela e visivel para todos mas so o ADMIN pode agir - o design a colocou corretamente no perfil ADMIN.

---

## Frame 17 · Gestao de equipe (design l. 591-630)

### Dados exibidos
| O que esta na tela | Endpoint -> campo |
|---|---|
| "Equipe" | estatico |
| "1 PROFISSIONAL ATIVO" | `GET /profissionais` (E12) -> `length` da lista (sem `incluirInativos`, ja vem so ativo; ou contar `ativo == true` com `incluirInativos=true`) |
| foto 64x64 (`image-slot`) | E12 -> `Profissional.fotoUrl` (omitido quando nulo) |
| "Stewer Gabriel" | E12 -> `Profissional.nome` |
| "VISAGISTA & CONSULTOR DE IMAGEM" | E12 -> `Profissional.especialidade` |
| selo "ATIVO" | E12 -> `Profissional.ativo` |
| "AGENDA · TER - SAB, 09:00 - 19:00" | `GET /profissionais/{id}/disponibilidade` (E17) -> agrupar `diaSemana` contiguos + faixa horaria (uma chamada **por profissional** da lista) |
| "O convite da acesso ao painel do profissional, com agenda e clientes proprios." | estatico e **enganoso**: nao existe convite, e os clientes nao sao "proprios" (E8 lista a base do tenant inteira) |

### Acoes
| Acao | Endpoint |
|---|---|
| GERENCIAR (agenda do profissional) | frame 12 apontando para o `{profissionalId}` escolhido: `GET/PUT /profissionais/{pid}/disponibilidade` (E17/E18) e bloqueios (E19/E20/E21) - ADMIN pode mexer na agenda de qualquer um |
| ADICIONAR PROFISSIONAL | `POST /profissionais` (E14) req `{usuarioId*, especialidade?, bio?, fotoUrl?, ativo?}` -> 201 `Profissional`. **Exige um `usuarioId` que ja existe**; se o usuario era CLIENTE, a role dele vira PROFISSIONAL. Ja profissional = 409 `JA_E_PROFISSIONAL`; usuario inexistente = 404 |
| (nao desenhado) editar ficha | `PUT /profissionais/{id}` (E15) - `usuarioId` tem de ser o mesmo, senao 422 `USUARIO_NAO_ALTERAVEL` |
| (nao desenhado) desativar/remover | `DELETE /profissionais/{id}` (E16) -> 204 soft delete (a role do usuario e mantida de proposito) |

### LACUNAS
1. **Nao existe convite, e nao existe como descobrir o `usuarioId`.** A API nao tem `GET /usuarios` nem `POST /usuarios`. O unico caminho real hoje: a pessoa **se registra sozinha** em `POST /auth/registrar` (E1, cria CLIENTE), o ADMIN a encontra em `GET /clientes?busca=<nome>` (E8, que lista somente role CLIENTE) e usa aquele `ClienteResumo.id` como `usuarioId` em E14. Nada disso esta desenhado, e o fluxo "convite por e-mail" do design nao existe em lugar nenhum.
   - Faltaria: `POST /profissionais/convites` req `{nome*, email*, especialidade?}` -> `201 {conviteId, expiraEm}` (cria usuario PROFISSIONAL + ficha pendente e manda e-mail), com `POST /auth/convites/{token}/aceitar` req `{senha}` -> `200 TokenResponse`.
   - Alternativa minima sem e-mail: `POST /usuarios` (ADMIN) req `{nome*, email*, senhaProvisoria*, role*}` -> `201 Usuario`, e `GET /usuarios?role=&busca=` para alimentar o seletor de E14.
2. **"1 PROFISSIONAL ATIVO" e a unica metrica possivel** aqui, e so porque a lista e pequena; nao ha total.
3. **A linha de agenda custa 1 chamada por profissional** (E17 nao aceita lote).
   - Faltaria: `disponibilidade[]` embutida em `Profissional` no `GET /profissionais`, ou `GET /disponibilidades?profissionalIds=`.
4. **"clientes proprios" nao existe:** E8 nao segmenta por profissional (ver frame 13, lacuna 5). O texto do design promete isolamento que a API nao tem.
5. **Sem upload de foto** (mesma lacuna dos frames 05 e 09): so `fotoUrl` string. Para o ADMIN cadastrar a foto de alguem, precisa hospedar a imagem por fora.
   - Faltaria: `POST /profissionais/{id}/foto` (multipart `arquivo`, max ~5MB, jpeg/png/webp) -> `201 {fotoUrl}`.
6. **Nao ha reativacao explicita** depois do soft delete: `DELETE` desativa, e `PUT` com `ativo:true` reativa - mas o `GET /profissionais/{id}` de um removido responde 404, o que dificulta montar a tela de reativacao (precisa de `GET /profissionais?incluirInativos=true`).
7. Nao existe papel/permissao configuravel: `Role` e enum fixo (CLIENTE/PROFISSIONAL/ADMIN) e nao ha endpoint para trocar role fora do efeito colateral de E14.

### Papel
**ADMIN so** (E14/E15/E16 sao `@RolesAllowed(ADMIN)`; o curl confirmou 403 para PROFISSIONAL em `POST /profissionais`). A leitura de E12/E17 e de qualquer autenticado.

**Onde o design mostra algo que o papel nao poderia fazer:** nada aqui excede o ADMIN - o problema e o contrario, o ADMIN nao tem endpoint (convite/criacao de usuario) para realizar o que a tela promete.

---

## Frame 18 · Home do cliente, light (design l. 635-676)

Conteudo, dados e acoes **identicos ao frame 03** (mesmos textos, mesma hierarquia; muda so a paleta: fundo `#F1EBE0`, dourado `#A8894F`).
- Mapeamento de dados: ver frame 03.
- Acoes: ver frame 03 (inclui o mesmo REAGENDAR sem endpoint e o mesmo REPETIR por composicao E22 + E4).
- LACUNAS proprias do modo claro: **nenhuma do lado da API.** O tema nao e persistido em lugar nenhum - nao existe `GET/PUT /auth/eu/preferencias` (ver frame 09, lacuna 3), entao a escolha claro/escuro so pode viver no armazenamento local do aparelho e nao acompanha o usuario em outro dispositivo.
- Papel: **CLIENTE so** (E5 e CLIENTE-only).

---

## Frame 19 · Data e horario, light (design l. 677-724)

Conteudo, dados e acoes **identicos ao frame 06**.
- Mapeamento de dados: ver frame 06 (E17 para dias fechados, E22 para os slots, calendario local).
- LACUNAS proprias: **nenhuma nova.** Persistem as tres do frame 06 (slot ocupado nao volta na resposta, nao existe disponibilidade mensal, quirk de fuso) e a mesma observacao de tema nao persistido do frame 18.
- Papel: qualquer autenticado para consultar (E22), **CLIENTE** para concluir o fluxo (E4).

---

# Veredito das suspeitas levantadas

| # | Suspeita | Veredito | Evidencia |
|---|---|---|---|
| a | Profissional marcando horario para um cliente - existe endpoint? | **NAO EXISTE** | `POST /agendamentos` e `@RolesAllowed({CLIENTE})` (`AgendamentoResource:50`) e o cliente vem de `usuarioLogado.usuarioId()` (`AgendamentoService.criar`). `AgendamentoRequest` nao tem `clienteId`. PROFISSIONAL/ADMIN recebem 403 corpo vazio. O design pede isso em **frame 14 ("NOVO AGENDAMENTO PARA ESTE CLIENTE")** e implicitamente no **frame 10** (faixas "DISPONIVEL" clicaveis) |
| b | Profissional/admin cadastrando cliente - existe? | **NAO EXISTE** | Nao ha `POST /clientes`. `ClienteResource` so tem GET lista, GET detalhe, GET/POST anotacoes. A unica criacao de CLIENTE e `POST /auth/registrar`, publica e com senha obrigatoria escolhida pelo proprio. Frame 13 nao desenhou o botao - e coerente com a API, mas o produto fica sem cliente de balcao |
| c | Editar ou reagendar um agendamento existente - existe? | **NAO EXISTE** | A unica escrita sobre agendamento e `PATCH /agendamentos/{id}/status`, que so aceita transicao de `AGENDADO` para `CONCLUIDO`/`CANCELADO`/`NAO_COMPARECEU`, sem volta (409 `STATUS_FINAL`, 422 `STATUS_INVALIDO`). Nao existe `PUT/PATCH /agendamentos/{id}` para `inicio`/`servicoId`/`profissionalId`, nem `GET /agendamentos/{id}`. O design pede "REAGENDAR" (frames 03/18) e "REMARCAR" (frame 11). Para o profissional e duplamente impossivel, porque nem recriar ele pode (ver a) |
| d | Dashboard com metricas agregadas - existe? | **NAO EXISTE** | Nenhuma rota agregada em toda a spec; nem `count`/`total` em resposta alguma (`GET /clientes` devolve array puro, confirmado por curl). O frame 15 inteiro so existe reconstruido no app com N x `GET /agendamentos/agenda` (7 por profissional por semana) + `GET /profissionais` + `GET .../disponibilidade` + `GET .../bloqueios` + paginacao completa de `GET /clientes`. E o ADMIN e obrigado a informar `profissionalId` em cada chamada de agenda |
| e | Upload de foto de perfil - existe? | **NAO EXISTE** | Nenhum endpoint multipart em nenhum recurso. So `Profissional.fotoUrl` (string, max 500) em `ProfissionalRequest`, escrita apenas por ADMIN (E14/E15). Nao existe campo de foto para `Usuario`/cliente. Frames 05, 09, 13, 14 e 17 mostram retratos/avatares: o de cliente so pode ser iniciais |
| f | Editar o proprio perfil de cliente - existe? | **NAO EXISTE** | Nao ha `PUT/PATCH /auth/eu`, nem rota de usuarios, nem `PUT /clientes/{id}`. Nome/e-mail/telefone ficam congelados no registro; nao ha troca de senha. Alem disso o "CLIENTE DESDE MARCO DE 2024" do frame 09 e inalcancavel: `Usuario` nao tem `createdAt` e `GET /clientes/{id}` e 403 para CLIENTE. As preferencias (WhatsApp, e-mail, profissional preferido) nao existem em campo nenhum |
| g | Cancelar como cliente - existe? | **EXISTE, com limite** | `PATCH /agendamentos/{id}/status` aceita CLIENTE (`AgendamentoResource:102`) e `AgendamentoService.exigirPermissaoDeStatus` permite **somente** `CANCELADO` e **somente** no proprio agendamento ("Cliente so pode cancelar o proprio agendamento" / "Este agendamento nao e seu", ambos 403). Nao ha janela de 24h no backend - a frase do frame 07 nao e imposta pela API. **E o design nao desenhou o botao de cancelar em nenhuma tela de cliente** |
| h | "Repetir" um agendamento anterior - com que endpoints? | **POSSIVEL, por composicao** | Do `Agendamento` do historico (`GET /agendamentos/meus?periodo=historico`) pegue `servicoId` e `profissionalId`; chame `GET /profissionais/{profissionalId}/horarios-livres?data=<nova data>&servicoId=<mesmo>` (E22) para achar um slot; confirme com `POST /agendamentos` (E4) `{profissionalId, servicoId, inicio}`. Nao existe atalho de um passo, nao existe "mesmo horario na proxima semana" (a API nao valida nada sem consulta previa; o POST responderia 409/422) e o REPETIR do frame 03 tem de abrir o frame 06 pre-preenchido |

---

# Lacunas consolidadas, por prioridade de impacto no app

## Bloqueiam telas desenhadas (o app nao pode entregar o frame como esta)
1. `POST /agendamentos` para outro cliente (PROFISSIONAL/ADMIN) - frames 10 e 14.
2. `PATCH /agendamentos/{id}` (reagendar/remarcar) - frames 03, 11, 18.
3. Endpoint de metricas - frame 15 inteiro.
4. OTP / codigo de confirmacao, ou redesenho para e-mail+senha - frame 02.
5. `PATCH /auth/eu` + preferencias de notificacao - frame 09.
6. `createdAt` em `Usuario` ("CLIENTE DESDE") - frame 09.
7. Total de clientes e `ultimaVisitaEm`/`visitas` em `ClienteResumo` - frame 13 ("48 ATIVOS" e "ULTIMA VISITA" por linha).
8. Slot indisponivel na resposta de horarios livres - frames 06 e 19 (os horarios em cinza).
9. Convite/criacao de usuario para virar profissional - frame 17.
10. `POST /clientes` (cliente de balcao) - implicito no frame 13.

## Degradam a tela (o app entrega, com N+1 chamadas ou aproximacao)
11. `GET /agendamentos/{id}` - frames 08, 11 (deep link e refresh).
12. `GET /profissionais/eu` - frames 10 e 12 precisam do `profissionalId` proprio.
13. `GET /profissionais/{pid}/agenda?data=` (linha do tempo do dia numa chamada) - frame 10 usa 3 endpoints.
14. `primeiraVisita` em `Agendamento` - frame 10 (hoje: 1 `GET /clientes/{id}` por cliente do dia).
15. `resumo` em `ClienteDetalhe` ou `GET /clientes/{id}/resumo` - frames 11 e 14 baixam o historico completo por 3 numeros.
16. Disponibilidade mensal (`dias-livres?mes=`) - frames 06 e 19 (hoje: 1 chamada por dia).
17. `ordem` em `Servico` - frames 04 e 16.
18. Paginacao e filtro de data em `GET /profissionais/{pid}/bloqueios` - frame 12.
19. Paginacao em `GET /agendamentos/meus` - frame 08.
20. Vinculo servico x profissional - frame 05 (quebra quando a equipe crescer).
21. `PUT/DELETE` de anotacao - frame 14 ("EDITAR").
22. Uploads (`foto` de profissional, de cliente, fotos de anotacao) - frames 05, 09, 14, 17.
23. `GET /tenant` com `timezone` e `politicaCancelamentoHoras` - frames 01 e 07, e a raiz do quirk de fuso.
24. `POST /auth/refresh`, `POST /auth/logout`, recuperacao de senha - frames 01, 02, 09.
25. Intervalo/bloqueio recorrente na grade - frames 10 e 12.

## Lacunas do lado do DESIGN (a API pode e a tela nao expoe)
- Cancelar como cliente (E7 com `CANCELADO`) - nenhuma tela de cliente tem o botao.
- Marcar `NAO_COMPARECEU` - frame 11 nao tem o botao, o enum tem o valor.
- `observacao` do agendamento (recado do cliente, 2000 chars) - nao aparece em nenhum frame, nem para escrever (frame 07) nem para ler (frames 10/11).
- `Servico.ativo` e `DELETE /servicos/{id}` - frame 16 fala de inativos e nao os mostra nem cria.
- `Servico.descricao` - existe e nenhum frame usa.
- `ClienteDetalhe.email`/`.telefone` - frame 14 nao mostra contato do cliente.
- `Anotacao` como lista assinada e datada (E10 devolve N) - frame 14 mostra uma so.
- `incluirInativos` em `GET /profissionais` - frame 17 nao tem como ver/reativar profissional removido.
- `PATCH /agendamentos/{id}/status` para ADMIN sobre qualquer agendamento - nenhuma tela de ADMIN toca em agendamento.

## Riscos de papel a tratar no app
- Toda 401/403 vem com **corpo vazio**: o app tem de sintetizar a mensagem (E7, E8, E4 e todos os POST/PUT/DELETE de ADMIN dependem disso).
- Usuario com role PROFISSIONAL **sem ficha** de profissional: 403 em `GET /agendamentos/agenda` e 422 `SEM_FICHA_PROFISSIONAL` em `POST /clientes/{id}/anotacoes`. A shell do profissional precisa de um estado vazio proprio para isso.
- ADMIN em telas de profissional: `GET /agendamentos/agenda` exige `profissionalId` (422 `PROFISSIONAL_OBRIGATORIO`) e `POST /clientes/{id}/anotacoes` responde 403. Os frames 10, 11 e 14 nao previram esse desvio.
- CLIENTE nas telas 10 a 17: 403 em todas as rotas de leitura relevantes (E6, E8, E9, E10) - o roteamento por `Usuario.role` (E3) tem de ser feito antes de qualquer fetch.
