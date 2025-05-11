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
import InfoFooter from './components/Footer/InfoFooter';
import CGPTester from './components/CGPTester';

// Import custom hooks for CGP parsing and visualization
import { useCgpParser } from './hooks/useCgpParser';
import { useReactFlowGraph } from './hooks/useReactFlowGraph';
import { usePathHighlighting } from './hooks/usePathHighlighting';

/**
 * Default visualization configuration parameters
 * Controls sizes, spacing and dimensions of visualization elements
 */
const visualConfig = {
    nodeSize: 60,       // Size of each node in pixels
    padding: 40,        // Padding around the graph
    ioSpacing: 40,      // Spacing between input/output nodes
    gridSpacing: 40,    // Spacing of the grid
    inputAreaWidth: 60, // Width of input area
    outputAreaWidth: 60,// Width of output area
    pointRadius: 4,     // Radius of connection points
    minSvgWidth: 300,   // Minimum SVG width
    minSvgHeight: 150   // Minimum SVG height
};

/**
 * Default CGP string for initial visualization
 * Format: {inputs,outputs,rows,columns,arity,lback,funcSetSize}([node]func,in1,in2,...)(outputNode)
 */
const DEFAULT_CGP_STRING = '{5,1, 5,5, 2,1,13}([5]3,4,1)([6]3,3,1)([7]2,2,1)([8]4,3,2)([9]3,0,0)([10]5,0,2)([11]9,7,3)([12]8,1,2)([13]2,5,3)([14]8,1,1)([15]10,12,1)([16]14,0,2)([17]2,14,2)([18]13,12,1)([19]12,10,2)([20]0,15,0)([21]18,16,1)([22]17,15,1)([23]2,4,2)([24]15,0,0)([25]2,1,0)([26]21,0,2)([27]22,21,2)([28]4,2,3)([29]21,1,3)(27)';

/**
 * Main application component
 * 
 * Manages:
 * - CGP string state and parsing
 * - Visualization settings
 * - File handling for CGP files
 * - Custom names for inputs/outputs
 * - Custom function definitions
 * - Node path highlighting
 */
