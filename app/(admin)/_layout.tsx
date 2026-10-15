import { Stack } from 'expo-router';

import { GuardaDePapel } from '@/auth/guarda';

export default function ADMINLayout() {
  return (
    <GuardaDePapel permitidos={['ADMIN']}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </GuardaDePapel>
  );
}
