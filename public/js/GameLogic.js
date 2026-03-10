/**
 * GameLogic.js - Main game logic integration for Battletoads Phaser port
 *
 * Integrates BattletoadsPhysics and LevelMapLoader to handle:
 * - Physics updates each frame
 * - Floor collision detection and response
 * - Coordinate system mapping between Battletoads and Phaser
 * - Player state management
 */

class GameLogic {
    constructor() {
        // Initialize physics engine
        this.physics = new BattletoadsPhysics();

        // Level map loader (will be set when level loads)
        this.mapLoader = null;

        // Coordinate system mapping
        this.coordinateMapping = {
            // Battletoads -> Phaser coordinate mapping
            battletoadsToPhaser: {
                x: 'x',      // Battletoads X -> Phaser X (horizontal)
                y: 'z',      // Battletoads Z -> Phaser Y (vertical height)
                z: 'y'       // Battletoads Y -> Phaser Z (depth/layering)
            },
            // Phaser -> Battletoads coordinate mapping
            phaserToBattletoads: {
                x: 'x',      // Phaser X -> Battletoads X
                y: 'z',      // Phaser Y -> Battletoads Z (vertical)
                z: 'y'       // Phaser Z -> Battletoads Y (depth)
            }
        };

        // Game state
        this.players = new Map();
        this.currentLevel = 1;
    }

    /**
     * Initialize the game logic with a level
     *
     * @param {number} levelId - Level identifier
     * @param {Uint8Array} mapData - Raw map data from ROM
     */
    async initLevel(levelId, mapData) {
        this.currentLevel = levelId;
        this.mapLoader = new LevelMapLoader(mapData, levelId);

        console.log(`GameLogic: Initialized level ${levelId} with ${mapData.length} bytes of map data`);
    }

    /**
     * Create a new player
     *
     * @param {string} playerId - Unique player identifier
     * @param {Object} initialPosition - Initial position {x, y, z} in Phaser coordinates
     * @returns {Object} Player object
     */
    createPlayer(playerId, initialPosition = {x: 0, y: 0, z: 0}) {
        // Convert Phaser coordinates to Battletoads coordinates
        const battletoadsPos = this.phaserToBattletoads(initialPosition);

        const player = this.physics.initPlayer(playerId, {
            xPos: battletoadsPos.x,
            yPos: battletoadsPos.y,
            zPos: battletoadsPos.z,
            levelId: this.currentLevel
        });

        this.players.set(playerId, player);
        return player;
    }

    /**
     * Main game tick - process one frame of game logic
     * This is the core function called each Phaser update cycle
     *
     * @param {string} playerId - Player identifier
     * @param {Object} input - Input state {left, right, up, down, jump, attack}
     * @param {LevelMapLoader} mapLoader - Map loader instance (optional, uses this.mapLoader if not provided)
     * @returns {Object} Updated player state in Phaser coordinates
     */
    processGameTick(playerId, input = {}, mapLoader = null) {
        const player = this.players.get(playerId);
        if (!player) {
            console.error(`GameLogic: Player ${playerId} not found`);
            return null;
        }

        // Use provided mapLoader or default to this.mapLoader
        const activeMapLoader = mapLoader || this.mapLoader;
        if (!activeMapLoader) {
            console.error('GameLogic: No map loader available');
            return this.battletoadsToPhaser(player);
        }

        // Step 1: Get current floor height at player's position
        const floorHeight = activeMapLoader.getFloorHeightAt(player.xPos, player.yPos);

        // Step 2: Update physics (gravity, velocity, position)
        this.physics.updateObject(player, input);

        // Step 3: Resolve floor collisions
        this.resolveFloorCollision(player, floorHeight);

        // Step 4: Apply bounce physics if needed
        if (player.shouldBounce) {
            this.physics.applyBounce(player);
            player.shouldBounce = false; // Reset flag
        }

        // Return player state in Phaser coordinates
        return this.battletoadsToPhaser(player);
    }

