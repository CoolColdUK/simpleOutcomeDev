'use client';

import {useState} from 'react';

export default function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email, password}),
        });
        const payload = (await response.json().catch(() => ({}))) as {error?: string};
        setBusy(false);
        if (!response.ok) {
          setError(payload.error ?? 'Could not sign in');
          return;
        }
        window.location.href = '/';
      }}
    >
      <label>
        Email
        <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Password
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error ? <p className="admin-error">{error}</p> : null}
      <div className="admin-actions">
        <button type="submit" disabled={busy}>
          Sign in
        </button>
        <a className="admin-button secondary" href="/forgot-password">
          Forgot password
        </a>
      </div>
    </form>
  );
}
