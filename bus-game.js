const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load the Livingston custom background image
const liviBgImg = new Image();
liviBgImg.src = 'Livingston_Bus_Stop_2.png'; // Make sure your image file is named this or update the path
let liviBgLoaded = false;
liviBgImg.onload = () => {
    liviBgLoaded = true;
};
// Load the College Ave custom background image
const cayaBgImg = new Image();
cayaBgImg.src = 'College_Ave_Bus_Stop_2.png'; // Make sure your image file is named this or update the path
let cayaBgLoaded = false;
cayaBgImg.onload = () => {
    cayaBgLoaded = true;
};

// Game States
const STATES = { ROUTE_SELECT: 0, STAGE1_STOP: 1, TRANSITION: 2, STAGE2_BUS: 3, WIN: 4, GAME_OVER: 5 };
let currentState = STATES.ROUTE_SELECT;

// Route Configurations (Livi to Busch corrected to Route B)
const ROUTES = [
    { id: "CA", dest: "Busch", name: "CA ➔ Busch (Route A)", time: 85, maxBusCapacity: 18, campus: "College Ave" },
    { id: "Busch", dest: "CD", name: "Busch ➔ CD (Route REXB)", time: 95, maxBusCapacity: 20, campus: "Busch" },
    { id: "CD", dest: "CA", name: "CD ➔ CA (Route EE)", time: 90, maxBusCapacity: 18, campus: "CD" },
    { id: "CD", dest: "Livi", name: "CD ➔ Livi (Route REXL)", time: 95, maxBusCapacity: 20, campus: "CD" },
    { id: "Livi", dest: "Busch", name: "Livi ➔ Busch (Route B)", time: 80, maxBusCapacity: 16, campus: "Livi" },
    { id: "CA", dest: "Livi", name: "CA ➔ Livi (Route LX)", time: 85, maxBusCapacity: 22, campus: "College Ave" }
];
let currentRouteIdx = 0;

// Color Palette Pools for Random Student NPCs
const HAIR_COLORS = ["#1a365d", "#4a2c11", "#171717", "#d97706", "#9a3412", "#2563eb"];
const SHIRT_COLORS = ["#dc2626", "#059669", "#7c3aed", "#ea580c", "#2563eb", "#0284c7", "#4b5563", "#e11d48"];
const BAG_COLORS = ["#facc15", "#06b6d4", "#84cc16", "#d946ef", "#f97316"];
const PANTS_COLORS = ["#1e3a8a", "#1e293b", "#334155", "#78350f"];

let timeLeft = 0;
let lastTime = 0;
let transitionTimer = 0;

const keys = {};
window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

canvas.addEventListener('click', (e) => {
    if (currentState === STATES.ROUTE_SELECT) {
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const startY = 175; // Adjusted down for lower title
        for (let i = 0; i < ROUTES.length; i++) {
            if (clickX >= 180 && clickX <= 620 && clickY >= startY + i * 50 && clickY <= startY + i * 50 + 40) {
                startRoute(i);
                break;
            }
        }
    } else if (currentState === STATES.WIN || currentState === STATES.GAME_OVER) {
        resetToMenu();
    }
});

function getRandomStudentStyle() {
    return {
        hair: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
        shirt: SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)],
        bag: BAG_COLORS[Math.floor(Math.random() * BAG_COLORS.length)],
        pants: PANTS_COLORS[Math.floor(Math.random() * PANTS_COLORS.length)],
        skin: "#f59e0b"
    };
}

const playerStyle = {
    hair: "#0284c7",
    shirt: "#dc2626",
    bag: "#facc15",
    pants: "#1e3a8a",
    skin: "#fbbf24"
};

let player = { x: 380, y: 330, vx: 0, vy: 0, speed: 2.8, isPunching: false, punchTimer: 0, style: playerStyle };
let bus = { x: 460, y: 150, w: 120, h: 240, passengers: 0, maxPassengers: 18, doorX: 520, doorY: 320 };
let npcs = [];
let busBalance = 0;
let busForce = 0;
let stage2Progress = 0;
let busNpcs = [];

