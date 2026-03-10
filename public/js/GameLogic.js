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
     * Add a player to the game
     * @param {string} playerId - Player identifier
     * @param {Object} initialState - Initial player state
     * @returns {Object} Player object
     */
    addPlayer(playerId, initialState = {}) {
        const player = this.physics.initPlayer(playerId, initialState);
        this.players.set(playerId, player);
        return player;
    }

    /**
     * Update player physics and handle collisions
     * @param {string} playerId - Player identifier
     * @param {Object} input - Input state
     */
    updatePlayer(playerId, input) {
        const player = this.players.get(playerId);
        if (!player) return;

        // Update physics
        this.physics.updateObject(player, input);

        // Handle floor collisions if map is loaded
        if (this.mapLoader) {
            const collision = this.mapLoader.getCollisionInfo(player.xPos, player.yPos, player.zPos);
            if (collision.isColliding) {
                // Adjust Z position to floor
                player.zPos = collision.floorHeight;
                player.zSpeed = 0;
                player.isGrounded = true;
            }
        }
    }

    /**
     * Get player state for network sync
     * @param {string} playerId - Player identifier
     * @returns {Object} Player state
     */
    getPlayerState(playerId) {
        const player = this.players.get(playerId);
        if (!player) return null;

        return {
            id: playerId,
            xPos: player.xPos,
            yPos: player.yPos,
            zPos: player.zPos,
            xSpeed: player.xSpeed,
            ySpeed: player.ySpeed,
            zSpeed: player.zSpeed,
            facing: player.facing,
            state: player.state,
            isGrounded: player.isGrounded
        };
    }

    /**
     * Update remote player state
     * @param {Object} state - Player state from network
     */
    updateRemotePlayer(state) {
        let player = this.players.get(state.id);
        if (!player) {
            player = this.addPlayer(state.id, state);
        } else {
            // Update existing player
            Object.assign(player, state);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameLogic;
}
