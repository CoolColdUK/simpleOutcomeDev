'use client';

import {Box, Button, chakra, Field, Input, Text, Textarea} from '@chakra-ui/react';
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

function draftFromForm(form: HTMLFormElement): SiteMessageDraft {
  const data = new FormData(form);
  const read = (key: string): string => {
    const value = data.get(key);
    return typeof value === 'string' ? value : '';
  };
  return {name: read('name'), email: read('email'), message: read('message'), companyWebsite: read('company_website')};
}

async function peekSiteMessageLimit(): Promise<SiteMessagePayload> {
  const response = await fetch('/api/site-message');
  return (await response.json()) as SiteMessagePayload;
}

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

  const submit = async (form: HTMLFormElement): Promise<void> => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setSending(true);
    setFormError('');
    setErrors({});
    const typed = draftFromForm(form);
    try {
      if (typed.companyWebsite.trim() !== '') {
        applyResponse(await postSiteMessage(typed, ''), false);
        return;
      }
      const room = await peekSiteMessageLimit();
      if (room.ok !== true) {
        applyResponse(room, false);
        return;
      }
      if (siteKey.length === 0) {
        applyResponse(await postSiteMessage(typed, ''), false);
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
      applyResponse(await postSiteMessage(draftFromForm(form), challenge.token), true);
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
    return <Text>{success}</Text>;
  }

  return (
    <chakra.form
      display="flex"
      flexDirection="column"
      gap="3.5"
      maxW="36rem"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(event.currentTarget);
      }}
    >
      <Text>{status === 'demo' ? DEMO_NOTICE : LIVE_NOTICE}</Text>
      <Field.Root invalid={errors.name !== undefined}>
        <Field.Label htmlFor={nameId}>Name</Field.Label>
        <Input id={nameId} name="name" autoComplete="name" value={name} bg="siteCard" onChange={(event) => setName(event.target.value)} />
        {errors.name ? <Field.ErrorText>{errors.name}</Field.ErrorText> : null}
      </Field.Root>
      <Field.Root invalid={errors.email !== undefined}>
        <Field.Label htmlFor={emailId}>Email</Field.Label>
        <Input id={emailId} name="email" type="email" autoComplete="email" value={email} bg="siteCard" onChange={(event) => setEmail(event.target.value)} />
        {errors.email ? <Field.ErrorText>{errors.email}</Field.ErrorText> : null}
      </Field.Root>
      <Field.Root invalid={errors.message !== undefined}>
        <Field.Label htmlFor={messageId}>Message</Field.Label>
        <Textarea id={messageId} name="message" rows={5} value={message} bg="siteCard" onChange={(event) => setMessage(event.target.value)} />
        {errors.message ? <Field.ErrorText>{errors.message}</Field.ErrorText> : null}
      </Field.Root>
      <Box position="absolute" w="1px" h="1px" overflow="hidden" clipPath="rect(0 0 0 0)">
        <Field.Root>
          <Field.Label>Company website</Field.Label>
          <Input name="company_website" tabIndex={-1} autoComplete="off" value={companyWebsite} onChange={(event) => setCompanyWebsite(event.target.value)} />
        </Field.Root>
      </Box>
      {siteKey.length > 0 ? <Box ref={widgetRef} w="full" /> : null}
      {formError !== '' ? (
        <Text color="red.700" role="alert">
          {formError}
        </Text>
      ) : null}
      <Button type="submit" alignSelf="flex-start" minH="44px" px="5" fontWeight="700" borderRadius="full" bg="siteAccent" color="siteButtonForeground" disabled={sending} aria-busy={sending}>
        {sending ? 'Sending…' : submitLabel}
      </Button>
    </chakra.form>
  );
}
