# Stewer Gabriel — Spec das telas do CLIENTE (frames 01–09)

Fonte: `c:\Users\Gustavo\Documents\stewer-app\stewer-agenda-app\design\Stewer Gabriel App.dc.html`, linhas 49–328
(seção de board `01 — PERFIL CLIENTE`, cabeçalho na linha 44).

Todo valor de CSS abaixo é **literal**, copiado do atributo `style` do elemento. Todo texto é
**transcrito literalmente** (entidades HTML já resolvidas: `&amp;` → `&`). Onde o design usa
`var(--x, fallback)` eu mantenho a forma completa, porque **não existe `:root` no arquivo** — o
fallback é o valor que realmente pinta.

API de referência para a coluna "dados": `c:\Users\Gustavo\Documents\stewer-app\stewer-agenda-api`
(Quarkus, `dev.gustavo.stewer.resource.*`, DTOs em `dev.gustavo.stewer.dto.*`).

---

## 0. Base compartilhada pelas 9 telas

### 0.1 Tokens efetivos (fallbacks das `var()`)

| token | valor | uso nas telas do cliente |
|---|---|---|
| `--canvas` | `#0F0F0F` | fundo do **board** de design. **Não é cor de tela.** |
| `--frame` | `#242424` | `border` de 1px da moldura de cada frame (bezel do device). Não é UI do app. |
| `--gold` | `#C9A96A` | acento: destaque, seleção, estado ativo, links de ação |
| `--cInk` | `#F1EBE0` | tinta clara (texto principal / superfície do botão primário) |
| `--cMuted` | `#7A756B` | só nas legendas do board (`01 · SPLASH`, …), não dentro das telas |
| `--r` | `2px` | radius de tudo que tem canto (`border-radius:var(--r,2px)`) |

Cor de tela (dark, as 9 telas do cliente): `background:#0A0A0A`, `color:#F1EBE0`.

**Escada de opacidade da tinta** — o design usa `rgba(241,235,224,α)` como sistema inteiro de
hierarquia; reproduzir exatamente:

- `.88` valor de campo em lista (09 Perfil, 07 Confirmação)
- `.85` título de item em lista secundária (08 histórico) / label de preferência (09) / preço (04)
- `.8` dia de calendário disponível (06)
- `.75` seta de voltar `←` (04–07), `›` do mês (06)
- `.72` linha de data-hora do card de próximo agendamento (03)
- `.65` texto do botão secundário `SAIR DA CONTA` (09)
- `.62` / `.55` / `.5` subtítulos e metadados
- `.48` labels de seção em caps
- `.45` metadados em caps / labels de campo do card 07 / `PASSO xx DE 04` / borda da bateria
- `.42` textos auxiliares abaixo de botão (02)
- `.4` `‹` do mês (06), tab inativa do bottom nav, tab `CRIAR CONTA` (02), status `CONCLUÍDO` (08)
- `.38` letras dos dias da semana (06), rodapé legal (02), nota "Em breve…" (05)
- `.35` placeholder de input (02), 4ª barra do sinal de status
- `.3` thumb do toggle desligado (09), rodapé do splash (01)
- `.25` dia de calendário indisponível (06), aro do avatar (09), traço de 34px do splash (01)
- `.22` horário indisponível (06), borda do botão secundário (09)
- `.2` home indicator
- `.18` borda de input (02)
- `.16` borda de card (08) / borda de slot de horário (06)
- `.14` borda de card da Confirmação (07) / borda inferior da barra de tabs de acesso (02)
- `.12` divisor interno de card (`height:1px`)
- `.1` divisor de linha de lista e `border-top` do bottom nav

### 0.2 Moldura do frame (idêntica nas 9)

```
position:relative;width:390px;height:844px;background:#0A0A0A;
border:1px solid var(--frame,#242424);border-radius:2px;overflow:hidden;color:#F1EBE0;flex:none
```

`overflow:hidden` + altura fixa: **nenhuma tela do cliente é rolável no design**. Todo conteúdo cabe
em 844px. 04 (6 serviços) e 06 (calendário + grade de 9 slots) são as duas que chegam perto do
limite — se a API devolver mais itens que o design mostra, ver notas por tela.

Cada frame é precedido, **fora** da tela, por uma legenda de board que **não faz parte do app**:
`font-size:10px;font-weight:600;letter-spacing:.2em;color:var(--cMuted,#7A756B)` com os textos
`01 · SPLASH`, `02 · ACESSO`, `03 · HOME DO CLIENTE`, `04 · ESCOLHA DE SERVIÇO`,
`05 · ESCOLHA DE PROFISSIONAL`, `06 · DATA E HORÁRIO`, `07 · CONFIRMAÇÃO`,
`08 · MEUS AGENDAMENTOS`, `09 · PERFIL DO CLIENTE`.
O wrapper de cada par legenda+frame é `display:flex;flex-direction:column;gap:14px`.
O cabeçalho da seção (linha 44) é `01 — PERFIL CLIENTE` (`font-size:10px;font-weight:600;letter-spacing:.3em;color:var(--gold,#C9A96A)`)
+ `Jornada do cliente · 9 telas` (`'Playfair Display',serif;font-size:30px`, com o `· 9 telas` em `color:var(--cMuted,#7A756B)`).

### 0.3 `StatusBar` (mock de iOS) — presente nas 9 telas

Container: `height:50px;display:flex;align-items:center;justify-content:space-between;padding:0 24px 0 30px`
(**exceção**: no frame 01 Splash o container é `position:relative;z-index:2;height:50px;…` — precisa
subir acima do bloco centralizado, que é `position:absolute;inset:0`).

- Relógio: `font-size:13px;font-weight:600` → texto **`9:41`**
- Cluster direito: `display:flex;align-items:center;gap:7px`
  - Sinal: `display:flex;align-items:flex-end;gap:2px` com 4 barras —
    `width:3px;height:4px;background:#F1EBE0`, `width:3px;height:6px;background:#F1EBE0`,
    `width:3px;height:8px;background:#F1EBE0`,
    `width:3px;height:10px;background:rgba(241,235,224,.35)` (4ª barra apagada)
  - Bateria: `width:22px;height:11px;border:1px solid rgba(241,235,224,.45);border-radius:3px;padding:2px`
    com preenchimento `width:70%;height:100%;background:#F1EBE0;border-radius:1px`

Decorativo, sem interação, sem dados de API. Em app nativo/PWA fullscreen isto é a status bar real do
SO — reproduzir só em modo mockup.

### 0.4 `BottomTabBar` — em 03, 08 e 09 (ausente em 01, 02, 04, 05, 06, 07)

```
position:absolute;left:0;right:0;bottom:0;background:#0A0A0A;border-top:1px solid rgba(241,235,224,.1)
```
Linha de tabs: `display:flex;padding:16px 8px 4px`. Cada tab:
`flex:1;display:flex;flex-direction:column;align-items:center;gap:7px`, contendo (a) um traço
indicador e (b) o rótulo `font-size:9px;font-weight:600;letter-spacing:.14em`.

- **Tab ativa**: traço `width:14px;height:1px;background:var(--gold,#C9A96A)` + rótulo `color:var(--gold,#C9A96A)`
- **Tab inativa**: traço `width:14px;height:1px` **sem `background`** (ocupa espaço, invisível —
  mantém o alinhamento vertical dos rótulos) + rótulo `color:rgba(241,235,224,.4)`

Rótulos, na ordem: **`INÍCIO`**, **`AGENDAR`**, **`MEUS HORÁRIOS`**, **`PERFIL`**.

Home indicator, último filho: `width:118px;height:4px;border-radius:99px;background:rgba(241,235,224,.2);margin:10px auto 8px`.

Tab ativa por tela: 03 → `INÍCIO`; 08 → `MEUS HORÁRIOS`; 09 → `PERFIL`.
**Nenhuma tab tem `cursor:pointer` no design** — ainda assim são o navegador principal e devem ser
botões reais. Destinos: `INÍCIO`→03, `AGENDAR`→04 (início do fluxo), `MEUS HORÁRIOS`→08, `PERFIL`→09.
As telas 04–07 são um stack empilhado sobre a tab `AGENDAR` (por isso perdem a tab bar e ganham
`←` + `PASSO xx DE 04`).

### 0.5 `BotaoPrimario` (em 02, 03, 05, 06, 07 — 5 ocorrências)

```
background:#F1EBE0;color:#0A0A0A;border-radius:var(--r,2px);padding:18px;text-align:center;
font-size:10.5px;font-weight:600;letter-spacing:.22em;cursor:pointer
```
+ `style-hover="opacity:.92"` (é o único hover-token do conjunto, usado 5×).
O `margin-top` **varia por tela** e pertence ao ritmo vertical, não ao componente:
02 `34px` · 03 `28px` · 05 `28px` · 06 `26px` · 07 `30px`.
Largura: 100% do container de padding lateral 28px → **334px** efetivos.
Não há estado `disabled` desenhado para este botão em nenhuma das 9 telas.

### 0.6 `BotaoSecundarioContornado` (só em 09)

```
border:1px solid rgba(241,235,224,.22);border-radius:var(--r,2px);padding:16px;text-align:center;
font-size:10px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.65);cursor:pointer
```
+ `style-hover="border-color:rgba(241,235,224,.45)"`.

### 0.7 `HeaderDePasso` (04, 05, 06, 07)

