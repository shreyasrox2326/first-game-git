document.body.style.zoom="50%"

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');
let gameWidth = window.innerWidth;
let gameHeight = window.innerHeight;
canvas.width = gameWidth * 2;
canvas.height = gameHeight * 2;

let CENTER_X = gameWidth / 2;
let CENTER_Y = gameHeight / 2;
const PLAYER_COLOR = '#8182e8';
const BULLET_COLOR = '#8182e8';
const ENEMY_COLOR = '#8182e8';
const BACKGROUND_COLOR = '#fcf4f1';
const UI_COLOR = '#d8d9f8';
document.body.style.backgroundColor = BACKGROUND_COLOR;
document.body.style.margin = 0; // Remove default body margin

let circleRadius;
let textSidePadding = 30; // Increased padding for larger font

function updateCanvasDimensions() {
    gameWidth = window.innerWidth * 2 ;
    gameHeight = window.innerHeight * 2 ;
    canvas.width = gameWidth;
    canvas.height = gameHeight;
    CENTER_X = gameWidth / 2;
    CENTER_Y = gameHeight / 2;

    const padding = 30; // Increased padding
    if (gameWidth < gameHeight) { // Portrait
        circleRadius = (gameWidth - 2 * padding) / 2;
        textSidePadding = padding;
    } else { // Landscape
        circleRadius = (gameHeight - 2 * padding) / 2;
        textSidePadding = padding;
    }
}

updateCanvasDimensions(); // Initial call to set dimensions

let playerImage = new Image();
playerImage.src = 'ecellpaglu-1.png'; // Make sure this path matches your HTML
playerImage.onload = () => {
    // Now the image is loaded, you can use it in the draw function
    player.imageLoaded = true;
};

class Player {
    constructor() {
        this.x = CENTER_X;
        this.y = CENTER_Y;
        this.radius = 50; // Use a reasonable radius for collision (adjust as needed)
        this.angle = Math.PI;
        this.lives = 9;
        this.imageLoaded = false; // Flag to track image loading
    }
    draw() {
        if (this.imageLoaded) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle); // Rotate around the center of the player
            const size = 300; // Adjust the size to scale your 1080x1080 image
            ctx.drawImage(playerImage, -size / 2, -size / 2, size, size);
            ctx.restore();

            // Optional: Draw a visual representation of the collision radius
            // ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            // ctx.beginPath();
            // ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            // ctx.stroke();
        } else {
            // Fallback if image isn't loaded yet (optional)
            ctx.fillStyle = PLAYER_COLOR;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    update(mouseX, mouseY) {
        this.angle = Math.atan2(mouseY - this.y, mouseX - this.x);
    }
}

class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 4;
        this.radius = 10;
    }
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
    draw() {
        ctx.fillStyle = BULLET_COLOR;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Enemy {
    constructor() {
        const angle = Math.random() * Math.PI * 2;
        const spawnDistance = circleRadius + 30;
        this.x = CENTER_X + Math.cos(angle) * spawnDistance;
        this.y = CENTER_Y + Math.sin(angle) * spawnDistance;
        this.angle = Math.atan2(CENTER_Y - this.y, CENTER_X - this.x);
        this.speed = 2; // Keep enemy speed at 2
        this.radius = 30;
    }
    update() {
        if (!gameOver) {
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        }
    }
    draw() {
        ctx.fillStyle = ENEMY_COLOR;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

const player = new Player();
let bullets = [];
let enemies = [];
let enemySpawnRate = 0.5;
let bulletShootRate = enemySpawnRate * 2.5;
let shooting = false;
let totalEnemiesKilled = 0; // Total enemies killed throughout the game
let totalBulletsShot = 0;
let currentLevel = 1;
let levelTimeRemaining = 30; // Time for each level in seconds
let levelTimerInterval;
let levelComplete = false;
let levelCompleteTimer = 0;
let gameOver = false;
let gameOverTimer = 0;
let enemiesShot = 0; // Moved declaration here
const levelEnemyCount = 10; // Number of enemies to defeat to complete a level
let spawnInterval;
let shootInterval;

function startLevelTimer() {
    levelTimeRemaining = 30;
    clearInterval(levelTimerInterval);
    levelTimerInterval = setInterval(() => {
        if (!gameOver) {
            levelTimeRemaining--;
            if (levelTimeRemaining <= 0) {
                levelComplete = true;
                clearInterval(levelTimerInterval);
            }
        }
    }, 1000);
}

function spawnEnemies() {
    clearInterval(spawnInterval); // Clear the previous interval
    if (!levelComplete && !gameOver && levelTimeRemaining > 0) {
        spawnInterval = setInterval(() => {
            enemies.push(new Enemy());
        }, 1000 / enemySpawnRate);
    }
}
let r = 100;
function shootBullets() {
    clearInterval(shootInterval); // Clear the previous interval
    if (shooting && !levelComplete && !gameOver && levelTimeRemaining > 0) {
        shootInterval = setInterval(() => {
            bullets.push(new Bullet(player.x + r*(Math.cos(player.angle)) , player.y + r*(Math.sin(player.angle)), player.angle));
            totalBulletsShot++;
        }, 1000 / bulletShootRate);
    }
}

function checkCollisions() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            const dx = enemies[i].x - bullets[j].x;
            const dy = enemies[i].y - bullets[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < enemies[i].radius + bullets[j].radius) {
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                totalEnemiesKilled++;
                break;
            }
        }
    }
}

