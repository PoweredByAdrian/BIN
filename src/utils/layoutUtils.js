// src/utils/layoutUtils.js

/**
 * Calculates standard grid node positions.
 * @param {object} parsedData - The parsed CGP data { config }.
 * @param {object} visualConfig - Configuration for visuals.
 * @returns {object} positions: { [nodeIndex]: { x, y } } // Center coords for React Flow preferred
 */
export function calculateInitialGridPositions(parsedData, visualConfig) {
    if (!parsedData || !parsedData.config) return {};
    
    const { config } = parsedData;
    const { nodeSize, gridSpacing } = visualConfig;
    
    const positions = {};
    
    // Use enhanced spacing values similar to autoAlignByDelay
    const enhancedHorizontalSpacing = gridSpacing * 2;  // 100% more horizontal space
    const enhancedVerticalSpacing = gridSpacing * 2;          // 100% more vertical spacing

    for (let r = 0; r < config.rows; r++) {
        for (let c = 0; c < config.cols; c++) {
            const nodeIndex = config.startIndex + c * config.rows + r;
            
            positions[nodeIndex] = {
                x: c * (nodeSize + enhancedHorizontalSpacing),
                y: r * (nodeSize + enhancedVerticalSpacing)
            };
        }
    }
    
    return positions;
}