```
display:flex;justify-content:space-between;align-items:center;padding:20px 28px 0
```
- Voltar: `font-size:19px;color:rgba(241,235,224,.75);cursor:pointer` → texto **`←`** (U+2190).
  O glifo é o próprio ícone (não há SVG). Alvo de toque de 19px é pequeno; ampliar a área para ≥44px
  sem mudar o glifo.
- Contador: `font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.45)` →
  **`PASSO 01 DE 04`**, **`PASSO 02 DE 04`**, **`PASSO 03 DE 04`**, **`PASSO 04 DE 04`**.
  Texto estático — **não existe barra de progresso** no design.

### 0.8 `LabelDeSecao` em caps — três variantes que convivem, não unificar

- `font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.48)` — label de seção
  no corpo (`ÚLTIMA VISITA`, `PRÓXIMOS`, `HISTÓRICO`, `DADOS PESSOAIS`, `PREFERÊNCIAS`,
  `HORÁRIOS · SEXTA, 11 SET`)
- `font-size:9px;font-weight:600;letter-spacing:.26em;color:rgba(241,235,224,.48)` — eyebrow acima do
  H1 (`O ATELIÊ, NO SEU TEMPO`, `TERÇA-FEIRA, 1 DE SETEMBRO`, `NOVO AGENDAMENTO`)
- `font-size:8.5px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.45)` — label de campo
  dentro do card da Confirmação (07)

### 0.9 Escala tipográfica observada (só telas 01–09)

| papel | CSS |
|---|---|
| H1 de tela | `font-family:'Playfair Display',serif;font-size:31px` (02, 03) · `font-size:29px` (04, 05, 06, 07, 08) |
| Nome no perfil | `'Playfair Display',serif;font-size:24px` (09) |
| Título de card | `'Playfair Display',serif;font-size:23px` (03 serviço, 05 nome do pro) |
| Valor em destaque | `'Playfair Display',serif;font-size:24px` (07 preço) · `21px` (07 serviço) |
| Item de lista display | `'Playfair Display',serif;font-size:19px` (04) · `18px` (08 card) |
| Dia grande | `'Playfair Display',serif;font-size:26px` (08) |
| Mês do calendário | `'Playfair Display',serif;font-size:18px` (06) |
| Monograma | `'Playfair Display',serif;font-size:19px` (01 `SG`, 09 `RD`) · `13px` (02 `SG`) |
| Wordmark | `'Playfair Display',serif;font-size:20px;letter-spacing:.32em` (01) |
| Corpo de lista | `font-size:13.5px` / `14px` / `14.5px` (Inter 400) |
| Texto auxiliar | `font-size:11px` / `11.5px` / `12.5px` |

### 0.10 Losango de marca (motivo recorrente)

Quadrado rotacionado 45° com o monograma contra-rotacionado, para o texto ficar reto:

- 01 Splash: `width:58px;height:58px;border:1px solid var(--gold,#C9A96A);transform:rotate(45deg);display:flex;align-items:center;justify-content:center;margin-bottom:14px`
  → filho `transform:rotate(-45deg);font-family:'Playfair Display',serif;font-size:19px;letter-spacing:.08em` → **`SG`**
- 02 Acesso: `width:40px;height:40px;border:1px solid var(--gold,#C9A96A);transform:rotate(45deg);display:flex;align-items:center;justify-content:center;margin:6px 0 42px 8px`
  → filho `transform:rotate(-45deg);font-family:'Playfair Display',serif;font-size:13px` → **`SG`**
- 05: micro-losango de seleção, `width:7px;height:7px;border:1px solid var(--gold,#C9A96A);transform:rotate(45deg)` (vazio)

### 0.11 Interatividade — inventário fechado

`cursor:pointer` aparece **29 vezes** nas linhas 49–328. Distribuição: 01 → 0 · 02 → 1 · 03 → 4 ·
04 → 7 · 05 → 2 · 06 → 11 · 07 → 3 · 08 → **0** · 09 → 1.
`style-hover` aparece **6 vezes**: `opacity:.92` (5×, botões primários) e
`border-color:rgba(241,235,224,.45)` (1×, `SAIR DA CONTA`).
Slots de imagem (`<image-slot>`) nas telas do cliente: **1 só**, na tela 05.

---

## 01 Splash

- **`data-screen-label`**: `01 Splash` · linhas 49–63
- **Propósito**: abertura de marca enquanto o app restaura sessão (token JWT em storage) e resolve o
  tenant. Decide o próximo destino: sessão válida → 03 Home; sem sessão → 02 Acesso.

### Árvore de elementos (de cima para baixo)

1. **Frame** — `position:relative;width:390px;height:844px;background:#0A0A0A;border:1px solid var(--frame,#242424);border-radius:2px;overflow:hidden;color:#F1EBE0;flex:none`
2. **StatusBar** — `position:relative;z-index:2;height:50px;display:flex;align-items:center;justify-content:space-between;padding:0 24px 0 30px`
   (ver §0.3; único frame com `position:relative;z-index:2`, porque o bloco central é `inset:0` e
   passaria por cima). Texto: **`9:41`**.
3. **Bloco central (overlay de tela cheia)** — `position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px`
   1. **Losango do monograma** — `width:58px;height:58px;border:1px solid var(--gold,#C9A96A);transform:rotate(45deg);display:flex;align-items:center;justify-content:center;margin-bottom:14px`
      - filho — `transform:rotate(-45deg);font-family:'Playfair Display',serif;font-size:19px;letter-spacing:.08em` → **`SG`**
   2. **Wordmark** — `font-family:'Playfair Display',serif;font-size:20px;letter-spacing:.32em;padding-left:.32em`
      → **`STEWER GABRIEL`**
      (`padding-left:.32em` compensa o tracking do último caractere e recentraliza opticamente — manter)
   3. **Filete divisor** — `width:34px;height:1px;background:rgba(241,235,224,.25)`
   4. **Tagline** — `font-size:9px;font-weight:600;letter-spacing:.3em;color:rgba(241,235,224,.5);padding-left:.3em`
      → **`VISAGISMO & CONSULTORIA DE IMAGEM`**
4. **Rodapé** — `position:absolute;bottom:44px;left:0;right:0;text-align:center;font-size:8.5px;font-weight:600;letter-spacing:.3em;color:rgba(241,235,224,.3)`
   → **`STEWERGABRIEL.COM`**

### Interativos

Nenhum. Zero `cursor:pointer`, zero `style-hover`. A tela sai por tempo/resultado de requisição, não
por toque.

### Dados de API

Nada renderizado vem da API. Durante a exibição:
- ler token do storage seguro; se existir, `GET /auth/eu` → `UsuarioResponse { id, tenantId, nome, email, telefone, role }`
  (`AuthResource.eu`, linha 53). Serve para (a) validar o token e (b) descobrir `role`, que decide o
  perfil de navegação (`CLIENTE` → esta jornada; `PROFISSIONAL`/`ADMIN` → outros boards).
- `tenantSlug` (ex.: `stewer-gabriel`) precisa estar resolvido antes do login — é campo opcional de
  `LoginRequest`/`RegistrarRequest`; sem ele a API usa o tenant padrão.
- 401/403 → navegar para 02 Acesso. 200 com `role != CLIENTE` → board correspondente.

### Slots de imagem

Nenhum. A marca é 100% CSS (losango + tipografia), não há logo bitmap. Não introduzir PNG aqui.

### Estados mostrados

Só um: repouso/carregando. **Não há spinner, barra de progresso nem mensagem de erro desenhada** —
se `GET /auth/eu` falhar por rede, o design não prevê UI; tratar como decisão de produto (sugestão:
cair para 02 Acesso com toast, sem inventar componente novo aqui).

---

## 02 Acesso

- **`data-screen-label`**: `02 Acesso` · linhas 64–85
- **Propósito**: porta de entrada única com duas abas (`ENTRAR` / `CRIAR CONTA`), coletando **e-mail
  e telefone** e prometendo um código de confirmação. Aba `ENTRAR` está ativa no design.

### Árvore de elementos

1. **Frame** — padrão §0.2
2. **StatusBar** — `height:50px;display:flex;align-items:center;justify-content:space-between;padding:0 24px 0 30px` → **`9:41`**
3. **Corpo** — `padding:52px 28px 0;display:flex;flex-direction:column`
   1. **Losango do monograma** — `width:40px;height:40px;border:1px solid var(--gold,#C9A96A);transform:rotate(45deg);display:flex;align-items:center;justify-content:center;margin:6px 0 42px 8px`
      - filho — `transform:rotate(-45deg);font-family:'Playfair Display',serif;font-size:13px` → **`SG`**
      - o `margin` assimétrico (`6px 0 42px 8px`) compensa a rotação; não trocar por margin uniforme.
   2. **Eyebrow** — `font-size:9px;font-weight:600;letter-spacing:.26em;color:rgba(241,235,224,.48)`
      → **`O ATELIÊ, NO SEU TEMPO`**
   3. **H1** — `font-family:'Playfair Display',serif;font-size:31px;font-weight:400;margin-top:14px`
      → **`Bem-vindo.`** (com ponto final)
   4. **Barra de abas** — `display:flex;border-bottom:1px solid rgba(241,235,224,.14);margin-top:40px`
      1. **Aba ativa** — `padding:0 2px 14px;margin-right:34px;font-size:10px;font-weight:600;letter-spacing:.2em;border-bottom:1px solid var(--gold,#C9A96A);margin-bottom:-1px`
         → **`ENTRAR`** — cor herdada (`#F1EBE0`, cheia). O `margin-bottom:-1px` faz o sublinhado
         dourado cobrir a régua da barra: manter, é o que dá o efeito de aba selecionada.
      2. **Aba inativa** — `padding:0 2px 14px;font-size:10px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.4)`
         → **`CRIAR CONTA`** — sem borda inferior.
   5. **Campo E-MAIL** — grupo `display:flex;flex-direction:column;gap:8px;margin-top:36px`
      - label — `font-size:9px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.48)` → **`E-MAIL`**
      - caixa — `border:1px solid rgba(241,235,224,.18);border-radius:var(--r,2px);padding:16px;font-size:14px;color:rgba(241,235,224,.35)`
        → **`seunome@email.com`** (é **placeholder**, não valor — a cor `.35` é a cor de placeholder do sistema)
   6. **Campo TELEFONE** — grupo `display:flex;flex-direction:column;gap:8px;margin-top:22px`
      - label — mesmo CSS do anterior → **`TELEFONE`**
      - caixa — mesmo CSS → **`+55 (11) 90000-0000`** (placeholder, indica máscara `+55 (NN) NNNNN-NNNN`)
   7. **Botão primário** — §0.5 com `margin-top:34px` → **`CONTINUAR`**
   8. **Nota** — `font-size:11px;color:rgba(241,235,224,.42);margin-top:18px;text-align:center`
      → **`Enviaremos um código de confirmação.`**
