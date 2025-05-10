import React from 'react';
import { Handle } from 'reactflow';

function InputNode({ id, data }) {
    const { label, handleMouseEnter, handleMouseLeave } = data;
    
    return (
        <div 
            className="input-node"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="input-label">{label}</div>
            <Handle
                type="source"
                position="right"
                className="input-node-handle"
            />
        </div>
    );
}

export default InputNode;