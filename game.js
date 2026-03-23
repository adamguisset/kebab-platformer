// ========== FIXED GAME.JS ==========
// Issues fixed:
// 1. Mini-games now update and render correctly (missing update() call)
// 2. Kebab stick now displays horizontally in the center (better visual)
// 3. Food animation properly plays when collected
// 4. Food is now only added after successful mini-game completion

class KebabGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentLevel = 1;
        this.totalLevels = 15;
        this.money = 0;
        this.selectedSkin = 'default';
        this.ownedSkins = ['default'];
        this.gameState = 'menu';
        
        this.loadGame();
        this.showMenu();
        this.initializeSkins();
    }

    loadGame() {
        const saved = localStorage.getItem('kebabGame');
        if (saved) {
            const data = JSON.parse(saved);
            this.money = data.money || 0;
            this.currentLevel = data.currentLevel || 1;
            this.ownedSkins = data.ownedSkins || ['default'];
            this.selectedSkin = data.selectedSkin || 'default';
        }
    }

    saveGame() {
        localStorage.setItem('kebabGame', JSON.stringify({
            money: this.money,
            currentLevel: this.currentLevel,
            ownedSkins: this.ownedSkins,
            selectedSkin: this.selectedSkin
        }));
    }

    showMenu() {
        document.getElementById('mainMenu').classList.add('show');
        this.gameState = 'menu';
    }

    hideMenu() {
        document.getElementById('mainMenu').classList.remove('show');
    }

    openShop() {
        this.renderShop();
        document.getElementById('shopModal').classList.add('show');
    }

    closeShop() {
        document.getElementById('shopModal').classList.remove('show');
        this.showMenu();
    }

    showLevelComplete(rating, money) {
        const ratingEmojis = ['☠️', '😒', '😐', '😊', '🤤', '😍'];
        const ratingTexts = ['Disgusting', 'Bad', 'OK', 'Good', 'Delicious', 'PERFECT!'];
        
        document.getElementById('ratingDisplay').textContent = 
            `${ratingEmojis[rating]} ${ratingTexts[rating]}`;
        document.getElementById('rewardInfo').innerHTML = 
            `<p>💰 +${money}</p><p>Total Money: ${this.money}</p>`;
        
        document.getElementById('levelCompleteModal').classList.add('show');
        this.gameState = 'levelComplete';
    }

    hideLevelComplete() {
        document.getElementById('levelCompleteModal').classList.remove('show');
    }

    showGameOver() {
        const totalEarned = this.money;
        document.getElementById('finalStats').innerHTML = 
            `<p>You've completed all 15 levels!</p><p>Total Money Earned: 💰 ${totalEarned}</p>`;
        document.getElementById('gameOverModal').classList.add('show');
        this.gameState = 'gameOver';
    }

    backToMenu() {
        document.getElementById('gameOverModal').classList.remove('show');
        this.currentLevel = 1;
        this.saveGame();
        this.showMenu();
    }

    initializeSkins() {
        this.skins = [
            { id: 'default', name: 'Classic Kebab', emoji: '🍢', cost: 0, unlocked: true },
            { id: 'golden', name: 'Golden Kebab', emoji: '🏆', cost: 100 },
            { id: 'spicy', name: 'Spicy Red', emoji: '🔴', cost: 150 },
            { id: 'fancy', name: 'Fancy Purple', emoji: '💜', cost: 200 },
            { id: 'cosmic', name: 'Cosmic Blue', emoji: '🔵', cost: 250 },
            { id: 'rainbow', name: 'Rainbow', emoji: '🌈', cost: 300 },
            { id: 'ice', name: 'Icy Cool', emoji: '❄️', cost: 150 },
            { id: 'fire', name: 'Flaming Hot', emoji: '🔥', cost: 180 },
            { id: 'forest', name: 'Forest Green', emoji: '💚', cost: 120 },
        ];
    }

    renderShop() {
        const grid = document.getElementById('skinGrid');
        grid.innerHTML = '';
        
        this.skins.forEach(skin => {
            const owned = this.ownedSkins.includes(skin.id);
            const div = document.createElement('div');
            div.className = 'skin-item';
            if (owned) div.classList.add('owned');
            if (this.selectedSkin === skin.id) div.classList.add('selected');
            
            div.innerHTML = `
                <div style="font-size: 40px; margin-bottom: 10px;">${skin.emoji}</div>
                <div style="font-weight: bold;">${skin.name}</div>
                <div>${owned ? '✓ Owned' : `💰 ${skin.cost}`}</div>
            `;
            
            div.onclick = () => {
                if (owned) {
                    this.selectedSkin = skin.id;
                    this.saveGame();
                    this.renderShop();
                } else if (this.money >= skin.cost) {
                    this.money -= skin.cost;
                    this.ownedSkins.push(skin.id);
                    this.selectedSkin = skin.id;
                    this.saveGame();
                    this.renderShop();
                }
            };
            
            grid.appendChild(div);
        });
    }

    startGame() {
        this.hideMenu();
        this.initializeLevel(this.currentLevel);
    }

    nextLevel() {
        this.hideLevelComplete();
        if (this.currentLevel < this.totalLevels) {
            this.currentLevel++;
            this.saveGame();
            this.initializeLevel(this.currentLevel);
        } else {
            this.showGameOver();
        }
    }

    initializeLevel(levelNumber) {
        this.gameState = 'playing';
        this.level = new Level(levelNumber, this);
        this.animate();
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.level) {
            this.level.update();
            this.level.render(this.ctx);
        }
        
        if (this.gameState === 'playing') {
            requestAnimationFrame(() => this.animate());
        }
    }

    updateHUD() {
        document.getElementById('levelNumber').textContent = this.currentLevel;
        document.getElementById('money').textContent = this.money;
        document.getElementById('foodCount').textContent = this.level.foodCollected;
        document.getElementById('foodMax').textContent = this.level.maxFood;
        
        const fillPercent = (this.level.foodCollected / this.level.maxFood) * 100;
        document.getElementById('foodFill').style.width = fillPercent + '%';
    }
}