4. **Rodapé legal** — `position:absolute;bottom:40px;left:36px;right:36px;text-align:center;font-size:11px;line-height:1.7;color:rgba(241,235,224,.38)`
   → **`Ao continuar, você aceita os Termos de uso e a Política de privacidade.`**
   - dois `<a href="#" style="color:rgba(241,235,224,.6)">` sobre **`Termos de uso`** e
     **`Política de privacidade`**
   - o `<a>` herda do CSS global do documento: `text-decoration-color:rgba(201,169,106,.6);text-underline-offset:3px`,
     e `a:hover{color:#C9A96A}` — ou seja, sublinhado dourado translúcido e hover dourado cheio.

### Interativos

| elemento | sinal no design | ação |
|---|---|---|
| Aba `ENTRAR` | sem `cursor:pointer`, mas é aba | mantém/entra no modo login |
| Aba `CRIAR CONTA` | sem `cursor:pointer`, mas é aba | troca para o modo cadastro (o design **não** mostra este segundo estado — presumir mesmos campos + `NOME`, ver Gaps) |
| Campo `E-MAIL` | caixa de input | `type=email`, `autocapitalize=none`, `inputmode=email` |
| Campo `TELEFONE` | caixa de input | `inputmode=tel` + máscara `+55 (00) 00000-0000` |
| **`CONTINUAR`** | `cursor:pointer` + `style-hover="opacity:.92"` (o único pointer da tela) | dispara a autenticação e leva ao passo de código; sucesso → 03 Home |
| `Termos de uso` | `<a href="#">` | abre o documento legal |
| `Política de privacidade` | `<a href="#">` | abre o documento legal |

### Dados de API

- Envia: `POST /auth/login` — `LoginRequest { email, senha, tenantSlug? }`
  (`AuthResource`, linha 62) ou `POST /auth/registrar` — `RegistrarRequest { nome, email, telefone?, senha, tenantSlug? }`
  (linha 40).
- Recebe: `TokenResponse { token, tipo:"Bearer", expiraEmSegundos, usuario: UsuarioResponse }`.
  Guardar `token` e usar em `Authorization: Bearer <token>` em todas as chamadas seguintes;
  `usuario.role` decide o board; `usuario.nome` alimenta a saudação da tela 03.
- `tenantSlug` sai da configuração do app (build ou deep link), não de campo visível.

### Slots de imagem

Nenhum.

### Estados mostrados

- **Aba selecionada** (`ENTRAR`, sublinhado dourado + tinta cheia) vs **aba não selecionada**
  (`CRIAR CONTA`, `.4`).
- **Campo vazio com placeholder** (`.35`) — não há estado preenchido, focado, com erro nem validação
  desenhados.
- Botão primário só em repouso — sem `loading` nem `disabled`.

### Gaps contra a API (decisões pendentes)

1. **Não há campo de senha**, mas `LoginRequest` e `RegistrarRequest` exigem `senha` (`@NotBlank`,
   8–72 chars no registro). E "Enviaremos um código de confirmação." descreve fluxo OTP, que **não
   existe** na API. Ou o backend ganha OTP, ou a tela ganha campo `SENHA` (usar o mesmo componente de
   input, `margin-top:22px`).
2. `CRIAR CONTA` precisa do campo `NOME` (`@NotBlank`, máx. 120) — sem tela desenhada.

---

## 03 Home do cliente

- **`data-screen-label`**: `03 Home do cliente` · linhas 86–124
- **Propósito**: dashboard do cliente. Responde "quando é meu próximo horário?", oferece o CTA de
  novo agendamento e um atalho para repetir a última visita.
- Variante clara da mesma tela: frame **`18 Home light`** (linhas 636–674).

### Árvore de elementos

1. **Frame** — padrão §0.2
2. **StatusBar** — padrão §0.3 → **`9:41`**
3. **Corpo** — `padding:44px 28px 0`
   1. **Eyebrow de data** — `font-size:9px;font-weight:600;letter-spacing:.26em;color:rgba(241,235,224,.48)`
      → **`TERÇA-FEIRA, 1 DE SETEMBRO`**
   2. **Saudação (H1)** — `font-family:'Playfair Display',serif;font-size:31px;margin-top:12px`
      → **`Boa tarde, Rafael.`** (saudação por hora do dia + primeiro nome + ponto final)
   3. **Card do próximo agendamento** — `border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px);padding:26px 24px;margin-top:42px;display:flex;flex-direction:column;gap:14px`
      (borda **dourada** = o único card assim na jornada; é o destaque da tela)
      1. label — `font-size:9px;font-weight:600;letter-spacing:.24em;color:var(--gold,#C9A96A)`
         → **`PRÓXIMO AGENDAMENTO`**
      2. serviço — `font-family:'Playfair Display',serif;font-size:23px` → **`Corte Assinatura`**
      3. data/hora — `font-size:10.5px;font-weight:500;letter-spacing:.16em;color:rgba(241,235,224,.72)`
         → **`SEX, 11 SET · 15:30 — 16:30`**
         (dia da semana abreviado em caps, `·` U+00B7 como separador, travessão `—` U+2014 entre horas)
      4. divisor — `height:1px;background:rgba(241,235,224,.12);margin-top:6px`
      5. rodapé do card — `display:flex;justify-content:space-between;align-items:center;margin-top:2px`
         - profissional — `font-size:12.5px;color:rgba(241,235,224,.62)` → **`Stewer Gabriel · Visagista`**
         - ações — `display:flex;gap:20px`
           - **`REAGENDAR`** — `font-size:9px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.5);cursor:pointer`
           - **`DETALHES`** — `font-size:9px;font-weight:600;letter-spacing:.18em;color:var(--gold,#C9A96A);cursor:pointer`
             (dourado = ação primária do par; `REAGENDAR` fica secundária em `.5`)
   4. **Botão primário** — §0.5 com `margin-top:28px` → **`NOVO AGENDAMENTO`**
   5. **Bloco "última visita"** — `margin-top:48px`
      - label — `font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.48)` → **`ÚLTIMA VISITA`**
      - linha — `display:flex;justify-content:space-between;align-items:center;margin-top:16px;padding-bottom:18px;border-bottom:1px solid rgba(241,235,224,.1)`
        - texto — `font-size:13.5px;color:rgba(241,235,224,.8)` → **`Corte & Barba`** seguido de
          `<span style="color:rgba(241,235,224,.4)">` → **`· 14 de agosto`**
          (transcrição da linha inteira: **`Corte & Barba · 14 de agosto`**, com a data em `.4`)
        - **`REPETIR`** — `font-size:9px;font-weight:600;letter-spacing:.18em;color:var(--gold,#C9A96A);cursor:pointer`
4. **BottomTabBar** — §0.4, tab ativa **`INÍCIO`** (traço dourado + rótulo dourado); `AGENDAR`,
   `MEUS HORÁRIOS`, `PERFIL` em `rgba(241,235,224,.4)`.

### Interativos (4 `cursor:pointer`)

| elemento | ação |
|---|---|
| **`REAGENDAR`** | abre o fluxo de remarcação do agendamento em foco → entra em 06 (Data e horário) já com serviço e profissional travados |
| **`DETALHES`** | abre o detalhe do agendamento (no board do cliente não há tela dedicada; usar 07 em modo leitura, ou o card de 08 — decisão pendente) |
| **`NOVO AGENDAMENTO`** | inicia o fluxo limpo → 04 Escolha de serviço (passo 01 de 04) |
| **`REPETIR`** | pré-seleciona serviço + profissional da última visita e pula direto para 06 (passo 03) |
| (tabs) | ver §0.4 — sem `cursor:pointer` no design, mas navegam |

### Dados de API

- **Saudação**: `usuario.nome` de `TokenResponse`/`GET /auth/eu` — usar só o primeiro token do nome
  (`Rafael` de `Rafael Duarte`, cf. tela 09).
- **Eyebrow de data**: data local do dispositivo, formatada `EEEE, d 'DE' MMMM` em caps, pt-BR.
  Nenhuma chamada.
