import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ConfigProvider, Layout, Menu, Button, Drawer, Avatar, Space, Dropdown, Modal, message } from 'antd';
import { 
  DashboardOutlined, 
  BranchesOutlined, 
  TransactionOutlined, 
  FileTextOutlined, 
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  ExperimentOutlined,
  SendOutlined
} from '@ant-design/icons';
import DashboardPage from './pages/DashboardPage';
import NetworkViewPage from './pages/NetworkViewPage';
import TransactionListPage from './pages/TransactionListPage';
import ReportsPage from './pages/ReportsPage';
import RiskAnalysisPage from './pages/RiskAnalysisPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDashboard from './pages/CustomerDashboard';
import UserTransactionPage from './pages/UserTransactionPage';
import { authService } from './services/api';
import './App.css';

const { Header, Content, Sider } = Layout;

// Menu items for different roles
const adminMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/explorer', icon: <BranchesOutlined />, label: 'Network Explorer' },
  { key: '/transactions', icon: <TransactionOutlined />, label: 'Transactions' },
  { key: '/reports', icon: <FileTextOutlined />, label: 'Reports' },
];

const customerMenuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'My Dashboard' },
  { key: '/send-money', icon: <SendOutlined />, label: 'Send Money' },
  { key: '/transactions', icon: <TransactionOutlined />, label: 'My Transactions' },
];

// Protected Route Component
function ProtectedRoute({ children, user, requiredRole }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// Main Layout Component
function MainLayout({ user, onLogout, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';
  const menuItems = isAdmin ? adminMenuItems : (isCustomer ? customerMenuItems : adminMenuItems);

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogoutClick = () => {
    Modal.confirm({
      title: 'Logout',
      content: 'Are you sure you want to logout?',
      okText: 'Yes',
      cancelText: 'No',
      onOk() {
        onLogout();
      },
    });
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Profile',
      icon: <SettingOutlined />,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <ExperimentOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      handleLogoutClick();
    } else if (key === 'settings') {
      setSettingsOpen(true);
    }
  };

  const getHeaderTitle = () => {
    return isCustomer ? 'Personal Banking Dashboard' : 'Fraud Detection & Risk Monitoring System';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="dark"
        style={{ position: 'fixed', left: 0, top: 0, bottom: 0, overflowY: 'auto', zIndex: 100 }}
        width={200}
      >
        <div style={{ 
          padding: '16px', 
          textAlign: 'center', 
          color: '#fff', 
          fontSize: 18, 
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          marginBottom: '16px'
        }}>
          <span style={{ display: collapsed ? 'none' : 'inline' }}>Quest</span>
          <span style={{ display: collapsed ? 'inline' : 'none' }}>Q</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <Layout style={{ marginLeft: collapsed ? 80 : 200 }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 99
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '18px' }}
            />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{getHeaderTitle()}</h2>
          </div>
          
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }}>
            <Space size={12} style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#1677ff' }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>
                  {user?.name || 'User'}
                </span>
                <span style={{ fontSize: 11, color: '#8c8c8c', textTransform: 'capitalize' }}>
                  {user?.role || 'guest'}
                </span>
              </div>
            </Space>
          </Dropdown>
        </Header>
        
        <Content style={{ margin: '16px', padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
          {children}
        </Content>
      </Layout>

      <Drawer
        title="Settings"
        placement="right"
        onClose={() => setSettingsOpen(false)}
        open={settingsOpen}
      >
        <p>Database Connection: <strong>Live Neo4j</strong></p>
        <p style={{ color: '#52c41a', marginTop: 8 }}>✓ All data is real-time from the database</p>
      </Drawer>
    </Layout>
  );
}

// Auth Layout Component
function AuthLayout({ children }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        background: '#fff',
        padding: 0,
        borderRadius: '8px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        width: '100%',
        maxWidth: '420px',
      }}>
        {children}
      </div>
    </div>
  );
}

// Main App Component
function AppRoot() {
  const [user, setUser] = useState(() => authService.getUser());
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (user && localStorage.getItem('authToken')) {
        try {
          await authService.verify();
        } catch (error) {
          console.error('Session verification failed:', error);
          if (error.response?.status === 401 || error.response?.status === 403) {
            handleLogout();
          }
        }
      }
    };
    checkSession();
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    setShowRegister(false);
    message.success('Login successful!');
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    message.success('Logged out successfully!');
  };

  const handleRegisterClick = () => {
    setShowRegister(true);
  };

  const handleRegisterCancel = () => {
    setShowRegister(false);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Layout: {
            headerBg: '#fff',
            bodyBg: '#f5f5f5',
          },
        },
      }}
    >
      <Router>
        <AppRoutes user={user} setUser={setUser} loading={loading} handleLogin={handleLogin} handleLogout={handleLogout} handleRegisterClick={handleRegisterClick} handleRegisterCancel={handleRegisterCancel} />
      </Router>
    </ConfigProvider>
  );
}

// Routes Component (inside Router context, can use useNavigate)
function AppRoutes({ user, setUser, loading, handleLogin, handleLogout, handleRegisterClick: onRegisterClick, handleRegisterCancel }) {
  const navigate = useNavigate();

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <Routes>
          {/* Auth Routes */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AuthLayout>
                  <LoginPage 
                    onLogin={handleLogin}
                    onRegisterClick={handleRegisterClick}
                  />
                </AuthLayout>
              )
            }
          />

          <Route
            path="/register"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <AuthLayout>
                  <RegisterPage 
                    onLogin={handleLogin}
                    onCancel={handleRegisterCancel}
                  />
                </AuthLayout>
              )
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <MainLayout user={user} onLogout={handleLogout}>
                  {user?.role === 'customer' ? <CustomerDashboard /> : <DashboardPage />}
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/send-money"
            element={
              <ProtectedRoute user={user} requiredRole="customer">
                <MainLayout user={user} onLogout={handleLogout}>
                  <UserTransactionPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/explorer"
            element={
              <ProtectedRoute user={user} requiredRole="admin">
                <MainLayout user={user} onLogout={handleLogout}>
                  <NetworkViewPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/transactions"
            element={
              <ProtectedRoute user={user}>
                <MainLayout user={user} onLogout={handleLogout}>
                  <TransactionListPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute user={user} requiredRole="admin">
                <MainLayout user={user} onLogout={handleLogout}>
                  <ReportsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/analysis/:id"
            element={
              <ProtectedRoute user={user} requiredRole="admin">
                <MainLayout user={user} onLogout={handleLogout}>
                  <RiskAnalysisPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Root redirect */}
          <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />

          {/* 404 */}
          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        </Routes>
  );
}

// Export for main.jsx
export default function App() {
  return <AppRoot />;
}
