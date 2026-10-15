import { Stack } from 'expo-router';

import { GuardaDePapel } from '@/auth/guarda';

export default function PROFISSIONALLayout() {
  return (
    <GuardaDePapel permitidos={['PROFISSIONAL']}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </GuardaDePapel>
  );
}
