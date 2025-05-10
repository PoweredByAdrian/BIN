// src/components/NastaveniTab.jsx
import React from 'react';

function NastaveniTab({ settings, onSettingChange, onAutoAlign, onRestoreView }) {
    const showIndices = settings.showNodeIndices ?? true;
    const hideInactive = settings.hideInactiveNodes ?? false; 
    const hideUndefined = settings.hideUndefinedNodes ?? false;
    const showFooter = settings.showFooter ?? true; // Add this setting
    
    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        onSettingChange(name, checked);
    };

    return (
        <div>
            <h2>Settings</h2>
            
            <div className="settings-section">
                <h3>Visibility Options</h3>
                <div className="checkbox-group">
                    <label>
                        <input
                            type="checkbox"
                            name="showNodeIndices"
                            checked={showIndices}
                            onChange={handleCheckboxChange}
                        />
                        Show Block Index
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            name="hideInactiveNodes"
                            checked={hideInactive}
                            onChange={handleCheckboxChange}
                        />
                        Hide Non-functional Blocks
                    </label>
                    
                    <label style={{ opacity: hideInactive ? 0.7 : 1 }}>
                        <input
                            type="checkbox"
                            name="hideUndefinedNodes"
                            checked={hideUndefined}
                            onChange={handleCheckboxChange}
                            disabled={hideInactive}
                        />
                        Hide Undefined Blocks
                    </label>
                    
                    {/* Add footer display toggle */}
                    <label>
                        <input
                            type="checkbox"
                            name="showFooter"
                            checked={showFooter}
                            onChange={handleCheckboxChange}
                        />
                        Show Info Footer
                    </label>
                </div>
            </div>
            
            <div className="settings-section">
                <h3>Layout Controls</h3>
                <div className="button-group">
                    <button 
                        className="settings-button"
                        onClick={onAutoAlign}
                    >
                        Auto Align
                    </button>
                    
                    <button 
                        className="settings-button"
                        onClick={onRestoreView}
                    >
                        Restore View
                    </button>
                </div>
            </div>

            <hr style={{border: 'none', borderTop: '1px solid #4f5666', margin: '15px 0'}}/>
            <p><em>More settings like Schematic Symbols, Display Modes, Footer will go here.</em></p>
        </div>
    );
}

export default NastaveniTab;