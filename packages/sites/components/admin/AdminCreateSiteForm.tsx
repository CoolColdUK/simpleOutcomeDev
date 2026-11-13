'use client';

import {SITE_PRESET_IDS} from '@so/model';
import {useState} from 'react';

export default function AdminCreateSiteForm({ownerEmailDefault}: {ownerEmailDefault: string}) {
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState(ownerEmailDefault);
  const [preset, setPreset] = useState<string>(SITE_PRESET_IDS[0]);
  const [customDomain, setCustomDomain] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        const response = await fetch('/api/admin/sites', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            slug,
            ownerEmail,
            preset,
            customDomain: customDomain.trim().length === 0 ? undefined : customDomain,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as {error?: string; site?: {slug: string}};
        setBusy(false);
        if (!response.ok || payload.site === undefined) {
          setError(payload.error ?? 'Could not create site');
          return;
        }
        window.location.href = `/sites/${payload.site.slug}/edit`;
      }}
    >
      <label>
        Slug
        <input value={slug} onChange={(e) => setSlug(e.target.value)} required pattern="[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?" />
      </label>
      <label>
        Owner email
        <input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required />
      </label>
      <label>
        Preset
        <select value={preset} onChange={(e) => setPreset(e.target.value)}>
          {SITE_PRESET_IDS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </label>
      <label>
        Custom domain (optional)
        <input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="salon.example.com" />
      </label>
      {error ? <p className="admin-error">{error}</p> : null}
      <button type="submit" disabled={busy}>
        Create site
      </button>
    </form>
  );
}
