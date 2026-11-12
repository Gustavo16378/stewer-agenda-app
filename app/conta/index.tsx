/** Conta da equipe (profissional e admin), aberta pela acao CONTA do cabecalho. */
import { GuardaDePapel } from '@/auth/guarda';
import Conta from '@/screens/conta';

function ContaDaEquipe() {
  return <Conta comVoltar />;
}

/** Direto pelo link ou depois de recarregar: so mostra a tela com a sessao ja restaurada. */
export default function RotaContaDaEquipe() {
  return (
    <GuardaDePapel permitidos={['CLIENTE', 'PROFISSIONAL', 'ADMIN']}>
      <ContaDaEquipe />
    </GuardaDePapel>
  );
}
