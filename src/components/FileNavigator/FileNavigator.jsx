import React from 'react';
import { FaChevronLeft, FaChevronRight, FaList } from 'react-icons/fa';


const FileNavigator = ({ 
    files, 
    currentFileIndex, 
    onNavigate,
    onShowFileList
}) => {
    if (!files || files.length === 0) return null;

    const isFirst = currentFileIndex === 0;
    const isLast = currentFileIndex === files.length - 1;
    
    return (
        <div className="file-navigator">
            <button 
                className="nav-button prev-button"
                disabled={isFirst}
                onClick={() => onNavigate(currentFileIndex - 1)}
                title="Previous file"
            >
                <FaChevronLeft />
                <span>Prev</span>
            </button>
            
            <div className="file-info">
                <span className="file-name" title={files[currentFileIndex].name}>
                    {files[currentFileIndex].name}
                </span>
                <div className="file-position">
                    {currentFileIndex + 1} of {files.length}
                </div>
            </div>
            
            <button 
                className="nav-button file-list-button"
                onClick={onShowFileList}
                title="Show file list"
            >
                <FaList />
                <span>Files</span>
            </button>
            
            <button 
                className="nav-button next-button"
                disabled={isLast}
                onClick={() => onNavigate(currentFileIndex + 1)}
                title="Next file"
            >
                <span>Next</span>
                <FaChevronRight />
            </button>
        </div>
    );
};

export default FileNavigator;