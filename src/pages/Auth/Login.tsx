import React from 'react';
import AuthLayout from '../../components/layout/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';

const Login: React.FC = () => {
  return (
    <AuthLayout 
      title="登入" 
      subtitle="歡迎回來！請輸入您的帳號資訊"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default Login; 