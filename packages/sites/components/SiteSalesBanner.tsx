'use client';

import {useId, useRef} from 'react';
import SiteContactForm from '@/components/SiteContactForm';

export interface SiteSalesBannerProps {
  readonly businessName: string;
  readonly messagesEnabled: boolean;
}

const SETUP_PRICE = '£450';
const CARE_PRICE = '£39/month';

export default function SiteSalesBanner({businessName, messagesEnabled}: SiteSalesBannerProps) {
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
        {messagesEnabled ? <SiteContactForm status="demo" submitLabel="Send message" /> : null}
        <button type="button" onClick={() => dialogRef.current?.close()}>
          Close
        </button>
      </dialog>
    </div>
  );
}