- **Card do próximo agendamento**: `GET /agendamentos/meus?periodo=futuros`
  (`AgendamentoResource.meus`, linha 68; `@RolesAllowed(CLIENTE)`) → `List<AgendamentoResponse>`;
  pegar o primeiro por `inicio` ascendente. Mapeamento:
  - `servicoNome` → `Corte Assinatura`
  - `inicio`/`fim` → `SEX, 11 SET · 15:30 — 16:30`
  - `profissionalNome` → parte antes do `·`; a parte **`Visagista`** vem de
    `ProfissionalResponse.especialidade` (`GET /profissionais/{id}`) — **não existe** em
    `AgendamentoResponse`, exige a segunda chamada ou cache local.
  - `status` esperado `AGENDADO`
- **Última visita**: `GET /agendamentos/meus?periodo=historico` → primeiro item com
  `status == CONCLUIDO` por `inicio` descendente. `servicoNome` → **`Corte & Barba`**;
  `inicio` → **`· 14 de agosto`** (`d 'de' MMMM`, minúsculas). `REPETIR` reusa
  `servicoId` + `profissionalId` desse item.

### Slots de imagem

Nenhum. A Home não tem foto nem avatar.

### Estados mostrados

- **Estado "com próximo agendamento"** — é o único desenhado.
- **Tab ativa** (`INÍCIO`) vs inativas.
- **Hierarquia de ação**: `DETALHES` e `REPETIR` em dourado; `REAGENDAR` em `.5`.
- **Não desenhados** (necessários na implementação): cliente **sem** próximo agendamento (esconder o
  card dourado? só o botão `NOVO AGENDAMENTO`?), cliente **sem** histórico (esconder o bloco
  `ÚLTIMA VISITA`), e o caso de 2+ agendamentos futuros (o design mostra 1 card fixo).
- `border:1px solid var(--gold,#C9A96A)` no card mais o botão claro logo abaixo criam a única
  concentração de contraste da tela — não replicar borda dourada em outros cards da Home.

---

## 04 Escolha de serviço

- **`data-screen-label`**: `04 Escolha de serviço` · linhas 125–145
- **Propósito**: passo 1 de 4. Catálogo do ateliê como lista-preçário (nome display + duração +
  preço), onde tocar na linha seleciona e avança.

### Árvore de elementos

1. **Frame** — padrão §0.2
2. **StatusBar** — padrão §0.3 → **`9:41`**
3. **HeaderDePasso** — §0.7 → **`←`** + **`PASSO 01 DE 04`**
4. **Corpo** — `padding:34px 28px 0`
   1. **Eyebrow** — `font-size:9px;font-weight:600;letter-spacing:.26em;color:rgba(241,235,224,.48)`
      → **`NOVO AGENDAMENTO`**
   2. **H1** — `font-family:'Playfair Display',serif;font-size:29px;margin-top:12px`
      → **`Escolha o serviço`**
   3. **Lista** — wrapper `margin-top:26px`; cada linha:
      `display:flex;justify-content:space-between;align-items:center;padding:21px 0;border-bottom:1px solid rgba(241,235,224,.1);cursor:pointer`
      - coluna esquerda: `display:flex;flex-direction:column;gap:7px`
        - nome: `font-family:'Playfair Display',serif;font-size:19px`
        - duração: `font-size:9px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45)`
      - preço: `font-size:13.5px;font-weight:500;color:rgba(241,235,224,.85)`

      | # | nome (literal) | duração (literal) | preço (literal) | `duracaoMinutos` | `precoCentavos` |
      |---|---|---|---|---|---|
      | 1 | `Análise de Visagismo` | `90 MIN` | `R$ 320` | 90 | 32000 |
      | 2 | `Corte Assinatura` | `60 MIN` | `R$ 190` | 60 | 19000 |
      | 3 | `Corte & Barba` | `90 MIN` | `R$ 260` | 90 | 26000 |
      | 4 | `Ritual de Barba` | `45 MIN` | `R$ 140` | 45 | 14000 |
      | 5 | `Camuflagem de Fios` | `60 MIN` | `R$ 210` | 60 | 21000 |
      | 6 | `Consultoria de Imagem` | `120 MIN` | `R$ 480` | 120 | 48000 |

      Todas as 6 linhas têm `border-bottom` — inclusive a última (não há regra "last-child sem borda").
      A `descricao` do serviço **não aparece** nesta tela, mesmo existindo em `ServicoResponse`.
      Formatação do preço: `R$ ` + inteiro sem centavos e **sem separador de milhar** nos exemplos
      (todos < 1000). Definir a regra para ≥ R$ 1.000 e para preços com centavos (o design não cobre).

### Interativos (7 `cursor:pointer`)

| elemento | ação |
|---|---|
| **`←`** | volta para 03 Home, descartando o rascunho do agendamento |
| linha de serviço (6×) | grava `servicoId` no rascunho e avança para 05 (passo 02 de 04). Toque na linha inteira, não em botão — manter a área toda clicável (334×~76px) |

### Dados de API

- `GET /servicos` (`ServicoResource.listar`, linha 51; `@Authenticated`) → `List<ServicoResponse>`
  `{ id, tenantId, nome, descricao, duracaoMinutos, precoCentavos, ativo, createdAt, updatedAt }`,
  **ordenados por nome** pelo backend.
  - `incluirInativos` é ignorado para cliente: a lista já vem só com `ativo=true`. Não enviar o param.
  - **Atenção**: a ordem do design (`Análise…`, `Corte Assinatura`, `Corte & Barba`, `Ritual…`,
    `Camuflagem…`, `Consultoria…`) **não é alfabética**. Ou o design é ilustrativo, ou é preciso um
    campo de ordenação/curadoria no backend. Como está, a tela real virá em ordem alfabética
    (`Análise de Visagismo`, `Camuflagem de Fios`, `Consultoria de Imagem`, `Corte & Barba`,
    `Corte Assinatura`, `Ritual de Barba`).
  - `duracaoMinutos` → `${n} MIN`; `precoCentavos` → `R$ ${centavos/100}`.
- O `duracaoMinutos` escolhido é o que define o tamanho do slot em 06 (`HorariosLivresResponse.duracaoMinutos`).

### Slots de imagem

Nenhum. O catálogo é puramente tipográfico — não introduzir thumbnails.

### Estados mostrados

- Só o estado de repouso das 6 linhas. **Nenhuma linha selecionada** (a seleção é imediata e navega),
  nenhum hover, nenhum serviço desabilitado, nenhuma lista vazia.
- Ocupação vertical: 50 (status) + ~39 (header) + 34 + ~66 (eyebrow+H1) + 26 + 6×~76 ≈ 677px, com
  ~167px de folga. **7+ serviços já estouram os 844px** → a lista precisa ser rolável na
  implementação, ainda que o design não mostre scroll.

---

## 05 Escolha de profissional

- **`data-screen-label`**: `05 Escolha de profissional` · linhas 146–170
- **Propósito**: passo 2 de 4. Hoje o ateliê tem um profissional só, então a tela é um card-retrato
  já **selecionado** que funciona como confirmação, mais uma nota de que virão outros.

### Árvore de elementos

1. **Frame** — padrão §0.2
2. **StatusBar** — padrão §0.3 → **`9:41`**
3. **HeaderDePasso** — §0.7 → **`←`** + **`PASSO 02 DE 04`**
4. **Corpo** — `padding:34px 28px 0`
   1. **Eyebrow** — `font-size:9px;font-weight:600;letter-spacing:.26em;color:rgba(241,235,224,.48)`
      → **`NOVO AGENDAMENTO`**
   2. **H1** — `font-family:'Playfair Display',serif;font-size:29px;margin-top:12px`
      → **`Escolha o profissional`**
   3. **Card do profissional (selecionado)** — `border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px);margin-top:30px;overflow:hidden`
      (borda dourada = **estado selecionado** do card; `overflow:hidden` corta a imagem no radius)
      1. **SLOT DE IMAGEM** —
         `<image-slot id="pro-retrato" shape="rect" placeholder="Retrato do profissional" style="width:100%;height:330px;display:block">`
         - `id`: `pro-retrato` · `shape`: `rect` · placeholder textual: **`Retrato do profissional`**
         - dimensões efetivas: **332×330px** (334 do container menos 2px de borda) → proporção
           ~1.006:1, praticamente quadrada. Pedir a foto em 1:1 e cobrir com `object-fit:cover`.
      2. **Bloco de texto** — `padding:24px;display:flex;flex-direction:column;gap:10px`
         1. nome — `font-family:'Playfair Display',serif;font-size:23px` → **`Stewer Gabriel`**
         2. especialidade — `font-size:9px;font-weight:600;letter-spacing:.22em;color:var(--gold,#C9A96A)`
            → **`VISAGISTA & CONSULTOR DE IMAGEM`**
         3. papel — `font-size:12.5px;color:rgba(241,235,224,.55)` → **`Fundador do ateliê`**
         4. divisor — `height:1px;background:rgba(241,235,224,.12);margin-top:8px`
         5. rodapé — `display:flex;justify-content:space-between;align-items:center;margin-top:4px`
            - **`SELECIONADO`** — `font-size:9px;font-weight:600;letter-spacing:.2em;color:var(--gold,#C9A96A)`
            - marca de seleção — `width:7px;height:7px;border:1px solid var(--gold,#C9A96A);transform:rotate(45deg)`
              (losango vazio de 7px, contorno dourado; é o "checkbox" da marca — não usar ✓)
   4. **Botão primário** — §0.5 com `margin-top:28px` → **`CONTINUAR`**
   5. **Nota** — `font-size:11px;color:rgba(241,235,224,.38);margin-top:20px;text-align:center`
      → **`Em breve, novos profissionais do ateliê.`**

