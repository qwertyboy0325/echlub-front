import React from 'react';
import './ui.css';

interface FormMessageProps {
  type: 'error' | 'success' | 'info' | 'warning';
  message: string | null;
  className?: string;
}

const FormMessage: React.FC<FormMessageProps> = ({ 
  type, 
  message, 
  className = '' 
}) => {
  if (!message) return null;

  const baseClass = 'auth';
  const typeClass = `${baseClass}-${type}`;

  return (
    <div className={`${typeClass} ${className}`}>
      {message}
    </div>
  );
};

export default FormMessage; 