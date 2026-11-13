'use client';

export default function AdminLogoutButton() {
  return (
    <button
      type="button"
      className="secondary"
      onClick={async () => {
        await fetch('/api/admin/logout', {method: 'POST'});
        window.location.href = '/login';
      }}
    >
      Sign out
    </button>
  );
}
