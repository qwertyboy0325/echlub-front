import React, { useState, forwardRef, useRef, useEffect } from 'react';
import './ui.css';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, id, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 處理點擊事件，判斷是否點擊在組件外部
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsFocused(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const toggleShowPassword = () => {
      setShowPassword(!showPassword);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const handleContainerClick = () => {
      // 當容器被點擊時，確保輸入框獲得焦點
      const inputElement = containerRef.current?.querySelector('input');
      if (inputElement) {
        inputElement.focus();
      }
    };

    return (
      <div className="form-group" ref={containerRef}>
        <label htmlFor={id}>{label}</label>
        <div
          className={`password-input-container ${isFocused ? 'focused' : ''}`}
          onClick={handleContainerClick}
        >
          <input
            ref={ref}
            id={id}
            type={showPassword ? 'text' : 'password'}
            className={`form-input password-input ${error ? 'form-input-error' : ''}`}
            onFocus={handleFocus}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            className="password-toggle-button"
            onClick={toggleShowPassword}
            aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
          >
            <span className="password-toggle-icon">
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </span>
          </button>
        </div>
        {error && <div className="form-error">{error}</div>}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput; 