'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-heading-lg font-semibold text-text-primary">Welcome back</h1>
          <p className="text-body-md text-text-secondary mt-1">Sign in to your learning journey</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-card rounded-lg p-6 shadow-sm border border-border">
          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-body-md focus:outline-none focus:ring-2 focus:ring-brand"
              required
            />
          </div>
          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="demo-learn-2026"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-body-md focus:outline-none focus:ring-2 focus:ring-brand"
              required
            />
          </div>
          {error && <p className="text-danger text-body-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-brand text-brand-foreground rounded-md text-body-md font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="text-center text-caption text-text-tertiary">Demo: demo@example.com / demo-learn-2026</p>
        </form>
      </div>
    </div>
  );
}
