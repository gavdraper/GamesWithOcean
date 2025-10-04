// Phaser Game Scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Create sprites directly instead of loading
        this.createPlayerSprite();
        this.createZombieSprite();
        this.createBackgroundTexture();
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        console.log('Create called - canvas size:', width, height);

        // Add background with tiled texture
        const bg = this.add.tileSprite(0, 0, width, height, 'background');
        bg.setOrigin(0, 0);

        // Add subtle overlay for better contrast (reduced opacity)
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.1);
        overlay.fillRect(0, 0, width, height);

        // Create player sprite
        this.player = this.add.sprite(150, height / 2, 'player');
        this.player.setScale(3);
        this.player.setDepth(10);
        console.log('Player created at:', this.player.x, this.player.y, 'Visible:', this.player.visible);

        // Create zombie sprite
        this.zombie = this.add.sprite(width - 150, height / 2, 'zombie');
        this.zombie.setScale(3);
        this.zombie.setFlipX(true); // Face the player
        this.zombie.setDepth(10);
        console.log('Zombie created at:', this.zombie.x, this.zombie.y, 'Visible:', this.zombie.visible);

        // Store initial positions
        this.playerStartX = 150;
        this.zombieStartX = width - 150;
        this.maxDistance = this.zombieStartX - this.playerStartX;

        // Verify textures exist
        console.log('Player texture exists:', this.textures.exists('player'));
        console.log('Zombie texture exists:', this.textures.exists('zombie'));
    }

    createPlayerSprite() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Draw a person running (player)
        graphics.fillStyle(0x3498db, 1); // Blue shirt
        graphics.fillCircle(25, 10, 8); // Head
        graphics.fillRect(20, 18, 10, 15); // Body
        graphics.fillStyle(0x2c3e50, 1); // Dark pants
        graphics.fillRect(20, 33, 4, 12); // Left leg
        graphics.fillRect(26, 33, 4, 12); // Right leg
        graphics.fillStyle(0xf39c12, 1); // Skin tone
        graphics.fillRect(15, 20, 5, 8); // Left arm
        graphics.fillRect(30, 20, 5, 8); // Right arm

        graphics.generateTexture('player', 50, 50);
        graphics.destroy();
    }

    createZombieSprite() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Draw a zombie
        graphics.fillStyle(0x27ae60, 1); // Green zombie body
        graphics.fillCircle(25, 10, 8); // Head
        graphics.fillRect(20, 18, 10, 15); // Body
        graphics.fillRect(20, 33, 4, 12); // Left leg
        graphics.fillRect(26, 33, 4, 12); // Right leg
        graphics.fillStyle(0x1e8449, 1); // Dark green
        graphics.fillRect(15, 20, 5, 8); // Left arm
        graphics.fillRect(30, 20, 5, 8); // Right arm
        graphics.fillStyle(0xff0000, 1); // Red eyes
        graphics.fillCircle(22, 9, 2);
        graphics.fillCircle(28, 9, 2);

        graphics.generateTexture('zombie', 50, 50);
        graphics.destroy();
    }

    createBackgroundTexture() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Create a subtle dark gradient with color variation
        graphics.fillGradientStyle(0x0a0e27, 0x1a1a2e, 0x16213e, 0x0a0e27, 1);
        graphics.fillRect(0, 0, 100, 100);

        // Add some subtle noise/texture
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const size = Math.random() * 2;
            const alpha = Math.random() * 0.3;
            graphics.fillStyle(0xffd60a, alpha);
            graphics.fillCircle(x, y, size);
        }

        graphics.generateTexture('background', 100, 100);
        graphics.destroy();
    }

    updateZombiePosition(zombieDistance) {
        if (!this.zombie) {
            console.error('Zombie sprite does not exist!');
            return;
        }

        // zombieDistance ranges from CONFIG.maxZombieDistance down to 0
        // As zombieDistance decreases, zombie moves closer to player (left)
        const ratio = zombieDistance / CONFIG.maxZombieDistance;
        const newX = this.playerStartX + (this.maxDistance * ratio);

        console.log('Zombie movement details:', {
            zombieDistance,
            maxDistance: CONFIG.maxZombieDistance,
            ratio,
            newX,
            currentX: this.zombie.x,
            playerStartX: this.playerStartX,
            zombieStartX: this.zombieStartX,
            maxDistanceCalc: this.maxDistance
        });

        // Smoothly tween zombie to new position
        this.tweens.add({
            targets: this.zombie,
            x: newX,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                console.log('Zombie movement complete. New position:', this.zombie.x);
            }
        });
    }

    playerCelebrate() {
        // Simple bounce animation for player
        this.tweens.add({
            targets: this.player,
            y: this.player.y - 20,
            duration: 300,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
    }

    zombieAttack(onComplete) {
        // Create two halves of the player for the "rip in half" effect
        const playerY = this.player.y;
        const playerX = this.player.x;

        // Hide original player
        this.player.setVisible(false);

        // Create top half
        const topHalf = this.add.sprite(playerX, playerY - 12, 'player');
        topHalf.setScale(2);
        topHalf.setCrop(0, 0, 50, 25); // Top half of sprite

        // Create bottom half
        const bottomHalf = this.add.sprite(playerX, playerY + 12, 'player');
        bottomHalf.setScale(2);
        bottomHalf.setCrop(0, 25, 50, 25); // Bottom half of sprite

        // Zombie lunges at player
        this.tweens.add({
            targets: this.zombie,
            x: playerX,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // Shake the zombie to simulate attack
                this.tweens.add({
                    targets: this.zombie,
                    angle: -10,
                    duration: 100,
                    yoyo: true,
                    repeat: 3
                });

                // Rip player in half - top flies up, bottom falls down
                this.tweens.add({
                    targets: topHalf,
                    y: playerY - 80,
                    x: playerX - 30,
                    angle: -45,
                    alpha: 0,
                    duration: 800,
                    ease: 'Power2'
                });

                this.tweens.add({
                    targets: bottomHalf,
                    y: playerY + 60,
                    x: playerX + 20,
                    angle: 30,
                    alpha: 0,
                    duration: 800,
                    ease: 'Power2',
                    onComplete: () => {
                        topHalf.destroy();
                        bottomHalf.destroy();
                        if (onComplete) onComplete();
                    }
                });

                // Add blood splatter effect (red particles)
                const particles = this.add.particles(playerX, playerY, 'player', {
                    speed: { min: 100, max: 200 },
                    angle: { min: 0, max: 360 },
                    scale: { start: 0.3, end: 0 },
                    tint: 0xff0000,
                    lifespan: 600,
                    gravityY: 300,
                    quantity: 20
                });

                setTimeout(() => {
                    particles.destroy();
                }, 1000);
            }
        });
    }

    reset() {
        // Reset positions
        this.zombie.x = this.zombieStartX;
        this.player.x = this.playerStartX;
        this.player.setVisible(true);
        this.player.setAngle(0);
        this.zombie.setAngle(0);
    }
}

