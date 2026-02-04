# Technical Specification: SimGrid Chrome Extension

- **Functional Specification:** `context/spec/001-simgrid-chrome-extension/functional-spec.md`
- **Status:** Draft
- **Author(s):** AI Assistant

---

## 1. High-Level Technical Approach

The SimGrid Chrome Extension will be implemented as a **Manifest V3 Chrome extension** that:

1. **Detects** TheSimGrid.com championship pages via URL pattern matching
2. **Injects** a floating "Import to RaceStand" button into those pages
3. **Scrapes** championship data (drivers, results, scoring) from the page DOM
4. **Opens** a bundled copy of RaceStand with the data encoded in URL parameters
5. **RaceStand** parses the URL, populates state, auto-saves, and renders

**Key architectural decisions:**
- **Data transfer:** URL parameters with LZString-compressed, base64-encoded JSON
- **RaceStand distribution:** Bundled within the extension (fully offline)
- **UI approach:** Floating button only (no toolbar popup)
- **Scraping strategy:** Robust selectors with version checking

---

## 2. Proposed Solution & Implementation Plan

### 2.1 Extension File Structure

```
simgrid-racestand-extension/
├── manifest.json          # Extension manifest (MV3)
├── content.js             # Content script - SimGrid page detection & scraping
├── background.js          # Service worker - tab management
├── styles.css             # Floating button styles
├── lib/
│   └── lz-string.min.js   # Compression library (~3KB)
├── racestand/
│   └── racestand.html     # Bundled RaceStand app (modified for import)
└── icons/
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

### 2.2 Extension Components

#### manifest.json

```json
{
  "manifest_version": 3,
  "name": "SimGrid to RaceStand Importer",
  "version": "1.0.0",
  "description": "Import championship data from TheSimGrid.com into RaceStand",
  "permissions": ["activeTab"],
  "host_permissions": ["*://thesimgrid.com/*"],
  "content_scripts": [
    {
      "matches": ["*://thesimgrid.com/championships/*/standings*"],
      "js": ["lib/lz-string.min.js", "content.js"],
      "css": ["styles.css"]
    }
  ],
  "background": {
    "service_worker": "background.js"
  },
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "web_accessible_resources": [
    {
      "resources": ["racestand/racestand.html"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

#### content.js (Core Extraction Logic)

**Responsibilities:**
1. Detect championship standings page
2. Inject floating import button
3. On click: extract data, compress, open RaceStand

**Data Extraction Algorithm:**

```javascript
function extractChampionshipData() {
  return {
    championship: {
      name: extractChampionshipName(),
      scoring: extractScoringTable() || [25,18,15,12,10,8,6,4,2,1], // Default F1
      totalRounds: extractTotalRounds(),
      countBest: extractCountBest() || totalRounds, // Default: all count
      flEnabled: extractFastestLapEnabled(),
      flBonus: extractFastestLapBonus() || 1,
      targetPosition: 1
    },
    competitors: extractCompetitors()
  };
}

function extractCompetitors() {
  // Find standings table rows
  // For each row: extract name, results array
  // Parse position from cell text (P1 -> 1, DNF -> null)
  // Detect fastest lap indicators
}
```

#### background.js (Service Worker)

**Responsibilities:**
- Open RaceStand tab when content script requests it
- Construct chrome-extension:// URL with import parameter

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_RACESTAND') {
    const compressed = LZString.compressToEncodedURIComponent(
      JSON.stringify(message.data)
    );
    const racestandUrl = chrome.runtime.getURL(
      `racestand/racestand.html?import=${compressed}`
    );
    chrome.tabs.create({ url: racestandUrl });
  }
});
```

#### styles.css (Floating Button)

```css
#racestand-import-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10000;
  background: #1a1a2e;
  color: #eab308;
  border: 2px solid #eab308;
  padding: 12px 20px;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transition: all 0.2s ease;
}

