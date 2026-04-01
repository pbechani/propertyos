import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  fullWidth = false, 
  children, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "py-4 px-8 rounded-xl font-headline font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "blue-gradient text-on-primary shadow-[0_8px_20px_rgba(0,72,141,0.2)] hover:shadow-[0_12px_32px_rgba(0,72,141,0.3)]",
    secondary: "bg-surface-container-lowest text-on-surface-variant border border-outline-variant/15 hover:bg-surface-bright",
    ghost: "text-on-surface-variant hover:bg-surface-container-high",
    outline: "border-2 border-primary text-primary"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, rightElement, className = '', ...props }) => {
  return (
    <div className="space-y-2 w-full">
      {label && <label className="block font-label text-sm font-semibold text-on-surface ml-1">{label}</label>}
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
        <input 
          className={`w-full bg-surface-container-highest border-none rounded-xl py-4 ${icon ? 'pl-12' : 'pl-4'} ${rightElement ? 'pr-12' : 'pr-4'} text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/30 transition-all font-body ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_rgba(25,28,29,0.06)] border border-outline-variant/15 ${className}`}>
      {children}
    </div>
  );
};
