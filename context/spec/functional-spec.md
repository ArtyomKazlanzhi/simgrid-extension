# RaceStand — Functional Specification

- **Version:** 0.1 (MVP)
- **Status:** Completed
- **Last Updated:** 2026-02-03

---

## 1. Overview

RaceStand is a web-based championship calculator for racers. Users configure a championship format, enter competitor results, and simulate future race outcomes to determine championship title chances.

---

## 2. User Interface Structure

The application consists of a single-page interface with these sections:

```
+------------------------------------------+
|  HEADER: RaceStand logo + Championship   |
|          name input                      |
+------------------------------------------+
|  CONFIG PANEL                            |
|  - Scoring table input                   |
|  - Total rounds / Drop rounds            |
|  - Fastest lap toggle                    |
+------------------------------------------+
|  RESULTS GRID                            |
|  - Competitors (rows) x Races (columns)  |
|  - Completed races | Future races        |
|  - Standings column                      |
+------------------------------------------+
|  STATUS PANEL                            |
|  - "My driver" championship status       |
|  - Point gaps to competitors             |
|  - What's needed to win                  |
+------------------------------------------+
```

---

## 3. Feature Specifications

### 3.1 Championship Configuration

#### 3.1.1 Scoring Table

**Input:** Comma-separated list of points values.

**Behavior:**
- User enters points as: `30,27,24,21,18,16,14,13,12,11,10,9,8,7,6,5,4,3,2,1`
- Position is implied by order (first value = P1, second = P2, etc.)
- Positions beyond the list receive 0 points
- Whitespace around values is trimmed
- Non-numeric values show validation error

**Default:** F1 scoring `25,18,15,12,10,8,6,4,2,1`

**Validation:**
- At least 1 value required
- All values must be non-negative integers
- Values should be in descending order (warning if not, but allowed)

#### 3.1.2 Total Rounds

**Input:** Number input field.

**Behavior:**
- User specifies total number of races in championship
- Minimum: 1, Maximum: 50
- Grid columns adjust to match

**Default:** 5 rounds

#### 3.1.3 Drop Rounds

**Input:** Number input field labeled "Count best X of Y results"

**Behavior:**
- User specifies how many races count toward final standings
- If set to 4 with 5 total rounds = "best 4 of 5"
- If equal to total rounds = no drop rounds (all count)
- Lowest-scoring races are automatically dropped from calculation

**Default:** Equal to total rounds (no drops)

**Validation:**
- Must be >= 1
- Must be <= total rounds

#### 3.1.4 Fastest Lap Bonus

**Input:** Toggle switch + number input.

**Behavior:**
- When enabled, shows input for bonus points value
- Each race can have ONE fastest lap awarded
- Fastest lap column appears in grid per race
- Bonus added to that race's points for the driver

**Default:** Disabled, 1 point when enabled

---

### 3.2 Competitor Management

#### 3.2.1 Adding Competitors

**Input:** "Add Driver" button + name input.

**Behavior:**
- Click "Add Driver" to add a new row
- Enter driver name (required, must be unique)
- New row appears at bottom of grid
- Minimum 2 competitors required for calculations

**Validation:**
- Name cannot be empty
- Name must be unique (case-insensitive)

#### 3.2.2 Removing Competitors

**Input:** Delete button (X) on each row.

**Behavior:**
- Click X to remove driver and all their results
- Confirmation prompt: "Remove [Name] and all their results?"
- Cannot remove if only 2 drivers remain

#### 3.2.3 Marking "My Driver"

**Input:** Star/highlight button on each row.

**Behavior:**
- Click to mark a driver as "my driver"
- Only one driver can be marked at a time
- Marked driver's row is visually highlighted
- Status panel shows championship status for this driver

**Default:** First driver added is marked

---

### 3.3 Results Grid

#### 3.3.1 Grid Structure

```
| Driver    | R1 | FL | R2 | FL | R3 | FL | R4 | R5 | Total | Rank |
|-----------|----|----|----|----|----|----|----|----|-------|------|
| *Kazlanzhy| 1  | +  | 1  | +  | _  | _  | _  | _  | 62    | 1    |
| Slashchov | 2  |    | 3  |    | _  | _  | _  | _  | 51    | 2    |
| Pynda     | 4  |    | 2  |    | _  | _  | _  | _  | 48    | 3    |
```