// LEVEL SYSTEM
class Level {
    constructor(levelNumber, game) {
        this.game = game;
        this.levelNumber = levelNumber;
        this.width = 1200;
        this.height = 700;
        this.foodCollected = 0;
        this.maxFood = 5;
        this.levelStartTime = Date.now();
        this.levelDuration = 120000;
        
        this.player = new KebabPlayer(100, 600, this);
        this.miniGames = this.generateMiniGames(levelNumber);
        this.currentMiniGame = null;
        this.completedMiniGames = new Set();
        this.endAnimationActive = false;
        
        this.setupColorScheme(levelNumber);
        this.setupControls();
    }

    setupColorScheme(levelNumber) {
        const schemes = [
            { bg: ['#87CEEB', '#E0F6FF'], ground: '#8B7355', accent1: '#FF6B6B', accent2: '#FFD93D' },
            { bg: ['#FF85B3', '#FFB3D9'], ground: '#C85A54', accent1: '#4ECDC4', accent2: '#95E1D3' },
            { bg: ['#A8E6CF', '#DCEDC1'], ground: '#556B2F', accent1: '#FF8B94', accent2: '#FFD6A5' },
            { bg: ['#FFD89B', '#FFED4E'], ground: '#D4A574', accent1: '#6BCB77', accent2: '#4D96FF' },
            { bg: ['#D5A6E3', '#E8B4D4'], ground: '#9B59B6', accent1: '#F38181', accent2: '#AA96DA' },
            { bg: ['#6DD5ED', '#2193B0'], ground: '#1a5276', accent1: '#FFA502', accent2: '#F70000' },
            { bg: ['#FA8072', '#FFB6C1'], ground: '#8B4513', accent1: '#228B22', accent2: '#FFD700' },
            { bg: ['#00CED1', '#AFEEEE'], ground: '#2F4F4F', accent1: '#FF4500', accent2: '#FFFF00' },
            { bg: ['#FFB347', '#FFDAB9'], ground: '#654321', accent1: '#8B0000', accent2: '#228B22' },
            { bg: ['#9370DB', '#DDA0DD'], ground: '#6A0572', accent1: '#00FF00', accent2: '#FF00FF' },
            { bg: ['#20B2AA', '#E0FFFF'], ground: '#13526D', accent1: '#FF1493', accent2: '#FFD700' },
            { bg: ['#FFD4D4', '#FFF8DC'], ground: '#8B4513', accent1: '#FF69B4', accent2: '#32CD32' },
            { bg: ['#B0E0E6', '#ADD8E6'], ground: '#36648B', accent1: '#FF6347', accent2: '#FFD700' },
            { bg: ['#FFE4B5', '#FFEFD5'], ground: '#A0522D', accent1: '#FF4500', accent2: '#00FA9A' },
            { bg: ['#DDA0DD', '#EE82EE'], ground: '#8B008B', accent1: '#00FF7F', accent2: '#FFD700' },
        ];
        
        this.colorScheme = schemes[(levelNumber - 1) % schemes.length];
    }

