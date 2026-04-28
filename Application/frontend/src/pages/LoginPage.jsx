import React from 'react';
import { Card, Form, Input, Button, Typography } from 'antd';

const { Text } = Typography;

export default function LoginPage({ onLogin }) {
  const onFinish = ({ username }) => {
    onLogin({ name: username || 'Test User' });
  };

  return (
    <div className="login-page">
      <Card title="Quest UI Login" className="login-card">
        <Form name="loginForm" layout="vertical" onFinish={onFinish} initialValues={{ username: 'testuser' }}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Enter a username to continue.' }]}
          >
            <Input placeholder="Enter username" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Enter a password to continue.' }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Log In
            </Button>
          </Form.Item>

          <Text type="secondary">
            Mock login enabled: any credentials will work for UI testing without Neo4j.
          </Text>
        </Form>
      </Card>
    </div>
  );
}
