import React from 'react';
import { getFunctionInfo } from '../../utils/functionMapping';
import '../../styles/InfoFooter.css';

const InfoFooter = ({ 
  hoveredNode, 
  highlightedPath, 
  nodeDelays = {},
  parsedData,
  customFunctions = {}
}) => {
  // If no node is hovered, show generic info about highlighted path or instructions
  if (!hoveredNode) {
    if (highlightedPath && (highlightedPath.nodes.size > 0 || highlightedPath.edges.size > 0)) {
      return (
        <div className="info-footer full-width">
          <div className="path-info">
            <span className="info-label">Path:</span> 
            <span className="path-count">
              {highlightedPath.nodes.size} nodes, {highlightedPath.edges.size} connections
            </span>
          </div>
        </div>
      );
    }
    // Display a help message when nothing is selected
    return (
      <div className="info-footer full-width empty">
        <div className="empty-message">
          <span className="info-hint">Hover over a node to see details</span>
        </div>
      </div>
    );
  }

  // For node hover, show detailed information
  const nodeId = hoveredNode.id;
  const nodeData = hoveredNode.data || {};
  
  // Check if this is a computation node (not an input/output)
  const isFunctionNode = !nodeId.startsWith('input-') && !nodeId.startsWith('output-');
  
  // Extract function ID from the nested nodeDef object if it exists
  let functionId = null;
  if (isFunctionNode && nodeData.nodeDef && nodeData.nodeDef.funcId !== undefined) {
    functionId = nodeData.nodeDef.funcId;
  }
  
  // Get function type information if functionId exists
  const functionInfo = functionId !== null ? getFunctionInfo(functionId, customFunctions) : null;
  
  // Get delay information if available
  const delay = nodeData.nodeDelay !== undefined ? nodeData.nodeDelay : 
               (nodeDelays[nodeId] !== undefined ? nodeDelays[nodeId] : null);
  
  // Determine connections info - might need to adjust based on your data structure
  const inputsFrom = nodeData.inputsFrom || 
                    (nodeData.nodeDef && nodeData.nodeDef.inputs ? 
                     nodeData.nodeDef.inputs.map(input => `node-${input}`) : []);
                     
  const outputsTo = nodeData.outputsTo || [];

  // Helper function to get formatted node name
  function getNodeName(id) {
    if (typeof id === 'number') {
      return `Node ${id}`;
    }
    
    if (id.startsWith('input-')) {
      const idx = id.replace('input-', '');
      return getInputName(idx);
    } else if (id.startsWith('output-')) {
      const idx = id.replace('output-', '');
      return getOutputName(idx);
    } else if (id.startsWith('node-')) {
      return `Node ${id.replace('node-', '')}`;
    } else {
      return `${id}`;
    }
  }
  
  // Helper functions to get I/O names from customNames if available
  function getInputName(idx) {
    const inputIdx = parseInt(idx, 10);
    return parsedData?.customNames?.inputs?.[inputIdx] || `Input ${idx}`;
  }
  
  function getOutputName(idx) {
    const outputIdx = parseInt(idx, 10);
    return parsedData?.customNames?.outputs?.[outputIdx] || `Output ${idx}`;
  }

  return (
    <div className="info-footer full-width">
      <div className="node-info">
        <span className="info-label">Node:</span> 
        <span className="node-id">{nodeData.nodeIndex !== undefined ? `Node ${nodeData.nodeIndex}` : nodeId}</span>
      </div>
      
      {functionInfo && (
        <div className="function-info">
          <span className="info-label">Function:</span>
          <span className="function-type">
            {functionInfo.type}
          </span>
          <span className="function-description">
            ({functionInfo.description})
          </span>
        </div>
      )}
      
      {delay !== null && (
        <div className="delay-info">
          <span className="info-label">Delay:</span>
          <span className="delay-value">{delay}</span>
        </div>
      )}

      {inputsFrom && inputsFrom.length > 0 && (
        <div className="connections-info">
          <span className="info-label">Inputs from:</span>
          <span className="connections-list">
            {inputsFrom.map((input, idx) => (
              <span key={`input-${idx}`} className="connection-item">
                {getNodeName(input)}
                {idx < inputsFrom.length - 1 ? ', ' : ''}
              </span>
            ))}
          </span>
        </div>
      )}
      
      {outputsTo && outputsTo.length > 0 && (
        <div className="connections-info">
          <span className="info-label">Outputs to:</span>
          <span className="connections-list">
            {outputsTo.map((output, idx) => (
              <span key={`output-${idx}`} className="connection-item">
                {getNodeName(output)}
                {idx < outputsTo.length - 1 ? ', ' : ''}
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
};

export default InfoFooter;