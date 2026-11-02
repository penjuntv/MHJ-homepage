# STEP 2 전수표 생성기. 사용: python3 -I inventory.py <repo> <out.md>
# 네 갈래(인디고·보라 / 브라운·그린 / 대문자 / 가운뎃점)를 파일:줄 단위로 모으고,
# 같은 정의로 /usr/bin/grep 을 돌려 행 수가 일치하는지 스스로 확인한다.
import os, re, sys, subprocess, collections

REPO, OUT = sys.argv[1], sys.argv[2]
ROOTS = ['app', 'components']
EXCL = ('app/mhj-desk/', 'components/admin/')
EXTS = ('.ts', '.tsx', '.css')

IND_HEX = '4F46E5|6366F1|818CF8|A5B4FC|C7D2FE|EEF2FF|E0E7FF|312E81|4338CA|3730A3|1E1B4B|1B1B2E|F5F3FF|FDF4FF|EDE9FE|DDD6FE|C4B5FD|8B5CF6|7C3AED|6D28D9|9333EA|A855F7'
IND_RGB = '79, *70, *229|99, *102, *241|129, *140, *248|238, *242, *255|30, *27, *75|109, *40, *217|147, *51, *234|139, *92, *246'
PAT = {
    'IND': r'var\(--accent[,)]|--accent:|#(' + IND_HEX + r')([^0-9A-Fa-f]|$)|rgba?\( *(' + IND_RGB + r')|indigo-[0-9]|violet-[0-9]|purple-[0-9]',
    'BG': r'#(8A6B4F|C9A882|3E5F4A)([^0-9A-Fa-f]|$)|rgba?\( *(138, *107, *79|201, *168, *130|62, *95, *74)|var\(--(mhj-brown|mhj-brown-dark|mhj-green|number-accent)[,)]',
    'UP': r'uppercase',
    'DOT': r'·',
}
COMMENT_ONLY = re.compile(r'^\s*(//|/\*|\*|\{/\*)')
COMMENT_GREP = r':[0-9]+:[[:space:]]*(//|/\*|\*|\{/\*)'

def lum(h):
    h = h.lstrip('#'); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
def cr(a, b):
    x, y = sorted([lum(a), lum(b)], reverse=True); return (x + 0.05) / (y + 0.05)
LIGHT = ['#FFFFFF', '#FAF8F5', '#F5F0EB']; DARK = ['#0A0A0A', '#161412', '#1E1E1E']
def crs(c, bgs): return ' / '.join('%.2f' % cr(c, b) for b in bgs)

# 시안 B 제안 색. 다크 그린 #8FB39B 는 브랜드 그린(#3E5F4A)과 같은 색상·채도에서 명도만 올린 파생값.
TEXT_MAP = {'#4F46E5': '#3E5F4A', '#6366F1': '#3E5F4A', '#4338CA': '#2F4A39', '#3730A3': '#2F4A39', '#312E81': '#2F4A39',
            '#7C3AED': '#3E5F4A', '#8B5CF6': '#3E5F4A', '#6D28D9': '#2F4A39', '#9333EA': '#3E5F4A', '#A855F7': '#3E5F4A'}
DARK_TEXT_MAP = {'#818CF8': '#8FB39B', '#A5B4FC': '#8FB39B', '#C7D2FE': '#C9D9CE', '#C4B5FD': '#C9D9CE'}
TINT_MAP = {'#EEF2FF': '#EEF3EF', '#E0E7FF': '#E3ECE6', '#C7D2FE': '#C9D9CE', '#F5F3FF': '#F3F6F2', '#FDF4FF': '#FAF8F5',
            '#EDE9FE': '#E3ECE6', '#DDD6FE': '#D9E4DC'}
DARK_TINT_MAP = {'#1B1B2E': '#18201B', '#1E1B4B': '#18201B'}
RGB_NOTE = [('79, *70, *229', '#4F46E5 반투명'), ('99, *102, *241', '#6366F1 반투명'), ('129, *140, *248', '#818CF8 반투명'),
            ('238, *242, *255', '#EEF2FF 반투명'), ('30, *27, *75', '#1E1B4B 반투명'), ('109, *40, *217', '보라 #6D28D9 반투명'),
            ('147, *51, *234', '보라 #9333EA 반투명'), ('139, *92, *246', '보라 #8B5CF6 반투명')]

MAG_SURFACE = ('components/magazine/templates/', 'components/magazine/MagazineCanvas', 'components/magazine/MagazinePage',
               'components/magazine/ArticlePageRenderer', 'components/magazine/PageThumbnail', 'components/magazine/CoverPreview',
               'components/magazine/TocPreview', 'components/magazine/canvas-constants', 'components/magazine/useCanvasScale',
               'components/magazine/MagazineSpreadViewer', 'app/internal/render/')
