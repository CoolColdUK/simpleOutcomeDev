import {button} from './button';
import {checkbox} from './checkbox';
import {iconButton} from './iconButton';
import {imageButton} from './imageButton';
import {link} from './link';
import {switchAtom} from './switch';
import {text} from './text';

export const DESIGN_ATOM_DEFINITIONS = [button, checkbox, iconButton, imageButton, link, switchAtom, text] as const;

export const DESIGN_ATOMS = [button.atom, checkbox.atom, iconButton.atom, imageButton.atom, link.atom, switchAtom.atom, text.atom] as const;

export type DesignAtom = (typeof DESIGN_ATOMS)[number];
