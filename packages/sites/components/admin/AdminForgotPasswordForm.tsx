'use client';

import {useState} from 'react';

export default function AdminForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage('');
        const response = await fetch('/api/admin/forgot-password', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email}),
        });
        const payload = (await response.json().catch(() => ({}))) as {message?: string};
        setBusy(false);
        setMessage(payload.message ?? 'If that email is on a site account, a reset link has been sent.');
      }}
    >
      <label>
        Email
        <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      {message ? <p className="admin-ok">{message}</p> : null}
      <div className="admin-actions">
        <button type="submit" disabled={busy}>
          Send reset link
        </button>
        <a className="admin-button secondary" href="/login">
          Back to sign in
        </a>
      </div>
    </form>
  );
}
