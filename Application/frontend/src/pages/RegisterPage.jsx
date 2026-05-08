import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Spin, message, Select, Radio } from 'antd';
import { authService } from '../services/api';

const { Text } = Typography;

export default function RegisterPage({ onLogin, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    const { fullName, email, password, confirmPassword, phone, role } = values;
    
    // Validate password match
    if (password !== confirmPassword) {
      message.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(fullName, email, password, phone, role);
      message.success('Registration successful! Logging in...');
      onLogin({ 
        name: response.user.name || email,
        token: response.token,
        role: response.user.role 
      });
    } catch (error) {
      message.error(error.response?.data?.error || 'Registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <Card title="Create Quest Account" className="login-card" style={{ maxWidth: '500px' }}>
        <Spin spinning={loading} tip="Creating account...">
          <Form 
            form={form}
            name="registerForm" 
            layout="vertical" 
            onFinish={onFinish}
          >
            <Form.Item
              label="Full Name"
              name="fullName"
              rules={[
                { required: true, message: 'Full name is required' },
                { min: 2, message: 'Name must be at least 2 characters' }
              ]}
            >
              <Input placeholder="Enter your full name" disabled={loading} />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input placeholder="Enter your email" disabled={loading} />
            </Form.Item>

            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                { required: true, message: 'Phone is required' },
                { min: 10, message: 'Phone must be at least 10 characters' }
              ]}
            >
              <Input placeholder="Enter your phone number" disabled={loading} />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Password is required' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password placeholder="Create a password" disabled={loading} />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              rules={[
                { required: true, message: 'Please confirm your password' }
              ]}
            >
              <Input.Password placeholder="Confirm your password" disabled={loading} />
            </Form.Item>

            <Form.Item
              label="Account Type"
              name="role"
              initialValue="customer"
              rules={[
                { required: true, message: 'Please select an account type' }
              ]}
            >
              <Radio.Group disabled={loading}>
                <Radio.Button value="customer">
                  <strong>Customer</strong>
                  <div style={{ fontSize: '11px' }}>Bank account holder</div>
                </Radio.Button>
                <Radio.Button value="admin">
                  <strong>Admin</strong>
                  <div style={{ fontSize: '11px' }}>Fraud analyst</div>
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Create Account
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Already have an account?{' '}
                <Button type="link" size="small" onClick={onCancel} disabled={loading}>
                  Log In
                </Button>
              </Text>
            </div>

            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                <strong>Account Types:</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li><strong>Customer:</strong> Personal bank account for deposits, withdrawals, and transfers</li>
                  <li><strong>Admin:</strong> Fraud detection analyst account with full system access</li>
                </ul>
              </Text>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}
