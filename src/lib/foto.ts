/**
 * Pegar uma foto do aparelho e deixar pronta para subir: escolhe da galeria ou tira com
 * a camera, reduz o lado maior e converte para JPEG em base64. Usado na foto de perfil
 * e no antes e depois da ficha.
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type OrigemDaFoto = 'galeria' | 'camera';

export class SemPermissao extends Error {}

/** Reduz para no maximo `lado` px no lado maior e devolve o JPEG em base64 (sem prefixo). */
export async function prepararFoto(
  uri: string,
  largura: number,
  altura: number,
  lado: number,
  qualidade: number
): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  if (Math.max(largura, altura) > lado) {
    ctx.resize(largura >= altura ? { width: lado } : { height: lado });
  }
  const imagem = await ctx.renderAsync();
  const salvo = await imagem.saveAsync({
    format: SaveFormat.JPEG,
    compress: qualidade,
    base64: true,
  });
  return salvo.base64 ?? '';
}

/**
 * Abre a galeria ou a camera e devolve a foto pronta, ou null se a pessoa desistiu.
 * `quadrada` recorta em 1:1 (foto de perfil).
 */
export async function escolherFoto(
  origem: OrigemDaFoto,
  { lado, qualidade, quadrada = false }: { lado: number; qualidade: number; quadrada?: boolean }
): Promise<string | null> {
  if (origem === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new SemPermissao('Sem acesso à câmera. Libere nas configurações.');
  }
  const opcoes: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 1,
    ...(quadrada ? { allowsEditing: true, aspect: [1, 1] as [number, number] } : {}),
  };
  const r =
    origem === 'camera'
      ? await ImagePicker.launchCameraAsync(opcoes)
      : await ImagePicker.launchImageLibraryAsync(opcoes);
  const arquivo = r.canceled ? null : r.assets[0];
  if (!arquivo) return null;
  return prepararFoto(arquivo.uri, arquivo.width, arquivo.height, lado, qualidade);
}
