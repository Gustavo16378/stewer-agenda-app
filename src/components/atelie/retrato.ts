/**
 * A foto de um profissional, na ordem de preferencia: a foto de perfil que ele subiu
 * na conta, a URL cadastrada na ficha, e, para o proprio Stewer enquanto ele nao sobe
 * uma, o retrato do site. Nulo: as iniciais.
 */
import type { ImageSourcePropType } from 'react-native';

import { useFotoDeUsuario } from '@/api/hooks';
import type { Profissional } from '@/api/types';
import { fotoDoProfissional } from '@/content/atelie';

export function useRetratoDoProfissional(
  p: Profissional | null | undefined
): ImageSourcePropType | null {
  const foto = useFotoDeUsuario(p?.usuarioId, p?.fotoVersao);
  if (!p) return null;
  if (foto.data?.dataUrl) return { uri: foto.data.dataUrl };
  return fotoDoProfissional(p);
}
