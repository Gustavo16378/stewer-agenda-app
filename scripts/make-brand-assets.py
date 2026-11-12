"""
Gera icone, icone adaptativo do Android, splash e favicon com a logo do Stewer:
o "S" em vetor (os mesmos tres poligonos do site e de src/components/marca/logo.ts),
claro sobre o preto da marca.

Rode a partir da raiz do app:  python3 scripts/make-brand-assets.py   (precisa do Pillow)
"""
import re
from pathlib import Path

from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "assets" / "images"
LOGO_TS = RAIZ / "src" / "components" / "marca" / "logo.ts"

PRETO = (10, 10, 10, 255)
BRANCO = (243, 243, 243, 255)
TRANSPARENTE = (0, 0, 0, 0)
LARGURA, ALTURA = 59.5, 100.0


def poligonos():
    """Le os paths direto do logo.ts, para o icone nunca divergir da logo do app."""
    texto = LOGO_TS.read_text(encoding="utf-8")
    paths = re.findall(r"'(M[^']+Z)'", texto)
    return [[(float(x), float(y)) for x, y in re.findall(r"(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)", d)]
            for d in paths]


def desenhar(lado, fundo, escala_altura, cor=BRANCO, super_amostra=4):
    """`escala_altura`: que fracao do lado a altura do S ocupa."""
    L = lado * super_amostra
    img = Image.new("RGBA", (L, L), fundo)
    d = ImageDraw.Draw(img)
    h = L * escala_altura
    k = h / ALTURA
    w = LARGURA * k
    ox, oy = (L - w) / 2, (L - h) / 2
    # O poligono de fora e o S de dentro se sobrepoem so nas bordas; desenhar cheio
    # cada um reproduz o fill do SVG (nonzero) para estes tres desenhos.
    for poli in poligonos():
        d.polygon([(ox + x * k, oy + y * k) for x, y in poli], fill=cor)
    return img.resize((lado, lado), Image.LANCZOS)


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    # iOS e lojas: quadrado cheio, sem transparencia.
    desenhar(1024, PRETO, 0.56).save(SAIDA / "icon.png")
    # Android adaptativo: o sistema recorta o meio (66%), entao o S fica menor.
    desenhar(1024, TRANSPARENTE, 0.42).save(SAIDA / "android-icon-foreground.png")
    desenhar(1024, TRANSPARENTE, 0.42, cor=(255, 255, 255, 255)).save(
        SAIDA / "android-icon-monochrome.png")
    # Splash: o mesmo S do comeco da abertura animada, para a troca nao "pular".
    desenhar(512, TRANSPARENTE, 0.62).save(SAIDA / "splash-icon.png")
    desenhar(48, PRETO, 0.78, super_amostra=8).save(SAIDA / "favicon.png")
    print("assets gerados em", SAIDA)


if __name__ == "__main__":
    main()