ADMIN_ONLY = ('components/TipTapEditor.tsx',)  # components/ 에 있지만 app/mhj-desk 에서만 import
NONSCREEN = ('app/api/', 'app/robots.ts', 'app/llms', 'app/sitemap', 'app/layout.tsx')

def area(path, line, sel):
    if path.startswith(ADMIN_ONLY): return 'admin-editor'
    if path.startswith('app/api/og/'): return 'og'
    if path.startswith(NONSCREEN): return 'nonscreen'
    if path.startswith(MAG_SURFACE): return 'magazine'
    if 'storypress' in path.lower() or '--sp-' in line or (path.endswith('.css') and ('.sp-' in sel or '.sp-' in line or 'storypress' in sel.lower())): return 'storypress'
    return 'public'

def files():
    for r in ROOTS:
        for d, _, fs in os.walk(os.path.join(REPO, r)):
            for f in fs:
                if f.endswith(EXTS):
                    yield os.path.relpath(os.path.join(d, f), REPO)

rows = collections.defaultdict(list); excluded = collections.Counter()
for path in sorted(files()):
    try: text = open(os.path.join(REPO, path), encoding='utf-8').read().split('\n')
    except Exception: continue
    sel = ''; in_cmt = False; lastprop = ''
    for i, line in enumerate(text, 1):
        was_cmt = in_cmt
        if path.endswith('.css'):
            st = line.strip()
            if not in_cmt and '{' in st and not st.startswith(('/*', '*')):
                sel = st.split('{')[0].strip()
            m = re.match(r'\s*([a-z-]+)\s*:', line)
            if m and not in_cmt: lastprop = m.group(1)
        o, c = line.rfind('/*'), line.rfind('*/')
        if o > c: in_cmt = True
        elif c > o: in_cmt = False
        cmt_line = was_cmt or (in_cmt and line.strip().startswith('/*'))
        for k, pat in PAT.items():
            if not re.search(pat, line, re.I): continue
            if k in ('UP', 'DOT') and COMMENT_ONLY.match(line): continue
            if path.startswith(EXCL): excluded[k] += 1; continue
            rows[k].append((path, i, line, sel, cmt_line, lastprop))

def grep_count(k):
    args = ['/usr/bin/grep', '-rnEi', '--include=*.ts', '--include=*.tsx', '--include=*.css', '-e', PAT[k]] + ROOTS
    out = subprocess.run(args, cwd=REPO, capture_output=True, text=True).stdout.splitlines()
    out = [l for l in out if not l.startswith(EXCL)]
    if k in ('UP', 'DOT'): out = [l for l in out if not re.search(r':[0-9]+:\s*(//|/\*|\*|\{/\*)', l)]
    return len(out)

HEX = re.compile(r'#[0-9A-Fa-f]{6}(?![0-9A-Fa-f])')
def is_comment_hit(k, line):
    s = line.strip()
    if s.startswith(('/*', '*', '//')): return True
    code = re.sub(r'/\*.*?\*/', '', line.split('//', 1)[0] if '://' not in line else line)
    return not re.search(PAT[k], code, re.I)

def usage(path, line, sel):
    if path.endswith('.css'):
        m = re.match(r'\s*(--[\w-]+)\s*:', line)
        if m: return f'토큰 `{m.group(1)}`' + (' (다크)' if '.dark' in sel else '')
        return f'`{sel[:46]}`' if sel else 'globals.css'
    base = os.path.splitext(os.path.basename(path))[0]
    if base in ('page', 'layout', 'route', '_client'): base = '/'.join(path.split('/')[-3:-1]) + '/' + base
    return base

def role(line, sel, k='IND', lastprop=''):
    segs = re.split(r'[;{}]|,\s*(?=[\w-]+\s*:)', line)
    seg = next((x for x in segs if re.search(PAT[k], x, re.I)), line).lower()
    m = re.match(r'\s*[\'"]?([\w-]+)[\'"]?\s*:', seg)
    prop = m.group(1) if m else lastprop
    prop = prop.lower()
    if re.search(r'background|^bg$|-bg$|--callout-bg', prop) or (not m and 'background' in lastprop): return 'bg'
    if re.search(r'border|outline|shadow|ring', prop): return 'nontext'
    if not m and re.search(r'background', seg): return 'bg'
    return 'text'

