# Functional Specification: SimGrid Chrome Extension

- **Roadmap Item:** Auto-import championship data from TheSimGrid.com
- **Status:** Completed
- **Author:** AI Assistant

---

## 1. Overview and Rationale (The "Why")

### Problem Statement
RaceStand users who participate in SimGrid championships must manually enter all championship data:
- Scoring table (points per position)
- Number of rounds and drop rounds
- Fastest lap bonus settings
- All competitor names
- Race results for every driver in every completed race

This manual entry is:
- **Time-consuming:** A 40-driver, 5-round championship requires entering 200+ data points
- **Error-prone:** Typos in names or positions lead to incorrect calculations
- **Repetitive:** Users must re-enter data after each race

### Solution
A Chrome browser extension that automatically extracts championship data from TheSimGrid.com and imports it directly into RaceStand with one click.

### Success Metrics
- Import time reduced from 15-30 minutes to under 10 seconds
- Zero manual data entry errors for imported data
- User can go from SimGrid page to analyzing scenarios in RaceStand in under 30 seconds

---

## 2. Functional Requirements (The "What")

### 2.1 Page Detection and Activation

**As a** user browsing TheSimGrid.com, **I want** the extension to automatically detect when I'm on a championship page, **so that** I can easily import the data without searching for buttons.

**Acceptance Criteria:**
- [x] Extension detects URLs matching pattern `thesimgrid.com/championships/*/standings`
- [x] Extension detects URLs matching pattern `thesimgrid.com/championships/*/scoring` *(implemented via fetch from standings page rather than separate page detection)*
- [x] When on a valid championship page, a floating "Import to RaceStand" button appears
- [x] Button is positioned in bottom-right corner, does not obscure page content
- [x] Button uses RaceStand branding (dark theme, gold accent)
- [x] Button does NOT appear on non-championship pages

### 2.2 Data Extraction from Standings Page

**As a** user on a SimGrid standings page, **I want** the extension to extract all championship data, **so that** I don't have to enter it manually.

**Data to Extract:**
| Field | Source | Required |
|-------|--------|----------|
| Championship name | Page title/header | Yes |
| Total rounds | Count of race columns | Yes |
| Driver names | Standings table rows | Yes |
| Race positions | Per-driver cells (P1, P2, etc.) | Yes |
| Fastest lap indicators | FL markers in results | Yes |
| Drop rounds | Scoring description or auto-detect | No |

**Acceptance Criteria:**
- [x] Extracts championship name from page header
- [x] Extracts total number of rounds from race result columns
- [x] Extracts all driver names (cleaned of emojis/flags)
- [x] Extracts finishing position for each driver in each completed race
- [x] Extracts fastest lap data if present (one driver per race maximum)
- [x] Handles DNS/DNF/DSQ results as empty positions (0 points)
- [x] Works with championships of any size (1-50+ drivers)

### 2.3 Data Extraction from Scoring Page (Optional Enhancement)

**As a** user, **I want** the extension to remember scoring configuration if I visit the scoring page, **so that** my import has accurate point values.

**Acceptance Criteria:**
- [x] When user visits `/championships/*/scoring`, extract the scoring table *(fetched programmatically from standings page)*
- [x] Store scoring table in extension storage, associated with championship ID *(used in-memory per import session rather than chrome.storage)*
- [x] Extract fastest lap bonus value if specified
- [x] When importing from standings page, use stored scoring if available
- [x] If no scoring data stored, auto-detect from standings (position-to-points patterns) or use defaults

### 2.4 Import Flow

**As a** user ready to import, **I want** to click the import button and have RaceStand open with my data, **so that** I can immediately start analyzing scenarios.

**User Flow:**
1. User visits SimGrid championship standings page
2. Floating "Import to RaceStand" button appears
3. User clicks button
4. Extension extracts data from current page
5. New browser tab opens with RaceStand
6. RaceStand loads with all imported data pre-populated
7. User sees their championship ready for scenario simulation

**Acceptance Criteria:**
- [x] Clicking import button opens RaceStand in a new tab
- [x] All extracted data is passed to RaceStand (via URL parameters or localStorage)
- [x] RaceStand receives and displays: championship name, scoring table, rounds, drivers, results, FL data
- [x] Import completes in under 3 seconds
- [x] User can immediately interact with the imported championship

### 2.5 Error Handling

**As a** user, **I want** clear feedback if something goes wrong, **so that** I can understand and resolve the issue.

**Acceptance Criteria:**
- [x] If page structure doesn't match expected format, show error: "Could not find championship data on this page. Make sure you're on a SimGrid standings page."
- [x] If partial data extracted, show warning listing what was found vs. missing
- [x] If extraction fails completely, show error with "Report Issue" link *(shows detailed error messages instead of a report link)*
- [x] Errors appear in a styled popup, not browser alerts
- [x] User can dismiss errors and retry

### 2.6 Visual Design

**Acceptance Criteria:**
- [x] Floating button: Dark background (#1a1a2e), gold accent (#eab308), "Import to RaceStand" text
- [x] Button has subtle shadow and hover effect
- [x] Error/warning popups match RaceStand dark theme
- [x] Extension icon in Chrome toolbar shows RaceStand logo

---

## 3. Scope and Boundaries

### In-Scope
- Chrome browser extension (Manifest V3)
- Detection of TheSimGrid.com championship pages
- Extraction of standings, results, and scoring data
- One-click import to RaceStand
- Error handling with user feedback
- Floating import button UI

### Out-of-Scope
- Firefox, Safari, or other browser support (future consideration)
- Support for other sim racing platforms (iRacing, ACC native, etc.)
- Automatic sync or live updates from SimGrid
- User accounts or authentication
- Editing data within the extension
- v1.1 Social features (shareable URLs, export/import)
- Team/constructor championship support
