'use client';

import type {SiteDocument, SiteTheme} from '@so/model';
import {useEffect, useState} from 'react';

const TAB_STORAGE_KEY = 'so-admin-site-config-tab';

type ConfigTab = 'layout' | 'business' | 'metadata';

const TABS: readonly {readonly id: ConfigTab; readonly label: string}[] = [
  {id: 'layout', label: 'Layout'},
  {id: 'business', label: 'Business information'},
  {id: 'metadata', label: 'Metadata'},
];

function isConfigTab(value: string | null): value is ConfigTab {
  return value === 'layout' || value === 'business' || value === 'metadata';
}

function withoutEmpty(value: string): string | undefined {
  return value.length === 0 ? undefined : value;
}

export default function AdminSiteConfig({
  siteDocument,
  onChange,
}: {
  siteDocument: SiteDocument;
  onChange: (next: SiteDocument) => void;
}) {
  const [tab, setTab] = useState<ConfigTab>('layout');

  useEffect(() => {
    const stored = window.localStorage.getItem(TAB_STORAGE_KEY);
    if (isConfigTab(stored)) {
      setTab(stored);
    }
  }, []);

  const chooseTab = (next: ConfigTab): void => {
    setTab(next);
    window.localStorage.setItem(TAB_STORAGE_KEY, next);
  };

  return (
    <details className="admin-card admin-config">
      <summary>Site configuration</summary>
      <div className="admin-tabs" role="tablist" aria-label="Site configuration">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="admin-tab"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => chooseTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'layout' ? <LayoutFields siteDocument={siteDocument} onChange={onChange} /> : null}
      {tab === 'business' ? <BusinessFields siteDocument={siteDocument} onChange={onChange} /> : null}
      {tab === 'metadata' ? <MetadataFields siteDocument={siteDocument} onChange={onChange} /> : null}
    </details>
  );
}

