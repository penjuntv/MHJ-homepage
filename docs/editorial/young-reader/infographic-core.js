/* 이달의 책 인포그래픽 공용 렌더러 — infographic.html(render.mjs 로 PNG) 과 writer.html(브라우저에서 PNG) 이 같이 쓴다.
   writer.html 을 메일로 보낼 때는 render.mjs share 가 이 파일을 writer 안에 심는다(단독 파일로 열려야 하므로).
   1600×1200 (4:3) · 매거진 본문 폭(약 400px)에서도 읽히도록 최소 글자 30px 안팎. CSS 는 .ig 안에만 적용된다. */
(function () {
  const FONTS = 'https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Noto+Sans+KR:wght@400;700&family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,600&family=Nunito:wght@700;800&display=swap';
  const CSS = `
  .ig { --bg: #f5f0ea; --ink: #1f1b17; --soft: #6b6259; --rule: #d9cfc2; --card: #fbf8f3; --a: #b07a3c;
    box-sizing: border-box; width: 1600px; height: 1200px; background: var(--bg); color: var(--ink); font-family: "Noto Sans KR", sans-serif;
    padding: 72px 88px 64px; display: flex; flex-direction: column; position: relative; overflow: hidden; text-align: left; line-height: 1.3; }
  .ig * { box-sizing: border-box; word-break: keep-all; overflow-wrap: break-word; }
  .ig .kick { display: flex; justify-content: space-between; font-family: "Nunito"; font-weight: 800; font-size: 22px; letter-spacing: .24em; color: var(--a); border-bottom: 3px solid var(--ink); padding-bottom: 16px; }
  .ig .kick span:last-child { letter-spacing: .1em; }
  .ig h1 { font-family: "Noto Serif KR", serif; font-weight: 900; font-size: 68px; line-height: 1.15; margin: 34px 0 6px; }
  .ig .sub { font-family: "Playfair Display", serif; font-style: italic; font-size: 34px; color: var(--soft); margin: 0 0 40px; }
  .ig .body { flex: 1; display: flex; flex-direction: column; min-height: 0; }
  .ig .foot { display: flex; justify-content: space-between; font-family: "Nunito"; font-weight: 700; font-size: 20px; color: var(--soft); border-top: 1.5px solid var(--rule); padding-top: 16px; margin-top: 28px; }
  .ig .en { font-family: "Playfair Display", serif; font-style: italic; color: var(--soft); }
  .ig .t-timeline .tl { margin: auto 0; }
  .ig .t-facts3 { justify-content: center; }
  .ig .t-facts3 .f3 { flex: none; }
  .ig .tl { position: relative; display: grid; gap: 28px; padding-top: 70px; }
  .ig .tl::before { content: ""; position: absolute; left: 0; right: 30px; top: 104px; border-top: 5px solid var(--ink); }
  .ig .tl::after { content: ""; position: absolute; right: 0; top: 92px; border: 15px solid transparent; border-left: 30px solid var(--ink); border-right: 0; }
  .ig .ev { position: relative; }
  .ig .ev .dot { width: 34px; height: 34px; border-radius: 50%; background: var(--a); border: 5px solid var(--ink); position: absolute; top: 17px; left: 0; }
  .ig .ev .yr { font-family: "Playfair Display"; font-weight: 900; font-size: 50px; line-height: 1; margin: -70px 0 0; }
  .ig .ev .lbl { margin-top: 84px; font-family: "Noto Serif KR"; font-weight: 700; font-size: 38px; line-height: 1.35; }
  .ig .ev .en { font-size: 26px; margin-top: 6px; line-height: 1.3; }
  .ig .people { display: grid; gap: 22px; }
  .ig .pc { background: var(--card); border: 2px solid var(--ink); padding: 20px 24px; display: grid; grid-template-columns: 1fr auto; gap: 4px 16px; align-items: baseline; }
  .ig .pc b { font-family: "Noto Serif KR"; font-size: 34px; }
  .ig .pc .sc { font-size: 30px; color: var(--a); letter-spacing: 2px; }
  .ig .pc span { grid-column: 1 / -1; font-size: 28px; color: var(--soft); line-height: 1.35; }
  .ig .s4 { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 22px; flex: 1; min-height: 0; }
  .ig .pn { background: var(--card); border: 2.5px solid var(--ink); padding: 22px 26px; display: flex; flex-direction: column; min-height: 0; }
  .ig .pn .n { font-family: "Nunito"; font-weight: 800; font-size: 22px; letter-spacing: .15em; color: var(--a); }
  .ig .pn .ko { font-family: "Noto Serif KR"; font-weight: 700; font-size: 34px; line-height: 1.4; margin-top: 8px; }
  .ig .pn .en { font-size: 26px; margin-top: auto; line-height: 1.3; }
  .ig .mean { margin-top: 24px; display: grid; grid-template-columns: auto 1fr; gap: 6px 26px; align-items: baseline; border-left: 6px solid var(--a); padding-left: 24px; }
  .ig .mean b { font-family: "Noto Serif KR"; font-size: 34px; }
  .ig .mean span { font-size: 32px; }
  .ig .mean .en { grid-column: 2; font-size: 26px; }
  .ig .mp { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; flex: 1; min-height: 0; }
  .ig .mp .pic { border: 2.5px solid var(--ink); background: var(--card) center / contain no-repeat; display: grid; place-items: center; }
  .ig .mp .pic .none { font-family: "Playfair Display"; font-style: italic; font-size: 30px; color: var(--rule); }
  .ig .pl { display: flex; flex-direction: column; gap: 26px; justify-content: center; }
  .ig .pl > div { display: grid; grid-template-columns: 70px 1fr; gap: 4px 18px; }
  .ig .pl i { grid-row: span 3; width: 62px; height: 62px; border-radius: 50%; background: var(--a); display: grid; place-items: center; font-style: normal; font-family: "Nunito"; font-weight: 800; font-size: 28px; color: #fff; }
  .ig .pl b { font-family: "Noto Serif KR"; font-size: 36px; }
  .ig .pl span { font-size: 29px; line-height: 1.35; }
  .ig .pl .en { font-size: 25px; }
  .ig .cp { display: grid; grid-template-columns: 180px repeat(3, 1fr); gap: 14px; flex: 1; align-content: start; }
  .ig .cp .h { font-family: "Noto Serif KR"; font-weight: 700; font-size: 34px; text-align: center; padding: 16px 8px; background: var(--ink); color: var(--bg); }
  .ig .cp .h .en { display: block; font-size: 22px; color: #cbbfb0; }
  .ig .cp .q { font-family: "Noto Serif KR"; font-weight: 700; font-size: 32px; display: flex; flex-direction: column; justify-content: center; }
  .ig .cp .q .en { font-size: 22px; }
  .ig .cp .c { background: var(--card); border: 2px solid var(--rule); padding: 18px 20px; font-size: 30px; line-height: 1.35; min-height: 150px; }
  .ig .punch { margin-top: 24px; font-family: "Noto Serif KR"; font-weight: 700; font-size: 34px; border-left: 6px solid var(--a); padding-left: 24px; }
  .ig .fl { display: grid; gap: 18px; flex: 1; align-content: center; }
  .ig .st { display: grid; grid-template-columns: 90px 280px 1fr; gap: 26px; align-items: center; background: var(--card); border: 2px solid var(--ink); padding: 16px 26px; position: relative; }
  .ig .st + .st::before { content: ""; position: absolute; top: -20px; left: 68px; border: 11px solid transparent; border-top: 14px solid var(--a); }
  .ig .st .ic { font-size: 50px; text-align: center; }
  .ig .st b { font-family: "Noto Serif KR"; font-size: 32px; }
  .ig .st span { font-size: 30px; line-height: 1.35; }
  .ig .st .en { display: block; font-size: 24px; }
  .ig .f3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; flex: 1; }
  .ig .fc { border-top: 8px solid var(--ink); padding-top: 26px; display: flex; flex-direction: column; }
  .ig .fc .no { font-family: "Nunito"; font-weight: 800; font-size: 26px; letter-spacing: .2em; color: var(--a); }
  .ig .fc .big { font-family: "Playfair Display"; font-weight: 900; font-size: 150px; line-height: 1; margin: 18px 0 6px; }
  .ig .fc .big small { font-family: "Noto Sans KR"; font-size: 36px; font-weight: 700; margin-left: 8px; }
  .ig .fc .t { font-family: "Noto Serif KR"; font-weight: 700; font-size: 34px; line-height: 1.4; }
  .ig .fc .en { font-size: 26px; margin-top: 12px; line-height: 1.35; }`;

  const esc = t => String(t ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const stars = n => '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0));
  const KIND = { timeline: '한국사 이야기', story4: '고사성어 이야기', map: '지리 이야기', compare: '문화 이야기', flow: '사회 이야기', facts3: '알고 있었나요?' };
  const KIDS = { hyun: { ko: '현이', en: 'Hyun' }, min: { ko: '민이', en: 'Min' }, jin: { ko: '지니', en: 'Jin' } };
  const arr = a => (Array.isArray(a) ? a : []);
  const T = {
    timeline: d => `
      <div class="tl" style="grid-template-columns:repeat(${Math.max(1, arr(d.events).length)},1fr)">
        ${arr(d.events).map(e => `<div class="ev"><div class="yr">${esc(e.year)}</div><div class="dot"></div><div class="lbl">${esc(e.label)}</div><div class="en">${esc(e.labelEn)}</div></div>`).join('')}
      </div>
      ${arr(d.people).length ? `<div class="people" style="grid-template-columns:repeat(${arr(d.people).length},1fr)">
        ${arr(d.people).map(p => `<div class="pc"><b>${esc(p.name)}</b><div class="sc">${stars(+p.score)}</div><span>${esc(p.did)}</span></div>`).join('')}</div>` : ''}`,
    story4: d => `
      <div class="s4">${arr(d.panels).map((p, i) => `<div class="pn"><div class="n">${['BEGINNING · 처음에', 'THEN · 그런데', 'SO · 그래서', 'IN THE END · 마지막에'][i] || ''}</div>
        <div class="ko">${esc(p.ko)}</div><div class="en">${esc(p.en)}</div></div>`).join('')}</div>
      ${d.meaning || d.meaningEn ? `<div class="mean"><b>뜻</b><span>${esc(d.meaning)}</span><div class="en">${esc(d.meaningEn)}${d.similar ? ` · cf. “${esc(d.similar)}”` : ''}</div></div>` : ''}`,
    map: d => `
      <div class="mp"><div class="pic"${d.image ? ` style="background-image:url('${d.image}')"` : ''}>${d.image ? '' : '<span class="none">Map</span>'}</div>
        <div class="pl">${arr(d.places).map((p, i) => `<div><i>${i + 1}</i><b>${esc(p.name)}</b><span>${esc(p.why)}</span><span class="en">${esc(p.whyEn)}</span></div>`).join('')}</div></div>`,
    compare: d => `
      <div class="cp"><div></div>${arr(d.cols).map(c => `<div class="h">${esc(c.ko)}<span class="en">${esc(c.en)}</span></div>`).join('')}
        ${arr(d.rows).map(r => `<div class="q">${esc(r.q)}<span class="en">${esc(r.qEn)}</span></div>${arr(r.cells).map(c => `<div class="c">${esc(c)}</div>`).join('')}`).join('')}</div>
      ${d.punch ? `<div class="punch">${esc(d.punch)}</div>` : ''}`,
    flow: d => `
      <div class="fl">${arr(d.steps).map(s => `<div class="st"><div class="ic">${s.icon || ''}</div><b>${esc(s.label)}</b><span>${esc(s.text)}<span class="en">${esc(s.textEn)}</span></span></div>`).join('')}</div>`,
    facts3: d => `
      <div class="f3">${arr(d.facts).map((f, i) => `<div class="fc"><div class="no">FACT 0${i + 1}</div><div class="big">${esc(f.num)}<small>${esc(f.unit)}</small></div>
        <div class="t">${esc(f.text)}</div><div class="en">${esc(f.textEn)}</div></div>`).join('')}</div>`,
  };

  function html(d) {
    const k = KIDS[d.kid] || KIDS.hyun;
    return `
      <div class="kick"><span>${k.en.toUpperCase()}'S MONTHLY BOOK</span><span>${k.ko}의 이달의 책 · ${esc(d.kind || KIND[d.type] || '')}</span></div>
      <h1>${esc(d.title)}</h1><p class="sub">${esc(d.titleEn)}</p>
      <div class="body t-${esc(d.type)}">${(T[d.type] || (() => ''))(d)}</div>
      <div class="foot"><span>From ${k.en}'s notebook · ${k.ko}의 취재 노트에서</span><span>${esc(d.book || '')}</span></div>`;
  }
  function injectStyle(doc = document) {
    if (doc.getElementById('ig-style')) return;
    const st = doc.createElement('style'); st.id = 'ig-style'; st.textContent = CSS; doc.head.append(st);
    if (!doc.querySelector('link[data-ig-fonts]')) {
      const l = doc.createElement('link'); l.rel = 'stylesheet'; l.href = FONTS; l.dataset.igFonts = ''; doc.head.append(l);
    }
  }
  function mount(el, d) { injectStyle(el.ownerDocument); el.classList.add('ig'); el.innerHTML = html(d); return el; }

  window.MHJInfographic = { CSS, FONTS, KIND, html, mount, injectStyle };
})();
