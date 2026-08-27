'use client';

import {
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
  Alert,
} from '@chakra-ui/react';
import {useState} from 'react';

export interface ContactUsDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export default function ContactUsDialog({open, onClose}: ContactUsDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const submit = async (): Promise<void> => {
    setLoading(true);
    setSuccess(undefined);
    setError(undefined);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, email, message}),
      });
      if (res.ok) {
        setSuccess('Message sent! We will get back to you soon.');
        setName('');
        setEmail('');
        setMessage('');
        return;
      }
      setError('Failed to send message. Please try again.');
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
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
              <Field.Root required>
                <Field.Label>Name</Field.Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field.Root>
              <Field.Root required>
                <Field.Label>Email</Field.Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field.Root>
              <Field.Root required>
                <Field.Label>Message</Field.Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} minH="8rem" />
              </Field.Root>
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
