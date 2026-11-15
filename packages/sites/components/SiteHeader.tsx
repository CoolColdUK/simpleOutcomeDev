'use client';

import type {SiteDocument} from '@so/model';
import {useState} from 'react';

export interface SiteHeaderProps {
  readonly businessName: string;
  readonly booking: SiteDocument['booking'];
  readonly links: readonly {readonly label: string; readonly sectionId: string}[];
}

export default function SiteHeader({businessName, booking, links}: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  return (
    <header className="nav">
      <a className="logo" href="#hero">
        {businessName}
      </a>
      <div className="nav-actions">
        {links.length === 0 ? null : (
          <button type="button" className="menu-button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {open ? 'Close' : 'Menu'}
          </button>
        )}
        <a className="btn" href={booking.href} target="_blank" rel="noopener noreferrer">
          {booking.label}
        </a>
      </div>
      {links.length === 0 ? null : (
        <nav className="nav-links" data-open={open ? 'true' : 'false'}>
          {links.map((link) => (
            <a key={link.sectionId} href={`#${link.sectionId}`} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
