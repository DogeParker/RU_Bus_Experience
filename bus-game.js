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

const buschBgImg = new Image();
buschBgImg.src = 'Busch Student Center Bus Stop.png'; // Make sure your image file is named this or update the path
let buschBgLoaded = false;
buschBgImg.onload = () => {
    buschBgLoaded = true;
};

const CDBgImg = new Image();
CDBgImg.src = 'Red Oak Lane Bus Stop.png'; // Make sure your image file is named this or update the path
let CDBgLoaded = false;
CDBgImg.onload = () => {
    CDBgLoaded = true;
};

// Background music
const bgMusic = new Audio('intense_action.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.4;   // 0.0 to 1.0

// Press M to mute / unmute
window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'm') bgMusic.muted = !bgMusic.muted;
});

// Game States
const STATES = { ROUTE_SELECT: 0, STAGE1_STOP: 1, TRANSITION: 2, STAGE2_BUS: 3,
                     WIN: 4, GAME_OVER: 5, STAGE3_WALK: 6 };
let currentState = STATES.ROUTE_SELECT;

// Route Configurations (Livi to Busch corrected to Route B)
const ROUTES = [
    { id: "Busch", dest: "CD", name: "Busch ➔ CD (Route REXB)", time: 40, maxBusCapacity: 20, campus: "Busch" },
    { id: "CD", dest: "Livi", name: "CD ➔ Livi (Route REXL)", time: 37, maxBusCapacity: 20, campus: "CD" },
    { id: "CD", dest: "CA", name: "CD ➔ CA (Route EE)", time: 34, maxBusCapacity: 20, campus: "CD" },
    {id: "CA", dest: "Busch", name: "CA ➔ Busch (Route A)", time: 32, maxBusCapacity: 20, campus: "College Ave" },
    { id: "Livi", dest: "Busch", name: "Livi ➔ Busch (Route B)", time: 29, maxBusCapacity: 20, campus: "Livi" },
    { id: "CA", dest: "Livi", name: "CA ➔ Livi (Route LX)", time: 27, maxBusCapacity: 20, campus: "College Ave" }
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
    walker.x = CA_START.x; walker.y = CA_START.y;
    bgMusic.pause();
}

