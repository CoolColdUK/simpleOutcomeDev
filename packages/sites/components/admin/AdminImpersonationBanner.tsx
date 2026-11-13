'use client';

import {useRouter} from 'next/navigation';

export default function AdminImpersonationBanner({email}: {email: string}) {
  const router = useRouter();
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
          router.push('/');
          router.refresh();
        }}
      >
        Return to my account
      </button>
    </div>
  );
}
