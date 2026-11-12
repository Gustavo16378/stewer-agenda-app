"""
Gera o mapa do studio do Stewer (Conciso, 204 Sul) nas cores do app (claro e escuro).

Baixa poucos tiles do OpenStreetMap UMA vez, monta a regiao em volta do endereco, tira
a cor e repinta em duas tintas da paleta (carvao/areia no escuro, tinta/papel no
claro). O resultado vai para assets/images/atelie/mapa-{claro,escuro}.jpg, com o
endereco exatamente no centro da imagem, que e onde o app desenha o pino.

Dados do mapa: (c) colaboradores do OpenStreetMap (ODbL), tiles em CC BY-SA. O app
mostra a atribuicao em cima do mapa.

    python3 scripts/make-map.py
"""
import io
import math
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

LAT, LON = -10.195029, -48.328703  # Conciso: 204 Sul, Alameda 10, Galeria Encore 21 -- Palmas, TO
ZOOM = 17
LARGURA, ALTURA = 1200, 760  # 2x da maior largura em que o mapa aparece
TILE = 256
UA = 'stewer-agenda-build/1.0 (gera um mapa estatico uma unica vez)'

CURVA = {'escuro': 0.75, 'claro': 0.9}
SAIDA = Path(__file__).resolve().parent.parent / 'assets' / 'images' / 'atelie'

# (sombra, luz) de cada tema: carvao e areia no escuro, tinta e papel no claro.
TINTAS = {
    'escuro': ((10, 10, 10), (176, 160, 136)),
    'claro': ((92, 82, 70), (238, 232, 222)),
}


def pixel_global(lat, lon, z):
    n = 2 ** z * TILE
    x = (lon + 180) / 360 * n
    r = math.radians(lat)
    y = (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * n
    return x, y


def baixar(z, x, y):
    req = urllib.request.Request(f'https://tile.openstreetmap.org/{z}/{x}/{y}.png', headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=20) as r:
        return Image.open(io.BytesIO(r.read())).convert('RGB')


def main():
    cx, cy = pixel_global(LAT, LON, ZOOM)
    # a regiao de tiles que cobre a imagem final (em 1x; o 2x vem do redimensionamento)
    meia_l, meia_a = LARGURA / 4, ALTURA / 4
    x0, x1 = int((cx - meia_l) // TILE), int((cx + meia_l) // TILE)
    y0, y1 = int((cy - meia_a) // TILE), int((cy + meia_a) // TILE)

    mosaico = Image.new('RGB', ((x1 - x0 + 1) * TILE, (y1 - y0 + 1) * TILE))
    for tx in range(x0, x1 + 1):
        for ty in range(y0, y1 + 1):
            mosaico.paste(baixar(ZOOM, tx, ty), ((tx - x0) * TILE, (ty - y0) * TILE))

    esq = cx - x0 * TILE - meia_l
    topo = cy - y0 * TILE - meia_a
    recorte = mosaico.crop((round(esq), round(topo), round(esq + meia_l * 2), round(topo + meia_a * 2)))
    recorte = recorte.resize((LARGURA, ALTURA), Image.LANCZOS)

    # O OSM e todo claro (quadras bege, ruas brancas). Estica o contraste para as ruas
    # se destacarem das quadras e depois aplica a curva de cada tema.
    cinza = ImageOps.autocontrast(ImageOps.grayscale(recorte), cutoff=(2, 0))

    for tema, (sombra, luz) in TINTAS.items():
        # no escuro o mapa e invertido: os nomes das ruas (pretos no OSM) ficam claros e
        # legiveis, as quadras viram carvao e as ruas, canais ainda mais escuros
        base = ImageOps.invert(cinza) if tema == 'escuro' else cinza
        gama = CURVA[tema]
        base = base.point(lambda v, g=gama: int(255 * (v / 255) ** g))
        pintado = ImageOps.colorize(base, sombra, luz)
        pintado.save(SAIDA / f'mapa-{tema}.jpg', quality=82, optimize=True, progressive=True)
        print('ok', tema, pintado.size)


if __name__ == '__main__':
    main()
