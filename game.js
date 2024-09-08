const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player settings
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 100,
    width: 50,
    height: 50,
    image: new Image(),
    speed: 5,
    health: 150,
    ammoSpeed: 10
};
player.image.src = 'assets/plein.png';

// Bullet settings
const bullets = [];
const enemyBullets = [];
const ammoImage = new Image();
ammoImage.src = 'assets/ammo.png'; // Load ammo image

// Enemy settings
const enemies = [];
const enemyImage = new Image();
enemyImage.src = 'assets/enemy.png';
const enemySpeed = 2;
const enemyHealth = 50;
const enemyDamage = 20;
const enemyShootInterval = 1500;
const enemyStopY = canvas.height / 3;
const enemySpawnInterval = 8000;

// Boss settings
const boss = {
    x: canvas.width / 2 - 75,
    y: -150,
    width: 150,
    height: 150,
    health: 500,
    speed: 1,
    image: new Image()
};
boss.image.src = 'assets/boss.png';

// Health Kit settings
const healthKitImage = new Image();
healthKitImage.src = 'assets/medicalkit.png';
const healthKitDropChance = 1 / 7;

// Power-Up settings
const powerUpImage = new Image();
powerUpImage.src = 'assets/powerUP.png';
const powerUpDropChance = 1 / 10;

// Initialize health kits and power-ups array
const healthKits = [];
const powerUps = [];

// Game state
let currentWave = 1;
let score = 0;
let waveIntervalId = null;
let gameIntervalId;
let bossActive = false;
canvas.addEventListener('mousemove', function(event) {
    const rect = canvas.getBoundingClientRect();
    player.x = event.clientX - rect.left - player.width / 2;
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
    console.log('Player x:', player.x); // Debugging line
});

// Initialize game
function initializeGame() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Reset game state
    currentWave = 1;
    score = 0;
    enemies.length = 0;
    bullets.length = 0;
    enemyBullets.length = 0;
    healthKits.length = 0;
    powerUps.length = 0;
    player.health = 150;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 100;
    bossActive = false;

    // Start the game
    startWave();
    gameLoop();
}

// Start enemy wave
function startWave() {
    if (currentWave <= 10) {
        for (let i = 0; i < 10; i++) {
            let enemy = {
                x: Math.random() * (canvas.width - 50),
                y: -50,
                width: 50,
                height: 50,
                health: enemyHealth,
                speed: enemySpeed,
                shooting: false,
                shootIntervalId: null
            };
            enemies.push(enemy);
        }
        if (!waveIntervalId) {
            waveIntervalId = setInterval(startWave, enemySpawnInterval);
        }
    } else if (currentWave === 11 && !bossActive) {
        bossActive = true;
        enemies.push(boss);
        boss.y = -150;
    }
}

// Start enemy shooting
function startEnemyShooting(enemy) {
    enemy.shootIntervalId = setInterval(() => {
        enemyBullets.push({
            x: enemy.x + enemy.width / 2 - 5,
            y: enemy.y + enemy.height,
            width: 10,
            height: 20,
            speedY: 5
        });
    }, enemyShootInterval);
}

// Game loop
function gameLoop() {
    gameIntervalId = setInterval(() => {
        update();
        draw();
        if (player.health <= 0) {
            clearInterval(gameIntervalId);
            restartGame();
        }
    }, 1000 / 60);
}

// Update game objects
function update() {
    // Update player position
    // Update bullets
    bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) bullets.splice(index, 1);
    });

    // Update enemy bullets
    enemyBullets.forEach((bullet, index) => {
        bullet.y += bullet.speedY;
        if (bullet.y > canvas.height) enemyBullets.splice(index, 1);
    });

    // Update enemies
    enemies.forEach((enemy, eIndex) => {
        if (enemy === boss) {
            if (enemy.y < canvas.height / 2) {
                enemy.y += enemy.speed;
            } else {
                enemy.x += (Math.random() - 0.5) * 2; // Boss moves left and right
            }
        } else {
            if (enemy.y < enemyStopY) {
                enemy.y += enemy.speed;
            } else if (!enemy.shooting) {
                startEnemyShooting(enemy);
                enemy.shooting = true;
            }
        }

        // Check bullet collisions
        bullets.forEach((bullet, bIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                enemy.health -= bullet.damage;
                bullets.splice(bIndex, 1);
                if (enemy.health <= 0) {
                    if (Math.random() < healthKitDropChance) {
                        createHealthKit(enemy.x + enemy.width / 2 - 15, enemy.y + enemy.height / 2 - 15);
                    } else if (Math.random() < powerUpDropChance) {
                        createPowerUp(enemy.x + enemy.width / 2 - 15, enemy.y + enemy.height / 2 - 15);
                    }
                    if (enemy.shootIntervalId) {
                        clearInterval(enemy.shootIntervalId);
                    }
                    enemies.splice(eIndex, 1);
                    score += 100;
                }
            }
        });
    });

    // Check player collisions
    enemyBullets.forEach((bullet, index) => {
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            player.health -= enemyDamage;
            enemyBullets.splice(index, 1);
        }
    });

    // Check health kits and power-ups
    healthKits.forEach((kit, index) => {
        if (kit.x < player.x + player.width &&
            kit.x + kit.width > player.x &&
            kit.y < player.y + player.height &&
            kit.y + kit.height > player.y) {
            player.health = 150;
            healthKits.splice(index, 1);
        }
    });

    powerUps.forEach((powerUp, index) => {
        if (powerUp.x < player.x + player.width &&
            powerUp.x + powerUp.width > player.x &&
            powerUp.y < player.y + player.height &&
            powerUp.y + powerUp.height > player.y) {
            player.ammoSpeed = 15; // Example effect: Increase ammo speed
            powerUps.splice(index, 1);
        }
    });
}

// Draw game objects and HUD
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(player.image, player.x, player.y, player.width, player.height);

    bullets.forEach(bullet => {
        ctx.drawImage(ammoImage, bullet.x, bullet.y, bullet.width, bullet.height);
    });

    enemyBullets.forEach(bullet => {
        ctx.fillStyle = 'red';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    enemies.forEach(enemy => {
        if (enemy === boss) {
            ctx.drawImage(boss.image, boss.x, boss.y, boss.width, boss.height);
        } else {
            ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
        }
    });

    healthKits.forEach(kit => {
        ctx.drawImage(healthKitImage, kit.x, kit.y, kit.width, kit.height);
    });

    powerUps.forEach(powerUp => {
        ctx.drawImage(powerUpImage, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    });

    // Draw score and wave
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.fillText('Wave: ' + currentWave, 10, 60);

    // Draw health bar
    ctx.fillStyle = 'red';
    ctx.fillRect(10, 90, player.health, 20);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(10, 90, 150, 20);
}

// Handle shooting
canvas.addEventListener('mousedown', function() {
    bullets.push({
        x: player.x + player.width / 2 - 5,
        y: player.y,
        width: 10,
        height: 20,
        speed: player.ammoSpeed,
        damage: 20
    });
});

// Restart game (goes back to lobby)
function restartGame() {
    clearInterval(waveIntervalId);
    waveIntervalId = null;
    document.querySelector('.lobby-container').style.display = 'block'; // Show lobby
    document.getElementById('gameCanvas').style.display = 'none'; // Hide game canvas
}
