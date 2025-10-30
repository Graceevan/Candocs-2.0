import React from 'react';
import { Card, Button, Typography, Flex } from 'antd';
import { FolderOutlined, CloudOutlined, AmazonOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../styles/AddNew.css';

const { Title, Text } = Typography;

const StorageCard = ({ icon, title, description, onClick }) => (
  <Card
    hoverable
    className="addnew-storage-card"
  >
    <div className="addnew-card-icon-container">
      {icon}
    </div>
    <Title level={4}>{title}</Title>
    <Text type="secondary" style={{ display: 'block', marginBottom: '20px' }}>
      {description}
    </Text>
    <Button
      type="primary"
      onClick={onClick}
      style={{
        width: '100%',
        backgroundColor: '#2c4684',
        borderColor: '#2c4684'
      }}
    >
      Configure
    </Button>
  </Card>
);

const AddNew = () => {
  const navigate = useNavigate();

  const handleConfigure = (path) => {
    navigate(path);
  };

  return (
    <div className="addnew-container-ant-d">
      <Flex vertical align="flex-start" style={{ marginBottom: 30 }}>
        <Title level={2}  style={{
    fontSize: '28px',
    fontWeight: 630,
    marginBottom: 0,
    textAlign: 'left',
  }}>
          Add New Storage System
        </Title>
        <Text type="secondary" style={{ fontSize: 14.5,textAlign: 'left', marginBottom: 8, marginTop:5 }}>
          Choose a provider to configure
        </Text>
      </Flex>

      <div className="addnew-cards-container">
        <StorageCard
          icon={<FolderOutlined style={{ fontSize: '48px', color: '#2c4684' }} />}
          title="Local File System"
          description="Store files on the local server or a network path."
          onClick={() => handleConfigure('/admin/filemanager')}
        />
        <StorageCard
          icon={<CloudOutlined style={{ fontSize: '48px', color: '#2c4684' }} />}
          title="Microsoft Azure Blob"
          description="Scalable cloud storage with global redundancy."
          onClick={() => handleConfigure('/admin/azure')}
        />
        <StorageCard
          icon={<AmazonOutlined style={{ fontSize: '48px', color: '#2c4684' }} />}
          title=" Aws S3 Bucket"
          description="Secure durable storage storage from AWS"
          onClick={() => handleConfigure('/admin/aws')}
        />
      </div>
    </div>
  );
};

export default AddNew;