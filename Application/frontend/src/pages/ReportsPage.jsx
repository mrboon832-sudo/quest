import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Button, Space, Spin, message, Tag, Modal } from 'antd';
import { DownloadOutlined, FilePdfOutlined, FileExcelOutlined, ReloadOutlined } from '@ant-design/icons';
import { reportService } from '../services/api';

export default function ReportsPage() {
  const [reportHistory, setReportHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState('fraud_detection');

  useEffect(() => {
    fetchReportHistory();
  }, []);

  const fetchReportHistory = async () => {
    setLoading(true);
    try {
      const data = await reportService.getReportHistory();
      const formattedData = data.map((report, idx) => ({
        key: idx,
        id: report.id || report.reportId,
        name: report.name || `Report ${idx + 1}`,
        date: report.date || new Date().toISOString(),
        type: report.type || 'Fraud Detection',
        findings: report.findingsCount || 0,
        summary: report.summary || 'No summary available',
        status: report.status || 'Generated',
      }));
      setReportHistory(formattedData);
    } catch (error) {
      console.error('Error fetching report history:', error);
      message.error('Failed to load report history');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (type) => {
    setGeneratingReport(true);
    try {
      const response = await reportService.generateReport(type);
      message.success('Report generated successfully!');
      // Refresh the report history
      await fetchReportHistory();
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const showReportDetails = (record) => {
    Modal.info({
      title: record.name,
      width: 600,
      content: (
        <div>
          <p><strong>Date:</strong> {new Date(record.date).toLocaleString()}</p>
          <p><strong>Type:</strong> {record.type}</p>
          <p><strong>Findings Count:</strong> {record.findings}</p>
          <p><strong>Status:</strong> <Tag color={record.status === 'Completed' ? 'green' : 'orange'}>{record.status}</Tag></p>
          <p><strong>Summary:</strong></p>
          <p>{record.summary}</p>
        </div>
      ),
      okText: 'Close',
    });
  };

  const handleDownloadReport = async (record) => {
    try {
      const blob = await reportService.downloadReport(record.id, 'csv');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${record.id}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      message.error('Failed to download report');
    }
  };

  const columns = [
    { 
      title: 'Report Name', 
      dataIndex: 'name', 
      key: 'name',
      render: (text, record) => <a onClick={() => showReportDetails(record)}>{text}</a>
    },
    { 
      title: 'Generated Date', 
      dataIndex: 'date', 
      key: 'date',
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    { 
      title: 'Type', 
      dataIndex: 'type', 
      key: 'type' 
    },
    { 
      title: 'Findings', 
      dataIndex: 'findings', 
      key: 'findings',
      align: 'center'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'Completed' ? 'green' : status === 'Pending' ? 'orange' : 'blue';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: '20%',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<DownloadOutlined />} 
            size="small"
            onClick={() => handleDownloadReport(record)}
          >
            Download
          </Button>
          <Button 
            type="link"
            size="small"
            onClick={() => showReportDetails(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <Card title="Report Management">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Spin size="large" tip="Loading reports..." />
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card 
        title="Report Management"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchReportHistory} loading={loading}>
            Refresh
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <Button 
            icon={<FilePdfOutlined />}
            loading={generatingReport}
            onClick={() => handleGenerateReport('fraud_detection')}
          >
            Generate Fraud Detection Report
          </Button>
          <Button 
            icon={<FileExcelOutlined />}
            loading={generatingReport}
            onClick={() => handleGenerateReport('risk_summary')}
          >
            Generate Risk Summary Report
          </Button>
        </Space>

        <Table 
          columns={columns} 
          dataSource={reportHistory} 
          pagination={{ pageSize: 10 }}
          loading={loading}
          locale={{ emptyText: 'No reports available. Generate one using the buttons above.' }}
        />
      </Card>
    </div>
  );
}
