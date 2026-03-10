/**
 * BattletoadsPhysics - Core physics engine for Battletoads game logic
 * Implements the Z-axis physics, movement, and collision response
 * Based on reverse-engineered ASM from Battletoads (Genesis)
 */

class BattletoadsPhysics {
    constructor() {
        // Physics constants from ASM analysis
        this.constants = {
            GRAVITY: 1,              // +1 per frame to Z_speed (line 3770)
            JUMP_VELOCITY: -240,     // Z_speed = $F0 (negative = upward)
            SPEED_LIMIT: 128,        // X_speed capped at $80 (128 decimal)
            WALK_ACCEL: 8,           // Acceleration per frame
            BOUNCE_DAMPING: 0.5,     // Player bounce reduced by 50%
            SUBPIXEL_PRECISION: 256, // 8-bit subpixel precision
        };

        // Player state tracking
        this.players = new Map();
    }

    /**
     * Initialize a player object with physics properties
     * @param {string} playerId - Unique identifier for the player
     * @param {Object} initialState - Initial player state
     */
    initPlayer(playerId, initialState = {}) {
        const player = {
            // Position (Battletoads coordinate system)
            xPos: initialState.xPos || 0,        // X position (horizontal)
            yPos: initialState.yPos || 0,        // Y position (screen depth)
            zPos: initialState.zPos || 0,        // Z position (vertical height)

            // Velocity
            xSpeed: initialState.xSpeed || 0,    // X velocity
            ySpeed: initialState.ySpeed || 0,    // Y velocity
            zSpeed: initialState.zSpeed || 0,    // Z velocity

            // Subpixel precision (from ASM objects_Z_spd_sub, Objects_Z_sub)
            xSpeedSub: initialState.xSpeedSub || 0,
            ySpeedSub: initialState.ySpeedSub || 0,
            zSpeedSub: initialState.zSpeedSub || 0,
            xSub: initialState.xSub || 0,
            ySub: initialState.ySub || 0,
            zSub: initialState.zSub || 0,

            // Collision state
            zFloor: initialState.zFloor || 8,    // Distance to floor (0=on ground, 8=in air)
            isGrounded: initialState.isGrounded || false,

            // Player properties
            facing: initialState.facing || 1,    // 1=right, -1=left
            state: initialState.state || 'IDLE', // Player state machine
            invulnerable: initialState.invulnerable || false,

            // Level context
            levelId: initialState.levelId || 1,
        };

        this.players.set(playerId, player);
        return player;
    }

    /**
     * Get player by ID
     * @param {string} playerId - Player identifier
     * @returns {Object} Player object
     */
    getPlayer(playerId) {
        return this.players.get(playerId);
    }

    /**
     * Update object physics for one frame
     * Main physics update function called each game tick
     *
     * @param {Object} player - Player object to update
     * @param {Object} input - Input state {left, right, up, down, jump, attack}
     */
    updateObject(player, input = {}) {
        // Apply gravity first (always, unless special conditions)
        this.applyGravity(player);

        // Handle input-based movement
        this.handleInput(player, input);

        // Update position based on velocity
        this.updatePosition(player);

        // Apply speed limits
        this.applySpeedLimits(player);

        // Update player state based on movement/collision
        this.updatePlayerState(player);
    }

    /**
     * Apply gravity to Z velocity
     * Based on objects_Z_phys? function (lines 3767-3834)
     */
    applyGravity(player) {
        player.zSpeed += this.constants.GRAVITY;
    }

    /**
     * Handle player input for movement
     * @param {Object} player - Player object
     * @param {Object} input - Input state
     */
    handleInput(player, input) {
        // Horizontal movement
        if (input.left) {
            player.xSpeed -= this.constants.WALK_ACCEL;
            player.facing = -1;
        }
        if (input.right) {
            player.xSpeed += this.constants.WALK_ACCEL;
            player.facing = 1;
        }

        // Jump
        if (input.jump && player.isGrounded) {
            player.zSpeed = this.constants.JUMP_VELOCITY;
            player.isGrounded = false;
        }
    }

    /**
     * Update position based on velocity with subpixel precision
     * @param {Object} player - Player object
     */
    updatePosition(player) {
        // Update subpixel accumulators
        player.xSub += player.xSpeed;
        player.zSub += player.zSpeed;

        // Convert subpixel to pixel movement
        const xMove = Math.floor(player.xSub / this.constants.SUBPIXEL_PRECISION);
        const zMove = Math.floor(player.zSub / this.constants.SUBPIXEL_PRECISION);

        // Update positions
        player.xPos += xMove;
        player.zPos += zMove;

        // Keep subpixel remainder
        player.xSub %= this.constants.SUBPIXEL_PRECISION;
        player.zSub %= this.constants.SUBPIXEL_PRECISION;
    }

    /**
     * Apply speed limits to prevent excessive velocity
     * @param {Object} player - Player object
     */
    applySpeedLimits(player) {
        // X speed limit
        if (player.xSpeed > this.constants.SPEED_LIMIT) {
            player.xSpeed = this.constants.SPEED_LIMIT;
        } else if (player.xSpeed < -this.constants.SPEED_LIMIT) {
            player.xSpeed = -this.constants.SPEED_LIMIT;
        }

        // Z speed limit (falling speed)
        if (player.zSpeed > this.constants.SPEED_LIMIT) {
            player.zSpeed = this.constants.SPEED_LIMIT;
        }
    }

    /**
     * Update player state based on current conditions
     * @param {Object} player - Player object
     */
    updatePlayerState(player) {
        // Ground collision (simplified)
        if (player.zPos <= 0) {
            player.zPos = 0;
            player.zSpeed = 0;
            player.isGrounded = true;
        } else {
            player.isGrounded = false;
        }

        // Update state machine
        if (player.isGrounded) {
            if (Math.abs(player.xSpeed) > 0) {
                player.state = 'WALKING';
            } else {
                player.state = 'IDLE';
            }
        } else {
            player.state = 'JUMPING';
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BattletoadsPhysics;
}
