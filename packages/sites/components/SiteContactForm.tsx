'use client';

import {useEffect, useId, useRef, useState} from 'react';
import Script from 'next/script';

export interface SiteContactFormProps {
  readonly status: 'demo' | 'live';
  readonly submitLabel: string;
}

interface FieldErrors {
  readonly name?: string;
  readonly email?: string;
  readonly message?: string;
  readonly turnstileToken?: string;
}

const LIVE_NOTICE = 'Your message is emailed to the salon. Simple Outcome does not store it. It is used only so the salon can reply.';
const DEMO_NOTICE = 'This is a sample. Your message is emailed to Simple Outcome, not the salon. It is not stored.';

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: {sitekey: string; callback: (token: string) => void}) => string;
    };
  }
}

export default function SiteContactForm({status, submitLabel}: SiteContactFormProps) {
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const widgetRef = useRef<HTMLDivElement>(null);
  const rendered = useRef(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [token, setToken] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';

  useEffect(() => {
    if (!scriptReady || rendered.current || siteKey.length === 0 || widgetRef.current === null || window.turnstile === undefined) {
      return;
    }
    rendered.current = true;
    window.turnstile.render(widgetRef.current, {sitekey: siteKey, callback: setToken});
  }, [scriptReady, siteKey]);

  const submit = async (): Promise<void> => {
    setSending(true);
    setFormError('');
    setErrors({});
    try {
      const response = await fetch('/api/site-message', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name,
          email,
          message,
          company_website: companyWebsite,
          turnstileToken: token,
        }),
      });
      const payload = (await response.json()) as {readonly ok?: boolean; readonly message?: string; readonly field?: string};
      if (payload.ok === true) {
        setSuccess(payload.message ?? 'Message sent.');
        return;
      }
      if (payload.field === 'name' || payload.field === 'email' || payload.field === 'message' || payload.field === 'turnstileToken') {
        const text = payload.message ?? 'Enter a message';
        setErrors({[payload.field]: text});
        return;
      }
      setFormError(payload.message ?? 'The message could not be sent. Try again.');
    } catch {
      setFormError('The message could not be sent. Try again.');
    } finally {
      setSending(false);
    }
  };

  if (success !== '') {
    return <p>{success}</p>;
  }

  return (
    <form
      className="contact-form"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p>{status === 'demo' ? DEMO_NOTICE : LIVE_NOTICE}</p>
      <label htmlFor={nameId}>
        Name
        <input id={nameId} name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
        {errors.name ? <span className="contact-error">{errors.name}</span> : null}
      </label>
      <label htmlFor={emailId}>
        Email
        <input id={emailId} name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        {errors.email ? <span className="contact-error">{errors.email}</span> : null}
      </label>
      <label htmlFor={messageId}>
        Message
        <textarea id={messageId} name="message" rows={5} value={message} onChange={(event) => setMessage(event.target.value)} />
        {errors.message ? <span className="contact-error">{errors.message}</span> : null}
      </label>
      <div className="contact-honeypot">
        <label>
          Company website
          <input
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            value={companyWebsite}
            onChange={(event) => setCompanyWebsite(event.target.value)}
          />
        </label>
      </div>
      {siteKey.length > 0 ? (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onLoad={() => setScriptReady(true)}
          />
          <div ref={widgetRef} />
          {errors.turnstileToken ? <span className="contact-error">{errors.turnstileToken}</span> : null}
        </>
      ) : null}
      {formError !== '' ? <p className="contact-error">{formError}</p> : null}
      <button className="btn" type="submit" disabled={sending}>
        {sending ? 'Sending…' : submitLabel}
      </button>
    </form>
  );
}
