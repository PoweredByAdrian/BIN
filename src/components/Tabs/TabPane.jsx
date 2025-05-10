import React from 'react';

// Simple wrapper component, label prop is used by Tabs component
function TabPane({ label, children }) {
    return (
        <div label={label} style={{ display: 'none' }}>
            {children}
        </div>
    );
}

export default TabPane; // Use default export for components usually