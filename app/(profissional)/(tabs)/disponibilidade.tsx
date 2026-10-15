/**
 * [12 Disponibilidade] — tab DISPONIBILIDADE do PROFISSIONAL (a propria agenda).
 * A tela mora em src/screens/disponibilidade.tsx porque o ADMIN a reusa por outra rota.
 * O token so traz `usuarioId`; a ficha (com o `profissionalId` que a API pede) vem de
 * `useMeuProfissional`.
 */
import { useMeuProfissional } from '@/api/hooks';
import { Carregando, EstadoErro } from '@/components/ui/estados';
import { Tela } from '@/components/ui/tela';
import { TelaDisponibilidade } from '@/screens/disponibilidade';

export default function MinhaDisponibilidade() {
  const { profissional, isLoading, error, refetch } = useMeuProfissional();

  if (isLoading) {
    return (
      <Tela insetInferior={false}>
        <Carregando />
      </Tela>
    );
  }
  if (error) {
    return (
      <Tela insetInferior={false}>
        <EstadoErro erro={error} aoTentarDeNovo={() => void refetch()} />
      </Tela>
    );
  }
  return <TelaDisponibilidade profissionalId={profissional?.id} />;
}
