# 🚍 The RU Bus Experience Game

> *“Survive peak hours, fight the crowd, hold on for dear life, and make it to class on time.”*

🎮 **Play it live right now at:** [kylesmithdp.uk/RUBusExperience](https://kylesmithdp.uk/RUBusExperience)

Welcome to **The RU Bus Experience Game**—a chaotic, arcade-style browser game that captures the authentic, adrenaline-pumping trial of navigating the notoriously packed campus bus system. 

---

## 🎮 Game Overview

Navigating campus transport isn't for the faint of heart. In this game, you must conquer two intense stages of transit survival across iconic campus routes:

1. **Stage 1: The Bus Stop Rumble** — Battle the massive student crowd swarming the bus doors. Weave through bodies, use your **shove/punch mechanic (`Q`)** to part the sea of students, and board the bus before time runs out! NPCs react dynamically with physics and crowd resistance.
2. **Stage 2: The Packed Aisle Balance** — You made it on, but the doors are barely shut! As the bus careens around campus turns, you'll need to actively balance your position using **`A` / `D`** (or the arrow keys) to avoid getting flung around, tripping over passengers, or getting a Game Over.

---

## 🌟 Key Features

*   **Multiple Campus Routes**: Choose from authentic routes complete with unique campus backdrops:
    *   **CA ➔ Busch** (Route B - College Ave)
    *   **Busch ➔ CD** (Route REXB - Busch)
    *   **CD ➔ CA** (Route EE - Cook/Douglass)
    *   **CD ➔ Livi** (Route REXL)
    *   **Livi ➔ Busch** (Route B - Livingston)
    *   **CA ➔ Livi** (Route LX)
*   **Dynamic Crowd Physics**: Unstunned NPCs act as a solid crowd barrier with realistic pushback resistance, requiring tactical use of your shove move (`Q`) to punch your way to the front.
*   **Pixel-Art Student Generator**: Every student NPC features randomized hair, shirt, bag, and pants color palettes for a uniquely vibrant crowd every playthrough.
*   **Physics-Based Bus Balancing**: A weighted balance meter in Stage 2 that simulates erratic bus physics and passenger momentum.

---

## 🕹️ Controls

| Action | Key / Control |
| :--- | :--- |
| **Move Around / Balance** | `W`, `A`, `S`, `D` or `Arrow Keys` |
| **Shove / Punch Crowd** | `Q` |
| **Menu / UI Navigation** | Mouse Click |

---

## 🛠️ Local Setup & Installation

If you want to run or modify the source code locally:

1. Clone or download the repository containing the `index.html` and script files.
2. Ensure you have the required DOM elements in your HTML:
   ```html
   <canvas id="gameCanvas" width="800" height="480"></canvas>
   <div id="timer">Time Left: --</div>
   <div id="route-info">Choose A Route</div>
   <div id="bus-capacity-text">Bus: 0/18</div>
   <div id="capacity-bar"><div id="capacity-fill"></div></div>
