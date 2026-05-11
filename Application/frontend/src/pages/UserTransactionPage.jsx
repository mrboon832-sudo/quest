import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Form, 
  Input, 
  Button, 
  Select, 
  Table, 
  Modal, 
  message, 
  Steps, 
  Statistic,
  Space,
  Tag,
  Alert,
  Spin,
  Empty
} from 'antd';
import { 
  SendOutlined, 
  DollarOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined 
} from '@ant-design/icons';
import { transactionService, accountService } from '../services/api';
import './UserTransactionPage.css';

const RISK_COLORS = {
  'High': '#ff4d4f',
  'Medium': '#faad14',
  'Low': '#52c41a',
};

export default function UserTransactionPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmModal, setConfirmModal] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [transactionHistory, setTransactionHistory] = useState([]);

  // Form state
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState('transfer');

  useEffect(() => {
    const fetchData = async () => {
      setPageLoading(true);
      try {
        // Fetch account balance
        const balanceData = await accountService.getBalance();
        setBalance(balanceData.balance || 0);

        // Fetch recent transactions
        const recentTxns = await accountService.getRecentTransactions(10);
        setTransactionHistory(recentTxns);
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Failed to load account information');
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmitTransaction = async (values) => {
    // Validate inputs
    const parsedAmount = parseFloat(values.amount);
    if (!values.recipientEmail || !values.amount || parsedAmount <= 0) {
      message.error('Please fill in all required fields with valid values');
      return;
    }

    if (parsedAmount > balance) {
      message.error('Insufficient balance for this transaction');
      return;
    }

    // Set transaction details for confirmation
    setTransactionDetails({
      recipient: values.recipientEmail,
      amount: parsedAmount,
      description: values.description,
      type: values.transactionType || 'transfer',
      timestamp: new Date(),
    });

    setCurrentStep(1);
    setConfirmModal(true);
  };

  const handleConfirmTransaction = async () => {
    setLoading(true);
    try {
      const txnData = {
        recipientEmail: transactionDetails.recipient,
        amount: transactionDetails.amount,
        description: transactionDetails.description,
        type: transactionDetails.type,
      };

      // Send transaction
      const result = await transactionService.createTransaction(txnData);

      // Update balance
      const newBalance = await accountService.getBalance();
      setBalance(newBalance.balance);

      // Add to history
      setTransactionHistory([
        {
          id: result.id || `TXN${Date.now()}`,
          date: new Date(),
          type: transactionDetails.type,
          recipient: transactionDetails.recipient,
          amount: transactionDetails.amount,
          description: transactionDetails.description,
          status: 'Completed',
          risk: 'Low',
        },
        ...transactionHistory,
      ]);

      setCurrentStep(2);
      message.success('Transaction completed successfully!');

      // Reset form
      setTimeout(() => {
        form.resetFields();
        setRecipientEmail('');
        setAmount('');
        setDescription('');
        setTransactionType('transfer');
        setConfirmModal(false);
        setCurrentStep(0);
        setTransactionDetails(null);
      }, 2000);
    } catch (error) {
      console.error('Transaction failed:', error);
      message.error(error.response?.data?.message || 'Transaction failed. Please try again.');
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setConfirmModal(false);
    setCurrentStep(0);
    setTransactionDetails(null);
  };

  // Columns for transaction history table
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: '15%',
      render: (date) => {
        if (!date) return '-';
        try {
          return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
        } catch {
          return date;
        }
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '12%',
      render: (type) => {
        const colors = {
          'transfer': 'blue',
          'payment': 'cyan',
          'deposit': 'green',
          'withdrawal': 'red',
        };
        return <Tag color={colors[type] || 'blue'}>{type || 'Transfer'}</Tag>;
      },
    },
    {
      title: 'Recipient / Sender',
      dataIndex: 'recipient',
      key: 'recipient',
      width: '25%',
      render: (recipient) => <span>{recipient || '-'}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '25%',
      render: (description) => description || 'No description',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: '12%',
      align: 'right',
      render: (amount) => (
        <span style={{ fontWeight: 'bold', color: '#1677ff' }}>
          M{typeof amount === 'number' ? amount.toFixed(2) : amount}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '11%',
      render: (status) => {
        const statusConfig = {
          'Completed': { color: 'green', icon: <CheckCircleOutlined /> },
          'Pending': { color: 'orange', icon: <ClockCircleOutlined /> },
          'Failed': { color: 'red', icon: <ExclamationCircleOutlined /> },
        };
        const config = statusConfig[status] || { color: 'default', icon: <ClockCircleOutlined /> };
        return (
          <Tag color={config.color} icon={config.icon}>
            {status || 'Pending'}
          </Tag>
        );
      },
    },
  ];

  if (pageLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '500px' }}>
        <Spin size="large" tip="Loading transaction page..." />
      </div>
    );
  }

  return (
    <div className="user-transaction-page">
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {/* Balance Card */}
        <Col xs={24} sm={12} md={8}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              borderRadius: '8px'
            }}
            bordered={false}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Available Balance</span>}
              value={balance}
              precision={2}
              prefix="M"
              valueStyle={{ color: '#fff', fontSize: '32px' }}
            />
          </Card>
        </Col>

        {/* Quick Stats */}
        <Col xs={24} sm={12} md={8}>
          <Card style={{ borderRadius: '8px' }}>
            <Statistic
              title="Today's Transactions"
              value={transactionHistory.filter(t => {
                const txnDate = new Date(t.date).toDateString();
                return txnDate === new Date().toDateString();
              }).length}
              prefix={<SendOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <Card style={{ borderRadius: '8px' }}>
            <Statistic
              title="Total Transactions"
              value={transactionHistory.length}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Send Money Form */}
      <Card 
        title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>Send Money</span>}
        style={{ borderRadius: '8px', marginBottom: '24px' }}
      >
        <Alert
          message="Security Notice"
          description="Transactions are monitored for suspicious activity. Large transfers may be flagged for manual review."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitTransaction}
          style={{ maxWidth: '600px' }}
        >
          <Form.Item
            label="Transaction Type"
            name="transactionType"
            initialValue="transfer"
            rules={[{ required: true, message: 'Please select transaction type' }]}
          >
            <Select
              options={[
                { label: 'Transfer', value: 'transfer' },
                { label: 'Payment', value: 'payment' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Recipient Email / Account"
            name="recipientEmail"
            rules={[
              { required: true, message: 'Please enter recipient email or account' },
              { 
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$|^account\d+$/,
                message: 'Please enter a valid email or account number (e.g., account1)'
              },
            ]}
          >
            <Input
              placeholder="recipient@email.com or account1"
              size="large"
              prefix={<ArrowRightOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="Amount (LSL)"
            name="amount"
            rules={[
              { required: true, message: 'Please enter amount' },
              {
                validator: (_, value) => {
                  const num = parseFloat(value);
                  if (isNaN(num) || num <= 0) {
                    return Promise.reject(new Error('Please enter a valid amount'));
                  }
                  if (num > balance) {
                    return Promise.reject(new Error(`Insufficient balance. Available: M${balance.toFixed(2)}`));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              type="number"
              placeholder="0.00"
              size="large"
              prefix="M"
              step="0.01"
              min="0"
            />
          </Form.Item>

          <Form.Item
            label="Description (Optional)"
            name="description"
          >
            <Input.TextArea
              placeholder="Add a note for this transaction (optional)"
              rows={3}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              style={{ width: '100%', fontSize: '16px', height: '44px' }}
              loading={loading}
            >
              <SendOutlined /> Send Money
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Transaction History */}
      <Card 
        title={<span style={{ fontSize: '18px', fontWeight: 'bold' }}>Transaction History</span>}
        style={{ borderRadius: '8px' }}
      >
        {transactionHistory.length > 0 ? (
          <Table
            columns={columns}
            dataSource={transactionHistory.map((t, idx) => ({ ...t, key: idx }))}
            pagination={{ pageSize: 10, total: transactionHistory.length }}
            scroll={{ x: 1000 }}
          />
        ) : (
          <Empty
            description="No transactions yet"
            style={{ marginTop: '24px', marginBottom: '24px' }}
          >
            <Button type="primary" onClick={() => form.submit()}>
              Make Your First Transaction
            </Button>
          </Empty>
        )}
      </Card>

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Transaction"
        open={confirmModal}
        onOk={handleConfirmTransaction}
        onCancel={handleCancel}
        width={500}
        confirmLoading={loading}
        okText="Confirm & Send"
        cancelText={currentStep === 2 ? 'Done' : 'Cancel'}
        closable={currentStep !== 2}
      >
        {transactionDetails && (
          <div>
            <Steps
              current={currentStep}
              items={[
                { title: 'Review', description: 'Transaction details' },
                { title: 'Processing', description: 'Sending...' },
                { title: 'Complete', description: 'Success!' },
              ]}
              style={{ marginBottom: '24px' }}
            />

            {currentStep === 0 && (
              <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#8c8c8c' }}>Recipient:</span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{transactionDetails.recipient}</div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#8c8c8c' }}>Amount:</span>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1677ff' }}>
                    M{transactionDetails.amount.toFixed(2)}
                  </div>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ color: '#8c8c8c' }}>Type:</span>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {transactionDetails.type.charAt(0).toUpperCase() + transactionDetails.type.slice(1)}
                  </div>
                </div>
                {transactionDetails.description && (
                  <div>
                    <span style={{ color: '#8c8c8c' }}>Description:</span>
                    <div style={{ fontSize: '14px' }}>{transactionDetails.description}</div>
                  </div>
                )}
                <div style={{ marginTop: '16px', padding: '12px', background: '#fff7e6', borderRadius: '4px', borderLeft: '4px solid #faad14' }}>
                  <span style={{ color: '#8c8c8c', fontSize: '12px' }}>New Balance after transaction:</span>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1677ff' }}>
                    M{(balance - transactionDetails.amount).toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <Spin size="large" />
                <p style={{ marginTop: '16px', color: '#8c8c8c' }}>Processing your transaction...</p>
              </div>
            )}

            {currentStep === 2 && (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <CheckCircleOutlined style={{ fontSize: '64px', color: '#52c41a' }} />
                <p style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '16px' }}>Transaction Successful!</p>
                <p style={{ color: '#8c8c8c' }}>
                  M{transactionDetails.amount.toFixed(2)} has been sent to {transactionDetails.recipient}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