function drawPixelStudent(x, y, style, scale = 1, isStunned = false) {
    ctx.save();
    ctx.translate(x, y);
    if (isStunned) {
        ctx.shadowColor = "#ff3300";
        ctx.shadowBlur = 10;
    }
    const p = scale * 1.5;
    ctx.fillStyle = style.hair;
    ctx.fillRect(-4 * p, -14 * p, 8 * p, 4 * p);
    ctx.fillRect(-5 * p, -12 * p, 3 * p, 4 * p);
    ctx.fillStyle = style.skin;
    ctx.fillRect(-3 * p, -10 * p, 6 * p, 4 * p);
    ctx.fillStyle = style.bag;
    ctx.fillRect(-5 * p, -5 * p, 3 * p, 7 * p);
    ctx.fillStyle = style.shirt;
    ctx.fillRect(-3 * p, -6 * p, 6 * p, 6 * p);
    ctx.fillStyle = style.bag;
    ctx.fillRect(-2 * p, -6 * p, 1 * p, 6 * p);
    ctx.fillRect(1 * p, -6 * p, 1 * p, 6 * p);
    ctx.fillStyle = style.pants;
    ctx.fillRect(-3 * p, 0, 2.5 * p, 7 * p);
    ctx.fillRect(0.5 * p, 0, 2.5 * p, 7 * p);
    ctx.fillStyle = "#701a75";
    ctx.fillRect(-4 * p, 7 * p, 3 * p, 2 * p);
    ctx.fillRect(1 * p, 7 * p, 3 * p, 2 * p);
    ctx.restore();
}

function resetToMenu() {
    currentState = STATES.ROUTE_SELECT;
    timeLeft = 0;
    bus.passengers = 0;
    stage2Progress = 0;
    busBalance = 0;
    npcs = [];
    busNpcs = [];
    document.getElementById('timer').innerText = `Time Left: --`;
    document.getElementById('route-info').innerText = `Choose A Route`;
    document.getElementById('bus-capacity-text').innerText = `Bus: 0/18`;
    document.getElementById('capacity-fill').style.width = '0%';
}

function startRoute(routeIdx) {
    currentRouteIdx = routeIdx;
    const route = ROUTES[routeIdx];
    timeLeft = route.time;
    currentState = STATES.STAGE1_STOP;
    
    player.x = 380;
    player.y = 330;
    player.vx = 0;
    player.vy = 0;
    
    bus.passengers = Math.floor(route.maxBusCapacity * 0.3);
    bus.maxPassengers = route.maxBusCapacity;

    // Adjust Bus position specifically for Livingston curved road
    if (route.campus === "Livi" || route.campus === "College Ave") {
        bus.x = 660; // Moved further onto the gray road
        bus.y = 200;
        bus.w = 90;
        bus.h = 170;
        bus.doorX = bus.x - 15; // Door faces toward the waiting students
        bus.doorY = bus.y + 85;
    } else {
        bus.x = 480;
        bus.y = 250;
        bus.w = 90;
        bus.h = 170;
        bus.doorX = bus.x + 45;
        bus.doorY = bus.y + 90;
    }
    
    // Higher crowd density for stage 1
    npcs = [];
    for (let i = 0; i < 28; i++) {
        npcs.push({
            x: 300 + Math.random() * 200,
            y: 250 + Math.random() * 150,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            stunned: 0,
            style: getRandomStudentStyle()
        });
    }
    
    busBalance = 0;
    busForce = 0;
    stage2Progress = 0;
    lastTime = performance.now();
}

function initStage2() {
    currentState = STATES.STAGE2_BUS;
    busBalance = 0;
    busForce = 0;
    stage2Progress = 0;
    
    // Populate seats & aisle with packed passenger NPCs
    busNpcs = [];
    const seatRows = 5;
    for (let i = 0; i < seatRows; i++) {
        const seatY = 88 + i * 72;   // seat top (60 + i*72) + half height, nudged for sprite origin
        busNpcs.push({ x: 92,  y: seatY, offset: 0, style: getRandomStudentStyle() });
        busNpcs.push({ x: 708, y: seatY, offset: 0, style: getRandomStudentStyle() });
    }
}