function startRoute(routeIdx) {
    currentRouteIdx = routeIdx;
    const route = ROUTES[routeIdx];
    bgMusic.currentTime = 0;
    bgMusic.playbackRate = route.name.includes("LX") ? 1.3 : 1.0;
    bgMusic.play().catch(err => console.warn('Music blocked:', err));
    timeLeft = route.time;
    currentState = STATES.STAGE1_STOP;
    
    player.x = 250;   // farther back, away from the bus
    player.y = 390;
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
        // Bigger crowd for stage 1 (all campuses)
    npcs = [];
    const CROWD_SIZE = 50;   // was 28, raise or lower to taste
    while (npcs.length < CROWD_SIZE) {
        const nx = 270 + Math.random() * 280;
        const ny = 230 + Math.random() * 190;

        // Don't spawn on top of the player's starting spot
        if (Math.hypot(nx - player.x, ny - player.y) < 45) continue;

        npcs.push({
            x: nx,
            y: ny,
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
    if (currentState !== STATES.STAGE1_STOP && currentState !== STATES.STAGE2_BUS &&
        currentState !== STATES.TRANSITION && currentState !== STATES.STAGE3_WALK) return;

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
    } else if (currentState === STATES.STAGE3_WALK) {
       updateStage3(dt);
   }
}

// Bus collision: solid everywhere except a doorway around the door
const DOOR_OPEN_RADIUS = 40;   // how big the doorway is, bigger = easier to enter

function hitsBus(x, y) {
    // Doorway is always passable
    if (Math.hypot(x - bus.doorX, y - bus.doorY) < DOOR_OPEN_RADIUS) return false;

    // Player body box (roughly the sprite's torso and legs)
    const left   = x - 7;
    const right  = x + 7;
    const top    = y - 4;
    const bottom = y + 13;

    return right > bus.x && left < bus.x + bus.w &&
           bottom > bus.y && top < bus.y + bus.h;
}

function updateStage1(dt) {
    player.vx = 0;
    player.vy = 0;
    if (keys['w'] || keys['W']) player.vy = -player.speed;
    if (keys['s'] || keys['S']) player.vy = player.speed;
    if (keys['a'] || keys['A']) player.vx = -player.speed;
    if (keys['d'] || keys['D']) player.vx = player.speed;

    if (!hitsBus(player.x + player.vx, player.y)) player.x += player.vx;
    if (!hitsBus(player.x, player.y + player.vy)) player.y += player.vy;

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

    const prevPX = player.x, prevPY = player.y;

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
                if (hitsBus(player.x, player.y)) {
        player.x = prevPX;
        player.y = prevPY;
    }
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
           if (ROUTES[currentRouteIdx].campus === "College Ave") initStage3();
           else currentState = STATES.WIN;
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
        document.getElementById('bus-capacity-text').style.display = 'none';
        document.querySelector('.capacity-bar-container').style.display = 'none';
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
    } else if (currentState === STATES.STAGE3_WALK) {
        renderStage3();
      }
}

function drawFace(cx, cy, r, color, happy) {
    // Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(cx - r * 0.35, cy - r * 0.2, r * 0.12, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.35, cy - r * 0.2, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";

    if (happy) {
        // Smile
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.05, r * 0.5, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
    } else {
        // Angry eyebrows (slanted down toward the middle)
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.6, cy - r * 0.55);
        ctx.lineTo(cx - r * 0.15, cy - r * 0.35);
        ctx.moveTo(cx + r * 0.6, cy - r * 0.55);
        ctx.lineTo(cx + r * 0.15, cy - r * 0.35);
        ctx.stroke();

        // Frown
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.65, r * 0.4, 1.15 * Math.PI, 1.85 * Math.PI);
        ctx.stroke();
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

        // Face icons to the left of specific routes
        const faceX = 150;
        const faceY = startY + i * 50 + 20;
        if (route.name.includes("REXB")) {
            drawFace(faceX, faceY, 16, "#00ff44", true);    // bright green happy face
        } else if (route.name.includes("LX")) {
            drawFace(faceX, faceY, 16, "#8b0000", false);   // dark red angry face
        }

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
        if (buschBgLoaded) {
            ctx.drawImage(buschBgImg, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "#f5f2e3";   // fallback while the image loads
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    } else if (campus === "CD") {
        if (CDBgLoaded) {
            ctx.drawImage(CDBgImg, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "#f5f2e3";   // fallback while the image loads
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
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
    if (campus !== "Livi" && campus !== "College Ave" && campus !== "Busch" && campus !== "CD") {
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

const caMapImg = new Image();
caMapImg.src = 'CA_Map.png';
let caMapLoaded = false;
let caPixels = null;          // pixel data used for collision + destination detection

caMapImg.onload = () => {
    caMapLoaded = true;
    try {
        const c = document.createElement('canvas');
        c.width = caMapImg.naturalWidth;
        c.height = caMapImg.naturalHeight;
        const cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(caMapImg, 0, 0);
        caPixels = cx.getImageData(0, 0, c.width, c.height);
    } catch (e) {
        // Happens if you open the html straight from disk (file://). Use a local server
        // (e.g. VS Code "Live Server" or `python -m http.server`) to get collisions.
        console.warn('Stage 3 collision disabled (canvas tainted):', e);
        caPixels = null;
    }
};

// Positions are in MAP IMAGE pixels (the map is ~843x886)
const CA_START = { x: 113, y: 627 };           // center of the red rectangle
const CA_GOAL  = { x: 470, y: 150, r: 75 };    // fallback circle around the yellow area

let walker = { x: CA_START.x, y: CA_START.y, facing: 1 };
let stage3Pulse = 0;

function initStage3() {
    currentState = STATES.STAGE3_WALK;
    walker.x = CA_START.x;
    walker.y = CA_START.y;
    stage3Pulse = 0;
}

function getMapPixel(x, y) {
    if (!caPixels) return null;
    const ix = Math.floor(x), iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= caPixels.width || iy >= caPixels.height) return null;
    const i = (iy * caPixels.width + ix) * 4;
    const d = caPixels.data;
    return { r: d[i], g: d[i + 1], b: d[i + 2] };
}

// Buildings are the dark neutral gray (~#505050). Roads are lighter gray, so they are walkable.
function isBlockedPoint(x, y) {
    const w = caMapLoaded ? caMapImg.naturalWidth : 843;
    const h = caMapLoaded ? caMapImg.naturalHeight : 886;
    if (x < 0 || y < 0 || x >= w || y >= h) return true;   // map edge
    const p = getMapPixel(x, y);
    if (!p) return false;                                   // no pixel data -> no building collision
    return p.r < 100 && p.g < 100 && p.b < 100 &&
           Math.abs(p.r - p.g) < 10 && Math.abs(p.g - p.b) < 10;
}

// Collision box sits at the character's feet
function isBlockedAt(x, y) {
    const fy = y + 13;
    return isBlockedPoint(x - 6, fy) || isBlockedPoint(x + 6, fy) ||
           isBlockedPoint(x - 6, fy - 6) || isBlockedPoint(x + 6, fy - 6);
}

function isInGoal(x, y) {
    const fy = y + 13;
    const p = getMapPixel(x, fy);
    if (p) return p.r > 230 && p.g > 230 && p.b > 120 && p.b < 210; // pale yellow
    return Math.hypot(x - CA_GOAL.x, fy - CA_GOAL.y) < CA_GOAL.r;
}

function updateStage3(dt) {
    stage3Pulse += dt;

    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup'])    dy -= 1;
    if (keys['s'] || keys['arrowdown'])  dy += 1;
    if (keys['a'] || keys['arrowleft'])  dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        const speed = 170; // map pixels per second
        dx = (dx / len) * speed * dt;
        dy = (dy / len) * speed * dt;
        if (dx !== 0) walker.facing = dx > 0 ? 1 : -1;

        // Move each axis separately so you slide along walls
        if (!isBlockedAt(walker.x + dx, walker.y)) walker.x += dx;
        if (!isBlockedAt(walker.x, walker.y + dy)) walker.y += dy;
    }

    if (isInGoal(walker.x, walker.y)) {
        currentState = STATES.WIN;
    }
}

function renderStage3() {
    ctx.fillStyle = "#0b0b0b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fixed camera: fit the whole map to the canvas height, centered
    const mapW = caMapLoaded ? caMapImg.naturalWidth : 843;
    const mapH = caMapLoaded ? caMapImg.naturalHeight : 886;
    const scale = canvas.height / mapH;
    const offX = (canvas.width - mapW * scale) / 2;

    ctx.save();
    ctx.translate(offX, 0);
    ctx.scale(scale, scale);

    if (caMapLoaded) {
        ctx.drawImage(caMapImg, 0, 0);
    } else {
        ctx.fillStyle = "#a8c060";
        ctx.fillRect(0, 0, mapW, mapH);
    }

    // Destination marker (pulsing outline + label over the yellow area)
    const pulse = 0.5 + 0.5 * Math.sin(stage3Pulse * 4);
    ctx.strokeStyle = `rgba(255, 60, 60, ${0.5 + pulse * 0.5})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(CA_GOAL.x, CA_GOAL.y, CA_GOAL.r + pulse * 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#cc0033";
    ctx.font = "bold 26px 'Courier New'";
    ctx.textAlign = "center";
    ctx.fillText("CLASS", CA_GOAL.x, CA_GOAL.y - CA_GOAL.r - 18);
    ctx.fillText("\u25BC", CA_GOAL.x, CA_GOAL.y - CA_GOAL.r + 6 + pulse * 6);
    ctx.textAlign = "left";

    // Player
    drawPixelStudent(walker.x, walker.y, playerStyle, 1.1, false);

    ctx.restore();

    // Instructions HUD
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px 'Courier New'";
    ctx.textAlign = "left";
    ctx.fillText("WASD / Arrows: Walk", 12, canvas.height - 40);
    ctx.fillText("Get to class!", 12, canvas.height - 22);
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