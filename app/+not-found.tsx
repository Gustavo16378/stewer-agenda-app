/**
 * Rota inexistente — deep link quebrado ou link antigo.
 *
 * O design nao desenhou esta tela; ela usa o vocabulario das outras (eyebrow em caps,
 * titulo Playfair, botao fantasma) para nao destoar.
 */
import { useRouter } from 'expo-router';

import { rotaInicialDoPapel, useAuth } from '@/auth/auth-context';
import { EstadoVazio } from '@/components/ui/estados';
import { Tela } from '@/components/ui/tela';

export default function NaoEncontrado() {
  const router = useRouter();
  const { role } = useAuth();

  return (
    <Tela>
      <EstadoVazio
        className="flex-1"
        eyebrow="PÁGINA NÃO ENCONTRADA"
        titulo="Esse caminho não existe."
        descricao="O link pode estar velho ou incompleto."
        acao={{
          titulo: 'VOLTAR AO INÍCIO',
          aoTocar: () => router.replace(rotaInicialDoPapel(role) as never),
        }}
      />
    </Tela>
  );
}
