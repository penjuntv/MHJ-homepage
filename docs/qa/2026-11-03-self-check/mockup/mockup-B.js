// 시안 B 목업의 글자 치환 — 글자로 박힌 가운뎃점(U+00B7)은 CSS 로 지울 수 없어서 이 스크립트만 쓴다.
// " · " → ", " (예: "Life in Aotearoa · 30 Oct 2026" → "Life in Aotearoa, 30 Oct 2026").
// 페이지 로드 뒤 page.evaluate 로 한 번 실행하고, 이후 지연 로드되는 노드도 MutationObserver 로 따라간다. 코드 반영 아님.
(() => {
  const fix = (root) => {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const hits = [];
    while (w.nextNode()) if (w.currentNode.textContent.includes('·')) hits.push(w.currentNode);
    for (const n of hits) {
      // 노드가 점 하나뿐이면(" · " 를 따로 렌더한 경우) 쉼표+공백으로, 아니면 앞뒤 공백까지 묶어 ", " 로
      n.textContent = /^\s*·\s*$/.test(n.textContent)
        ? ', '
        : n.textContent.replace(/^\s*·\s*/, ', ').replace(/\s*·\s*/g, ', ');
    }
    return hits.length;
  };
  const count = fix(document.body);
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && fix(n)))).observe(document.body, { childList: true, subtree: true });
  window.__mockupBDots = count;
})();
