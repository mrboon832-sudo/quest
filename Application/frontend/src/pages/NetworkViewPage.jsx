import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import { Card } from 'antd';
import 'reactflow/dist/style.css';

// Sample fraud network data
const initialNodes = [
  { id: '1', data: { label: 'Account A' }, position: { x: 250, y: 50 }, style: { background: '#ff4d4f', color: '#fff', border: '2px solid #ff4d4f', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
  { id: '2', data: { label: 'Account B' }, position: { x: 100, y: 200 }, style: { background: '#faad14', color: '#fff', border: '2px solid #faad14', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
  { id: '3', data: { label: 'Account C' }, position: { x: 400, y: 200 }, style: { background: '#52c41a', color: '#fff', border: '2px solid #52c41a', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
  { id: '4', data: { label: 'Merchant X' }, position: { x: 250, y: 350 }, style: { background: '#1677ff', color: '#fff', border: '2px solid #1677ff', borderRadius: 8, width: 100, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
  { id: '5', data: { label: 'Account D' }, position: { x: 50, y: 400 }, style: { background: '#ff4d4f', color: '#fff', border: '2px solid #ff4d4f', borderRadius: '50%', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', label: '$5,200', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#ff4d4f', strokeWidth: 2 } },
  { id: 'e1-3', source: '1', target: '3', label: '$12,000', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#ff4d4f', strokeWidth: 2 } },
  { id: 'e2-4', source: '2', target: '4', label: '$3,400', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#faad14', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', label: '$8,500', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#52c41a', strokeWidth: 2 } },
  { id: 'e2-5', source: '2', target: '5', label: '$2,100', markerEnd: { type: MarkerType.ArrowClosed }, style: { stroke: '#faad14', strokeWidth: 2 } },
];

export default function NetworkViewPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => [...eds, { ...params, label: 'New' }]),
    [setEdges],
  );

  return (
    <Card title="Fraud Network Visualization" extra={<span>Red = High Risk | Orange = Medium Risk | Green = Low Risk</span>}>
      <div style={{ height: 600 }}>
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
