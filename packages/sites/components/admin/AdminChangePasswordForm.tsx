'use client';

import {useState} from 'react';

export default function AdminChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        setSaved(false);
        const response = await fetch('/api/admin/change-password', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({currentPassword, password, confirm}),
        });
        const payload = (await response.json().catch(() => ({}))) as {error?: string};
        setBusy(false);
        if (!response.ok) {
          setError(payload.error ?? 'Could not change password');
          return;
        }
        setCurrentPassword('');
        setPassword('');
        setConfirm('');
        setSaved(true);
      }}
    >
      <label>
        Current password
        <input
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </label>
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
      {saved ? <p className="admin-ok">Password updated.</p> : null}
      <button type="submit" disabled={busy}>
        Change password
      </button>
    </form>
  );
}
