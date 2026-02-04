# RaceStand — System Architecture

- **Version:** 0.1 (MVP)
- **Last Updated:** 2026-02-03

---

## 1. Architecture Overview

RaceStand is a **single-file web application** — one self-contained HTML file that users download and open in their browser. No server, no build tools, no dependencies.

```
+------------------------------------------+
|           racestand.html                 |
|  +------------------------------------+  |
|  |  <style> CSS (inline)              |  |
|  +------------------------------------+  |
|  |  <body> HTML structure             |  |
|  +------------------------------------+  |
|  |  <script> Vanilla JavaScript       |  |
|  +------------------------------------+  |
+------------------------------------------+
         |
         v
+------------------------------------------+
|        Browser (any modern browser)      |
|  - Renders UI                            |
|  - Runs calculations                     |
|  - localStorage for persistence (v1.0)   |
+------------------------------------------+
```

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Markup** | HTML5 | Universal, no build required |
| **Styling** | CSS3 (inline) | Single file, no external dependencies |
| **Logic** | Vanilla JavaScript (ES6+) | No framework overhead, works everywhere |
| **Storage** | localStorage (v1.0) | Browser-native, simple API, 5MB limit |
| **Distribution** | Downloadable HTML file | No hosting required, works offline |

### Why This Stack?

1. **Shareability:** Non-programmers can download and open the file directly
2. **Portability:** Works on any device with a modern browser
3. **Offline-first:** No internet required after download
4. **Zero dependencies:** No npm, no build tools, no CDN reliance
5. **Maintainability:** Single file, easy to update and redistribute

---

## 3. File Structure

### MVP (v0.1)
```
simgrid-extension/
├── racestand.html          # The entire application
├── context/                # Documentation (not shipped)
│   ├── product/
│   ├── roadmap/
│   ├── spec/
│   └── architecture/
└── README.md               # Usage instructions
```

### Future (v1.1+)
```
simgrid-extension/
├── racestand.html          # Main application
├── racestand.min.html      # Minified version (optional)
└── examples/
    ├── f1-2024.json        # Example championship data
    └── acc-league.json
```

---

## 4. Application Architecture

### 4.1 HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RaceStand - Championship Calculator</title>
    <style>
        /* All CSS here */
    </style>
</head>
<body>
    <div id="app">
        <header id="header">...</header>
        <section id="config">...</section>
        <section id="grid">...</section>
        <section id="status">...</section>
    </div>
    <script>
        /* All JavaScript here */
    </script>
</body>
</html>
```

### 4.2 JavaScript Architecture

```
State Management (single source of truth)
    │
    ├── state = {
    │       championship: { name, scoring, rounds, dropRounds, flBonus },
    │       competitors: [{ id, name, isMyDriver, results: [] }],
    │       ui: { selectedCell, editMode }
    │   }
    │
    ├── Actions (modify state)
    │   ├── setScoring(pointsArray)
    │   ├── addCompetitor(name)
    │   ├── removeCompetitor(id)
    │   ├── setResult(competitorId, raceIndex, position)
    │   ├── setFastestLap(competitorId, raceIndex)
    │   ├── setMyDriver(competitorId)
    │   └── updateConfig(config)
    │
    ├── Calculations (pure functions, no side effects)
    │   ├── calculatePoints(position, hasFl)
    │   ├── calculateTotal(results, dropCount)
    │   ├── calculateStandings(competitors)
    │   ├── calculateChampionshipStatus(myDriver, competitors)
    │   └── calculateWhatNeeded(myDriver, competitors, remainingRaces)
    │
    └── Render (update DOM from state)
        ├── renderConfig()
        ├── renderGrid()
        ├── renderStandings()
        └── renderStatus()
