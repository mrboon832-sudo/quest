import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Spin, message } from 'antd';
import { authService } from '../services/api';

const { Text } = Typography;

export default function LoginPage({ onLogin }) {
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
        token: response.token 
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
            initialValues={{ username: 'testuser', password: 'password123' }}
          >
            <Form.Item
              label="Username"
              name="username"
              rules={[
                { required: true, message: 'Username is required' },
                { min: 3, message: 'Username must be at least 3 characters' }
              ]}
            >
              <Input placeholder="Enter username" disabled={loading} />
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

            <Text type="secondary" style={{ fontSize: '12px' }}>
              Demo credentials: testuser / password123 (any valid credentials work for testing)
            </Text>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}

