import React from 'react';
import { Preset } from '../types';

interface PresetButtonProps {
  preset: Preset;
  isActive: boolean;
  onSelect: (preset: Preset) => void;
  onDelete: (presetId: string) => void;
}

const PresetButton: React.FC<PresetButtonProps> = ({ preset, isActive, onSelect, onDelete }) => {
  return (
    <div
      className={`flex items-center justify-between p-figma-2 rounded-figma ${
        isActive ? 'bg-figma-bg-selected' : 'bg-figma-bg-secondary'
      }`}
    >
      <button
        className='text-figma-xs text-figma-text text-left flex-1 truncate pr-figma-2'
        onClick={() => onSelect(preset)}
        title={preset.name}
      >
        {preset.name}
      </button>
      <button
        className='text-figma-text-tertiary hover:text-figma-text-danger text-figma-sm'
        onClick={(e) => {
          e.stopPropagation();
          onDelete(preset.id);
        }}
        title='Delete preset'
      >
        ×
      </button>
    </div>
  );
};

export default PresetButton;
