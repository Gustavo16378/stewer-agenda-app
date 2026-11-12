/**
 * A foto de um profissional, na ordem de preferencia: a foto de perfil que ele subiu
 * na conta, a URL cadastrada na ficha, e, para o proprio Stewer enquanto ele nao sobe
 * uma, o retrato da aba Estudio (ou o do site). Nulo: as iniciais.
 */
import type { ImageSourcePropType } from 'react-native';

import { useFotoDeUsuario } from '@/api/hooks';
import type { Profissional } from '@/api/types';
import { fotoDoProfissional } from '@/content/atelie';
import { useEstudio } from '@/content/estudio';

export function useRetratoDoProfissional(
  p: Profissional | null | undefined
): ImageSourcePropType | null {
  const foto = useFotoDeUsuario(p?.usuarioId, p?.fotoVersao);
  const retratoDoEstudio = useEstudio().retratoEnviado;
  if (!p) return null;
  if (foto.data?.dataUrl) return { uri: foto.data.dataUrl };
  // o retrato do estudio e o do Stewer: vale para ele enquanto nao sobe foto na conta
  if (!p.fotoUrl && retratoDoEstudio && p.nome?.trim().toLowerCase().startsWith('stewer')) {
    return retratoDoEstudio.fonte;
  }
  return fotoDoProfissional(p);
}
