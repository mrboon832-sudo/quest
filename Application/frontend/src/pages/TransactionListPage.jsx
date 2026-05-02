import React, { useState, useEffect } from 'react';
import { Table, Tag, Input, Card, Space, Button, Spin, message, Popconfirm } from 'antd';
import { SearchOutlined, FlagOutlined, ReloadOutlined } from '@ant-design/icons';
import { transactionService } from '../services/api';

const { Search } = Input;

export default function TransactionListPage() {
  const [searchText, setSearchText] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flaggingId, setFlaggingId] = useState(null);

  // Fetch transactions on component mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionService.getAll({ limit: 100 });
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      message.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleFlagTransaction = async (transactionId) => {
    setFlaggingId(transactionId);
    try {
      await transactionService.flagTransaction(transactionId);
      message.success('Transaction flagged as suspicious');
      // Refresh the transaction list to show updated risk level
      await fetchTransactions();
    } catch (error) {
      console.error('Error flagging transaction:', error);
      message.error('Failed to flag transaction');
    } finally {
      setFlaggingId(null);
    }
  };

  const columns = [
    { 
      title: 'Transaction ID', 
      dataIndex: 'id', 
      key: 'id', 
      sorter: (a, b) => a.id.localeCompare(b.id),
      width: '15%'
    },
    { 
      title: 'From Account', 
      dataIndex: 'fromAccount', 
      key: 'fromAccount',
      width: '15%'
    },
    { 
      title: 'To Account', 
      dataIndex: 'toAccount', 
      key: 'toAccount',
      width: '15%'
    },
    { 
      title: 'Amount', 
      dataIndex: 'amount', 
      key: 'amount', 
      render: (val) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
      sorter: (a, b) => a.amount - b.amount,
      width: '12%'
    },
    { 
      title: 'Date', 
      dataIndex: 'date', 
      key: 'date', 
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      width: '15%'
    },
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
      render: (risk) => {
        const color = risk === 'High' ? 'red' : risk === 'Medium' ? 'orange' : 'green';
        return <Tag color={color}>{risk}</Tag>;
      },
      width: '12%'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'Flagged' ? 'red' : status === 'Under Review' ? 'orange' : 'green';
        return <Tag color={color}>{status}</Tag>;
      },
      width: '12%'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="Flag Transaction"
          description="Are you sure you want to flag this transaction as suspicious?"
          onConfirm={() => handleFlagTransaction(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button 
            type="primary" 
            danger 
            size="small" 
            icon={<FlagOutlined />}
            loading={flaggingId === record.id}
            disabled={record.risk === 'High' || flaggingId !== null}
          >
            Flag
          </Button>
        </Popconfirm>
      ),
      width: '8%'
    },
  ];

  const filteredData = transactions.filter(
    (item) =>
      item.id.toLowerCase().includes(searchText.toLowerCase()) ||
      item.fromAccount.toLowerCase().includes(searchText.toLowerCase()) ||
      item.toAccount.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return (
      <Card title="Transaction List">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Spin size="large" tip="Loading transactions..." />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Transaction List"
      extra={
        <Button icon={<ReloadOutlined />} onClick={fetchTransactions} loading={loading}>
          Refresh
        </Button>
      }
    >
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
      <Table 
        columns={columns} 
        dataSource={filteredData.map((item, idx) => ({ ...item, key: idx }))} 
        pagination={{ pageSize: 10 }} 
        loading={loading}
      />
    </Card>
  );
}
