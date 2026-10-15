/**
 * O wrapper da API de ponta a ponta, com `fetch` mockado.
 *
 * Cobre o que mais quebra: injecao do Bearer, 401 deslogando, 403/401 sem corpo,
 * 400/422 com violacoes indo para o campo certo, falha de rede, token expirado
 * barrado antes de sair da maquina, e os 201 que a spec declara sem schema.
 */
import {
  api,
  definirAoDeslogar,
  definirSessaoAtiva,
  desembrulha,
  desembrulhaCriado,
  aoAcordarServidor,
  TIMEOUT_MS,
} from '../client';
import { ApiError } from '../errors';

// ---------------------------------------------------------------------------
// helpers

function resposta(status: number, corpo?: unknown, headers: Record<string, string> = {}) {
  const temCorpo = corpo !== undefined;
  return new Response(temCorpo ? JSON.stringify(corpo) : null, {
    status,
    headers: {
      ...(temCorpo ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
  });
}

/** 401/403 do Quarkus: status de erro com corpo VAZIO de verdade. */
function respostaVazia(status: number) {
  return new Response(null, { status });
}

let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn();
  global.fetch = fetchMock as unknown as typeof fetch;
  // o client guarda sessao e handler em modulo; zera entre testes
  definirSessaoAtiva(null);
  definirAoDeslogar(null);
});

// ---------------------------------------------------------------------------

describe('injecao do token', () => {
  it('manda Authorization: Bearer nas rotas autenticadas', async () => {
    definirSessaoAtiva({ token: 'jwt-abc', expiraEm: Date.now() + 3_600_000 });
    fetchMock.mockResolvedValue(resposta(200, []));

    await desembrulha(api.GET('/servicos', { params: { query: { incluirInativos: false } } }));

    const req = fetchMock.mock.calls[0][0] as Request;
    expect(req.headers.get('Authorization')).toBe('Bearer jwt-abc');
  });

  it('NAO manda Bearer no login nem no registro', async () => {
    definirSessaoAtiva({ token: 'jwt-antigo', expiraEm: Date.now() + 3_600_000 });
    fetchMock.mockResolvedValue(resposta(200, { token: 'novo', usuario: {} }));

    await desembrulha(api.POST('/auth/login', { body: { email: 'a@b.dev', senha: 'x' } }));

    const req = fetchMock.mock.calls[0][0] as Request;
    expect(req.headers.get('Authorization')).toBeNull();
  });

  it('sem sessao, nao manda Bearer', async () => {
    definirSessaoAtiva(null);
    fetchMock.mockResolvedValue(resposta(200, []));

    await desembrulha(api.GET('/servicos', { params: { query: { incluirInativos: false } } }));

    expect((fetchMock.mock.calls[0][0] as Request).headers.get('Authorization')).toBeNull();
  });

  it('monta a URL a partir da EXPO_PUBLIC_API_URL, sem barra dobrada', async () => {
    definirSessaoAtiva(null);
    fetchMock.mockResolvedValue(resposta(200, []));

    await desembrulha(api.GET('/servicos', { params: { query: { incluirInativos: false } } }));

    const req = fetchMock.mock.calls[0][0] as Request;
    expect(req.url).toBe('http://api.teste:8080/servicos?incluirInativos=false');
  });
});

// ---------------------------------------------------------------------------

describe('401 desloga', () => {
  it('401 numa rota autenticada dispara o logout e rejeita com ApiError', async () => {
    const deslogar = jest.fn();
    definirSessaoAtiva({ token: 'jwt-velho', expiraEm: Date.now() + 3_600_000 });
    definirAoDeslogar(deslogar);
    // como o Quarkus responde de verdade: 401 sem corpo
    fetchMock.mockResolvedValue(respostaVazia(401));

    await expect(desembrulha(api.GET('/auth/eu'))).rejects.toMatchObject({
      status: 401,
      kind: 'autenticacao',
    });
    expect(deslogar).toHaveBeenCalledTimes(1);
  });

  it('401 no /auth/login NAO desloga — e so senha errada', async () => {
    const deslogar = jest.fn();
    definirSessaoAtiva(null);
    definirAoDeslogar(deslogar);
    fetchMock.mockResolvedValue(
      resposta(401, {
        codigo: 'NAO_AUTENTICADO',
        mensagem: 'E-mail ou senha invalidos',
        status: 401,
      })
    );

    await expect(
      desembrulha(api.POST('/auth/login', { body: { email: 'a@b.dev', senha: 'errada' } }))
    ).rejects.toMatchObject({ message: 'E-mail ou senha invalidos' });

    expect(deslogar).not.toHaveBeenCalled();
  });

  it('403 nao desloga (o usuario esta logado, so nao pode)', async () => {
    const deslogar = jest.fn();
    definirSessaoAtiva({ token: 'jwt', expiraEm: Date.now() + 3_600_000 });
    definirAoDeslogar(deslogar);
    fetchMock.mockResolvedValue(respostaVazia(403));

    await expect(
      desembrulha(api.GET('/clientes', { params: { query: { pagina: 0, tamanho: 20 } } }))
    ).rejects.toMatchObject({ status: 403, kind: 'permissao' });

    expect(deslogar).not.toHaveBeenCalled();
  });

  it('403 sem corpo ainda chega com mensagem legivel na tela', async () => {
    definirSessaoAtiva({ token: 'jwt', expiraEm: Date.now() + 3_600_000 });
    fetchMock.mockResolvedValue(respostaVazia(403));

    await expect(
      desembrulha(api.GET('/clientes', { params: { query: { pagina: 0, tamanho: 20 } } }))
    ).rejects.toThrow('Voce nao tem permissao para isso.');
  });
});

