# fonts.mjs 캡처를 서체별로 세로로 쌓은 비교판(본문·한국어 요약 × 1280·390)을 만든다.
# 사용: python3 font-sheet.py <fontsDir>
import os, sys, json
from PIL import Image, ImageDraw, ImageFont
d = sys.argv[1]
rep = json.load(open(os.path.join(d, '_fonts-report.json')))['report']
font = ImageFont.truetype('/System/Library/Fonts/AppleSDGothicNeo.ttc', 20)
NAMES = {'v0-current-system': '현행 실제 — 시스템 글꼴(웹폰트 미로드)', 'v1-noto-sans-kr': '현행 의도 — Noto Sans KR',
         'v2-source-serif-4': '후보 1 — Source Serif 4 + Noto Serif KR', 'v3-ibm-plex-sans-kr': '후보 2 — IBM Plex Sans KR'}
for part in ('body', 'ko'):
    for w in (1280, 390):
        ims = [(k, Image.open(os.path.join(d, f'{k}-{w}-{part}.png')).convert('RGB')) for k in NAMES]
        W = max(max(i.width for _, i in ims) + 32, 620); H = sum(i.height + 52 for _, i in ims) + 16
        sheet = Image.new('RGB', (W, H), (245, 240, 235)); y = 12; dr = ImageDraw.Draw(sheet)
        for k, im in ims:
            kb = rep[f'{k}-{w}']['fontKB']
            dr.text((16, y), f'{NAMES[k]}  ·  글꼴 전송 {kb}KB', fill=(30, 30, 30), font=font); y += 36
            sheet.paste(im, (16, y)); y += im.height + 16
        sheet.save(os.path.join(d, f'sheet-{part}-{w}.png'), optimize=True)
print('ok')
