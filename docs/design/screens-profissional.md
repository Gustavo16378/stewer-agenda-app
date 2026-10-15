> # ⛔ AVISO — AS SECOES DE API DESTE ARQUIVO ESTAO ERRADAS
>
> Uma revisao adversarial encontrou que os frames 10-14 deste documento foram mapeados
> contra uma API **INVENTADA**. NAO use nenhum endpoint, campo ou parametro citado aqui.
> O layout, os textos e o CSS transcritos CONTINUAM VALIDOS — use so isso.
>
> Errado aqui / correto de verdade:
> - `GET /agenda` -> na verdade `GET /agendamentos/agenda?data=&profissionalId=`, devolve `Agendamento[]` puro (sem envelope `{hora,tipo}`)
> - `GET /agendamentos/{id}` -> **NAO EXISTE**. Use o cache semeado pela lista (hook `useAgendamento`)
> - `POST /agendamentos/{id}/concluir|cancelar` -> **NAO EXISTEM**. So `PATCH /agendamentos/{id}/status`
> - `PUT /clientes/{id}/notas-visagismo`, `GET /clientes/{id}/visitas` -> **NAO EXISTEM**
> - campos `dataHoraInicio`, `dataHoraFim`, `valor` -> na verdade `inicio`, `fim`, `precoCentavos`
> - status `CONFIRMADO`/`NO_SHOW` -> nao existem. O enum e AGENDADO|CONCLUIDO|CANCELADO|NAO_COMPARECEU
> - `diasSemana`, `intervaloInicio`, `intervaloFim` -> nao existem. A grade e `Disponibilidade[]{diaSemana:0..6, horaInicio, horaFim}` e o PUT substitui a semana inteira
> - bloqueio `{data, diaInteiro, horaFim?}` -> na verdade `{inicio, fim}`, os dois obrigatorios, instantes com offset
> - `/clientes?q=&profissionalId=` -> na verdade `?busca=&pagina=&tamanho=`
> - `ClienteResumo` NAO tem `iniciais` nem `ultimaVisita`
>
> Fonte de verdade: `openapi.yaml`, `src/api/hooks.ts` e `docs/api/API-PROBE.md`.

# Stewer Gabriel App — Spec das telas do PROFISSIONAL (frames 10–14)

Fonte: `c:/Users/Gustavo/Documents/stewer-app/stewer-agenda-app/design/Stewer Gabriel App.dc.html`, linhas 334–504.
Seção do board: `02 — PERFIL PROFISSIONAL` / título `Painel do visagista · 5 telas`
(eyebrow: `font-size:10px;font-weight:600;letter-spacing:.3em;color:var(--gold,#C9A96A)`;
título: `font-family:'Playfair Display',serif;font-size:30px;color:var(--cInk,#F1EBE0)`, com
`· 5 telas` em `color:var(--cMuted,#7A756B)`).

## Convenções comuns a TODOS os 5 frames

### Shell do frame
```
position:relative; width:390px; height:844px; background:#0A0A0A;
border:1px solid var(--frame,#242424); border-radius:2px; overflow:hidden;
color:#F1EBE0; flex:none
```
`overflow:hidden` é do mockup — no app real cada tela rola verticalmente (frames 10, 12, 13 e 14
têm conteúdo mais alto que 844px e aparecem cortados no board).

### Status bar (idêntica nos 5 frames)
```
height:50px; display:flex; align-items:center; justify-content:space-between; padding:0 24px 0 30px
```
- Hora: `9:41` — `font-size:13px;font-weight:600`
- Grupo direito: `display:flex;align-items:center;gap:7px`
  - Barras de sinal: `display:flex;align-items:flex-end;gap:2px`; 4 barras de `width:3px`
    com `height:4px / 6px / 8px / 10px`; as 3 primeiras `background:#F1EBE0`,
    a quarta `background:rgba(241,235,224,.35)`
  - Bateria: `width:22px;height:11px;border:1px solid rgba(241,235,224,.45);border-radius:3px;padding:2px`
    com preenchimento interno `width:70%;height:100%;background:#F1EBE0;border-radius:1px`

### Tab bar do profissional (frames 10, 12, 13 — NÃO existe nos frames 11 e 14)
```
position:absolute; left:0; right:0; bottom:0; background:#0A0A0A;
border-top:1px solid rgba(241,235,224,.1)
```
- Linha de tabs: `display:flex;padding:16px 8px 4px`
- Cada tab: `flex:1;display:flex;flex-direction:column;align-items:center;gap:7px`
  - Indicador: `width:14px;height:1px` — ativo recebe `background:var(--gold,#C9A96A)`,
    inativo fica sem `background` (div vazia, ocupa espaço)
  - Label: `font-size:9px;font-weight:600;letter-spacing:.14em`;
    ativo `color:var(--gold,#C9A96A)`, inativo `color:rgba(241,235,224,.4)`
