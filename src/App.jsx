// src/App.jsx
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import './App.css';
import Tabs from './components/Tabs/Tabs';
import TabPane from './components/Tabs/TabPane';
import InformationTab from './components/Tabs/InformationTab';
import FunkceTab from './components/Tabs/FunkceTab';
import NastaveniTab from './components/Tabs/NastaveniTab';
import Visualization from './components/Visualization/Visualization';
import ControlPanel from './components/ControlPanel';
import ErrorMessage from './components/ErrorMessage';
import FileNavigator from './components/FileNavigator/FileNavigator';
import FileListModal from './components/FileNavigator/FileListModal';
import InfoFooter from './components/Footer/InfoFooter'; // Import the new footer component

// Import individual hooks
import { useCgpParser } from './hooks/useCgpParser';
import { useReactFlowGraph } from './hooks/useReactFlowGraph';
import { usePathHighlighting } from './hooks/usePathHighlighting';

const visualConfig = {
    nodeSize: 60, padding: 40, ioSpacing: 40, gridSpacing: 40,
    inputAreaWidth: 60, outputAreaWidth: 60, pointRadius: 4,
    minSvgWidth: 300, minSvgHeight: 150
};

// Default CGP string for initial visualization
const DEFAULT_CGP_STRING = '{5,1, 5,5, 2,1,13}([5]3,4,1)([6]3,3,1)([7]2,2,1)([8]4,3,2)([9]3,0,0)([10]5,0,2)([11]9,7,3)([12]8,1,2)([13]2,5,3)([14]8,1,1)([15]10,12,1)([16]14,0,2)([17]2,14,2)([18]13,12,1)([19]12,10,2)([20]0,15,0)([21]18,16,1)([22]17,15,1)([23]2,4,2)([24]15,0,0)([25]2,1,0)([26]21,0,2)([27]22,21,2)([28]4,2,3)([29]21,1,3)(27)';

