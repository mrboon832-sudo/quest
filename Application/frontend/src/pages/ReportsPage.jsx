import React from 'react';
import { Card, Row, Col, Table, Button, Space } from 'antd';
import { DownloadOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const monthlyReportData = [
  { month: 'Oct', fraudCases: 12, prevented: 10, loss: 45000 },
  { month: 'Nov', fraudCases: 18, prevented: 15, loss: 62000 },
  { month: 'Dec', fraudCases: 25, prevented: 22, loss: 78000 },
  { month: 'Jan', fraudCases: 22, prevented: 19, loss: 71000 },
  { month: 'Feb', fraudCases: 28, prevented: 25, loss: 89000 },
  { month: 'Mar', fraudCases: 32, prevented: 30, loss: 95000 },
];

const reportHistory = [
  { key: '1', name: 'Monthly Fraud Report - March 2026', date: '2026-04-01', type: 'PDF', status: 'Generated' },
  { key: '2', name: 'Monthly Fraud Report - February 2026', date: '2026-03-01', type: 'PDF', status: 'Generated' },
  { key: '3', name: 'Q1 2026 Risk Summary', date: '2026-04-02', type: 'Excel', status: 'Generated' },
  { key: '4', name: 'Account Risk Assessment', date: '2026-04-05', type: 'PDF', status: 'Pending' },
];

const columns = [
  { title: 'Report Name', dataIndex: 'name', key: 'name' },
  { title: 'Generated Date', dataIndex: 'date', key: 'date' },
  { title: 'Type', dataIndex: 'type', key: 'type' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <Button icon={<DownloadOutlined />} size="small" disabled={record.status === 'Pending'}>
        Download
      </Button>
    ),
  },
];

export default function ReportsPage() {
  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Fraud Cases vs Prevented">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyReportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="fraudCases" stroke="#ff4d4f" strokeWidth={2} name="Fraud Cases" />
                <Line type="monotone" dataKey="prevented" stroke="#52c41a" strokeWidth={2} name="Prevented" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Monthly Financial Loss">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyReportData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Area type="monotone" dataKey="loss" stroke="#1677ff" fill="#1677ff" fillOpacity={0.3} name="Loss ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="Report History" style={{ marginTop: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<FilePdfOutlined />}>Generate PDF Report</Button>
          <Button icon={<FileExcelOutlined />}>Generate Excel Report</Button>
        </Space>
        <Table columns={columns} dataSource={reportHistory} pagination={false} />
      </Card>
    </div>
  );
}
