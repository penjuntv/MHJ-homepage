'use client';

import { useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // createBrowserClient: 세션을 쿠키에 저장 → middleware / mfa-verify 모두 동일한 쿠키 읽음
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setLoading(false);
    } else {
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
        // 쿠키 기록 완료 후 하드 네비게이션 → mfa-verify가 같은 쿠키로 세션 읽음
        window.location.href = '/mhj-desk/mfa-verify';
      } else if (aalData?.nextLevel === 'aal1') {
        window.location.href = '/mhj-desk/mfa-setup';
      } else {
        window.location.href = '/mhj-desk';
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
      <div
        style={{
          background: 'white',
          borderRadius: '32px',
          padding: '48px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.08)',
        }}
      >
        <h1
          className="font-display font-black uppercase"
          style={{ fontSize: '32px', letterSpacing: '-1px', marginBottom: '8px' }}
        >
          Admin
        </h1>
        <p
          className="font-black uppercase text-mhj-text-tertiary"
          style={{ fontSize: '10px', letterSpacing: '4px', marginBottom: '40px' }}
        >
          MY MAIRANGI CMS
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              className="font-black uppercase"
              style={{ fontSize: '10px', letterSpacing: '3px', color: '#94A3B8', display: 'block', marginBottom: '8px' }}
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full font-medium"
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                border: '1px solid #F1F5F9',
                background: '#F8FAFC',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label
              className="font-black uppercase"
              style={{ fontSize: '10px', letterSpacing: '3px', color: '#94A3B8', display: 'block', marginBottom: '8px' }}
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full font-medium"
              style={{
                padding: '14px 16px',
                borderRadius: '16px',
                border: '1px solid #F1F5F9',
                background: '#F8FAFC',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#EF4444', fontSize: '14px', fontWeight: 500 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="font-black uppercase transition-all duration-300"
            style={{
              background: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '999px',
              padding: '16px',
              fontSize: '12px',
              letterSpacing: '3px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '8px',
            }}
          >
            {loading ? '로그인 중...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
