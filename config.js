// config.js - All tweakable game settings
// This file must be loaded before game.js

// Game Configuration
const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 600,
    WATER_LEVEL: 450,
    GRAVITY: 0.5,
    FRICTION: 0.85,
    WATER_FRICTION: 0.5,
    PLAYER_SPEED: 5,
    PLAYER_JUMP: 12,
    WATER_JUMP: 6,
    COMBO_TIMEOUT: 2000,
    PARTICLE_POOL_SIZE: 500,
    PARTICLE_MAX_ACTIVE: 2000,
};

// Frog type configuration - centralizes all type-specific properties
const FROG_TYPES = {
    small: {
        width: 30,
        height: 30,
        health: 20,
        jumpPower: 8,
        attackDamage: 3,
        score: 10,
        color: '#4CAF50',
        spriteSuffix: 'small',
        jumpingTargetSize: 50,  // Boost size when jumping for visibility
        hasRandomHue: false,
    },
    medium: {
        width: 40,
        height: 40,
        health: 40,
        jumpPower: 12,
        attackDamage: 6,
        score: 25,
        color: '#2196F3',
        spriteSuffix: 'medium',
        jumpingTargetSize: null,
        hasRandomHue: false,
    },
    poison_dart: {
        width: 25,
        height: 25,
        health: 15,
        jumpPower: 14,
        attackDamage: 10,
        score: 35,
        color: '#FF00FF',
        spriteSuffix: 'poison_dart',
        jumpingTargetSize: null,
        hasRandomHue: true,
    },
    large: {
        width: 60,
        height: 60,
        health: 80,
        jumpPower: 10,
        attackDamage: 12,
        score: 50,
        color: '#FF5722',
        spriteSuffix: 'large_boss',
        jumpingTargetSize: null,
        hasRandomHue: false,
    },
};
