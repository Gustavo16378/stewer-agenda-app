/**
 * [12 Disponibilidade] via GERENCIAR do frame 17 — o ADMIN editando a agenda de um
 * profissional da equipe. `GET/PUT /profissionais/{id}/disponibilidade` e os bloqueios
 * aceitam ADMIN; um PROFISSIONAL so consegue mexer na propria (a API responde 403 na
 * alheia), entao a rota devolve quem nao e ADMIN para a area dele.
 */
import { Redirect, useLocalSearchParams } from 'expo-router';

import { rotaInicialDoPapel, useAuth } from '@/auth/auth-context';
import { GuardaDePapel } from '@/auth/guarda';
import { TelaDisponibilidade } from '@/screens/disponibilidade';

function DisponibilidadeDoProfissional() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useAuth();

  if (role !== 'ADMIN') return <Redirect href={rotaInicialDoPapel(role) as never} />;

  return <TelaDisponibilidade profissionalId={id} comCabecalhoVoltar insetInferior />;
}

/** Direto pelo link ou depois de recarregar: so mostra a tela com a sessao ja restaurada. */
export default function RotaDisponibilidadeDoProfissional() {
  return (
    <GuardaDePapel permitidos={['PROFISSIONAL', 'ADMIN']}>
      <DisponibilidadeDoProfissional />
    </GuardaDePapel>
  );
}
