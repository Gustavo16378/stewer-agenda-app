import { Redirect, Stack } from 'expo-router';

import { rotaInicialDoPapel, useAuth } from '@/auth/auth-context';

export default function AuthLayout() {
  const { status, role } = useAuth();

  // ja logado: nao faz sentido ver o login
  if (status === 'autenticado' && role) {
    return <Redirect href={rotaInicialDoPapel(role) as never} />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
