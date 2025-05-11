// src/components/FunkceTab.jsx
import React, { useState, useEffect } from 'react';
import '../../styles/Tabs/FunkceTab.css';
import { FaSave, FaFileUpload, FaDownload, FaTrashAlt } from 'react-icons/fa';

function FunkceTab({ 
  customNames,
  customFunctions
}) {
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [newConfigName, setNewConfigName] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  // Load saved configurations from localStorage on component mount
  useEffect(() => {
    const configs = localStorage.getItem('cgp-saved-configs');
    if (configs) {
      setSavedConfigs(JSON.parse(configs));
    }
  }, []);

  // Save current configuration with a name
  const handleSaveConfig = () => {
    if (!newConfigName.trim()) {
      showMessage('Please enter a configuration name', 'error');
      return;
    }
    
    // Create a configuration object with names and functions
    const configToSave = {
      id: Date.now().toString(),
      name: newConfigName.trim(),
      date: new Date().toLocaleString(),
      customNames,
      customFunctions
    };

    // Add to saved configurations
    const updatedConfigs = [...savedConfigs, configToSave];
    setSavedConfigs(updatedConfigs);
    
    // Save to localStorage
    localStorage.setItem('cgp-saved-configs', JSON.stringify(updatedConfigs));
    
    // Reset input field and show success message
    setNewConfigName('');
    showMessage('Configuration saved successfully!', 'success');
  };

  // Load a saved configuration
  const handleLoadConfig = (config) => {
    // Dispatch a custom event with the configuration data
    const loadEvent = new CustomEvent('loadCGPConfiguration', {
      detail: {
        customNames: config.customNames,
        customFunctions: config.customFunctions
      }
    });
    document.dispatchEvent(loadEvent);
    
    showMessage(`Configuration "${config.name}" loaded successfully!`, 'success');
  };

  // Delete a saved configuration
  const handleDeleteConfig = (id) => {
    const updatedConfigs = savedConfigs.filter(config => config.id !== id);
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('cgp-saved-configs', JSON.stringify(updatedConfigs));
    showMessage('Configuration deleted', 'success');
  };

  // Export configuration to file
  const handleExportConfig = (config) => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `cgp-config-${config.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import configuration from file
  const handleImportConfig = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target.result);
        
        // Validate the imported configuration has required fields
        if (!importedConfig.customNames || !importedConfig.customFunctions) {
          showMessage('Invalid configuration file format', 'error');
          return;
        }
        
        // Add a unique ID and current timestamp if not present
        const configToSave = {
          ...importedConfig,
          id: importedConfig.id || Date.now().toString(),
          date: importedConfig.date || new Date().toLocaleString()
        };
        
        // Add to saved configurations
        const updatedConfigs = [...savedConfigs, configToSave];
        setSavedConfigs(updatedConfigs);
        
        // Save to localStorage
        localStorage.setItem('cgp-saved-configs', JSON.stringify(updatedConfigs));
        
        showMessage(`Configuration "${configToSave.name}" imported successfully!`, 'success');
      } catch (error) {
        showMessage('Error importing configuration: ' + error.message, 'error');
      }
    };
    reader.readAsText(file);
    
    // Clear the input value to allow importing the same file again
    event.target.value = null;
  };

  // Show message with timeout
  const showMessage = (message, type) => {
    setSaveMessage(message);
    setMessageType(type);
    
    setTimeout(() => {
      setSaveMessage('');
      setMessageType('');
    }, 3000);
  };

  return (
    <div className="funkce-tab tab-content">
      <h2 className="tab-title">Configuration Management</h2>
      
      <div className="config-section">
        <h3>Save Current Configuration</h3>
        <div className="save-config-form">
          <input
            type="text"
            placeholder="Enter configuration name"
            value={newConfigName}
            onChange={(e) => setNewConfigName(e.target.value)}
            className="config-name-input"
          />
          <button 
            onClick={handleSaveConfig}
            className="save-config-button"
            disabled={!newConfigName.trim()}
          >
            <FaSave /> Save
          </button>
        </div>
        
        {saveMessage && (
          <div className={`message ${messageType}`}>
            {saveMessage}
          </div>
        )}
      </div>
      
      <div className="config-section">
        <h3>Import Configuration</h3>
        <div className="import-config">
          <label className="import-button">
            <FaFileUpload /> Import from File
            <input
              type="file"
              accept=".json"
              onChange={handleImportConfig}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
      
      <div className="config-section">
        <h3>Saved Configurations</h3>
        {savedConfigs.length === 0 ? (
          <div className="no-configs">
            <p>No saved configurations yet</p>
          </div>
        ) : (
          <div className="configs-list">
            {savedConfigs.map((config) => (
              <div key={config.id} className="config-item">
                <div className="config-info">
                  <span className="config-name">{config.name}</span>
                  <span className="config-date">{config.date}</span>
                </div>
                <div className="config-actions">
                  <button 
                    onClick={() => handleLoadConfig(config)} 
                    className="action-button load"
                    title="Load configuration"
                  >
                    <FaFileUpload />
                  </button>
                  <button 
                    onClick={() => handleExportConfig(config)}
                    className="action-button export"
                    title="Export configuration"
                  >
                    <FaDownload />
                  </button>
                  <button 
                    onClick={() => handleDeleteConfig(config.id)}
                    className="action-button delete"
                    title="Delete configuration"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FunkceTab;