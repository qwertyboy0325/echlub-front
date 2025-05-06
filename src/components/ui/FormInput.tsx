import React, { forwardRef } from 'react';
import './ui.css';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, id, error, ...props }, ref) => {
    return (
      <div className="form-group">
        <label htmlFor={id}>{label}</label>
        <input 
          ref={ref} 
          id={id} 
          className={`form-input ${error ? 'form-input-error' : ''}`} 
          {...props} 
        />
        {error && <div className="form-error">{error}</div>}
      </div>
    );
  }
);

export default FormInput; 