```

### 4.3 Data Model

```javascript
// Championship configuration
const championship = {
    name: "GT4 League 2024",
    scoring: [30, 27, 24, 21, 18, 16, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
    totalRounds: 5,
    countBest: 4,           // Best 4 of 5
    flEnabled: true,
    flBonus: 1
};

// Competitor with results
const competitor = {
    id: "comp_1",
    name: "Kazlanzhy",
    isMyDriver: true,
    results: [
        { position: 1, fastestLap: true },   // R1
        { position: 1, fastestLap: true },   // R2
        { position: null, fastestLap: false }, // R3 (future/empty)
        { position: null, fastestLap: false }, // R4 (future/empty)
        { position: null, fastestLap: false }  // R5 (future/empty)
    ]
};

// Calculated standing
const standing = {
    competitorId: "comp_1",
    totalPoints: 62,
    pointsWithDrops: 62,
    rank: 1,
    isTied: false,
    wins: 2,
    canWinChampionship: true,
    isEliminated: false
};
```

---

## 5. Key Algorithms

### 5.1 Points Calculation

```javascript
function calculateRacePoints(position, hasFastestLap, scoring, flBonus) {
    if (position === null || position === undefined) return 0;
    const positionPoints = scoring[position - 1] || 0;
    const flPoints = hasFastestLap ? flBonus : 0;
    return positionPoints + flPoints;
}
```

### 5.2 Total with Drop Rounds

```javascript
function calculateTotalWithDrops(results, scoring, flBonus, countBest) {
    const racePoints = results.map(r =>
        calculateRacePoints(r.position, r.fastestLap, scoring, flBonus)
    );

    // Sort descending, take best N
    const sorted = [...racePoints].sort((a, b) => b - a);
    const best = sorted.slice(0, countBest);

    return best.reduce((sum, pts) => sum + pts, 0);
}
```

### 5.3 Championship Status

```javascript
function calculateChampionshipStatus(myDriver, allCompetitors, config) {
    const myMax = calculateMaxPossiblePoints(myDriver, config);
    const myMin = calculateMinPossiblePoints(myDriver, config);

    let status = 'LEADING';
    let threats = [];

    for (const rival of allCompetitors) {
        if (rival.id === myDriver.id) continue;

        const rivalMax = calculateMaxPossiblePoints(rival, config);

        if (rivalMax >= myMin) {
            threats.push({ rival, maxPoints: rivalMax });
        }
    }

    if (threats.length === 0) {
        status = 'GUARANTEED';
    } else if (myMin > Math.max(...threats.map(t => t.maxPoints))) {
        status = 'GUARANTEED';
    } else if (myMax < getCurrentLeaderPoints()) {
        status = 'ELIMINATED';
    }

    return { status, threats, myMax, myMin };
}
```

---

## 6. Storage Strategy (v1.0)

### localStorage Schema

```javascript
// Key: "racestand_championship"
// Value: JSON string of full state

const storageSchema = {
    version: "1.0",
    savedAt: "2024-01-15T10:30:00Z",
    championship: { /* config */ },
    competitors: [ /* array */ ]
};

// Save
function saveToStorage(state) {
    const data = {
        version: "1.0",
        savedAt: new Date().toISOString(),
        ...state
    };
    localStorage.setItem('racestand_championship', JSON.stringify(data));
}

// Load
function loadFromStorage() {
    const raw = localStorage.getItem('racestand_championship');
    if (!raw) return null;
    return JSON.parse(raw);
}
```

### Auto-save Behavior

- Save on every state change (debounced 500ms)
- Load on page open
- "Clear Data" button to reset

---

## 7. Browser Compatibility

### Target Browsers

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 80+ | Primary development target |
| Firefox | 75+ | Full support |
| Safari | 13+ | Full support |
| Edge | 80+ | Chromium-based |
| Mobile Safari | iOS 13+ | Touch-optimized |
| Chrome Android | 80+ | Touch-optimized |

### Required Features

- ES6+ (let/const, arrow functions, template literals, destructuring)
- CSS Grid and Flexbox
- localStorage API
- CSS custom properties (variables)

### Polyfills

None required — targeting modern browsers only.

---

## 8. Performance Considerations

### Bundle Size Target

- **Total file size:** < 50KB (uncompressed)
- **HTML:** ~5KB
- **CSS:** ~15KB
- **JavaScript:** ~30KB

### Optimization Strategies

1. **No external dependencies** — zero network requests
2. **Efficient DOM updates** — only re-render changed sections
3. **Debounced saves** — don't write to localStorage on every keystroke
4. **CSS-based animations** — no JS animation libraries

### Calculation Performance

- Up to 50 competitors, 50 races = 2,500 cells
- Recalculation on every change should be < 10ms
- Use memoization for expensive calculations if needed

---

## 9. Security Considerations

### Data Handling

- All data stays local (browser only)
- No server communication
- No cookies or tracking
- localStorage is per-origin (file:// origin)

### Input Validation

- Sanitize all user inputs before DOM insertion
- Use textContent instead of innerHTML where possible
- Validate numeric inputs (positions, points)

---

## 10. Future Architecture (v1.1+)

### Shareable URLs

```javascript
// Encode state to URL hash
function encodeToUrl(state) {
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(state));
    return `${window.location.href}#${compressed}`;
}

// Decode state from URL hash
function decodeFromUrl() {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    return JSON.parse(LZString.decompressFromEncodedURIComponent(hash));
}
```

Note: May need to include LZString library (3KB) for compression in v1.1.

### Export/Import

```javascript
// Export to JSON file
function exportToJson(state) {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    // Trigger download
}

// Import from JSON file
function importFromJson(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const state = JSON.parse(e.target.result);
        // Validate and load
    };
    reader.readAsText(file);
}
```

---

## 11. Development Workflow

### No Build Process

1. Edit `racestand.html` directly
2. Open in browser to test
3. Refresh to see changes

### Testing

- Manual testing in target browsers
- Use browser DevTools for debugging
- Test with sample championship data

### Distribution

1. User downloads `racestand.html`
2. User opens file in browser (double-click or File > Open)
3. Works immediately, no installation needed

---

## 12. Constraints & Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Single HTML file | Limited code organization, but maximum portability |
| Vanilla JS | More boilerplate, but zero dependencies |
| No build tools | No minification/bundling, but simpler workflow |
| localStorage | Data stuck on one device, but no server needed |
| Download distribution | User must manage file, but works fully offline |

These trade-offs align with the goal of making RaceStand accessible to non-technical users who just want to download and use a tool.
