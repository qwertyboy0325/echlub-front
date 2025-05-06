import React, { forwardRef } from 'react';
import './ui.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'text';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'medium', 
    isLoading = false, 
    fullWidth = false,
    icon,
    className = '',
    disabled,
    ...props 
  }, ref) => {
    const baseClass = 'auth-button';
    const variantClass = `${baseClass}-${variant}`;
    const sizeClass = `${baseClass}-${size}`;
    const widthClass = fullWidth ? `${baseClass}-fullwidth` : '';

    return (
      <button
        ref={ref}
        className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="button-loader"></span>
            <span>{children}</span>
          </>
        ) : (
          <>
            {icon && <span className="button-icon">{icon}</span>}
            <span>{children}</span>
          </>
        )}
      </button>
    );
  }
);

export default Button; 