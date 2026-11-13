'use client';

import {useEffect, useId, useRef, useState} from 'react';
import {removeTurnstileWidget, requestTurnstileToken} from '@/lib/siteMessage/requestTurnstileToken';

export interface SiteContactFormProps {
  readonly status: 'demo' | 'live';
  readonly submitLabel: string;
}

interface FieldErrors {
  readonly name?: string;
  readonly email?: string;
  readonly message?: string;
}

interface SiteMessagePayload {
  readonly ok?: boolean;
  readonly message?: string;
  readonly field?: string;
}

interface SiteMessageDraft {
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly companyWebsite: string;
}

const LIVE_NOTICE = 'Your message is emailed to the salon. Simple Outcome does not store it. It is used only so the salon can reply.';
const DEMO_NOTICE = 'This is a sample. Your message is emailed to Simple Outcome, not the salon. It is not stored.';
const CAPTCHA_RETRY = 'Please try again.';

async function postSiteMessage(draft: SiteMessageDraft, turnstileToken: string): Promise<SiteMessagePayload> {
  const response = await fetch('/api/site-message', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      name: draft.name,
      email: draft.email,
      message: draft.message,
      company_website: draft.companyWebsite,
      turnstileToken,
    }),
  });
  return (await response.json()) as SiteMessagePayload;
}

export default function SiteContactForm({status, submitLabel}: SiteContactFormProps) {
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const mounted = useRef(true);
  const busy = useRef(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';
  const draft = useRef<SiteMessageDraft>({name, email, message, companyWebsite});
  draft.current = {name, email, message, companyWebsite};

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      removeTurnstileWidget(widgetIdRef.current);
    };
  }, []);

  const applyResponse = (payload: SiteMessagePayload, captchaRan: boolean): void => {
    if (!mounted.current) {
      return;
    }
    if (payload.ok === true) {
      setSuccess(payload.message ?? 'Message sent.');
      return;
    }
    if (payload.field === 'turnstileToken') {
      setFormError(captchaRan ? CAPTCHA_RETRY : (payload.message ?? CAPTCHA_RETRY));
      return;
    }
    if (payload.field === 'name' || payload.field === 'email' || payload.field === 'message') {
      setErrors({[payload.field]: payload.message ?? 'Enter a message'});
      return;
    }
    setFormError(payload.message ?? 'The message could not be sent. Try again.');
  };

  const submit = async (): Promise<void> => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setSending(true);
    setFormError('');
    setErrors({});
    const started = draft.current;
    try {
      if (started.companyWebsite.trim() !== '') {
        applyResponse(await postSiteMessage(draft.current, ''), false);
        return;
      }
      if (siteKey.length === 0) {
        applyResponse(await postSiteMessage(draft.current, ''), false);
        return;
      }
      const container = widgetRef.current;
      if (container === null) {
        setFormError(CAPTCHA_RETRY);
        return;
      }
      const challenge = await requestTurnstileToken(container, siteKey, widgetIdRef.current);
      widgetIdRef.current = challenge.widgetId;
      if (!challenge.ok) {
        if (mounted.current) {
          setFormError(CAPTCHA_RETRY);
        }
        return;
      }
      applyResponse(await postSiteMessage(draft.current, challenge.token), true);
    } catch {
      if (mounted.current) {
        setFormError('The message could not be sent. Try again.');
      }
    } finally {
      busy.current = false;
      if (mounted.current) {
        setSending(false);
      }
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
      {siteKey.length > 0 ? <div ref={widgetRef} className="contact-turnstile" /> : null}
      {formError !== '' ? (
        <p className="contact-error" role="alert">
          {formError}
        </p>
      ) : null}
      <button className="btn" type="submit" disabled={sending} aria-busy={sending}>
        {sending ? 'Sending…' : submitLabel}
      </button>
    </form>
  );
}
