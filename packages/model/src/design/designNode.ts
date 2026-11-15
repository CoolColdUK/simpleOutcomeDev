import * as v from 'valibot';
import {SITE_BLOCK_ICONS} from '../site/siteBlockSchema';
import {siteBodySchema, siteHexColourSchema, siteHttpUrlSchema, siteShortTextSchema} from '../site/siteTextSchema';
import {designIdSchema, designNodeIdSchema} from './designId';

export const DESIGN_ATOMS = ['button', 'iconButton', 'imageButton', 'link', 'switch', 'text'] as const;

export type DesignAtom = (typeof DESIGN_ATOMS)[number];

const idField = {id: designNodeIdSchema, kind: v.literal('atom')} as const;

export const designButtonNodeSchema = v.strictObject({
  ...idField,
  atom: v.literal('button'),
  props: v.strictObject({
    label: siteShortTextSchema,
    href: siteHttpUrlSchema,
    background: siteHexColourSchema,
    color: siteHexColourSchema,
  }),
});

export const designIconButtonNodeSchema = v.strictObject({
  ...idField,
  atom: v.literal('iconButton'),
  props: v.strictObject({
    label: siteShortTextSchema,
    href: siteHttpUrlSchema,
    icon: v.picklist(SITE_BLOCK_ICONS),
    background: siteHexColourSchema,
    color: siteHexColourSchema,
  }),
});

export const designImageButtonNodeSchema = v.strictObject({
  ...idField,
  atom: v.literal('imageButton'),
  props: v.strictObject({
    label: siteShortTextSchema,
    href: siteHttpUrlSchema,
    src: siteHttpUrlSchema,
    alt: siteShortTextSchema,
  }),
});

export const designLinkNodeSchema = v.strictObject({
  ...idField,
  atom: v.literal('link'),
  props: v.strictObject({
    label: siteShortTextSchema,
    href: siteHttpUrlSchema,
    color: siteHexColourSchema,
  }),
});

export const designSwitchNodeSchema = v.strictObject({
  ...idField,
  atom: v.literal('switch'),
  props: v.strictObject({
    label: siteShortTextSchema,
    checked: v.boolean(),
  }),
});

export const designTextNodeSchema = v.strictObject({
  ...idField,
  atom: v.literal('text'),
  props: v.strictObject({
    text: siteBodySchema,
    role: v.picklist(['heading', 'body']),
  }),
});

export const designAtomNodeSchema = v.variant('atom', [
  designButtonNodeSchema,
  designIconButtonNodeSchema,
  designImageButtonNodeSchema,
  designLinkNodeSchema,
  designSwitchNodeSchema,
  designTextNodeSchema,
]);

export const designMoleculeUseSchema = v.strictObject({
  id: designNodeIdSchema,
  kind: v.literal('molecule'),
  moleculeId: designIdSchema,
});

export interface DesignMoleculeUseNode extends v.InferOutput<typeof designMoleculeUseSchema> {}

export type DesignAtomNode = v.InferOutput<typeof designAtomNodeSchema>;

export interface DesignStackNode {
  id: string;
  kind: 'stack';
  direction: 'row' | 'column';
  gapPx: number;
  children: DesignNode[];
}

export type DesignNode = DesignAtomNode | DesignMoleculeUseNode | DesignStackNode;

export const designNodeSchema: v.GenericSchema<DesignNode> = v.lazy(() =>
  v.variant('kind', [designAtomNodeSchema, designMoleculeUseSchema, designStackNodeSchema]),
);

export const designStackNodeSchema: v.GenericSchema<DesignStackNode> = v.strictObject({
  id: designNodeIdSchema,
  kind: v.literal('stack'),
  direction: v.picklist(['row', 'column']),
  gapPx: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(64)),
  children: v.pipe(v.array(designNodeSchema), v.minLength(1), v.maxLength(8)),
});
