'use client';

import {useId, useRef} from 'react';

export interface SiteSalesBannerProps {
  readonly businessName: string;
  readonly email: string;
}

const SETUP_PRICE = '£450';
const CARE_PRICE = '£39/month';

export default function SiteSalesBanner({businessName, email}: SiteSalesBannerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return (
    <div className="sales-banner">
      <p>Sample made for {businessName} by Simple Outcome</p>
      <button type="button" onClick={() => dialogRef.current?.showModal()}>
        Make this yours
      </button>
      <dialog ref={dialogRef} className="sales-panel" aria-labelledby={titleId}>
        <h2 id={titleId}>Make this yours</h2>
        <p>Setup {SETUP_PRICE}</p>
        <p>Care plan {CARE_PRICE}</p>
        <a href={`mailto:${email}`}>{email}</a>
        <button type="button" onClick={() => dialogRef.current?.close()}>
          Close
        </button>
      </dialog>
    </div>
  );
}
