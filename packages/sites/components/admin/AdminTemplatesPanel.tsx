'use client';

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';

interface TemplateRow {
  readonly id: string;
  readonly name: string;
}

const ID_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export default function AdminTemplatesPanel() {
  const router = useRouter();
  const [templates, setTemplates] = useState<readonly TemplateRow[]>([]);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let ignore = false;
    void fetch('/api/admin/templates')
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {templates?: TemplateRow[]; error?: string};
        if (ignore) {
          return;
        }
        if (!response.ok) {
          setError(payload.error ?? 'Could not load templates');
          return;
        }
        setTemplates(payload.templates ?? []);
      })
      .catch(() => {
        if (!ignore) {
          setError('Could not load templates');
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      <div className="admin-card">
        <h1>Templates</h1>
        <p className="admin-muted">
          Starting pages for new sites. Colour schemes, molecules, and sections live under Design. A new template is a blank page until you add sections.
        </p>
        {error ? <p className="admin-error">{error}</p> : null}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Id</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{template.id}</td>
                <td>
                  <Link href={`/templates/${template.id}`}>Edit</Link>
                  {' · '}
                  <button
                    type="button"
                    className="secondary"
                    disabled={busy}
                    onClick={async () => {
                      if (!window.confirm(`Delete template ${template.name}?`)) {
                        return;
                      }
                      setBusy(true);
                      setError('');
                      const response = await fetch(`/api/admin/templates/${template.id}`, {method: 'DELETE'});
                      const payload = (await response.json().catch(() => ({}))) as {error?: string};
                      setBusy(false);
                      if (!response.ok) {
                        setError(payload.error ?? 'Could not delete template');
                        return;
                      }
                      setTemplates((current) => current.filter((item) => item.id !== template.id));
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="admin-card">
        <h2>New template</h2>
        <form
          className="admin-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const nextId = id.trim().toLowerCase();
            const nextName = name.trim();
            if (!ID_RE.test(nextId)) {
              setError('Id must be lowercase letters, numbers, and hyphens');
              return;
            }
            setBusy(true);
            setError('');
            const response = await fetch('/api/admin/templates', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({id: nextId, name: nextName}),
            });
            const payload = (await response.json().catch(() => ({}))) as {error?: string; template?: {id: string}};
            setBusy(false);
            if (!response.ok || payload.template === undefined) {
              setError(payload.error ?? 'Could not create template');
              return;
            }
            router.push(`/templates/${payload.template.id}`);
          }}
        >
          <label>
            Id
            <input value={id} onChange={(event) => setId(event.target.value)} required placeholder="clean-studio" />
          </label>
          <label>
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
          </label>
          <button type="submit" disabled={busy}>
            Create blank template
          </button>
        </form>
      </div>
    </>
  );
}
