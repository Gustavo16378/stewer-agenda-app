"""
Gera public/og.jpg, a imagem de previa do link (WhatsApp, Instagram, LinkedIn): 1200x630
com o retrato do Stewer a direita, o S, o nome e o convite para agendar a esquerda.

    python3 scripts/make-og-image.py   (precisa do Pillow)
"""
import importlib.util
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

RAIZ = Path(__file__).resolve().parent.parent
FONTES = RAIZ / "node_modules" / "@expo-google-fonts"
W, H = 1200, 630
CARVAO = (12, 12, 12)
MARFIM = (240, 235, 228)
AREIA = (176, 166, 152)
LATAO = (201, 169, 106)

# reaproveita o desenho do S do gerador de icones (mesmos poligonos do app)
spec = importlib.util.spec_from_file_location("marca", RAIZ / "scripts" / "make-brand-assets.py")
marca = importlib.util.module_from_spec(spec)
spec.loader.exec_module(marca)


def fonte(caminho, tamanho):
    return ImageFont.truetype(str(FONTES / caminho), tamanho)


def main():
    img = Image.new("RGB", (W, H), CARVAO)

    # retrato na metade direita, desbotando para o carvao na emenda
    retrato = Image.open(RAIZ / "assets" / "images" / "atelie" / "stewer-retrato.jpg").convert("RGB")
    retrato = ImageOps.fit(retrato, (H, H), centering=(0.5, 0.42))
    img.paste(retrato, (W - H, 0))
    mascara = Image.new("L", (260, H))
    for x in range(260):
        ImageDraw.Draw(mascara).line([(x, 0), (x, H)], fill=int(255 * (1 - x / 260) ** 1.6))
    img.paste(Image.new("RGB", (260, H), CARVAO), (W - H, 0), mascara)

    d = ImageDraw.Draw(img)
    s = marca.desenhar(88, (0, 0, 0, 0), 0.95, cor=(*LATAO, 255))
    img.paste(s, (72, 70), s)

    d.text((72, 210), "Stewer Gabriel", font=fonte("playfair-display/400Regular/PlayfairDisplay_400Regular.ttf", 76), fill=MARFIM)
    d.text((76, 308), "Visagista e consultor de imagem", font=fonte("inter/400Regular/Inter_400Regular.ttf", 28), fill=AREIA)
    d.line([(76, 382), (124, 382)], fill=LATAO, width=2)
    d.text((76, 408), "Agende seu horário pelo app", font=fonte("inter/500Medium/Inter_500Medium.ttf", 34), fill=MARFIM)
    d.text((76, 456), "Conciso, 204 Sul, Palmas", font=fonte("inter/400Regular/Inter_400Regular.ttf", 26), fill=AREIA)
    d.text((76, 540), "Masculinidade com propósito", font=fonte("playfair-display/400Regular_Italic/PlayfairDisplay_400Regular_Italic.ttf", 28), fill=LATAO)

    destino = RAIZ / "public" / "og.jpg"
    img.save(destino, quality=86, optimize=True, progressive=True)
    print("ok", destino, destino.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
