import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/Tabs/Informations/InformationTabNested.css';
import '../../styles/Tabs/Informations/FunctionsSection.css';
import functionTypes, { getFunctionInfo } from '../../utils/functionMapping';

function NestedTabs({ children, initiallyOpen = true }) {
    // Initialize activeTab correctly, ensuring children exist and have props
    const firstChild = React.Children.toArray(children)[0];
    const firstTabLabel = firstChild && firstChild.props && firstChild.props.label ? firstChild.props.label : '';
    const [activeTab, setActiveTab] = useState(firstTabLabel);
    
    const handleTabClick = (e, newActiveTab) => {
        e.preventDefault();
        setActiveTab(newActiveTab);
    };

    return (
        <div className="nested-tabs-container">
            <div className="nested-tab-header">
                <div className="nested-tab-buttons">
                    {React.Children.map(children, (child) => {
                        if (!React.isValidElement(child) || !child.props.label) return null;
                        const label = child.props.label;
                        return (
                            <button
                                key={label}
                                className={`nested-tab-button ${activeTab === label ? 'active' : ''}`}
                                onClick={(e) => handleTabClick(e, label)}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="nested-tab-content">
                {React.Children.map(children, (child) => {
                    if (!React.isValidElement(child) || !child.props.label) return null;
                    if (child.props.label === activeTab) {
                        return <div key={child.props.label}>{child.props.children}</div>;
                    }
                    return null;
                })}
            </div>
        </div>
    );
}

function NestedTabPanel({ label, children }) {
    return <div>{children}</div>;
}

// New component for editable names
function EditableName({ index, name, type, onNameChange, defaultName }) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(name || defaultName || `${type} ${index}`);

    // Update local state when name prop changes
    useEffect(() => {
        setValue(name || defaultName || `${type} ${index}`);
    }, [name, type, index, defaultName]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleChange = (e) => {
        setValue(e.target.value);
    };

    const handleBlur = () => {
        setIsEditing(false);
        onNameChange(type, index, value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
            onNameChange(type, index, value);
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setValue(name || defaultName || `${type} ${index}`); // Reset to original value
        }
    };

    return (
        <li className="editable-name-item">
            <span className="name-index">{type} {index}:</span>
            {isEditing ? (
                <input
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="name-input"
                />
            ) : (
                <span 
                    className="name-value editable"
                    onClick={handleEdit}
                    title={`Click to edit ${type.toLowerCase()} name`}
                >
                    {value}
                    <span className="edit-icon">✎</span>
                </span>
            )}
        </li>
    );
}

// Update the DropdownFunction component to remove category grouping

function DropdownFunction({ index, value, onFunctionChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const dropdownRef = React.useRef(null);
    const menuRef = React.useRef(null);
    
    // Get the current function value
    const functionInfo = getFunctionInfo(index, value);
    
    // Function to update the menu position
    const updateMenuPosition = useCallback(() => {
        if (!dropdownRef.current) return;
        
        const rect = dropdownRef.current.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + window.scrollY + 4, // 4px spacing
            left: rect.left + 32
        });
    }, []);
    
    // Update position when dropdown is opened
    useEffect(() => {
        if (isOpen) {
            updateMenuPosition();
            
            // Add scroll event listener to update position during scrolling
            window.addEventListener('scroll', updateMenuPosition);
            window.addEventListener('resize', updateMenuPosition);
            
            return () => {
                window.removeEventListener('scroll', updateMenuPosition);
                window.removeEventListener('resize', updateMenuPosition);
            };
        }
    }, [isOpen, updateMenuPosition]);
    
    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target) && 
                menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    
    // Toggle dropdown with auto-scrolling
    const handleToggleDropdown = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        
        // If opening the dropdown
        if (newIsOpen && dropdownRef.current) {
            // Use setTimeout to run after React has updated the DOM
            setTimeout(() => {
                updateMenuPosition(); // Update position immediately
                
                const rect = dropdownRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const distanceToBottom = viewportHeight - rect.bottom;
                
                // If the dropdown is near the bottom of the viewport
                if (distanceToBottom < 300) {
                    // Calculate how much to scroll - enough to show dropdown
                    const scrollAmount = Math.min(300 - distanceToBottom + 20, 300);
                    
                    // Smooth scroll
                    window.scrollBy({
                        top: scrollAmount,
                        behavior: 'smooth'
                    });
                }
            }, 10);
        }
    };
    
    // Handle function selection
    const handleSelectFunction = (funcKey, funcName) => {
        onFunctionChange(index, funcName);
        setIsOpen(false);
    };
    
    // Create a flat list of functions sorted by ID
    const functionList = Object.entries(functionTypes).map(([key, func]) => ({
        key,
        ...func
    })).sort((a, b) => parseInt(a.key) - parseInt(b.key));

    return (
        <div className="function-item" ref={dropdownRef}>
            <div className="function-id-badge">{index}</div>
            <div className="function-dropdown-container">
                <div 
                    className={`function-dropdown-toggle ${isOpen ? 'active' : ''}`}
                    onClick={handleToggleDropdown}
                >
                    <span className="function-name">{functionInfo.type}</span>
                    <span className="dropdown-arrow">▼</span>
                </div>
                
                {isOpen && createPortal(
                    <div 
                        className="function-dropdown-menu"
                        ref={menuRef}
                        style={{
                            position: 'absolute',
                            width: `${dropdownRef.current.offsetWidth - 44}px`,
                            left: `${menuPosition.left}px`,
                            top: `${menuPosition.top}px`,
                            maxHeight: '300px',
                            overflowY: 'auto',
                            zIndex: 1000
                        }}
                    >
                        {functionList.map(func => (
                            <div 
                                key={func.key}
                                className="function-dropdown-item"
                                onClick={() => handleSelectFunction(func.key, func.type)}
                            >
                                <span className="function-item-type">{func.type}</span>
                                <span className="function-item-desc">{func.description}</span>
                            </div>
                        ))}
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
}

function InformationTab({ 
    parsedData, 
    activeNodeCount, 
    parseError,
    customNames = { inputs: {}, outputs: {} },
    customFunctions = {},
    onUpdateNames,
    onUpdateFunctions
}) {
    if (!parsedData || !parsedData.config) {
        return <p>No chromosome data loaded or parsed yet.</p>;
    }

    const { config } = parsedData;
    const totalGridSlots = config.rows * config.cols;
    const definedNodesCount = parsedData.nodeDefinitions ? parsedData.nodeDefinitions.size : 0;
    const inactiveDefinedNodes = definedNodesCount - activeNodeCount;
    const extraBlocks = totalGridSlots - activeNodeCount - definedNodesCount;
    
    // Create input and output name arrays from config and customNames
    // Using file-provided names when available, then custom names, then default names
    const inputNames = Array.from({ length: config.inputs }, (_, i) => 
        customNames.inputs[i] || 
        (parsedData.inputNames && parsedData.inputNames[i]) || 
        `Input ${i}`
    );

    const outputNames = Array.from({ length: config.outputs }, (_, i) => 
        customNames.outputs[i] || 
        (parsedData.outputNames && parsedData.outputNames[i]) || 
        `Output ${i}`
    );
    
    // Handle name changes
    const handleNameChange = (type, index, newName) => {
        if (type === 'Input') {
            const newInputNames = [...inputNames];
            newInputNames[index] = newName;
            
            // Call the parent handler to update the global state
            if (onUpdateNames) {
                onUpdateNames({ 
                    inputs: newInputNames, 
                    outputs: outputNames 
                });
            }
        } else if (type === 'Output') {
            const newOutputNames = [...outputNames];
            newOutputNames[index] = newName;
            
            // Call the parent handler to update the global state
            if (onUpdateNames) {
                onUpdateNames({ 
                    inputs: inputNames, 
                    outputs: newOutputNames 
                });
            }
        }
    };

    // Handle function name changes
    const handleFunctionChange = (index, newName) => {
        if (onUpdateFunctions) {
            const updatedFunctions = { ...customFunctions };
            updatedFunctions[index] = newName;
            onUpdateFunctions(updatedFunctions);
        }
    };

    // Always show I/O Names section if the configuration exists
    const hasIONames = config && (config.inputs > 0 || config.outputs > 0);
    const hasFunctions = config && config.funcSetSize > 0;

    return (
        <div className="information-tab tab-content">
            <h2 className="tab-title">Informations</h2>
            
            <NestedTabs initiallyOpen={true}>
                <NestedTabPanel label="Core Configuration">
                    <dl className="info-grid">
                        {/* First Column */}
                        <div className="info-column">
                            <div>
                                <dt>Inputs:</dt>
                                <dd>{config.inputs}</dd>
                            </div>
                            <div>
                                <dt>Outputs:</dt>
                                <dd>{config.outputs}</dd>
                            </div>
                            <div>
                                <dt>Grid Size:</dt>
                                <dd>{config.rows} rows x {config.cols} columns</dd>
                            </div>
                            <div>
                                <dt>Node Arity:</dt>
                                <dd>{config.arity}</dd>
                            </div>
                            <div>
                                <dt>L-Back:</dt>
                                <dd>{config.lback !== undefined ? config.lback : 'N/A'}</dd>
                            </div>
                            <div>
                                <dt>Function Set Size:</dt>
                                <dd>{config.funcSetSize !== undefined ? config.funcSetSize : 'N/A'}</dd>
                            </div>
                        </div>

                        {/* Vertical Line */}
                        <div className="vertical-line"></div>

                        {/* Second Column */}
                        <div className="info-column">
                            <div>
                                <dt>Nodes Defined in String:</dt>
                                <dd>{definedNodesCount}</dd>
                            </div>
                            <div>
                                <dt>Active Nodes (contributing):</dt>
                                <dd>{activeNodeCount}</dd>
                            </div>
                            <div>
                                <dt>Inactive Defined Nodes:</dt>
                                <dd>{inactiveDefinedNodes >= 0 ? inactiveDefinedNodes : 'N/A'}</dd>
                            </div>
                            <div>
                                <dt>Undefined Nodes:</dt>
                                <dd>{extraBlocks >= 0 ? extraBlocks : 'N/A'}</dd>
                            </div>
                        </div>
                    </dl>
                </NestedTabPanel>

                <NestedTabPanel label="I/O Names">
                    {hasIONames ? (
                        <div className="names-container">
                            {/* Input Names */}
                            {config.inputs > 0 && (
                                <div className="names-column">
                                    <h4>Input Names</h4>
                                    <ul className="name-list editable">
                                        {Array.from({ length: config.inputs }, (_, i) => (
                                            <EditableName
                                                key={`input-${i}`}
                                                index={i}
                                                name={customNames.inputs[i]}
                                                defaultName={`Input ${i}`}
                                                type="Input"
                                                onNameChange={handleNameChange}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            {/* Output Names */}
                            {config.outputs > 0 && (
                                <div className="names-column">
                                    <h4>Output Names</h4>
                                    <ul className="name-list editable">
                                        {Array.from({ length: config.outputs }, (_, i) => (
                                            <EditableName
                                                key={`output-${i}`}
                                                index={i}
                                                name={customNames.outputs[i]}
                                                defaultName={`Output ${i}`}
                                                type="Output"
                                                onNameChange={handleNameChange}
                                            />
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="no-names-message">
                            No input or output configuration available in this file.
                        </div>
                    )}
                </NestedTabPanel>

                <NestedTabPanel label="Functions">
                    {hasFunctions ? (
                        <div className="functions-container">
                            {/* Updated instruction text */}
                            <div className="edit-functions-instruction">
                                <p><i>Click on a function to select from the dropdown list</i></p>
                            </div>

                            <div className="functions-grid">
                                {Array.from({ length: config.funcSetSize }, (_, i) => (
                                    <DropdownFunction
                                        key={`function-${i}`}
                                        index={i}
                                        value={customFunctions}
                                        onFunctionChange={handleFunctionChange}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="no-functions-message">
                            No function set size defined in this file.
                        </div>
                    )}
                </NestedTabPanel>
            </NestedTabs>
        </div>
    );
}

export default InformationTab;