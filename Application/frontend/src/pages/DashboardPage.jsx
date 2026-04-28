import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin } from 'antd';
import { AlertOutlined, UserOutlined, TransactionOutlined, RiseOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const riskData = [
  { name: 'High', value: 12, color: '#ff4d4f' },
  { name: 'Medium', value: 28, color: '#faad14' },
  { name: 'Low', value: 45, color: '#52c41a' },
];

const transactionTrend = [
  { month: 'Jan', normal: 120, flagged: 15 },
  { month: 'Feb', normal: 135, flagged: 22 },
  { month: 'Mar', normal: 148, flagged: 18 },
  { month: 'Apr', normal: 142, flagged: 28 },
  { month: 'May', normal: 155, flagged: 25 },
  { month: 'Jun', normal: 160, flagged: 32 },
];

const COLORS = ['#ff4d4f', '#faad14', '#52c41a'];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const columns = [
    { title: 'Transaction ID', dataIndex: 'id', key: 'id' },
    { title: 'Account', dataIndex: 'account', key: 'account' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (val) => `$${val.toFixed(2)}` },
    {
      title: 'Risk Level',
      dataIndex: 'risk',
      key: 'risk',
      render: (risk) => (
        <Tag color={risk === 'High' ? 'red' : risk === 'Medium' ? 'orange' : 'green'}>
          {risk}
        </Tag>
      ),
    },
    { title: 'Date', dataIndex: 'date', key: 'date' },
  ];

  const recentTransactions = [
    { id: 'TXN001', account: 'ACC-4521', amount: 15234.50, risk: 'High', date: '2026-04-07' },
    { id: 'TXN002', account: 'ACC-3312', amount: 2340.00, risk: 'Medium', date: '2026-04-07' },
    { id: 'TXN003', account: 'ACC-7789', amount: 890.25, risk: 'Low', date: '2026-04-06' },
    { id: 'TXN004', account: 'ACC-1122', amount: 45200.00, risk: 'High', date: '2026-04-06' },
    { id: 'TXN005', account: 'ACC-5544', amount: 1250.75, risk: 'Low', date: '2026-04-05' },
  ];

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Accounts" value={1248} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Flagged Transactions" value={85} prefix={<AlertOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Total Volume" value={2450000} prefix="$" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Risk Score" value={72} prefix={<RiseOutlined />} suffix="/ 100" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Transaction Trend">
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
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Risk Distribution">
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
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="Recent Flagged Transactions" style={{ marginTop: 16 }}>
        <Table columns={columns} dataSource={recentTransactions} rowKey="id" pagination={false} />
      </Card>
    </div>
  );
}
