/**
 * Guarda de papel para os grupos de rota.
 *
 * Defesa em profundidade: o `app/index.tsx` ja manda cada papel para a sua area, mas
 * deep link (`stewer://...`), refresh no dev e navegacao imperativa podem cair direto
 * dentro de um grupo. Cada `_layout.tsx` de papel repete a checagem.
 *
 * Isto e conveniencia de navegacao, nao seguranca: quem de fato barra e a API, que
 * responde 403 (com corpo vazio) para quem nao pode. O guarda so evita mostrar uma
 * tela que iria falhar inteira.
 */
import { Redirect } from 'expo-router';

import type { Role } from '@/api/types';
import { Carregando } from '@/components/ui/estados';
import { Tela } from '@/components/ui/tela';

import { rotaInicialDoPapel, useAuth } from './auth-context';

export function GuardaDePapel({
  permitidos,
  children,
}: {
  permitidos: readonly Role[];
  children: React.ReactNode;
}) {
  const { status, role } = useAuth();

  if (status === 'carregando') {
    return (
      <Tela>
        <Carregando />
      </Tela>
    );
  }

  if (status === 'deslogado' || !role) {
    return <Redirect href="/(auth)/entrar" />;
  }

  if (!permitidos.includes(role)) {
    // logado, mas na area errada: manda para a area do proprio papel
    return <Redirect href={rotaInicialDoPapel(role) as never} />;
  }

  return <>{children}</>;
}
