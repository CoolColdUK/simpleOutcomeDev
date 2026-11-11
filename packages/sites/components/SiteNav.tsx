'use client';

import type {SiteDocument} from '@so/model';
import {useState} from 'react';

export default function SiteNav({document}: {document: SiteDocument}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="nav">
      <a className="logo" href="#hero">
        {document.businessName}
      </a>
      <div className="nav-actions">
        <button type="button" className="menu-button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? 'Close' : 'Menu'}
        </button>
        <a className="btn" href={document.booking.href} target="_blank" rel="noopener noreferrer">
          {document.booking.label}
        </a>
      </div>
      <nav className="nav-links" data-open={open ? 'true' : 'false'}>
        {document.nav.links.map((link) => (
          <a key={link.sectionId} href={`#${link.sectionId}`} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
