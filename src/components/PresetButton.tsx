import React from 'react';

interface PresetButtonProps {
  value: string | number;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export const PresetButton: React.FC<PresetButtonProps> = ({
  value,
  isActive,
  onClick,
  className = '',
}) => {
  return (
    <button
      className={`preset-button ${isActive ? 'active' : ''} ${className}`}
      onClick={onClick}
      type='button'
    >
      {value}
    </button>
  );
};

export default PresetButton;