- **Rows:** One per competitor
- **Columns:** One per race + optional FL column + Total + Rank
- **Completed races:** Normal background, editable
- **Future races:** Different background color, editable (for simulation)
- **FL columns:** Checkbox or toggle (only one driver per race can have it)

#### 3.3.2 Entering Results

**Input:** Click cell, type position number.

**Behavior:**
- User enters finishing position (1, 2, 3, etc.)
- Points calculated automatically from scoring table
- Cell displays position, tooltip shows points
- Empty cell = 0 points (DNF/DNS)
- Tab/Enter moves to next cell

**Validation:**
- Must be positive integer or empty
- Position cannot exceed number of competitors (warning)
- Same position cannot be entered twice in same race (warning)

#### 3.3.3 Fastest Lap Entry

**Input:** Checkbox in FL column.

**Behavior:**
- Only one driver per race can have fastest lap
- Checking one automatically unchecks others in same race
- Adds bonus points to that driver's race total

#### 3.3.4 Distinguishing Completed vs Future Races

**Behavior:**
- Races are considered "completed" if ANY driver has a result entered
- Completed race columns: solid background
- Future race columns: striped/dashed background, labeled "Simulation"
- User can edit both, but future races are clearly marked as hypothetical

---

### 3.4 Standings Calculation

#### 3.4.1 Points Calculation

**Formula per race:**
```
race_points = scoring_table[position - 1] + (has_fastest_lap ? fl_bonus : 0)
```

**Formula for total (with drops):**
```
total_points = sum(top N race_points)
where N = "count best" value
```

#### 3.4.2 Tiebreaker Rules

When two drivers have equal points:
1. Most wins (P1 finishes)
2. Most P2 finishes
3. Most P3 finishes
4. (Continue down positions)
5. If still tied: alphabetical by name

#### 3.4.3 Rank Display

- Show current championship position (1st, 2nd, 3rd...)
- Tied drivers show same rank with "T" (e.g., "T2")
- Update instantly when any result changes

---

### 3.5 Scenario Simulator

#### 3.5.1 Simulation Mode

**Behavior:**
- User enters hypothetical positions in future race columns
- Standings recalculate instantly
- Status panel updates to show "my driver" position chances

#### 3.5.2 Target Position Selection

**Input:** Dropdown or number input in status panel.

**Behavior:**
- User selects which championship position they're targeting (1st, 2nd, 3rd, 5th, etc.)
- Default: 1st place (title)
- Status calculations adapt to show chances for the selected position
- Can target any position from 1st to the number of competitors

**Examples:**
- Target 1st: "Can I win the championship?"
- Target 3rd: "Can I finish on the podium?"
- Target 5th: "Can I finish in the top 5?"

#### 3.5.3 Championship Status Messages

For the marked "my driver" and selected target position, display one of:

| Status | Condition | Message |
|--------|-----------|---------|
| Guaranteed | My driver cannot drop below target | "P[X] GUARANTEED! +Y points buffer over P[X+1]" |
| Secured | Position secured with current scenario | "P[X] secured with this result" |
| On track | Currently at or above target, but can drop | "Currently P[Y]. Z points ahead of P[X+1] cutoff." |
| Achievable | Can still reach target position | "X points behind P[target]. Position still achievable." |
| Not possible | Cannot reach target even with perfect results | "Cannot achieve P[X]. Best possible: P[Y]." |

**Examples:**
- Targeting 1st: "TITLE GUARANTEED! +8 points ahead of Slashchov"
- Targeting 3rd: "P3 GUARANTEED! +12 points buffer over P4"
- Targeting 5th: "Currently P7. 15 points behind P5 cutoff. Position still achievable."

#### 3.5.4 "What's Needed" Calculator

**Purpose:** Show the user exactly which race finishing positions they need in upcoming races to achieve their target championship position.

**Behavior:**
- Calculate minimum required results to guarantee target position
- Show multiple scenarios if applicable (e.g., "P1+P3" or "P2+P2")
- Update dynamically as user enters simulated results
- Account for drop rounds in calculations

**Display Examples:**

For target P1 (title):
- "To guarantee the title, you need: **P1 + P2** in remaining races (in any order)"
- "Minimum to stay in contention: **P3 or better** in next race"

For target P3 (podium):
- "To guarantee P3, you need: **P4 + P5** in remaining 2 races"
- "Safe scenario: finish **P3 in R4**, then any result in R5"

For target P5:
- "P5 is already guaranteed! You can finish **P8 or better** in remaining races"
- "Warning: finishing **P10 or worse** in both races risks dropping to P6"