- Labels literais, nesta ordem: `AGENDA` · `CLIENTES` · `DISPONIBILIDADE` (3 tabs, sem ícones)
- Home indicator: `width:118px;height:4px;border-radius:99px;background:rgba(241,235,224,.2);margin:10px auto 8px`

### Slots de imagem
**Nenhum dos frames 10–14 tem slot de imagem, `<img>` ou `background-image`.** Os avatares são
círculos com iniciais em Playfair Display (ver frames 13 e 14). Confirmado por grep no range 334–504.

---

## Frame 10 — `10 Agenda do dia`
Rótulo do board: `10 · AGENDA DO DIA`

**Propósito:** tela inicial do visagista. Timeline vertical do dia corrente mostrando, na mesma
grade horária, atendimentos marcados, vagas livres e o intervalo — cada card de atendimento é a
porta de entrada para o frame 11.

### Árvore de elementos
1. **Status bar** (padrão acima).
2. **Container de conteúdo** — `padding:40px 28px 0`
   1. **Cabeçalho** — `display:flex;justify-content:space-between;align-items:flex-end`
      - Bloco esquerdo:
        - Eyebrow: `AGENDA · HOJE` — `font-size:9px;font-weight:600;letter-spacing:.26em;color:rgba(241,235,224,.48)`
        - Título: `Terça, 1 de setembro` — `font-family:'Playfair Display',serif;font-size:27px;margin-top:12px`
      - Bloco direito (navegação de data): `display:flex;gap:8px;padding-bottom:4px`
        - `‹` — `font-size:15px;color:rgba(241,235,224,.4);cursor:pointer`
        - `›` — `font-size:15px;color:rgba(241,235,224,.75);cursor:pointer`
   2. **Resumo do dia**: `4 ATENDIMENTOS · 09:00 — 19:00` —
      `font-size:9px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45);margin-top:14px`
   3. **Timeline** — `display:flex;flex-direction:column;gap:10px;margin-top:28px`
      Cada linha: `display:flex;gap:16px`. Gutter de hora à esquerda:
      `width:44px;font-size:10px;font-weight:600;letter-spacing:.1em;flex:none`
      — em linha ocupada: `color:rgba(241,235,224,.5);padding-top:14px`
      — em linha vazia/intervalo: `color:rgba(241,235,224,.35);padding-top:9px`

      **Card de atendimento (variante padrão)**
      ```
      flex:1; background:#121110; border:1px solid rgba(241,235,224,.1);
      border-radius:var(--r,2px); padding:15px 18px;
      display:flex; justify-content:space-between; align-items:center; cursor:pointer
      ```
      - Coluna esquerda `display:flex;flex-direction:column;gap:6px`
        - Nome do cliente: `font-size:14px;font-weight:500`
        - Serviço em caps: `font-size:8.5px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.5)`
      - Duração: `font-size:8.5px;font-weight:600;letter-spacing:.14em;color:rgba(241,235,224,.4)`

      **Card de atendimento (variante "primeira visita", linha 11:00)** — igual, porém
      `padding:15px 18px 24px` e `align-items:flex-start`, com terceira linha na coluna esquerda:
      `PRIMEIRA VISITA` — `font-size:8.5px;font-weight:600;letter-spacing:.14em;color:var(--gold,#C9A96A);margin-top:6px`

      **Slot livre**
      ```
      flex:1; border:1px dashed rgba(241,235,224,.16); border-radius:var(--r,2px);
      padding:10px; text-align:center; font-size:8.5px; font-weight:600;
      letter-spacing:.22em; color:rgba(241,235,224,.32)
      ```
      Texto: `DISPONÍVEL` (sem `cursor:pointer` no design)

      **Intervalo**
      ```
      flex:1; background:#0E0E0D; border-radius:var(--r,2px); padding:10px;
      text-align:center; font-size:8.5px; font-weight:600; letter-spacing:.22em;
      color:rgba(241,235,224,.3)
      ```
      Texto: `INTERVALO` (sem borda, sem `cursor:pointer`)

      **Conteúdo literal das 8 linhas, em ordem:**

      | # | Hora | Tipo | Cliente | Serviço (caps) | Duração / extra |
      |---|------|------|---------|----------------|-----------------|
      | 1 | `09:00` | atendimento | `Rafael Duarte` | `CORTE ASSINATURA` | `60 MIN` |
      | 2 | `10:00` | livre | — | `DISPONÍVEL` | — |
      | 3 | `11:00` | atendimento | `Henrique Sales` | `ANÁLISE DE VISAGISMO` | `90 MIN` + tag dourada `PRIMEIRA VISITA` |
      | 4 | `12:30` | intervalo | — | `INTERVALO` | — |
      | 5 | `13:30` | atendimento | `Bruno Costa` | `CORTE & BARBA` | `90 MIN` |
      | 6 | `15:00` | livre | — | `DISPONÍVEL` | — |
      | 7 | `16:30` | atendimento | `Otávio Lima` | `RITUAL DE BARBA` | `45 MIN` |
      | 8 | `17:15` | livre | — | `DISPONÍVEL` | — |

      (`CORTE & BARBA` está no HTML como `CORTE &amp; BARBA`.)
