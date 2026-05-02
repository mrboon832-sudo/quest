import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import { Card, Spin, message, Empty } from 'antd';
import { networkService } from '../services/api';
import 'reactflow/dist/style.css';

const RISK_COLORS = {
  'High': '#ff4d4f',
  'Medium': '#faad14',
  'Low': '#52c41a',
  'Unknown': '#999',
};

const MERCHANT_COLOR = '#1677ff';

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

  useEffect(() => {
    const fetchNetworkData = async () => {
      setLoading(true);
      try {
        const data = await networkService.getFraudNetwork();
        
        if (!data.nodes || data.nodes.length === 0) {
          message.info('No fraud network data available');
          setLoading(false);
          return;
        }

        // Transform nodes with proper styling
        const transformedNodes = data.nodes.map((node, idx) => {
          const isAccount = node.type === 'Account';
          const riskLevel = node.riskLevel || 'Unknown';
          const color = isAccount ? RISK_COLORS[riskLevel] : MERCHANT_COLOR;
          
          return {
            id: node.id,
            data: { label: node.label },
            position: getNodePosition(idx, data.nodes.length),
            style: {
              background: color,
              color: '#fff',
              border: `2px solid ${color}`,
              borderRadius: isAccount ? '50%' : '8px', // Circle for accounts, rectangle for merchants
              width: isAccount ? 80 : 100,
              height: isAccount ? 80 : 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              textAlign: 'center',
            },
          };
        });

        // Transform edges with risk-based coloring
        const transformedEdges = data.edges.map((edge) => {
          const edgeColor = RISK_COLORS[edge.riskLevel] || '#999';
          return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            label: edge.label,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: {
              stroke: edgeColor,
              strokeWidth: 2,
            },
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

  if (loading) {
    return (
      <Card title="Fraud Network Visualization">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 600 }}>
          <Spin size="large" tip="Loading fraud network..." />
        </div>
      </Card>
    );
  }

  if (nodes.length === 0) {
    return (
      <Card title="Fraud Network Visualization">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 600 }}>
          <Empty description="No fraud network data available" />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Fraud Network Visualization" 
      extra={
        <span style={{ fontSize: '12px' }}>
          🔴 High Risk | 🟠 Medium Risk | 🟢 Low Risk | 🔵 Merchant
        </span>
      }
    >
      <div style={{ height: 600, border: '1px solid #f0f0f0', borderRadius: '4px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </Card>
  );
}
