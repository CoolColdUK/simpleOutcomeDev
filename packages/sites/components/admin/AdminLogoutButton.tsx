'use client';

import {useRouter} from 'next/navigation';

export default function AdminLogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="secondary"
      onClick={async () => {
        await fetch('/api/admin/logout', {method: 'POST'});
        router.push('/login');
      }}
    >
      Sign out
    </button>
  );
}
