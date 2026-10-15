/**
 * Normalizacao de erro. Os corpos usados aqui sao respostas REAIS da
 * stewer-agenda-api, capturadas por curl contra o seed de dev.
 */
import {
  ApiError,
  apiErrorDeRede,
  apiErrorDeResposta,
  comoApiError,
  normalizaViolacoes,
} from '../errors';

describe('violacoes — 400 e 422 com erro de campo', () => {
  // corpo literal devolvido por POST /servicos com nome vazio, duracao 1 e preco -5
  const CORPO_400 = {
    codigo: 'VALIDACAO',
    mensagem: 'Requisicao invalida',
    status: 400,
    timestamp: '2026-09-10T18:25:57.7874722Z',
    violacoes: [
      { campo: 'precoCentavos', mensagem: 'precoCentavos nao pode ser negativo' },
      { campo: 'duracaoMinutos', mensagem: 'duracaoMinutos deve ser no minimo 5' },
      { campo: 'nome', mensagem: 'nome e obrigatorio' },
    ],
  };

  it('trata violacoes em 400, nao so em 422 (a API responde 400 na validacao)', () => {
    const erro = apiErrorDeResposta(400, CORPO_400);
    expect(erro.kind).toBe('validacao');
    expect(erro.temViolacoes).toBe(true);
    expect(erro.status).toBe(400);
  });

  it('joga cada violacao no campo certo do formulario', () => {
    const erro = apiErrorDeResposta(400, CORPO_400);
    expect(erro.violacaoDe('nome')).toBe('nome e obrigatorio');
    expect(erro.violacaoDe('duracaoMinutos')).toBe('duracaoMinutos deve ser no minimo 5');
    expect(erro.violacaoDe('precoCentavos')).toBe('precoCentavos nao pode ser negativo');
    expect(erro.violacaoDe('inexistente')).toBeUndefined();
  });

  it('trata violacoes em 422 tambem', () => {
    const erro = apiErrorDeResposta(422, { ...CORPO_400, status: 422 });
    expect(erro.kind).toBe('validacao');
    expect(erro.violacaoDe('nome')).toBe('nome e obrigatorio');
  });

  it('preserva codigo, mensagem e timestamp', () => {
    const erro = apiErrorDeResposta(400, CORPO_400);
    expect(erro.codigo).toBe('VALIDACAO');
    expect(erro.message).toBe('Requisicao invalida');
    expect(erro.timestamp).toBe('2026-09-10T18:25:57.7874722Z');
  });

  it('a primeira violacao de um campo repetido vence', () => {
    const erro = apiErrorDeResposta(400, {
      violacoes: [
        { campo: 'nome', mensagem: 'primeira' },
        { campo: 'nome', mensagem: 'segunda' },
      ],
    });
    expect(erro.violacaoDe('nome')).toBe('primeira');
  });

  it('aceita tambem o mapa generico que o schema permitiria', () => {
    // o openapi.yaml declara additionalProperties:string; a API manda {campo,mensagem}.
    // As duas formas tem de funcionar para o app nao quebrar se a API mudar.
    expect(normalizaViolacoes([{ email: 'e-mail invalido' }])).toEqual({
      email: 'e-mail invalido',
    });
  });

  it('nao quebra com violacoes ausentes, vazias ou malformadas', () => {
    expect(normalizaViolacoes(undefined)).toEqual({});
    expect(normalizaViolacoes([])).toEqual({});
    expect(normalizaViolacoes('nao e lista')).toEqual({});
    expect(normalizaViolacoes([null, 42, { campo: 'x' }])).toEqual({});
  });
});

describe('401 e 403 — a API responde com CORPO VAZIO', () => {
  it('401 sem corpo ainda produz mensagem legivel', () => {
    const erro = apiErrorDeResposta(401, undefined);
    expect(erro.kind).toBe('autenticacao');
    expect(erro.exigeLogin).toBe(true);
    expect(erro.message).toBe('Sua sessao expirou. Entre novamente.');
    expect(erro.message).not.toBe('');
  });

  it('403 sem corpo ainda produz mensagem legivel', () => {
    const erro = apiErrorDeResposta(403, undefined);
    expect(erro.kind).toBe('permissao');
    expect(erro.exigeLogin).toBe(false);
    expect(erro.message).toBe('Voce nao tem permissao para isso.');
  });

  it('o 401 do /auth/login TEM corpo e a mensagem dele vence a padrao', () => {
    const erro = apiErrorDeResposta(401, {
      codigo: 'NAO_AUTENTICADO',
      mensagem: 'E-mail ou senha invalidos',
      status: 401,
    });
    expect(erro.message).toBe('E-mail ou senha invalidos');
    expect(erro.codigo).toBe('NAO_AUTENTICADO');
  });
});

describe('regras de negocio', () => {
  it('422 sem violacoes e regra, nao validacao', () => {
    const erro = apiErrorDeResposta(422, {
      codigo: 'PROFISSIONAL_OBRIGATORIO',
      mensagem: 'Como ADMIN, informe profissionalId para ver a agenda de alguem',
      status: 422,
    });
    expect(erro.kind).toBe('regra');
    expect(erro.temViolacoes).toBe(false);
    expect(erro.codigo).toBe('PROFISSIONAL_OBRIGATORIO');
  });

  it('409 de horario ocupado e regra', () => {
    expect(apiErrorDeResposta(409, { codigo: 'HORARIO_OCUPADO' }).kind).toBe('regra');
  });

  it('404 vira nao_encontrado com a mensagem da API', () => {
    const erro = apiErrorDeResposta(404, {
      codigo: 'RECURSO_NAO_ENCONTRADO',
      mensagem: 'Servico nao encontrado: 4444',
      status: 404,
    });
    expect(erro.kind).toBe('nao_encontrado');
    expect(erro.message).toBe('Servico nao encontrado: 4444');
  });

  it('5xx vira servidor', () => {
    expect(apiErrorDeResposta(500, undefined).kind).toBe('servidor');
    expect(apiErrorDeResposta(503, undefined).kind).toBe('servidor');
    expect(apiErrorDeResposta(500, undefined).message).not.toBe('');
  });
});

describe('erro de rede', () => {
  it('explica o caso do celular apontando para localhost', () => {
    const erro = apiErrorDeRede();
    expect(erro.kind).toBe('rede');
    expect(erro.status).toBe(0);
    expect(erro.codigo).toBe('FALHA_DE_REDE');
    expect(erro.message).toMatch(/localhost/i);
  });

  it('comoApiError reconhece o TypeError do fetch', () => {
    const erro = comoApiError(new TypeError('Network request failed'));
    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.kind).toBe('rede');
  });

  it('comoApiError reconhece "Failed to fetch" (web)', () => {
    expect(comoApiError(new Error('Failed to fetch')).kind).toBe('rede');
  });

  it('comoApiError repassa um ApiError sem embrulhar de novo', () => {
    const original = apiErrorDeResposta(404, { mensagem: 'sumiu' });
    expect(comoApiError(original)).toBe(original);
  });

  it('comoApiError lida com coisa que nem e Error', () => {
    const erro = comoApiError('string solta');
    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.message).toBe('Algo deu errado.');
  });
});