### Interativos (2 `cursor:pointer`)

| elemento | ação |
|---|---|
| **`←`** | volta para 04, preservando o rascunho |
| **`CONTINUAR`** | grava `profissionalId` e avança para 06 (passo 03 de 04) |

O card em si **não tem `cursor:pointer`** — está selecionado por padrão porque é o único. Com 2+
profissionais, a lista vira cards tocáveis e é preciso derivar o estado **não selecionado**: trocar
`border:1px solid var(--gold,#C9A96A)` por `border:1px solid rgba(241,235,224,.16)` (borda de card do
padrão 08), esconder o par `SELECIONADO` + losango, e manter o resto igual.

### Dados de API

- `GET /profissionais` (`ProfissionalResource.listar`, linha 49; `@Authenticated`) →
  `List<ProfissionalResponse> { id, tenantId, usuarioId, nome, email, telefone, especialidade, bio, fotoUrl, ativo, createdAt, updatedAt }`.
  - `incluirInativos` é ignorado para cliente — só vêm ativos.
  - `nome` → **`Stewer Gabriel`**
  - `especialidade` → **`VISAGISTA & CONSULTOR DE IMAGEM`** (o design mostra em caps; ou o dado vem em
    caps ou aplica-se `text-transform:uppercase`, o que é mais seguro)
  - `fotoUrl` → `src` do slot de imagem
  - **`Fundador do ateliê`** não tem campo próprio. Candidato: primeira linha de `bio`, ou um campo
    novo (`titulo`/`cargo`). Não confundir com `especialidade`, que já está na linha dourada.
- Se a lista tiver 1 item, pré-selecionar e manter esta tela como confirmação (ou pular direto para
  06, mas então o contador `PASSO 02 DE 04` precisa mudar).

### Slots de imagem

**Sim, um** — o único slot de imagem em todas as 9 telas do cliente:
`#pro-retrato`, `shape="rect"`, `width:100%;height:330px;display:block`, placeholder
**`Retrato do profissional`**. Fallback quando `fotoUrl` é nulo: manter o retângulo de 330px com
`background:rgba(241,235,224,.06)` (derivado da escada) ou colapsar o slot — não desenhado, decidir.

### Estados mostrados

- **Selecionado**: borda dourada do card + label `SELECIONADO` + losango dourado.
- **Vazio/futuro**: a nota `Em breve, novos profissionais do ateliê.` é o tratamento desenhado para
  "só existe um profissional".
- Não desenhados: card não selecionado, profissional indisponível na data, lista com scroll.

---

## 06 Data e horário

- **`data-screen-label`**: `06 Data e horário` · linhas 171–230
- **Propósito**: passo 3 de 4. Calendário mensal + grade de horários do dia escolhido. A tela mais
  densa e mais interativa da jornada (11 dos 29 `cursor:pointer`).
- Variante clara da mesma tela: frame **`19 Data e horário light`** (linhas 675–764).

### Árvore de elementos

1. **Frame** — padrão §0.2
2. **StatusBar** — padrão §0.3 → **`9:41`**
3. **HeaderDePasso** — §0.7 → **`←`** + **`PASSO 03 DE 04`**
4. **Corpo** — `padding:30px 28px 0` (note: **30px**, e não os 34px de 04/05/07)
   1. **H1** — `font-family:'Playfair Display',serif;font-size:29px` → **`Data e horário`**
      (**sem eyebrow `NOVO AGENDAMENTO`** — é a única tela do fluxo que abre mão dele, para caber o
      calendário)
   2. **Navegação de mês** — `display:flex;justify-content:space-between;align-items:center;margin-top:26px`
      - anterior — `font-size:16px;color:rgba(241,235,224,.4);cursor:pointer;padding:0 6px` → **`‹`** (U+2039)
        — a `.4` contra a `.75` do próximo indica **mês anterior no limite** (não se agenda no passado)
      - mês — `font-family:'Playfair Display',serif;font-size:18px` → **`Setembro 2026`**
      - próximo — `font-size:16px;color:rgba(241,235,224,.75);cursor:pointer;padding:0 6px` → **`›`** (U+203A)
   3. **Cabeçalho de semana** — `display:grid;grid-template-columns:repeat(7,1fr);margin-top:18px`;
      cada célula `text-align:center;font-size:8.5px;font-weight:600;letter-spacing:.14em;color:rgba(241,235,224,.38);padding:6px 0`
      → **`D`** `S` `T` `Q` `Q` `S` `S` (semana começa no domingo)
   4. **Grade de dias** — `display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-top:4px`
      - 2 células vazias (`<div></div>`) antes do dia 1 → dia 1 cai na 3ª coluna (`T` = terça).
        Confere com o eyebrow da Home (`TERÇA-FEIRA, 1 DE SETEMBRO`) e com 2026.
      - **Dia 1 (hoje)** — `height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-size:13px`
        com dois filhos: `<span>1</span>` (cor **herdada** = `#F1EBE0` cheio) e
        `<span style="width:3px;height:3px;border-radius:50%;background:var(--gold,#C9A96A)"></span>`
        → **ponto dourado de 3px** abaixo do número. É o marcador de "hoje". É o único dia com layout
        `flex-direction:column`.
      - **Dia disponível** (2,3,4,5,8,9,10,12,15,16,17,18,19,22,23,24,25,26,29,30) —
        `height:40px;display:flex;align-items:center;justify-content:center;font-size:13px;color:rgba(241,235,224,.8)`
      - **Dia indisponível** (6,7,13,14,20,21,27,28) — mesmo CSS com `color:rgba(241,235,224,.25)`.
        São exatamente **todos os domingos e segundas** de setembro/2026 → o ateliê não abre
        domingo e segunda. Sem `cursor:pointer`.
      - **Dia selecionado (11)** — `height:40px;display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--gold,#C9A96A);border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px)`
        → número e contorno dourados, fundo transparente. 11/09/2026 é sexta, coerente com
        `HORÁRIOS · SEXTA, 11 SET` e com `SEX, 11 SET` da Home.
      - Grade termina em **30** (último dia do mês); a última linha fica incompleta, **sem** células
        de preenchimento do mês seguinte. **Nenhuma célula de dia tem `cursor:pointer` no design** —
        mas os dias disponíveis obviamente precisam ser tocáveis (40px de altura já serve de alvo).
   5. **Label da grade de horários** — `font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.48);margin-top:26px`
      → **`HORÁRIOS · SEXTA, 11 SET`**
   6. **Grade de horários** — `display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px`
      (3 colunas, 3 linhas, 9 slots — largura da célula ≈ 104,7px)
      - **Slot disponível** (`09:00`, `10:00`, `13:30`, `14:30`, `16:30`, `17:30`) —
        `border:1px solid rgba(241,235,224,.16);border-radius:var(--r,2px);padding:13px 0;text-align:center;font-size:12px;font-weight:500;letter-spacing:.08em;cursor:pointer`
        (cor herdada `#F1EBE0`)
      - **Slot indisponível** (`11:00`, `18:30`) —
        `padding:13px 0;text-align:center;font-size:12px;font-weight:500;letter-spacing:.08em;color:rgba(241,235,224,.22)`
        → **sem borda nenhuma** e sem `cursor:pointer`. O estado desabilitado se lê pela ausência da
        moldura, não por tachado/opacity.
      - **Slot selecionado** (`15:30`) —
        `border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px);padding:13px 0;text-align:center;font-size:12px;font-weight:600;letter-spacing:.08em;color:var(--gold,#C9A96A);cursor:pointer`
        → borda + texto dourados **e `font-weight:600`** (os disponíveis são `500`). Mantém
        `cursor:pointer` (tocar de novo = re-selecionar / desmarcar).

      Ordem literal, na leitura em linhas: `09:00` · `10:00` · `11:00` · `13:30` · `14:30` ·
      `15:30` · `16:30` · `17:30` · `18:30`. Passo de 60 min, com um vão entre `11:00` e `13:30`
      (almoço, e não um slot desabilitado).
   7. **Botão primário** — §0.5 com `margin-top:26px` → **`CONTINUAR`**

### Interativos (11 `cursor:pointer`)

| elemento | ação |
|---|---|
| **`←`** | volta para 05 |
| **`‹`** | mês anterior; desenhado em `.4` = desabilitado no mês atual |
| **`›`** | mês seguinte; recarrega disponibilidade do novo mês |
| 7 slots de horário (`09:00`, `10:00`, `13:30`, `14:30`, `15:30`, `16:30`, `17:30`) | seleciona o horário; grava `inicio` (data + hora, ISO-8601 com offset) no rascunho |
| **`CONTINUAR`** | avança para 07 Confirmação (passo 04 de 04) |
| células de dia disponíveis | (sem pointer no design) selecionam a data e recarregam a grade de horários |

### Dados de API

