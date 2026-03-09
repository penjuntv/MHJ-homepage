import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ─── 폰트 ─── */
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        body: ['"Noto Sans KR"', "sans-serif"],
      },

      /* ─── 색상 ─── */
      colors: {
        mhj: {
          bg: "#FFFFFF",
          text: "#1A1A1A",
          "text-secondary": "#64748B",
          "text-tertiary": "#CBD5E1",
          "text-muted": "#94A3B8",
          accent: "#4F46E5",
          "accent-light": "#EEF2FF",
          "accent-text": "#818CF8",
          "accent-deep": "#312E81",
          "accent-pale": "#A5B4FC",
          "accent-underline": "#C7D2FE",
          "accent-role": "#6366F1",
          surface: "#F8FAFC",
          border: "#F1F5F9",
          "border-light": "#E2E8F0",
        },
      },

      /* ─── 모서리 라운드 ─── */
      borderRadius: {
        // Tailwind 기본값 + 프로젝트 커스텀
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
        "5xl": "40px",
        "6xl": "48px",
      },

      /* ─── 그림자 ─── */
      boxShadow: {
        "mhj-sm": "0 4px 12px rgba(0,0,0,0.04)",
        "mhj-md": "0 15px 40px rgba(0,0,0,0.08)",
        "mhj-lg": "0 25px 60px rgba(0,0,0,0.12)",
        "mhj-xl": "0 30px 80px rgba(0,0,0,0.12)",
        "mhj-hover": "0 30px 60px rgba(0,0,0,0.15)",
        "mhj-button": "0 10px 30px rgba(0,0,0,0.2)",
        "mhj-float": "0 10px 40px rgba(0,0,0,0.3)",
        "mhj-modal": "-20px 0 60px rgba(0,0,0,0.08)",
        "mhj-cms": "0 25px 60px rgba(0,0,0,0.2)",
      },

      /* ─── letter-spacing ─── */
      letterSpacing: {
        "tighter-4": "-4px",
        "tighter-3": "-3px",
        "tighter-2": "-2px",
        "tighter-1": "-1px",
        "wider-3": "3px",
        "wider-4": "4px",
        "wider-5": "5px",
        "wider-6": "6px",
        "wider-8": "8px",
      },

      /* ─── 키프레임 애니메이션 ─── */
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideRight: {
          from: { opacity: "0", transform: "translateX(100%)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        zoomIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.8s ease-out both",
        "slide-up": "slideUp 0.7s ease-out both",
        "slide-right": "slideRight 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "zoom-in": "zoomIn 0.5s ease-out both",
        spin: "spin 1s linear infinite",
      },

      /* ─── 트랜지션 타이밍 ─── */
      transitionTimingFunction: {
        "mhj-smooth": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "700": "700ms",
        "800": "800ms",
        "1000": "1000ms",
      },

      /* ─── 간격 ─── */
      spacing: {
        "18": "4.5rem", // 72px (nav padding-top)
        "22": "5.5rem", // 88px
        "30": "7.5rem", // 120px
        "34": "8.5rem", // 136px
      },

      /* ─── aspect ratio ─── */
      aspectRatio: {
        "3/4": "3 / 4",
        "4/5": "4 / 5",
        "21/9": "21 / 9",
      },
    },
  },
  plugins: [],
};

export default config;
