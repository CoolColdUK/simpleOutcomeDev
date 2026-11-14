import Link from 'next/link';

export default function AdminBrand() {
  return (
    <Link href="/" className="admin-brand">
      <img src="/brand/mark.svg" width={32} height={32} alt="" />
      Simple Outcome
    </Link>
  );
}
