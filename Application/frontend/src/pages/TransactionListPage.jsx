import React, { useState } from 'react';
import { Table, Tag, Input, Select, Card, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Search } = Input;

const dataSource = [
  { key: '1', id: 'TXN001', fromAccount: 'ACC-4521', toAccount: 'MERCH-881', amount: 15234.50, date: '2026-04-07', risk: 'High', status: 'Flagged' },
  { key: '2', id: 'TXN002', fromAccount: 'ACC-3312', toAccount: 'MERCH-223', amount: 2340.00, date: '2026-04-07', risk: 'Medium', status: 'Under Review' },
  { key: '3', id: 'TXN003', fromAccount: 'ACC-7789', toAccount: 'MERCH-445', amount: 890.25, date: '2026-04-06', risk: 'Low', status: 'Cleared' },
  { key: '4', id: 'TXN004', fromAccount: 'ACC-1122', toAccount: 'MERCH-881', amount: 45200.00, date: '2026-04-06', risk: 'High', status: 'Flagged' },
  { key: '5', id: 'TXN005', fromAccount: 'ACC-5544', toAccount: 'MERCH-667', amount: 1250.75, date: '2026-04-05', risk: 'Low', status: 'Cleared' },
  { key: '6', id: 'TXN006', fromAccount: 'ACC-9988', toAccount: 'MERCH-223', amount: 8750.00, date: '2026-04-05', risk: 'Medium', status: 'Under Review' },
  { key: '7', id: 'TXN007', fromAccount: 'ACC-2233', toAccount: 'MERCH-445', amount: 32100.00, date: '2026-04-04', risk: 'High', status: 'Flagged' },
  { key: '8', id: 'TXN008', fromAccount: 'ACC-6677', toAccount: 'MERCH-881', amount: 540.00, date: '2026-04-04', risk: 'Low', status: 'Cleared' },
];

const columns = [
  { title: 'Transaction ID', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id.localeCompare(b.id) },
  { title: 'From Account', dataIndex: 'fromAccount', key: 'fromAccount' },
  { title: 'To Account', dataIndex: 'toAccount', key: 'toAccount' },
  { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (val) => `$${val.toLocaleString()}`, sorter: (a, b) => a.amount - b.amount },
  { title: 'Date', dataIndex: 'date', key: 'date', sorter: (a, b) => new Date(a.date) - new Date(b.date) },
  {
    title: 'Risk Level',
    dataIndex: 'risk',
    key: 'risk',
    filters: [
      { text: 'High', value: 'High' },
      { text: 'Medium', value: 'Medium' },
      { text: 'Low', value: 'Low' },
    ],
    onFilter: (value, record) => record.risk === value,
    render: (risk) => (
      <Tag color={risk === 'High' ? 'red' : risk === 'Medium' ? 'orange' : 'green'}>{risk}</Tag>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status) => (
      <Tag color={status === 'Flagged' ? 'red' : status === 'Under Review' ? 'orange' : 'green'}>
        {status}
      </Tag>
    ),
  },
];

export default function TransactionListPage() {
  const [searchText, setSearchText] = useState('');

  const filteredData = dataSource.filter(
    (item) =>
      item.id.toLowerCase().includes(searchText.toLowerCase()) ||
      item.fromAccount.toLowerCase().includes(searchText.toLowerCase()) ||
      item.toAccount.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Card title="Transaction List">
      <Space style={{ marginBottom: 16 }}>
        <Search
          placeholder="Search by Transaction ID or Account"
          allowClear
          enterButton={<SearchOutlined />}
          style={{ width: 400 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </Space>
      <Table columns={columns} dataSource={filteredData} pagination={{ pageSize: 10 }} />
    </Card>
  );
}
