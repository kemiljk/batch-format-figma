import { BlendModeOption, BlendModeOptionOrSeparator, SupportedNodeType } from './types';

// Supported node types for image operations
export const SUPPORTED_NODE_TYPES: SupportedNodeType[] = [
  'RECTANGLE',
  'ELLIPSE',
  'POLYGON',
  'STAR',
  'FRAME',
  'COMPONENT',
  'INSTANCE',
  'GROUP',
  'VECTOR',
];

// Blend mode options for UI with separators between groups
export const BLEND_MODE_OPTIONS: BlendModeOptionOrSeparator[] = [
  // Normal
  { value: 'NORMAL', label: 'Normal' },

  // Separator
  { type: 'separator' },

  // Darken group
  { value: 'DARKEN', label: 'Darken' },
  { value: 'MULTIPLY', label: 'Multiply' },
  { value: 'LINEAR_BURN', label: 'Linear Burn' },
  { value: 'COLOR_BURN', label: 'Color Burn' },

  // Separator
  { type: 'separator' },

  // Lighten group
  { value: 'LIGHTEN', label: 'Lighten' },
  { value: 'SCREEN', label: 'Screen' },
  { value: 'LINEAR_DODGE', label: 'Linear Dodge' },
  { value: 'COLOR_DODGE', label: 'Color Dodge' },

  // Separator
  { type: 'separator' },

  // Overlay group
  { value: 'OVERLAY', label: 'Overlay' },
  { value: 'SOFT_LIGHT', label: 'Soft Light' },
  { value: 'HARD_LIGHT', label: 'Hard Light' },

  // Separator
  { type: 'separator' },

  // Difference group
  { value: 'DIFFERENCE', label: 'Difference' },
  { value: 'EXCLUSION', label: 'Exclusion' },

  // Separator
  { type: 'separator' },

  // Color group
  { value: 'HUE', label: 'Hue' },
  { value: 'SATURATION', label: 'Saturation' },
  { value: 'COLOR', label: 'Color' },
  { value: 'LUMINOSITY', label: 'Luminosity' },
];
