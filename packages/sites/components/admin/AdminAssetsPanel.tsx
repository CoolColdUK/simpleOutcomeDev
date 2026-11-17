'use client';

import {useEffect, useState} from 'react';

interface OwnerOption {
  readonly id: string;
  readonly email: string;
}

interface AssetRow {
  readonly name: string;
  readonly path: string;
  readonly contentType: string;
  readonly byteSize: number;
}

export default function AdminAssetsPanel() {
  const [ownerFilter, setOwnerFilter] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [names, setNames] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void (async () => {
        setOwnersLoading(true);
        const params = new URLSearchParams({forOwnerPicker: '1'});
        if (ownerFilter.trim().length > 0) {
          params.set('q', ownerFilter.trim());
        }
        const response = await fetch(`/api/admin/users?${params.toString()}`);
        const payload = (await response.json().catch(() => ({}))) as {users?: OwnerOption[]};
        setOwnersLoading(false);
        if (!response.ok) {
          setOwners([]);
          return;
        }
        const next = payload.users ?? [];
        setOwners(next);
        setOwnerId((current) => (current.length > 0 && next.some((user) => user.id === current) ? current : (next[0]?.id ?? '')));
      })();
    }, 200);
    return () => window.clearTimeout(handle);
  }, [ownerFilter]);

  useEffect(() => {
    if (ownerId.length === 0) {
      setAssets([]);
      return;
    }
    void (async () => {
      const response = await fetch(`/api/admin/assets?ownerId=${ownerId}`);
      const payload = (await response.json().catch(() => ({}))) as {assets?: AssetRow[]; error?: string};
      if (!response.ok) {
        setError(payload.error ?? 'Could not list assets');
        setAssets([]);
        return;
      }
      setAssets(payload.assets ?? []);
    })();
  }, [ownerId]);

  return (
    <section>
      <h1>Assets</h1>
      <p className="admin-muted">Files and images for one client. A site built from a template can use them at /assets/name.</p>
      <div className="admin-owner-picker">
        <label>
          Filter clients
          <input value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} placeholder="Search email" autoComplete="off" />
        </label>
        <label>
          Client
          <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)} disabled={ownersLoading || owners.length === 0}>
            {owners.length === 0 ? <option value="">{ownersLoading ? 'Loading…' : 'No clients'}</option> : null}
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.email}
              </option>
            ))}
          </select>
        </label>
      </div>
      <form
        className="admin-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const file = new FormData(form).get('file');
          if (!(file instanceof File) || ownerId.length === 0) {
            setError('Choose a client and a file');
            return;
          }
          setBusy(true);
          setError('');
          const body = new FormData();
          body.set('ownerId', ownerId);
          body.set('file', file);
          if (fileName.trim().length > 0) {
            body.set('name', fileName.trim());
          }
          const response = await fetch('/api/admin/assets', {method: 'POST', body});
          const payload = (await response.json().catch(() => ({}))) as {asset?: AssetRow; error?: string};
          setBusy(false);
          if (!response.ok || payload.asset === undefined) {
            setError(payload.error ?? 'Could not upload the asset');
            return;
          }
          setFileName('');
          form.reset();
          const saved = payload.asset;
          setAssets((current) => [...current.filter((item) => item.name !== saved.name), saved].sort((left, right) => left.name.localeCompare(right.name)));
        }}
      >
        <label>
          File
          <input name="file" type="file" required accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.md" />
        </label>
        <label>
          SEO name
          <input value={fileName} onChange={(event) => setFileName(event.target.value)} placeholder="gel-nails.jpg" autoComplete="off" />
        </label>
        <button type="submit" disabled={busy || ownerId.length === 0}>
          Upload
        </button>
      </form>
      {error ? <p className="admin-error">{error}</p> : null}
      <table className="admin-table">
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.name}>
              <td>
                <a href={`/api/admin/assets/file?ownerId=${ownerId}&name=${encodeURIComponent(asset.name)}`}>{asset.path}</a>
                <div className="admin-muted">
                  {asset.contentType} · {asset.byteSize} bytes
                </div>
              </td>
              <td>
                <input
                  value={names[asset.name] ?? asset.name}
                  onChange={(event) => setNames((current) => ({...current, [asset.name]: event.target.value}))}
                  aria-label={`Rename ${asset.name}`}
                />
              </td>
              <td>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    const nextName = (names[asset.name] ?? asset.name).trim();
                    setBusy(true);
                    setError('');
                    const response = await fetch('/api/admin/assets', {
                      method: 'PATCH',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ownerId, name: asset.name, nextName}),
                    });
                    const payload = (await response.json().catch(() => ({}))) as {asset?: AssetRow; error?: string};
                    setBusy(false);
                    if (!response.ok || payload.asset === undefined) {
                      setError(payload.error ?? 'Could not rename the asset');
                      return;
                    }
                    const saved = payload.asset;
                    setAssets((current) => current.map((item) => (item.name === asset.name ? saved : item)).sort((left, right) => left.name.localeCompare(right.name)));
                  }}
                >
                  Rename
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
