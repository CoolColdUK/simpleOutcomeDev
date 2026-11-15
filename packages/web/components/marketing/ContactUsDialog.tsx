'use client';

import {
  Alert,
  Box,
  Button,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Field,
  Input,
  Stack,
  Textarea,
} from '@chakra-ui/react';
import {useEffect, useRef, useState} from 'react';
import {removeTurnstileWidget, requestTurnstileToken} from '@/lib/contact/requestTurnstileToken';

export interface ContactUsDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

interface ContactPayload {
  readonly ok?: boolean;
  readonly message?: string;
  readonly field?: string;
}

interface FieldErrors {
  readonly name?: string;
  readonly email?: string;
  readonly message?: string;
}

const CAPTCHA_RETRY = 'Please try again.';

async function postContact(body: {
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly company_website: string;
  readonly turnstileToken: string;
}): Promise<ContactPayload> {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  return (await response.json()) as ContactPayload;
}

export default function ContactUsDialog({open, onClose}: ContactUsDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const mounted = useRef(true);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? '';

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      removeTurnstileWidget(widgetIdRef.current);
    };
  }, []);

  const applyResponse = (payload: ContactPayload, captchaRan: boolean): void => {
    if (!mounted.current) {
      return;
    }
    if (payload.ok === true) {
      setSuccess(payload.message ?? 'Message sent.');
      setName('');
      setEmail('');
      setMessage('');
      setCompanyWebsite('');
      setFieldErrors({});
      return;
    }
    if (payload.field === 'turnstileToken') {
      setError(captchaRan ? CAPTCHA_RETRY : (payload.message ?? CAPTCHA_RETRY));
      return;
    }
    if (payload.field === 'name' || payload.field === 'email' || payload.field === 'message') {
      setFieldErrors({[payload.field]: payload.message ?? 'Enter a message'});
      return;
    }
    setError(payload.message ?? 'The message could not be sent. Try again.');
  };

  const submit = async (): Promise<void> => {
    setLoading(true);
    setSuccess(undefined);
    setError(undefined);
    setFieldErrors({});
    const draft = {name, email, message, company_website: companyWebsite};
    try {
      if (companyWebsite.trim() !== '') {
        applyResponse(await postContact({...draft, turnstileToken: ''}), false);
        return;
      }
      if (siteKey.length === 0) {
        applyResponse(await postContact({...draft, turnstileToken: ''}), false);
        return;
      }
      const container = widgetRef.current;
      if (container === null) {
        setError(CAPTCHA_RETRY);
        return;
      }
      const challenge = await requestTurnstileToken(container, siteKey, widgetIdRef.current);
      widgetIdRef.current = challenge.widgetId;
      if (!challenge.ok) {
        if (mounted.current) {
          setError(CAPTCHA_RETRY);
        }
        return;
      }
      applyResponse(await postContact({...draft, turnstileToken: challenge.token}), true);
    } catch {
      if (mounted.current) {
        setError('The message could not be sent. Try again.');
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(event) => (!event.open ? onClose() : undefined)}>
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Us</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Stack gap={4}>
              <Field.Root required invalid={fieldErrors.name !== undefined}>
                <Field.Label>Name</Field.Label>
                <Input value={name} autoComplete="name" onChange={(event) => setName(event.target.value)} />
                {fieldErrors.name !== undefined ? <Field.ErrorText>{fieldErrors.name}</Field.ErrorText> : null}
              </Field.Root>
              <Field.Root required invalid={fieldErrors.email !== undefined}>
                <Field.Label>Email</Field.Label>
                <Input type="email" value={email} autoComplete="email" onChange={(event) => setEmail(event.target.value)} />
                {fieldErrors.email !== undefined ? <Field.ErrorText>{fieldErrors.email}</Field.ErrorText> : null}
              </Field.Root>
              <Field.Root required invalid={fieldErrors.message !== undefined}>
                <Field.Label>Message</Field.Label>
                <Textarea value={message} minH="8rem" onChange={(event) => setMessage(event.target.value)} />
                {fieldErrors.message !== undefined ? <Field.ErrorText>{fieldErrors.message}</Field.ErrorText> : null}
              </Field.Root>
              <Box position="absolute" w="1px" h="1px" p={0} m="-1px" overflow="hidden" whiteSpace="nowrap" border="0" clipPath="inset(50%)">
                <Field.Root>
                  <Field.Label>Company website</Field.Label>
                  <Input
                    tabIndex={-1}
                    autoComplete="off"
                    value={companyWebsite}
                    onChange={(event) => setCompanyWebsite(event.target.value)}
                  />
                </Field.Root>
              </Box>
              {siteKey.length > 0 ? <Box ref={widgetRef} w="100%" /> : null}
              {success !== undefined ? (
                <Alert.Root status="success">
                  <Alert.Title>{success}</Alert.Title>
                </Alert.Root>
              ) : null}
              {error !== undefined ? (
                <Alert.Root status="error">
                  <Alert.Title>{error}</Alert.Title>
                </Alert.Root>
              ) : null}
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button colorPalette="brand" onClick={() => void submit()} loading={loading}>
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
