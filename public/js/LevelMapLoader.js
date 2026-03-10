/**
 * LevelMapLoader - Handles 3D collision map data for Battletoads levels
 *
 * Loads raw tile data from ROM and provides floor height calculations
 * based on the reverse-engineered collision system.
 */
class LevelMapLoader {
    /**
     * @param {Uint8Array} mapData - Raw tile data from ROM
     * @param {number} levelId - Level identifier (1-13)
     */
    constructor(mapData, levelId) {
        this.mapData = mapData;
        this.levelId = levelId;
        this.baseFloorHeight = this.getBaseFloorHeightForLevel(levelId);
    }

    /**
     * Get the base floor height offset for a specific level
     * Most levels use 0xC0 (192), Volkmire Inferno uses 0xB8 (184)
     *
     * @param {number} levelId - Level identifier
     * @returns {number} Base floor height
     */
    getBaseFloorHeightForLevel(levelId) {
        // Level 6 = Volkmire Inferno uses different base height
        return levelId === 6 ? 0xB8 : 0xC0;
    }

    /**
     * Get floor height at specific coordinates
     * Implements the collision logic: actual_floor_height = (tile_byte & 0xF0) - 0x0A
     *
     * @param {number} x - X coordinate (world position)
     * @param {number} y - Y coordinate (currently unused in simplified implementation)
     * @returns {number} Floor height at the given position, or 0 if no collision
     */
    getFloorHeightAt(x, y) {
        // Calculate X tile index: equivalent to (x & 0xE0) >> 3
        // This divides X position by 8 to get tile coordinate
        const xTileIndex = x >> 3;

        // Bounds check - ensure we don't read outside map data
        if (xTileIndex < 0 || xTileIndex >= this.mapData.length) {
            return 0; // No collision outside map bounds
        }

        // Read tile byte from map data
        const tileByte = this.mapData[xTileIndex];

        // Extract floor height: upper nibble minus offset
        // tile & 0xF0 gets the upper 4 bits, then subtract 0x0A
        const encodedHeight = tileByte & 0xF0;
        const actualFloorHeight = encodedHeight - 0x0A;

        // Return the calculated floor height
        return actualFloorHeight;
    }

    /**
     * Load raw binary map data for a specific level
     * This is a placeholder method - implement with actual ROM loading logic
     *
     * @param {number} levelId - Level identifier to load
     * @returns {Promise<Uint8Array>} Promise resolving to map data
     */
    async loadMap(levelId) {
        // TODO: Implement actual ROM data loading
        // This should fetch the binary data from the ROM file
        // For now, return empty array as placeholder

        console.warn(`LevelMapLoader.loadMap(${levelId}): Not implemented yet. ` +
                    `Please provide ROM file path/URL for level ${levelId} map data.`);

        // Placeholder - replace with actual loading logic
        return new Uint8Array(0);
    }

    /**
     * Check if a position has valid floor collision
     *
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if position has floor collision
     */
    hasFloorAt(x, y) {
        const floorHeight = this.getFloorHeightAt(x, y);
        return floorHeight > 0;
    }

    /**
     * Get collision info for player physics
     * Returns detailed collision data for use with checkFloorCollision
     *
     * @param {number} x - Player X position
     * @param {number} y - Player Y position
     * @param {number} zPos - Player Z position
     * @returns {Object} Collision information
     */
    getCollisionInfo(x, y, zPos) {
        const floorHeight = this.getFloorHeightAt(x, y);
        const isColliding = zPos < floorHeight;
        const zFloor = isColliding ? floorHeight - zPos : 0;

        return {
            floorHeight: floorHeight,
            isColliding: isColliding,
            zFloor: zFloor,
            shouldBounce: false // Will be set by physics system based on velocity
        };
    }

    /**
     * Get map data statistics for debugging
     *
     * @returns {Object} Map statistics
     */
    getMapStats() {
        if (!this.mapData || this.mapData.length === 0) {
            return { length: 0, minHeight: 0, maxHeight: 0, avgHeight: 0 };
        }

        let minHeight = Infinity;
        let maxHeight = -Infinity;
        let totalHeight = 0;

        for (let i = 0; i < this.mapData.length; i++) {
            const height = (this.mapData[i] & 0xF0) - 0x0A;
            minHeight = Math.min(minHeight, height);
            maxHeight = Math.max(maxHeight, height);
            totalHeight += height;
        }

        return {
            length: this.mapData.length,
            minHeight: minHeight,
            maxHeight: maxHeight,
            avgHeight: Math.round(totalHeight / this.mapData.length)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LevelMapLoader;
}
