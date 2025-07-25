// Pages/AddStorageSystem.jsx
import React from "react";
import { Typography, Card } from "antd";
import "../styles/AddStorageSystem.css"; // Optional: for styling
import backgroundImage from '../assets/bg.png';
const { Title, Paragraph } = Typography;

const AddStorageSystem = () => {
  return (
    <div className="success-container" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.4)), url(${backgroundImage})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}>
      <Card className="success-card">
        <Title level={3} style={{ textAlign: "center" }}>
          Connection Successful
        </Title>
        <Paragraph style={{ textAlign: "center", fontSize: "16px" }}>
          Your connection is successfully added.
        </Paragraph>
      </Card>
    </div>
  );
};

export default AddStorageSystem;
