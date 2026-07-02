import React from 'react';

export function Panel({ title, right, children, className = '' }) {
  return (
    <div className={`bg-surface-container-low border border-outline-variant ${className}`}>
      {title && (
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-high">
          <h3 className="font-label-caps text-label-caps tracking-widest text-primary uppercase">{title}</h3>
          {right}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function Btn({ children, onClick, variant = 'primary', type = 'button', disabled, className = '' }) {
  const variants = {
    primary: 'border-primary text-primary hover:bg-primary hover:text-on-primary',
    error: 'border-error text-error hover:bg-error hover:text-on-error',
    secondary: 'border-secondary text-secondary hover:bg-secondary hover:text-on-secondary',
    ghost: 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`border px-3 py-1.5 font-label-caps text-label-caps uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Chip({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-surface-variant text-on-surface-variant',
    green: 'bg-primary text-on-primary',
    red: 'bg-error-container text-on-error-container',
    amber: 'bg-secondary-container text-on-secondary-container',
    thaumiel: 'bg-on-tertiary-container text-tertiary',
  };
  return <span className={`text-[10px] px-2 py-0.5 font-bold uppercase ${tones[tone]}`}>{children}</span>;
}

export function CmdInput({ value, onChange, placeholder, type = 'text', onKeyDown, className = '' }) {
  return (
    <div className={`flex items-center space-x-2 border border-outline-variant bg-surface-container-lowest px-3 py-2 ${className}`}>
      <span className="text-primary font-bold">&gt;</span>
      <input
        className="cmd-input placeholder:text-outline-variant uppercase"
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
      />
    </div>
  );
}

export function Divider() {
  return <div className="text-on-surface-variant opacity-30 select-none overflow-hidden whitespace-nowrap text-xs">{'_'.repeat(200)}</div>;
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="border border-error text-error bg-error-container/10 px-4 py-2 text-sm font-code-sm">
      [ ERROR ] {message}
    </div>
  );
}

export function Loading({ label = 'ЗАГРУЗКА ДАННЫХ...' }) {
  return <div className="text-primary-fixed-dim text-sm animate-pulse font-code-sm">&gt; {label}</div>;
}
