// src/components/ControlPanel.jsx
import React, { useState } from 'react';
import { FaUpload } from 'react-icons/fa';

const ControlPanel = ({ cgpString, onStringChange, onFileChange, onResetExample, onResetNames }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const handleInputChange = (value) => {
    onStringChange(value);
  };

  const resetToDefaultExample = () => {
    // Call both reset functions
    onResetExample();
    if (onResetNames) onResetNames(); // Reset names if the function exists
    setSelectedFiles([]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    onFileChange(e);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(filesArray);
      onFileChange({ target: { files: e.dataTransfer.files } });
    }
  };

  return (
    <div className="control-panel">
      <div className="input-section with-hint">
        <label htmlFor="cgp-input">CGP String:</label>
        <div className={`input-wrapper ${isInputFocused ? 'expanded' : ''}`}>
          <textarea
            id="cgp-input"
            value={cgpString}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="Enter CGP string"
            className="cgp-input-field"
            rows={isInputFocused ? 3 : 1}
          />
          <div className="input-format-container">
            <span className="input-format-hint">
              Format: <code>{"{inputs,outputs,rows,columns,arity,lback,funcSetSize}"}</code>
              <code>([node]func,in1,in2,...)</code>
              <code>(outputNode)</code>
            </span>
          </div>
        </div>
        <button className="reset-button" onClick={resetToDefaultExample}>
          Reset
        </button>
      </div>
      
      <div className="file-input-container">
        <h3>Load Files</h3>
        
        <div 
          className={`file-drop-area ${isDragging ? 'active' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="file-drop-icon">
            <FaUpload />
          </div>
          
          <div className="file-drop-message">
            <p>Drop CGP files here</p>
            <span>or select files</span>
          </div>
          
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            accept=".chr,.txt"
            multiple
            className="file-input-visible"
          />
        </div>
        
        <div className="file-input-help">
          <strong>Tip:</strong> You can select multiple files by holding Ctrl (or Cmd on Mac)
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;