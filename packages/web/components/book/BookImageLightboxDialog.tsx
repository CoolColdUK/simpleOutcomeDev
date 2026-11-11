'use client';

import {
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  HStack,
  IconButton,
  Image,
  Text,
} from '@chakra-ui/react';
import {DownloadIcon} from '@so/component';
import AppIconTooltip from '@/components/app/AppIconTooltip';
import downloadBookStorageImage from '@/lib/book/downloadBookStorageImage';

export interface BookImageLightboxDialogProps {
  readonly open: boolean;
  readonly signedUrl: string;
  readonly storagePath: string;
  readonly showDownload: boolean;
  readonly onClose: () => void;
  readonly onError?: (message: string) => void;
}

export default function BookImageLightboxDialog({
  open,
  signedUrl,
  storagePath,
  showDownload,
  onClose,
  onError,
}: BookImageLightboxDialogProps) {
  const fileName = storagePath.split('/').pop() ?? 'Image';

  return (
    <DialogRoot open={open} onOpenChange={(details) => !details.open && onClose()} size="cover">
      <DialogBackdrop />
      <DialogPositioner>
        <DialogContent maxW="95vw" maxH="95vh" bg="bg">
          <DialogHeader>
            <HStack justify="space-between" w="full" gap={2}>
              <DialogTitle>
                <Text truncate maxW={{base: '12rem', md: '24rem'}}>
                  {fileName}
                </Text>
              </DialogTitle>
              <HStack gap={1}>
                {showDownload ? (
                  <AppIconTooltip label="Download image">
                    <IconButton
                      aria-label="Download image"
                      variant="ghost"
                      onClick={() => {
                        void downloadBookStorageImage(signedUrl, storagePath).catch((err: unknown) => {
                          onError?.(err instanceof Error ? err.message : String(err));
                        });
                      }}
                    >
                      <DownloadIcon size={18} />
                    </IconButton>
                  </AppIconTooltip>
                ) : null}
                <DialogCloseTrigger onClick={onClose} />
              </HStack>
            </HStack>
          </DialogHeader>
          <DialogBody display="flex" justifyContent="center" alignItems="center" p={4}>
            <Image src={signedUrl} alt={fileName} maxW="full" maxH="75vh" objectFit="contain" />
          </DialogBody>
        </DialogContent>
      </DialogPositioner>
    </DialogRoot>
  );
}
