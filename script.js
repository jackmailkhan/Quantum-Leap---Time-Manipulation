
        // Game State
        const gameState = {
            scene: null,
            camera: null,
            renderer: null,
            player: null,
            level: 1,
            score: 0,
            currentTime: 'present',
            isPaused: false,
            isPlaying: false,
            keys: {},
            obstacles: [],
            portals: [],
            platforms: [],
            particles: [],
            timeObjects: {},
            playerVelocity: new THREE.Vector3(0, 0, 0),
            isGrounded: false,
            levelComplete: false,
            goal: null,
            atmosphereLight: null
        };

        const TIME_PERIODS = {
            past: { color: 0x8B4513, name: 'PAST', fog: 0x4a3520 },
            present: { color: 0x00ffff, name: 'PRESENT', fog: 0x1a1a2e },
            future: { color: 0xff00ff, name: 'FUTURE', fog: 0x2a1a3e }
        };

        // Initialize Three.js
        function init() {
            const canvas = document.getElementById('gameCanvas');
            
            // Scene
            gameState.scene = new THREE.Scene();
            gameState.scene.fog = new THREE.Fog(TIME_PERIODS.present.fog, 10, 100);
            
            // Camera
            gameState.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            gameState.camera.position.set(0, 8, 15);
            gameState.camera.lookAt(0, 0, 0);
            
            // Renderer
            gameState.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
            gameState.renderer.setSize(window.innerWidth, window.innerHeight);
            gameState.renderer.shadowMap.enabled = true;
            gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Lights
            const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
            gameState.scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 20, 10);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            gameState.scene.add(directionalLight);
            
            // Dynamic light for atmosphere
            const pointLight = new THREE.PointLight(TIME_PERIODS.present.color, 1, 50);
            pointLight.position.set(0, 10, 0);
            gameState.scene.add(pointLight);
            gameState.atmosphereLight = pointLight;
            
            // Create player
            createPlayer();
            
            // Create level
            createLevel(1);
            
            // Event listeners
            window.addEventListener('resize', onWindowResize);
            document.addEventListener('keydown', onKeyDown);
            document.addEventListener('keyup', onKeyUp);
            
            // Button event listeners
            document.getElementById('startBtn').addEventListener('click', startGame);
            document.getElementById('pauseBtn').addEventListener('click', pauseGame);
            document.getElementById('restartLevelBtn').addEventListener('click', restartLevel);
            document.getElementById('restartBtn').addEventListener('click', restartGame);
            document.getElementById('exitBtn').addEventListener('click', exitGame);
        }

        function createPlayer() {
            const geometry = new THREE.BoxGeometry(1, 2, 1);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0x00ffff,
                emissive: 0x00ffff,
                emissiveIntensity: 0.3,
                metalness: 0.8,
                roughness: 0.2
            });
            gameState.player = new THREE.Mesh(geometry, material);
            gameState.player.position.set(-10, 2, 0);
            gameState.player.castShadow = true;
            gameState.scene.add(gameState.player);
            
            // Player glow
            const glowGeometry = new THREE.BoxGeometry(1.2, 2.2, 1.2);
            const glowMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00ffff,
                transparent: true,
                opacity: 0.3
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            gameState.player.add(glow);
        }

        function createLevel(levelNum) {
            // Clear previous level
            gameState.obstacles.forEach(obj => gameState.scene.remove(obj));
            gameState.portals.forEach(obj => gameState.scene.remove(obj));
            gameState.platforms.forEach(obj => gameState.scene.remove(obj));
            gameState.particles.forEach(obj => gameState.scene.remove(obj));
            if (gameState.goal) gameState.scene.remove(gameState.goal);
            
            gameState.obstacles = [];
            gameState.portals = [];
            gameState.platforms = [];
            gameState.particles = [];
            gameState.timeObjects = { past: [], present: [], future: [] };
            
            // Ground
            const groundGeometry = new THREE.BoxGeometry(50, 1, 20);
            const groundMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x1a1a2e,
                metalness: 0.6,
                roughness: 0.4
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.position.y = -0.5;
            ground.receiveShadow = true;
            gameState.scene.add(ground);
            gameState.platforms.push(ground);
            
            // Level-specific obstacles and puzzles
            if (levelNum === 1) {
                createLevel1();
            } else if (levelNum === 2) {
                createLevel2();
            } else if (levelNum === 3) {
                createLevel3();
            }
            
            // Goal
            createGoal(18, 2, 0);
        }

        function createLevel1() {
            // Simple platform that exists in past and present
            const platform1 = createPlatform(0, 3, 0, 6, 0.5, 4, 0x4a90e2);
            gameState.timeObjects.past.push(platform1);
            gameState.timeObjects.present.push(platform1);
            
            // Obstacle in present
            const obstacle1 = createObstacle(5, 1, 0, 2, 4, 2, 0xff6b6b);
            gameState.timeObjects.present.push(obstacle1);
            
            // Platform in future
            const platform2 = createPlatform(10, 5, 0, 6, 0.5, 4, 0x9b59b6);
            gameState.timeObjects.future.push(platform2);
            
            // Portals
            createPortal(-5, 1, -5, 'past');
            createPortal(0, 1, -5, 'present');
            createPortal(5, 1, -5, 'future');
        }

        function createLevel2() {
            // Moving platforms based on time
            const platform1 = createPlatform(-2, 2, 0, 4, 0.5, 4, 0x4a90e2);
            gameState.timeObjects.past.push(platform1);
            
            const platform2 = createPlatform(3, 4, 0, 4, 0.5, 4, 0x00ffff);
            gameState.timeObjects.present.push(platform2);
            
            const platform3 = createPlatform(8, 6, 0, 4, 0.5, 4, 0xff00ff);
            gameState.timeObjects.future.push(platform3);
            
            // Obstacles
            const obstacle1 = createObstacle(6, 1, 0, 2, 3, 2, 0xff6b6b);
            gameState.timeObjects.present.push(obstacle1);
            
            const obstacle2 = createObstacle(12, 1, 0, 2, 5, 2, 0xff6b6b);
            gameState.timeObjects.future.push(obstacle2);
            
            // Portals
            createPortal(-8, 1, -5, 'past');
            createPortal(-3, 1, -5, 'present');
            createPortal(2, 1, -5, 'future');
        }

        function createLevel3() {
            // Complex multi-time puzzle
            for (let i = 0; i < 5; i++) {
                const x = i * 4 - 8;
                const height = Math.random() * 3 + 2;
                const platform = createPlatform(x, height, 0, 3, 0.5, 3, 0x4a90e2);
                
                if (i % 3 === 0) gameState.timeObjects.past.push(platform);
                else if (i % 3 === 1) gameState.timeObjects.present.push(platform);
                else gameState.timeObjects.future.push(platform);
            }
            
            // Dynamic obstacles
            for (let i = 0; i < 3; i++) {
                const x = i * 5;
                const obstacle = createObstacle(x, 1, 0, 2, 3, 2, 0xff6b6b);
                gameState.timeObjects.present.push(obstacle);
            }
            
            // Portals
            createPortal(-10, 1, -6, 'past');
            createPortal(-5, 1, -6, 'present');
            createPortal(0, 1, -6, 'future');
        }

        function createPlatform(x, y, z, width, height, depth, color) {
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshStandardMaterial({ 
                color,
                metalness: 0.5,
                roughness: 0.3,
                emissive: color,
                emissiveIntensity: 0.2
            });
            const platform = new THREE.Mesh(geometry, material);
            platform.position.set(x, y, z);
            platform.castShadow = true;
            platform.receiveShadow = true;
            platform.userData.isPlatform = true;
            gameState.scene.add(platform);
            gameState.platforms.push(platform);
            return platform;
        }

        function createObstacle(x, y, z, width, height, depth, color) {
            const geometry = new THREE.BoxGeometry(width, height, depth);
            const material = new THREE.MeshStandardMaterial({ 
                color,
                metalness: 0.7,
                roughness: 0.2,
                emissive: color,
                emissiveIntensity: 0.4
            });
            const obstacle = new THREE.Mesh(geometry, material);
            obstacle.position.set(x, y, z);
            obstacle.castShadow = true;
            obstacle.userData.isObstacle = true;
            gameState.scene.add(obstacle);
            gameState.obstacles.push(obstacle);
            return obstacle;
        }

        function createPortal(x, y, z, timePeriod) {
            const geometry = new THREE.TorusGeometry(1.5, 0.3, 16, 100);
            const material = new THREE.MeshStandardMaterial({ 
                color: TIME_PERIODS[timePeriod].color,
                emissive: TIME_PERIODS[timePeriod].color,
                emissiveIntensity: 0.8,
                metalness: 1,
                roughness: 0
            });
            const portal = new THREE.Mesh(geometry, material);
            portal.position.set(x, y, z);
            portal.rotation.x = Math.PI / 2;
            portal.userData.timePeriod = timePeriod;
            portal.userData.isPortal = true;
            gameState.scene.add(portal);
            gameState.portals.push(portal);
            
            // Portal particles
            const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({ 
                color: TIME_PERIODS[timePeriod].color,
                transparent: true,
                opacity: 0.6
            });
            
            for (let i = 0; i < 20; i++) {
                const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                particle.position.copy(portal.position);
                particle.userData.angle = Math.random() * Math.PI * 2;
                particle.userData.radius = Math.random() * 2;
                particle.userData.speed = Math.random() * 0.02 + 0.01;
                particle.userData.portal = portal;
                gameState.scene.add(particle);
                gameState.particles.push(particle);
            }
        }

        function createGoal(x, y, z) {
            const geometry = new THREE.CylinderGeometry(1, 1, 3, 32);
            const material = new THREE.MeshStandardMaterial({ 
                color: 0xffd700,
                emissive: 0xffd700,
                emissiveIntensity: 0.5,
                metalness: 1,
                roughness: 0.2
            });
            const goal = new THREE.Mesh(geometry, material);
            goal.position.set(x, y, z);
            goal.userData.isGoal = true;
            gameState.scene.add(goal);
            gameState.goal = goal;
        }

        function switchTimePeriod(period) {
            if (!gameState.isPlaying || !TIME_PERIODS[period]) return;
            
            gameState.currentTime = period;
            document.getElementById('timeIndicator').textContent = TIME_PERIODS[period].name;
            
            // Update atmosphere
            gameState.scene.fog.color.setHex(TIME_PERIODS[period].fog);
            gameState.atmosphereLight.color.setHex(TIME_PERIODS[period].color);
            
            // Show/hide time-specific objects
            updateTimeObjects();
            
            // Add screen effect
            flashScreen(TIME_PERIODS[period].color);
        }

        function updateTimeObjects() {
            const currentObjects = gameState.timeObjects[gameState.currentTime] || [];
            
            // Hide all time-specific objects
            [...gameState.obstacles, ...gameState.platforms].forEach(obj => {
                if (obj.userData.isPlatform || obj.userData.isObstacle) {
                    obj.visible = false;
                }
            });
            
            // Show current time period objects
            currentObjects.forEach(obj => {
                obj.visible = true;
            });
            
            // Always show ground
            if (gameState.platforms[0]) {
                gameState.platforms[0].visible = true;
            }
        }

        function flashScreen(color) {
            const flash = document.createElement('div');
            flash.style.position = 'fixed';
            flash.style.top = '0';
            flash.style.left = '0';
            flash.style.width = '100%';
            flash.style.height = '100%';
            flash.style.background = `#${color.toString(16).padStart(6, '0')}`;
            flash.style.opacity = '0.3';
            flash.style.pointerEvents = 'none';
            flash.style.transition = 'opacity 0.5s';
            flash.style.zIndex = '50';
            document.body.appendChild(flash);
            
            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => flash.remove(), 500);
            }, 50);
        }

        function updatePhysics() {
            if (!gameState.player || gameState.isPaused || !gameState.isPlaying) return;
            
            const moveSpeed = 0.15;
            const jumpForce = 0.3;
            const gravity = -0.02;
            
            // Apply gravity
            gameState.playerVelocity.y += gravity;
            
            // Movement
            const moveVector = new THREE.Vector3();
            if (gameState.keys['w'] || gameState.keys['ArrowUp']) moveVector.z -= moveSpeed;
            if (gameState.keys['s'] || gameState.keys['ArrowDown']) moveVector.z += moveSpeed;
            if (gameState.keys['a'] || gameState.keys['ArrowLeft']) moveVector.x -= moveSpeed;
            if (gameState.keys['d'] || gameState.keys['ArrowRight']) moveVector.x += moveSpeed;
            
            // Apply movement
            gameState.player.position.add(moveVector);
            gameState.player.position.y += gameState.playerVelocity.y;
            
            // Ground collision
            gameState.isGrounded = false;
            gameState.platforms.forEach(platform => {
                if (!platform.visible) return;
                
                const playerBox = new THREE.Box3().setFromObject(gameState.player);
                const platformBox = new THREE.Box3().setFromObject(platform);
                
                if (playerBox.intersectsBox(platformBox)) {
                    if (gameState.playerVelocity.y < 0) {
                        gameState.player.position.y = platformBox.max.y + 1;
                        gameState.playerVelocity.y = 0;
                        gameState.isGrounded = true;
                    }
                }
            });
            
            // Jump
            if ((gameState.keys[' '] || gameState.keys['Space']) && gameState.isGrounded) {
                gameState.playerVelocity.y = jumpForce;
                gameState.keys[' '] = false;
                gameState.keys['Space'] = false;
            }
            
            // Check obstacles collision
            gameState.obstacles.forEach(obstacle => {
                if (!obstacle.visible) return;
                
                const playerBox = new THREE.Box3().setFromObject(gameState.player);
                const obstacleBox = new THREE.Box3().setFromObject(obstacle);
                
                if (playerBox.intersectsBox(obstacleBox)) {
                    // Push player back
                    gameState.player.position.sub(moveVector.multiplyScalar(2));
                }
            });
            
            // Check portal interaction
            if (gameState.keys['e']) {
                gameState.portals.forEach(portal => {
                    const distance = gameState.player.position.distanceTo(portal.position);
                    if (distance < 3) {
                        switchTimePeriod(portal.userData.timePeriod);
                        gameState.keys['e'] = false;
                    }
                });
            }
            
            // Check goal
            if (gameState.goal) {
                const distance = gameState.player.position.distanceTo(gameState.goal.position);
                if (distance < 2) {
                    completeLevel();
                }
            }
            
            // Prevent falling through floor
            if (gameState.player.position.y < -5) {
                restartLevel();
            }
            
            // Camera follow
            gameState.camera.position.x = gameState.player.position.x;
            gameState.camera.position.z = gameState.player.position.z + 15;
            gameState.camera.lookAt(gameState.player.position);
        }

        function updateAnimations() {
            const time = Date.now() * 0.001;
            
            // Rotate portals
            gameState.portals.forEach(portal => {
                portal.rotation.z = time * 0.5;
            });
            
            // Animate particles
            gameState.particles.forEach(particle => {
                if (particle.userData.portal) {
                    particle.userData.angle += particle.userData.speed;
                    const x = Math.cos(particle.userData.angle) * particle.userData.radius;
                    const z = Math.sin(particle.userData.angle) * particle.userData.radius;
                    particle.position.x = particle.userData.portal.position.x + x;
                    particle.position.z = particle.userData.portal.position.z + z;
                    particle.position.y = particle.userData.portal.position.y + Math.sin(time * 2 + particle.userData.angle) * 0.5;
                }
            });
            
            // Animate goal
            if (gameState.goal) {
                gameState.goal.rotation.y = time;
                gameState.goal.position.y = 2 + Math.sin(time * 2) * 0.3;
            }
            
            // Player glow pulse
            if (gameState.player && gameState.player.children[0]) {
                gameState.player.children[0].material.opacity = 0.2 + Math.sin(time * 3) * 0.1;
            }
        }

        function completeLevel() {
            if (gameState.levelComplete) return;
            gameState.levelComplete = true;
            
            gameState.score += 1000;
            gameState.level++;
            
            document.getElementById('score').textContent = gameState.score;
            
            if (gameState.level > 3) {
                endGame();
            } else {
                setTimeout(() => {
                    document.getElementById('level').textContent = gameState.level;
                    gameState.player.position.set(-10, 2, 0);
                    gameState.playerVelocity.set(0, 0, 0);
                    createLevel(gameState.level);
                    gameState.levelComplete = false;
                    switchTimePeriod('present');
                }, 2000);
            }
        }

        function animate() {
            requestAnimationFrame(animate);
            
            if (gameState.isPlaying && !gameState.isPaused) {
                updatePhysics();
                updateAnimations();
            }
            
            gameState.renderer.render(gameState.scene, gameState.camera);
        }

        function startGame() {
            document.getElementById('menuScreen').classList.add('hidden');
            document.getElementById('hud').classList.remove('hidden');
            document.getElementById('timeIndicator').classList.remove('hidden');
            document.getElementById('powerUps').classList.remove('hidden');
            document.getElementById('instructions').classList.remove('hidden');
            document.getElementById('controls').classList.remove('hidden');
            
            gameState.isPlaying = true;
            gameState.isPaused = false;
            gameState.level = 1;
            gameState.score = 0;
            gameState.currentTime = 'present';
            gameState.levelComplete = false;
            
            document.getElementById('level').textContent = gameState.level;
            document.getElementById('score').textContent = gameState.score;
            
            gameState.player.position.set(-10, 2, 0);
            gameState.playerVelocity.set(0, 0, 0);
            
            updateTimeObjects();
        }

        function pauseGame() {
            gameState.isPaused = !gameState.isPaused;
            const pauseBtn = document.getElementById('pauseBtn');
            pauseBtn.textContent = gameState.isPaused ? 'RESUME' : 'PAUSE';
        }

        function restartLevel() {
            if (!gameState.isPlaying) return;
            
            gameState.player.position.set(-10, 2, 0);
            gameState.playerVelocity.set(0, 0, 0);
            gameState.levelComplete = false;
            createLevel(gameState.level);
            switchTimePeriod('present');
        }

        function restartGame() {
            document.getElementById('gameOverScreen').classList.add('hidden');
            document.getElementById('hud').classList.remove('hidden');
            document.getElementById('timeIndicator').classList.remove('hidden');
            document.getElementById('powerUps').classList.remove('hidden');
            document.getElementById('instructions').classList.remove('hidden');
            document.getElementById('controls').classList.remove('hidden');
            
            gameState.level = 1;
            gameState.score = 0;
            gameState.isPlaying = true;
            gameState.isPaused = false;
            gameState.levelComplete = false;
            
            document.getElementById('level').textContent = gameState.level;
            document.getElementById('score').textContent = gameState.score;
            
            gameState.player.position.set(-10, 2, 0);
            gameState.playerVelocity.set(0, 0, 0);
            
            createLevel(1);
            switchTimePeriod('present');
        }

        function exitGame() {
            document.getElementById('gameOverScreen').classList.add('hidden');
            document.getElementById('menuScreen').classList.remove('hidden');
            document.getElementById('hud').classList.add('hidden');
            document.getElementById('timeIndicator').classList.add('hidden');
            document.getElementById('powerUps').classList.add('hidden');
            document.getElementById('instructions').classList.add('hidden');
            document.getElementById('controls').classList.add('hidden');
            
            gameState.isPlaying = false;
            gameState.isPaused = false;
            gameState.level = 1;
            gameState.score = 0;
            gameState.levelComplete = false;
            
            gameState.player.position.set(-10, 2, 0);
            gameState.playerVelocity.set(0, 0, 0);
            
            createLevel(1);
        }

        function endGame() {
            gameState.isPlaying = false;
            document.getElementById('finalScore').textContent = `You completed all levels with a score of ${gameState.score}!`;
            document.getElementById('gameOverScreen').classList.remove('hidden');
            document.getElementById('hud').classList.add('hidden');
            document.getElementById('timeIndicator').classList.add('hidden');
            document.getElementById('powerUps').classList.add('hidden');
            document.getElementById('instructions').classList.add('hidden');
            document.getElementById('controls').classList.add('hidden');
        }

        function onKeyDown(e) {
            gameState.keys[e.key] = true;
            
            // Time switching shortcuts
            if (e.key === '1') switchTimePeriod('past');
            if (e.key === '2') switchTimePeriod('present');
            if (e.key === '3') switchTimePeriod('future');
            
            // Prevent space bar from scrolling
            if (e.key === ' ' || e.key === 'Space') {
                e.preventDefault();
            }
        }

        function onKeyUp(e) {
            gameState.keys[e.key] = false;
        }

        function onWindowResize() {
            gameState.camera.aspect = window.innerWidth / window.innerHeight;
            gameState.camera.updateProjectionMatrix();
            gameState.renderer.setSize(window.innerWidth, window.innerHeight);
        }

        // Initialize and start
        init();
        animate();
   
