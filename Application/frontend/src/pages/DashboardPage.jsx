import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, message } from 'antd';
import { AlertOutlined, UserOutlined, TransactionOutlined, RiseOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardService } from '../services/api';

const RISK_COLORS = {
  'High': '#ff4d4f',
  'Medium': '#faad14',
  'Low': '#52c41a',
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalTransactions: 0,
    totalVolume: 0,
    highRiskTransactions: 0,
  });
  const [riskData, setRiskData] = useState([]);
  const [transactionTrend, setTransactionTrend] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch all dashboard data in parallel
        const [statsData, riskDistData, trendData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getRiskDistribution(),
          dashboardService.getTransactionTrend(),
        ]);

        setStats(statsData);
        
        // Transform risk distribution data to include colors
        const transformedRiskData = riskDistData.map(item => ({
          name: item.risk || 'Unknown',
          value: item.count,
          color: RISK_COLORS[item.risk] || '#999',
        }));
        setRiskData(transformedRiskData);

        // Transform transaction trend data
        setTransactionTrend(trendData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        message.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const columns = [
    { title: 'Transaction ID', dataIndex: 'id', key: 'id', width: '20%' },
    { title: 'From Account', dataIndex: 'fromAccount', key: 'fromAccount', width: '20%' },
    { title: 'To Account', dataIndex: 'toAccount', key: 'toAccount', width: '20%' },
    { 
      title: 'Amount', 
      dataIndex: 'amount', 
      key: 'amount', 
      width: '15%',
      render: (val) => `$${val.toFixed(2)}` 
    },
    {
      title: 'Risk Level',
      dataIndex: 'risk',
      key: 'risk',
      width: '15%',
      render: (risk) => {
        const color = risk === 'High' ? 'red' : risk === 'Medium' ? 'orange' : 'green';
        return <Tag color={color}>{risk}</Tag>;
      },
    },
    { title: 'Date', dataIndex: 'date', key: 'date', width: '10%' },
  ];

  const recentTransactions = [
    { id: 'TXN001', fromAccount: 'ACC-4521', toAccount: 'MER-001', amount: 15234.50, risk: 'High', date: '2026-04-07' },
    { id: 'TXN002', fromAccount: 'ACC-3312', toAccount: 'MER-002', amount: 2340.00, risk: 'Medium', date: '2026-04-07' },
    { id: 'TXN003', fromAccount: 'ACC-7789', toAccount: 'MER-003', amount: 890.25, risk: 'Low', date: '2026-04-06' },
    { id: 'TXN004', fromAccount: 'ACC-1122', toAccount: 'MER-004', amount: 45200.00, risk: 'High', date: '2026-04-06' },
    { id: 'TXN005', fromAccount: 'ACC-5544', toAccount: 'MER-005', amount: 1250.75, risk: 'Low', date: '2026-04-05' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Accounts" 
              value={stats.totalAccounts} 
              prefix={<UserOutlined />} 
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Flagged Transactions" 
              value={stats.highRiskTransactions} 
              prefix={<AlertOutlined />} 
              valueStyle={{ color: '#ff4d4f' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Volume" 
              value={stats.totalVolume} 
              prefix="$" 
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Transactions" 
              value={stats.totalTransactions} 
              prefix={<TransactionOutlined />} 
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Transaction Trend (Monthly)">
            {transactionTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={transactionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="normal" fill="#1677ff" name="Normal" />
                  <Bar dataKey="flagged" fill="#ff4d4f" name="Flagged" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>No transaction data available</div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Risk Distribution">
            {riskData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>No risk data available</div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="Recent Flagged Transactions" style={{ marginTop: 16 }}>
        <Table columns={columns} dataSource={recentTransactions} rowKey="id" pagination={false} />
      </Card>
    </div>
  );
}
