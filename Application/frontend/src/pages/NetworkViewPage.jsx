import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import { Card, Spin, message, Empty, Tabs, Table, Divider } from 'antd';
import { networkService } from '../services/api';
import 'reactflow/dist/style.css';

const RISK_COLORS = {
  'High': '#ff4d4f',
  'Medium': '#faad14',
  'Low': '#52c41a',
  'Unknown': '#999',
};

// Helper function to position nodes in a circular layout
const getNodePosition = (index, total) => {
  const angle = (index / total) * 2 * Math.PI;
  const radius = Math.min(300, total > 10 ? 400 : 250);
  return {
    x: Math.cos(angle) * radius + 500,
    y: Math.sin(angle) * radius + 300,
  };
};

export default function NetworkViewPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState({ nodes: [], edges: [] });

  useEffect(() => {
    const fetchNetworkData = async () => {
      setLoading(true);
      try {
        const data = await networkService.getFraudNetwork();
        setRawData(data);
        
        if (!data.nodes || data.nodes.length === 0) {
          message.info('No fraud network data available');
          setLoading(false);
          return;
        }

        // Transform nodes with proper styling
        const transformedNodes = data.nodes.map((node, idx) => {
          const riskLevel = node.riskLevel || 'Unknown';
          const color = RISK_COLORS[riskLevel];
          
          // Format device information
          const deviceInfo = (node.devices || [])
            .filter(d => d.deviceId)
            .map(d => `${d.deviceType} (${d.os}, ${d.ipAddress})`)
            .join('\n');
          
          // Create detailed label
          const shortLabel = node.label.split('\n')[0]; // Just the customer name
          
          return {
            id: node.id,
            data: { 
              label: shortLabel,
            },
            position: getNodePosition(idx, data.nodes.length),
            style: {
              background: color,
              color: '#fff',
              border: `3px solid ${color}`,
              borderRadius: '8px',
              width: 120,
              height: 'auto',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
              textAlign: 'center',
              whiteSpace: 'normal',
              wordWrap: 'break-word',
            },
            selectable: true,
            focusable: true,
            fullData: node, // Store complete data
          };
        });

        // Transform edges with risk-based coloring
        const transformedEdges = data.edges.map((edge, idx) => {
          const edgeColor = RISK_COLORS[edge.riskLevel] || '#999';
          const shortLabel = `$${edge.amount}\n${(edge.riskScore * 100).toFixed(0)}%`;
          
          return {
            id: `edge-${idx}-${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
            label: shortLabel,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: {
              stroke: edgeColor,
              strokeWidth: 3,
            },
            fullData: edge, // Store complete edge data
          };
        });

        setNodes(transformedNodes);
        setEdges(transformedEdges);
      } catch (error) {
        console.error('Error fetching fraud network:', error);
        message.error('Failed to load fraud network data');
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkData();
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => [...eds, { ...params, label: 'New' }]),
    [setEdges],
  );

  // Prepare transaction details for table
  const transactionColumns = [
    {
      title: 'Transaction ID',
      dataIndex: ['fullData', 'transactionId'],
      key: 'transactionId',
      width: 130,
      render: (id) => <span style={{ fontSize: '12px' }}>{id}</span>,
    },
    {
      title: 'Amount',
      dataIndex: ['fullData', 'amount'],
      key: 'amount',
      render: (amount, record) => {
        const currency = record.fullData?.currency || 'USD';
        return <strong>${amount} {currency}</strong>;
      },
    },
    {
      title: 'From Account',
      dataIndex: ['fullData', 'sourceAccount'],
      key: 'sourceAccount',
      render: (acc) => <span style={{ fontSize: '11px' }}>{acc}</span>,
    },
    {
      title: 'To Account',
      dataIndex: ['fullData', 'targetAccount'],
      key: 'targetAccount',
      render: (acc) => <span style={{ fontSize: '11px' }}>{acc}</span>,
    },
    {
      title: 'Risk Score',
      dataIndex: ['fullData', 'riskScore'],
      key: 'riskScore',
      render: (risk) => {
        const riskLevel = risk > 0.7 ? 'High' : risk > 0.4 ? 'Medium' : 'Low';
        return <span style={{ color: RISK_COLORS[riskLevel], fontWeight: 'bold' }}>{(risk * 100).toFixed(0)}%</span>;
      },
    },
    {
      title: 'Flagged',
      dataIndex: ['fullData', 'isFlagged'],
      key: 'isFlagged',
      render: (flagged) => flagged ? <span style={{ color: '#ff4d4f' }}>🚩 Yes</span> : 'No',
    },
  ];

  // Prepare customer details for table
  const customerColumns = [
    {
      title: 'Customer ID',
      dataIndex: 'id',
      key: 'id',
      width: 130,
      render: (id) => <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{id}</span>,
    },
    {
      title: 'Name',
      dataIndex: ['fullData', 'label'],
      key: 'name',
      render: (label) => label.split('\n')[0],
    },
    {
      title: 'Account',
      dataIndex: ['fullData', 'account'],
      key: 'account',
      render: (acc) => <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{acc}</span>,
    },
    {
      title: 'Risk Level',
      dataIndex: ['fullData', 'riskLevel'],
      key: 'riskLevel',
      render: (risk) => (
        <span style={{ 
          color: RISK_COLORS[risk],
          fontWeight: 'bold',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: RISK_COLORS[risk] + '20'
        }}>
          {risk}
        </span>
      ),
    },
    {
      title: 'Devices Used',
      dataIndex: ['fullData', 'devices'],
      key: 'devices',
      render: (devices) => {
        if (!devices || devices.length === 0) return 'None';
        return (
          <div>
            {devices.map((d, idx) => (
              d.deviceId && (
                <div key={idx} style={{ fontSize: '11px', marginBottom: '4px' }}>
                  <strong>{d.deviceType}</strong> ({d.os})<br />
                  <span style={{ color: '#666', fontSize: '10px' }}>IP: {d.ipAddress}</span>
                  {d.isFlagged && <span style={{ color: '#ff4d4f', marginLeft: '4px' }}>🚩</span>}
                </div>
              )
            ))}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Card title="🔗 Fraud Network Visualization">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 600 }}>
          <Spin size="large" tip="Loading fraud network data..." />
        </div>
      </Card>
    );
  }

  if (nodes.length === 0) {
    return (
      <Card title="🔗 Fraud Network Visualization">
        <Empty 
          description="No fraud network data available" 
          style={{ marginTop: '100px' }}
        />
      </Card>
    );
  }

  const tabItems = [
    {
      key: 'network',
      label: `📊 Network Graph (${nodes.length} customers)`,
      children: (
        <div style={{ height: 700, border: '1px solid #f0f0f0', borderRadius: '4px', background: '#fafafa' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
          >
            <MiniMap 
              style={{
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd'
              }} 
            />
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      ),
    },
    {
      key: 'transactions',
      label: `💳 Transactions (${edges.length} high-risk)`,
      children: (
        <div>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#e6f7ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
            <strong>📋 High-Risk Transaction Details</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
              Showing {edges.length} transactions with risk score &gt; 60% or flagged
            </p>
          </div>
          <Table
            columns={transactionColumns}
            dataSource={edges}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
            size="small"
            bordered
          />
        </div>
      ),
    },
    {
      key: 'customers',
      label: `👥 Customer Details (${nodes.length} customers)`,
      children: (
        <div>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
            <strong>👤 Customer & Device Information</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
              Showing all customers involved in fraud network with their accounts and devices
            </p>
          </div>
          <Table
            columns={customerColumns}
            dataSource={nodes}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
            size="small"
            bordered
          />
        </div>
      ),
    },
  ];

  return (
    <Card 
      title="🔗 Fraud Network Visualization - Enhanced" 
      extra={
        <span style={{ fontSize: '12px' }}>
          🔴 High Risk | 🟠 Medium Risk | 🟢 Low Risk
        </span>
      }
    >
      <div style={{ marginBottom: '20px', padding: '12px', background: '#fef3c7', borderRadius: '4px', border: '1px solid #fcd34d' }}>
        <strong>📊 Network Summary:</strong>
        <ul style={{ margin: '8px 0 0 16px', fontSize: '13px' }}>
          <li>{nodes.length} customer(s) connected through fraud network</li>
          <li>{edges.length} high-risk transaction(s) detected</li>
          <li>Total transaction volume: ${edges.reduce((sum, e) => sum + (e.fullData?.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</li>
          <li>Average risk score: {(edges.reduce((sum, e) => sum + (e.fullData?.riskScore || 0), 0) / edges.length * 100).toFixed(0)}%</li>
        </ul>
      </div>
      
      <Divider />
      
      <Tabs items={tabItems} />
    </Card>
  );
}