3. **Tab bar** — `AGENDA` ativa (indicador dourado + label dourado).

### Elementos interativos
- `‹` / `›` — dia anterior / dia seguinte (o `›` tem opacidade maior, `.75` vs `.4`, sugerindo o
  "avançar" como ação primária e possivelmente o `‹` como estado esmaecido/limite).
- 4 cards de atendimento (`cursor:pointer`) → frame 11 `Detalhe do agendamento`.
- Slots `DISPONÍVEL` e `INTERVALO` não têm `cursor:pointer` (não navegáveis no design).
- Tabs `CLIENTES` → frame 13, `DISPONIBILIDADE` → frame 12.

### Dados de API necessários
- `GET /agenda?profissionalId={me}&data=2025-09-01` (data corrente do seletor) retornando a
  timeline já resolvida em slots ordenados: `{ hora, tipo: "AGENDAMENTO"|"LIVRE"|"INTERVALO",
  agendamentoId?, clienteNome?, servicoNome?, duracaoMinutos?, primeiraVisita? }`.
- Cabeçalho: data formatada em pt-BR (`Terça, 1 de setembro` — dia da semana capitalizado, sem ano).
- Resumo: contagem de atendimentos (`4`) + janela de trabalho do dia (`09:00 — 19:00`), que vem
  da configuração de disponibilidade (frame 12).
- Flag `primeiraVisita` = cliente sem visita anterior concluída.
- Duração vem do serviço; exibida em minutos + sufixo ` MIN` em caps.

### Estados
- **Ativo/normal:** o retratado.
- **Tag dourada** aparece só quando `primeiraVisita === true`.
- **Vazio (dia sem atendimentos):** não desenhado — derivar de `0 ATENDIMENTOS` + todas as linhas
  como `DISPONÍVEL`.
- **Dia não trabalhado / bloqueado:** não desenhado neste frame (bloqueios são geridos no frame 12).
- **Loading / erro:** não desenhados.

---

## Frame 11 — `11 Detalhe do agendamento`
Rótulo do board: `11 · DETALHE DO AGENDAMENTO`

**Propósito:** ficha operacional de um atendimento do dia — dados do serviço/valor/status, um
resumo de relacionamento do cliente, o trecho das anotações de visagismo e as ações de status.

### Árvore de elementos
1. **Status bar** (padrão).
2. **Barra de navegação** — `display:flex;justify-content:space-between;align-items:center;padding:20px 28px 0`
   - Voltar: `←` — `font-size:19px;color:rgba(241,235,224,.75);cursor:pointer`
   - Contexto: `AGENDA · HOJE` — `font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.45)`
3. **Conteúdo** — `padding:34px 28px 0`
   1. Nome: `Rafael Duarte` — `font-family:'Playfair Display',serif;font-size:29px`
   2. Quando: `HOJE · 09:00 — 10:00` —
      `font-size:10px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.55);margin-top:14px`
   3. **Card de dados do atendimento**
      ```
      border:1px solid rgba(241,235,224,.14); border-radius:var(--r,2px);
      padding:24px; margin-top:30px; display:flex; flex-direction:column; gap:18px
      ```
      3 linhas `display:flex;justify-content:space-between;align-items:center`; label
      `font-size:8.5px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.45)`:
      - `SERVIÇO` → `Corte Assinatura` (`font-size:14px`)
      - `VALOR` → `R$ 190` (`font-size:14px`)
      - `STATUS` → `CONFIRMADO` — `font-size:9px;font-weight:600;letter-spacing:.18em;color:var(--gold,#C9A96A)`
   4. Seção: `RESUMO DO CLIENTE` —
      `font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.48);margin-top:38px`
   5. **Trio de métricas** — `display:flex;gap:44px;margin-top:18px`; cada item
      `display:flex;flex-direction:column;gap:6px`, valor
      `font-family:'Playfair Display',serif;font-size:21px`, label
      `font-size:8.5px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.45)`:
      - `12` / `VISITAS`
      - `Mar 2024` / `CLIENTE DESDE`
      - `14 Ago` / `ÚLTIMA VISITA`
   6. **Card de anotações (resumo)** — `margin-top:34px;padding:20px 22px;background:#121110;border-radius:var(--r,2px)`
      - Label: `ANOTAÇÕES DE VISAGISMO` — `font-size:8.5px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.45)`
      - Corpo (`font-size:13px;line-height:1.75;color:rgba(241,235,224,.75);margin-top:12px`):
        `Rosto oval alongado. Manter volume e textura no topo; laterais em degradê baixo, contorno natural.`
      - Link: `VER FICHA COMPLETA` —
        `font-size:9px;font-weight:600;letter-spacing:.18em;color:var(--gold,#C9A96A);margin-top:14px;cursor:pointer`
   7. **Ação primária**
      ```
      background:#F1EBE0; color:#0A0A0A; border-radius:var(--r,2px); padding:18px;
      text-align:center; font-size:10.5px; font-weight:600; letter-spacing:.22em;
      margin-top:34px; cursor:pointer     [style-hover="opacity:.92"]
      ```
      Texto: `CONCLUIR ATENDIMENTO`
   8. **Ações secundárias** — `display:flex;gap:12px;margin-top:12px`
      - `REMARCAR` — `flex:1;border:1px solid rgba(241,235,224,.22);border-radius:var(--r,2px);padding:15px;text-align:center;font-size:10px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.75);cursor:pointer` · `style-hover="border-color:rgba(241,235,224,.45)"`
      - `CANCELAR` — `flex:1;border:1px solid rgba(241,235,224,.12);border-radius:var(--r,2px);padding:15px;text-align:center;font-size:10px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.42);cursor:pointer` · `style-hover="border-color:rgba(241,235,224,.3)"`