- **Grade de horários do dia**: `GET /profissionais/{profissionalId}/horarios-livres?data=YYYY-MM-DD&servicoId={uuid}`
  (`HorariosLivresResource`, linha 34; `@Authenticated`) →
  `HorariosLivresResponse { data, profissionalId, servicoId, duracaoMinutos, horarios: [ { inicio, fim } ] }`.
  - Cada `HorarioLivreResponse.inicio` → o rótulo `HH:mm` do slot; `fim` alimenta o
    `15:30 — 16:30` da tela 07.
  - `duracaoMinutos` vem do serviço escolhido em 04 e define o fatiamento.
  - 404 = profissional ou serviço inexistente; 422 = serviço/profissional inativo; lista vazia =
    profissional não atende no dia.
  - **Gap**: a API devolve **apenas slots livres**, mas o design mostra `11:00` e `18:30` como
    horários **existentes e indisponíveis**. Para pintar o estado desabilitado é preciso (a) um campo
    novo tipo `ocupado`/`disponivel` na resposta, ou (b) o cliente calcular a grade teórica a partir
    de `GET /profissionais/{id}/disponibilidade` (`DisponibilidadeResponse { diaSemana, horaInicio, horaFim }`)
    e marcar como indisponível tudo que não voltou em `horarios-livres`. (b) funciona sem tocar no
    backend e é o caminho recomendado.
- **Dias abertos/fechados do mês**: `GET /profissionais/{profissionalId}/disponibilidade`
  (`AgendaProfissionalResource.grade`, linha 56) → faixas por `diaSemana` (0=domingo … 6=sábado);
  dia da semana sem faixa → renderizar em `rgba(241,235,224,.25)`. O design fecha `0` (domingo) e
  `1` (segunda). Complementar com `GET /profissionais/{profissionalId}/bloqueios`
  (`BloqueioResponse { inicio, fim, motivo }`) para apagar datas específicas.
  **Não há endpoint de "dias com vaga no mês"** — sem ele, um dia aberto mas 100% lotado aparecerá
  como disponível e só revelará a grade vazia ao ser tocado. Ver Gaps globais.
- **Marcador de hoje**: data local, não API.
- Mês exibido: **`Setembro 2026`** (`LLLL yyyy` em pt-BR, primeira letra maiúscula).

### Slots de imagem

Nenhum.

### Estados mostrados

Esta é a tela com o repertório completo de estados do design:

| estado | onde | como se lê |
|---|---|---|
| hoje | dia `1` | tinta cheia + ponto dourado de 3px abaixo |
| data selecionada | dia `11` | borda 1px dourada + número dourado |
| data disponível | dias `2`…`30` úteis | `color:rgba(241,235,224,.8)`, sem borda |
| data indisponível | domingos e segundas | `color:rgba(241,235,224,.25)` |
| fora do mês | 2 células iniciais | `<div></div>` vazio, sem número |
| horário disponível | 6 slots | borda `rgba(241,235,224,.16)`, peso 500 |
| horário selecionado | `15:30` | borda + texto dourados, peso 600 |
| horário indisponível | `11:00`, `18:30` | **sem borda**, `color:rgba(241,235,224,.22)` |
| navegação de mês no limite | `‹` | `color:rgba(241,235,224,.4)` vs `.75` do `›` |

Não desenhados: dia sem nenhum horário livre (grade vazia), carregando a grade, erro 422.

**Ocupação vertical**: 50 + ~39 + 30 + ~39 (H1) + 26 + ~27 (nav) + 18 + ~29 (cabeçalho semana) + 4 +
5 linhas de 40px + 4×2 de gap + 26 + ~15 + 16 + 3×~44 + 2×10 + 26 + ~54 ≈ 830px. **A tela está no
limite dos 844px** — cuidado: um mês que ocupe 6 linhas de grade (ex.: mês que começa no sábado)
adiciona 42px e estoura. Prever scroll ou altura de linha condicional.

---

## 07 Confirmação

- **`data-screen-label`**: `07 Confirmação` · linhas 231–256
- **Propósito**: passo 4 de 4. Recibo antes do commit: espelha as 4 escolhas, mostra o valor, informa
  a política de cancelamento e efetiva a reserva.

### Árvore de elementos

1. **Frame** — padrão §0.2
2. **StatusBar** — padrão §0.3 → **`9:41`**
3. **HeaderDePasso** — §0.7 → **`←`** + **`PASSO 04 DE 04`**
4. **Corpo** — `padding:34px 28px 0`
   1. **Eyebrow** — `font-size:9px;font-weight:600;letter-spacing:.26em;color:rgba(241,235,224,.48)`
      → **`NOVO AGENDAMENTO`**
   2. **H1** — `font-family:'Playfair Display',serif;font-size:29px;margin-top:12px`
      → **`Confirme os detalhes`**
   3. **Card de resumo** — `border:1px solid rgba(241,235,224,.14);border-radius:var(--r,2px);padding:28px 26px;margin-top:32px;display:flex;flex-direction:column;gap:22px`
      (borda neutra `.14` — deliberadamente **não** dourada; o dourado desta tela é zero)
      Todos os labels: `font-size:8.5px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.45)`.
      1. **grupo SERVIÇO** — `display:flex;flex-direction:column;gap:8px`
         - label → **`SERVIÇO`**
         - valor — `font-family:'Playfair Display',serif;font-size:21px` → **`Corte Assinatura`**
           (único valor em Playfair do card; é o item principal)
      2. **grupo PROFISSIONAL** — `display:flex;flex-direction:column;gap:8px`
         - label → **`PROFISSIONAL`**
         - valor — `font-size:14.5px;color:rgba(241,235,224,.88)` → **`Stewer Gabriel`**
      3. **linha DATA + HORÁRIO** — `display:flex;gap:56px` (gap fixo de 56px, não `space-between`)
         - grupo `display:flex;flex-direction:column;gap:8px`: label **`DATA`** +
           valor `font-size:14.5px;color:rgba(241,235,224,.88)` → **`Sexta, 11 de setembro`**
         - grupo `display:flex;flex-direction:column;gap:8px`: label **`HORÁRIO`** +
           valor `font-size:14.5px;color:rgba(241,235,224,.88)` → **`15:30 — 16:30`** (travessão `—`)
      4. **divisor** — `height:1px;background:rgba(241,235,224,.12)`
      5. **linha VALOR** — `display:flex;justify-content:space-between;align-items:flex-end`
         - label → **`VALOR`**
         - valor — `font-family:'Playfair Display',serif;font-size:24px` (tinta cheia `#F1EBE0`)
           → **`R$ 190`**
   4. **Política** — `font-size:11.5px;color:rgba(241,235,224,.42);margin-top:20px;line-height:1.7`
      → **`Cancelamento sem custo até 24 horas antes do horário marcado.`**
   5. **Botão primário** — §0.5 com `margin-top:30px` → **`CONFIRMAR AGENDAMENTO`**
   6. **Ação terciária** — `text-align:center;font-size:9px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45);margin-top:22px;cursor:pointer`
      → **`ALTERAR DATA OU HORÁRIO`** (texto puro, sem borda, sem `style-hover`)

### Interativos (3 `cursor:pointer`)

| elemento | ação |
|---|---|
| **`←`** | volta para 06, preservando as escolhas |
| **`CONFIRMAR AGENDAMENTO`** | `POST /agendamentos` com o rascunho; sucesso → volta para 03 Home com o card dourado já preenchido (ou tela de sucesso, não desenhada) |
| **`ALTERAR DATA OU HORÁRIO`** | atalho explícito para 06 — mesmo destino do `←`, oferecido como texto para quem não confia na seta |

### Dados de API

- Nenhuma leitura nova: a tela desenha o **rascunho local** montado em 04, 05 e 06.
- Envia: `POST /agendamentos` (`AgendamentoResource.criar`, linha 50; `@RolesAllowed(CLIENTE)`) —
  `AgendamentoRequest { profissionalId, servicoId, inicio (OffsetDateTime ISO-8601 com offset), observacao? }`.
  - `inicio` = data selecionada em 06 + hora do slot, com offset. O `fim` **não** é enviado: o
    backend calcula pela duração do serviço.
  - `observacao` (máx. 2000 chars, "Recado do cliente para o profissional") **não tem campo na tela** —
    ou vai sempre nulo, ou o design precisa de um input. Ver Gaps.
- Recebe: `201 Created` + `AgendamentoResponse` (`Location: /agendamentos/{id}`). Usar a resposta para
  atualizar 03 e 08 sem refetch.
- Valores exibidos e suas origens: **`Corte Assinatura`** ← `ServicoResponse.nome`;
  **`R$ 190`** ← `precoCentavos` 19000; **`15:30 — 16:30`** ← `HorarioLivreResponse.inicio`/`fim`
  (ou `inicio` + `duracaoMinutos`); **`Sexta, 11 de setembro`** ← data selecionada,
  formato `EEEE, d 'de' MMMM` com inicial maiúscula; **`Stewer Gabriel`** ← `ProfissionalResponse.nome`.
- A frase **`Cancelamento sem custo até 24 horas antes do horário marcado.`** é texto fixo de
  política — não há campo na API. Se virar configuração por tenant, precisa de endpoint.

### Slots de imagem

Nenhum.

### Estados mostrados

- Um único estado: rascunho completo, pronto para confirmar.
- Não desenhados: `loading` do POST, conflito de horário (o slot foi tomado entre 06 e 07 — cenário
  real, o backend rejeita), erro de validação, e a **tela de sucesso** pós-confirmação.

---

## 08 Meus agendamentos

- **`data-screen-label`**: `08 Meus agendamentos` · linhas 257–290
- **Propósito**: histórico completo do cliente em duas seções — `PRÓXIMOS` (card rico) e `HISTÓRICO`
  (lista densa com status). É a tab `MEUS HORÁRIOS`.

### Árvore de elementos

