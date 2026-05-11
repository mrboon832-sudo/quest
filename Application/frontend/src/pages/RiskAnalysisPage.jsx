import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Progress,
  Table,
  Button,
  Space,
  Tag,
  Statistic,
  Timeline,
  Spin,
  message,
  Empty,
} from 'antd';
import { ArrowLeftOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { transactionService } from '../services/api'; // FIXED: Use real API service

const RiskAnalysisPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [riskData, setRiskData] = useState(null);

  useEffect(() => {
    const fetchRealAnalysis = async () => {
      setLoading(true);
      try {
        // FETCH REAL DATA FROM NEO4J VIA BACKEND
        const data = await transactionService.getAnalysis(id);
        setRiskData(data);
      } catch (error) {
        console.error('Error fetching analysis:', error);
        message.error('Transaction analysis not found in database');
        setRiskData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRealAnalysis();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Querying Neo4j Graph..." />
      </div>
    );
  }

  if (!riskData) {
    return <Empty description="No real database record found for this Transaction ID" />;
  }

  const auditColumns = [
    { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
    { title: 'Action', dataIndex: 'action', key: 'action', width: 200 },
    { title: 'Details', dataIndex: 'details', key: 'details' },
  ];

  const getRiskColor = (riskScore) => {
    if (riskScore >= 70) return '#ff4d4f';
    if (riskScore >= 40) return '#faad14';
    return '#52c41a';
  };

  const getRiskLabel = (riskScore) => {
    if (riskScore >= 70) return 'HIGH RISK';
    if (riskScore >= 40) return 'MEDIUM RISK';
    return 'LOW RISK';
  };

  return (
    <div>
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        Back
      </Button>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <h2 style={{ margin: 0, marginBottom: 8 }}>Transaction ID: {riskData.id}</h2>
            <p style={{ color: '#8c8c8c', margin: 0 }}>Account: {riskData.account || 'Linked'}</p>
          </Col>
          <Col xs={24} sm={12} md={16}>
            <Row justify="space-around">
              <Col>
                <Statistic
                  title="Amount"
                  value={riskData.amount}
                  prefix="M"
                  valueStyle={{ color: '#1677ff' }}
                />
              </Col>
              <Col>
                <Statistic
                  title="Status"
                  value={riskData.status}
                  valueStyle={{ 
                    color: riskData.status === 'Flagged' ? '#ff4d4f' : '#52c41a'
                  }}
                />
              </Col>
              <Col>
                <Statistic
                  title="Date"
                  value={riskData.date}
                  valueStyle={{ fontSize: 14 }}
                />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Real-time Risk Score">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress 
                type="circle" 
                percent={riskData.risk}
                strokeColor={getRiskColor(riskData.risk)}
                width={150}
              />
              <div style={{ marginTop: 16 }}>
                <Tag color={riskData.risk >= 70 ? 'red' : riskData.risk >= 40 ? 'orange' : 'green'}>
                  {getRiskLabel(riskData.risk)}
                </Tag>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title="Graph Risk Factors">
            <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
              <p><strong>Node Analysis:</strong></p>
              <p>This transaction is linked in Neo4j to: <strong>Account $\rightarrow$ Device $\rightarrow$ Location</strong>.</p>
              <p>The risk score is dynamically computed based on the relationships between these nodes.</p>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Transaction Timeline" style={{ marginTop: 16 }}>
        <Timeline
          items={riskData.timelineEvents?.map(event => ({
            dot: <ExclamationCircleOutlined style={{ fontSize: 16 }} />,
            color: event.status === 'error' ? 'red' : event.status === 'warning' ? 'orange' : 'green',
            children: (
              <div>
                <p style={{ fontWeight: 600 }}>{event.title}</p>
                <p style={{ color: '#8c8c8c', marginBottom: 0 }}>{event.description}</p>
              </div>
            ),
          })) || []}
        />
      </Card>

      <Card title="Neo4j Audit Logs" style={{ marginTop: 16 }}>
        <Table
          columns={auditColumns}
          dataSource={riskData.auditLogs || []}
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
        />
      </Card>

      <Card style={{ marginTop: 16 }} title="Admin Actions">
        <Space>
          <Button type="primary" danger>Block Account</Button>
          <Button type="default">Approve Transaction</Button>
          <Button type="default">Request Verification</Button>
          <Button type="default">Whitelist Account</Button>
        </Space>
      </Card>
    </div>
  );
};

export default RiskAnalysisPage;
