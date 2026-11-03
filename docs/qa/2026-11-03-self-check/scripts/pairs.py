# A(before)·B(after-B) 캡처를 좌우로 붙인 짝 비교 이미지를 만든다.
# 사용: python3 -I pairs.py <before_dir> <after_dir> <out_dir> [jpeg_out_dir]
# out_dir 에는 18쌍 PNG, jpeg_out_dir 에는 커밋용 JPEG(1280 라이트·다크, 390 라이트 × 3페이지 = 9장).
import os, sys
from PIL import Image, ImageDraw, ImageFont

before, after, out = sys.argv[1], sys.argv[2], sys.argv[3]
jpeg_out = sys.argv[4] if len(sys.argv) > 4 else None
os.makedirs(out, exist_ok=True)
if jpeg_out: os.makedirs(jpeg_out, exist_ok=True)
font = ImageFont.truetype('/System/Library/Fonts/AppleSDGothicNeo.ttc', 22)
PAGE_KO = {'home': '홈', 'blog': '블로그 상세', 'magazine': '매거진 목록'}
COMMIT = {('1280', 'light'), ('1280', 'dark'), ('390', 'light')}
n = 0
for f in sorted(os.listdir(before)):
    if not f.endswith('.png'): continue
    page, vp, theme = f[:-4].split('-')
    a, b = Image.open(os.path.join(before, f)).convert('RGB'), Image.open(os.path.join(after, f)).convert('RGB')
    gap, head = 24, 48
    W, H = a.width + b.width + gap * 3, max(a.height, b.height) + head + gap
    bg = (245, 240, 235)
    im = Image.new('RGB', (W, H), bg)
    im.paste(a, (gap, head)); im.paste(b, (gap * 2 + a.width, head))
    d = ImageDraw.Draw(im)
    label = f'{PAGE_KO[page]} · {vp}px · {"라이트" if theme == "light" else "다크"}'
    d.text((gap, 12), f'A 현행 — {label}', fill=(30, 30, 30), font=font)
    d.text((gap * 2 + a.width, 12), f'B 시안 — {label}', fill=(62, 95, 74), font=font)
    im.save(os.path.join(out, f'pair-{page}-{vp}-{theme}.png'))
    if jpeg_out and (vp, theme) in COMMIT:
        im.save(os.path.join(jpeg_out, f'pair-{page}-{vp}-{theme}.jpg'), quality=82, optimize=True)
    n += 1
print(n, 'pairs')
