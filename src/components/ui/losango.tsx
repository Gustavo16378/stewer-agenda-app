import { Text, View } from 'react-native';

/**
 * O losango da marca: quadrado com borda dourada girado 45deg, com a sigla
 * contra-girada -45deg para ficar de pe.
 *
 * Do design (valores literais):
 *   `width:58px;height:58px;border:1px solid #C9A96A;transform:rotate(45deg)`
 *   filho: `transform:rotate(-45deg);font-family:'Playfair Display';font-size:19px;
 *           letter-spacing:.08em`
 *
 * Tamanhos que aparecem nos frames: 58 (splash, sigla 19), 40 (acesso, sigla 14),
 * 52 (capa do board, sigla 17) e 7 (marcador sem sigla).
 *
 * A borda usa `gold-border`, que e #C9A96A nos DOIS temas — no design o dourado so
 * muda de tom quando e texto, nunca quando e contorno.
 */
export function Losango({
  tamanho = 58,
  sigla,
  tamanhoSigla,
}: {
  tamanho?: number;
  sigla?: string;
  /** Corpo da sigla em px. Omitido, usa a proporcao do design (19/58). */
  tamanhoSigla?: number;
}) {
  const corpo = tamanhoSigla ?? Math.round((tamanho * 19) / 58);
  // `transform` nao muda o espaco que a View ocupa no layout: girado 45deg, um quadrado
  // de 58px desenha 82px de diagonal. Sem esta folga, qualquer ancestral com
  // `overflow:hidden` corta as pontas do losango.
  const caixa = Math.ceil(tamanho * Math.SQRT2);

  return (
    <View className="items-center justify-center" style={{ width: caixa, height: caixa }}>
      <View
        className="items-center justify-center border border-gold-border"
        style={{ width: tamanho, height: tamanho, transform: [{ rotate: '45deg' }] }}
      >
        {sigla ? (
          <Text
            className="font-display text-ink"
            style={{
              transform: [{ rotate: '-45deg' }],
              fontSize: corpo,
              // .08em do design; em RN letterSpacing e px, entao converte pelo corpo
              letterSpacing: corpo * 0.08,
              includeFontPadding: false,
            }}
            maxFontSizeMultiplier={1}
          >
            {sigla}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
