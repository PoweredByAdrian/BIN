import React, { useState } from 'react';
import { FaTimes, FaFilter } from 'react-icons/fa';
 // Adjust the path as necessary

const FileListModal = ({ files, currentFileIndex, onSelect, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredFiles = files.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return (
        <div className="file-list-modal-overlay">
            <div className="file-list-modal">
                <div className="file-list-header">
                    <h3>Available Files</h3>
                    <button className="close-button" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                
                <div className="file-search">
                    <FaFilter />
                    <input 
                        type="text" 
                        placeholder="Filter files..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <ul className="file-list">
                    {filteredFiles.length > 0 ? (
                        filteredFiles.map((file, index) => (
                            <li 
                                key={index}
                                className={index === currentFileIndex ? 'active' : ''}
                                onClick={() => onSelect(index)}
                            >
                                <span className="file-list-name">{file.name}</span>
                                {file.metadata && (
                                    <span className="file-list-meta">
                                        {file.metadata}
                                    </span>
                                )}
                            </li>
                        ))
                    ) : (
                        <li className="no-results">No files match your filter</li>
                    )}
                </ul>
                
                <div className="file-list-footer">
                    <span>{files.length} files total</span>
                </div>
            </div>
        </div>
    );
};

export default FileListModal;