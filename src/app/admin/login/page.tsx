'use client';
import { Suspense, useState, type FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function AdminLoginForm() {
  const [token, setToken] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const params = useSearchParams();
  const router = useRouter();
  const next = params.get('next') ?? '/admin/issues';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const resp = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (resp.ok) {
      router.replace(next);
    } else {
      setErr('错误');
    }
  }

  return (
    <main style={{ maxWidth: 320, margin: '80px auto', padding: 16 }}>
      <h1>Admin</h1>
      <form onSubmit={onSubmit}>
        <input
          type="password"
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="ADMIN_TOKEN"
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
          autoFocus
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Sign in</button>
        {err && <p style={{ color: 'red' }}>{err}</p>}
      </form>
    </main>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={<main style={{ maxWidth: 320, margin: '80px auto', padding: 16 }}><h1>Admin</h1></main>}>
      <AdminLoginForm />
    </Suspense>
  );
}
