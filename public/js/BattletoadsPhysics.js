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
     *
     * @param {Object} player - Player object
     */
    applyGravity(player) {
        // Skip gravity for certain conditions (water, invulnerability, etc.)
        if (this.shouldSkipGravity(player)) {
            return;
        }

        // Add gravity to subpixel velocity first
        player.zSpeedSub += this.constants.GRAVITY;

        // Handle carry from subpixel to main velocity
        if (player.zSpeedSub >= this.constants.SUBPIXEL_PRECISION) {
            player.zSpeedSub -= this.constants.SUBPIXEL_PRECISION;
            player.zSpeed += 1;
        } else if (player.zSpeedSub < 0) {
            player.zSpeedSub += this.constants.SUBPIXEL_PRECISION;
            player.zSpeed -= 1;
        }
    }

    /**
     * Check if gravity should be skipped for this player
     * Based on water flags, invulnerability, etc.
     *
     * @param {Object} player - Player object
     * @returns {boolean} True if gravity should be skipped
     */
    shouldSkipGravity(player) {
        // In water or special states
        return player.invulnerable || player.state === 'DEAD';
    }

    /**
     * Handle player input for movement and actions
     *
     * @param {Object} player - Player object
     * @param {Object} input - Input state
     */
    handleInput(player, input) {
        // Horizontal movement
        if (input.left) {
            player.facing = -1;
            player.xSpeed -= this.constants.WALK_ACCEL;
        } else if (input.right) {
            player.facing = 1;
            player.xSpeed += this.constants.WALK_ACCEL;
        } else {
            // Apply friction when no input
            player.xSpeed = Math.round(player.xSpeed * 0.8);
        }

        // Jump input (only when on ground)
        if (input.jump && player.isGrounded && player.zFloor === 0) {
            player.zSpeed = this.constants.JUMP_VELOCITY;
            player.zSpeedSub = 0;
            player.isGrounded = false;
            player.zFloor = 8; // In air
        }

        // Attack input
        if (input.attack) {
            // Handle attack logic (would transition to PUNCH/HURT states)
            // For now, just log
            console.log('Attack input received');
        }
    }

    /**
     * Update position based on velocity
     * Applies subpixel precision movement
     *
     * @param {Object} player - Player object
     */
    updatePosition(player) {
        // Update X position
        player.xSub += player.xSpeed;
        player.xPos += Math.floor(player.xSub / this.constants.SUBPIXEL_PRECISION);
        player.xSub %= this.constants.SUBPIXEL_PRECISION;

        // Update Y position
        player.ySub += player.ySpeed;
        player.yPos += Math.floor(player.ySub / this.constants.SUBPIXEL_PRECISION);
        player.ySub %= this.constants.SUBPIXEL_PRECISION;

        // Update Z position
        player.zSub += player.zSpeed;
        player.zPos += Math.floor(player.zSub / this.constants.SUBPIXEL_PRECISION);
        player.zSub %= this.constants.SUBPIXEL_PRECISION;
    }

    /**
     * Apply speed limits to prevent excessive velocities
     *
     * @param {Object} player - Player object
     */
    applySpeedLimits(player) {
        // X speed limit (from speed_limit function)
        player.xSpeed = Math.max(-this.constants.SPEED_LIMIT,
                                Math.min(this.constants.SPEED_LIMIT, player.xSpeed));

        // Y speed limit (if applicable)
        player.ySpeed = Math.max(-this.constants.SPEED_LIMIT,
                                Math.min(this.constants.SPEED_LIMIT, player.ySpeed));

        // Z speed can be higher for jumps/falls
        // No explicit limit in ASM, but reasonable bounds
        player.zSpeed = Math.max(-400, Math.min(400, player.zSpeed));
    }

    /**
     * Update player state based on current conditions
     *
     * @param {Object} player - Player object
     */
    updatePlayerState(player) {
        // Update grounded state based on zFloor
        player.isGrounded = player.zFloor === 0;

        // State machine transitions (simplified)
        if (player.isGrounded) {
            if (Math.abs(player.xSpeed) > 10) {
                player.state = 'WALK';
            } else {
                player.state = 'IDLE';
            }
        } else {
            if (player.zSpeed < 0) {
                player.state = 'JUMP';
            } else {
                player.state = 'FALL';
            }
        }
    }

    /**
     * Apply collision response (bounce)
     * Based on test_Z_speed_and_floor? function (lines 8729-8760)
     *
     * @param {Object} player - Player object
     */
    applyBounce(player) {
        // Only bounce if was falling and hit ground
        if (player.zSpeed <= 0) return;

        // Reverse velocity (EOR #$FF = bitwise NOT)
        player.zSpeed = (~player.zSpeed & 0xFF);
        player.zSpeedSub = (~player.zSpeedSub & 0xFF);

        // Apply damping for players (divide by 2)
        player.zSpeed = Math.floor(player.zSpeed * this.constants.BOUNCE_DAMPING);
        player.zSpeedSub = Math.floor(player.zSpeedSub * this.constants.BOUNCE_DAMPING);
    }

    /**
     * Resolve collision by adjusting position
     *
     * @param {Object} player - Player object
     * @param {number} floorHeight - Floor height at current position
     */
    resolveCollision(player, floorHeight) {
        if (player.zPos < floorHeight) {
            // Move player up to floor level
            player.zPos = floorHeight;
            player.zFloor = 0;
            player.isGrounded = true;

            // Stop downward velocity
            if (player.zSpeed > 0) {
                player.zSpeed = 0;
                player.zSpeedSub = 0;
            }
        }
    }

    /**
     * Get physics debug info
     *
     * @param {string} playerId - Player identifier
     * @returns {Object} Debug information
     */
    getDebugInfo(playerId) {
        const player = this.getPlayer(playerId);
        if (!player) return null;

        return {
            position: {
                x: player.xPos,
                y: player.yPos,
                z: player.zPos
            },
            velocity: {
                x: player.xSpeed,
                y: player.ySpeed,
                z: player.zSpeed
            },
            subpixel: {
                x: player.xSub,
                y: player.ySub,
                z: player.zSub
            },
            collision: {
                zFloor: player.zFloor,
                isGrounded: player.isGrounded
            },
            state: player.state,
            facing: player.facing
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BattletoadsPhysics;
}
