# Product Definition: RaceStand

- **Version:** 1.0
- **Status:** Proposed

---

## 1. The Big Picture (The "Why")

### 1.1. Project Vision & Purpose

To empower racers to instantly understand their championship position and calculate exactly what they need to win — eliminating manual spreadsheet calculations and giving them confidence in their race strategy.

### 1.2. Target Audience

Sim racers and amateur motorsport competitors participating in point-based championships with multiple rounds. This includes participants in sim racing leagues (iRacing, Assetto Corsa Competizione, etc.) and real-world karting or amateur racing series.

### 1.3. User Personas

- **Persona 1: "Alex the Sim Racer"**
  - **Role:** Competitive sim racer in a GT4 league with 8 rounds.
  - **Goal:** Wants to know before each race what positions guarantee the championship title, so they can decide whether to race aggressively or defensively.
  - **Frustration:** Currently uses messy spreadsheets that take hours to update and often contain calculation errors. Has to manually work through dozens of "what if" scenarios.

- **Persona 2: "Maria the Kart Racer"**
  - **Role:** Amateur kart racer competing in a regional championship.
  - **Goal:** Wants to understand if skipping the final round (due to scheduling conflict) will cost her the championship.
  - **Frustration:** The championship uses a "best 5 of 6" drop-round system, making manual calculations complex and error-prone.

### 1.4. Success Metrics

- Users trust the calculations enough to make real race-strategy decisions based on RaceStand results.
- Reduce time spent on championship calculations from hours to minutes.
- Users share their scenario results with league-mates and on social media.
- Active adoption within sim racing communities and leagues.

---

## 2. The Product Experience (The "What")

### 2.1. Core Features

- **Custom Scoring Table:** User-defined position-to-points mapping (e.g., P1=30, P2=27, P3=24, etc.)
- **Fastest Lap Bonus:** Optional toggle to add bonus point(s) for achieving fastest lap in a race
- **Drop Rounds:** Configurable "best X of Y" results system (e.g., best 4 of 5 races count toward final standings)
- **Scenario Simulator:** Interactive tool to test "what if" scenarios — calculate championship outcomes based on hypothetical future race results

### 2.2. User Journey

1. User opens RaceStand in their browser.
2. User configures the championship format: sets the scoring table (points per position), enables/disables fastest lap bonus, and configures drop rounds if applicable.
3. User enters competitors and their current results from completed races.
4. User uses the scenario simulator to select hypothetical finishing positions for upcoming races.
5. RaceStand instantly calculates and displays whether the championship is "guaranteed," "at risk," or "lost" based on the scenario.
6. User shares the scenario (via URL) with teammates or on social media.

---

## 3. Project Boundaries

### 3.1. What's In-Scope for this Version

- Web-based application accessible via browser (desktop and mobile responsive).
- Manual entry of championship configuration (scoring table, number of rounds, drop rounds).
- Manual entry of competitor names and race results.
- Real-time scenario simulation with instant recalculation.
- Clear visual feedback on championship status (guaranteed/at risk/lost).
- Shareable URLs for specific scenarios.

### 3.2. What's Out-of-Scope (Non-Goals)

- Multi-championship tracking (managing multiple championships simultaneously).
- Cloud sync or user accounts (no login, no data persistence across devices).
- Team/constructor championship calculations.
- Live data integration with racing platforms (iRacing, ACC, etc.).
- Mobile native applications (iOS/Android).
- Historical data or statistics tracking.
