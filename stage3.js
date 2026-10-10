// ======================================================================
// STAGE 3: WALK TO CLASS (top-down, fixed camera) - College Ave map
// Paste this whole block anywhere ABOVE gameLoop() in your main file.
// Save your map image as "CA_Map.png" next to your html file.
// ======================================================================

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

// ======================================================================
// EDITS TO YOUR EXISTING CODE (5 small changes)
// ======================================================================
//
// 1) Add the new state:
//    const STATES = { ROUTE_SELECT: 0, STAGE1_STOP: 1, TRANSITION: 2, STAGE2_BUS: 3,
//                     WIN: 4, GAME_OVER: 5, STAGE3_WALK: 6 };
//
// 2) In update(dt), allow the timer to run in stage 3:
//    if (currentState !== STATES.STAGE1_STOP && currentState !== STATES.STAGE2_BUS &&
//        currentState !== STATES.TRANSITION && currentState !== STATES.STAGE3_WALK) return;
//
//    ...and add one more branch at the bottom of that function:
//    } else if (currentState === STATES.STAGE3_WALK) {
//        updateStage3(dt);
//    }
//
// 3) In updateStage2(dt), replace:
//        if (stage2Progress >= 100) { currentState = STATES.WIN; }
//    with:
//        if (stage2Progress >= 100) {
//            if (ROUTES[currentRouteIdx].campus === "College Ave") initStage3();
//            else currentState = STATES.WIN;
//        }
//
// 4) In render(), add a branch next to the other states:
//    } else if (currentState === STATES.STAGE3_WALK) {
//        renderStage3();
//    }
//
// 5) In resetToMenu(), nothing is required, but if you want to be safe add:
//        walker.x = CA_START.x; walker.y = CA_START.y;