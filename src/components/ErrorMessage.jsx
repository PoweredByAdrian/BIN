// src/components/ErrorMessage.jsx
import React from 'react';
import '../styles/ErrorMessage.css';

const ErrorMessage = ({ error }) => {
  if (!error) return null;
  
  // Extract error message and details
  let errorMsg, detailMsg;
  
  if (typeof error === 'string') {
    // Handle simple string errors
    errorMsg = error;
    detailMsg = null;
  } else if (typeof error === 'object') {
    // Handle error objects with error and detail properties
    errorMsg = error.error || error.message || "Unknown error";
    detailMsg = error.detail || null;
  } else {
    // Fallback for unexpected error types
    errorMsg = String(error);
    detailMsg = null;
  }
  
  return (
    <div className="error-message-container">
      <div className="error-message-header">
        <span className="error-icon">⚠️</span>
        <h3>Error</h3>
      </div>
      <div className="error-message-content">
        <p className="error-main">{errorMsg}</p>
        {detailMsg && (
          <p className="error-detail">{detailMsg}</p>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;