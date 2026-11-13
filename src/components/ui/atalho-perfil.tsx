/**
 * Atalho para o perfil no topo da agenda e do painel: a foto (ou as iniciais) e
 * "Meu perfil". Antes era so a palavra "Conta", que ninguem entendia que era o perfil.
 */
import { Pressable, Text } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { useReservaDaMinhaFoto } from '@/components/atelie/retrato';

import { AvatarPessoa } from './imagem';

export function AtalhoDoPerfil({ aoTocar }: { aoTocar: () => void }) {
  const { usuario } = useAuth();
  const reserva = useReservaDaMinhaFoto();

  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel="Meu perfil"
      hitSlop={8}
      className="flex-row items-center gap-2"
      style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}
    >
      <AvatarPessoa
        usuarioId={usuario?.id}
        fotoVersao={usuario?.fotoVersao}
        nome={usuario?.nome}
        tamanho={30}
        fonteReserva={reserva}
      />
      <Text className="font-sans-medium text-ui-sm text-latao">Meu perfil</Text>
    </Pressable>
  );
}
