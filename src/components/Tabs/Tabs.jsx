// src/components/Tabs/Tabs.jsx
import React, { useState } from 'react';
// import './Tabs.css'; // Optional: if you create Tabs.css

function Tabs({ children, initiallyOpen = true }) { // Default prop value
    // Initialize activeTab correctly, ensuring children exist and have props
    const firstChild = React.Children.toArray(children)[0];
    const firstTabLabel = firstChild && firstChild.props && firstChild.props.label ? firstChild.props.label : '';
    const [activeTab, setActiveTab] = useState(firstTabLabel);

    // Initialize isContentVisible using the initiallyOpen prop
    const [isContentVisible, setIsContentVisible] = useState(initiallyOpen);

    const handleTabClick = (e, newActiveTab) => {
        e.preventDefault();
        setActiveTab(newActiveTab);
        if (!isContentVisible) { // If content is hidden, show it when a tab is clicked
            setIsContentVisible(true);
        }
    };

    const toggleContentVisibility = () => {
        setIsContentVisible(prevState => !prevState); // Use functional update for toggling
    };

    return (
        <div className="tabs-container">
            <div className="tab-header">
                <div className="tab-buttons">
                    {React.Children.map(children, (child) => {
                        if (!React.isValidElement(child) || !child.props.label) return null;
                        const label = child.props.label;
                        return (
                            <button
                                key={label}
                                className={`tab-button ${activeTab === label ? 'active' : ''}`}
                                onClick={(e) => handleTabClick(e, label)}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
                <button onClick={toggleContentVisibility} className="tab-toggle-button">
                    {isContentVisible ? 'Hide Details' : 'Show Details'}
                </button>
            </div>

            {isContentVisible && (
                <div className="tab-content">
                    {React.Children.map(children, (child) => {
                        if (!React.isValidElement(child) || !child.props.label) return null;
                        if (child.props.label === activeTab) {
                            return <div key={child.props.label}>{child.props.children}</div>;
                        }
                        return null;
                    })}
                </div>
            )}
        </div>
    );
}

export default Tabs;