function drawUI() {
    const fontSize = 20 * 3; // 3x the original size
    ctx.font = `bold ${fontSize}px Doto`;
    ctx.fillStyle = PLAYER_COLOR; // Use player color for text
    const textYOffset = fontSize + 10;

    // Left Side UI
    const leftText = [
        '❤️'.repeat(Math.max(0, player.lives)),
        `Kills: ${totalEnemiesKilled}`,
        `Level: ${currentLevel}`,
        `Time: ${levelTimeRemaining}`
    ];
    let yPosLeft = textYOffset;
    ctx.textAlign = 'left';
    for (const text of leftText) {
        ctx.fillText(text, textSidePadding, yPosLeft);
        yPosLeft += fontSize + 10; // Adjust spacing
    }

    // Right Side UI
    const accuracy = totalBulletsShot > 0 ? (totalEnemiesKilled / totalBulletsShot).toFixed(2) : 0;
    const rightText = [
        `Spawn: ${(enemySpawnRate * 1).toFixed(1)}/s`, // Display frequency
        `Shoot: ${(bulletShootRate * 1).toFixed(1)}/s`, // Display frequency
        `Accuracy: ${accuracy}`
    ];
    let yPosRight = textYOffset;
    ctx.textAlign = 'right';
    for (const text of rightText) {
        ctx.fillText(text, gameWidth - textSidePadding, yPosRight);
        yPosRight += fontSize + 10; // Adjust spacing
    }

    // Level Complete Message
    if (levelComplete && !gameOver) {
        const message = `Level ${currentLevel} Complete!`;
        const textWidth = ctx.measureText(message).width;
        ctx.font = `bold ${fontSize * 1.5}px Doto`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(message, CENTER_X, CENTER_Y - (fontSize * 1.5) / 2);
    }

    // Game Over Message
    if (gameOver) {
        const message = 'Game Over';
        const restartMessage = 'Press Space to Restart';
        const textWidth = ctx.measureText(message).width;
        ctx.font = `bold ${fontSize * 2}px Doto`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'red';
        ctx.fillText(message, CENTER_X, CENTER_Y - fontSize);
        ctx.font = `bold ${fontSize}px Doto`;
        ctx.fillText(restartMessage, CENTER_X, CENTER_Y + fontSize / 2);
    }
}

