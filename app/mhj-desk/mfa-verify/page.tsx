'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function MfaVerifyPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

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

    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError || !factors?.totp?.length) {
      setError('등록된 인증 수단을 찾을 수 없습니다.');
      setLoading(false);
      return;
    }

    const factorId = factors.totp[0].id;

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
      router.push('/mhj-desk');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
      <div style={{ background: 'white', borderRadius: 32, padding: 48, width: '100%', maxWidth: 440, boxShadow: '0 25px 60px rgba(0,0,0,0.08)' }}>

        <h1 className="font-display font-black uppercase" style={{ fontSize: 28, letterSpacing: -1, marginBottom: 8 }}>
          2단계 인증
        </h1>
        <p className="font-black uppercase" style={{ fontSize: 10, letterSpacing: 4, color: '#94A3B8', marginBottom: 40 }}>
          MFA VERIFY — MY MAIRANGI CMS
        </p>

        <p style={{ fontSize: 14, color: '#475569', marginBottom: 32, lineHeight: 1.6 }}>
          Google Authenticator 앱에 표시된<br />6자리 코드를 입력하세요.
        </p>

        {/* 6자리 입력 */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 28 }}>
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
              onPaste={i === 0 ? handlePaste : undefined}
              autoFocus={i === 0}
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

        {error && (
          <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 500, marginBottom: 16, textAlign: 'center' }}>{error}</p>
        )}

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
          {loading ? '확인 중...' : '인증하기'}
        </button>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/mhj-desk/login'); }}
            style={{ fontSize: 12, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    </div>
  );
}
