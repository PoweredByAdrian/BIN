// src/components/Visualization/Node.jsx
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import clsx from 'clsx';

// Default values for potentially missing props
const defaultVisualConfig = { nodeSize: 60, pointRadius: 4 };
const defaultSettings = { showNodeIndices: true, hideInactiveNodes: false };

const CgpNode = memo(({ id, data = {}, isConnectable }) => {
    // Destructure with defaults inside the component
    const {
        nodeIndex,
        isDefined,
        isActiveNode,
        nodeDef,
        settings = defaultSettings,
        visualConfig = defaultVisualConfig,
        arity = 2, // Default arity if not provided
        isHighlighted = false,
        handleMouseEnter,
        handleMouseLeave,
        activeNodesHighlightingEnabled,
     } = data;

     // Conditional rendering based on settings
     if (settings.hideInactiveNodes && isDefined && !isActiveNode) {
         return null; // Don't render inactive defined nodes if setting is true
     }

    // Use class-based styling approach instead of inline styles
    const nodeClasses = clsx(
        'cgp-node',
        {
            'highlighted': isHighlighted,
            'active': isActiveNode && activeNodesHighlightingEnabled,
            'inactive-defined': isDefined && !isActiveNode,
            'undefined-node': !isDefined
        }
    );

    // Calculate Input point positions (using dynamic arity)
    const nodeInputSpacing = arity > 0 ? visualConfig.nodeSize / (arity + 1) : 0;
    const inputHandles = [];
    if (isDefined) { // Only add handles to defined nodes
        for (let i = 0; i < arity; i++) {
            const handleId = `in${i}`;
            const yPosPercent = `${((i + 1) * nodeInputSpacing / visualConfig.nodeSize) * 100}%`;
            inputHandles.push(
                <Handle
                    key={handleId}
                    type="target"
                    position={Position.Left}
                    id={handleId}
                    className={`input-handle ${isActiveNode ? 'active' : ''}`}
                    style={{ top: yPosPercent }} // Keep only the dynamic positioning
                    isConnectable={isConnectable}
                />
            );
        }
    }

    // Basic node style (only keep what's absolutely necessary inline)
    const nodeStyle = {
        width: `${visualConfig.nodeSize}px`,
        minHeight: `${visualConfig.nodeSize}px`
    };

    return (
        <div 
          className={nodeClasses}
          style={nodeStyle} 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
            {/* Remove empty header */}

            {/* Input Handles - Dynamic based on arity */}
            {inputHandles}
            
            {/* Single Output Handle - Fixed */}
            {isDefined && (
                <Handle
                    type="source"
                    position={Position.Right}
                    id="out"
                    className={`output-handle ${isActiveNode ? 'active' : ''}`}
                    style={{ top: '50%' }} // Keep only the positioning
                    isConnectable={isConnectable}
                />
            )}

            {/* Function ID in the middle */}
            {isDefined && nodeDef && typeof nodeDef.funcId === 'number' && (
                <div className={`function-id ${isActiveNode ? 'active' : ''}`}>
                    {nodeDef.funcId}
                </div>
            )}

            {/* Node Index in bottom right */}
            {settings.showNodeIndices && typeof nodeIndex === 'number' && (
                <div className={`node-index ${isActiveNode ? 'active' : ''}`}>
                    {nodeIndex}
                </div>
            )}
        </div>
    );
});

export default CgpNode;