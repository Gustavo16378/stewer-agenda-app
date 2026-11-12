/**
 * Quem e o Stewer, onde ele atende e as fotos do trabalho: o mesmo conteudo do site
 * stewergabriel.com (src/content/site.ts de la), para o app e o site contarem a mesma
 * historia. As fotos estao em assets/images/atelie, ja otimizadas.
 */
import type { ImageSourcePropType } from 'react-native';

export interface FotoAtelie {
  fonte: ImageSourcePropType;
  descricao: string;
  /** largura / altura, para reservar o espaco antes de a imagem carregar */
  proporcao: number;
}

export const FOTOS = {
  estudio: {
    fonte: require('../../assets/images/atelie/stewer-estudio.jpg'),
    descricao: 'Stewer Gabriel no estúdio',
    proporcao: 861 / 1200,
  },
  retrato: {
    fonte: require('../../assets/images/atelie/stewer-retrato.jpg'),
    descricao: 'Retrato de Stewer Gabriel',
    proporcao: 1,
  },
  perfil: {
    fonte: require('../../assets/images/atelie/stewer-perfil.jpg'),
    descricao: 'Stewer Gabriel de perfil',
    proporcao: 430 / 572,
  },
} satisfies Record<string, FotoAtelie>;

export const PORTFOLIO: FotoAtelie[] = [
  {
    fonte: require('../../assets/images/atelie/corte-4.jpg'),
    descricao: 'Stewer finalizando um corte na Boss House',
    proporcao: 909 / 1200,
  },
  {
    fonte: require('../../assets/images/atelie/corte-1.jpg'),
    descricao: 'Corte com tesoura e pente',
    proporcao: 675 / 1200,
  },
  {
    fonte: require('../../assets/images/atelie/corte-2.jpg'),
    descricao: 'Acabamento de barba',
    proporcao: 675 / 1200,
  },
  {
    fonte: require('../../assets/images/atelie/corte-3.jpg'),
    descricao: 'Desenho da barba com navalha',
    proporcao: 675 / 1200,
  },
  {
    fonte: require('../../assets/images/atelie/corte-5.jpg'),
    descricao: 'Corte em andamento',
    proporcao: 605 / 785,
  },
  {
    fonte: require('../../assets/images/atelie/aula-1.jpg'),
    descricao: 'Stewer ensinando técnica de corte',
    proporcao: 900 / 1200,
  },
  {
    fonte: require('../../assets/images/atelie/aula-2.jpg'),
    descricao: 'Aula prática com aluno',
    proporcao: 900 / 1200,
  },
];

export const SOBRE = {
  titulo: 'Por trás do visual, uma visão',
  paragrafos: [
    'Stewer Gabriel é visagista e consultor de imagem masculina. Há mais de dez anos em Palmas, une técnica, estética e psicologia para criar uma imagem que comunique autoridade, autenticidade e confiança.',
    'Para ele, um bom corte vai além da tesoura: é a leitura do rosto, do jeito e do objetivo de cada cliente.',
  ],
  citacao: 'Sua aparência é o primeiro discurso que você faz, antes mesmo de abrir a boca.',
  numeros: [
    { valor: '800+', legenda: 'clientes por ano' },
    { valor: '10+', legenda: 'anos de cadeira' },
  ],
};

export const LEMA = 'Masculinidade com propósito';

export const LOCAL = {
  nome: 'Boss House Barbearia',
  endereco: 'Q. ACNE 1, Rua NE 3, nº 15, Plano Diretor Norte, Palmas',
  horario: 'Segunda a sábado, das 9h às 19h',
  mapa: 'https://www.google.com/maps/search/?api=1&query=-10.18256053,-48.32910908',
  whatsapp: 'https://wa.me/5563985116783?text=Ol%C3%A1%20Stewer%2C%20vim%20pelo%20app.',
  instagram: 'https://instagram.com/stewer.gabriel',
};

/**
 * A foto de um profissional: a que ele cadastrou ou, para o proprio Stewer enquanto ele
 * nao sobe uma, o retrato de perfil do site. Os demais ficam com as iniciais.
 */
export function fotoDoProfissional(p: {
  nome?: string | null;
  fotoUrl?: string | null;
}): ImageSourcePropType | null {
  if (p.fotoUrl) return { uri: p.fotoUrl };
  if (p.nome?.trim().toLowerCase().startsWith('stewer')) return FOTOS.perfil.fonte;
  return null;
}
