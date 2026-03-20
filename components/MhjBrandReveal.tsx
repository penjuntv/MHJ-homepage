'use client';

import { useEffect, useRef, useState } from 'react';

export default function MhjBrandReveal() {
  const [expanded, setExpanded] = useState(false);
  const [scrollTriggered, setScrollTriggered] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouchDevice = window.matchMedia('(hover: none)').matches;
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setExpanded(true);
          if (isTouchDevice) setScrollTriggered(true);
        }
      },
      { threshold: 0.7 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseEnter = () => {
    setExpanded(true);
  };

  const handleMouseLeave = () => {
    if (!scrollTriggered) setExpanded(false);
  };

  return (
    <>
      <style>{`
        .mhj-reveal-wrap {
          position: relative;
          text-align: center;
          padding: clamp(48px, 6vw, 80px) clamp(20px, 4vw, 48px);
          overflow: hidden;
          cursor: default;
        }
        .mhj-reveal-spotlight {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(79,70,229,0.06) 0%, transparent 70%);
          pointer-events: none;
          width: 0;
          height: 0;
          transition: width 1.4s cubic-bezier(0.16,1,0.3,1) 0.2s,
                      height 1.4s cubic-bezier(0.16,1,0.3,1) 0.2s;
        }
        .mhj-reveal-wrap.open .mhj-reveal-spotlight {
          width: 500px;
          height: 500px;
        }
        .mhj-reveal-core {
          display: flex;
          align-items: baseline;
          justify-content: center;
          position: relative;
          z-index: 1;
          line-height: 1;
        }
        .mhj-bl {
          font-family: 'Playfair Display', serif;
          font-weight: 900;
          font-style: italic;
          font-size: 80px;
          color: var(--text);
          line-height: 1;
          display: inline-block;
          transition: font-size 1s cubic-bezier(0.16,1,0.3,1);
        }
        .mhj-reveal-wrap.open .mhj-bl {
          font-size: 64px;
        }
        .mhj-tl {
          font-family: 'Playfair Display', serif;
          font-weight: 300;
          font-style: italic;
          font-size: 48px;
          color: var(--text-secondary);
          line-height: 1;
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          white-space: nowrap;
          display: inline-block;
          vertical-align: baseline;
          transition: max-width 1s cubic-bezier(0.16,1,0.3,1) 0.35s,
                      opacity 0.6s ease 0.4s;
        }
        .mhj-reveal-wrap.open .mhj-tl {
          max-width: 80px;
          opacity: 1;
        }
        .mhj-cm {
          font-family: 'Playfair Display', serif;
          font-weight: 400;
          font-style: italic;
          font-size: 40px;
          color: var(--text-tertiary);
          line-height: 1;
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          display: inline-block;
          vertical-align: baseline;
          transition: max-width 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s,
                      opacity 0.5s ease 0.35s;
        }
        .mhj-reveal-wrap.open .mhj-cm {
          max-width: 20px;
          opacity: 1;
        }
        .mhj-ap {
          font-family: 'Playfair Display', serif;
          font-weight: 400;
          font-style: italic;
          font-size: 48px;
          color: var(--text-tertiary);
          line-height: 1;
          max-width: 0;
          opacity: 0;
          overflow: hidden;
          display: inline-block;
          vertical-align: baseline;
          transition: max-width 0.8s cubic-bezier(0.16,1,0.3,1) 0.5s,
                      opacity 0.5s ease 0.55s;
        }
        .mhj-reveal-wrap.open .mhj-ap {
          max-width: 30px;
          opacity: 1;
        }
        .mhj-sp {
          display: inline-block;
          width: 0;
          transition: width 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s;
        }
        .mhj-reveal-wrap.open .mhj-sp {
          width: 10px;
        }
        .mhj-sub-box {
          position: relative;
          height: 32px;
          margin-top: 18px;
          z-index: 1;
        }
        .mhj-sub-a {
          position: absolute;
          inset: 0;
          font-family: 'Noto Sans KR', sans-serif;
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 5px;
          text-transform: uppercase;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.5s ease, transform 0.5s ease;
          opacity: 1;
          transform: translateY(0);
        }
        .mhj-reveal-wrap.open .mhj-sub-a {
          opacity: 0;
          transform: translateY(-10px);
        }
        .mhj-sub-b {
          position: absolute;
          inset: 0;
          font-family: 'Playfair Display', serif;
          font-weight: 300;
          font-style: italic;
          font-size: 20px;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: translateY(8px);
          transition: opacity 0.5s ease 0.5s, transform 0.5s ease 0.5s;
        }
        .mhj-reveal-wrap.open .mhj-sub-b {
          opacity: 1;
          transform: translateY(0);
        }
        .mhj-line-d {
          width: 0;
          height: 1px;
          background: var(--border-medium);
          margin: 24px auto;
          transition: width 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s;
          position: relative;
          z-index: 1;
        }
        .mhj-reveal-wrap.open .mhj-line-d {
          width: 56px;
        }
        .mhj-story-line {
          font-family: 'Noto Sans KR', sans-serif;
          font-weight: 500;
          font-size: 13px;
          color: var(--text-tertiary);
          line-height: 1.8;
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 0.6s ease 0.7s, transform 0.6s ease 0.7s;
          position: relative;
          z-index: 1;
        }
        .mhj-reveal-wrap.open .mhj-story-line {
          opacity: 1;
          transform: translateY(0);
        }
        .mhj-story-em {
          font-family: 'Playfair Display', serif;
          font-weight: 400;
          font-style: italic;
          color: var(--text-secondary);
        }
        @media (max-width: 640px) {
          .mhj-bl { font-size: 64px; }
          .mhj-reveal-wrap.open .mhj-bl { font-size: 52px; }
          .mhj-tl { font-size: 38px; }
          .mhj-ap { font-size: 36px; }
        }
      `}</style>

      <section
        ref={wrapRef}
        className={`mhj-reveal-wrap${expanded ? ' open' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="mhj-reveal-spotlight" />

        <div className="mhj-reveal-core">
          <span>
            <span className="mhj-bl">M</span><span className="mhj-tl">in</span><span className="mhj-cm">,</span>
          </span>
          <span className="mhj-sp" />
          <span>
            <span className="mhj-bl">H</span><span className="mhj-tl">yun</span>
          </span>
          <span className="mhj-sp" />
          <span className="mhj-ap">&amp;</span>
          <span className="mhj-sp" />
          <span>
            <span className="mhj-bl">J</span><span className="mhj-tl">in</span>
          </span>
        </div>

        <div className="mhj-sub-box">
          <p className="mhj-sub-a">A Family Journal</p>
          <p className="mhj-sub-b">three sisters, one journal</p>
        </div>

        <div className="mhj-line-d" />

        <p className="mhj-story-line">
          A story of three girls who crossed the ocean<br />
          <span className="mhj-story-em">from Seoul to Mairangi Bay</span>
        </p>
      </section>
    </>
  );
}