    /**
     * Resolve floor collision for a player
     * Based on the collision logic from Battletoads ASM
     *
     * @param {Object} player - Player object (Battletoads coordinates)
     * @param {number} floorHeight - Floor height at current position
     */
    resolveFloorCollision(player, floorHeight) {
        // Check if player is below floor level (collision)
        const isColliding = player.zPos < floorHeight;

        if (isColliding) {
            // Calculate penetration depth
            const penetration = floorHeight - player.zPos;

            // Move player up to floor level
            player.zPos = floorHeight;
            player.zFloor = 0; // On ground
            player.isGrounded = true;

            // Check if this was a falling collision (for bounce)
            const wasFalling = player.zSpeed > 0;
            if (wasFalling && penetration < 10) { // Close enough to bounce
                player.shouldBounce = true;
            }

            // Stop downward velocity
            if (player.zSpeed > 0) {
                player.zSpeed = 0;
                player.zSpeedSub = 0;
            }
        } else {
            // Player is above floor (in air)
            player.zFloor = 8; // Air flag
            player.isGrounded = false;
        }
    }

    /**
     * Convert Phaser coordinates to Battletoads coordinates
     * Battletoads uses: X=horizontal, Y=depth, Z=vertical height
     * Phaser typically uses: X=horizontal, Y=vertical, Z=depth
     *
     * @param {Object} phaserCoords - {x, y, z} in Phaser coordinate system
     * @returns {Object} {x, y, z} in Battletoads coordinate system
     */
    phaserToBattletoads(phaserCoords) {
        return {
            x: phaserCoords.x,                    // Phaser X -> Battletoads X (horizontal)
            y: phaserCoords.z || 0,              // Phaser Z -> Battletoads Y (depth)
            z: phaserCoords.y                    // Phaser Y -> Battletoads Z (vertical)
        };
    }

    /**
     * Convert Battletoads coordinates to Phaser coordinates
     * Battletoads uses: X=horizontal, Y=depth, Z=vertical height
     * Phaser typically uses: X=horizontal, Y=vertical, Z=depth
     *
     * @param {Object} battletoadsCoords - {x, y, z} in Battletoads coordinate system
     * @returns {Object} {x, y, z} in Phaser coordinate system
     */
    battletoadsToPhaser(battletoadsCoords) {
        return {
            x: battletoadsCoords.x,              // Battletoads X -> Phaser X (horizontal)
            y: battletoadsCoords.z,              // Battletoads Z -> Phaser Y (vertical)
            z: battletoadsCoords.y               // Battletoads Y -> Phaser Z (depth)
        };
    }

    /**
     * Get player debug information
     *
     * @param {string} playerId - Player identifier
     * @returns {Object} Debug information with both coordinate systems
     */
    getPlayerDebugInfo(playerId) {
        const player = this.players.get(playerId);
        if (!player) return null;

        const physicsDebug = this.physics.getDebugInfo(playerId);
        const phaserCoords = this.battletoadsToPhaser(player);

        return {
            playerId: playerId,
            battletoadsCoords: {
                x: player.xPos,
                y: player.yPos,
                z: player.zPos
            },
            phaserCoords: phaserCoords,
            physics: physicsDebug,
            collision: {
                floorHeight: this.mapLoader ? this.mapLoader.getFloorHeightAt(player.xPos, player.yPos) : 'No map',
                zFloor: player.zFloor,
                isGrounded: player.isGrounded,
                shouldBounce: player.shouldBounce
            },
            state: player.state,
            level: this.currentLevel
        };
    }

    /**
     * Update level map data
     *
     * @param {Uint8Array} newMapData - New map data
     */
    updateMapData(newMapData) {
        if (this.mapLoader) {
            // Create new map loader with updated data
            this.mapLoader = new LevelMapLoader(newMapData, this.currentLevel);
        }
    }

    /**
     * Get collision info at a specific position
     *
     * @param {number} x - X coordinate (Phaser)
     * @param {number} y - Y coordinate (Phaser)
     * @returns {Object} Collision information
     */
    getCollisionAt(x, y) {
        if (!this.mapLoader) return null;

        // Convert to Battletoads coordinates for collision check
        const battletoadsPos = this.phaserToBattletoads({x, y, z: 0});
        return this.mapLoader.getCollisionInfo(battletoadsPos.x, battletoadsPos.y, 0);
    }

    /**
     * Check if a position is valid (has floor collision)
     *
     * @param {number} x - X coordinate (Phaser)
     * @param {number} y - Y coordinate (Phaser)
     * @returns {boolean} True if position has valid floor
     */
    isValidPosition(x, y) {
        const collision = this.getCollisionAt(x, y);
        return collision && collision.floorHeight > 0;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLogic;
}