#racestand-import-btn:hover {
  background: #eab308;
  color: #1a1a2e;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(234, 179, 8, 0.3);
}
```

### 2.3 RaceStand Modifications

**File:** `racestand.html`

#### New Function: `checkUrlImport()` (Add after localStorage section ~line 2055)

```javascript
function checkUrlImport() {
  const params = new URLSearchParams(window.location.search);
  const importData = params.get('import');

  if (!importData) return null;

  try {
    // Decompress LZString and parse JSON
    const jsonStr = LZString.decompressFromEncodedURIComponent(importData);
    if (!jsonStr) throw new Error('Decompression failed');

    const data = JSON.parse(jsonStr);

    // Validate structure
    if (!data.championship || !Array.isArray(data.competitors)) {
      console.error('Invalid import data structure');
      return null;
    }

    // Merge into state
    Object.assign(state.championship, data.championship);

    state.competitors = data.competitors.map(comp => ({
      id: generateId(),
      name: comp.name,
      isMyDriver: comp.isMyDriver || false,
      results: comp.results || Array(state.championship.totalRounds)
        .fill(null).map(() => ({ position: null, fastestLap: false }))
    }));

    // Ensure at least one myDriver
    if (!state.competitors.some(c => c.isMyDriver) && state.competitors.length > 0) {
      state.competitors[0].isMyDriver = true;
    }

    // Update championship name input
    const nameInput = document.getElementById('championship-name');
    if (nameInput && data.championship?.name) {
      nameInput.value = data.championship.name;
    }

    // Clean URL (remove import parameter)
    window.history.replaceState({}, '', window.location.pathname);

    // Auto-save to localStorage
    setTimeout(() => {
      saveToStorage();
      showSaveIndicator('Imported!');
    }, 100);

    console.log('Imported championship:', data.championship?.name);
    return data;

  } catch (e) {
    console.error('Failed to parse import data:', e);
    alert('Failed to import championship data. The data may be corrupted.');
    return null;
  }
}
```

#### Modify `init()` function (~line 3990)

```javascript
function init() {
  initEventListeners();

  // Check for URL import first
  const importedData = checkUrlImport();
  if (importedData) {
    render();
    return;
  }

  // Existing localStorage logic continues...
  const savedData = loadFromStorage();
  // ...
}
```

#### Add LZString Library

Include LZString (~3KB) in a `<script>` tag before the main application script:

```html
<script>
// LZString library (minified) - for URL import decompression
var LZString = (function() { /* minified code */ })();
</script>
```

### 2.4 Data Format Specification

**Import JSON Schema:**

```javascript
{
  championship: {
    name: String,           // Required
    scoring: Number[],      // Required, points array [P1, P2, ...]
    totalRounds: Number,    // Required, >= 1
    countBest: Number,      // Optional, defaults to totalRounds
    flEnabled: Boolean,     // Optional, defaults to false
    flBonus: Number,        // Optional, defaults to 1
    targetPosition: Number  // Optional, defaults to 1
  },
  competitors: [
    {
      name: String,         // Required
      isMyDriver: Boolean,  // Optional, defaults to false
      results: [
        {
          position: Number|null,  // null = DNF/DNS/future
          fastestLap: Boolean     // true if fastest lap in this race
        }
      ]  // Length should match totalRounds
    }
  ]
}
```

---

## 3. Impact and Risk Analysis

### System Dependencies

| Dependency | Component | Risk Level | Notes |
|------------|-----------|------------|-------|
| TheSimGrid.com DOM structure | Extension | **Medium** | Site updates may break extraction |
| Chrome Extension APIs (MV3) | Extension | **Low** | Stable, well-documented |
| LZString library | Both | **Low** | Mature, no dependencies |
| RaceStand state model | Both | **Low** | Under our control |

### Potential Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SimGrid page structure changes | High | Include extension version in UI; use robust selectors based on semantic structure; document known working version |
| URL length limits (~2MB in Chrome) | Low | LZString compression typically achieves 60-70% reduction; 50 drivers × 50 races = ~100KB uncompressed → ~35KB compressed |
| Malformed extraction data | Medium | Validate all fields before import; show clear error messages with details |
| User imports stale/wrong championship | Low | Show championship name prominently after import; allow immediate editing |

---

## 4. Testing Strategy

### Manual Testing Plan

**Extension Testing:**

1. Install extension in Chrome Developer Mode
2. Navigate to various SimGrid championship pages:
   - Small championship (5 drivers, 3 races)
   - Medium championship (20 drivers, 10 races)
   - Large championship (40+ drivers, 20+ races)
   - Championship with DNF/DNS results
   - Championship with fastest lap data
   - Championship without fastest lap
3. Verify floating button appears only on valid pages
4. Click import, verify RaceStand opens with correct data
5. Verify auto-save works (refresh RaceStand, data persists)

**Edge Case Testing:**

- Empty championship (no results yet)
- Championship with special characters in driver names
- Championship with tied positions
- Incomplete race data

**Browser Testing:**

- Chrome 80+ (primary)
- Edge Chromium (secondary verification)
