'use client';

import {useState} from 'react';

export interface AdminRevisionItem {
  readonly versionNumber: number;
  readonly publishedAt: string;
  readonly publishedBy: string;
  readonly businessName: string;
}

export default function AdminVersionsPanel({
  slug,
  revisions,
}: {
  slug: string;
  revisions: readonly AdminRevisionItem[];
}) {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState(revisions);

  return (
    <div className="admin-card">
      <h1>Versions · {slug}</h1>
      <p className="admin-muted">Revert publishes a new version from an older snapshot. The draft on the subdomain is unchanged.</p>
      {error ? <p className="admin-error">{error}</p> : null}
      {message ? <p className="admin-ok">{message}</p> : null}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Version</th>
            <th>Published</th>
            <th>Business</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.versionNumber}>
              <td>v{row.versionNumber}</td>
              <td>{new Date(row.publishedAt).toLocaleString()}</td>
              <td>{row.businessName}</td>
              <td>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={async () => {
                    if (!window.confirm(`Revert production to version ${row.versionNumber}?`)) {
                      return;
                    }
                    setBusy(true);
                    setError('');
                    setMessage('');
                    const response = await fetch(`/api/admin/sites/${slug}/revert`, {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({versionNumber: row.versionNumber}),
                    });
                    const payload = (await response.json().catch(() => ({}))) as {
                      error?: string;
                      versionNumber?: number;
                    };
                    setBusy(false);
                    if (!response.ok) {
                      setError(payload.error ?? 'Revert failed');
                      return;
                    }
                    setMessage(`Published version ${payload.versionNumber} from v${row.versionNumber}.`);
                    const refresh = await fetch(`/api/admin/sites/${slug}/revisions`);
                    const refreshed = (await refresh.json().catch(() => ({}))) as {
                      revisions?: AdminRevisionItem[];
                    };
                    if (refreshed.revisions) {
                      setRows(refreshed.revisions);
                    }
                  }}
                >
                  Revert to this
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 ? <p className="admin-muted">No published versions yet.</p> : null}
      <p>
        <a href={`/sites/${slug}/edit`}>Back to editor</a>
      </p>
    </div>
  );
}