function update(dt) {
    if (currentState !== STATES.STAGE1_STOP && currentState !== STATES.STAGE2_BUS && currentState !== STATES.TRANSITION) return;

    timeLeft -= dt;
    if (timeLeft <= 0) {
        timeLeft = 0;
        currentState = STATES.GAME_OVER;
        return;
    }

    if (currentState === STATES.STAGE1_STOP) {
        updateStage1(dt);
    } else if (currentState === STATES.TRANSITION) {
        transitionTimer -= dt;
        if (transitionTimer <= 0) {
            initStage2();
        }
    } else if (currentState === STATES.STAGE2_BUS) {
        updateStage2(dt);
    }
}

function updateStage1(dt) {
    player.vx = 0;
    player.vy = 0;
    if (keys['w'] || keys['W']) player.vy = -player.speed;
    if (keys['s'] || keys['S']) player.vy = player.speed;
    if (keys['a'] || keys['A']) player.vx = -player.speed;
    if (keys['d'] || keys['D']) player.vx = player.speed;

    player.x += player.vx;
    player.y += player.vy;

    player.x = Math.max(220, Math.min(canvas.width - 120, player.x));
    player.y = Math.max(180, Math.min(canvas.height - 50, player.y));

    if ((keys['q'] || keys['Q']) && player.punchTimer <= 0) {
        player.isPunching = true;
        player.punchTimer = 30;
        
        npcs.forEach(npc => {
            let pdx = npc.x - player.x;
            let pdy = npc.y - player.y;
            let pdist = Math.hypot(pdx, pdy);
            if (pdist < 50) {
                let pushAngle = Math.atan2(pdy, pdx);
                npc.vx = Math.cos(pushAngle) * 2.2;
                npc.vy = Math.sin(pushAngle) * 2.2;
                npc.stunned = 18;
            }
        });
    }
    if (player.punchTimer > 0) {
        player.punchTimer--;
        if (player.punchTimer < 22) player.isPunching = false;
    }

    npcs.forEach(npc => {
        if (npc.stunned > 0) {
            npc.stunned--;
            npc.x += npc.vx;
            npc.y += npc.vy;
            npc.vx *= 0.75;
            npc.vy *= 0.75;
            return;
        }

        let dx = bus.doorX - npc.x;
        let dy = bus.doorY - npc.y;
        let dist = Math.hypot(dx, dy);

        if (dist > 14) {
            npc.x += (dx / dist) * 0.7;
            npc.y += (dy / dist) * 0.7;
        } else {
            if (bus.passengers < bus.maxPassengers) {
                bus.passengers++;
                npc.x = -9999; 
            }
        }

        // Movable NPCs with crowd resistance (reduces/pushes back player movement on contact)
        let pdist = Math.hypot(npc.x - player.x, npc.y - player.y);
        if (pdist < 28) {
            let angle = Math.atan2(npc.y - player.y, npc.x - player.x);
            // Push NPC away so they are not immovable
            npc.x += Math.cos(angle) * 1.0;
            npc.y += Math.sin(angle) * 1.0;
            // Resist and push back player movement
            player.x -= Math.cos(angle) * 2.69;
            player.y -= Math.sin(angle) * 2.69;
        }
    });

    if (bus.passengers >= bus.maxPassengers) {
        currentState = STATES.GAME_OVER;
    }

    let doorDist = Math.hypot(bus.doorX - player.x, bus.doorY - player.y);
    if (doorDist < 28 && bus.passengers < bus.maxPassengers) {
        // Transition pause before Stage 2
        currentState = STATES.TRANSITION;
        transitionTimer = 1.5; 
    }
}