**Calculation Logic:**
1. Determine points needed to secure target position (beat the driver at position target+1)
2. Calculate what race results produce those points
3. Consider best/worst case scenarios for rivals
4. Present as simple "finish P[X] in R[Y]" instructions

**Scenario Table (optional advanced view):**
| Your Results | Your Final Pts | Rival Max Pts | Status |
|--------------|----------------|---------------|--------|
| P1 + P1      | 112            | 98            | SAFE   |
| P1 + P2      | 107            | 98            | SAFE   |
| P2 + P2      | 102            | 98            | SAFE   |
| P2 + P3      | 99             | 98            | RISK   |

#### 3.5.5 Position Threat/Competition Analysis

For the target position, show:
- Drivers currently competing for that position (above and below)
- Their maximum possible points
- Gap between "my driver" and the position cutoff
- Who could push "my driver" out of the target position

---

### 3.6 Visual Design

#### 3.6.1 Color Scheme

- **Background:** Dark (#0a0e17 to #111827 gradient)
- **Text:** Light gray (#e2e8f0)
- **Accent:** Gold/yellow (#eab308) for highlights
- **Success:** Green (#22c55e) for guaranteed/safe
- **Danger:** Red (#ef4444) for at risk/eliminated
- **Muted:** Slate gray (#64748b) for secondary text

#### 3.6.2 Typography

- **Primary font:** Monospace (JetBrains Mono or system)
- **Headers:** Space Grotesk or system sans-serif
- **Grid cells:** Monospace for alignment

#### 3.6.3 Responsive Behavior

- **Desktop (>1024px):** Full grid visible, side-by-side panels
- **Tablet (768-1024px):** Scrollable grid, stacked panels
- **Mobile (<768px):** Horizontal scroll on grid, collapsed config panel

---

## 4. User Flows

### 4.1 New Championship Setup

1. User opens RaceStand
2. Enters championship name (optional)
3. Configures scoring table (or keeps default)
4. Sets total rounds and drop rounds
5. Enables fastest lap if needed
6. Adds competitors (minimum 2)
7. Marks "my driver"

### 4.2 Entering Race Results

1. User clicks cell for [Driver] x [Race]
2. Types finishing position (e.g., "1" for P1)
3. Optionally checks fastest lap for one driver
4. Standings update instantly
5. Repeats for all drivers in that race

### 4.3 Simulating Future Races

1. User clicks cell in future race column
2. Enters hypothetical position
3. Status panel updates with new championship chances
4. User adjusts positions to test different scenarios
5. Clear future results to reset simulation

---

## 5. Edge Cases

| Scenario | Behavior |
|----------|----------|
| All drivers DNF a race | All get 0 points for that race |
| More positions than scoring table | Positions beyond table get 0 points |
| Tie in final standings | Show as tied, use tiebreaker for "official" rank |
| Only 1 race remaining | Drop round has no effect |
| All races completed | No simulation possible, show final standings |
| User marks driver who can't win | Show "Eliminated" status clearly |

---

## 6. Acceptance Criteria

### Must Have (MVP)
- [x] User can configure custom scoring table via comma-separated input
- [x] User can set total rounds and drop rounds
- [x] User can enable/disable fastest lap bonus
- [x] User can add/remove competitors
- [x] User can mark one driver as "my driver"
- [x] User can enter finishing positions in spreadsheet grid
- [x] Points calculate correctly including drops and FL bonus
- [x] Standings update in real-time
- [x] User can enter hypothetical results in future races
- [x] Status panel shows championship status for "my driver"
- [x] User can select target position (1st, 3rd, 5th, etc.)
- [x] Status shows chances for selected position, not just winning
- [x] "What's Needed" shows specific race positions required to achieve target
- [x] Scenario table shows result combinations and their outcomes
- [x] Works on desktop and mobile browsers
- [x] Dark theme with racing aesthetic

### Should Have (v1.0)
- [x] Local storage persistence (with multi-tournament support)
- [ ] Preset scoring systems
- [x] Improved mobile UX

### Could Have (v1.1)
- [ ] Shareable URLs
- [ ] Export/import functionality
- [ ] Social sharing buttons

---

## 7. Out of Scope

- User accounts or authentication
- Cloud storage or sync
- Multiple championships
- Team/constructor standings
- Live data integration
- Offline PWA support
- Undo/redo functionality
