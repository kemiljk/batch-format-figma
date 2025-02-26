import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  options,
  value,
  onChange,
  className = '',
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className={`w-full h-10 rounded-figma px-figma-3 bg-figma-bg text-figma-text font-figma-normal border border-figma-border focus:border-figma-border-selected focus:outline-none hover:border-figma-border-selected transition-colors appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,<svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L6 6L11 1" stroke="%23333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>')] bg-no-repeat bg-[center_right_12px] pr-10 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      {options.map((option: SelectOption) => (
        <option
          key={option.value}
          value={option.value}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
