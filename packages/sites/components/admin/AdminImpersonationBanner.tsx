'use client';

export default function AdminImpersonationBanner({email}: {email: string}) {
  return (
    <div className="admin-banner">
      <span>
        Viewing as <strong>{email}</strong>
      </span>
      <button
        type="button"
        onClick={async () => {
          await fetch('/api/admin/impersonate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({action: 'stop'}),
          });
          window.location.href = '/';
        }}
      >
        Return to my account
      </button>
    </div>
  );
}