1. **Frame** — padrão §0.2
2. **StatusBar** — padrão §0.3 → **`9:41`**
3. **Corpo** — `padding:44px 28px 0`
   1. **H1** — `font-family:'Playfair Display',serif;font-size:29px` → **`Meus agendamentos`**
      (sem eyebrow)
   2. **Label** — `font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.48);margin-top:42px`
      → **`PRÓXIMOS`**
   3. **Card do próximo** — `border:1px solid rgba(241,235,224,.16);border-radius:var(--r,2px);padding:20px 22px;margin-top:16px;display:flex;align-items:center;gap:20px`
      (borda **neutra** aqui, ao contrário do card dourado da Home — o destaque não se repete)
      1. **bloco de data** — `display:flex;flex-direction:column;align-items:center;gap:4px;width:44px;flex:none`
         - dia — `font-family:'Playfair Display',serif;font-size:26px` → **`11`**
         - mês — `font-size:8.5px;font-weight:600;letter-spacing:.2em;color:rgba(241,235,224,.45)` → **`SET`**
      2. **divisor vertical** — `width:1px;align-self:stretch;background:rgba(241,235,224,.12)`
      3. **bloco central** — `display:flex;flex-direction:column;gap:7px;flex:1`
         - serviço — `font-family:'Playfair Display',serif;font-size:18px` → **`Corte Assinatura`**
         - meta — `font-size:9px;font-weight:600;letter-spacing:.16em;color:rgba(241,235,224,.5)`
           → **`15:30 · STEWER GABRIEL`** (nome do profissional em caps)
      4. **badge de status** — `font-size:8.5px;font-weight:600;letter-spacing:.18em;color:var(--gold,#C9A96A);align-self:flex-start`
         → **`CONFIRMADO`** (dourado; `align-self:flex-start` alinha ao topo do card, não ao centro)
   4. **Label** — `font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.48);margin-top:44px`
      → **`HISTÓRICO`**
   5. **Lista do histórico** — wrapper `margin-top:8px`; cada linha
      `display:flex;align-items:center;gap:18px;padding:19px 0;border-bottom:1px solid rgba(241,235,224,.1)`
      com três colunas:
      - data — `width:56px;font-size:9.5px;font-weight:600;letter-spacing:.14em;color:rgba(241,235,224,.45);flex:none`
      - serviço — `flex:1;font-size:14px;color:rgba(241,235,224,.85)`
      - status — `font-size:8.5px;font-weight:600;letter-spacing:.18em;color:rgba(241,235,224,.4)`

      | # | data | serviço | status | extra |
      |---|---|---|---|---|
      | 1 | `14 AGO` | `Corte & Barba` | `CONCLUÍDO` | — |
      | 2 | `10 JUL` | `Análise de Visagismo` | `CONCLUÍDO` | — |
      | 3 | `02 JUN` | `Corte Assinatura` | `CONCLUÍDO` | — |
      | 4 | `12 MAI` | `Ritual de Barba` | `CANCELADO` | linha inteira com **`opacity:.45`** |

      A 4ª linha tem o style completo `display:flex;align-items:center;gap:18px;padding:19px 0;border-bottom:1px solid rgba(241,235,224,.1);opacity:.45`
      — o cancelado se lê pelo **opacity da linha inteira**, não por cor diferente do badge (o badge
      continua `rgba(241,235,224,.4)`; combinado com o opacity, o valor efetivo cai para ~.18).
      Dia sempre com dois dígitos (`02`, `12`) e mês em 3 letras caps (`AGO`, `JUL`, `JUN`, `MAI`).
4. **BottomTabBar** — §0.4, tab ativa **`MEUS HORÁRIOS`**.

### Interativos

**Zero `cursor:pointer` nesta tela.** Nem o card de `PRÓXIMOS`, nem as linhas do histórico, nem as
tabs. Na implementação:
- as 4 tabs navegam (§0.4);
- o card de `PRÓXIMOS` deveria abrir o detalhe / permitir cancelar (o cliente não tem outra porta
  para `PATCH /agendamentos/{id}/status` com `CANCELADO`) — **ação ausente do design**, ver Gaps;
- linhas do histórico poderiam repetir o serviço (como o `REPETIR` da Home), mas nada no design indica isso.

### Dados de API

- `GET /agendamentos/meus?periodo=futuros` → alimenta a seção `PRÓXIMOS`
- `GET /agendamentos/meus?periodo=historico` → alimenta `HISTÓRICO`
  (ou uma chamada `?periodo=todos`, que é o `@DefaultValue`, e particionar no cliente por
  `status`/`inicio`. `AgendamentoService.Periodo.de(periodo)` aceita `futuros`, `historico`, `todos`.)
- `AgendamentoResponse` → tela:
  - `inicio` → `11` + `SET` (card) e `14 AGO` (lista)
  - `servicoNome` → `Corte Assinatura`, `Corte & Barba`, …
  - `inicio` + `profissionalNome` → `15:30 · STEWER GABRIEL`
  - `status` → badge, com **tradução obrigatória** (o enum não bate com os rótulos):

    | `StatusAgendamento` | rótulo no design | cor |
    |---|---|---|
    | `AGENDADO` | **`CONFIRMADO`** | `var(--gold,#C9A96A)` |
    | `CONCLUIDO` | **`CONCLUÍDO`** (com acento) | `rgba(241,235,224,.4)` |
    | `CANCELADO` | **`CANCELADO`** | `rgba(241,235,224,.4)` + linha em `opacity:.45` |
    | `NAO_COMPARECEU` | **não existe no design** | a definir (sugestão: mesmo tratamento de `CANCELADO`) |

### Slots de imagem

Nenhum.

### Estados mostrados

- **Próximo agendamento existente**: 1 card. Com 2+ futuros, o design não diz se empilha (provável:
  repetir o card com `margin-top:16px`).
- **Status concluído** vs **status cancelado** (opacity da linha) vs **confirmado** (dourado).
- **Não desenhados**: nenhum agendamento futuro (seção `PRÓXIMOS` vazia), histórico vazio (cliente
  novo — a tela ficaria com dois labels soltos), paginação/scroll (`GET /meus` não tem paginação),
  `NAO_COMPARECEU`.
- Ocupação: 50 + 44 + ~39 + 42 + ~15 + 16 + ~86 (card) + 44 + ~15 + 8 + 4×~58 ≈ 631px + tab bar
  (~86px) ≈ 717px. **Sobram ~127px → cerca de 2 linhas extras de histórico** antes de precisar de
  scroll. Lista longa é o caso real: tornar rolável.

---

## 09 Perfil do cliente

- **`data-screen-label`**: `09 Perfil do cliente` · linhas 291–328
- **Propósito**: identidade do cliente, dados de contato, preferências de lembrete e saída da conta.
  É a tab `PERFIL`.

### Árvore de elementos

1. **Frame** — padrão §0.2
2. **StatusBar** — padrão §0.3 → **`9:41`**
3. **Corpo** — `padding:44px 28px 0`
   1. **Cabeçalho de identidade** — `display:flex;align-items:center;gap:20px`
      1. **Avatar de iniciais** — `width:58px;height:58px;border:1px solid rgba(241,235,224,.25);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:19px;flex:none`
         → **`RD`**
         (**é o único círculo do design** — todo o resto usa `radius:2px`. Não é `<image-slot>`: são
         as iniciais do nome em Playfair sobre fundo transparente com aro `.25`.)
      2. **bloco de nome** — `display:flex;flex-direction:column;gap:8px`
         - nome — `font-family:'Playfair Display',serif;font-size:24px` → **`Rafael Duarte`**
         - antiguidade — `font-size:8.5px;font-weight:600;letter-spacing:.22em;color:rgba(241,235,224,.45)`
           → **`CLIENTE DESDE MARÇO DE 2024`**
   2. **Label** — `font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.48);margin-top:48px`
      → **`DADOS PESSOAIS`**
   3. **Lista de dados** — wrapper `margin-top:6px`; cada linha
      `display:flex;justify-content:space-between;align-items:center;padding:19px 0;border-bottom:1px solid rgba(241,235,224,.1)`
      - chave — `font-size:12.5px;color:rgba(241,235,224,.5)`
      - valor — `font-size:13.5px;color:rgba(241,235,224,.88)`

      | chave (literal) | valor (literal) |
      |---|---|
      | `E-mail` | `rafael.duarte@email.com` |
      | `Telefone` | `+55 (11) 98244-1157` |

      (chaves em **caixa mista** — `E-mail`, `Telefone` — ao contrário dos labels de seção em caps)
   4. **Label** — `font-size:9px;font-weight:600;letter-spacing:.24em;color:rgba(241,235,224,.48);margin-top:40px`
      → **`PREFERÊNCIAS`**
   5. **Lista de preferências** — wrapper `margin-top:6px`; cada linha
      `display:flex;justify-content:space-between;align-items:center;padding:19px 0;border-bottom:1px solid rgba(241,235,224,.1)`
      1. **`Lembretes por WhatsApp`** — texto `font-size:13.5px;color:rgba(241,235,224,.85)`
         - **toggle LIGADO** — trilho `width:34px;height:18px;border:1px solid var(--gold,#C9A96A);border-radius:var(--r,2px);position:relative`
           com thumb `position:absolute;right:2px;top:2px;bottom:2px;width:12px;background:var(--gold,#C9A96A)`
           (thumb **à direita**, dourado; trilho retangular de radius 2px, **não** pill)
      2. **`Lembrete por e-mail`** — mesmo texto CSS
         (note o **singular** aqui e o plural na linha acima — transcrever como está)
         - **toggle DESLIGADO** — trilho `width:34px;height:18px;border:1px solid rgba(241,235,224,.25);border-radius:var(--r,2px);position:relative`
           com thumb `position:absolute;left:2px;top:2px;bottom:2px;width:12px;background:rgba(241,235,224,.3)`
           (thumb **à esquerda**, apagado)
      3. **`Profissional preferido`** — texto `font-size:13.5px;color:rgba(241,235,224,.85)`
         - valor — `font-size:13.5px;color:rgba(241,235,224,.55)` → **`Stewer Gabriel`**
           (linha de valor, não de toggle; **sem** chevron nem `cursor:pointer`)
   6. **Botão secundário** — §0.6 com `margin-top:44px` → **`SAIR DA CONTA`**
      (`border:1px solid rgba(241,235,224,.22);…;color:rgba(241,235,224,.65);cursor:pointer` +
      `style-hover="border-color:rgba(241,235,224,.45)"`) — **não é destrutivo em vermelho**; a
      paleta não tem cor de erro.