4. **Sem tab bar** e sem home indicator neste frame (é tela de detalhe empilhada).

### Ações de status presentes (atenção especial)
No design existem **exatamente 3 ações**, em hierarquia visual decrescente:
1. `CONCLUIR ATENDIMENTO` — primária, botão sólido claro (`#F1EBE0` com texto `#0A0A0A`).
2. `REMARCAR` — secundária, contorno `.22`, texto `.75`.
3. `CANCELAR` — terciária/destrutiva discreta, contorno `.12`, texto `.42` (nada de vermelho).

**NÃO existe ação "Não compareceu" / no-show** neste frame, nem "Iniciar atendimento", nem
confirmação/aprovação. Se o backend tiver `NO_SHOW`, ele não tem representação no design —
precisa de decisão de produto antes de implementar.

### Elementos interativos
`←` (voltar para a agenda), `VER FICHA COMPLETA` (→ frame 14), `CONCLUIR ATENDIMENTO`,
`REMARCAR`, `CANCELAR`. As linhas do card de dados e as métricas não são clicáveis.

### Dados de API necessários
- `GET /agendamentos/{id}` → `clienteNome`, `dataHoraInicio`, `dataHoraFim` (renderizados como
  `HOJE · 09:00 — 10:00`; o rótulo relativo `HOJE` precisa ser calculado),
  `servicoNome`, `valor` (formatado `R$ 190`, sem centavos), `status` (`CONFIRMADO` em caps).
- Resumo do cliente: `totalVisitas` (12), `clienteDesde` (mês+ano abreviado `Mar 2024`),
  `ultimaVisita` (`14 Ago`, dia + mês abreviado capitalizado — note: aqui em Title Case, ao
  contrário da lista do frame 13 que usa caps `14 AGO`).
- Trecho das anotações de visagismo (`notasVisagismo`, provavelmente truncado) + link para a ficha.
- Mutações: `POST /agendamentos/{id}/concluir`, `POST /agendamentos/{id}/cancelar`, e um fluxo de
  remarcação (reabre a seleção de data/hora — frame 06).

### Estados
- **Status exibido:** só `CONFIRMADO` está desenhado, em dourado. Outros valores (concluído,
  cancelado) não têm tratamento visual definido — usar a mesma tipografia trocando a cor
  (dourado para ativo, `rgba(241,235,224,.42)` para inativo é a convenção do resto do design).
- **Sem anotações:** não desenhado (o card sempre aparece preenchido).
- **Após concluir/cancelar:** não desenhado — presumir que as 3 ações desaparecem ou ficam
  desabilitadas quando o status já é final.

---

## Frame 12 — `12 Disponibilidade`
Rótulo do board: `12 · GESTÃO DE DISPONIBILIDADE`

**Propósito:** configurar o horário padrão de atendimento do profissional (quais dias da semana,
janela de início/término, intervalo) e gerenciar bloqueios pontuais de datas específicas.

### Como o design representa a "grade semanal" (atenção especial — leitura literal)
**Não há grade semanal de faixas horárias.** Não existe matriz dia × hora, não existem toggles/
switches, e não há horário por dia. O design usa dois blocos independentes:

1. **`DIAS DE ATENDIMENTO`** — uma fileira de 7 *chips quadrados* (não toggles), um por dia da
   semana, com **uma única letra**: `D` `S` `T` `Q` `Q` `S` `S` (domingo→sábado).
   `display:flex;gap:9px;margin-top:16px`; cada chip:
   ```
   width:41px; height:41px; border-radius:var(--r,2px);
   display:flex; align-items:center; justify-content:center;
   font-size:10px; font-weight:600
   ```
   - **Selecionado** (`T`, `Q`, `Q`, `S`, `S` — terça a sábado): `border:1px solid var(--gold,#C9A96A)`,
     cor herdada `#F1EBE0`, **sem preenchimento de fundo**.
   - **Não selecionado** (`D`, `S` — domingo e segunda): `border:1px solid rgba(241,235,224,.12)`,
     `color:rgba(241,235,224,.28)`.
   - Nenhum chip tem `cursor:pointer` declarado, embora sejam obviamente o controle de seleção.
