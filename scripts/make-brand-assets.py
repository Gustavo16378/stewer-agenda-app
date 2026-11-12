"""
Gera icone, icone adaptativo do Android, splash e favicon com a marca do app:
o monograma "SG" em Playfair Display dentro do losango dourado, sobre o preto.
E o mesmo desenho do topo da tela de login.

Rode a partir da raiz do app:  python3 scripts/make-brand-assets.py
(precisa do Pillow e de `npm install`, que traz a fonte Playfair Display)
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "assets" / "images"
FONTE = RAIZ / "node_modules/@expo-google-fonts/playfair-display/400Regular/PlayfairDisplay_400Regular.ttf"

PRETO = (10, 10, 10, 255)
OURO = (201, 169, 106, 255)
CREME = (241, 235, 224, 255)
TRANSPARENTE = (0, 0, 0, 0)


def monograma(lado, fundo, escala_losango, espessura, cor_texto, cor_linha, super_amostra=4):
    """Desenha em resolucao maior e reduz: bordas lisas sem depender de antialias de linha."""
    L = lado * super_amostra
    img = Image.new("RGBA", (L, L), fundo)
    d = ImageDraw.Draw(img)
    c = L / 2
    r = L * escala_losango / 2
    pontos = [(c, c - r), (c + r, c), (c, c + r), (c - r, c)]
    d.line(pontos + [pontos[0]], fill=cor_linha, width=int(espessura * super_amostra), joint="curve")

    fonte = ImageFont.truetype(str(FONTE), int(r * 0.62))
    caixa = d.textbbox((0, 0), "SG", font=fonte)
    w, h = caixa[2] - caixa[0], caixa[3] - caixa[1]
    d.text((c - w / 2 - caixa[0], c - h / 2 - caixa[1]), "SG", font=fonte, fill=cor_texto)
    return img.resize((lado, lado), Image.LANCZOS)


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    # iOS e loja: quadrado cheio, sem transparencia.
    monograma(1024, PRETO, 0.62, 10, CREME, OURO).save(SAIDA / "icon.png")
    # Android adaptativo: o sistema recorta um circulo/quadrado do meio (66%),
    # entao o desenho fica menor e o fundo vem do app.config.
    monograma(1024, TRANSPARENTE, 0.46, 9, CREME, OURO).save(SAIDA / "android-icon-foreground.png")
    monograma(1024, TRANSPARENTE, 0.46, 9, (255, 255, 255, 255), (255, 255, 255, 255)).save(
        SAIDA / "android-icon-monochrome.png")
    monograma(512, TRANSPARENTE, 0.80, 6, CREME, OURO).save(SAIDA / "splash-icon.png")
    monograma(48, PRETO, 0.80, 2.2, CREME, OURO, super_amostra=8).save(SAIDA / "favicon.png")
    print("assets gerados em", SAIDA)


if __name__ == "__main__":
    main()
