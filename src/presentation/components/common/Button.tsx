import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'medium',
  ...props
}) => {
  const buttonClassName = [
    'button',
    `button-${variant}`,
    `button-${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClassName}
      {...props}
    >
      {children}
    </button>
  );
}; 