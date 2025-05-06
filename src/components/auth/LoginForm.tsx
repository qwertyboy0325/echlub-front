import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import FormInput from '../ui/FormInput';
import PasswordInput from '../ui/PasswordInput';
import Button from '../ui/Button';
import FormMessage from '../ui/FormMessage';
import { useAuth } from '../../context/AuthContext';
import './auth.css';

const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password } = formData;

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登入失敗，請重試';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, login]);

  return (
    <>
      <FormMessage type="error" message={error} />

      <form onSubmit={handleSubmit} className="auth-form">
        <FormInput
          label="電子郵件"
          type="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
          placeholder="輸入您的電子郵件"
        />

        <PasswordInput
          label="密碼"
          id="password"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
          placeholder="輸入您的密碼"
        />

        <div className="form-action">
          <Button
            type="submit"
            isLoading={loading}
            fullWidth
          >
            {loading ? '處理中...' : '登入'}
          </Button>
        </div>
      </form>

      <div className="auth-links">
        <p>
          還沒有帳號？ <Link to="/register">註冊</Link>
        </p>
        <p>
          <Link to="/forgot-password">忘記密碼？</Link>
        </p>
      </div>
    </>
  );
};

export default LoginForm; 