2. **`HORÁRIO DE TRABALHO`** — 3 linhas de lista (padrão "settings row"), **globais para todos os
   dias selecionados**, cada uma abrindo um seletor (`›`):
   ```
   display:flex; justify-content:space-between; align-items:center; padding:19px 0;
   border-bottom:1px solid rgba(241,235,224,.1); cursor:pointer
   ```
   label `font-size:13px;color:rgba(241,235,224,.6)`; valor `font-size:14.5px`; chevron
   `font-size:14px;color:rgba(241,235,224,.35)`; grupo do valor `display:flex;align-items:center;gap:12px`
   - `Início` → `09:00` `›`
   - `Término` → `19:00` `›`
   - `Intervalo` → `12:30 — 13:30` `›`

   (Container da lista: `margin-top:6px`. A terceira linha também tem `border-bottom`.)

Isso casa exatamente com o frame 10: janela `09:00 — 19:00` e o slot `INTERVALO` às `12:30`.

### Bloqueios (atenção especial — existem, sim)
Seção `BLOQUEIOS PONTUAIS` — `font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.48);margin-top:42px`

Dois cards de bloqueio, cada um:
```
border:1px solid rgba(241,235,224,.14); border-radius:var(--r,2px); padding:18px 20px;
display:flex; justify-content:space-between; align-items:center
```
(`margin-top:16px` no primeiro, `margin-top:10px` no segundo)
- Coluna esquerda `display:flex;flex-direction:column;gap:7px`
  - Data: `font-size:14px`
  - Detalhe em caps: `font-size:8.5px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.45)`
- Remover: `×` — `font-size:15px;color:rgba(241,235,224,.4);cursor:pointer`

| # | Data | Detalhe (literal) | Tipo implícito |
|---|------|-------------------|----------------|
| 1 | `12 de setembro` | `DIA INTEIRO · CONGRESSO DE VISAGISMO` | dia inteiro + motivo |
| 2 | `25 de setembro` | `A PARTIR DAS 16:00` | parcial, aberto até o fim do dia, sem motivo |

Botão de adicionar (contorno, largura total):
```
border:1px solid rgba(241,235,224,.22); border-radius:var(--r,2px); padding:15px;
text-align:center; font-size:10px; font-weight:600; letter-spacing:.22em;
color:rgba(241,235,224,.75); margin-top:18px; cursor:pointer
```
`style-hover="border-color:rgba(241,235,224,.45)"` · Texto: `ADICIONAR BLOQUEIO`

### Árvore de elementos (ordem completa)
1. Status bar (padrão)
2. Conteúdo `padding:40px 28px 0`
   1. Título `Disponibilidade` — `font-family:'Playfair Display',serif;font-size:29px`
   2. Subtítulo `SEU HORÁRIO PADRÃO DE ATENDIMENTO` —
      `font-size:9px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45);margin-top:14px`
   3. Seção `DIAS DE ATENDIMENTO` (`…;margin-top:40px`) + fileira de 7 chips
   4. Seção `HORÁRIO DE TRABALHO` (`…;margin-top:42px`) + 3 linhas de lista
   5. Seção `BLOQUEIOS PONTUAIS` (`…;margin-top:42px`) + 2 cards + `ADICIONAR BLOQUEIO`
3. Tab bar — `DISPONIBILIDADE` ativa

(Rótulos de seção compartilham `font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.48)`.)
Não há botão global de "Salvar" — a persistência é implícita/imediata por controle.

### Elementos interativos
7 chips de dia (alternar), 3 linhas de horário (`Início`, `Término`, `Intervalo` → abrem seletor
de hora / faixa), `×` em cada bloqueio (remover), `ADICIONAR BLOQUEIO`, tabs `AGENDA` e `CLIENTES`.

### Dados de API necessários
- `GET /profissionais/{me}/disponibilidade` → `diasSemana: [TER,QUA,QUI,SEX,SAB]`,
  `horaInicio: "09:00"`, `horaFim: "19:00"`, `intervaloInicio: "12:30"`, `intervaloFim: "13:30"`.
- `PUT/PATCH` do mesmo recurso ao alternar chip ou alterar horário.
- `GET /profissionais/{me}/bloqueios` → lista de `{ id, data, diaInteiro, horaInicio?, horaFim?, motivo? }`.
  O card 2 mostra que `horaFim` pode ser nulo ("a partir das"); o card 1 mostra `motivo` opcional
  exibido em caps concatenado a `DIA INTEIRO · `.