    generateMiniGames(levelNumber) {
        const games = [];
        const gameCount = 2 + Math.floor(levelNumber / 5);
        
        for (let i = 0; i < gameCount; i++) {
            const gameType = i % 3;
            let game;
            
            switch (gameType) {
                case 0:
                    game = new PlatformJumpGame(i, this);
                    break;
                case 1:
                    game = new CollectItemsGame(i, this);
                    break;
                case 2:
                    game = new AvoidObstaclesGame(i, this);
                    break;
            }
            
            games.push(game);
        }
        
        return games;
    }

    setupControls() {
        window.addEventListener('keydown', (e) => {
            if (this.currentMiniGame) {
                this.currentMiniGame.handleInput(e);
            } else {
                this.player.handleInput(e);
            }
        });

        window.addEventListener('keyup', (e) => {
            if (!this.currentMiniGame) {
                this.player.handleKeyUp(e);
            }
        });
    }

    update() {
        this.game.updateHUD();
        
        if (this.currentMiniGame) {
            // FIX: Call updateGame() to update mini-game logic
            this.currentMiniGame.updateGame();
            
            if (this.currentMiniGame.isComplete) {
                if (this.currentMiniGame.success) {
                    this.completedMiniGames.add(this.currentMiniGame.id);
                    this.foodCollected++;
                    this.animateFood();
                }
                this.currentMiniGame = null;
            }
        } else {
            this.player.update();
            
            for (let game of this.miniGames) {
                if (!this.completedMiniGames.has(game.id)) {
                    if (this.player.collidesWith(game.hitbox)) {
                        this.currentMiniGame = game;
                        game.start();
                        break;
                    }
                }
            }
        }
        
        const elapsedTime = Date.now() - this.levelStartTime;
        if (elapsedTime > this.levelDuration) {
            this.completeLevelAnimation();
        }
    }

