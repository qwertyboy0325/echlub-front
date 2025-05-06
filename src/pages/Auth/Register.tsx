import React from 'react';
import AuthLayout from '../../components/layout/AuthLayout';
import RegisterForm from '../../components/auth/RegisterForm';

const Register: React.FC = () => {
  return (
    <AuthLayout 
      title="註冊帳號" 
      subtitle="建立您的新帳號，開始使用我們的服務"
    >
      <RegisterForm />
    </AuthLayout>
  );
};

export default Register; 