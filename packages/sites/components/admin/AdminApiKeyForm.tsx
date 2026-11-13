'use client';

import {useState} from 'react';

export default function AdminApiKeyForm() {
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        setSecret('');
        const response = await fetch('/api/admin/api-keys', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({label}),
        });
        const payload = (await response.json().catch(() => ({}))) as {error?: string; secret?: string};
        setBusy(false);
        if (!response.ok || payload.secret === undefined) {
          setError(payload.error ?? 'Could not create key');
          return;
        }
        setSecret(payload.secret);
        setLabel('');
      }}
    >
      <label>
        Label
        <input value={label} onChange={(e) => setLabel(e.target.value)} required />
      </label>
      {error ? <p className="admin-error">{error}</p> : null}
      {secret ? (
        <p className="admin-ok">
          Secret (shown once): <code>{secret}</code>
        </p>
      ) : null}
      <button type="submit" disabled={busy}>
        Create API key
      </button>
      <p className="admin-muted">Use Authorization: Bearer on https://admin.simpleoutcome.dev/api/mcp/sites</p>
    </form>
  );
}
