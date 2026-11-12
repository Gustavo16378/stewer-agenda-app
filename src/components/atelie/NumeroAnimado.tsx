/**
 * Um numero que conta de 0 ate o valor quando aparece (700 ms, desacelerando). Usado nos
 * indicadores do painel: o olho vai para o numero que mudou. Quem pede menos movimento
 * ve o valor final direto.
 */
import { useEffect, useState } from 'react';
import { Text, type TextProps } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

export function NumeroAnimado({
  valor,
  sufixo = '',
  duracao = 700,
  ...props
}: TextProps & { valor: number; sufixo?: string; duracao?: number; className?: string }) {
  const menosMovimento = useReducedMotion();
  const [atual, setAtual] = useState(menosMovimento ? valor : 0);

  useEffect(() => {
    if (menosMovimento) {
      setAtual(valor);
      return;
    }
    let quadro = 0;
    const inicio = Date.now();
    const passo = () => {
      const t = Math.min(1, (Date.now() - inicio) / duracao);
      setAtual(Math.round(valor * (1 - Math.pow(1 - t, 3))));
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor, duracao, menosMovimento]);

  return (
    <Text accessibilityLabel={`${valor}${sufixo}`} {...props}>
      {atual}
      {sufixo}
    </Text>
  );
}
