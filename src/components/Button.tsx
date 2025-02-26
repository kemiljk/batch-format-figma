import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  onClick,
  className = '',
  fullWidth = true,
  disabled = false,
}) => {
  const baseClasses =
    'flex items-center justify-center px-figma-4 py-figma-2 rounded-figma text-figma-sm font-figma-medium transition-all duration-100';

  const variantClasses =
    variant === 'primary'
      ? 'bg-figma-bg-brand text-figma-text-onbrand hover:bg-figma-bg-brand-hover active:bg-figma-bg-active'
      : 'bg-figma-bg-secondary text-figma-text hover:bg-figma-bg-secondary-hover active:bg-figma-bg-active';

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${widthClass} ${disabledClass} ${className}`}
      onClick={onClick}
      type='button'
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
