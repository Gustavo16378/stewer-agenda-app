/**
 * A foto de um profissional, na ordem de preferencia: a foto que o admin enviou so para
 * a equipe, a foto de perfil da conta, a URL antiga da ficha, e, para o proprio Stewer
 * enquanto ele nao sobe nenhuma, o retrato da aba Estudio (ou o do site). Nulo: as
 * iniciais.
 */
import type { ImageSourcePropType } from 'react-native';

import { useFotoDeUsuario, useMeuProfissional } from '@/api/hooks';
import type { Profissional } from '@/api/types';
import { fotoDoProfissional } from '@/content/atelie';
import { urlDaImagem, useEstudio } from '@/content/estudio';

export function useRetratoDoProfissional(
  p: Profissional | null | undefined
): ImageSourcePropType | null {
  const foto = useFotoDeUsuario(p?.usuarioId, p?.fotoVersao);
  const retratoDoEstudio = useEstudio().retratoEnviado;
  if (!p) return null;
  if (p.fotoId) return { uri: urlDaImagem(p.fotoId) };
  if (foto.data?.dataUrl) return { uri: foto.data.dataUrl };
  // o retrato do estudio e o do Stewer: vale para ele enquanto nao sobe foto na conta
  if (!p.fotoUrl && retratoDoEstudio && p.nome?.trim().toLowerCase().startsWith('stewer')) {
    return retratoDoEstudio.fonte;
  }
  return fotoDoProfissional(p);
}

/**
 * A foto de reserva da conta logada: quando a pessoa nao subiu foto de perfil mas
 * aparece na equipe com uma (a foto so da equipe, ou o retrato do Stewer), o perfil
 * mostra essa mesma, para nao ficar uma coisa na Equipe e outra no perfil.
 */
export function useReservaDaMinhaFoto(): ImageSourcePropType | null {
  const { profissional } = useMeuProfissional();
  return useRetratoDoProfissional(profissional);
}