// Phaser Game Manager
const PhaserGameManager = {
    game: null,
    scene: null,

    init() {
        const container = document.getElementById('phaser-game');
        const width = window.innerWidth;
        const height = window.innerHeight;

        console.log('Initializing Phaser with dimensions:', width, height);

        const config = {
            type: Phaser.AUTO,
            width: width,
            height: height,
            parent: 'phaser-game',
            backgroundColor: '#000000',
            scene: GameScene,
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                width: width,
                height: height
            }
        };

        this.game = new Phaser.Game(config);

        // Get scene reference immediately and also wait for ready event
        setTimeout(() => {
            this.scene = this.game.scene.getScene('GameScene');
            console.log('Phaser scene set:', !!this.scene);
            if (this.scene) {
                console.log('Scene has zombie:', !!this.scene.zombie);
                console.log('Scene has player:', !!this.scene.player);
            }
        }, 200);

        // Wait for scene to be ready
        this.game.events.once('ready', () => {
            this.scene = this.game.scene.getScene('GameScene');
            console.log('Phaser scene ready event fired');
        });

        // Handle window resize
        this.resizeHandler = () => {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;
            this.game.scale.resize(newWidth, newHeight);

            // Update sprite positions if scene exists
            if (this.scene && this.scene.player && this.scene.zombie) {
                this.scene.zombieStartX = newWidth - 150;
                this.scene.maxDistance = this.scene.zombieStartX - this.scene.playerStartX;
            }
        };
        window.addEventListener('resize', this.resizeHandler);
    },

    updateZombiePosition(zombieDistance) {
        console.log('PhaserGameManager.updateZombiePosition called with:', zombieDistance);
        console.log('Scene exists:', !!this.scene);
        console.log('Scene has updateZombiePosition method:', !!(this.scene && this.scene.updateZombiePosition));

        if (this.scene && this.scene.updateZombiePosition) {
            this.scene.updateZombiePosition(zombieDistance);
        } else {
            console.error('Cannot update zombie position - scene not ready');
        }
    },

    playerCelebrate() {
        if (this.scene && this.scene.playerCelebrate) {
            this.scene.playerCelebrate();
        }
    },

    zombieAttack(onComplete) {
        if (this.scene && this.scene.zombieAttack) {
            this.scene.zombieAttack(onComplete);
        } else if (onComplete) {
            onComplete();
        }
    },

    reset() {
        if (this.scene && this.scene.reset) {
            this.scene.reset();
        }
    },

    destroy() {
        if (this.game) {
            window.removeEventListener('resize', this.resizeHandler);
            this.game.destroy(true);
            this.game = null;
            this.scene = null;
        }
    }
};
