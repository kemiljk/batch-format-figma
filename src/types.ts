// Types for plugin messages
export interface PluginMessage {
  type: string;
  widthCount?: number;
  heightCount?: number;
  checkboxOn?: boolean;
  blendMode?: BlendModeType;
  scaleMode?: ScaleModeType;
  removeFillLayer?: boolean;
  selectedBlendMode?: BlendModeType;
  selectedScaleMode?: ScaleModeType;
  preset?: Preset;
  presetName?: string;
  presetId?: string;
  activePreset?: string | null;
}

// Supported node types for image operations
export type SupportedNodeType =
  | 'RECTANGLE'
  | 'ELLIPSE'
  | 'POLYGON'
  | 'STAR'
  | 'FRAME'
  | 'COMPONENT'
  | 'INSTANCE'
  | 'GROUP'
  | 'VECTOR';

// Blend mode types
export type BlendModeType =
  | 'NORMAL'
  | 'DARKEN'
  | 'MULTIPLY'
  | 'LINEAR_BURN'
  | 'COLOR_BURN'
  | 'LIGHTEN'
  | 'SCREEN'
  | 'LINEAR_DODGE'
  | 'COLOR_DODGE'
  | 'OVERLAY'
  | 'SOFT_LIGHT'
  | 'HARD_LIGHT'
  | 'DIFFERENCE'
  | 'EXCLUSION'
  | 'HUE'
  | 'SATURATION'
  | 'COLOR'
  | 'LUMINOSITY';

// Blend mode options for UI
export interface BlendModeOption {
  value: BlendModeType;
  label: string;
}

// Scale mode types
export type ScaleModeType = 'FILL' | 'FIT' | 'CROP' | 'TILE';

// UI State interface
export interface UIState {
  widthCount: string;
  heightCount: string;
  checkboxOn: boolean;
  selectedBlendMode: BlendModeType;
  removeFillLayer: boolean;
  selectedScaleMode: ScaleModeType;
  presets?: Preset[];
  activePreset?: string | null;
}

// Preset interface for saved settings
export interface Preset {
  id: string;
  name: string;
  widthCount: string;
  heightCount: string;
  checkboxOn: boolean;
  selectedBlendMode: BlendModeType;
  removeFillLayer: boolean;
  selectedScaleMode: ScaleModeType;
  createdAt: number;
}