function drawGrid() {
    ctx.strokeStyle = UI_COLOR;
    ctx.lineWidth = 1;

    // Concentric Rings (every 1/8th radius)
    const numRings = 8;
    for (let i = 1; i <= numRings; i++) {
        const radius = circleRadius * (i / numRings);
        ctx.beginPath();
        ctx.arc(CENTER_X, CENTER_Y, radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Radial Lines (every 45 degrees)
    const numLines = 8;
    for (let i = 0; i < numLines; i++) {
        const angle = (2 * Math.PI / numLines) * i;
        const x = CENTER_X + Math.cos(angle) * circleRadius;
        const y = CENTER_Y + Math.sin(angle) * circleRadius;
        ctx.beginPath();
        ctx.moveTo(CENTER_X, CENTER_Y);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
}
let enemyEmoji = '🏢'; // Your chosen enemy emoji
const enemySize = 60; // Adjust size as needed
let bulletEmoji = '✈️'; // Your chosen bullet emoji
const bulletSize = 40; // Adjust size as needed

function animate() {
    updateCanvasDimensions(); // Update dimensions on resize

    ctx.clearRect(0, 0, gameWidth, gameHeight);
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    // Clip to the circular window
    ctx.save();
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, circleRadius, 0, Math.PI * 2);
    ctx.clip();

    // Draw Gridlines
    drawGrid();

    player.draw();

    ctx.font = `${bulletSize}px Doto`; // Set font size for emoji

    bullets.forEach((bullet, index) => {
        bullet.update();
        ctx.fillText(bulletEmoji, bullet.x - bulletSize / 2, bullet.y + bulletSize / 2); // Adjust position for center
        if (bullet.x < CENTER_X - circleRadius || bullet.x > CENTER_X + circleRadius || bullet.y < CENTER_Y - circleRadius || bullet.y > CENTER_Y + circleRadius) {
            bullets.splice(index, 1);
        }
    });
    if (!gameOver) { // Only update enemies if game is not over

        ctx.font = `${enemySize}px Doto`; // Set font size for emoji

        enemies.forEach((enemy, index) => {
            enemy.update();
            ctx.fillText(enemyEmoji, enemy.x - enemySize / 2, enemy.y + enemySize / 2); // Draw the emoji
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            if (Math.sqrt(dx * dx + dy * dy) < (enemySize / 2) + player.radius) { // Simplified collision
                enemies.splice(index, 1);
                player.lives -= 1;
                if (player.lives <= 0) {
                    gameOver = true;
                }
            }
        });
    }
    else {

        ctx.font = `${enemySize}px Doto`;
        enemies.forEach(enemy => {
            ctx.fillText(enemyEmoji, enemy.x - enemySize / 2, enemy.y + enemySize / 2);
        });
    }

    ctx.restore(); // Restore the clipping

    // Draw the circular window outline (on top of everything else)
    ctx.strokeStyle = UI_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(CENTER_X, CENTER_Y, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw UI outside the circle
    drawUI();

    // Level Complete Logic
    if (levelComplete && !gameOver) {
        clearInterval(levelTimerInterval); // Stop the timer
        levelCompleteTimer++;
        if (levelCompleteTimer >= 5 * 60) { // 5 seconds at 60fps
            levelComplete = false;
            levelCompleteTimer = 0;
            currentLevel++;
            totalEnemiesKilled += enemiesShot; // Add enemies shot in this level to total
            enemiesShot = 0; // Reset enemies shot for the new level
            enemySpawnRate *= 1.3; // Increase spawn rate by 30%
            bulletShootRate = enemySpawnRate * 2.5;
            enemies = []; // Kill remaining enemies
            startLevelTimer(); // Start the timer for the new level
            spawnEnemies();    // Restart enemy spawning with the new rate
            shootBullets();    // Restart bullet shooting with the new rate
        } else {
            // Kill all enemies during the break
            enemies = [];
        }
    }

    // Game Over Logic
    if (gameOver) {
        // Game over message is handled in drawUI, no need for a timer here
    }

    checkCollisions();
    requestAnimationFrame(animate);
}

animate();
startLevelTimer(); // Start the initial level timer
spawnEnemies();
shootBullets();

window.addEventListener('mousemove', (event) => {
    player.update(event.clientX*2, event.clientY*2);
});

window.addEventListener('mousedown', (event) => {
    if (event.button === 0) shooting = true;
    shootBullets(); // Ensure shooting starts when mouse is down
});

window.addEventListener('mouseup', (event) => {
    if (event.button === 0) shooting = false;
    // Stop shooting interval when mouse up
    clearInterval(shootInterval);
});

window.addEventListener('resize', () => {
    updateCanvasDimensions();
});

window.addEventListener('keydown', (event) => {
    if (gameOver && event.key === ' ') {
        resetGame();
    }
});

function resetGame() {
    player.lives = 9;
    totalEnemiesKilled = 0;
    totalBulletsShot = 0;
    currentLevel = 1;
    enemySpawnRate = 0.5;
    bulletShootRate = enemySpawnRate * 2.5;
    levelTimeRemaining = 30;
    levelComplete = false;
    gameOver = false;
    enemies = [];
    bullets = [];
    enemiesShot = 0; // Initialize here as well
    startLevelTimer();
    spawnEnemies(); // Ensure spawning starts after reset
    shootBullets(); // Ensure shooting starts after reset
}