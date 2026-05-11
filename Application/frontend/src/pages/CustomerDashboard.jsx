import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Table, Tag, Modal, Input, message, Spin } from 'antd';
import { DollarOutlined, ArrowDownOutlined, ArrowUpOutlined, SwapOutlined } from '@ant-design/icons';
import { accountService } from '../services/api';

const RISK_COLORS = {
  'High': '#ff4d4f',
  'Medium': '#faad14',
  'Low': '#52c41a',
};

export default function CustomerDashboard() {
  const [loading, setLoading] = useState(true);
  const [accountBalance, setAccountBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [depositModal, setDepositModal] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transactionLoading, setTransactionLoading] = useState(false);

  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        // Get account balance
        const balanceData = await accountService.getBalance();
        setAccountBalance(balanceData.balance || 1000);
        
        // Get recent transactions
        const transactions = await accountService.getRecentTransactions(5);
        setRecentTransactions(transactions);
      } catch (error) {
        console.error('Error fetching customer data:', error);
        message.error('Failed to load account data');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      message.error('Please enter a valid amount');
      return;
    }

    setTransactionLoading(true);
    try {
      const result = await accountService.deposit(parseFloat(depositAmount));
      setAccountBalance(result.newBalance);
      message.success(`Deposit successful! New balance: M${result.newBalance.toFixed(2)}`);
      setDepositAmount('');
      setDepositModal(false);
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || amount <= 0) {
      message.error('Please enter a valid amount');
      return;
    }

    if (amount > accountBalance) {
      message.error('Insufficient funds');
      return;
    }

    setTransactionLoading(true);
    try {
      const result = await accountService.withdraw(amount);
      setAccountBalance(result.newBalance);
      message.success(`Withdrawal successful! New balance: M${result.newBalance.toFixed(2)}`);
      setWithdrawAmount('');
      setWithdrawModal(false);
    } catch (error) {
      console.error('Withdrawal failed:', error);
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferAmount || !transferTo || parseFloat(transferAmount) <= 0) {
      message.error('Please enter valid transfer details');
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount > accountBalance) {
      message.error('Insufficient funds');
      return;
    }

    setTransactionLoading(true);
    try {
      const result = await accountService.transfer(transferTo, amount);
      setAccountBalance(result.newBalance);
      
      message.success(`Transfer of M${amount.toFixed(2)} sent to ${transferTo}! New balance: M${result.newBalance.toFixed(2)}`);
      setTransferAmount('');
      setTransferTo('');
      setTransferModal(false);
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setTransactionLoading(false);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: '20%',
      render: (date) => {
        if (!date) return '-';
        try {
          return new Date(date).toLocaleDateString();
        } catch {
          return date;
        }
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '15%',
      render: (type) => {
        let color = 'blue';
        if (type === 'Deposit') color = 'green';
        else if (type === 'Withdrawal') color = 'red';
        return <Tag color={color}>{type || 'Payment'}</Tag>;
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '35%',
      render: (desc) => desc || '-',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: '20%',
      align: 'right',
      render: (amount) => (
        <span style={{ fontWeight: 'bold' }}>
          M{typeof amount === 'number' ? amount.toFixed(2) : amount}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '10%',
      render: (status) => (
        <Tag color={status === 'Completed' ? 'green' : 'orange'}>
          {status || 'Pending'}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }} />;
  }

  return (
    <div className="customer-dashboard">
      {/* Account Balance Card */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Card style={{ backgroundColor: '#1677ff', color: '#fff', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '14px', marginBottom: '10px', opacity: 0.9 }}>Current Balance</div>
              <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '20px' }}>
                M{accountBalance.toFixed(2)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <Button 
                  type="primary" 
                  size="large"
                  style={{ backgroundColor: '#fff', color: '#1677ff', borderColor: '#fff' }}
                  icon={<ArrowDownOutlined />}
                  onClick={() => setDepositModal(true)}
                >
                  Deposit
                </Button>
                <Button 
                  type="primary"
                  size="large"
                  style={{ backgroundColor: '#fff', color: '#1677ff', borderColor: '#fff' }}
                  icon={<ArrowUpOutlined />}
                  onClick={() => setWithdrawModal(true)}
                >
                  Withdraw
                </Button>
                <Button 
                  type="primary"
                  size="large"
                  style={{ backgroundColor: '#fff', color: '#1677ff', borderColor: '#fff' }}
                  icon={<SwapOutlined />}
                  onClick={() => setTransferModal(true)}
                >
                  Transfer
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Transactions */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card 
            title="Recent Transactions" 
            style={{ borderRadius: '8px' }}
            extra={
              recentTransactions.length > 0 ? (
                <span style={{ fontSize: '12px', color: '#999' }}>
                  {recentTransactions.length} recent transaction{recentTransactions.length !== 1 ? 's' : ''}
                </span>
              ) : null
            }
          >
            {recentTransactions.length > 0 ? (
              <Table 
                columns={columns} 
                dataSource={recentTransactions.map((t, idx) => ({ ...t, key: idx }))}
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                No transactions yet. Start by making a deposit or transfer!
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Deposit Modal */}
      <Modal
        title="Deposit Money"
        open={depositModal}
        onOk={handleDeposit}
        onCancel={() => setDepositModal(false)}
        confirmLoading={transactionLoading}
        okText="Deposit"
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Amount (LSL)
          </label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            prefix="M"
            step="0.01"
            min="0"
            disabled={transactionLoading}
            size="large"
          />
        </div>
        <div style={{ color: '#999', fontSize: '12px' }}>
          Current balance: M{accountBalance.toFixed(2)}
        </div>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        title="Withdraw Money"
        open={withdrawModal}
        onOk={handleWithdraw}
        onCancel={() => setWithdrawModal(false)}
        confirmLoading={transactionLoading}
        okText="Withdraw"
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Amount (LSL)
          </label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            prefix="M"
            step="0.01"
            min="0"
            disabled={transactionLoading}
            size="large"
          />
        </div>
        <div style={{ color: '#999', fontSize: '12px' }}>
          Available balance: M{accountBalance.toFixed(2)}
        </div>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        title="Transfer Money"
        open={transferModal}
        onOk={handleTransfer}
        onCancel={() => setTransferModal(false)}
        confirmLoading={transactionLoading}
        okText="Send Transfer"
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Amount (LSL)
          </label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            prefix="M"
            step="0.01"
            min="0"
            disabled={transactionLoading}
            size="large"
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Transfer To (Account/Email)
          </label>
          <Input
            type="text"
            placeholder="Enter recipient account or email"
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
            disabled={transactionLoading}
            size="large"
          />
        </div>
        <div style={{ color: '#999', fontSize: '12px' }}>
          Available balance: M{accountBalance.toFixed(2)}
        </div>
      </Modal>
    </div>
  );
}
