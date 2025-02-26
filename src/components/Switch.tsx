import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, className = '' }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {label && <span className='text-figma-xs text-figma-text'>{label}</span>}
      <label className='switch'>
        <input
          type='checkbox'
          checked={checked}
          onChange={handleChange}
        />
        <span className='slider'></span>
      </label>
    </div>
  );
};

export default Switch;