function LayoutFields({
  siteDocument,
  onChange,
}: {
  siteDocument: SiteDocument;
  onChange: (next: SiteDocument) => void;
}) {
  const setTheme = (patch: Partial<SiteTheme>): void => {
    onChange({...siteDocument, theme: {...siteDocument.theme, ...patch}});
  };
  return (
    <div className="admin-form admin-form-wide">
      <h3>Theme</h3>
      <ColourField label="Background" value={siteDocument.theme.background} onChange={(background) => setTheme({background})} />
      <ColourField label="Text" value={siteDocument.theme.foreground} onChange={(foreground) => setTheme({foreground})} />
      <ColourField label="Accent" value={siteDocument.theme.accent} onChange={(accent) => setTheme({accent})} />
      <ColourField
        label="Button text"
        value={siteDocument.theme.buttonForeground}
        onChange={(buttonForeground) => setTheme({buttonForeground})}
      />
      <ColourField
        label="Card background"
        value={siteDocument.theme.cardBackground}
        onChange={(cardBackground) => setTheme({cardBackground})}
      />
      <label>
        Heading font
        <input
          value={siteDocument.theme.headingFont}
          maxLength={80}
          onChange={(event) => setTheme({headingFont: event.target.value})}
        />
      </label>
      <label>
        Body font
        <input value={siteDocument.theme.bodyFont} maxLength={80} onChange={(event) => setTheme({bodyFont: event.target.value})} />
      </label>
      <label className="admin-check">
        <input
          type="checkbox"
          checked={siteDocument.theme.uppercaseHeadings}
          onChange={(event) => setTheme({uppercaseHeadings: event.target.checked})}
        />
        Uppercase headings
      </label>
      <label>
        Hero background
        <input
          value={siteDocument.theme.heroBackground}
          onChange={(event) => setTheme({heroBackground: event.target.value})}
        />
        <span className="admin-hint">none, a hex colour, or linear-gradient(135deg,#hex,#hex)</span>
      </label>
      <label>
        Corner radius (px)
        <input
          type="number"
          min={0}
          max={32}
          step={1}
          value={siteDocument.theme.radiusPx}
          onChange={(event) => setTheme({radiusPx: Number(event.target.value)})}
        />
      </label>
      <h3>Navigation</h3>
      {siteDocument.nav.links.map((link, index) => (
        <div key={`${link.sectionId}-${index}`} className="admin-repeat">
          <label>
            Label
            <input
              value={link.label}
              maxLength={120}
              onChange={(event) => {
                const links = siteDocument.nav.links.map((item, itemIndex) =>
                  itemIndex === index ? {...item, label: event.target.value} : item,
                );
                onChange({...siteDocument, nav: {links}});
              }}
            />
          </label>
          <label>
            Section
            <select
              value={link.sectionId}
              onChange={(event) => {
                const links = siteDocument.nav.links.map((item, itemIndex) =>
                  itemIndex === index ? {...item, sectionId: event.target.value} : item,
                );
                onChange({...siteDocument, nav: {links}});
              }}
            >
              {siteDocument.sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.type} · {section.id}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="secondary"
            disabled={siteDocument.nav.links.length <= 1}
            onClick={() => {
              const links = siteDocument.nav.links.filter((_, itemIndex) => itemIndex !== index);
              onChange({...siteDocument, nav: {links}});
            }}
          >
            Remove link
          </button>
        </div>
      ))}
      <button
        type="button"
        className="secondary"
        disabled={siteDocument.nav.links.length >= 8 || siteDocument.sections.length === 0}
        onClick={() => {
          const sectionId = siteDocument.sections[0]?.id;
          if (sectionId === undefined) {
            return;
          }
          onChange({
            ...siteDocument,
            nav: {links: [...siteDocument.nav.links, {label: 'Section', sectionId}]},
          });
        }}
      >
        Add link
      </button>
      <h3>Footer</h3>
      <label>
        Footer text
        <textarea
          value={siteDocument.footer.text}
          maxLength={2000}
          onChange={(event) => onChange({...siteDocument, footer: {text: event.target.value}})}
        />
      </label>
    </div>
  );
}

function BusinessFields({
  siteDocument,
  onChange,
}: {
  siteDocument: SiteDocument;
  onChange: (next: SiteDocument) => void;
}) {
  return (
    <div className="admin-form admin-form-wide">
      <label>
        Business name
        <input
          value={siteDocument.businessName}
          maxLength={120}
          onChange={(event) => onChange({...siteDocument, businessName: event.target.value})}
        />
      </label>
      <label>
        Booking label
        <input
          value={siteDocument.booking.label}
          maxLength={120}
          onChange={(event) => onChange({...siteDocument, booking: {...siteDocument.booking, label: event.target.value}})}
        />
      </label>
      <label>
        Booking URL
        <input
          value={siteDocument.booking.href}
          maxLength={400}
          onChange={(event) => onChange({...siteDocument, booking: {...siteDocument.booking, href: event.target.value}})}
        />
      </label>
      <label>
        Booking provider
        <select
          value={siteDocument.booking.provider}
          onChange={(event) =>
            onChange({
              ...siteDocument,
              booking: {...siteDocument.booking, provider: event.target.value === 'fresha' ? 'fresha' : 'url'},
            })
          }
        >
          <option value="fresha">Fresha</option>
          <option value="url">Other URL</option>
        </select>
      </label>
    </div>
  );
}

function MetadataFields({
  siteDocument,
  onChange,
}: {
  siteDocument: SiteDocument;
  onChange: (next: SiteDocument) => void;
}) {
  const seo = siteDocument.seo;
  const [latitude, setLatitude] = useState(seo?.geo === undefined ? '' : String(seo.geo.latitude));
  const [longitude, setLongitude] = useState(seo?.geo === undefined ? '' : String(seo.geo.longitude));

  const write = (patch: NonNullable<SiteDocument['seo']>): void => {
    const next = {...seo, ...patch};
    const title = withoutEmpty(next.title ?? '');
    const description = withoutEmpty(next.description ?? '');
    const ogImageUrl = withoutEmpty(next.ogImageUrl ?? '');
    const googleBusinessProfileUrl = withoutEmpty(next.googleBusinessProfileUrl ?? '');
    const locale = next.locale;
    const geo = next.geo;
    const cleaned = {
      ...(title === undefined ? {} : {title}),
      ...(description === undefined ? {} : {description}),
      ...(locale === undefined ? {} : {locale}),
      ...(ogImageUrl === undefined ? {} : {ogImageUrl}),
      ...(googleBusinessProfileUrl === undefined ? {} : {googleBusinessProfileUrl}),
      ...(geo === undefined ? {} : {geo}),
    };
    onChange({...siteDocument, seo: Object.keys(cleaned).length === 0 ? undefined : cleaned});
  };

  const writeGeo = (nextLatitude: string, nextLongitude: string): void => {
    setLatitude(nextLatitude);
    setLongitude(nextLongitude);
    const lat = Number(nextLatitude);
    const lng = Number(nextLongitude);
    const geo =
      nextLatitude.trim().length > 0 && nextLongitude.trim().length > 0 && Number.isFinite(lat) && Number.isFinite(lng)
        ? {latitude: lat, longitude: lng}
        : undefined;
    write({geo});
  };

  return (
    <div className="admin-form admin-form-wide">
      <p className="admin-hint">Blank SEO fields fall back to the business name and page content.</p>
      <label>
        Page title
        <input
          value={seo?.title ?? ''}
          maxLength={120}
          onChange={(event) => write({title: withoutEmpty(event.target.value)})}
        />
      </label>
      <label>
        Meta description
        <textarea
          value={seo?.description ?? ''}
          maxLength={160}
          onChange={(event) => write({description: withoutEmpty(event.target.value)})}
        />
      </label>
      <label>
        Locale
        <select value={seo?.locale ?? ''} onChange={(event) => write({locale: event.target.value === 'en-GB' ? 'en-GB' : undefined})}>
          <option value="">Default (en-GB)</option>
          <option value="en-GB">en-GB</option>
        </select>
      </label>
      <label>
        Social image URL
        <input
          value={seo?.ogImageUrl ?? ''}
          maxLength={400}
          placeholder="https://"
          onChange={(event) => write({ogImageUrl: withoutEmpty(event.target.value)})}
        />
      </label>
      <label>
        Google Business Profile URL
        <input
          value={seo?.googleBusinessProfileUrl ?? ''}
          maxLength={400}
          placeholder="https://"
          onChange={(event) => write({googleBusinessProfileUrl: withoutEmpty(event.target.value)})}
        />
      </label>
      <label>
        Latitude
        <input value={latitude} inputMode="decimal" onChange={(event) => writeGeo(event.target.value, longitude)} />
      </label>
      <label>
        Longitude
        <input value={longitude} inputMode="decimal" onChange={(event) => writeGeo(latitude, event.target.value)} />
      </label>
    </div>
  );
}

function pickerHex(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value;
  }
  const short = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(value);
  if (short !== null) {
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`;
  }
  return '#000000';
}

function ColourField({label, value, onChange}: {label: string; value: string; onChange: (next: string) => void}) {
  const picker = pickerHex(value);
  return (
    <label>
      {label}
      <span className="admin-colour">
        <input type="color" value={picker} aria-label={`${label} colour`} onChange={(event) => onChange(event.target.value)} />
        <input value={value} maxLength={7} onChange={(event) => onChange(event.target.value)} />
      </span>
    </label>
  );
}
