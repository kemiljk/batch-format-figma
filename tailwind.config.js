/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Figma theme colors
        'figma-bg': 'var(--figma-color-bg)',
        'figma-bg-hover': 'var(--figma-color-bg-hover)',
        'figma-bg-active': 'var(--figma-color-bg-pressed)',
        'figma-bg-secondary': 'var(--figma-color-bg-secondary)',
        'figma-bg-secondary-hover': 'var(--figma-color-bg-secondary-hover)',
        'figma-bg-brand': 'var(--figma-color-bg-brand)',
        'figma-bg-brand-hover': 'var(--figma-color-bg-brand-hover)',
        'figma-bg-selected': 'var(--figma-color-bg-selected)',
        'figma-border': 'var(--figma-color-border)',
        'figma-border-selected': 'var(--figma-color-border-selected)',
        'figma-text': 'var(--figma-color-text)',
        'figma-text-secondary': 'var(--figma-color-text-secondary)',
        'figma-text-tertiary': 'var(--figma-color-text-tertiary)',
        'figma-text-onbrand': 'var(--figma-color-text-onbrand)',
        'figma-text-brand': 'var(--figma-color-text-brand)',
        'figma-icon': 'var(--figma-color-icon)',
        'figma-icon-secondary': 'var(--figma-color-icon-secondary)',
        'figma-icon-brand': 'var(--figma-color-icon-brand)',
        'figma-icon-selected': 'var(--figma-color-icon-selected)',
      },
      borderRadius: {
        'figma': '6px',
      },
      fontSize: {
        'figma-xs': '11px',
        'figma-sm': '12px',
        'figma-base': '13px',
        'figma-lg': '14px',
        'figma-xl': '16px',
      },
      fontWeight: {
        'figma-normal': '400',
        'figma-medium': '500',
        'figma-semibold': '600',
      },
      spacing: {
        'figma-1': '4px',
        'figma-2': '8px',
        'figma-3': '12px',
        'figma-4': '16px',
        'figma-5': '20px',
        'figma-6': '24px',
        'figma-8': '32px',
        'figma-10': '40px',
        'figma-12': '48px',
      },
    },
  },
  plugins: [],
}; 