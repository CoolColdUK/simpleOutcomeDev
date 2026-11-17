import {createSystem, defaultConfig, defineConfig} from '@chakra-ui/react';
import type {DesignColourTokens} from '@so/model';

export function designChakraSystem(tokens: DesignColourTokens) {
  return createSystem(defaultConfig, defineConfig({theme: tokens.chakra.theme}));
}
