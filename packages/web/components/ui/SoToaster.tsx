'use client';

import {ToastCloseTrigger, ToastDescription, ToastRoot, ToastTitle, Toaster} from '@chakra-ui/react';
import {soToaster} from '@/lib/ui/soToaster';

export default function SoToaster() {
  return (
    <Toaster toaster={soToaster}>
      {(toast) => (
        <ToastRoot>
          {toast.title !== undefined && toast.title !== '' ? <ToastTitle>{toast.title}</ToastTitle> : null}
          {toast.description !== undefined && toast.description !== '' ? (
            <ToastDescription>{toast.description}</ToastDescription>
          ) : null}
          <ToastCloseTrigger />
        </ToastRoot>
      )}
    </Toaster>
  );
}
