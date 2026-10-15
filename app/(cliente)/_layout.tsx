import { Stack } from 'expo-router';

import { GuardaDePapel } from '@/auth/guarda';

export default function CLIENTELayout() {
  return (
    <GuardaDePapel permitidos={['CLIENTE']}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </GuardaDePapel>
  );
}
