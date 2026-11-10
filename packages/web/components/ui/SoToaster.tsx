'use client';

import {ToastCloseTrigger, ToastDescription, ToastRoot, ToastTitle, Toaster} from '@chakra-ui/react';
import {soToaster} from '@/lib/ui/soToaster';

export default function SoToaster() {
  return (
    <Toaster toaster={soToaster}>
      {(toast) => (
        <ToastRoot
          width={{base: 'min(100vw - 1.5rem, 24rem)', md: '22rem'}}
          maxW="24rem"
          alignItems="start"
          gap={2}
          py={3}
          px={4}
        >
          {toast.title !== undefined && toast.title !== '' ? (
            <ToastTitle lineHeight="short" fontWeight="semibold">
              {toast.title}
            </ToastTitle>
          ) : null}
          {toast.description !== undefined && toast.description !== '' ? (
            <ToastDescription lineHeight="short" whiteSpace="pre-wrap" wordBreak="break-word">
              {toast.description}
            </ToastDescription>
          ) : null}
          <ToastCloseTrigger />
        </ToastRoot>
      )}
    </Toaster>
  );
}
