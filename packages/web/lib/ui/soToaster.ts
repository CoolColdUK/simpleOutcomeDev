'use client';

import {createToaster} from '@chakra-ui/react';

export const soToaster = createToaster({
  placement: 'bottom-end',
  overlap: true,
  pauseOnPageIdle: true,
});