4. **BottomTabBar** — §0.4, tab ativa **`PERFIL`**.

### Interativos (1 `cursor:pointer`)

| elemento | sinal | ação |
|---|---|---|
| **`SAIR DA CONTA`** | `cursor:pointer` + `style-hover` | descarta o token, volta para 02 Acesso |
| toggle `Lembretes por WhatsApp` | sem pointer, mas é controle | liga/desliga a preferência |
| toggle `Lembrete por e-mail` | sem pointer, mas é controle | liga/desliga a preferência |
| linhas `E-mail` / `Telefone` | sem pointer, sem affordance de edição | **o design não oferece edição de dados pessoais** — ver Gaps |
| linha `Profissional preferido` | sem pointer | idem: parece leitura |

### Dados de API

- **Identidade**: `GET /auth/eu` → `UsuarioResponse { id, tenantId, nome, email, telefone, role }`.
  - `nome` → **`Rafael Duarte`**; iniciais **`RD`** = primeira letra do primeiro e do último token do nome
  - `email` → **`rafael.duarte@email.com`**
  - `telefone` → **`+55 (11) 98244-1157`** (formatar; a API guarda `+5511999990003`, sem máscara)
- **`CLIENTE DESDE MARÇO DE 2024`**: precisa de `createdAt`. `UsuarioResponse` **não tem** o campo;
  `ClienteDetalheResponse` tem, mas `GET /clientes/{id}` é `PROFISSIONAL`/`ADMIN`. → **adicionar
  `createdAt` a `UsuarioResponse`** (ou um `GET /clientes/eu`). Formato: `'CLIENTE DESDE' MMMM 'DE' yyyy` em caps.
- **`Profissional preferido`** → `Stewer Gabriel`: sem campo na API. Derivável do profissional mais
  frequente em `GET /agendamentos/meus?periodo=todos`, ou persistir uma preferência nova.
- **Toggles de lembrete**: sem campo e sem endpoint. Exigem algo como
  `PATCH /clientes/eu/preferencias { lembreteWhatsapp, lembreteEmail }`.

### Slots de imagem / avatar

**Nenhum `<image-slot>`.** O avatar é um **placeholder de iniciais** (círculo de 58px com aro
`rgba(241,235,224,.25)` e `RD` em Playfair 19px). O cliente **não tem foto** no design nem em
`UsuarioResponse` — manter as iniciais como avatar canônico do cliente (contraste deliberado com o
retrato fotográfico do profissional na tela 05).

### Estados mostrados

- **Toggle ligado** (dourado, thumb à direita) vs **desligado** (`.25`/`.3`, thumb à esquerda) — o
  par completo, pronto para virar componente.
- Linha de preferência **com valor** (`Profissional preferido`) como terceiro tipo, ao lado das duas
  de toggle.
- Não desenhados: edição de campo, estado de salvamento, confirmação do logout, cliente sem telefone
  (`telefone` é opcional em `RegistrarRequest`).

---

## 10. Fluxo e navegação (derivado das 9 telas)

```
01 Splash ──token válido──> 03 Home ─┬─ NOVO AGENDAMENTO ─> 04 ─> 05 ─> 06 ─> 07 ─POST─> 03
          └──sem token────> 02 Acesso ─CONTINUAR─> 03      │
                                                            ├─ REPETIR ──────────> 06 (serviço+pro travados)
                                                            ├─ REAGENDAR ────────> 06 (agendamento existente)
                                                            └─ DETALHES ─────────> (sem tela dedicada)
tab bar (03/08/09): INÍCIO=03 · AGENDAR=04 · MEUS HORÁRIOS=08 · PERFIL=09
← em 04/05/06/07 volta um passo; ALTERAR DATA OU HORÁRIO (07) volta para 06
SAIR DA CONTA (09) ─> 02
```

Rascunho de agendamento acumulado pelo fluxo: `servicoId` (04) → `profissionalId` (05) →
`inicio` (06) → `POST /agendamentos` (07).

## 11. Coerência de dados entre as telas (o design é consistente — respeitar ao mockar)

- Cliente: `Rafael Duarte` (03 `Rafael`, 09 nome completo + `RD`)
- Agendamento futuro: `Corte Assinatura`, `Stewer Gabriel`, sexta **11/09/2026**, `15:30 — 16:30`,
  `R$ 190`, status `AGENDADO`/`CONFIRMADO` — aparece em 03, 06 (selecionado), 07 e 08
- Hoje: **terça, 01/09/2026** (03 eyebrow, 06 ponto dourado no dia 1, mês `Setembro 2026`)
- Última visita: `Corte & Barba`, **14/08** (03 `· 14 de agosto`, 08 `14 AGO`, `CONCLUÍDO`)
- Ateliê fechado **domingo e segunda** (06); almoço entre `11:00` e `13:30`
- Ano de 2026 confirmado pelo calendário: 01/09 cai na terça e o mês tem 30 dias.

## 12. Gaps design ↔ API (lista para decisão, sem inventar UI)

1. **02** — falta campo de senha; `LoginRequest.senha`/`RegistrarRequest.senha` são `@NotBlank`. E o
   texto promete OTP (`Enviaremos um código de confirmação.`), que a API não implementa.
2. **02** — aba `CRIAR CONTA` não tem tela; falta `NOME` (obrigatório, máx. 120).
3. **03** — `Visagista` (após `Stewer Gabriel ·`) exige `ProfissionalResponse.especialidade`, ausente
   de `AgendamentoResponse` → 2ª chamada ou cache.
4. **03** — `REAGENDAR` não tem endpoint (só `PATCH /{id}/status` + `POST` novo). Definir se é
   cancelar+criar em transação de cliente.
5. **03** — `DETALHES` não tem tela de destino no board do cliente (existe `11 Detalhe do agendamento`,
   mas é do perfil PROFISSIONAL, linhas 367–400).
6. **04** — ordem do design não é alfabética, mas `GET /servicos` ordena por nome. Falta campo de
   curadoria, ou aceitar a ordem alfabética.
7. **05** — `Fundador do ateliê` não tem campo próprio (candidato: 1ª linha de `bio`).
8. **06** — API devolve só slots livres; o design mostra slots **ocupados** desabilitados. Resolver
   pelo cliente (grade teórica de `/disponibilidade` menos `/horarios-livres`) ou por campo novo.
9. **06** — não há endpoint de "dias com vaga no mês"; um dia aberto e lotado aparecerá disponível.
10. **07** — `AgendamentoRequest.observacao` (máx. 2000, "Recado do cliente") não tem campo na tela.
11. **07** — sem tela de sucesso pós-`POST`, sem tratamento de conflito de horário.
12. **08** — cliente não tem caminho para cancelar (`PATCH /agendamentos/{id}/status` = `CANCELADO`):
    nenhum elemento da tela é clicável.
13. **08** — `NAO_COMPARECEU` não tem rótulo desenhado; `AGENDADO` é rotulado `CONFIRMADO`
    (tradução obrigatória, não renomear o enum).
14. **09** — `CLIENTE DESDE MARÇO DE 2024` exige `createdAt` em `UsuarioResponse` (hoje só em
    `ClienteDetalheResponse`, que o cliente não pode ler).
15. **09** — toggles de lembrete (WhatsApp/e-mail) e `Profissional preferido` não têm campo nem
    endpoint.
16. **09** — sem fluxo de edição de e-mail/telefone.
17. **Global** — nenhuma das 9 telas desenha `loading`, `erro de rede`, `lista vazia` ou `toast`.
    Nenhuma cor de erro/sucesso existe na paleta (só `#F1EBE0`, `#C9A96A` e as opacidades) — inventar
    vermelho quebraria o sistema; preferir a escada de opacidade + dourado.
18. **Global** — 04, 06 e 08 podem estourar 844px com dados reais; o design é `overflow:hidden`.
    Definir a estratégia de scroll por tela.
19. **Global** — alvos de toque abaixo de 44px: `←` (19px), `‹`/`›` (16px + `padding:0 6px`), links
    de ação em caps de 9px (`REAGENDAR`, `DETALHES`, `REPETIR`, `ALTERAR DATA OU HORÁRIO`). Ampliar a
    área sem alterar a métrica visual.
20. **Global** — contraste: `rgba(241,235,224,.22)` e `.25` sobre `#0A0A0A` ficam abaixo de WCAG AA
    para texto. São justamente os estados desabilitados (horário indisponível, dia fechado), o que é
    aceitável, mas nenhum outro texto deve descer abaixo de `.4`.
