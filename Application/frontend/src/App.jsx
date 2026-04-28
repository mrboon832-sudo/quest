import React from 'react';
import { ConfigProvider, Layout, Menu, Button } from 'antd';
import { DashboardOutlined, BranchesOutlined, TransactionOutlined, FileTextOutlined } from '@ant-design/icons';
import DashboardPage from './pages/DashboardPage';
import NetworkViewPage from './pages/NetworkViewPage';
import TransactionListPage from './pages/TransactionListPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import './App.css';

const { Header, Content, Sider } = Layout;

const menuItems = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: 'network', icon: <BranchesOutlined />, label: 'Network View' },
  { key: 'transactions', icon: <TransactionOutlined />, label: 'Transactions' },
  { key: 'reports', icon: <FileTextOutlined />, label: 'Reports' },
];

function App() {
  const [selectedKey, setSelectedKey] = React.useState('dashboard');
  const [user, setUser] = React.useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedKey('dashboard');
  };

  const renderPage = () => {
    switch (selectedKey) {
      case 'dashboard':
        return <DashboardPage />;
      case 'network':
        return <NetworkViewPage />;
      case 'transactions':
        return <TransactionListPage />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <DashboardPage />;
    }
  };

  if (!user) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 6,
          },
        }}
      >
        <div className="app-login-shell">
          <LoginPage onLogin={handleLogin} />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider collapsible defaultCollapsed={false} theme="dark">
          <div style={{ padding: '16px', textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            Quest
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => setSelectedKey(key)}
          />
        </Sider>
        <Layout>
          <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Fraud Detection & Risk Monitoring</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span>Signed in as <strong>{user.name}</strong></span>
              <Button type="link" onClick={handleLogout} style={{ padding: 0 }}>
                Logout
              </Button>
            </div>
          </Header>
          <Content style={{ margin: '16px', padding: 16, background: '#fff' }}>
            {renderPage()}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
