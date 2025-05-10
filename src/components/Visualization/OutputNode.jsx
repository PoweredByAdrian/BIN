import React from 'react';
import { Handle, Position } from 'reactflow';


// Make sure Output node calls the handler
function OutputNode({ data, id }) {
    return (
        <div 
            className="output-node" 
            onMouseEnter={() => data?.handleMouseEnter?.(id)}
            onMouseLeave={data?.handleMouseLeave}
        >
            <Handle
                id="target"
                type="target"
                position={Position.Left}
                className="output-node-handle"
            />
            <div className="output-label">{data?.label || id}</div>
        </div>
    );
}

export default OutputNode;