import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, ArrowRight, Share2, Sparkles, Loader2,
  ChevronLeft, ChevronRight, Home, Instagram, Mail,
  Menu, Settings, MousePointer2
} from 'lucide-react';

/* ══════════════════════════════════════════════
   DATA — 매거진, 아티클, 블로그, 가족 멤버
   ══════════════════════════════════════════════ */

const INIT_MAGAZINES = [
  { id: '2026-03', year: '2026', monthName: 'Mar', title: 'MAIRANGI MORNING', editor: '조유민', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000' },
  { id: '2026-02', year: '2026', monthName: 'Feb', title: 'SUMMER SPLASH', editor: '조유현', image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?q=80&w=1000' },
  { id: '2026-01', year: '2026', monthName: 'Jan', title: 'NEW HORIZONS', editor: '조상목', image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1000' },
  { id: '2025-12', year: '2025', monthName: 'Dec', title: 'KIWI CHRISTMAS', editor: '조유진', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000' },
  { id: '2025-11', year: '2025', monthName: 'Nov', title: 'SPRING BLOOMS', editor: '조유민', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000' },
  { id: '2025-10', year: '2025', monthName: 'Oct', title: 'AUTUMN LEAVES', editor: '조유현', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000' },
  { id: '2025-09', year: '2025', monthName: 'Sep', title: 'DREAMING KIWI', editor: 'Family', image: 'https://images.unsplash.com/photo-1445510491599-c391e8046a68?q=80&w=1000' },
  { id: '2025-08', year: '2025', monthName: 'Aug', title: 'WINTER WARMTH', editor: '조상목', image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=1000' },
  { id: '2025-07', year: '2025', monthName: 'Jul', title: 'LUNCH BOX DIARY', editor: '유희종', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000' },
  { id: '2025-06', year: '2025', monthName: 'Jun', title: 'FIRST STEPS', editor: 'Family', image: 'https://images.unsplash.com/photo-1506929113675-b9299d39c1b2?q=80&w=1000' },
];

const INIT_ARTICLES = [
  { id: 1, monthId: '2026-03', title: '나의 첫 등굣길', author: '조유민', date: '2026.03.02', image: 'https://picsum.photos/seed/mag1/800/1000', content: '머레이스 베이 초등학교에 처음 가는 날이었어요. 유니폼이 조금 낯설었지만 파란색이 참 예뻐요. 교실에 가니 선생님이 \'Kia Ora\'라고 인사해주셨어요. 뉴질랜드의 학교는 한국보다 훨씬 자유로운 분위기예요. 아침마다 운동장에서 뛰어놀 수 있어서 정말 좋아요.' },
  { id: 2, monthId: '2026-03', title: '마이랑이 베이의 조개', author: '조유현', date: '2026.03.05', image: 'https://picsum.photos/seed/mag2/800/1000', content: '학교 끝나고 동생이랑 바닷가에 갔어요. 반짝이는 조개를 10개나 주웠답니다. 뉴질랜드 바다는 한국보다 더 투명한 것 같아요. 물결이 칠 때마다 조개껍데기가 햇빛에 반짝거리는 모습이 마치 보석 같아요. 나중에 이 조개들로 목걸이를 만들 거예요.' },
  { id: 3, monthId: '2026-03', title: '영어가 조금씩 들려요', author: '조유민', date: '2026.03.10', image: 'https://picsum.photos/seed/mag3/800/1000', content: '친구들이 하는 말이 처음엔 외계어 같았는데, 이제는 \'Can we play together?\'라고 말할 수 있어요. 축구를 같이 하니까 금방 친해졌어요. 영어가 완벽하지 않아도 마음으로 통한다는 걸 배웠어요.' },
  { id: 4, monthId: '2026-03', title: '막내 유진이의 모험', author: '조유진', date: '2026.03.15', image: 'https://picsum.photos/seed/mag4/800/1000', content: '언니들 학교 구경 갔어요. 커다란 미끄럼틀도 있고 잔디밭도 넓어요. 나도 내년에는 꼭 저 파란 옷 입고 학교 갈 거예요. 유진이는 학교 가방 메고 연습도 하고 있어요!' },
  { id: 5, monthId: '2026-03', title: '바비큐 파티 하는 날', author: '조유현', date: '2026.03.20', image: 'https://picsum.photos/seed/mag5/800/1000', content: '뒷마당에서 아빠가 고기를 구워주셨어요. 뉴질랜드 소고기는 정말 맛있어요. 밖에서 먹으니까 소풍 온 것 같아요. 밤하늘에 별도 많이 떠서 정말 아름다운 밤이었어요.' },
  { id: 6, monthId: '2026-03', title: '등굣길 산책로', author: '조유민', date: '2026.03.25', image: 'https://picsum.photos/seed/mag6/800/1000', content: '우리 집에서 학교까지 가는 길은 숲속 같아요. 큰 나무들도 많고 신기한 새소리도 들려요. 매일 아침 자연과 함께 시작하니 기분이 상쾌해요.' },
];

const INIT_BLOGS = [
  { id: 201, category: 'Food', title: '마이랑이 마켓의 아보카도', author: 'Heejong Jo', date: '2026.03.12', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800', content: '뉴질랜드 아보카도는 정말 크고 고소해요. 매주 일요일 아침 열리는 마켓에서 사 오는 신선한 재료들은 제 요리의 가장 큰 영감입니다. 으깬 아보카도에 레몬즙과 페퍼 플레이크를 뿌린 토스트는 이제 우리 집의 시그니처 아침 메뉴가 되었어요.' },
  { id: 202, category: 'School', title: '매시대학교 석사의 무게', author: 'Heejong Jo', date: '2026.03.05', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=800', content: '사회복지사 석사 과정은 끊임없는 읽기와 쓰기의 연속입니다. 영어로 된 전공 서적들과 씨름하다 보면 가끔은 머리가 하얘지기도 하지만, 실습 현장에서 만나는 사람들의 이야기는 저를 다시 움직이게 합니다.' },
  { id: 203, category: 'Kids', title: '아이들의 언어 적응기', author: 'Heejong Jo', date: '2026.02.20', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800', content: '처음 학교에 갔을 때 멍하니 서 있던 유민이와 유현이가 이제는 친구들과 수다를 떨며 집에 옵니다. 두려움 없이 세상에 부딪히는 아이들을 보며 부모인 저도 큰 용기를 얻습니다.' },
  { id: 204, category: 'Travel', title: '노스쇼어의 보석 같은 해변', author: 'Heejong Jo', date: '2026.01.25', image: 'https://images.unsplash.com/photo-1506929113675-b9299d39c1b2?q=80&w=800', content: '집에서 10분만 걸어가면 마주하는 마이랑이 베이부터 머레이스 베이까지. 노스쇼어의 해변들은 저마다 다른 매력을 지녔습니다. 주말마다 해변을 산책하며 아이들과 조개를 줍고 파도 소리를 듣는 것이 우리 가족의 가장 큰 힐링입니다.' },
  { id: 205, category: 'Daily', title: '오클랜드의 첫 장보기', author: 'Heejong Jo', date: '2026.01.19', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800', content: '카운트다운과 뉴월드 사이에서 방황하던 초보 정착민 시절의 이야기입니다. 한국과는 다른 장보기 문화에 당황하기도 했지만, 이제는 세일 기간을 꿰뚫고 있는 베테랑 주부가 되었습니다.' },
  { id: 206, category: 'Food', title: '키위 스타일 런치박스', author: 'Heejong Jo', date: '2025.11.10', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800', content: '뉴질랜드 학교 점심은 무척 간소합니다. 사과 하나, 샌드위치 하나면 충분하죠. 처음에는 한국식으로 푸짐하게 싸주려다 아이들의 반응을 보고 생각을 바꿨습니다.' },
  { id: 207, category: 'School', title: '사회복지 실습 첫날', author: 'Heejong Jo', date: '2025.10.05', image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800', content: '이론으로만 배우던 복지 현장을 직접 마주한 날. 이곳의 사람 중심 철학이 저에게 큰 울림을 주었습니다. 언어의 장벽을 넘어 진심을 전하는 것이 얼마나 중요한지 다시금 깨달았습니다.' },
  { id: 208, category: 'Kids', title: '유민이의 축구 경기', author: 'Heejong Jo', date: '2025.09.12', image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800', content: '비가 오는 날에도 아이들은 흙탕물 위에서 공을 찹니다. 넘어지고 다쳐도 웃으며 다시 일어나는 아이들의 모습에서 뉴질랜드의 강인한 교육 방식을 발견합니다.' },
  { id: 209, category: 'Travel', title: '퀸즈타운의 겨울', author: 'Heejong Jo', date: '2025.08.15', image: 'https://images.unsplash.com/photo-1506190500384-df96c5689100?q=80&w=800', content: '남섬 퀸즈타운에서의 짧은 여행. 웅장한 설산과 투명한 호수는 자연이 인간에게 줄 수 있는 가장 큰 감동이었습니다.' },
  { id: 210, category: 'Daily', title: '비 오는 날의 서재', author: 'Heejong Jo', date: '2025.07.05', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=800', content: '겨울비가 내리는 오클랜드. 서재에 앉아 따뜻한 차 한 잔을 마시며 책을 읽는 시간은 저에게 가장 귀한 여유입니다.' },
];

const FAMILY = [
  { name: 'CHO YUMIN', role: 'First Daughter / Year 6', bio: '머레이스 베이 초등학교의 든든한 첫째. 그림 그리는 것을 좋아하고 뉴질랜드의 드넓은 자연에서 새로운 영감을 찾고 있습니다.', image: 'https://picsum.photos/seed/yumin/400/500' },
  { name: 'CHO YUHYEON', role: 'Second Daughter / Year 5', bio: '호기심 많은 둘째. 학교 축구팀에서 활약하며 뉴질랜드 친구들과 금방 가까워진 사교성 만점의 소녀입니다.', image: 'https://picsum.photos/seed/yuhyeon/400/500' },
  { name: 'CHO YUJIN', role: 'Third Daughter / Year 1 (Soon)', bio: '우리 집의 귀염둥이 막내. 내년 머레이스 베이 입학을 기다리며 매일 언니들의 가방을 탐내는 야심가입니다.', image: 'https://picsum.photos/seed/yujin/400/500' },
];

const CATS = ['All', 'Daily', 'School', 'Kids', 'Travel', 'Food'];

/* ══════════════════════════════════════════════
   GLOBAL STYLES
   ══════════════════════════════════════════════ */

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&display=swap');

    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

    .vertical-text { writing-mode: vertical-rl; text-orientation: mixed; }

    .vivid-hover {
      filter: saturate(1.2) contrast(1.05);
      transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .group:hover .vivid-hover {
      filter: saturate(2.2) contrast(1.1) brightness(1.05);
    }

    .magazine-item {
      transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      height: 100%;
      position: relative;
      flex-shrink: 0;
      overflow: hidden;
    }

    .fade-in { animation: fadeIn 0.8s ease-out both; }
    .slide-up { animation: slideUp 0.7s ease-out both; }
    .slide-right { animation: slideRight 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
    .zoom-in { animation: zoomIn 0.5s ease-out both; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideRight { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
    @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

    .stagger-1 { animation-delay: 0.1s; }
    .stagger-2 { animation-delay: 0.2s; }
    .stagger-3 { animation-delay: 0.3s; }
    .stagger-4 { animation-delay: 0.4s; }

    * { font-family: 'Noto Sans KR', sans-serif; }
    .font-display { font-family: 'Playfair Display', serif; }
  `}</style>
);

/* ══════════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════════ */

const Navigation = ({ page, navigateTo, mobileOpen, setMobileOpen }) => (
  <nav style={{
    position: 'fixed', top: 0, width: '100%', zIndex: 100,
    background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
    borderBottom: '1px solid #f1f5f9', padding: '16px 24px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    boxSizing: 'border-box'
  }}>
    <div style={{ cursor: 'pointer' }} onClick={() => navigateTo('landing')}>
      <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: -1, fontStyle: 'italic', lineHeight: 1, margin: 0 }}>MY MAIRANGI</h1>
      <span style={{ fontSize: 8, fontWeight: 700, color: '#cbd5e1', letterSpacing: 4, textTransform: 'uppercase', marginTop: 4, display: 'block' }}>Family Archive</span>
    </div>

    {/* Desktop */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 40 }} className="desktop-nav">
      {[['landing', 'Home'], ['about', 'About'], ['magazine_shelf', 'Magazine'], ['blog', 'Blog']].map(([key, label]) => (
        <button key={key} onClick={() => navigateTo(key)} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
          fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
          color: page === key || (key === 'magazine_shelf' && page.includes('magazine')) ? '#1a1a1a' : '#94a3b8',
          borderBottom: page === key || (key === 'magazine_shelf' && page.includes('magazine')) ? '2px solid #1a1a1a' : '2px solid transparent',
          transition: 'all 0.3s'
        }}>{label}</button>
      ))}
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="desktop-nav" style={{ display: 'flex', gap: 12 }}>
        {[Instagram, Mail].map((Icon, i) => (
          <button key={i} style={{
            padding: 10, background: '#f8fafc', borderRadius: '50%', border: '1px solid #f1f5f9',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s'
          }}><Icon size={16} /></button>
        ))}
      </div>
      <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-toggle" style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'none'
      }}>
        {mobileOpen ? <X size={28} /> : <Menu size={28} />}
      </button>
    </div>

    {/* Mobile overlay */}
    {mobileOpen && (
      <div className="fade-in" style={{
        position: 'fixed', inset: 0, background: 'white', zIndex: 105,
        display: 'flex', flexDirection: 'column', paddingTop: 96
      }}>
        <div style={{ padding: 48, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[['landing', 'Home'], ['about', 'About'], ['magazine_shelf', 'Magazine'], ['blog', 'Blog']].map(([key, label]) => (
            <button key={key} onClick={() => navigateTo(key)} style={{
              background: 'none', border: 'none', borderBottom: '1px solid #f8fafc',
              paddingBottom: 24, fontSize: 36, fontWeight: 900, textTransform: 'uppercase',
              textAlign: 'left', letterSpacing: -2, cursor: 'pointer',
              transition: 'color 0.3s'
            }}>{label}</button>
          ))}
          <div style={{ marginTop: 40, display: 'flex', gap: 32 }}>
            <Instagram size={36} /><Mail size={36} />
          </div>
        </div>
      </div>
    )}

    <style>{`
      @media (max-width: 768px) {
        .desktop-nav { display: none !important; }
        .mobile-toggle { display: flex !important; }
      }
    `}</style>
  </nav>
);

/* ══════════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════════ */

const Footer = ({ navigateTo }) => (
  <footer style={{ background: '#000', color: '#fff', padding: '96px 40px', width: '100%', boxSizing: 'border-box' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 80, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 80 }}>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 900, fontStyle: 'italic', letterSpacing: -2, marginBottom: 24 }}>MY MAIRANGI</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, fontSize: 14, maxWidth: 280 }}>뉴질랜드 오클랜드 노스쇼어에서의 특별한 나날들. 가족의 기록이 곧 예술이 되는 공간입니다.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Explore</span>
        {[['landing', 'Home'], ['about', 'About Family'], ['magazine_shelf', 'Magazine'], ['blog', 'Blog Library']].map(([k, l]) => (
          <button key={k} onClick={() => navigateTo(k)} style={{
            background: 'none', border: 'none', color: 'white', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', textAlign: 'left', padding: 0, transition: 'color 0.3s'
          }}>{l}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Contact</span>
        <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Mairangi Bay, Auckland</p>
        <p style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>sangmok.jo@email.com</p>
      </div>
    </div>
    <div style={{ paddingTop: 40, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: 3, textTransform: 'uppercase', gap: 16 }}>
      <p style={{ margin: 0 }}>© 2026 MY MAIRANGI STUDIO. ALL RIGHTS RESERVED.</p>
      <p style={{ margin: 0 }}>AUCKLAND LIFE ARCHIVE</p>
    </div>
  </footer>
);

/* ══════════════════════════════════════════════
   DETAIL MODAL
   ══════════════════════════════════════════════ */

const DetailModal = ({ item, onClose }) => {
  const [aiInsight, setAiInsight] = useState('');
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    setAiInsight('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: `다음 글에 대해 감성적이고 시적인 2문장 감상평을 한국어로 써주세요. 톤: 트렌디하고 감성적이면서 지적인. 제목: ${item.title}, 내용: ${item.content}` }],
        }),
      });
      const data = await res.json();
      const txt = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || '사유의 깊이를 더하고 있습니다...';
      setAiInsight(txt);
    } catch { setAiInsight('이 글은 일상의 작은 순간들이 어떻게 영원한 기억이 되는지를 섬세하게 보여줍니다. 마이랑이의 햇살처럼, 따뜻한 문장들이 마음 깊은 곳을 비춥니다.'); }
    finally { setLoading(false); }
  };

  if (!item) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <div className="fade-in" onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(40px)'
      }} />
      <div className="slide-right" style={{
        position: 'relative', width: '100%', maxWidth: 900, background: 'white', height: '100%',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.08)', overflowY: 'auto', borderLeft: '1px solid #f1f5f9'
      }}>
        <div style={{ padding: '96px 32px' }} className="modal-inner-pad">
          <button onClick={onClose} style={{
            marginBottom: 80, padding: '16px 20px', background: '#f8fafc', border: 'none', borderRadius: 999,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontWeight: 900,
            fontSize: 10, letterSpacing: 3, transition: 'all 0.3s'
          }}><X size={20} /> CLOSE</button>

          <article>
            <header style={{ marginBottom: 80 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 40 }}>
                <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 5, color: '#cbd5e1', textTransform: 'uppercase' }}>{item.category || 'Magazine'} / {item.date}</span>
                <button onClick={generateInsight} disabled={loading} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
                  background: '#eef2ff', color: '#4f46e5', borderRadius: 999, border: 'none',
                  fontSize: 11, fontWeight: 900, letterSpacing: -0.5, cursor: 'pointer',
                  opacity: loading ? 0.5 : 1, transition: 'all 0.3s'
                }}>
                  {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
                  {loading ? 'ANALYZING...' : 'AI INSIGHT'}
                </button>
              </div>

              <h2 className="font-display" style={{
                fontSize: 'clamp(40px, 8vw, 120px)', fontWeight: 900, letterSpacing: -3,
                lineHeight: 0.8, textTransform: 'uppercase', marginBottom: 60, wordBreak: 'break-all'
              }}>{item.title}</h2>

              {aiInsight && (
                <div className="zoom-in" style={{
                  marginBottom: 60, padding: '32px 40px', background: 'rgba(238,242,255,0.4)',
                  borderRadius: 32, border: '1px solid rgba(79,70,229,0.1)'
                }}>
                  <span style={{ fontSize: 10, fontWeight: 900, color: '#a5b4fc', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>AI Reflection</span>
                  <p className="font-display" style={{ fontSize: 'clamp(18px, 3vw, 32px)', fontStyle: 'italic', color: '#312e81', lineHeight: 1.4, margin: 0 }}>"{aiInsight}"</p>
                </div>
              )}

              <p style={{
                fontSize: 'clamp(18px, 3vw, 40px)', color: '#1a1a1a', fontWeight: 500, lineHeight: 1.5,
              }}><span style={{ fontSize: 'clamp(48px, 8vw, 140px)', fontWeight: 900, float: 'left', marginRight: 16, lineHeight: 0.8, color: '#f1f5f9' }}>{item.content.charAt(0)}</span>{item.content.slice(1)}</p>
            </header>

            <div style={{ aspectRatio: '21/9', borderRadius: 32, overflow: 'hidden', marginBottom: 80, boxShadow: '0 25px 60px rgba(0,0,0,0.12)' }}>
              <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={item.title} />
            </div>

            <footer style={{
              display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
              borderTop: '1px solid #f1f5f9', paddingTop: 60, paddingBottom: 40, gap: 32
            }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <button style={{
                  padding: '20px 48px', background: '#000', color: '#fff', border: 'none',
                  borderRadius: 999, fontSize: 12, fontWeight: 900, letterSpacing: 3,
                  textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  transition: 'transform 0.3s'
                }}>Like this Archive</button>
                <button style={{
                  padding: 20, border: '1px solid #e2e8f0', borderRadius: '50%', background: 'white',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}><Share2 size={20} /></button>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8, display: 'block', fontStyle: 'italic' }}>Written By</span>
                <p style={{ fontSize: 'clamp(20px, 3vw, 36px)', fontWeight: 900, margin: 0 }}>{item.author || 'Family'}</p>
              </div>
            </footer>
          </article>
        </div>
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (min-width: 769px) { .modal-inner-pad { padding: 96px 96px !important; } }
      `}</style>
    </div>
  );
};

/* ══════════════════════════════════════════════
   CMS MANAGER MODAL
   ══════════════════════════════════════════════ */

const CmsModal = ({ onClose, onAddBlog, onAddMag, categories }) => {
  const [blogTitle, setBlogTitle] = useState('');
  const [blogCat, setBlogCat] = useState('Daily');
  const [blogImg, setBlogImg] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [magTitle, setMagTitle] = useState('');
  const [magYear, setMagYear] = useState('2026');
  const [magMonth, setMagMonth] = useState('');
  const [magEditor, setMagEditor] = useState('');
  const [magImg, setMagImg] = useState('');

  const inputStyle = {
    padding: 16, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 16,
    outline: 'none', fontWeight: 700, fontSize: 14, width: '100%', boxSizing: 'border-box'
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="zoom-in" style={{ background: 'white', width: '100%', maxWidth: 560, borderRadius: 32, boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ padding: '32px 40px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(248,250,252,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ padding: 12, background: '#000', color: '#fff', borderRadius: 16, display: 'flex' }}><Settings size={20} /></div>
            <h2 style={{ fontSize: 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -1, margin: 0 }}>CMS Manager</h2>
          </div>
          <button onClick={onClose} style={{ padding: 12, border: '1px solid #f1f5f9', borderRadius: '50%', background: 'white', cursor: 'pointer', display: 'flex' }}><X size={20} /></button>
        </div>

        <div className="no-scrollbar" style={{ padding: 40, overflowY: 'auto' }}>
          {/* Blog */}
          <section style={{ marginBottom: 48 }}>
            <h3 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 3, marginBottom: 20 }}>Create Blog Story</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Story Title" value={blogTitle} onChange={e => setBlogTitle(e.target.value)} style={inputStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <select value={blogCat} onChange={e => setBlogCat(e.target.value)} style={{ ...inputStyle, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' }}>
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Image URL" value={blogImg} onChange={e => setBlogImg(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
              </div>
              <textarea placeholder="Write your story..." rows={3} value={blogContent} onChange={e => setBlogContent(e.target.value)} style={{ ...inputStyle, resize: 'vertical', fontWeight: 500, color: '#64748b' }} />
              <button onClick={() => {
                if (!blogTitle.trim()) return;
                onAddBlog({ id: Date.now(), title: blogTitle, category: blogCat, image: blogImg || 'https://picsum.photos/seed/new/800/800', content: blogContent, author: 'Heejong Jo', date: '2026.03.08' });
                onClose();
              }} style={{ padding: 18, background: '#000', color: '#fff', border: 'none', borderRadius: 999, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3, fontSize: 11, cursor: 'pointer', transition: 'transform 0.2s' }}>
                Publish to Library
              </button>
            </div>
          </section>

          {/* Magazine */}
          <section>
            <h3 style={{ fontWeight: 900, textTransform: 'uppercase', fontSize: 12, letterSpacing: 3, marginBottom: 20 }}>Create Magazine Issue</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Magazine Title" value={magTitle} onChange={e => setMagTitle(e.target.value)} style={inputStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <input placeholder="2026" value={magYear} onChange={e => setMagYear(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
                <input placeholder="Apr" value={magMonth} onChange={e => setMagMonth(e.target.value)} style={{ ...inputStyle, textAlign: 'center' }} />
                <input placeholder="Editor" value={magEditor} onChange={e => setMagEditor(e.target.value)} style={inputStyle} />
              </div>
              <input placeholder="Cover Image URL" value={magImg} onChange={e => setMagImg(e.target.value)} style={{ ...inputStyle, fontSize: 12 }} />
              <button onClick={() => {
                if (!magTitle.trim()) return;
                onAddMag({ id: `${magYear}-new-${Date.now()}`, title: magTitle, year: magYear, monthName: magMonth, editor: magEditor, image: magImg || 'https://picsum.photos/seed/mag/800/800' });
                onClose();
              }} style={{ padding: 18, background: '#f8fafc', color: '#000', border: '1px solid #e2e8f0', borderRadius: 999, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3, fontSize: 11, cursor: 'pointer' }}>
                Add to Shelf
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   PAGES
   ══════════════════════════════════════════════ */

// --- LANDING ---
const LandingPage = ({ blogs, navigateTo, setSelectedItem }) => {
  const [idx, setIdx] = useState(0);
  const hero = blogs.slice(0, 5);

  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % hero.length), 6000);
    return () => clearInterval(t);
  }, [hero.length]);

  return (
    <div className="fade-in">
      {/* Hero Carousel */}
      <section style={{ position: 'relative', height: '85vh', width: '100%', overflow: 'hidden', background: '#f1f5f9' }}>
        {hero.map((item, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0, transition: 'opacity 1s ease',
            opacity: i === idx ? 1 : 0, zIndex: i === idx ? 10 : 0
          }}>
            <img src={item.image} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.5)' }} alt="" />
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8%'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(10px, 1.5vw, 14px)', fontWeight: 900, letterSpacing: 8, marginBottom: 24, textTransform: 'uppercase' }}>Featured Story</span>
              <h2 className="font-display" style={{
                fontSize: 'clamp(40px, 10vw, 160px)', fontWeight: 900, letterSpacing: -4,
                lineHeight: 0.8, textTransform: 'uppercase', maxWidth: 900, marginBottom: 48, color: 'white'
              }}>{item.title}</h2>
              <button onClick={() => setSelectedItem(item)} style={{
                display: 'flex', alignItems: 'center', gap: 16, background: 'none', border: 'none',
                color: 'white', fontSize: 'clamp(10px, 1.2vw, 12px)', fontWeight: 900, letterSpacing: 3,
                textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.3)',
                paddingBottom: 8, width: 'fit-content', cursor: 'pointer', transition: 'border-color 0.3s'
              }}>Discover More <ArrowRight size={18} /></button>
            </div>
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: 48, left: '8%', zIndex: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {['prev', 'next'].map(d => (
              <button key={d} onClick={() => setIdx(p => d === 'next' ? (p + 1) % hero.length : (p - 1 + hero.length) % hero.length)} style={{
                padding: 12, border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%',
                background: 'none', color: 'white', cursor: 'pointer', display: 'flex',
                transition: 'all 0.3s'
              }}>{d === 'prev' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {hero.map((_, i) => <div key={i} style={{ height: 4, width: i === idx ? 48 : 32, borderRadius: 4, background: i === idx ? 'white' : 'rgba(255,255,255,0.2)', transition: 'all 0.4s' }} />)}
          </div>
        </div>
      </section>

      {/* Intro Section */}
      <section style={{ padding: 'clamp(40px, 8vw, 128px) clamp(24px, 4vw, 40px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(400px, 100%), 1fr))', gap: 80, alignItems: 'center' }}>
        <div style={{ aspectRatio: '4/5', borderRadius: 40, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.12)', position: 'relative' }} className="group">
          <img src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000" className="vivid-hover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', padding: 48, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <h3 className="font-display" style={{ color: 'white', fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: -2, fontStyle: 'italic', marginBottom: 16 }}>Start to Glow</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, lineHeight: 1.6, maxWidth: 360 }}>뉴질랜드의 햇살 아래, 우리 가족의 두 번째 챕터가 시작됩니다.</p>
          </div>
        </div>
        <div>
          <h2 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, letterSpacing: -3, textTransform: 'uppercase', lineHeight: 0.85, marginBottom: 48 }}>
            MAIRANGI <br /><span className="font-display" style={{ fontStyle: 'italic', fontWeight: 300, color: '#cbd5e1', textDecoration: 'underline', textDecorationColor: '#c7d2fe' }}>JOURNAL</span>
          </h2>
          <p style={{ fontSize: 'clamp(18px, 2vw, 24px)', color: '#64748b', fontWeight: 500, lineHeight: 1.6, marginBottom: 48 }}>세 딸과 함께하는 오클랜드 노스쇼어 라이프. 매일 마주하는 바다와 학교, 그리고 따뜻한 식탁의 기록을 나눕니다.</p>
          <button onClick={() => navigateTo('about')} style={{
            padding: 32, border: '1px solid #f1f5f9', borderRadius: 24, display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', width: '100%', cursor: 'pointer',
            background: 'white', transition: 'background 0.3s', textAlign: 'left', boxSizing: 'border-box'
          }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', color: '#cbd5e1', display: 'block', marginBottom: 8 }}>Our Story</span>
              <span style={{ fontSize: 'clamp(18px, 2vw, 24px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: -1 }}>About Mairangi Family</span>
            </div>
            <ArrowRight size={24} style={{ color: '#cbd5e1' }} />
          </button>
        </div>
      </section>
    </div>
  );
};

// --- ABOUT ---
const AboutPage = () => (
  <div className="fade-in">
    <section style={{ padding: 'clamp(60px, 10vw, 128px) clamp(24px, 4vw, 40px)', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 80, alignItems: 'center' }}>
        <div className="slide-up">
          <span style={{ color: '#4f46e5', fontSize: 12, fontWeight: 900, letterSpacing: 6, textTransform: 'uppercase', display: 'block', marginBottom: 32 }}>Vision & Values</span>
          <h2 style={{ fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: 900, letterSpacing: -3, lineHeight: 0.85, textTransform: 'uppercase', marginBottom: 40 }}>START <br /> TO GLOW</h2>
          <p style={{ fontSize: 'clamp(18px, 2vw, 24px)', color: '#475569', fontWeight: 500, lineHeight: 1.6 }}>기자 출신의 아빠와 석사 과정을 밟고 있는 엄마, 그리고 세 명의 딸이 함께 일구는 뉴질랜드 삶의 기록입니다.</p>
        </div>
        <div className="slide-up stagger-2" style={{ aspectRatio: '3/4', borderRadius: 48, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.12)' }}>
          <img src="https://picsum.photos/seed/about/800/1200" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Family" />
        </div>
      </div>
    </section>

    <section style={{ padding: 'clamp(60px, 10vw, 160px) clamp(24px, 4vw, 40px)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'clamp(48px, 8vw, 128px)' }}>
        <h2 style={{ fontSize: 14, fontWeight: 900, color: '#cbd5e1', letterSpacing: 6, textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 16 }}>The Members</h2>
        <p style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900, letterSpacing: -2, textTransform: 'uppercase', lineHeight: 1 }}>
          THE THREE <span className="font-display" style={{ fontStyle: 'italic', fontWeight: 300, color: '#94a3b8' }}>DAUGHTERS</span>
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 64, maxWidth: 1200, margin: '0 auto' }}>
        {FAMILY.map((m, i) => (
          <div key={i} className={`slide-up stagger-${i + 1}`} style={{ textAlign: 'center' }}>
            <div className="group" style={{
              aspectRatio: '4/5', borderRadius: 40, overflow: 'hidden', marginBottom: 40,
              boxShadow: '0 15px 40px rgba(0,0,0,0.08)', transition: 'all 0.7s',
              cursor: 'pointer'
            }}>
              <img src={m.image} style={{
                width: '100%', height: '100%', objectFit: 'cover',
                filter: 'grayscale(100%)', transition: 'all 1s'
              }} className="vivid-hover" alt={m.name}
                onMouseEnter={e => e.target.style.filter = 'grayscale(0%)'}
                onMouseLeave={e => e.target.style.filter = 'grayscale(100%)'}
              />
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, textTransform: 'uppercase', marginBottom: 8 }}>{m.name}</h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', letterSpacing: 3, textTransform: 'uppercase', display: 'block', marginBottom: 24 }}>{m.role}</span>
            <p style={{ color: '#64748b', fontWeight: 500, lineHeight: 1.7, padding: '0 16px' }}>{m.bio}</p>
          </div>
        ))}
      </div>
    </section>
  </div>
);

// --- MAGAZINE SHELF ---
const MagazineShelf = ({ magazines, navigateTo }) => {
  const scrollRef = useRef(null);
  const [hovered, setHovered] = useState(0);

  const handleWheel = useCallback((e) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) { el.addEventListener('wheel', handleWheel, { passive: false }); }
    return () => { if (el) el.removeEventListener('wheel', handleWheel); };
  }, [handleWheel]);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '85vh' }}>
      <div style={{ padding: '40px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <h2 style={{ fontSize: 14, fontWeight: 900, letterSpacing: 5, color: '#cbd5e1', textTransform: 'uppercase', fontStyle: 'italic', margin: 0 }}>Magazine Shelf</h2>
        <div style={{ display: 'flex', fontSize: 10, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: 3, alignItems: 'center', gap: 8 }}>
          <MousePointer2 size={12} /> Scroll to explore
        </div>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div ref={scrollRef} className="no-scrollbar" style={{
          display: 'flex', alignItems: 'center', gap: 0, padding: '0 8vw',
          overflowX: 'auto', scrollBehavior: 'smooth', height: '60vh', width: '100%'
        }}>
          {magazines.map((item, index) => {
            const isActive = hovered === index;
            return (
              <div
                key={item.id}
                className="magazine-item"
                onMouseEnter={() => setHovered(index)}
                onClick={() => navigateTo('magazine_issue', item)}
                style={{
                  width: isActive ? 'clamp(300px, 40vw, 520px)' : 'clamp(80px, 8vw, 120px)',
                  cursor: 'pointer', borderRight: '1px solid rgba(241,245,249,0.3)',
                  background: '#1a1a1a'
                }}
              >
                {/* BG Image */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                  <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: isActive ? 'saturate(1.8) contrast(1.05)' : 'saturate(1.2)', transition: 'filter 0.6s' }} />
                  <div style={{ position: 'absolute', inset: 0, background: isActive ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.6)', transition: 'all 0.7s' }} />
                </div>

                {/* Content */}
                <div style={{ position: 'relative', zIndex: 10, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  {/* Spine */}
                  <div style={{
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center',
                    height: '100%', padding: '64px 0', position: 'absolute', inset: 0,
                    opacity: isActive ? 0 : 1, transform: isActive ? 'scale(0.9)' : 'scale(1)',
                    transition: 'all 0.5s', pointerEvents: isActive ? 'none' : 'auto'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.9)', letterSpacing: 3 }}>{item.year}</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: 'white', textTransform: 'uppercase', background: '#4f46e5', padding: '2px 8px', borderRadius: 2 }}>{item.monthName}</span>
                    </div>
                    <h3 className="vertical-text" style={{ fontSize: 'clamp(18px, 2.5vw, 28px)', fontWeight: 900, letterSpacing: -1, textTransform: 'uppercase', color: 'white', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>{item.title}</h3>
                    <div style={{ width: 1, height: 48, background: 'rgba(255,255,255,0.4)' }} />
                  </div>

                  {/* Cover */}
                  <div style={{
                    width: '100%', padding: 'clamp(24px, 4vw, 64px)', display: 'flex', flexDirection: 'column',
                    justifyContent: 'flex-end', height: '100%',
                    opacity: isActive ? 1 : 0, transform: isActive ? 'translateY(0)' : 'translateY(32px)',
                    transition: 'all 0.7s 0.15s', pointerEvents: isActive ? 'auto' : 'none'
                  }}>
                    <div style={{ maxWidth: 400 }}>
                      <span style={{
                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)',
                        padding: '6px 16px', borderRadius: 999, fontSize: 10, fontWeight: 900,
                        color: 'white', letterSpacing: 3, textTransform: 'uppercase',
                        marginBottom: 16, display: 'inline-block'
                      }}>ISSUE {item.year} {item.monthName}</span>
                      <h3 style={{
                        fontSize: 'clamp(32px, 5vw, 72px)', fontWeight: 900, color: 'white',
                        lineHeight: 0.8, textTransform: 'uppercase', marginBottom: 40,
                        letterSpacing: -2, textShadow: '0 4px 30px rgba(0,0,0,0.4)'
                      }}>{item.title}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 24 }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: 'white', letterSpacing: 5, textTransform: 'uppercase' }}>Open Edition</span>
                        <div style={{ padding: 12, background: 'white', borderRadius: '50%', color: '#000', display: 'flex' }}><ArrowRight size={20} /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ flexShrink: 0, width: '8vw', height: 1 }} />
        </div>
      </div>
    </div>
  );
};

// --- MAGAZINE ISSUE ---
const MagazineIssue = ({ month, articles, navigateTo, setSelectedItem }) => {
  const filtered = articles.filter(a => a.monthId === month.id);
  return (
    <div className="fade-in" style={{ padding: 'clamp(40px, 6vw, 80px) clamp(24px, 4vw, 40px)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ marginBottom: 96 }}>
        <button onClick={() => navigateTo('magazine_shelf')} style={{
          display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 10, fontWeight: 900,
          letterSpacing: 3, textTransform: 'uppercase', marginBottom: 32, background: 'none', border: 'none',
          cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 8
        }}><ChevronLeft size={16} /> Back to Shelf</button>
        <p style={{ fontSize: 14, fontWeight: 900, letterSpacing: 5, color: '#cbd5e1', textTransform: 'uppercase', fontStyle: 'italic', marginBottom: 16 }}>Edition {month.year} {month.monthName}</p>
        <h2 style={{ fontSize: 'clamp(48px, 8vw, 112px)', fontWeight: 900, letterSpacing: -3, lineHeight: 0.85, textTransform: 'uppercase', marginBottom: 40, wordBreak: 'break-all' }}>{month.title}</h2>
        <div style={{ padding: 40, background: '#f8fafc', borderRadius: 32, border: '1px solid #f1f5f9', display: 'inline-block' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: 3, display: 'block', fontStyle: 'italic', marginBottom: 8 }}>Featured Editor</span>
          <p style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>{month.editor}</p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 48, marginBottom: 128 }}>
        {filtered.map((a, i) => (
          <div key={a.id} className={`slide-up stagger-${Math.min(i + 1, 4)} group`} onClick={() => setSelectedItem(a)} style={{ cursor: 'pointer' }}>
            <div style={{ aspectRatio: '3/4', overflow: 'hidden', borderRadius: 32, marginBottom: 32, boxShadow: '0 15px 40px rgba(0,0,0,0.08)', position: 'relative', transition: 'all 0.5s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-16px)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.08)'; }}
            >
              <img src={a.image} className="vivid-hover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', transition: 'background 0.3s' }}
                onMouseEnter={e => e.target.style.background = 'transparent'}
                onMouseLeave={e => e.target.style.background = 'rgba(0,0,0,0.2)'}
              />
            </div>
            <div style={{ padding: '0 16px' }}>
              <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, color: '#818cf8', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>{a.date} — {a.author}</span>
              <h3 style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, textTransform: 'uppercase', lineHeight: 1, transition: 'transform 0.3s' }}>{a.title}</h3>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 80, color: '#cbd5e1' }}>
            <p style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Coming Soon</p>
            <p style={{ fontSize: 14, fontWeight: 500 }}>이 호에는 아직 글이 없습니다. CMS에서 추가해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- BLOG ---
const BlogPage = ({ blogs, activeCategory, setActiveCategory, setSelectedItem }) => {
  const filtered = activeCategory === 'All' ? blogs : blogs.filter(b => b.category === activeCategory);
  return (
    <div className="fade-in" style={{ padding: 'clamp(20px, 4vw, 40px) clamp(24px, 4vw, 40px)', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 96, gap: 48 }}>
        <div style={{ maxWidth: 500 }}>
          <h2 className="font-display" style={{ fontSize: 'clamp(56px, 8vw, 112px)', fontWeight: 900, letterSpacing: -3, textTransform: 'uppercase', lineHeight: 0.85, marginBottom: 32, fontStyle: 'italic' }}>The <br />Library</h2>
          <p style={{ fontSize: 'clamp(16px, 2vw, 24px)', color: '#94a3b8', fontWeight: 500 }}>사회복지사 석사 과정과 일상을 기록하는 희종의 개인 서재입니다.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 6, background: '#f8fafc', borderRadius: 24, border: '1px solid #f1f5f9' }}>
          {CATS.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{
              padding: '12px 24px', borderRadius: 16, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase',
              background: activeCategory === cat ? '#000' : 'transparent',
              color: activeCategory === cat ? '#fff' : '#94a3b8',
              boxShadow: activeCategory === cat ? '0 10px 30px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.3s'
            }}>{cat}</button>
          ))}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 40 }}>
        {filtered.map((b, i) => (
          <div key={b.id} className={`slide-up stagger-${Math.min(i + 1, 4)}`} onClick={() => setSelectedItem(b)} style={{
            position: 'relative', aspectRatio: '1', overflow: 'hidden', borderRadius: 40,
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)', cursor: 'pointer',
            transition: 'all 0.7s'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-16px)'; e.currentTarget.style.boxShadow = '0 30px 60px rgba(0,0,0,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'; }}
          >
            <img src={b.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
              transition: 'all 0.7s'
            }} />
            <div style={{ position: 'absolute', inset: 0, padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: 5, textTransform: 'uppercase' }}>{b.date}</span>
                <span style={{ fontSize: 9, fontWeight: 900, color: '#818cf8', letterSpacing: 5, textTransform: 'uppercase' }}>{b.category}</span>
              </div>
              <h3 style={{ fontSize: 'clamp(24px, 3vw, 44px)', fontWeight: 900, color: 'white', letterSpacing: -1, textTransform: 'uppercase', lineHeight: 0.9 }}>{b.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════ */

export default function App() {
  const [page, setPage] = useState('landing');
  const [magazines, setMagazines] = useState(INIT_MAGAZINES);
  const [blogs, setBlogs] = useState(INIT_BLOGS);
  const [articles] = useState(INIT_ARTICLES);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCms, setShowCms] = useState(false);

  const navigateTo = (p, data = null) => {
    setPage(p);
    if (data) setSelectedMonth(data);
    setSelectedItem(null);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'white', color: '#1A1A1A', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      <GlobalStyles />
      <Navigation page={page} navigateTo={navigateTo} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <main style={{ paddingTop: 72, flexGrow: 1 }}>
        {page === 'landing' && <LandingPage blogs={blogs} navigateTo={navigateTo} setSelectedItem={setSelectedItem} />}
        {page === 'about' && <AboutPage />}
        {page === 'magazine_shelf' && <MagazineShelf magazines={magazines} navigateTo={navigateTo} />}
        {page === 'magazine_issue' && selectedMonth && <MagazineIssue month={selectedMonth} articles={articles} navigateTo={navigateTo} setSelectedItem={setSelectedItem} />}
        {page === 'blog' && <BlogPage blogs={blogs} activeCategory={activeCategory} setActiveCategory={setActiveCategory} setSelectedItem={setSelectedItem} />}
      </main>

      <Footer navigateTo={navigateTo} />

      {/* Detail Modal */}
      {selectedItem && <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}

      {/* CMS Modal */}
      {showCms && (
        <CmsModal
          onClose={() => setShowCms(false)}
          onAddBlog={(b) => setBlogs(prev => [b, ...prev])}
          onAddMag={(m) => setMagazines(prev => [m, ...prev])}
          categories={CATS}
        />
      )}

      {/* Floating CMS Button */}
      <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 250 }}>
        <button onClick={() => setShowCms(true)} style={{
          padding: 20, background: '#000', color: '#fff', borderRadius: '50%', border: 'none',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)', cursor: 'pointer',
          transition: 'transform 0.3s', display: 'flex'
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        ><Settings size={24} /></button>
      </div>
    </div>
  );
}
