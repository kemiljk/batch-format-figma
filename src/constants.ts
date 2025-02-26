import { BlendModeOption, SupportedNodeType } from './types';

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

// Blend mode options for UI
export const BLEND_MODE_OPTIONS: BlendModeOption[] = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'DARKEN', label: 'Darken' },
  { value: 'MULTIPLY', label: 'Multiply' },
  { value: 'LINEAR_BURN', label: 'Linear Burn' },
  { value: 'COLOR_BURN', label: 'Color Burn' },
  { value: 'LIGHTEN', label: 'Lighten' },
  { value: 'SCREEN', label: 'Screen' },
  { value: 'LINEAR_DODGE', label: 'Linear Dodge' },
  { value: 'COLOR_DODGE', label: 'Color Dodge' },
  { value: 'OVERLAY', label: 'Overlay' },
  { value: 'SOFT_LIGHT', label: 'Soft Light' },
  { value: 'HARD_LIGHT', label: 'Hard Light' },
  { value: 'DIFFERENCE', label: 'Difference' },
  { value: 'EXCLUSION', label: 'Exclusion' },
  { value: 'HUE', label: 'Hue' },
  { value: 'SATURATION', label: 'Saturation' },
  { value: 'COLOR', label: 'Color' },
  { value: 'LUMINOSITY', label: 'Luminosity' },
];
