'use client';

import {useState} from 'react';

export default function AdminResetPasswordForm({token}: {token: string}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        const response = await fetch('/api/admin/reset-password', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({token, password, confirm}),
        });
        const payload = (await response.json().catch(() => ({}))) as {error?: string};
        setBusy(false);
        if (!response.ok) {
          setError(payload.error ?? 'Could not reset password');
          return;
        }
        window.location.href = '/login';
      }}
    >
      <label>
        New password
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </label>
      <label>
        Confirm password
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
        />
      </label>
      {error ? <p className="admin-error">{error}</p> : null}
      <button type="submit" disabled={busy || token.length === 0}>
        Set password
      </button>
    </form>
  );
}