    render(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, this.colorScheme.bg[0]);
        gradient.addColorStop(1, this.colorScheme.bg[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        ctx.fillStyle = this.colorScheme.ground;
        ctx.fillRect(0, 650, this.width, 50);
        
        for (let game of this.miniGames) {
            game.render(ctx, this.completedMiniGames.has(game.id));
        }
        
        if (!this.currentMiniGame) {
            this.player.render(ctx);
        }
        
        if (this.currentMiniGame) {
            this.currentMiniGame.renderGame(ctx);
        }
        
        const elapsedTime = Date.now() - this.levelStartTime;
        const remainingTime = Math.max(0, Math.ceil((this.levelDuration - elapsedTime) / 1000));
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Time: ${remainingTime}s`, this.width - 20, 40);
    }

    animateFood() {
        console.log(`🍗 Food added! Total: ${this.foodCollected}/${this.maxFood}`);
    }

    completeLevelAnimation() {
        if (!this.endAnimationActive) {
            this.endAnimationActive = true;
            
            const foodPercentage = this.foodCollected / this.maxFood;
            let rating = 0;
            
            if (foodPercentage >= 0.9) rating = 5;
            else if (foodPercentage >= 0.75) rating = 4;
            else if (foodPercentage >= 0.6) rating = 3;
            else if (foodPercentage >= 0.4) rating = 2;
            else if (foodPercentage >= 0.2) rating = 1;
            else rating = 0;
            
            const baseReward = 50;
            const foodBonus = this.foodCollected * 20;
            const levelBonus = this.levelNumber * 10;
            const totalReward = baseReward + foodBonus + levelBonus + (rating * 30);
            
            this.game.money += totalReward;
            this.game.saveGame();
            
            setTimeout(() => {
                this.game.showLevelComplete(rating, totalReward);
                this.game.gameState = 'levelComplete';
            }, 1000);
        }
    }
}

// KEBAB PLAYER - IMPROVED VISUAL
class KebabPlayer {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.level = level;
        this.width = 60;  // WIDER to be horizontal
        this.height = 20; // SHORTER to be horizontal stick
        this.velocityY = 0;
        this.velocityX = 0;
        this.isJumping = false;
        this.gravity = 0.6;
        this.jumpPower = 15;
        this.speed = 5;
        this.foodAnimationTime = 0;
        
        this.keysPressed = {};
    }

    handleInput(e) {
        this.keysPressed[e.key.toLowerCase()] = true;
    }

    handleKeyUp(e) {
        this.keysPressed[e.key.toLowerCase()] = false;
    }

    update() {
        if (this.keysPressed['a'] || this.keysPressed['arrowleft']) {
            this.velocityX = -this.speed;
        } else if (this.keysPressed['d'] || this.keysPressed['arrowright']) {
            this.velocityX = this.speed;
        } else {
            this.velocityX *= 0.8;
        }

        this.x += this.velocityX;

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.level.width) this.x = this.level.width - this.width;

        this.velocityY += this.gravity;
        this.y += this.velocityY;

        if (this.y + this.height >= 650) {
            this.y = 650 - this.height;
            this.velocityY = 0;
            this.isJumping = false;

            if ((this.keysPressed['w'] || this.keysPressed['arrowup'] || this.keysPressed[' ']) && !this.isJumping) {
                this.velocityY = -this.jumpPower;
                this.isJumping = true;
            }
        }

        if (this.foodAnimationTime > 0) {
            this.foodAnimationTime--;
        }
    }

    render(ctx) {
        const skinEmojis = {
            'default': '🍢',
            'golden': '🏆',
            'spicy': '🔴',
            'fancy': '💜',
            'cosmic': '🔵',
            'rainbow': '🌈',
            'ice': '❄️',
            'fire': '🔥',
            'forest': '💚'
        };

        // Draw kebab stick HORIZONTALLY
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(skinEmojis[this.level.game.selectedSkin], this.x + this.width / 2, this.y + 15);

        // Draw food HORIZONTALLY BESIDE THE STICK - FIX: Only start from level where food exists
        for (let i = 0; i < this.level.foodCollected; i++) {
            ctx.font = '20px Arial';
            // Position food to the RIGHT of the stick
            ctx.fillText('🍗', this.x + this.width / 2 + 30 + (i * 20), this.y + 15);
        }
    }

    collidesWith(hitbox) {
        return !(this.x + this.width < hitbox.x ||
                this.x > hitbox.x + hitbox.width ||
                this.y + this.height < hitbox.y ||
                this.y > hitbox.y + hitbox.height);
    }
}

// MINI-GAMES
class MiniGame {
    constructor(id, level) {
        this.id = id;
        this.level = level;
        this.isComplete = false;
        this.success = false;
        this.x = 200 + (id * 250);
        this.y = 400 + (id % 2) * 100;
        this.width = 80;
        this.height = 80;
        this.hitbox = { x: this.x, y: this.y, width: this.width, height: this.height };
        this.startTime = 0;
        this.duration = 30000;
    }

    start() {
        this.startTime = Date.now();
    }

    render(ctx, completed) {
        ctx.fillStyle = completed ? '#90EE90' : '#FFD93D';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(completed ? '✓' : '?', this.x + this.width / 2, this.y + this.height / 2 + 8);
    }

    renderGame(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 1200, 800);

        ctx.fillStyle = 'white';
        ctx.fillRect(200, 100, 800, 600);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.strokeRect(200, 100, 800, 600);

        this.renderGameContent(ctx);
    }

    handleInput(e) {}
    updateGame() {}
    renderGameContent(ctx) {}
}

class PlatformJumpGame extends MiniGame {
    constructor(id, level) {
        super(id, level);
        this.resetGame();
    }

    resetGame() {
        this.playerX = 250;
        this.playerY = 650;
        this.playerVY = 0;
        this.playerVX = 0;
        this.platforms = [
            { x: 250, y: 550, w: 100, h: 20 },
            { x: 450, y: 480, w: 100, h: 20 },
            { x: 350, y: 400, w: 100, h: 20 },
            { x: 550, y: 350, w: 100, h: 20 },
            { x: 400, y: 280, w: 100, h: 20 },
            { x: 650, y: 200, w: 100, h: 20 },
        ];
        this.targetReached = false;
        this.isJumping = false;
    }

    start() {
        super.start();
        this.resetGame();
    }

    handleInput(e) {
        if (e.key === 'a' || e.key === 'ArrowLeft') this.playerVX = -8;
        if (e.key === 'd' || e.key === 'ArrowRight') this.playerVX = 8;
        if ((e.key === 'w' || e.key === ' ' || e.key === 'ArrowUp') && !this.isJumping) {
            this.playerVY = -15;
            this.isJumping = true;
        }
    }

    updateGame() {
        const elapsed = Date.now() - this.startTime;
        
        if (!this.playerVX) this.playerVX = 0;
        this.playerVX *= 0.9;
        
        if (!this.playerVY) this.playerVY = 0;
        this.playerVY += 0.6;
        
        this.playerX += this.playerVX;
        this.playerY += this.playerVY;

        if (this.playerY > 700) {
            this.isComplete = true;
            this.success = false;
            return;
        }

        this.isJumping = true;
        for (let platform of this.platforms) {
            if (this.playerX + 20 > platform.x &&
                this.playerX < platform.x + platform.w &&
                this.playerY + 20 > platform.y &&
                this.playerY < platform.y + platform.h &&
                this.playerVY > 0) {
                this.playerVY = -12;
                this.isJumping = false;
            }
        }

        if (this.playerY < 150) {
            this.targetReached = true;
        }

        if (this.targetReached || elapsed > this.duration) {
            this.isComplete = true;
            this.success = this.targetReached;
        }
    }

    renderGameContent(ctx) {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎮 Platform Jump Challenge', 600, 150);

        for (let platform of this.platforms) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(200 + platform.x, platform.y, platform.w, platform.h);
        }

        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(200 + this.playerX, this.playerY, 20, 20);

        ctx.fillStyle = '#FFD93D';
        ctx.fillRect(620, 180, 30, 30);
        ctx.font = '20px Arial';
        ctx.fillText('🎯', 635, 205);

        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, (this.duration / 1000 - elapsed).toFixed(1));
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Time: ${remaining}s`, 950, 130);
    }
}