// ---------------------------------------------------------------------------

describe('token expirado', () => {
  it('nem chega a chamar a rede e ja desloga', async () => {
    const deslogar = jest.fn();
    // expirou 1 minuto atras
    definirSessaoAtiva({ token: 'jwt-vencido', expiraEm: Date.now() - 60_000 });
    definirAoDeslogar(deslogar);

    await expect(desembrulha(api.GET('/auth/eu'))).rejects.toMatchObject({
      kind: 'autenticacao',
      codigo: 'TOKEN_EXPIRADO',
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(deslogar).toHaveBeenCalledTimes(1);
  });

  it('token que vence dentro da margem tambem e tratado como vencido', async () => {
    definirAoDeslogar(jest.fn());
    // vence em 5s; a margem e de 30s
    definirSessaoAtiva({ token: 'jwt', expiraEm: Date.now() + 5_000 });

    await expect(desembrulha(api.GET('/auth/eu'))).rejects.toMatchObject({
      codigo: 'TOKEN_EXPIRADO',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------

describe('422 e 400 com violacoes', () => {
  const CORPO_VALIDACAO = {
    codigo: 'VALIDACAO',
    mensagem: 'Requisicao invalida',
    status: 400,
    violacoes: [
      { campo: 'nome', mensagem: 'nome e obrigatorio' },
      { campo: 'duracaoMinutos', mensagem: 'duracaoMinutos deve ser no minimo 5' },
    ],
  };

  it('400 de validacao chega com as violacoes prontas para o formulario', async () => {
    definirSessaoAtiva({ token: 'jwt', expiraEm: Date.now() + 3_600_000 });
    fetchMock.mockResolvedValue(resposta(400, CORPO_VALIDACAO));

    expect.assertions(4);
    try {
      await desembrulhaCriado(
        api.POST('/servicos', { body: { nome: '', duracaoMinutos: 1, precoCentavos: 0 } })
      );
    } catch (e) {
      const erro = e as ApiError;
      expect(erro).toBeInstanceOf(ApiError);
      expect(erro.kind).toBe('validacao');
      expect(erro.violacaoDe('nome')).toBe('nome e obrigatorio');
      expect(erro.violacaoDe('duracaoMinutos')).toBe('duracaoMinutos deve ser no minimo 5');
    }
  });

  it('422 de regra de negocio chega com o codigo estavel e sem violacoes', async () => {
    definirSessaoAtiva({ token: 'jwt', expiraEm: Date.now() + 3_600_000 });
    fetchMock.mockResolvedValue(
      resposta(422, {
        codigo: 'PROFISSIONAL_OBRIGATORIO',
        mensagem: 'Como ADMIN, informe profissionalId para ver a agenda de alguem',
        status: 422,
      })
    );

    await expect(
      desembrulha(api.GET('/agendamentos/agenda', { params: { query: { data: '2026-09-14' } } }))
    ).rejects.toMatchObject({
      kind: 'regra',
      codigo: 'PROFISSIONAL_OBRIGATORIO',
    });
  });

  it('409 de horario ocupado preserva a mensagem da API', async () => {
    definirSessaoAtiva({ token: 'jwt', expiraEm: Date.now() + 3_600_000 });
    fetchMock.mockResolvedValue(
      resposta(409, { codigo: 'HORARIO_OCUPADO', mensagem: 'Horario ja reservado', status: 409 })
    );

    await expect(
      desembrulhaCriado(
        api.POST('/agendamentos', {
          body: { profissionalId: 'p', servicoId: 's', inicio: '2026-09-14T12:00:00Z' },
        })
      )
    ).rejects.toThrow('Horario ja reservado');
  });
});

// ---------------------------------------------------------------------------

describe('erro de rede', () => {
  // Falha de conexao e repetida enquanto o servidor pode estar acordando (ver
  // "servidor acordando"), entao estes casos so chegam ao erro final depois
  // das esperas entre tentativas.
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('fetch rejeitando vira ApiError de rede, com dica de localhost', async () => {
    definirSessaoAtiva({ token: 'jwt', expiraEm: Date.now() + 3_600_000 });
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    const chamada = desembrulha(
      api.GET('/servicos', { params: { query: { incluirInativos: false } } })
    );
    const esperado = expect(chamada).rejects.toMatchObject({
      kind: 'rede',
      message: expect.stringMatching(/localhost/i),
    });
    await jest.advanceTimersByTimeAsync(60_000);
    await esperado;
  });

  it('falha de rede NAO desloga (o token pode continuar bom)', async () => {
    const deslogar = jest.fn();
    definirSessaoAtiva({ token: 'jwt', expiraEm: Date.now() + 3_600_000 });
    definirAoDeslogar(deslogar);
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    const chamada = desembrulha(
      api.GET('/servicos', { params: { query: { incluirInativos: false } } })
    );
    const esperado = expect(chamada).rejects.toBeInstanceOf(ApiError);
    await jest.advanceTimersByTimeAsync(60_000);
    await esperado;

    expect(deslogar).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------

describe('201 sem schema na spec', () => {
  it('devolve o recurso criado (a API manda o corpo, so o tipo estava vazio)', async () => {
    definirSessaoAtiva({ token: 'jwt', expiraEm: Date.now() + 3_600_000 });

    const criado = {
      id: '00800949-a9af-4d45-b879-2429c95b0b8c',
      servicoNome: 'Corte + Visagismo',
      precoCentavos: 18000,
      inicio: '2026-09-14T12:00:00Z',
      status: 'AGENDADO',
    };
    fetchMock.mockResolvedValue(
      resposta(201, criado, { Location: '/agendamentos/00800949-a9af-4d45-b879-2429c95b0b8c' })
    );

    const resultado = await desembrulhaCriado<typeof criado>(
      api.POST('/agendamentos', {
        body: { profissionalId: 'p', servicoId: 's', inicio: '2026-09-14T12:00:00Z' },
      })
    );

    expect(resultado).toEqual(criado);
  });

  it('201 realmente vazio vira erro explicito em vez de undefined silencioso', async () => {
    definirSessaoAtiva({ token: 'jwt', expiraEm: Date.now() + 3_600_000 });
    fetchMock.mockResolvedValue(new Response(null, { status: 201 }));

    await expect(
      desembrulhaCriado(
        api.POST('/agendamentos', {
          body: { profissionalId: 'p', servicoId: 's', inicio: '2026-09-14T12:00:00Z' },
        })
      )
    ).rejects.toMatchObject({ codigo: 'RESPOSTA_VAZIA' });
  });
});

// ---------------------------------------------------------------------------

describe('204 sem corpo', () => {
  it('DELETE resolve sem erro', async () => {
    definirSessaoAtiva({ token: 'jwt', expiraEm: Date.now() + 3_600_000 });
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      desembrulha(api.DELETE('/servicos/{id}', { params: { path: { id: 'abc' } } }))
    ).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------

describe('timeout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('a chamada que nunca responde vira erro de rede, nao fica pendurada', async () => {
    definirSessaoAtiva({ token: 'jwt-abc', expiraEm: Date.now() + 3_600_000 });
    // A rede aceitou a conexao e emudeceu: so o nosso relogio resolve isso.
    fetchMock.mockImplementation(
      (_input: unknown, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new Error('Aborted: the operation was aborted'))
          );
        })
    );

    const chamada = desembrulha(
      api.GET('/servicos', { params: { query: { incluirInativos: false } } })
    );
    const esperado = expect(chamada).rejects.toMatchObject({ kind: 'rede' });

    // 3 tentativas de TIMEOUT_MS, mais as esperas entre elas.
    await jest.advanceTimersByTimeAsync(3 * TIMEOUT_MS + 20_000);
    await esperado;
  });

  it('resposta dentro do prazo nao e cancelada', async () => {
    definirSessaoAtiva({ token: 'jwt-abc', expiraEm: Date.now() + 3_600_000 });
    fetchMock.mockResolvedValue(resposta(200, []));

    await expect(
      desembrulha(api.GET('/servicos', { params: { query: { incluirInativos: false } } }))
    ).resolves.toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('servidor acordando', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  /** Deixa as esperas entre tentativas passarem sem segurar o teste. */
  async function correrOsRelogios(ms = 60_000) {
    await jest.advanceTimersByTimeAsync(ms);
  }

  it('502 enquanto a instancia sobe vira sucesso na tentativa seguinte', async () => {
    definirSessaoAtiva({ token: 'jwt-abc', expiraEm: Date.now() + 3_600_000 });
    fetchMock
      .mockResolvedValueOnce(respostaVazia(502))
      .mockResolvedValueOnce(resposta(200, [{ id: 's1' }]));

    const chamada = desembrulha(
      api.GET('/servicos', { params: { query: { incluirInativos: false } } })
    );
    await correrOsRelogios();

    await expect(chamada).resolves.toEqual([{ id: 's1' }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('falha de conexao tambem e repetida', async () => {
    definirSessaoAtiva({ token: 'jwt-abc', expiraEm: Date.now() + 3_600_000 });
    fetchMock
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(resposta(200, []));

    const chamada = desembrulha(
      api.GET('/servicos', { params: { query: { incluirInativos: false } } })
    );
    await correrOsRelogios();

    await expect(chamada).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('desiste depois das tentativas e devolve erro de rede', async () => {
    definirSessaoAtiva({ token: 'jwt-abc', expiraEm: Date.now() + 3_600_000 });
    fetchMock.mockResolvedValue(respostaVazia(503));

    const chamada = desembrulha(
      api.GET('/servicos', { params: { query: { incluirInativos: false } } })
    );
    const esperado = expect(chamada).rejects.toMatchObject({ status: 503 });
    await correrOsRelogios();
    await esperado;

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('erro comum (404) NAO e repetido', async () => {
    definirSessaoAtiva({ token: 'jwt-abc', expiraEm: Date.now() + 3_600_000 });
    fetchMock.mockResolvedValue(resposta(404, { codigo: 'RECURSO_NAO_ENCONTRADO' }));

    const chamada = desembrulha(
      api.GET('/servicos', { params: { query: { incluirInativos: false } } })
    );
    const esperado = expect(chamada).rejects.toMatchObject({ kind: 'nao_encontrado' });
    await correrOsRelogios();
    await esperado;

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('login e repetido: mandar duas vezes nao cria nada em duplicidade', async () => {
    fetchMock
      .mockResolvedValueOnce(respostaVazia(503))
      .mockResolvedValueOnce(resposta(200, { token: 'jwt-novo' }));

    const chamada = desembrulha(
      api.POST('/auth/login', { body: { email: 'a@b.dev', senha: 'segredo123' } })
    );
    await correrOsRelogios();

    await expect(chamada).resolves.toMatchObject({ token: 'jwt-novo' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('POST que cria recurso NAO e repetido em 502: evita duplicar agendamento', async () => {
    definirSessaoAtiva({ token: 'jwt-abc', expiraEm: Date.now() + 3_600_000 });
    fetchMock.mockResolvedValue(respostaVazia(502));

    const chamada = desembrulha(
      api.POST('/agendamentos', {
        body: {
          profissionalId: '11111111-1111-1111-1111-111111111111',
          servicoId: '22222222-2222-2222-2222-222222222222',
          inicio: '2026-12-07T12:00:00Z',
        },
      })
    );
    const esperado = expect(chamada).rejects.toMatchObject({ status: 502 });
    await correrOsRelogios();
    await esperado;

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('avisa a interface enquanto espera e para de avisar no fim', async () => {
    definirSessaoAtiva({ token: 'jwt-abc', expiraEm: Date.now() + 3_600_000 });
    fetchMock.mockResolvedValueOnce(respostaVazia(502)).mockResolvedValueOnce(resposta(200, []));

    const avisos: boolean[] = [];
    const cancelar = aoAcordarServidor((acordando) => avisos.push(acordando));

    const chamada = desembrulha(
      api.GET('/servicos', { params: { query: { incluirInativos: false } } })
    );
    await correrOsRelogios();
    await chamada;
    cancelar();

    // primeiro aviso e o estado inicial (false), depois true ao esperar e
    // false de novo quando a chamada termina
    expect(avisos).toEqual([false, true, false]);
  });
});