- `POST /profissionais/{me}/bloqueios` e `DELETE /profissionais/{me}/bloqueios/{id}`.
- Formatação: data longa pt-BR sem ano (`12 de setembro`); dias da semana como iniciais de uma letra.

### Estados
- Chip **selecionado** (borda dourada) vs **não selecionado** (borda `.12`, texto `.28`).
- Bloqueio **dia inteiro** vs **parcial ("A PARTIR DAS hh:mm")**.
- **Sem bloqueios:** estado vazio não desenhado (só o botão `ADICIONAR BLOQUEIO` sobraria).
- Seletores de hora (bottom sheet / picker) não estão desenhados neste export.
- Nenhum estado de loading, erro ou confirmação de exclusão desenhado.

---

## Frame 13 — `13 Lista de clientes`
Rótulo do board: `13 · LISTA DE CLIENTES`

**Propósito:** diretório de clientes do profissional, com busca por nome e acesso à ficha
individual (frame 14).

### Árvore de elementos
1. Status bar (padrão)
2. Conteúdo `padding:40px 28px 0`
   1. **Cabeçalho** — `display:flex;justify-content:space-between;align-items:flex-end`
      - Título: `Clientes` — `font-family:'Playfair Display',serif;font-size:29px`
      - **Contador:** `48 ATIVOS` —
        `font-size:9px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45);padding-bottom:6px`
   2. **Campo de busca** (existe, porém em estado *placeholder*, não é `<input>` no export)
      ```
      display:flex; align-items:center; gap:12px;
      border:1px solid rgba(241,235,224,.16); border-radius:var(--r,2px);
      padding:14px 16px; margin-top:28px
      ```
      - Ícone de lupa desenhado com divs: wrapper `position:relative;width:14px;height:14px;flex:none`;
        círculo `width:10px;height:10px;border:1.5px solid rgba(241,235,224,.45);border-radius:50%`;
        cabo `position:absolute;right:0;bottom:1px;width:5px;height:1.5px;background:rgba(241,235,224,.45);transform:rotate(45deg)`
      - Texto: `Buscar por nome` — `font-size:13.5px;color:rgba(241,235,224,.35)`
        (cor de placeholder; o campo aparece vazio/inativo)
   3. **Lista de clientes** — container `margin-top:14px`; cada linha:
      ```
      display:flex; align-items:center; gap:16px; padding:17px 0;
      border-bottom:1px solid rgba(241,235,224,.1); cursor:pointer
      ```
      **A última linha (`Vicente Rocha`) NÃO tem `border-bottom`.**
      - Avatar de iniciais: `width:42px;height:42px;border:1px solid rgba(241,235,224,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:14px;flex:none`
      - Bloco central `flex:1;display:flex;flex-direction:column;gap:6px`
        - Nome: `font-size:14.5px`
        - Meta: `font-size:8.5px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.42)`
      - Chevron: `›` — `font-size:14px;color:rgba(241,235,224,.3)`

      **7 linhas, na ordem do design:**

      | Iniciais | Nome | Meta (literal) |
      |---|---|---|
      | `RD` | `Rafael Duarte` | `ÚLTIMA VISITA · 14 AGO` |
      | `HS` | `Henrique Sales` | `ÚLTIMA VISITA · 28 AGO` |
      | `BC` | `Bruno Costa` | `ÚLTIMA VISITA · 22 AGO` |
      | `OL` | `Otávio Lima` | `ÚLTIMA VISITA · 30 JUL` |
      | `AM` | `André Meirelles` | `ÚLTIMA VISITA · 12 JUN` |
      | `CB` | `Caio Bittencourt` | `ÚLTIMA VISITA · 05 JUN` |
      | `VR` | `Vicente Rocha` | `ÚLTIMA VISITA · 28 MAI` |
3. Tab bar — `CLIENTES` ativa

### Respostas às perguntas específicas
- **Campo de busca?** Sim — um único campo com lupa e placeholder literal `Buscar por nome`.
  Renderizado como texto estático (estado vazio); nenhum estado "digitando", resultado filtrado
  ou "nenhum resultado" foi desenhado. Sem filtros, sem abas, sem ordenação.
- **Paginação?** Não. Nenhum controle de página, botão "carregar mais", contador de páginas ou
  indicador de scroll infinito. A lista simplesmente continua além do recorte de 844px
  (rolagem vertical implícita).
- **Contador?** Sim, um só: `48 ATIVOS` no canto superior direito, alinhado à base do título
  (`align-items:flex-end` + `padding-bottom:6px`).
- **Ordenação:** as datas caem de 14 AGO até 28 MAI, mas a primeira linha (`14 AGO`) vem antes de
  `28 AGO`, ou seja **a ordem do design não é estritamente por última visita**. Tratar como
  "ordem definida pelo backend" (relevância/alfabética) — decisão pendente.

