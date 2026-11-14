'use client';

import {SITE_PRESET_IDS} from '@so/model';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface OwnerOption {
  readonly id: string;
  readonly email: string;
}

export default function AdminCreateSiteForm() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [preset, setPreset] = useState<string>(SITE_PRESET_IDS[0]);
  const [customDomain, setCustomDomain] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);
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
        const payload = (await response.json().catch(() => ({}))) as {
          users?: OwnerOption[];
          error?: string;
        };
        setOwnersLoading(false);
        if (!response.ok) {
          setOwners([]);
          return;
        }
        const next = payload.users ?? [];
        setOwners(next);
        setOwnerId((current) => {
          if (current.length > 0 && next.some((user) => user.id === current)) {
            return current;
          }
          return next[0]?.id ?? '';
        });
      })();
    }, 200);
    return () => window.clearTimeout(handle);
  }, [ownerFilter]);

  return (
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        const normalisedSlug = slug.trim().toLowerCase();
        if (!SLUG_RE.test(normalisedSlug) || normalisedSlug.length > 63) {
          setBusy(false);
          setError('Slug must be lowercase letters, numbers, and hyphens');
          return;
        }
        if (ownerId.length === 0) {
          setBusy(false);
          setError('Choose an owner');
          return;
        }
        const response = await fetch('/api/admin/sites', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            slug: normalisedSlug,
            preset,
            customDomain: customDomain.trim().length === 0 ? undefined : customDomain,
            ownerId,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as {error?: string; site?: {slug: string}};
        setBusy(false);
        if (!response.ok || payload.site === undefined) {
          setError(payload.error ?? 'Could not create site');
          return;
        }
        router.push(`/sites/${payload.site.slug}/edit`);
      }}
    >
      <div className="admin-owner-picker">
        <label>
          Filter owners
          <input
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            placeholder="Search email"
            autoComplete="off"
          />
        </label>
        <label>
          Owner email
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            required
            disabled={ownersLoading || owners.length === 0}
          >
            {owners.length === 0 ? (
              <option value="">{ownersLoading ? 'Loading…' : 'No available owners'}</option>
            ) : (
              owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.email}
                </option>
              ))
            )}
          </select>
        </label>
      </div>
      <label>
        Slug
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          placeholder="my-salon"
          autoComplete="off"
        />
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
      <button type="submit" disabled={busy || ownerId.length === 0}>
        Create site
      </button>
    </form>
  );
}
