export const DESIGN_FLEX_KEYS = ['direction', 'gapPx', 'align', 'valign', 'wrap'] as const;

export type DesignFlexKey = (typeof DESIGN_FLEX_KEYS)[number];

export const DESIGN_FLEX_OPTIONS: readonly {readonly key: DesignFlexKey; readonly label: string}[] = [
  {key: 'direction', label: 'Direction'},
  {key: 'gapPx', label: 'Gap'},
  {key: 'align', label: 'Alignment'},
  {key: 'valign', label: 'Vertical alignment'},
  {key: 'wrap', label: 'Wrap'},
];

export const DESIGN_CONTAINER_KEYS = [
  'widthPx',
  'heightPx',
  'minWidthPx',
  'minHeightPx',
  'maxWidthPx',
  'maxHeightPx',
  'paddingPx',
  'marginPx',
  'background',
  'radiusPx',
  'borderWidthPx',
  'borderColor',
] as const;

export type DesignContainerKey = (typeof DESIGN_CONTAINER_KEYS)[number];

export const DESIGN_CONTAINER_OPTIONS: readonly {readonly key: DesignContainerKey; readonly label: string; readonly max?: number}[] = [
  {key: 'widthPx', label: 'Width', max: 960},
  {key: 'heightPx', label: 'Height', max: 960},
  {key: 'minWidthPx', label: 'Min width', max: 960},
  {key: 'minHeightPx', label: 'Min height', max: 960},
  {key: 'maxWidthPx', label: 'Max width', max: 960},
  {key: 'maxHeightPx', label: 'Max height', max: 960},
  {key: 'paddingPx', label: 'Padding', max: 64},
  {key: 'marginPx', label: 'Margin', max: 64},
  {key: 'background', label: 'Background'},
  {key: 'radiusPx', label: 'Corner radius', max: 32},
  {key: 'borderWidthPx', label: 'Border width', max: 8},
  {key: 'borderColor', label: 'Border colour'},
];
