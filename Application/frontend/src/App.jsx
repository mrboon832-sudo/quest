import React from 'react';
import { ConfigProvider, Layout, Menu, Button, App as AntdApp } from 'antd'; 
import { DashboardOutlined, BranchesOutlined, TransactionOutlined, FileTextOutlined, LogoutOutlined } from '@ant-design/icons';
import CustomerDashboard from './pages/CustomerDashboard';
import DashboardPage from './pages/DashboardPage';
import NetworkViewPage from './pages/NetworkViewPage';
import TransactionListPage from './pages/TransactionListPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import './App.css';
import { authService } from './services/api';

const { Header, Content, Sider } = Layout;

const adminMenuItems = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: 'network', icon: <BranchesOutlined />, label: 'Network View' },
  { key: 'transactions', icon: <TransactionOutlined />, label: 'Transactions' },
  { key: 'reports', icon: <FileTextOutlined />, label: 'Reports' },
];

const customerMenuItems = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: 'transactions', icon: <TransactionOutlined />, label: 'Transactions' },
];

// This is the logic of your application
function AppContent() { 
  const [selectedKey, setSelectedKey] = React.useState('dashboard');
  
  const [user, setUser] = React.useState(() => {
    return authService.getUser(); 
  });
  
  const [showRegister, setShowRegister] = React.useState(false);

  const handleLogout = () => {
    authService.logout(); 
    setUser(null);
    setSelectedKey('dashboard');
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setShowRegister(false);
    setSelectedKey('dashboard');
  };

   React.useEffect(() => {
    const checkSession = async () => {
      if (user && localStorage.getItem('authToken')) {
        try {
          await authService.verify(); 
        } catch (e) {
          console.error("Session verification failed:", e);
          if (e.response?.status === 401 || e.response?.status === 403) {
            handleLogout();
          }
        }
      }
    };
    checkSession();
  }, [user]);

  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';
  const menuItems = isAdmin ? adminMenuItems : (isCustomer ? customerMenuItems : adminMenuItems);

  const renderPage = () => {
    if (isCustomer) {
      switch (selectedKey) {
        case 'dashboard': return <CustomerDashboard />;
        case 'transactions': return <TransactionListPage />;
        default: return <CustomerDashboard />;
      }
    }
    switch (selectedKey) {
      case 'dashboard': return <DashboardPage />;
      case 'network': return <NetworkViewPage />;
      case 'transactions': return <TransactionListPage />;
      case 'reports': return <ReportsPage />;
      default: return <DashboardPage />;
    }
  };

  const getHeaderTitle = () => {
    return isCustomer ? 'Banking Dashboard' : 'Fraud Detection & Risk Monitoring';
  };

  if (!user) {
    return (
      <div className="app-login-shell">
        {showRegister ? (
          <RegisterPage onLogin={handleLogin} onCancel={() => setShowRegister(false)} />
        ) : (
          <LoginPage onLogin={handleLogin} onRegisterClick={() => setShowRegister(true)} />
        )}
      </div>
    );
  }

  return (
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
          <h2 style={{ margin: 0 }}>{getHeaderTitle()}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>
              Signed in as <strong>{user.name}</strong> ({user.role})
            </span>
            <Button type="link" onClick={handleLogout} style={{ padding: 0 }} icon={<LogoutOutlined />}>
              Logout
            </Button>
          </div>
        </Header>
        <Content style={{ margin: '16px', padding: 16, background: '#fff' }}>
          {renderPage()}
        </Content>
      </Layout>
    </Layout>
  );
}

// This is the Root component that exports to main.jsx
export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
        },
      }}
    >
      <AntdApp> 
        <AppContent />
      </AntdApp>
    </ConfigProvider>
  );
}
