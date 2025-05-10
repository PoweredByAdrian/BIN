// src/components/ErrorMessage.jsx
import React from 'react';

function ErrorMessage({ error }) {
    if (!error) {
        return null;
    }
    return (
        <div className="error-message-box">
            <strong>Error:</strong> {error}
        </div>
    );
}
export default ErrorMessage; // Ensure default export