def color_cells(k, line, ar, sel, lastprop=''):
    hexes = [h.upper() for h in HEX.findall(line)]
    dark = '.dark' in sel or 'dark' in line.lower() and 'var(' not in line
    r = role(line, sel, k, lastprop)
    if k == 'IND':
        rgbn = next((n for p, n in RGB_NOTE if re.search(p, line)), None)
        cur = next((h for h in hexes if re.fullmatch('#(' + IND_HEX + ')', h, re.I)), None)
        if ar in ('storypress', 'magazine', 'admin-editor', 'nonscreen', 'og'):
            keep = {'storypress': '유지 (§6.5 제품 팔레트)', 'magazine': '유지 (매거진 지면 예외)',
                    'admin-editor': '관리자 편집기 — 공개 본문과 맞출 때 함께(선택)', 'nonscreen': '화면 밖', 'og': 'OG 이미지 — M3 에서 함께'}[ar]
            return (cur or rgbn or '`--accent`'), keep, '—', r
        if 'var(--accent' in line and not cur and not rgbn:
            return '`--accent` (#4F46E5 / 다크 #818CF8)', '`--accent` 값만 교체 → 라이트 #3E5F4A / 다크 #8FB39B', \
                   f'라이트 {crs("#4F46E5", LIGHT)} → {crs("#3E5F4A", LIGHT)} · 다크 {crs("#818CF8", DARK)} → {crs("#8FB39B", DARK)}' + (' (비텍스트 3:1 기준)' if r == 'nontext' else ''), r
        if cur:
            if r == 'bg' and (cur in TINT_MAP or cur in DARK_TINT_MAP):
                if cur in DARK_TINT_MAP or dark:
                    p = DARK_TINT_MAP.get(cur, '#18201B')
                    return cur, p + ' (면)', f'면 위 강조 글자: #818CF8 {cr("#818CF8", cur):.2f} → #8FB39B {cr("#8FB39B", p):.2f}', 'bg'
                p = TINT_MAP[cur]
                return cur, p + ' (면)' + (' — 그라데이션 없이 단색' if 'gradient' in line else ''), f'면 위 강조 글자: #4F46E5 {cr("#4F46E5", cur):.2f} → #3E5F4A {cr("#3E5F4A", p):.2f}', 'bg'
            if cur in DARK_TEXT_MAP or (dark and cur in ('#C7D2FE',)):
                p = DARK_TEXT_MAP[cur]; return cur, p, f'{crs(cur, DARK)} → {crs(p, DARK)} (다크 면)', 'text-dark'
            if cur in TEXT_MAP:
                p = TEXT_MAP[cur]; return cur, p, f'{crs(cur, LIGHT)} → {crs(p, LIGHT)}' + (' (비텍스트 3:1 기준)' if r == 'nontext' else ''), r
            if cur in TINT_MAP:
                p = TINT_MAP[cur]; return cur, p + ' (면)', f'면 위 강조 글자: #4F46E5 {cr("#4F46E5", cur):.2f} → #3E5F4A {cr("#3E5F4A", p):.2f}', 'bg'
        if rgbn:
            if '보라' in rgbn: return rgbn, '그라데이션 삭제 (단색 면)', '— (반투명, 바탕에 따라 달라짐)', r
            green = 'rgba(62,95,74,…)' if not dark else 'rgba(143,179,155,…)'
            if '238, *242' in rgbn or 'EEF2FF' in rgbn: green = 'rgba(238,243,239,…)'
            if '1E1B4B' in rgbn: green = 'rgba(24,32,27,…)'
            return rgbn, green + ' 같은 투명도', '— (반투명, 바탕에 따라 달라짐)', r
        return (cur or '?'), '?', '?', r
    # BG
    cur = next((h for h in hexes if h in ('#8A6B4F', '#C9A882', '#3E5F4A')), None)
    if not cur:
        m = re.search(r'var\(--(mhj-brown-dark|mhj-brown|mhj-green|number-accent)', line)
        if m: cur = {'mhj-brown': '#8A6B4F', 'mhj-brown-dark': '#C9A882', 'mhj-green': '#3E5F4A', 'number-accent': '#8A6B4F'}[m.group(1)]
        else:
            for rgb, h in (('138, *107, *79', '#8A6B4F'), ('201, *168, *130', '#C9A882'), ('62, *95, *74', '#3E5F4A')):
                if re.search(rgb, line): cur = h
    if ar == 'magazine': return cur, '유지 (매거진 지면 예외)', '—', r
    bgs = DARK if cur == '#C9A882' else LIGHT
    keep = '유지 (브랜드 키트)'
    if cur == '#8A6B4F' and r == 'text': keep += ' ⚠ 작은 글자면 warm 면 4.32·다크 면 4.05 미달 → 다크는 #C9A882 짝 확인'
    return cur, keep, crs(cur, bgs) + (' (다크 면)' if bgs is DARK else '') + (' (비텍스트 3:1 기준)' if r == 'nontext' else ''), r

