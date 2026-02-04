# Tasks: SimGrid Chrome Extension

> **Spec:** `context/spec/001-simgrid-chrome-extension/`
> **Status:** Ready for Implementation

---

## Slice 1: Basic Extension Scaffolding with Floating Button
*Goal: Extension installs and shows a non-functional button on SimGrid standings pages*

- [x] **Slice 1: Basic extension that shows floating button on SimGrid pages**
  - [x] Create extension directory structure with manifest.json (Manifest V3) **[Agent: frontend-developer]**
  - [x] Create styles.css with floating button styling (dark theme, gold accent) **[Agent: frontend-developer]**
  - [x] Create content.js that injects a static "Import to RaceStand" button on SimGrid standings pages **[Agent: frontend-developer]**
  - [x] Add placeholder icon files (16, 48, 128px) **[Agent: frontend-developer]**
  - [x] Test: Load extension in Chrome Developer Mode, verify button appears on `thesimgrid.com/championships/*/standings` **[Agent: general-purpose]**

---

## Slice 2: Extract Championship Name and Driver List
*Goal: Clicking button extracts basic data and logs it to console*

- [x] **Slice 2: Extract championship name and driver names from SimGrid page**
  - [x] Implement `extractChampionshipName()` function to scrape championship title from page header **[Agent: frontend-developer]**
  - [x] Implement `extractCompetitors()` function to scrape driver names from standings table rows **[Agent: frontend-developer]**
  - [x] On button click, call extraction functions and log results to console **[Agent: frontend-developer]**
  - [x] Test: Verify correct championship name and all driver names are extracted **[Agent: general-purpose]**

---

## Slice 3: Extract Race Results and Positions
*Goal: Full race data extraction including positions for each driver*

- [x] **Slice 3: Extract race results (positions) for all drivers**
  - [x] Implement `extractTotalRounds()` to count race columns in standings table **[Agent: frontend-developer]**
  - [x] Extend `extractCompetitors()` to parse race positions (P1→1, P2→2, DNF→null) for each driver **[Agent: frontend-developer]**
  - [x] Handle edge cases: DNS, DSQ, empty cells as null positions **[Agent: frontend-developer]**
  - [x] Test: Verify complete results array for each competitor matches page data **[Agent: general-purpose]**

---

## Slice 4: Extract Fastest Lap Data
*Goal: Detect and extract fastest lap indicators per race*

- [x] **Slice 4: Extract fastest lap indicators from standings**
  - [x] Implement `extractFastestLapEnabled()` to detect if FL data is present on page **[Agent: frontend-developer]**
  - [x] Extend results extraction to capture `fastestLap: true/false` for each race result **[Agent: frontend-developer]**
  - [x] Test: Verify fastest lap data correctly captured (one FL per race maximum) **[Agent: general-purpose]**

---

## Slice 5: Build Import Data Structure
*Goal: Assemble extracted data into RaceStand-compatible JSON format*

- [x] **Slice 5: Assemble complete championship data object**
  - [x] Implement `extractChampionshipData()` that combines all extraction functions **[Agent: frontend-developer]**
  - [x] Add default scoring table (F1: 25,18,15,12,10,8,6,4,2,1) and default config values **[Agent: frontend-developer]**
  - [x] Validate data structure matches RaceStand import schema **[Agent: frontend-developer]**
  - [x] Test: Button click logs complete, valid JSON structure to console **[Agent: general-purpose]**

---

## Slice 6: Add LZString Compression
*Goal: Compress data for URL parameter transfer*

- [x] **Slice 6: Add data compression with LZString**
  - [x] Add lz-string.min.js library to extension's lib/ folder **[Agent: frontend-developer]**
  - [x] Update manifest.json to include LZString in content script **[Agent: frontend-developer]**
  - [x] Implement compression: `LZString.compressToEncodedURIComponent(JSON.stringify(data))` **[Agent: frontend-developer]**
  - [x] Test: Verify compression reduces data size and output is URL-safe **[Agent: general-purpose]**

---

## Slice 7: Modify RaceStand for URL Import
*Goal: RaceStand can receive and parse imported data from URL parameter*

- [x] **Slice 7: Add URL import capability to RaceStand**
  - [x] Add LZString library to racestand.html (inline or script tag) **[Agent: frontend-developer]**
  - [x] Implement `checkUrlImport()` function to parse `?import=` parameter **[Agent: frontend-developer]**
  - [x] Implement decompression and JSON parsing with error handling **[Agent: frontend-developer]**
  - [x] Modify `init()` function to call `checkUrlImport()` before localStorage load **[Agent: frontend-developer]**
  - [x] Test: Manually craft URL with import parameter, verify RaceStand loads data **[Agent: general-purpose]**

---

## Slice 8: RaceStand Auto-Save and URL Cleanup
*Goal: Imported data is persisted and URL is cleaned*

- [x] **Slice 8: Auto-save imported data and clean URL**
  - [x] After successful import, call `saveToStorage()` to persist championship **[Agent: frontend-developer]**
  - [x] Show "Imported!" indicator via `showSaveIndicator()` **[Agent: frontend-developer]**
  - [x] Use `history.replaceState()` to remove import parameter from URL **[Agent: frontend-developer]**
  - [x] Test: Import data, refresh page, verify championship persists from localStorage **[Agent: general-purpose]**

---

## Slice 9: Bundle RaceStand in Extension
*Goal: Extension includes RaceStand and can open it*

- [x] **Slice 9: Bundle RaceStand and open on button click**
  - [x] Copy modified racestand.html into extension's racestand/ folder **[Agent: frontend-developer]**
  - [x] Update manifest.json web_accessible_resources to expose racestand.html **[Agent: frontend-developer]**
  - [x] Create background.js service worker to handle tab creation **[Agent: frontend-developer]**
  - [x] Implement message passing: content.js sends data to background.js **[Agent: frontend-developer]**
  - [x] background.js constructs chrome-extension:// URL with compressed data and opens tab **[Agent: frontend-developer]**
  - [x] Test: Click button on SimGrid page, verify RaceStand opens with imported data **[Agent: general-purpose]**

---

## Slice 10: Error Handling and User Feedback
*Goal: Clear error messages when extraction fails*

- [x] **Slice 10: Add error handling and user feedback**
  - [x] Add try-catch around extraction functions **[Agent: frontend-developer]**
  - [x] Create styled error popup matching RaceStand theme **[Agent: frontend-developer]**
  - [x] Show specific error messages: "Could not find championship data", "Missing driver names", etc. **[Agent: frontend-developer]**
  - [x] Add loading state to button during extraction **[Agent: frontend-developer]**
  - [ ] Test: Navigate to non-championship page, verify appropriate error shown **[Agent: general-purpose]**

---

## Slice 11: Final Polish and Extension Icons
*Goal: Production-ready extension with proper branding*

- [ ] **Slice 11: Final polish and branding**
  - [ ] Create proper RaceStand-branded icons (16, 48, 128px) **[Agent: frontend-developer]**
  - [ ] Add extension version number visible in manifest and button tooltip **[Agent: frontend-developer]**
  - [ ] Final manual testing across various SimGrid championship pages **[Agent: general-purpose]**
  - [ ] Document known working SimGrid page structure version **[Agent: general-purpose]**
