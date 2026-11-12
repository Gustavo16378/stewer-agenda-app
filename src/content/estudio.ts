/**
 * O estudio como o app mostra: o que o admin salvou na aba Estudio, campo a campo, por
 * cima do conteudo que ja vem no app (src/content/atelie.ts). Assim um estudio que nunca
 * foi editado, ou um aparelho sem internet, continua com endereco, mapa e fotos.
 */
import type { ImageSourcePropType } from 'react-native';

import { API_URL } from '@/api/config';
import { useEstudioSalvo } from '@/api/hooks';
import type { Estudio } from '@/api/types';

import { FOTOS, type FotoAtelie, LOCAL, PORTFOLIO, SITE_DO_STEWER, SOBRE } from './atelie';

/** Fotos enviadas pelo app nao trazem a proporcao; retrato em pe e o caso comum. */
const PROPORCAO_PADRAO = 3 / 4;

export interface EstudioDoApp {
  nome: string;
  descricao: string;
  endereco: string;
  regiao: string;
  horario: string;
  latitude: number;
  longitude: number;
  /** As coordenadas sao as do mapa desenhado que vem no app (e o mapa pode ser a imagem). */
  noMapaPadrao: boolean;
  /** Abre o app de mapas com a rota. */
  mapaUrl: string;
  whatsappUrl: string;
  instagramUrl: string;
  site: string;
  frase: string;
  /** Retrato enviado pelo admin; nulo usa as fotos do app (com a leitura do rosto). */
  retratoEnviado: FotoAtelie | null;
  /** Fotos do trabalho: as enviadas ou, sem nenhuma, as do app. */
  fotos: FotoAtelie[];
  fotosEnviadas: boolean;
}

export function urlDaImagem(id: string): string {
  return `${API_URL}/imagens/${id}`;
}

/** "63985116783" vira o link do WhatsApp com DDI e uma mensagem pronta. */
export function linkWhatsapp(numero: string): string {
  const digitos = numero.replace(/\D/g, '');
  const comPais = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${comPais}?text=${encodeURIComponent('Olá Stewer, vim pelo app.')}`;
}

const pertoDe = (a: number, b: number) => Math.abs(a - b) < 1e-5;

export function montarEstudio(salvo: Estudio | undefined): EstudioDoApp {
  const s = salvo ?? ({} as Partial<Estudio>);
  const temCoordenadas = typeof s.latitude === 'number' && typeof s.longitude === 'number';
  const latitude = temCoordenadas ? (s.latitude as number) : LOCAL.latitude;
  const longitude = temCoordenadas ? (s.longitude as number) : LOCAL.longitude;
  const noMapaPadrao = pertoDe(latitude, LOCAL.latitude) && pertoDe(longitude, LOCAL.longitude);
  const nome = s.nomeLocal || LOCAL.nome;

  const fotosEnviadas = (s.fotos ?? []).filter((f) => f.id);
  return {
    nome,
    descricao: s.descricao || LOCAL.descricao,
    endereco: s.endereco || LOCAL.endereco,
    regiao: s.regiao || LOCAL.regiao,
    horario: s.horario || LOCAL.horario,
    latitude,
    longitude,
    noMapaPadrao,
    mapaUrl:
      s.linkMapa ||
      (temCoordenadas
        ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
        : LOCAL.mapa),
    whatsappUrl: s.whatsapp ? linkWhatsapp(s.whatsapp) : LOCAL.whatsapp,
    instagramUrl: s.instagram ? `https://instagram.com/${s.instagram}` : LOCAL.instagram,
    site: s.site || SITE_DO_STEWER,
    frase: s.frase || SOBRE.citacao,
    retratoEnviado: s.retrato?.id
      ? {
          fonte: { uri: urlDaImagem(s.retrato.id) } as ImageSourcePropType,
          descricao: 'Retrato de Stewer Gabriel',
          proporcao: PROPORCAO_PADRAO,
        }
      : null,
    fotos:
      fotosEnviadas.length > 0
        ? fotosEnviadas.map((f) => ({
            fonte: { uri: urlDaImagem(f.id!) } as ImageSourcePropType,
            descricao: f.legenda || `Trabalho no ${nome}`,
            proporcao: PROPORCAO_PADRAO,
          }))
        : PORTFOLIO,
    fotosEnviadas: fotosEnviadas.length > 0,
  };
}

/** O estudio pronto para a tela; enquanto a API responde, ja mostra o conteudo do app. */
export function useEstudio(): EstudioDoApp {
  const salvo = useEstudioSalvo();
  return montarEstudio(salvo.data);
}

/** O retrato do Stewer para quem escolhe o profissional: o enviado ou o de perfil do app. */
export function retratoDoStewer(estudio: EstudioDoApp): ImageSourcePropType {
  return estudio.retratoEnviado?.fonte ?? FOTOS.perfil.fonte;
}
