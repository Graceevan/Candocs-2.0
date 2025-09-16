import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="unauthorized-page">
      <h2>🚫 You are not authorized to access this page.</h2>
      <p>Please contact your administrator or log in with the correct credentials.</p>
      <Link to="/">Go Back</Link>
    </div>
  );
};

export default Unauthorized;