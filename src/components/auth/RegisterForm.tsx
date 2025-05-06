import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import FormInput from '../ui/FormInput';
import Button from '../ui/Button';
import FormMessage from '../ui/FormMessage';
import { useAuth } from '../../context/AuthContext';
import './auth.css';

const RegisterForm: React.FC = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
    
    const { email, username, password, confirmPassword } = formData;
    
    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致');
      return;
    }
    
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await register(email, password, username);
      setSuccess('註冊成功！正在為您跳轉到主頁...');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '註冊失敗，請重試';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, register]);

  return (
    <>
      <FormMessage type="error" message={error} />
      <FormMessage type="success" message={success} />

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

        <FormInput
          label="使用者名稱"
          type="text"
          id="username"
          value={formData.username}
          onChange={handleChange}
          required
          autoComplete="username"
          placeholder="選擇一個獨特的使用者名稱"
        />

        <FormInput
          label="密碼"
          type="password"
          id="password"
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
          placeholder="設定密碼（至少8個字元）"
          minLength={8}
        />

        <FormInput
          label="確認密碼"
          type="password"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          autoComplete="new-password"
          placeholder="再次輸入密碼"
          minLength={8}
        />

        <div className="form-action">
          <Button
            type="submit"
            isLoading={loading}
            fullWidth
          >
            {loading ? '處理中...' : '註冊'}
          </Button>
        </div>
      </form>

      <div className="auth-links">
        <p>
          已經有帳號？ <Link to="/login">登入</Link>
        </p>
      </div>
    </>
  );
};

export default RegisterForm; 