function App() {
    // ==================== CORE STATE ====================
    // Current CGP string to visualize
    const [cgpString, setCgpString] = useState(DEFAULT_CGP_STRING);
    
    // Visualization settings
    const [settings, setSettings] = useState({
        showNodeIndices: true,    // Whether to show node indices in visualization
        hideInactiveNodes: false, // Whether to hide inactive nodes
        hideUndefinedNodes: false,// Whether to hide undefined nodes
        showFooter: true,         // Whether to show information footer
    });
    
    // ==================== UI STATE ====================
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [activeNodesHighlightingEnabled, setActiveNodesHighlightingEnabled] = useState(true);
    const [showTester, setShowTester] = useState(false);
    
    // ==================== CUSTOM NAMING STATE ====================
    // Custom names for inputs and outputs
    const [customNames, setCustomNames] = useState({
        inputs: {}, // Format: {index: "name"}
        outputs: {} // Format: {index: "name"}
    });
    
    // Custom function definitions
    const [customFunctions, setCustomFunctions] = useState({});
    
    // ==================== FILE HANDLING STATE ====================
    const [files, setFiles] = useState([]);         // List of uploaded files
    const [currentFileIndex, setCurrentFileIndex] = useState(-1); // Current file index
    const [showFileList, setShowFileList] = useState(false);     // File list modal visibility
    const [error, setError] = useState(null);       // General error state

    // ==================== CGP PARSING AND VISUALIZATION HOOKS ====================
    // Parse the CGP string and extract data structure
    const { parsedData, parseError, activeNodes } = useCgpParser(cgpString);
    
    // Generate React Flow nodes and edges from parsed CGP data
    const { 
        rfNodes, 
        rfEdges, 
        onNodesChange, 
        onEdgesChange,
        autoAlignByDelay,
        resetNodePositions,
    } = useReactFlowGraph(parsedData, activeNodes, visualConfig, customNames);
    
    // Path highlighting logic for tracing computation
    const { highlightedPath, highlightPathFromNode, clearHighlight } = 
        usePathHighlighting(parsedData);

    // ==================== EVENT HANDLERS ====================
    /**
     * Updates a specific visualization setting
     * 
     * @param {string} settingName - Name of the setting to update
     * @param {any} value - New value for the setting
     */
    const handleSettingChange = useCallback((settingName, value) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            [settingName]: value
        }));
    }, []);
    
    /**
     * Handles file selection from the file input
     * Processes multiple files and loads the first one
     * 
     * @param {Event} event - File input change event
     */
    const handleFileChange = useCallback((event) => {
        const fileList = Array.from(event.target.files);
        
        if (fileList.length === 0) return;
        
        // Sort files by name, with special handling for log_N.chr pattern
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
            
            // Update CGP string to trigger parsing
            setCgpString(content);
            setCurrentFileIndex(0);
            setError(null);
            
            // We don't reset custom names here to allow the parser
            // to detect and use names from file comments (#%i, #%o)
        };
        
        reader.onerror = () => {
            setError("Failed to read the file.");
        };
        
        reader.readAsText(file);
    }, []);

    /**
     * Resets to the default example CGP string
     * Clears any loaded files and errors
     */
    const resetToDefaultExample = useCallback(() => {
        setCgpString(DEFAULT_CGP_STRING);
        setFiles([]);
        setCurrentFileIndex(-1);
        setError(null);
    }, []);

    /**
     * Navigates to a different file in the loaded file list
     * 
     * @param {number} index - Index of the file to navigate to
     */
    const handleNavigate = useCallback((index) => {
        if (index < 0 || index >= files.length) return;
        
        const file = files[index];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result;
            setCgpString(content);
            setCurrentFileIndex(index);
            setError(null);
            
            // Reset custom names when navigating to allow
            // names from the newly loaded file to take effect
            setCustomNames({
                inputs: {},
                outputs: {}
            });
        };
        
        reader.onerror = () => {
            setError(`Failed to read file: ${file.name}`);
        };
        
        reader.readAsText(file);
    }, [files]);

    /**
     * Resets node positions to their default layout
     */
    const handleRestoreView = useCallback(() => {
        if (resetNodePositions) {
            resetNodePositions();
        }
    }, [resetNodePositions]);

    /**
     * Aligns nodes based on their computation delay values
     */
    const handleAutoAlign = useCallback(() => {
        if (autoAlignByDelay) {
            autoAlignByDelay();
        }
    }, [autoAlignByDelay]);

    /**
     * Handles node hover events - shows info and highlights paths
     * 
     * @param {string} nodeId - ID of the hovered node
     */
    const handleNodeHover = useCallback((nodeId) => {
        // Find the hovered node
        const node = rfNodes.find(n => n.id === nodeId);
        setHoveredNode(node);
        
        // Highlight computation path through this node
        if (highlightPathFromNode) highlightPathFromNode(nodeId);
    }, [rfNodes, highlightPathFromNode]);
    
    /**
     * Clears node hover state and path highlighting
     */
    const handleClearHover = useCallback(() => {
        setHoveredNode(null);
        if (clearHighlight) clearHighlight();
    }, [clearHighlight]);

    /**
     * Updates custom input/output names
     * 
     * @param {Object} newNames - Object with new input and output names
     */
    const handleUpdateNames = useCallback((newNames) => {
        // Store only non-default names to keep state clean
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
    }, []);

    /**
     * Updates function definitions
     * 
     * @param {Object} newFunctions - New function definitions
     */
    const handleUpdateFunctions = useCallback((newFunctions) => {
        setCustomFunctions(newFunctions);
    }, []);

    /**
     * Resets all custom names and functions to defaults
     */
    const handleResetNames = useCallback(() => {
        setCustomNames({
            inputs: {},
            outputs: {}
        });
        setCustomFunctions({});
    }, []);

    /**
     * Tracks node positions after dragging
     * For internal use only
     */
    const onNodeDragStop = useCallback((event, node) => {
        // Track positions internally
    }, []);

    // ==================== EFFECTS ====================
    /**
     * Sets up event listener for external configuration loading
     * Allows loading custom names and functions from external sources
     */
    useEffect(() => {
        const handleConfigLoad = (event) => {
            const { customNames: newNames, customFunctions: newFunctions } = event.detail;
            
            if (newNames) {
                setCustomNames(newNames);
            }
            
            if (newFunctions) {
                setCustomFunctions(newFunctions);
            }
        };
        
        document.addEventListener('loadCGPConfiguration', handleConfigLoad);
        
        return () => {
            document.removeEventListener('loadCGPConfiguration', handleConfigLoad);
        };
    }, []);

    // ==================== RENDER ====================
    return (
        <>
            <h1>CGP Viewer</h1>
            
            {/* Control panel for CGP input and file upload */}
            <ControlPanel
                cgpString={cgpString}
                onStringChange={setCgpString}
                onFileChange={handleFileChange}
                onResetExample={resetToDefaultExample}
                onResetNames={handleResetNames}
            />
            
            {/* Display any errors from parsing or file loading */}
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

            {/* File List Modal - allows selecting from multiple files */}
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
            
            {/* Tab panels for additional information and settings */}
            <Tabs initiallyOpen={false}>
                {/* Information tab - shows CGP configuration and allows name editing */}
                <TabPane label="Information">
                    <InformationTab 
                        parsedData={parsedData} 
                        activeNodeCount={activeNodes.size} 
                        parseError={parseError}
                        customNames={customNames}
                        customFunctions={customFunctions}
                        onUpdateNames={handleUpdateNames}
                        onUpdateFunctions={handleUpdateFunctions}
                    />
                </TabPane>
                
                {/* Functions tab - shows function documentation */}
                <TabPane label="Functions">
                    <FunkceTab 
                        customNames={customNames}
                        customFunctions={customFunctions}
                    />
                </TabPane>
                
                {/* Settings tab - allows changing visualization options */}
                <TabPane label="Settings">
                    <NastaveniTab 
                        settings={settings} 
                        onSettingChange={handleSettingChange}
                        onAutoAlign={handleAutoAlign}
                        onRestoreView={handleRestoreView}
                    />
                </TabPane>
            </Tabs>

            {/* Information footer - shows details about hovered node */}
            {settings.showFooter && (
                <div className="footer-container">
                    <InfoFooter 
                        hoveredNode={hoveredNode}
                        highlightedPath={highlightedPath}
                        nodeDelays={parsedData?.nodeDelays || {}}
                        parsedData={parsedData}
                        customFunctions={customFunctions}
                    />
                </div>
            )}

            {/* Main visualization area */}
            <div className="visualization-area" style={{ height: '600px', width: '100%', minWidth: '600px', position: 'relative' }}>
                {(!parseError && !error && parsedData) ? (
                    <Visualization
                        settings={settings}
                        activeNodes={activeNodes}
                        rfNodes={rfNodes}
                        rfEdges={rfEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        visualConfig={visualConfig}
                        highlightedPath={highlightedPath}
                        activeNodesHighlightingEnabled={activeNodesHighlightingEnabled}
                        onToggleActiveNodesHighlighting={() => 
                            setActiveNodesHighlightingEnabled(prev => !prev)
                        }
                        onNodeMouseEnter={handleNodeHover}
                        onNodeMouseLeave={handleClearHover}
                        onPaneMouseEnter={handleClearHover}
                        customNames={customNames}
                        onInit={setReactFlowInstance}
                        onNodeDragStop={onNodeDragStop}
                    />
                ) : (
                    <div className="visualization-placeholder">
                        {parseError || error ? (
                            <div className="nothing-to-visualize">
                                Nothing to visualize
                                <span className="subtext">Please fix the error above to see the visualization</span>
                            </div>
                        ) : (
                            <div className="enter-cgp-message">Enter/Upload CGP string</div>
                        )}
                    </div>
                )}
            </div>

            {/* CGP Tester toggle button */}
            <button 
                onClick={() => setShowTester(prev => !prev)}
                style={{ 
                    position: 'absolute', 
                    top: '10px', 
                    right: '10px',
                    background: '#2c313a',
                    color: '#abb2bf',
                    border: '1px solid #3e4452',
                    borderRadius: '4px',
                    padding: '5px 10px'
                }}
            >
                {showTester ? 'Hide Tester' : 'Show Tester'}
            </button>
            
            {/* CGP Tester component (conditionally rendered) */}
            {showTester && <CGPTester />}
        </>
    );
}

export default App;