### Elementos interativos
Campo de busca (foco/digitação), 7 linhas de cliente (`cursor:pointer`) → frame 14,
tabs `AGENDA` e `DISPONIBILIDADE`.

### Dados de API necessários
- `GET /clientes?profissionalId={me}&q={busca}` → `{ id, nome, iniciais (derivável do nome),
  ultimaVisita }` + total de ativos para o contador (`48`).
- `ultimaVisita` formatada `dd MMM` em caps pt-BR (`14 AGO`, `30 JUL`, `28 MAI`).
- Iniciais: primeira letra do primeiro e do último nome, em maiúsculas.
- Definir critério de "ativo" (o contador diz `48 ATIVOS`, não "48 clientes").

### Estados
- Busca vazia (o desenhado). Faltam: busca com texto, sem resultados, lista vazia, loading.
- Nenhum estado de linha selecionada/pressionada definido.

---

## Frame 14 — `14 Ficha do cliente`
Rótulo do board: `14 · FICHA DO CLIENTE`

**Propósito:** prontuário do cliente para o visagista — identidade + relacionamento, as anotações
de visagismo (o ativo central do negócio) com autoria/data, o histórico de visitas com valores,
e atalho para agendar de novo.

### Árvore de elementos
1. Status bar (padrão)
2. **Barra de navegação** — `display:flex;justify-content:space-between;align-items:center;padding:20px 28px 0`
   - `←` — `font-size:19px;color:rgba(241,235,224,.75);cursor:pointer`
   - Contexto: `CLIENTES` — `font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.45)`
3. **Conteúdo** — `padding:30px 28px 0`
   1. **Identidade** — `display:flex;align-items:center;gap:20px`
      - Avatar de iniciais `RD`:
        `width:54px;height:54px;border:1px solid rgba(241,235,224,.25);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:17px;flex:none`
      - Bloco de texto `display:flex;flex-direction:column;gap:8px`
        - Nome: `Rafael Duarte` — `font-family:'Playfair Display',serif;font-size:25px`
        - Meta: `DESDE MARÇO DE 2024 · 12 VISITAS` —
          `font-size:8.5px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45)`
   2. **Card de anotações de visagismo** — `margin-top:34px;padding:22px;background:#121110;border-radius:var(--r,2px)`
      - Linha de cabeçalho `display:flex;justify-content:space-between;align-items:center`
        - Label: `ANOTAÇÕES DE VISAGISMO` —
          `font-size:8.5px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.45)`
        - Ação: `EDITAR` —
          `font-size:9px;font-weight:600;letter-spacing:.18em;color:var(--gold,#C9A96A);cursor:pointer`
      - Corpo (`font-size:13px;line-height:1.8;color:rgba(241,235,224,.78);margin-top:14px`), texto literal:
        `Rosto oval alongado, têmporas estreitas. Manter volume e textura no topo; laterais em degradê baixo, contorno natural. Barba delineada curta para equilibrar o terço inferior. Evitar franjas retas.`
      - **Assinatura/auditoria:** `ATUALIZADO EM 14 AGO · STEWER GABRIEL` —
        `font-size:8px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.35);margin-top:16px`
   3. Seção `HISTÓRICO DE VISITAS` —
      `font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.48);margin-top:40px`
   4. **Lista de visitas** — container `margin-top:8px`; cada linha:
      ```
      display:flex; align-items:center; gap:18px; padding:18px 0;
      border-bottom:1px solid rgba(241,235,224,.1)
      ```
      (**todas as 5 linhas têm `border-bottom`; nenhuma tem `cursor:pointer`** — histórico read-only)
      - Data: `width:56px;font-size:9.5px;font-weight:600;letter-spacing:.14em;color:rgba(241,235,224,.45);flex:none`
      - Serviço: `flex:1;font-size:14px;color:rgba(241,235,224,.88)`
      - Valor: `font-size:12px;color:rgba(241,235,224,.45)`

      | Data | Serviço | Valor |
      |---|---|---|
      | `14 AGO` | `Corte & Barba` | `R$ 260` |
      | `10 JUL` | `Análise de Visagismo` | `R$ 320` |
      | `02 JUN` | `Corte Assinatura` | `R$ 190` |
      | `28 ABR` | `Corte Assinatura` | `R$ 190` |
      | `15 MAR` | `Ritual de Barba` | `R$ 140` |

      (`Corte & Barba` está no HTML como `Corte &amp; Barba`.)
   5. **CTA de rodapé** (contorno, largura total)
      ```
      border:1px solid rgba(241,235,224,.22); border-radius:var(--r,2px); padding:15px;
      text-align:center; font-size:10px; font-weight:600; letter-spacing:.22em;
      color:rgba(241,235,224,.75); margin-top:26px; cursor:pointer
      ```
      `style-hover="border-color:rgba(241,235,224,.45)"` · Texto: `NOVO AGENDAMENTO PARA ESTE CLIENTE`