function updateStage2(dt) {
    stage2Progress += dt * 5.5; 

    if (Math.random() < 0.03) {
        busForce += (Math.random() - 0.5) * 5.0; 
    }
    
    // Easier balancing: gentle damping and collision shove resistance
    busForce *= .75; 
    busForce += 0.01 * busBalance;

    busBalance += busForce;

    if (keys['a'] || keys['arrowleft']) busBalance -= 1.6;
    if (keys['d'] || keys['arrowright']) busBalance += 1.6;

    if (Math.abs(busBalance) > 100) {
        currentState = STATES.GAME_OVER;
    }

    if (stage2Progress >= 100) {
        currentState = STATES.WIN;
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update Top UI Display
    if (currentState !== STATES.ROUTE_SELECT && currentState !== STATES.WIN && currentState !== STATES.GAME_OVER && currentState !== STATES.TRANSITION) {
        const route = ROUTES[currentRouteIdx];
        document.getElementById('timer').innerText = `Time Left: ${Math.ceil(timeLeft)}s`;
        document.getElementById('route-info').innerText = `Route: ${route.name}`;

        // Only show capacity bar in Stage 1
        if (currentState === STATES.STAGE1_STOP) {
            document.getElementById('bus-capacity-text').style.display = 'inline';
            document.querySelector('.capacity-bar-container').style.display = 'inline-block';
            document.getElementById('bus-capacity-text').innerText = `Bus: ${bus.passengers}/${bus.maxPassengers}`;
            const fillPercent = (bus.passengers / bus.maxPassengers) * 100;
            document.getElementById('capacity-fill').style.width = fillPercent + '%';
            document.getElementById('capacity-fill').style.background = fillPercent >= 100 ? '#ff3333' : '#cc0033';
        } else {
            // Hide capacity bar during Stage 2
            document.getElementById('bus-capacity-text').style.display = 'none';
            document.querySelector('.capacity-bar-container').style.display = 'none';
        }
    } else {
        // Reset visibility on menu / end screens
        document.getElementById('bus-capacity-text').style.display = 'inline';
        document.querySelector('.capacity-bar-container').style.display = 'inline-block';
    }

    if (currentState === STATES.ROUTE_SELECT) {
        renderRouteSelect();
    } else if (currentState === STATES.STAGE1_STOP) {
        renderStage1();
    } else if (currentState === STATES.TRANSITION) {
        renderStage1();
        renderTransitionOverlay();
    } else if (currentState === STATES.STAGE2_BUS) {
        renderStage2();
    } else if (currentState === STATES.WIN) {
        renderEndScreen(true);
    } else if (currentState === STATES.GAME_OVER) {
        renderEndScreen(false);
    }
}

function renderRouteSelect() {
    ctx.fillStyle = "#161616";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title Header (Consistent Courier New)
    ctx.fillStyle = "#cc0033";
    ctx.font = "bold 28px 'Courier New', Courier, monospace";
    ctx.textAlign = "center";
    ctx.fillText("THE RU BUS EXPERIENCE", canvas.width / 2, 85);
    
    // Subtitle Instructions (Consistent Courier New)
    ctx.fillStyle = "#fff";
    ctx.font = "16px 'Courier New', Courier, monospace";
    ctx.fillText("Select your campus route to get to class on time:", canvas.width / 2, 130);
    ctx.textAlign = "left";

    const startY = 175;
    ROUTES.forEach((route, i) => {
        // Route Card Box
        ctx.fillStyle = "#262626";
        ctx.fillRect(180, startY + i * 50, 440, 40);
        ctx.strokeStyle = "#cc0033";
        ctx.lineWidth = 2;
        ctx.strokeRect(180, startY + i * 50, 440, 40);

        // Route Name Label
        ctx.fillStyle = "#fff";
        ctx.font = "15px 'Courier New', Courier, monospace";
        ctx.fillText(route.name, 200, startY + i * 50 + 25);
        
        // Campus Tag Label (Right Aligned)
        ctx.fillStyle = "#ffcc00";
        ctx.font = "13px 'Courier New', Courier, monospace";
        ctx.textAlign = "right";
        ctx.fillText(`Campus: ${route.campus}`, 600, startY + i * 50 + 25);
        ctx.textAlign = "left"; // Reset alignment back to left
    });
}

function renderStage1() {
    const campus = ROUTES[currentRouteIdx].campus;

    // 1. Render Backgrounds
    if (campus === "College Ave") {
        if (cayaBgLoaded) {
            ctx.drawImage(cayaBgImg, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "#f5f2e3";   // fallback while the image loads
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } else if (campus === "Busch") {
        ctx.fillStyle = "#182026"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#3a4a5a"; ctx.fillRect(60, 40, 680, 110); 
        ctx.fillStyle = "#222"; ctx.fillRect(100, 60, 150, 70);
        ctx.fillRect(550, 60, 150, 70);
        ctx.fillStyle = "#00ffcc"; ctx.font = "bold 13px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("BUSCH STUDENT CENTER PLAZA", 400, 100);
        ctx.textAlign = "left";
    } else if (campus === "CD") {
        ctx.fillStyle = "#142214"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#703020"; ctx.fillRect(60, 40, 680, 100); 
        ctx.fillStyle = "#1e3a1e"; 
        for(let t=0; t<8; t++) {
            ctx.beginPath(); ctx.arc(80 + t * 90, 110, 25, 0, Math.PI*2); ctx.fill();
        }
        ctx.fillStyle = "#aaffaa"; ctx.font = "bold 13px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("BIEL ROAD BUS STOP (COOK / DOUGLASS)", 400, 95);
        ctx.textAlign = "left";
    } else {
        // --- RENDER ACTUAL LIVINGSTON BACKGROUND IMAGE ---
        if (liviBgLoaded) {
            ctx.drawImage(liviBgImg, 0, 0, canvas.width, canvas.height);
        } else {
            // Fallback color while image loads
            ctx.fillStyle = "#f5f2e3";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    // 2. Render Default Road/Platform Box ONLY for non-Livingston routes
    if (campus !== "Livi" && campus !== "College Ave") {
        ctx.fillStyle = "#222";
        ctx.fillRect(0, 200, canvas.width, 300);
        ctx.fillStyle = "#777"; 
        ctx.fillRect(200, 230, 420, 240);
        ctx.fillStyle = "#555"; 
        ctx.fillRect(200, 230, 420, 16);
    }

    // 3. Render Bus
    const bx = bus.x;
    const by = bus.y;

    ctx.fillStyle = "#cc0033";
    ctx.fillRect(bx, by, bus.w, bus.h);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bx, by, bus.w, 14);

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(bx + 8, by + 22, 22, 35);
    ctx.fillRect(bx + 34, by + 22, 22, 35);
    ctx.fillRect(bx + 60, by + 22, 22, 35);

    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(bx + 10, by + 24, 7, 31);
    ctx.fillRect(bx + 36, by + 24, 7, 31);
    ctx.fillRect(bx + 62, by + 24, 7, 31);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(bx + 28, by + 75, 34, 55);
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(bx + 31, by + 78, 13, 49);
    ctx.fillRect(bx + 46, by + 78, 13, 49);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bx + 44, by + 78, 2, 49);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bx, by + 145, bus.w, 6);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(bx - 5, by + 30, 6, 20);
    ctx.fillRect(bx - 5, by + 115, 6, 20);
    ctx.fillRect(bx + bus.w - 1, by + 30, 6, 20);
    ctx.fillRect(bx + bus.w - 1, by + 115, 6, 20);

    // 4. Render Students and Player
    npcs.forEach(npc => {
        if (npc.x < -500) return;
        drawPixelStudent(npc.x, npc.y, npc.style, 0.9, npc.stunned > 0);
    });

    drawPixelStudent(player.x, player.y, player.style, 1.0, false);

    if (player.isPunching) {
        ctx.strokeStyle = "#ffff00";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 35, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function renderTransitionOverlay() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00ffcc";
    ctx.font = "bold 24px Courier New";
    ctx.textAlign = "center";
    ctx.fillText("BOARDED THE BUS! HOLD ON...", canvas.width / 2, canvas.height / 2);
    ctx.textAlign = "left";
}

function renderStage2() {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#223344";
    ctx.fillRect(50, 40, 90, 370);
    ctx.fillRect(660, 40, 90, 370);
    
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 40, 90, 370);
    ctx.strokeRect(660, 40, 90, 370);

    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(140, 0, 520, canvas.height);

    ctx.fillStyle = "#1e3a8a"; 
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(55, 60 + i * 72, 75, 48);
        ctx.strokeStyle = "#ffcc00";
        ctx.strokeRect(55, 60 + i * 72, 75, 48);
        
        ctx.fillRect(670, 60 + i * 72, 75, 48);
        ctx.strokeRect(670, 60 + i * 72, 75, 48);
    }

    ctx.strokeStyle = "#ffcc00";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(200, 0); ctx.lineTo(200, 420);
    ctx.moveTo(600, 0); ctx.lineTo(600, 420);
    ctx.stroke();

    ctx.fillStyle = "#222";
    ctx.fillRect(300, 0, 200, 75);
    ctx.strokeStyle = "#cc0033";
    ctx.lineWidth = 2;
    ctx.strokeRect(300, 0, 200, 75);
    
    ctx.fillStyle = "#ffaa00";
    ctx.beginPath();
    ctx.arc(400, 30, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "10px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText("DRIVER", 400, 62);
    ctx.textAlign = "left";

    // Render seated & standing passengers properly on seats/aisles
    busNpcs.forEach(npc => {
        drawPixelStudent(npc.x + npc.offset, npc.y, npc.style, 0.85);
    });

    let playerX = 400 + busBalance * 1.8;
    drawPixelStudent(playerX, 350, playerStyle, 1.0);
    
    ctx.fillStyle = "#00ffcc";
    ctx.font = "bold 11px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText("YOU", playerX, 380);
    ctx.textAlign = "left";

    // Balance Bar UI (Centered horizontally from X=200 to 600)
    ctx.fillStyle = "#222";
    ctx.fillRect(200, 440, 400, 25);
    ctx.fillStyle = Math.abs(busBalance) > 75 ? "#ff3333" : "#00ffcc";
    ctx.fillRect(400, 440, busBalance * 2, 25);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.strokeRect(200, 440, 400, 25);

    // Trip Progress and Centered Hold On Instructions directly above the balance bar
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText(`Trip Progress: ${Math.floor(stage2Progress)}%`, 400, 395);
    
    ctx.font = "13px 'Courier New'";
    ctx.fillText("HOLD ON! (Resist Crowds & Brakes with A/D)", 400, 420);
    ctx.textAlign = "left";
}

function renderEndScreen(isWin) {
    ctx.fillStyle = "rgba(0,0,0,0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = "32px Courier New";
    ctx.textAlign = "center";
    if (isWin) {
        ctx.fillStyle = "#00ffcc";
        ctx.fillText("YOU MADE IT TO CLASS!", canvas.width / 2, 200);
        ctx.font = "18px Courier New";
        ctx.fillStyle = "#fff";
        ctx.fillText("You survived peak hours on the RU bus system.", canvas.width / 2, 250);
    } else {
        ctx.fillStyle = "#ff3333";
        ctx.fillText("YOU LOST!", canvas.width / 2, 180);
        ctx.font = "18px Courier New";
        ctx.fillStyle = "#fff";
        ctx.fillText("You missed the bus, ran out of time, or went flying!", canvas.width / 2, 230);
        ctx.fillText("You are late to class and failed the semester.", canvas.width / 2, 260);
    }

    ctx.fillStyle = "#aaa";
    ctx.font = "15px Courier New";
    ctx.fillText("Click anywhere to return to Route Selection", canvas.width / 2, 330);
    ctx.textAlign = "left";
}

function gameLoop(time) {
    let dt = (time - lastTime) / 1000;
    if (isNaN(dt) || dt > 0.1) dt = 0.016;
    lastTime = time;

    update(dt);
    render();

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);