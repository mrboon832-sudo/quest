import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Spin, message } from 'antd';
import { authService } from '../services/api';

const { Text } = Typography;

export default function LoginPage({ onLogin, onRegisterClick }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    const { username, password } = values;
    setLoading(true);

    try {
      const response = await authService.login(username, password);
      message.success('Login successful!');
      onLogin({ 
        name: response.user.username || username,
        token: response.token,
        role: response.user.role
      });
    } catch (error) {
      message.error(error.response?.data?.error || 'Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card title="Quest - Fraud Detection System" className="login-card">
        <Spin spinning={loading} tip="Logging in...">
          <Form 
            form={form}
            name="loginForm" 
            layout="vertical" 
            onFinish={onFinish}
          >
            <Form.Item
              label="Email or Username"
              name="username"
              rules={[
                { required: true, message: 'Username or email is required' },
                { min: 3, message: 'Must be at least 3 characters' }
              ]}
            >
              <Input placeholder="Enter email or username" disabled={loading} />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Password is required' },
                { min: 3, message: 'Password must be at least 3 characters' }
              ]}
            >
              <Input.Password placeholder="Enter password" disabled={loading} />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Log In
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Don't have an account?{' '}
                <Button type="link" size="small" onClick={onRegisterClick} disabled={loading}>
                  Sign Up
                </Button>
              </Text>
            </div>

            <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '12px' }}>
              <strong>Demo Credentials:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                <li>Admin: admin / admin123</li>
                <li>Or register a new account</li>
              </ul>
            </Text>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}

