import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  className = '',
  disabled = false,
}) => {
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {label && (
        <span
          className={`text-figma-sm ${disabled ? 'text-figma-text-tertiary' : 'text-figma-text'}`}
        >
          {label}
        </span>
      )}
      <label className={`switch ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
        <input
          type='checkbox'
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
        />
        <span className='slider'></span>
      </label>
    </div>
  );
};

export default Switch;
