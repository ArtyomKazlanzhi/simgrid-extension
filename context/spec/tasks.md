# RaceStand MVP — Task List

- **Version:** 0.1 (MVP)
- **Created:** 2026-02-03
- **Approach:** Vertical Slices — each slice results in a runnable application

---

## Slice 1: Basic HTML Shell with Styling

Create the foundation — a styled HTML page that opens in a browser.

- [x] Create `racestand.html` with DOCTYPE, head, meta tags, and empty body **[Agent: frontend-developer]**
- [x] Add CSS variables (design tokens) for colors, fonts, spacing **[Agent: frontend-developer]**
- [x] Add base CSS styles (reset, body, #app container) **[Agent: frontend-developer]**
- [x] Add header section with logo and championship name input **[Agent: frontend-developer]**
- [x] Style header with dark theme **[Agent: frontend-developer]**

**Runnable checkpoint:** User can open file, see styled header with "RaceStand" title.

---

## Slice 2: Configuration Panel (Static UI)

Add the config panel structure without functionality.

- [x] Add config panel HTML (scoring input, rounds, drop rounds, FL toggle) **[Agent: frontend-developer]**
- [x] Add CSS for panel, inputs, labels, toggle **[Agent: frontend-developer]**
- [x] Add responsive styles for config panel **[Agent: frontend-developer]**

**Runnable checkpoint:** User sees config panel with inputs (not functional yet).

---

## Slice 3: State Management & Config Functionality

Make the configuration panel functional.

- [x] Add JavaScript state object with championship config defaults **[Agent: frontend-developer]**
- [x] Implement `updateConfig()` action to modify state **[Agent: frontend-developer]**
- [x] Implement `renderConfig()` to sync UI with state **[Agent: frontend-developer]**
- [x] Add event listeners for all config inputs **[Agent: frontend-developer]**
- [x] Implement scoring table parsing (comma-separated to array) **[Agent: frontend-developer]**
- [x] Implement FL toggle show/hide bonus input **[Agent: frontend-developer]**

**Runnable checkpoint:** User can change config values and see them persist (in memory).

---

## Slice 4: Empty Results Grid

Display a grid table structure (no data yet).

- [x] Add grid panel HTML with table structure **[Agent: frontend-developer]**
- [x] Add CSS for table, headers, cells **[Agent: frontend-developer]**
- [x] Implement `renderGrid()` to generate header row from config (R1, R2, etc.) **[Agent: frontend-developer]**
- [x] Grid columns update when "Total Rounds" changes **[Agent: frontend-developer]**

**Runnable checkpoint:** User sees empty grid with race columns matching config.

---

## Slice 5: Add/Remove Competitors

Allow adding drivers to the grid.

- [x] Add "Add Driver" button and modal HTML **[Agent: frontend-developer]**
- [x] Add CSS for modal and buttons **[Agent: frontend-developer]**
- [x] Implement `addCompetitor()` action with validation (name required, unique) **[Agent: frontend-developer]**
- [x] Implement `removeCompetitor()` action with confirmation prompt **[Agent: frontend-developer]**
- [x] Update `renderGrid()` to display competitor rows **[Agent: frontend-developer]**
- [x] Add delete button (X) to each row (visible on hover) **[Agent: frontend-developer]**
- [x] Initialize with 2 default drivers on page load **[Agent: frontend-developer]**

**Runnable checkpoint:** User can add/remove drivers, see them in grid.

---

## Slice 6: Enter Race Results

Enable entering positions in cells.

- [x] Make result cells clickable with `startEditCell()` **[Agent: frontend-developer]**
- [x] Implement inline input for editing position **[Agent: frontend-developer]**
- [x] Implement `setResult()` action to save position to state **[Agent: frontend-developer]**
- [x] Implement `finishEditCell()` on blur/Enter **[Agent: frontend-developer]**
- [x] Add keyboard navigation (Tab to next cell, Escape to cancel) **[Agent: frontend-developer]**
- [x] Style completed vs future race columns differently (striped background for future) **[Agent: frontend-developer]**

**Runnable checkpoint:** User can click cells, enter positions, navigate with keyboard.

---

## Slice 7: Points Calculation & Standings

Calculate and display points and rankings.

- [x] Implement `calculateRacePoints(position, hasFastestLap)` function **[Agent: frontend-developer]**
- [x] Implement `calculateTotalPoints(results)` with drop rounds logic **[Agent: frontend-developer]**
  - Sort race points descending
  - Take best N (where N = countBest)
  - Sum the best results
- [x] Implement `calculateStandings()` to sort all competitors **[Agent: frontend-developer]**
- [x] Implement tiebreaker logic (most wins, then most P2s, etc.) **[Agent: frontend-developer]**
- [x] Add Total and Rank columns to grid **[Agent: frontend-developer]**
- [x] Update `renderGrid()` to show totals and ranks for each driver **[Agent: frontend-developer]**

**Runnable checkpoint:** User sees points and rankings update as they enter results.

---

## Slice 8: Fastest Lap Feature

Add FL checkbox column when enabled.

- [x] Add FL column to grid header when FL is enabled **[Agent: frontend-developer]**
- [x] Add FL checkbox in each row for each race **[Agent: frontend-developer]**
- [x] Implement `setFastestLap()` with single-driver-per-race enforcement **[Agent: frontend-developer]**
- [x] Update `calculateRacePoints()` to include FL bonus when applicable **[Agent: frontend-developer]**
- [x] Grid re-renders when FL toggle changes (columns appear/disappear) **[Agent: frontend-developer]**

**Runnable checkpoint:** User can toggle FL, check boxes, see bonus points applied.

---

## Slice 9: "My Driver" Selection

Allow marking one driver for status tracking.

- [x] Add star icon (☆/★) to each driver row **[Agent: frontend-developer]**
- [x] Implement `setMyDriver()` action (single selection only) **[Agent: frontend-developer]**
- [x] Highlight "my driver" row with accent background color **[Agent: frontend-developer]**
- [x] First driver added is automatically marked as "my driver" **[Agent: frontend-developer]**
- [x] Reassign "my driver" to another driver if marked driver is removed **[Agent: frontend-developer]**

**Runnable checkpoint:** User can click star to mark driver, see row highlighted.

---

## Slice 10: Status Panel — Target Position Selection

Show status panel and allow selecting target position.

- [x] Add status panel HTML structure **[Agent: frontend-developer]**
- [x] Add CSS for status card, badges, messages **[Agent: frontend-developer]**
- [x] Add target position dropdown/input (default: 1st place) **[Agent: frontend-developer]**
- [x] Update state to track `targetPosition` **[Agent: frontend-developer]**
- [x] Show "my driver" name, current points, and current rank **[Agent: frontend-developer]**

**Runnable checkpoint:** User sees status panel with target position selector.

---

## Slice 11: Position Status Calculation

Calculate chances for any target position.

- [x] Implement `calculateMaxPossiblePoints(competitor)` for projections **[Agent: frontend-developer]**
- [x] Implement `calculatePositionStatus(myDriver, targetPosition)` **[Agent: frontend-developer]**
  - Determine if target position is guaranteed, achievable, or impossible
  - Calculate points buffer to position below
  - Identify competitors competing for same position
- [x] Implement status determination logic:
  - GUARANTEED: cannot drop below target
  - ON_TRACK: currently at/above target but can drop
  - ACHIEVABLE: can still reach target
  - NOT_POSSIBLE: cannot reach target even with max points
- [x] Implement `renderStatus()` to display calculated status **[Agent: frontend-developer]**

**Runnable checkpoint:** User sees status for their selected target position.

---

## Slice 12: Status Messages & Rival Analysis

Show detailed status messages and rival analysis.

- [x] Display appropriate status message with context-aware text **[Agent: frontend-developer]**
  - "P3 GUARANTEED! +12 points buffer over P4"
  - "Currently P7. 15 points behind P5 cutoff."
- [x] Apply color coding (green=guaranteed, yellow=on track, red=not possible) **[Agent: frontend-developer]**
- [x] Implement threat/competition analysis for target position **[Agent: frontend-developer]**
- [x] Display rivals competing for same position with their points and max possible **[Agent: frontend-developer]**

**Runnable checkpoint:** User sees position status with rival analysis.

---

## Slice 13: "What's Needed" Calculator

Calculate and display specific race results needed to achieve target position.

- [x] Implement `calculateRequiredResults(myDriver, targetPosition, remainingRaces)` **[Agent: frontend-developer]**
  - Determine points needed to beat driver at position target+1
  - Calculate which race finishing positions produce those points
  - Account for drop rounds in calculations
- [x] Implement scenario generation (find valid result combinations) **[Agent: frontend-developer]**
  - Generate combinations like "P1+P2", "P2+P2", "P1+P3"
  - Filter to show only scenarios that achieve target
  - Sort by "easiest" (highest position numbers that still work)
- [x] Display "What's Needed" section with clear instructions **[Agent: frontend-developer]**
  - "To guarantee P3: finish **P2 + P4** in remaining races"
  - "Minimum to stay in contention: **P5 or better** in next race"
- [x] Show scenario table with result combinations and outcomes **[Agent: frontend-developer]**
  - Columns: Your Results | Your Points | Rival Max | Status
  - Color code: green=SAFE, yellow=RISK, red=FAIL
- [x] Update calculations when user enters simulated results **[Agent: frontend-developer]**
- [x] Handle edge cases: already guaranteed, already impossible, single race remaining **[Agent: frontend-developer]**

**Runnable checkpoint:** User sees exactly what race positions they need to achieve their target.

---

## Slice 14: Responsive Design & Polish

Ensure mobile compatibility and visual polish.

- [x] Add responsive CSS for tablet (768-1024px) **[Agent: frontend-developer]**
- [x] Add responsive CSS for mobile (<768px) **[Agent: frontend-developer]**
- [x] Add horizontal scroll wrapper for grid on mobile **[Agent: frontend-developer]**
- [x] Add hover states and transitions for interactive elements **[Agent: frontend-developer]**
- [x] Add tooltips showing points on result cells **[Agent: frontend-developer]**
- [x] Test in Chrome, Firefox, Safari (desktop and mobile) **[Agent: frontend-developer]**

**Runnable checkpoint:** Application works well on mobile and desktop.

---

## Slice 15: Final Testing & Edge Cases

Verify all functionality and edge cases.

- [x] Test: scoring table with various formats (F1, custom, single value) **[Agent: test-writer-fixer]**
- [x] Test: drop rounds calculation correctness (best 4 of 5, best 8 of 10, etc.) **[Agent: test-writer-fixer]**
- [x] Test: tiebreaker scenarios (equal points, different wins) **[Agent: test-writer-fixer]**
- [x] Test: target position calculations (1st, 3rd, 5th, last) **[Agent: test-writer-fixer]**
- [x] Test: "What's Needed" calculator accuracy **[Agent: test-writer-fixer]**
- [x] Test: scenario table shows correct combinations **[Agent: test-writer-fixer]**
- [x] Test: 20+ drivers performance **[Agent: test-writer-fixer]**
- [x] Test: all DNF race (all drivers get 0 points) **[Agent: test-writer-fixer]**
- [x] Test: position status transitions as results change **[Agent: test-writer-fixer]**
- [x] Fix any discovered bugs **[Agent: frontend-developer]**

**Runnable checkpoint:** MVP complete, all features working correctly.

---

## Summary

| Slice | Feature | Dependencies |
|-------|---------|--------------|
| 1 | HTML Shell & Styling | None |
| 2 | Config Panel UI | Slice 1 |
| 3 | Config Functionality | Slice 2 |
| 4 | Empty Grid | Slice 3 |
| 5 | Add/Remove Drivers | Slice 4 |
| 6 | Enter Results | Slice 5 |
| 7 | Points & Standings | Slice 6 |
| 8 | Fastest Lap | Slice 7 |
| 9 | My Driver Selection | Slice 7 |
| 10 | Status Panel + Target Position | Slice 9 |
| 11 | Position Status Calculation | Slice 10 |
| 12 | Status Messages & Rivals | Slice 11 |
| 13 | **"What's Needed" Calculator** | Slice 12 |
| 14 | Responsive & Polish | Slice 13 |
| 15 | Testing | Slice 14 |

**Total estimated tasks:** 70+ sub-tasks across 15 vertical slices
