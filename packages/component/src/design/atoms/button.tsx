'use client';

import {Button} from '@chakra-ui/react';
import {buttonRecord} from '../designAtomRecords';
import type {DesignAtomPart} from '../designOption';
import {designButtonProps, designSlotText, type DesignAtomProps} from '../designAtomProps';

export function ButtonAtom({node, values}: DesignAtomProps) {
  return (
    <Button asChild variant="plain" {...designButtonProps(node.style)}>
      <a className="design-atom-button" href={designSlotText(node, values, 'href', '#design')}>
        {designSlotText(node, values, 'label', 'Button')}
      </a>
    </Button>
  );
}

export const button = {...buttonRecord, Component: ButtonAtom} satisfies DesignAtomPart;
