'use client';

import {useState} from 'react';

export interface AdminUserListItem {
  readonly id: string;
  readonly email: string;
  readonly is_admin: boolean;
}

export default function AdminUsersPanel({users}: {users: readonly AdminUserListItem[]}) {
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState(users);

  return (
    <div>
      <div className="admin-card">
        <h2>Create user</h2>
        <form
          className="admin-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError('');
            const response = await fetch('/api/admin/users', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({email, isAdmin}),
            });
            const payload = (await response.json().catch(() => ({}))) as {
              error?: string;
              user?: AdminUserListItem;
            };
            setBusy(false);
            if (!response.ok || payload.user === undefined) {
              setError(payload.error ?? 'Could not create user');
              return;
            }
            setRows((current) => [...current, payload.user!].sort((a, b) => a.email.localeCompare(b.email)));
            setEmail('');
            setIsAdmin(false);
          }}
        >
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            <span>
              <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} /> Admin
            </span>
          </label>
          {error ? <p className="admin-error">{error}</p> : null}
          <button type="submit" disabled={busy}>
            Create user
          </button>
        </form>
        <p className="admin-muted">The user sets a password with Forgot password on first login.</p>
      </div>
      <div className="admin-card">
        <h2>Users</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Admin</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.is_admin ? 'Yes' : 'No'}</td>
                <td>
                  <button
                    type="button"
                    className="secondary"
                    onClick={async () => {
                      await fetch('/api/admin/impersonate', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({userId: user.id, action: 'start'}),
                      });
                      window.location.href = '/';
                    }}
                  >
                    Switch into
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