function App() {
    const [cgpString, setCgpString] = useState(DEFAULT_CGP_STRING);
    const [settings, setSettings] = useState({
        showNodeIndices: true,
        hideInactiveNodes: false,
        hideUndefinedNodes: false,
        showFooter: true, // Add this setting
    });
    
    // Add state for hoveredNode
    const [hoveredNode, setHoveredNode] = useState(null);
    
    // Rename this to be more specific - for active nodes permanent highlighting
    const [activeNodesHighlightingEnabled, setActiveNodesHighlightingEnabled] = useState(true);
    
    // Custom names state
    const [customNames, setCustomNames] = useState({
        inputs: {}, 
        outputs: {} 
    });

    // Add custom functions state
    const [customFunctions, setCustomFunctions] = useState({});
    
    // Function to update names
    const handleNameChange = useCallback((type, index, value) => {
        setCustomNames(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [index]: value
            }
        }));
    }, []);
    
    // Add a new handler to reset custom names
    const handleResetNames = useCallback(() => {
        // Reset customNames to empty objects
        setCustomNames({
            inputs: {},
            outputs: {}
        });
        
        // Reset customFunctions to empty object
        setCustomFunctions({});
        
        console.log("Custom names and functions have been reset");
    }, []);
    
    // Function to handle function name updates
    const handleUpdateFunctions = useCallback((newFunctions) => {
        setCustomFunctions(newFunctions);
        console.log("Custom functions updated:", newFunctions);
    }, []);
    
    // File handling state
    const [files, setFiles] = useState([]);
    const [currentFileIndex, setCurrentFileIndex] = useState(-1);
    const [showFileList, setShowFileList] = useState(false);
    const [error, setError] = useState(null);

    // CGP parsing and visualization hooks
    const { parsedData, parseError, activeNodes } = useCgpParser(cgpString);
    const { 
        rfNodes, 
        rfEdges, 
        onNodesChange, 
        onEdgesChange,
        autoAlignByDelay,
        resetNodePositions 
    } = useReactFlowGraph(parsedData, activeNodes, visualConfig, customNames);
    const { highlightedPath, highlightPathFromNode, clearHighlight } = 
        usePathHighlighting(parsedData);

    const handleSettingChange = useCallback((settingName, value) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            [settingName]: value
        }));
    }, []);
    
    // File change handler for multiple files
    const handleFileChange = useCallback((event) => {
        const fileList = Array.from(event.target.files);
        
        if (fileList.length === 0) return;
        
        // Sort files by name
        const sortedFiles = [...fileList].sort((a, b) => {
            const matchA = a.name.match(/log_(\d+)\.chr/i);
            const matchB = b.name.match(/log_(\d+)\.chr/i);
            
            if (matchA && matchB) {
                return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
            }
            return a.name.localeCompare(b.name);
        });
        
        setFiles(sortedFiles);
        
        // Load the first file automatically
        const file = sortedFiles[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result;
            setCgpString(content);
            setCurrentFileIndex(0);
            setError(null);
        };
        
        reader.onerror = () => {
            setError("Failed to read the file.");
        };
        
        reader.readAsText(file);

        // Reset custom names when loading new files
        setCustomNames({
            inputs: {},
            outputs: {}
        });
    }, []);

    // Reset to default example
    const resetToDefaultExample = useCallback(() => {
        setCgpString(DEFAULT_CGP_STRING);
        setFiles([]);
        setCurrentFileIndex(-1);
        setError(null);
    }, []);

    // Navigation between files
    const handleNavigate = useCallback((index) => {
        if (index < 0 || index >= files.length) return;
        
        const file = files[index];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            setCgpString(e.target.result);
            setCurrentFileIndex(index);
            setError(null);
        };
        
        reader.onerror = () => {
            setError(`Failed to read file: ${file.name}`);
        };
        
        reader.readAsText(file);
    }, [files]);

    // Handle restore view action
    const handleRestoreView = useCallback(() => {
        if (resetNodePositions) {
            // Just call resetNodePositions - it handles the state update internally
            resetNodePositions();
            // No need to call setNodes here since resetNodePositions does it
        }
    }, [resetNodePositions]);

    // Handle auto align based on delay
    const handleAutoAlign = useCallback(() => {
        if (autoAlignByDelay) {
            autoAlignByDelay();
        }
    }, [autoAlignByDelay]);

    // Handle node hover for footer display
    const handleNodeHover = useCallback((nodeId) => {
        // Find the hovered node
        const node = rfNodes.find(n => n.id === nodeId);
        console.log("Node hovered:", node);
        console.log("Node data:", node?.data);
        
        setHoveredNode(node);
        // Call the path highlighting
        if (highlightPathFromNode) highlightPathFromNode(nodeId);
    }, [rfNodes, highlightPathFromNode]);
    
    // Clear hover state
    const handleClearHover = useCallback(() => {
        setHoveredNode(null);
        if (clearHighlight) clearHighlight();
    }, [clearHighlight]);

    // Handle I/O name updates
    const handleUpdateNames = useCallback((newNames) => {
        // Instead of trying to modify parsedData directly, update customNames
        setCustomNames({
            inputs: newNames.inputs.reduce((acc, name, index) => {
                if (name && name !== `Input ${index}`) {
                    acc[index] = name;
                }
                return acc;
            }, {}),
            outputs: newNames.outputs.reduce((acc, name, index) => {
                if (name && name !== `Output ${index}`) {
                    acc[index] = name;
                }
                return acc;
            }, {})
        });
        
        // Log success message
        console.log("Custom names updated:", newNames);
    }, []);

    return (
        <>
            <h1>CGP Viewer</h1>
            
            <ControlPanel
                cgpString={cgpString}
                onStringChange={setCgpString}
                onFileChange={handleFileChange}
                onResetExample={resetToDefaultExample}
                onResetNames={handleResetNames} // Add this prop
            />
            
            <ErrorMessage error={parseError || error} />
            
            {/* File Navigator - only shown when multiple files are loaded */}
            {files.length > 1 && currentFileIndex !== -1 && (
                <div className="file-navigator-container">
                    <FileNavigator 
                        files={files}
                        currentFileIndex={currentFileIndex}
                        onNavigate={handleNavigate}
                        onShowFileList={() => setShowFileList(true)}
                    />
                </div>
            )}

            {/* File List Modal */}
            {showFileList && (
                <FileListModal 
                    files={files}
                    currentFileIndex={currentFileIndex}
                    onSelect={(index) => {
                        handleNavigate(index);
                        setShowFileList(false);
                    }}
                    onClose={() => setShowFileList(false)}
                />
            )}
            
            <Tabs initiallyOpen={false}>
                <TabPane label="Informace">
                    <InformationTab 
                        parsedData={parsedData} 
                        activeNodeCount={activeNodes.size} 
                        parseError={parseError}
                        customNames={customNames}
                        customFunctions={customFunctions}
                        onNameChange={handleNameChange}
                        onUpdateNames={handleUpdateNames}
                        onUpdateFunctions={handleUpdateFunctions}
                    />
                </TabPane>
                <TabPane label="Funkce">
                    <FunkceTab />
                </TabPane>
                <TabPane label="Nastavení">
                    <NastaveniTab 
                        settings={settings} 
                        onSettingChange={handleSettingChange}
                        onAutoAlign={handleAutoAlign} // Connect the auto align handler
                        onRestoreView={handleRestoreView} // Pass the restore function
                    />
                </TabPane>
            </Tabs>

            {/* Add footer between tabs and visualization, with consistent width */}
            <div className="footer-container">
                {/* Always render the footer container with the same height to prevent shifts */}
                {settings.showFooter ? (
                    <InfoFooter 
                        hoveredNode={hoveredNode}
                        highlightedPath={highlightedPath}
                        nodeDelays={parsedData?.nodeDelays || {}}
                        parsedData={parsedData}
                        customFunctions={customFunctions}
                    />
                ) : (
                    <div className="info-footer full-width empty"></div>
                )}
            </div>

            <div className="visualization-area" style={{ height: '600px', width: '100%', minWidth: '600px' }}>
                {(!parseError && !error && parsedData) ? (
                    <Visualization
                        settings={settings}
                        activeNodes={activeNodes}
                        rfNodes={rfNodes}
                        rfEdges={rfEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        visualConfig={visualConfig}
                        // Pass the highlighted path always
                        highlightedPath={highlightedPath}
                        // Rename the prop to be more specific
                        activeNodesHighlightingEnabled={activeNodesHighlightingEnabled}
                        onToggleActiveNodesHighlighting={() => 
                            setActiveNodesHighlightingEnabled(prev => !prev)
                        }
                        // Always pass these mouse handlers
                        onNodeMouseEnter={handleNodeHover}
                        onNodeMouseLeave={handleClearHover}
                        onPaneMouseEnter={handleClearHover}
                        customNames={customNames}
                    />
                ) : (
                    <div style={{ padding: '20px', color: '#abb2bf', textAlign: 'center' }}>
                        {parseError || error ? `Cannot draw: ${parseError || error}` : 'Enter/Upload CGP string.'}
                    </div>
                )}
            </div>
        </>
    );
}

export default App;