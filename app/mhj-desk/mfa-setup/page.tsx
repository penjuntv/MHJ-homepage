'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function MfaSetupPage() {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // useMemo로 클라이언트 인스턴스 안정화 (createBrowserClient는 쿠키에 세션 저장)
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    async function enroll() {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error || !data) {
        setError('MFA 등록 중 오류가 발생했습니다.');
        setEnrolling(false);
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setEnrolling(false);
    }
    enroll();
  // supabase는 useMemo([], [])로 안정적 참조 — 마운트 1회만 실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;

    setLoading(true);
    setError('');

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      setError('인증 요청 중 오류가 발생했습니다.');
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: fullCode,
    });

    if (verifyError) {
      setError('코드가 올바르지 않습니다. 다시 시도하세요.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setLoading(false);
    } else {
      // aal2 세션이 쿠키에 기록된 후 하드 네비게이션
      window.location.href = '/mhj-desk';
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div style={{ background: 'white', borderRadius: 32, padding: 48, width: '100%', maxWidth: 480, boxShadow: '0 25px 60px rgba(0,0,0,0.08)' }}>

        <h1 className="font-display font-black uppercase" style={{ fontSize: 28, letterSpacing: -1, marginBottom: 8 }}>
          2단계 인증 설정
        </h1>
        <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 4, color: '#94A3B8', marginBottom: 36 }}>
          MFA SETUP — MY MAIRANGI CMS
        </p>

        {enrolling ? (
          <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>로딩 중...</p>
        ) : (
          <>
            {/* 안내 단계 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {[
                { step: '1', text: 'Google Authenticator 앱을 설치하세요 (iOS / Android)' },
                { step: '2', text: '앱에서 + 버튼 → QR 코드 스캔' },
                { step: '3', text: '앱에 표시된 6자리 코드를 입력하세요' },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%', background: '#000',
                    color: '#fff', fontSize: 11, fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{step}</span>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginTop: 3 }}>{text}</p>
                </div>
              ))}
            </div>

            {/* QR 코드 */}
            {qrCode && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{ background: 'white', border: '1px solid #F1F5F9', borderRadius: 16, padding: 16 }}>
                  {/* Supabase SDK가 반환하는 qr_code는 SVG 문자열 또는 data URI */}
                  {qrCode.startsWith('<svg') ? (
                    <div dangerouslySetInnerHTML={{ __html: qrCode }} style={{ width: 200, height: 200 }} />
                  ) : (
                    <img src={qrCode} alt="QR Code" width={200} height={200} />
                  )}
                </div>
              </div>
            )}

            {/* 수동 입력용 시크릿 */}
            {secret && (
              <div style={{ marginBottom: 28, textAlign: 'center' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: '#94A3B8', marginBottom: 6 }}>
                  QR 스캔이 안 되면 아래 코드를 수동 입력하세요
                </p>
                <code style={{ fontSize: 13, fontFamily: 'monospace', color: '#334155', background: '#F8FAFC', padding: '6px 12px', borderRadius: 8 }}>
                  {secret}
                </code>
              </div>
            )}

            {/* 6자리 입력 */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  style={{
                    width: 48, height: 56, borderRadius: 12,
                    border: '1.5px solid #E2E8F0',
                    textAlign: 'center', fontSize: 22, fontWeight: 700,
                    outline: 'none', background: '#F8FAFC',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#000'; }}
                  onBlur={e => { e.target.style.borderColor = '#E2E8F0'; }}
                />
              ))}
            </div>

            {error && <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 500, marginBottom: 12, textAlign: 'center' }}>{error}</p>}

            <button
              onClick={handleVerify}
              disabled={loading || code.join('').length !== 6}
              className="font-black uppercase"
              style={{
                width: '100%', background: '#000', color: '#fff',
                border: 'none', borderRadius: 999, padding: 16,
                fontSize: 12, letterSpacing: 3,
                cursor: (loading || code.join('').length !== 6) ? 'not-allowed' : 'pointer',
                opacity: (loading || code.join('').length !== 6) ? 0.5 : 1,
              }}
            >
              {loading ? '확인 중...' : '인증 완료'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