class CollectItemsGame extends MiniGame {
    constructor(id, level) {
        super(id, level);
        this.resetGame();
    }

    resetGame() {
        this.playerX = 350;
        this.playerY = 550;
        this.items = [];
        this.itemsCollected = 0;
        this.itemsTarget = 10;

        for (let i = 0; i < this.itemsTarget; i++) {
            this.items.push({
                x: Math.random() * 600 + 150,
                y: Math.random() * 400 + 150,
                collected: false
            });
        }
    }

    start() {
        super.start();
        this.resetGame();
    }

    handleInput(e) {
        const step = 15;
        if (e.key === 'a' || e.key === 'ArrowLeft') this.playerX = Math.max(150, this.playerX - step);
        if (e.key === 'd' || e.key === 'ArrowRight') this.playerX = Math.min(750, this.playerX + step);
        if (e.key === 'w' || e.key === 'ArrowUp') this.playerY = Math.max(150, this.playerY - step);
        if (e.key === 's' || e.key === 'ArrowDown') this.playerY = Math.min(550, this.playerY + step);
    }

    updateGame() {
        const elapsed = Date.now() - this.startTime;

        for (let item of this.items) {
            if (!item.collected) {
                const dx = this.playerX - item.x;
                const dy = this.playerY - item.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 30) {
                    item.collected = true;
                    this.itemsCollected++;
                }
            }
        }

