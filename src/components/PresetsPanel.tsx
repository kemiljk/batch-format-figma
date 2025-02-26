import React, { useState } from 'react';
import { Preset } from '../types';
import PresetButton from './PresetButton';
import Button from './Button';

interface PresetsPanelProps {
  presets: Preset[];
  activePresetId: string | null;
  onSelectPreset: (preset: Preset) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (presetId: string) => void;
}

const PresetsPanel: React.FC<PresetsPanelProps> = ({
  presets,
  activePresetId,
  onSelectPreset,
  onSavePreset,
  onDeletePreset,
}) => {
  const [newPresetName, setNewPresetName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSavePreset = () => {
    if (newPresetName.trim()) {
      onSavePreset(newPresetName.trim());
      setNewPresetName('');
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSavePreset();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewPresetName('');
    }
  };

  return (
    <div className='flex flex-col gap-figma-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-figma-sm font-figma-medium text-figma-text'>Saved Presets</h2>
        {!isCreating && (
          <Button
            onClick={() => setIsCreating(true)}
            variant='secondary'
            className='text-figma-xs px-figma-2 py-figma-1 h-auto'
          >
            + New Preset
          </Button>
        )}
      </div>

      {isCreating && (
        <div className='bg-figma-bg-secondary p-figma-3 rounded-figma mb-figma-2'>
          <input
            type='text'
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder='Preset name'
            autoFocus
            onKeyDown={handleKeyDown}
            className='w-full h-10 rounded-figma px-figma-3 bg-figma-bg text-figma-xs text-figma-text border border-figma-border mb-figma-2 focus:border-figma-border-selected focus:outline-none'
          />
          <div className='flex gap-figma-2'>
            <Button
              onClick={handleSavePreset}
              disabled={!newPresetName.trim()}
              variant='primary'
              className='flex-1'
            >
              Save
            </Button>
            <Button
              onClick={() => setIsCreating(false)}
              variant='secondary'
              className='flex-1'
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className='flex flex-col gap-figma-2 max-h-[300px] overflow-y-auto'>
        {presets.length === 0 ? (
          <p className='text-figma-xs text-figma-text-tertiary text-center py-figma-4'>
            No presets saved yet.
          </p>
        ) : (
          presets
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((preset) => (
              <PresetButton
                key={preset.id}
                preset={preset}
                isActive={preset.id === activePresetId}
                onSelect={onSelectPreset}
                onDelete={onDeletePreset}
              />
            ))
        )}
      </div>
    </div>
  );
};

export default PresetsPanel;
