/** A logo do Stewer (o "S") em vetor, nitida em qualquer tela. */
import Svg, { Path } from 'react-native-svg';

import { LOGO_ALTURA, LOGO_LARGURA, LOGO_PATHS, LOGO_VIEWBOX } from './logo';

export function LogoStewer({ altura, cor = '#f3f3f3' }: { altura: number; cor?: string }) {
  return (
    <Svg
      width={(altura * LOGO_LARGURA) / LOGO_ALTURA}
      height={altura}
      viewBox={LOGO_VIEWBOX}
      accessibilityLabel="Stewer Gabriel"
    >
      {LOGO_PATHS.map((d) => (
        <Path key={d} d={d} fill={cor} />
      ))}
    </Svg>
  );
}
