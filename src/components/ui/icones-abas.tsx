/**
 * Icones das abas, desenhados aqui no mesmo traco (1,6 sobre 24) para o conjunto ter
 * cara de familia. Sem biblioteca de icones: sao doze desenhos, e assim ficam do jeito da
 * marca (cantos retos, latao quando a aba esta ativa).
 */
import Svg, { Circle, Path, Rect } from 'react-native-svg';

const DESENHOS: Record<string, (cor: string) => React.ReactNode> = {
  inicio: (c) => (
    <Path
      d="M4 10.5 12 4l8 6.5V20h-5.5v-5.5h-5V20H4z"
      stroke={c}
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  ),
  agendar: (c) => (
    <>
      <Rect x={3.5} y={5} width={17} height={15} rx={1.5} stroke={c} strokeWidth={1.6} />
      <Path
        d="M3.5 9.5h17M8 3v4M16 3v4M12 12.5v5M9.5 15h5"
        stroke={c}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </>
  ),
  'meus-horarios': (c) => (
    <>
      <Circle cx={12} cy={12} r={8.5} stroke={c} strokeWidth={1.6} />
      <Path
        d="M12 7.5V12l3 2"
        stroke={c}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  perfil: (c) => (
    <>
      <Circle cx={12} cy={8.5} r={3.8} stroke={c} strokeWidth={1.6} />
      <Path
        d="M4.5 20c.8-3.6 3.8-5.5 7.5-5.5s6.7 1.9 7.5 5.5"
        stroke={c}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </>
  ),
  agenda: (c) => (
    <>
      <Rect x={3.5} y={5} width={17} height={15} rx={1.5} stroke={c} strokeWidth={1.6} />
      <Path
        d="M3.5 9.5h17M8 3v4M16 3v4M7.5 13h3M7.5 16.5h6"
        stroke={c}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </>
  ),
  clientes: (c) => (
    <>
      <Circle cx={9} cy={9} r={3.3} stroke={c} strokeWidth={1.6} />
      <Path
        d="M3 19.5c.6-3 3-4.8 6-4.8s5.4 1.8 6 4.8"
        stroke={c}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M15.5 5.9a3.3 3.3 0 0 1 0 6.3M17.5 14.9c1.8.6 3.1 2.2 3.5 4.6"
        stroke={c}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </>
  ),
  disponibilidade: (c) => (
    <>
      <Circle cx={12} cy={12} r={8.5} stroke={c} strokeWidth={1.6} />
      <Path
        d="M12 7.5V12l3 2"
        stroke={c}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  'visao-geral': (c) => (
    <Path
      d="M4 20h16M6.5 20v-6M11 20V8M15.5 20v-9M20 20V5"
      stroke={c}
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  ),
  servicos: (c) => (
    <>
      <Circle cx={6.5} cy={17} r={2.8} stroke={c} strokeWidth={1.6} />
      <Circle cx={17.5} cy={17} r={2.8} stroke={c} strokeWidth={1.6} />
      <Path d="M8.6 15.2 18 4M15.4 15.2 6 4" stroke={c} strokeWidth={1.6} strokeLinecap="round" />
    </>
  ),
  equipe: (c) => (
    <>
      <Circle cx={12} cy={7.5} r={3.3} stroke={c} strokeWidth={1.6} />
      <Path
        d="M6 20c.6-3.2 3-5 6-5s5.4 1.8 6 5M3 13.5l2.2-1M21 13.5l-2.2-1"
        stroke={c}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </>
  ),
  // a fachada do estudio: toldo e porta
  estudio: (c) => (
    <>
      <Path
        d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16M4 9.5c0 1.4 1.2 2.5 2.7 2.5s2.6-1.1 2.6-2.5c0 1.4 1.2 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1.1 2.5 2.6 2.5S20 10.9 20 9.5M5.5 12v8h13v-8M10 20v-4.5h4V20"
        stroke={c}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </>
  ),
  // uma lista com o relogio: o que aconteceu e quando
  auditoria: (c) => (
    <>
      <Path d="M5 6.5h8M5 11h6M5 15.5h4" stroke={c} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx={16.5} cy={15.5} r={4.5} stroke={c} strokeWidth={1.6} />
      <Path d="M16.5 13.2v2.5l1.6 1" stroke={c} strokeWidth={1.6} strokeLinecap="round" />
    </>
  ),
};

export function IconeDaAba({
  rota,
  cor,
  tamanho = 24,
}: {
  rota: string;
  cor: string;
  tamanho?: number;
}) {
  const desenho = DESENHOS[rota] ?? DESENHOS.inicio!;
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none">
      {desenho(cor)}
    </Svg>
  );
}