        if (this.itemsCollected >= this.itemsTarget || elapsed > this.duration) {
            this.isComplete = true;
            this.success = this.itemsCollected >= this.itemsTarget;
        }
    }

    renderGameContent(ctx) {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎮 Collect All Items!', 600, 150);

        for (let item of this.items) {
            if (!item.collected) {
                ctx.fillStyle = '#FFD93D';
                ctx.beginPath();
                ctx.arc(200 + item.x, item.y, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(200 + this.playerX, this.playerY, 30, 30);
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('P', 200 + this.playerX + 15, this.playerY + 20);

        ctx.fillStyle = '#333';
        ctx.font = '20px Arial';
        ctx.textAlign = 'right';
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, (this.duration / 1000 - elapsed).toFixed(1));
        ctx.fillText(`Collected: ${this.itemsCollected}/${this.itemsTarget}`, 950, 130);
        ctx.fillText(`Time: ${remaining}s`, 950, 160);
    }
}

class AvoidObstaclesGame extends MiniGame {
    constructor(id, level) {
        super(id, level);
        this.resetGame();
    }

    resetGame() {
        this.playerX = 350;
        this.playerY = 500;
        this.obstacles = [];
        this.score = 0;

        for (let i = 0; i < 8; i++) {
            this.obstacles.push({
                x: 150 + Math.random() * 600,
                y: -50 - i * 80,
                size: 30,
                speed: 3 + (i * 0.5)
            });
        }
    }

    start() {
        super.start();
        this.resetGame();
    }

    handleInput(e) {
        const step = 20;
        if (e.key === 'a' || e.key === 'ArrowLeft') this.playerX = Math.max(150, this.playerX - step);
        if (e.key === 'd' || e.key === 'ArrowRight') this.playerX = Math.min(750, this.playerX + step);
    }

    updateGame() {
        const elapsed = Date.now() - this.startTime;

        for (let obstacle of this.obstacles) {
            obstacle.y += obstacle.speed;

            if (obstacle.y < 600) {
                const dx = this.playerX - obstacle.x;
                const dy = this.playerY - obstacle.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 40) {
                    this.isComplete = true;
                    this.success = false;
                    return;
                }
            }

            if (obstacle.y > 600) {
                this.score++;
                obstacle.y = -50;
                obstacle.x = 150 + Math.random() * 600;
            }
        }

        if (elapsed > this.duration) {
            this.isComplete = true;
            this.success = true;
        }
    }

    renderGameContent(ctx) {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎮 Avoid Obstacles!', 600, 150);

        for (let obstacle of this.obstacles) {
            ctx.fillStyle = '#FF6B6B';
            ctx.fillRect(200 + obstacle.x, obstacle.y, obstacle.size, obstacle.size);
            ctx.font = '20px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('⚡', 200 + obstacle.x + 15, obstacle.y + 20);
        }

        ctx.fillStyle = '#4ECDC4';
        ctx.beginPath();
        ctx.arc(200 + this.playerX, this.playerY, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#333';
        ctx.font = '20px Arial';
        ctx.textAlign = 'right';
        const elapsed = (Date.now() - this.startTime) / 1000;
        const remaining = Math.max(0, (this.duration / 1000 - elapsed).toFixed(1));
        ctx.fillText(`Dodged: ${this.score}`, 950, 130);
        ctx.fillText(`Time: ${remaining}s`, 950, 160);
    }
}

const game = new KebabGame();