def text_propose(k, ar):
    keep = {'storypress': '유지 (제품 랜딩 §6.5 — 별도 판단)', 'magazine': '유지 (매거진 지면 예외)',
            'admin-editor': '범위 밖 (관리자 편집기)', 'nonscreen': '화면 밖 텍스트 (메타·메일·robots 등) — 별도 판단', 'og': 'OG 이미지 — M3 에서 함께'}
    if ar in keep: return keep[ar]
    return '대문자 해제 (문장형, 자간 ≤0.02em)' if k == 'UP' else '쉼표 또는 줄바꿈·간격으로 대체'

LABEL = {'IND': 'A. 인디고·보라 (`--accent`·인디고/보라 hex·rgba·Tailwind 클래스)', 'BG': 'B. 브라운·그린 (브랜드 키트)', 'UP': 'C. 대문자 (`uppercase`)', 'DOT': 'D. 가운뎃점 (`·`)'}
out, summary = [], []
areas = collections.Counter(); props = collections.Counter()
for k in ('IND', 'BG', 'UP', 'DOT'):
    g = grep_count(k)
    summary.append((k, len(rows[k]), g, excluded[k], len({r[0] for r in rows[k]})))
    out.append(f'\n## {LABEL[k]} — {len(rows[k])}행 (grep {g}건 · 관리자 폴더 {excluded[k]}건은 범위 밖이라 제외)\n')
    out.append('```bash\n/usr/bin/grep -rnEi --include=*.ts --include=*.tsx --include=*.css \\\n  -e \'' + PAT[k] + '\' app components \\\n  | grep -vE \'^(app/mhj-desk/|components/admin/)\'' + (" \\\n  | grep -vE '" + COMMENT_GREP + "'" if k in ('UP', 'DOT') else '') + ' | wc -l\n```\n')
    if k in ('IND', 'BG'):
        out.append('| # | 파일:줄 | 영역 | 용도 | 역할 | 현재 색 | 제안 색 | 명암비 (라이트 흰/크림/warm · 다크 bg/surface/card) |')
        out.append('|---:|---|---|---|---|---|---|---|')
    else:
        out.append('| # | 파일:줄 | 영역 | 용도 | 제안 (시안 B) | 줄 내용 |')
        out.append('|---:|---|---|---|---|---|')
    for n, (path, i, line, sel, cmt_line, lastprop) in enumerate(rows[k], 1):
        ar = area(path, line, sel); u = usage(path, line, sel).replace('|', '\\|')
        areas[(k, ar)] += 1
        if k in ('IND', 'BG'):
            cur, prop, c, r = color_cells(k, line, ar, sel, lastprop)
            if cmt_line or is_comment_hit(k, line): prop, c, r = '주석 안 (변경 대상 아님)', '—', '주석'
            props[(k, prop.split(' ')[0] if prop.startswith(('유지', '관리자', '화면', 'OG', '주석', '그라데이션')) else '교체')] += 1
            out.append(f'| {n} | `{path}:{i}` | {ar} | {u} | {r} | {cur} | {prop} | {c} |')
        else:
            prop = '주석 안 (변경 대상 아님)' if (cmt_line or is_comment_hit(k, line)) else text_propose(k, ar)
            props[(k, prop.split(' ')[0])] += 1
            snip = line.strip().replace('|', '\\|').replace('`', "'")[:90]
            out.append(f'| {n} | `{path}:{i}` | {ar} | {u} | {prop} | `{snip}` |')

head = ['| 갈래 | 표 행 수 | grep 건수 | 일치 | 파일 수 | 관리자 폴더(제외) |', '|---|---:|---:|---|---:|---:|']
for k, n, g, e, f in summary:
    head.append(f'| {LABEL[k]} | {n} | {g} | {"✅" if n == g else "❌"} | {f} | {e} |')
AREA_KO = {'public': '공개 화면', 'storypress': 'StoryPress 랜딩', 'magazine': '매거진 지면', 'admin-editor': '관리자 편집기', 'nonscreen': '화면 밖', 'og': 'OG 이미지'}
head += ['', '| 갈래 | ' + ' | '.join(AREA_KO.values()) + ' |', '|---|' + '---:|' * len(AREA_KO)]
for k in ('IND', 'BG', 'UP', 'DOT'):
    head.append(f'| {k} | ' + ' | '.join(str(areas[(k, a)]) for a in AREA_KO) + ' |')
open(OUT, 'w').write('\n'.join(head) + '\n' + '\n'.join(out) + '\n')
print('\n'.join(head)); print(sorted(props.items()))
