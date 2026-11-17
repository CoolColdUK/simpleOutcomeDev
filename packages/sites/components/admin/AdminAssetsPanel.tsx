'use client';

import {useEffect, useState} from 'react';

interface OwnerOption {
  readonly id: string;
  readonly email: string;
}

interface AssetRow {
  readonly name: string;
  readonly description: string;
  readonly visibility: 'private' | 'public';
  readonly path: string | undefined;
  readonly contentType: string;
  readonly byteSize: number;
}

interface AssetDraft {
  readonly name: string;
  readonly description: string;
  readonly visibility: 'private' | 'public';
}

export default function AdminAssetsPanel() {
  const [ownerFilter, setOwnerFilter] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [drafts, setDrafts] = useState<Record<string, AssetDraft>>({});
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
      <p className="admin-muted">
        Photos, PDFs, notes, contracts, and other files for one client. The description tells the AI what the file is. Public files can appear on the website. Private files stay with the client and the operator.
      </p>
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
          body.set('description', description);
          body.set('visibility', visibility);
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
          setDescription('');
          setVisibility('private');
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
        <label>
          Description for AI
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} required placeholder="Shop front photo, or the signed treatment contract" />
        </label>
        <label>
          Who can see it
          <select value={visibility} onChange={(event) => setVisibility(event.target.value === 'public' ? 'public' : 'private')}>
            <option value="private">Private — client and operator</option>
            <option value="public">Public — can be used on the website</option>
          </select>
        </label>
        <button type="submit" disabled={busy || ownerId.length === 0}>
          Upload
        </button>
      </form>
      {error ? <p className="admin-error">{error}</p> : null}
      <table className="admin-table">
        <tbody>
          {assets.map((asset) => {
            const draft = drafts[asset.name] ?? {name: asset.name, description: asset.description, visibility: asset.visibility};
            return (
              <tr key={asset.name}>
                <td>
                  {asset.path === undefined ? (
                    <span>{asset.name}</span>
                  ) : (
                    <a href={`/api/admin/assets/file?ownerId=${ownerId}&name=${encodeURIComponent(asset.name)}`}>{asset.path}</a>
                  )}
                  <div className="admin-muted">
                    {asset.visibility} · {asset.contentType} · {asset.byteSize} bytes
                  </div>
                  {asset.path === undefined ? (
                    <a href={`/api/admin/assets/file?ownerId=${ownerId}&name=${encodeURIComponent(asset.name)}`}>Download</a>
                  ) : null}
                </td>
                <td>
                  <input
                    value={draft.name}
                    onChange={(event) => setDrafts((current) => ({...current, [asset.name]: {...draft, name: event.target.value}}))}
                    aria-label={`Rename ${asset.name}`}
                  />
                  <textarea
                    value={draft.description}
                    onChange={(event) => setDrafts((current) => ({...current, [asset.name]: {...draft, description: event.target.value}}))}
                    aria-label={`Description for ${asset.name}`}
                  />
                  <select
                    value={draft.visibility}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [asset.name]: {...draft, visibility: event.target.value === 'public' ? 'public' : 'private'},
                      }))
                    }
                    aria-label={`Visibility for ${asset.name}`}
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setError('');
                      const response = await fetch('/api/admin/assets', {
                        method: 'PATCH',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                          ownerId,
                          name: asset.name,
                          nextName: draft.name,
                          description: draft.description,
                          visibility: draft.visibility,
                        }),
                      });
                      const payload = (await response.json().catch(() => ({}))) as {asset?: AssetRow; error?: string};
                      setBusy(false);
                      if (!response.ok || payload.asset === undefined) {
                        setError(payload.error ?? 'Could not update the asset');
                        return;
                      }
                      const saved = payload.asset;
                      setDrafts((current) => {
                        const next = {...current};
                        delete next[asset.name];
                        return next;
                      });
                      setAssets((current) => current.map((item) => (item.name === asset.name ? saved : item)).sort((left, right) => left.name.localeCompare(right.name)));
                    }}
                  >
                    Save
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