4. **Sem tab bar** e sem home indicator (tela de detalhe empilhada).

### Anotações de visagismo — quem assina e há campo de escrever? (atenção especial)
- **Quem assina:** a linha de auditoria `ATUALIZADO EM 14 AGO · STEWER GABRIEL` — data da última
  atualização + nome do autor (o profissional). Um único autor exibido, não uma timeline de notas
  por visita: o modelo do design é **uma nota única, sobrescrita pelo último editor**, não um log.
- **Campo de escrever:** **não existe** no frame. Só o link dourado `EDITAR` no canto do card.
  Não há `<textarea>`, contorno de input, placeholder, contador de caracteres, nem botões
  `Salvar`/`Cancelar` — o modo de edição não foi desenhado neste export e precisa ser projetado
  (sugestão coerente com o resto: sheet ou tela dedicada reaproveitando `#121110` +
  `font-size:13px;line-height:1.8`).
- As anotações aparecem em **dois lugares** com estilos diferentes: aqui (completa,
  `line-height:1.8`, cor `rgba(241,235,224,.78)`, com `EDITAR` + assinatura) e no frame 11
  (trecho curto, `line-height:1.75`, cor `rgba(241,235,224,.75)`, com `VER FICHA COMPLETA` e
  **sem** assinatura). Mesmo campo, duas apresentações.

### Elementos interativos
`←` (voltar para a lista), `EDITAR` (abrir edição das anotações),
`NOVO AGENDAMENTO PARA ESTE CLIENTE` (inicia o fluxo de agendamento já com o cliente definido).
As linhas do histórico não são clicáveis.

### Dados de API necessários
- `GET /clientes/{id}` → `nome`, `iniciais`, `clienteDesde` (renderizado
  `DESDE MARÇO DE 2024`, mês por extenso em caps), `totalVisitas` (`12 VISITAS`).
- `notasVisagismo`: `{ texto, atualizadoEm, atualizadoPor }` → `ATUALIZADO EM 14 AGO · STEWER GABRIEL`
  (data `dd MMM` em caps + nome do profissional em caps).
- `PUT /clientes/{id}/notas-visagismo` para o `EDITAR`.
- `GET /clientes/{id}/visitas` → `[{ data, servicoNome, valor }]`, ordem decrescente por data;
  data `dd MMM` em caps, valor `R$ 260` (inteiro, sem centavos), nome do serviço em Title Case.
- CTA: iniciar agendamento com `clienteId` pré-selecionado.

### Estados
- **Sem anotações:** não desenhado (precisa de estado vazio + convite a escrever).
- **Sem histórico:** não desenhado.
- **Modo edição das anotações:** não desenhado (ver acima).
- Nenhum loading/erro/skeleton definido.
- Histórico limitado a 5 linhas no design, sem "ver mais" — definir se é limite ou lista completa.

---

## Notas transversais para a implementação
- Radius em **todos** os cards/botões: `var(--r,2px)` — sempre 2px, exceto avatares (`50%`) e o
  home indicator (`99px`).
- Superfícies elevadas do dark: `#121110` (cards de conteúdo, frames 10/11/14) e `#0E0E0D`
  (bloco `INTERVALO`, frame 10). O fundo de tela é `#0A0A0A`.
- Toda label em caps usa Inter 600 com `letter-spacing` entre `.14em` e `.26em`; a escala de
  tamanhos observada nesses 5 frames é `8px / 8.5px / 9px / 9.5px / 10px / 10.5px`.
- Títulos Playfair Display nesses frames: `14px` e `17px` (iniciais de avatar), `21px` (métricas),
  `25px` (nome na ficha), `27px` (data da agenda), `29px` (Disponibilidade, Clientes, nome no detalhe).
- Corpo/valores em Inter: `12px`, `13px`, `13.5px`, `14px`, `14.5px`, `15px`.
- Hierarquia de botões (constante no perfil profissional): sólido `#F1EBE0` + texto `#0A0A0A` =
  primária; contorno `rgba(241,235,224,.22)` + texto `rgba(241,235,224,.75)` = secundária;
  contorno `rgba(241,235,224,.12)` + texto `rgba(241,235,224,.42)` = terciária/descartável.
- Hovers vêm como atributo **não-padrão** `style-hover="…"` (`opacity:.92` na primária,
  `border-color:rgba(241,235,224,.45)` ou `rgba(241,235,224,.3)` nos contornos) — traduzir para
  `:hover` no CSS real.
- Divisores de lista: sempre `1px solid rgba(241,235,224,.1)`.
- Padding lateral de conteúdo: `28px` nos 5 frames (o topo varia: `40px` nas telas de nível raiz,
  `30px`/`34px` após a barra de voltar nas telas de detalhe).
- Nenhum frame do perfil profissional tem versão light neste export (os frames light são 18 e 19,
  ambos do perfil cliente).
