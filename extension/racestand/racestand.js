// ==========================================
// STATE MANAGEMENT
// ==========================================

const state = {
    championship: {
        name: '',
        scoring: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
        totalRounds: 5,
        countBest: 5,
        flEnabled: false,
        flBonus: 1,
        targetPosition: 1
    },
    competitors: [],
    ui: {
        editingCell: null,
        editingDriverId: null,
        scenarioTableExpanded: false,
        configCollapsed: false
    }
};

// Generate unique ID
function generateId() {
    return 'comp_' + Math.random().toString(36).substr(2, 9);
}

// ==========================================
// LOCAL STORAGE
// ==========================================

const STORAGE_PREFIX = 'racestand_';
const STORAGE_INDEX_KEY = 'racestand_index';

// Get list of all saved tournaments
function getSavedTournaments() {
    try {
        const raw = localStorage.getItem(STORAGE_INDEX_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

// Update the saved tournaments index
function updateTournamentIndex(name, action = 'add') {
    let tournaments = getSavedTournaments();
    if (action === 'add') {
        // Add or update tournament entry
        const existing = tournaments.findIndex(t => t.name === name);
        const entry = { name, savedAt: new Date().toISOString() };
        if (existing >= 0) {
            tournaments[existing] = entry;
        } else {
            tournaments.push(entry);
        }
    } else if (action === 'remove') {
        tournaments = tournaments.filter(t => t.name !== name);
    }
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(tournaments));
    renderTournamentSelector();
}

// Save state to localStorage with tournament name
function saveToStorage() {
    const nameInput = document.getElementById('championship-name');
    const name = (nameInput.value || '').trim();

    if (!name) {
        alert('Please enter a tournament name to save.');
        nameInput.focus();
        return { error: 'Name required' };
    }

    try {
        const data = {
            version: '1.0',
            savedAt: new Date().toISOString(),
            name: name,
            championship: state.championship,
            competitors: state.competitors
        };
        const key = STORAGE_PREFIX + name;
        localStorage.setItem(key, JSON.stringify(data));
        updateTournamentIndex(name, 'add');
        state.championship.name = name;
        showSaveIndicator();
        return { success: true };
    } catch (e) {
        console.error('Failed to save:', e);
        return { error: 'Failed to save data' };
    }
}

// Load state from localStorage by name
function loadFromStorage(name = null) {
    try {
        // If no name provided, try to load the most recent
        if (!name) {
            const tournaments = getSavedTournaments();
            if (tournaments.length === 0) return null;
            // Sort by savedAt descending and get most recent
            tournaments.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
            name = tournaments[0].name;
        }

        const key = STORAGE_PREFIX + name;
        const raw = localStorage.getItem(key);
        if (!raw) return null;

        const data = JSON.parse(raw);

        // Restore championship config
        if (data.championship) {
            Object.assign(state.championship, data.championship);
        }
        state.championship.name = name;

        // Restore competitors
        if (data.competitors && Array.isArray(data.competitors)) {
            state.competitors = data.competitors;
        }

        // Update name input
        const nameInput = document.getElementById('championship-name');
        if (nameInput) nameInput.value = name;

        return data;
    } catch (e) {
        console.error('Failed to load:', e);
        return null;
    }
}

// Load a specific tournament
function loadTournament(name) {
    if (!name) return;

    const data = loadFromStorage(name);
    if (data) {
        render();
        console.log('Loaded tournament:', name);
    }
}

// Delete a specific tournament
function deleteTournament(name) {
    if (!name) return;

    if (confirm(`Delete tournament "${name}"? This cannot be undone.`)) {
        const key = STORAGE_PREFIX + name;
        localStorage.removeItem(key);
        updateTournamentIndex(name, 'remove');

        // If we deleted the current tournament, reset
        if (state.championship.name === name) {
            resetToDefaults();
            render();
        }
    }
}

// Reset to defaults
function resetToDefaults() {
    state.championship = {
        name: '',
        scoring: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
        totalRounds: 5,
        countBest: 5,
        flEnabled: false,
        flBonus: 1,
        targetPosition: 1
    };
    state.competitors = [];
    addDefaultDrivers();
    const nameInput = document.getElementById('championship-name');
    if (nameInput) nameInput.value = '';
}

// Clear current data (reset to new tournament)
function clearStorage() {
    if (confirm('Start a new tournament? Unsaved changes will be lost.')) {
        resetToDefaults();
        render();
    }
}

// Render the tournament selector dropdown
function renderTournamentSelector() {
    const container = document.getElementById('tournament-selector');
    if (!container) return;

    const tournaments = getSavedTournaments();

    if (tournaments.length === 0) {
        container.innerHTML = '<span class="no-tournaments">No saved tournaments</span>';
        return;
    }

    // Sort by most recent first
    tournaments.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    let html = '<div class="tournament-list">';
    tournaments.forEach(t => {
        const isActive = state.championship.name === t.name;
        const date = new Date(t.savedAt).toLocaleDateString();
        html += `
            <div class="tournament-item ${isActive ? 'active' : ''}" data-tournament="${escapeHtml(t.name)}">
                <button class="tournament-load-btn" title="Load ${escapeHtml(t.name)}">
                    <span class="tournament-name">${escapeHtml(t.name)}</span>
                    <span class="tournament-date">${date}</span>
                </button>
                <button class="tournament-delete-btn" title="Delete">×</button>
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;

    // Event delegation for tournament buttons (CSP blocks inline onclick)
    container.addEventListener('click', (e) => {
        const item = e.target.closest('.tournament-item');
        if (!item) return;

        const tournamentName = item.dataset.tournament;
        if (!tournamentName) return;

        if (e.target.closest('.tournament-delete-btn')) {
            deleteTournament(tournamentName);
        } else if (e.target.closest('.tournament-load-btn')) {
            loadTournament(tournamentName);
        }
    });
}

// Show save indicator briefly
function showSaveIndicator(message = 'Saved!') {
    const btn = document.getElementById('save-btn');
    const originalText = btn.textContent;
    btn.textContent = message;
    btn.style.color = 'var(--success)';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.color = '';
    }, 1500);
}

// ==========================================
// URL IMPORT HANDLER
// ==========================================

// Check for and process URL import parameter
function checkUrlImport() {
    console.log('[RaceStand Import] checkUrlImport called');
    console.log('[RaceStand Import] LZString available:', typeof LZString !== 'undefined');
    console.log('[RaceStand Import] URL:', window.location.href);
    const params = new URLSearchParams(window.location.search);
    const importData = params.get('import');
    console.log('[RaceStand Import] importData found:', !!importData, 'length:', importData?.length);

    if (!importData) return null;

    try {
        console.log('[RaceStand Import] Attempting decompression...');
        // Decompress LZString and parse JSON
        const jsonStr = LZString.decompressFromEncodedURIComponent(importData);
        console.log('[RaceStand Import] Decompressed result:', !!jsonStr, 'length:', jsonStr?.length);
        if (!jsonStr) throw new Error('Decompression failed');

        console.log('[RaceStand Import] Decompressed JSON (first 200 chars):', jsonStr.substring(0, 200));
        const data = JSON.parse(jsonStr);
        console.log('[RaceStand Import] Parsed data:', data);

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

// Add default drivers helper
function addDefaultDrivers() {
    state.competitors.push({
        id: generateId(),
        name: 'Driver 1',
        isMyDriver: true,
        results: Array(state.championship.totalRounds).fill(null).map(() => ({
            position: null,
            fastestLap: false
        }))
    });
    state.competitors.push({
        id: generateId(),
        name: 'Driver 2',
        isMyDriver: false,
        results: Array(state.championship.totalRounds).fill(null).map(() => ({
            position: null,
            fastestLap: false
        }))
    });
}

// ==========================================
// STATE ACTIONS
// ==========================================

function updateConfig(updates) {
    Object.assign(state.championship, updates);

    // Ensure countBest <= totalRounds
    if (state.championship.countBest > state.championship.totalRounds) {
        state.championship.countBest = state.championship.totalRounds;
    }

    // Resize competitor results arrays
    state.competitors.forEach(comp => {
        while (comp.results.length < state.championship.totalRounds) {
            comp.results.push({ position: null, fastestLap: false });
        }
        comp.results.length = state.championship.totalRounds;
    });

    render();
}

// Add competitor
function addCompetitor(name) {
    const trimmedName = name.trim();

    // Validation
    if (!trimmedName) {
        return { error: 'Name cannot be empty' };
    }

    const exists = state.competitors.some(
        c => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
        return { error: 'Driver already exists' };
    }

    const competitor = {
        id: generateId(),
        name: trimmedName,
        isMyDriver: state.competitors.length === 0, // First driver is "my driver"
        results: Array(state.championship.totalRounds).fill(null).map(() => ({
            position: null,
            fastestLap: false
        }))
    };

    state.competitors.push(competitor);
    render();
    return { success: true };
}

// Remove competitor
function removeCompetitor(id) {
    if (state.competitors.length <= 2) {
        return { error: 'Minimum 2 drivers required' };
    }

    const index = state.competitors.findIndex(c => c.id === id);
    if (index === -1) {
        return { error: 'Driver not found' };
    }

    const wasMyDriver = state.competitors[index].isMyDriver;
    state.competitors.splice(index, 1);

    // Reassign "my driver" if needed
    if (wasMyDriver && state.competitors.length > 0) {
        state.competitors[0].isMyDriver = true;
    }

    render();
    return { success: true };
}

// Confirm remove with prompt
function confirmRemoveCompetitor(id) {
    const competitor = state.competitors.find(c => c.id === id);
    if (!competitor) return;

    if (confirm(`Remove ${competitor.name} and all their results?`)) {
        const result = removeCompetitor(id);
        if (result.error) {
            alert(result.error);
        }
    }
}

// Set "my driver" - only one can be selected
function setMyDriver(id) {
    state.competitors.forEach(c => {
        c.isMyDriver = c.id === id;
    });
    render();
}

// Start editing driver name
function startEditDriverName(id) {
    const competitor = state.competitors.find(c => c.id === id);
    if (!competitor) return;

    state.ui.editingDriverId = id;

    // Find the name element and replace with input
    const nameEl = document.querySelector(`tr[data-id="${id}"] .driver-name`);
    if (!nameEl) return;

    const currentName = competitor.name;
    nameEl.outerHTML = `
        <input type="text"
               class="driver-name-input"
               id="editing-driver-name"
               value="${escapeHtml(currentName)}"
               data-original="${escapeHtml(currentName)}">
    `;

    const input = document.getElementById('editing-driver-name');
    input.focus();
    input.select();

    // Handle blur and keydown
    input.addEventListener('blur', finishEditDriverName);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            finishEditDriverName();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditDriverName();
        }
    });
}

// Finish editing driver name
function finishEditDriverName() {
    const input = document.getElementById('editing-driver-name');
    if (!input || !state.ui.editingDriverId) return;

    const newName = input.value.trim();
    const originalName = input.dataset.original;
    const id = state.ui.editingDriverId;

    state.ui.editingDriverId = null;

    if (!newName) {
        // Empty name, revert
        render();
        return;
    }

    if (newName === originalName) {
        // No change
        render();
        return;
    }

    // Check for duplicate name
    const exists = state.competitors.some(
        c => c.id !== id && c.name.toLowerCase() === newName.toLowerCase()
    );
    if (exists) {
        alert('Driver name already exists');
        render();
        return;
    }

    // Update the name
    const competitor = state.competitors.find(c => c.id === id);
    if (competitor) {
        competitor.name = newName;
    }

    render();
}

// Cancel editing driver name
function cancelEditDriverName() {
    state.ui.editingDriverId = null;
    render();
}

// Set race result
function setResult(competitorId, raceIndex, position) {
    const competitor = state.competitors.find(c => c.id === competitorId);
    if (!competitor) return { error: 'Competitor not found' };

    // Parse and validate
    const pos = position === '' || position === null ? null : parseInt(position, 10);

    if (pos !== null && (isNaN(pos) || pos < 1)) {
        return { error: 'Invalid position' };
    }

    competitor.results[raceIndex].position = pos;
    render();
    return { success: true };
}

// Set fastest lap for a driver in a race
function setFastestLap(competitorId, raceIndex, hasFl) {
    // Only one driver per race can have fastest lap
    if (hasFl) {
        state.competitors.forEach(c => {
            if (c.results[raceIndex]) {
                c.results[raceIndex].fastestLap = false;
            }
        });
    }

    const competitor = state.competitors.find(c => c.id === competitorId);
    if (competitor && competitor.results[raceIndex]) {
        competitor.results[raceIndex].fastestLap = hasFl;
    }

    render();
}

// ==========================================
// POINTS CALCULATION FUNCTIONS
// ==========================================

// Calculate points for a single race
function calculateRacePoints(position, hasFastestLap) {
    if (position === null || position === undefined) return 0;

    const { scoring, flEnabled, flBonus } = state.championship;
    const positionPoints = scoring[position - 1] || 0;
    const flPoints = (flEnabled && hasFastestLap) ? flBonus : 0;

    return positionPoints + flPoints;
}

// Calculate total points with drop rounds
function calculateTotalPoints(results) {
    const { countBest } = state.championship;

    const racePoints = results.map(r =>
        calculateRacePoints(r.position, r.fastestLap)
    );

    // Sort descending and take best N
    const sorted = [...racePoints].sort((a, b) => b - a);
    const best = sorted.slice(0, countBest);

    return best.reduce((sum, pts) => sum + pts, 0);
}

// Calculate maximum possible points for a competitor
function calculateMaxPossiblePoints(competitor) {
    const { scoring, totalRounds, countBest, flEnabled, flBonus } = state.championship;
    const maxRacePoints = (scoring[0] || 0) + (flEnabled ? flBonus : 0);

    // Get current race points
    const currentRacePoints = competitor.results.map(r =>
        calculateRacePoints(r.position, r.fastestLap)
    );

    // Count remaining races (no result entered)
    const remainingRaces = competitor.results.filter(r => r.position === null).length;

    // For remaining races, assume maximum points
    const allPoints = [...currentRacePoints];
    for (let i = 0; i < allPoints.length; i++) {
        if (competitor.results[i].position === null) {
            allPoints[i] = maxRacePoints;
        }
    }

    // Calculate max with drops (best N)
    const sorted = [...allPoints].sort((a, b) => b - a);
    return sorted.slice(0, countBest).reduce((sum, p) => sum + p, 0);
}

// Calculate minimum possible points for a competitor (worst case scenario)
function calculateMinPossiblePoints(competitor) {
    const { countBest } = state.championship;

    // Get current race points (remaining races = 0 points)
    const currentRacePoints = competitor.results.map(r =>
        calculateRacePoints(r.position, r.fastestLap)
    );

    // Calculate with drops (best N, remaining races count as 0)
    const sorted = [...currentRacePoints].sort((a, b) => b - a);
    return sorted.slice(0, countBest).reduce((sum, p) => sum + p, 0);
}

// Generate breakdown text showing how a competitor reaches their max points
function generateMaxPointsBreakdown(competitor) {
    const { scoring, countBest, flEnabled, flBonus } = state.championship;
    const maxRacePoints = (scoring[0] || 0) + (flEnabled ? flBonus : 0);

    // Build race details with best-case for remaining races
    const raceDetails = competitor.results.map((r, idx) => {
        if (r.position === null) {
            // Remaining race - assume P1 + FL
            return {
                raceNum: idx + 1,
                position: 1,
                fastestLap: flEnabled,
                points: maxRacePoints,
                isRemaining: true
            };
        }
        return {
            raceNum: idx + 1,
            position: r.position,
            fastestLap: r.fastestLap,
            points: calculateRacePoints(r.position, r.fastestLap),
            isRemaining: false
        };
    });

    // Determine which races get dropped
    const allPoints = raceDetails.map(r => r.points);
    const sortedWithIdx = allPoints.map((p, i) => ({ points: p, idx: i }))
        .sort((a, b) => b.points - a.points);
    const droppedIndices = new Set(sortedWithIdx.slice(countBest).map(x => x.idx));

    // Build breakdown text
    const parts = raceDetails.map((r, idx) => {
        let text = `R${r.raceNum}:`;
        if (r.position) {
            text += `P${r.position}`;
            if (r.fastestLap) text += '+FL';
        } else {
            text += 'DNS';
        }

        if (droppedIndices.has(idx)) {
            text = `(${text})`; // Parentheses for dropped
        }

        return text;
    });

    return parts.join(' ');
}

// Count position finishes (for tiebreaker)
function countPositionFinishes(results, position) {
    return results.filter(r => r.position === position).length;
}

// Calculate standings for all competitors
function calculateStandings() {
    const standings = state.competitors.map(comp => {
        const totalPoints = calculateTotalPoints(comp.results);
        const wins = countPositionFinishes(comp.results, 1);

        return {
            competitorId: comp.id,
            name: comp.name,
            isMyDriver: comp.isMyDriver,
            totalPoints,
            wins,
            results: comp.results
        };
    });

    // Sort by points, then tiebreakers
    standings.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
        }

        // Tiebreaker: count finishes from P1 down
        for (let pos = 1; pos <= 20; pos++) {
            const aCount = countPositionFinishes(a.results, pos);
            const bCount = countPositionFinishes(b.results, pos);
            if (bCount !== aCount) return bCount - aCount;
        }

        // Final tiebreaker: alphabetical
        return a.name.localeCompare(b.name);
    });

    // Assign ranks (handling ties)
    let currentRank = 1;
    standings.forEach((standing, index) => {
        if (index > 0) {
            const prev = standings[index - 1];
            // Check if truly tied (same points AND same tiebreaker results)
            let isTied = standing.totalPoints === prev.totalPoints;
            if (isTied) {
                for (let pos = 1; pos <= 20; pos++) {
                    const aCount = countPositionFinishes(standing.results, pos);
                    const bCount = countPositionFinishes(prev.results, pos);
                    if (aCount !== bCount) {
                        isTied = false;
                        break;
                    }
                }
            }
            if (!isTied) {
                currentRank = index + 1;
            }
            standing.isTied = isTied;
        } else {
            standing.isTied = false;
        }
        standing.rank = currentRank;
    });

    return standings;
}

// ==========================================
// POSITION STATUS CALCULATION
// ==========================================

// Calculate championship status for a target position
function calculatePositionStatus(myDriver, targetPosition) {
    if (!myDriver || state.competitors.length < 2) {
        return {
            status: 'NONE',
            message: 'Add competitors to begin',
            details: '',
            threats: [],
            rivals: []
        };
    }

    const standings = calculateStandings();
    const myStanding = standings.find(s => s.competitorId === myDriver.id);
    const myCurrentRank = myStanding.rank;
    const myCurrentPoints = myStanding.totalPoints;
    const myMaxPoints = calculateMaxPossiblePoints(myDriver);
    const myMinPoints = calculateMinPossiblePoints(myDriver);

    // Get the driver currently at the target position
    const targetDriver = standings.find(s => s.rank === targetPosition);

    // Get the driver at position below target (who we need to stay ahead of)
    const belowTargetDrivers = standings.filter(s => s.rank === targetPosition + 1);
    const belowTargetDriver = belowTargetDrivers.length > 0 ? belowTargetDrivers[0] : null;

    // Calculate data for all rivals (excluding my driver)
    const allRivals = state.competitors
        .filter(c => c.id !== myDriver.id)
        .map(rival => {
            const rivalStanding = standings.find(s => s.competitorId === rival.id);
            const rivalMaxPoints = calculateMaxPossiblePoints(rival);
            const rivalMinPoints = calculateMinPossiblePoints(rival);
            const maxBreakdown = generateMaxPointsBreakdown(rival);

            // Determine if this rival is a threat or safe
            // Threat: rival can potentially beat my minimum points
            // Safe: rival's maximum points can't reach my minimum
            const isThreat = rivalMaxPoints >= myMinPoints;
            const canOvertake = rivalMaxPoints > myCurrentPoints;
            const canBeCaught = rivalMinPoints < myMaxPoints;

            return {
                id: rival.id,
                name: rival.name,
                currentPoints: rivalStanding.totalPoints,
                currentRank: rivalStanding.rank,
                maxPoints: rivalMaxPoints,
                minPoints: rivalMinPoints,
                maxBreakdown: maxBreakdown,
                isThreat: isThreat,
                canOvertake: canOvertake,
                canBeCaught: canBeCaught
            };
        })
        .sort((a, b) => a.currentRank - b.currentRank);

    // Get rivals competing for the target position
    // These are drivers who are within range of the target position
    const rivalsForPosition = allRivals.filter(rival => {
        // Include rivals who are near the target position
        // Either currently at/above target and could drop, or below and could rise
        const positionRange = Math.abs(rival.currentRank - targetPosition);

        // Include if:
        // 1. They're currently at or near target position (within 2 positions)
        // 2. OR they could potentially reach target position (their max >= target driver's current)
        // 3. OR they're currently at target and could lose it
        const nearTarget = positionRange <= 2;
        const couldReachTarget = targetDriver && rival.maxPoints >= targetDriver.totalPoints;
        const isAtTarget = rival.currentRank === targetPosition;

        return nearTarget || couldReachTarget || isAtTarget;
    });

    // Determine status and message
    let status, message, details;

    // Count remaining races
    const remainingRaces = myDriver.results.filter(r => r.position === null).length;
    const hasRemainingRaces = remainingRaces > 0;

    if (myCurrentRank <= targetPosition) {
        // Currently at or above target position

        // Check if position is guaranteed (no one below can catch us even in worst case)
        // Also include tied rivals as threats (they can still beat us even if at same rank)
        const threatsFromBelow = allRivals.filter(t =>
            (t.currentRank > targetPosition || t.currentRank === myCurrentRank) && t.maxPoints >= myMinPoints
        );

        if (threatsFromBelow.length === 0 && !hasRemainingRaces) {
            // Position is mathematically guaranteed - no races left and no one can catch up
            status = 'GUARANTEED';
            const buffer = belowTargetDriver
                ? myMinPoints - belowTargetDriver.totalPoints
                : myMinPoints;

            if (belowTargetDriver) {
                message = `P${targetPosition} GUARANTEED! +${buffer} points buffer over P${targetPosition + 1}`;
                details = `${belowTargetDriver.name} cannot catch up.`;
            } else {
                message = `P${targetPosition} GUARANTEED!`;
                details = 'No drivers can catch up.';
            }
        } else if (threatsFromBelow.length === 0) {
            // Secured with current results but races remain
            status = 'SECURED';
            const buffer = belowTargetDriver
                ? myCurrentPoints - belowTargetDriver.totalPoints
                : myCurrentPoints;

            message = `P${targetPosition} secured with this result`;
            if (belowTargetDriver && buffer > 0) {
                details = `+${buffer} points ahead of ${belowTargetDriver.name}`;
            } else {
                details = `${remainingRaces} race${remainingRaces !== 1 ? 's' : ''} remaining`;
            }
        } else {
            // Currently on track but could be caught
            status = 'ON_TRACK';

            // Find the closest threat
            const topThreat = threatsFromBelow.sort((a, b) => b.maxPoints - a.maxPoints)[0];
            const pointsAhead = belowTargetDriver
                ? myCurrentPoints - belowTargetDriver.totalPoints
                : myCurrentPoints;

            message = `Currently P${myCurrentRank}. ${pointsAhead} points ahead of P${targetPosition + 1} cutoff.`;
            details = `${topThreat.name} could reach ${topThreat.maxPoints} pts (max)`;
        }
    } else {
        // Currently below target position
        // Check if we can reach the target
        const targetPointsNeeded = targetDriver ? targetDriver.totalPoints : 0;

        // Find the driver we need to overtake
        const driverToOvertake = standings.find(s => s.rank === targetPosition);
        const driverToOvertakeComp = driverToOvertake
            ? state.competitors.find(c => c.id === driverToOvertake.competitorId)
            : null;
        const targetDriverMinPoints = driverToOvertakeComp
            ? calculateMinPossiblePoints(driverToOvertakeComp)
            : 0;

        if (myMaxPoints > targetDriverMinPoints) {
            // Can potentially overtake
            status = 'ACHIEVABLE';
            const gap = targetPointsNeeded - myCurrentPoints;

            if (gap > 0) {
                message = `${gap} points behind P${targetPosition}. Position still achievable.`;
                if (driverToOvertake) {
                    details = `Need to overtake ${driverToOvertake.name} (${driverToOvertake.totalPoints} pts)`;
                } else {
                    details = `Can reach up to ${myMaxPoints} pts`;
                }
            } else {
                message = `P${targetPosition} is achievable`;
                details = `Can reach up to ${myMaxPoints} pts with remaining races`;
            }
        } else {
            // Cannot reach target even with perfect results
            status = 'NOT_POSSIBLE';

            // Find best possible position
            let bestPossibleRank = 1;
            for (const rival of allRivals) {
                if (rival.minPoints > myMaxPoints) {
                    bestPossibleRank++;
                }
            }

            message = `Cannot achieve P${targetPosition}. Best possible: P${bestPossibleRank}.`;
            if (driverToOvertake) {
                details = `${driverToOvertake.name}'s minimum (${targetDriverMinPoints} pts) exceeds your maximum (${myMaxPoints} pts)`;
            } else {
                details = `Maximum possible: ${myMaxPoints} pts`;
            }
        }
    }

    return {
        status,
        message,
        details,
        myCurrentRank,
        myCurrentPoints,
        myMaxPoints,
        myMinPoints,
        threats: allRivals.filter(r => r.isThreat),
        rivals: rivalsForPosition
    };
}

// ==========================================
// WHAT'S NEEDED CALCULATOR
// ==========================================

/**
 * Calculate required results for a driver to achieve target position
 * @param {Object} myDriver - The driver we're calculating for
 * @param {number} targetPosition - The target championship position
 * @returns {Object} Required results data
 */
function calculateRequiredResults(myDriver, targetPosition) {
    if (!myDriver || state.competitors.length < 2) {
        return {
            type: 'NONE',
            message: '',
            contention: '',
            scenarios: []
        };
    }

    const { scoring, countBest, flEnabled, flBonus } = state.championship;
    const standings = calculateStandings();
    const myStanding = standings.find(s => s.competitorId === myDriver.id);
    const myCurrentRank = myStanding.rank;
    const myCurrentPoints = myStanding.totalPoints;
    const myMaxPoints = calculateMaxPossiblePoints(myDriver);
    const myMinPoints = calculateMinPossiblePoints(myDriver);

    // Count remaining races
    const remainingRaceIndices = [];
    myDriver.results.forEach((r, i) => {
        if (r.position === null) {
            remainingRaceIndices.push(i);
        }
    });
    const remainingRaces = remainingRaceIndices.length;

    // Get max points per race
    const maxRacePoints = (scoring[0] || 0) + (flEnabled ? flBonus : 0);

    // Get current race points (for calculating with drop rounds)
    const currentRacePoints = myDriver.results.map(r =>
        calculateRacePoints(r.position, r.fastestLap)
    );

    // Edge case: No remaining races
    if (remainingRaces === 0) {
        return {
            type: 'COMPLETE',
            message: 'Championship complete. No more races remaining.',
            contention: '',
            scenarios: []
        };
    }

    // Find the key rival - the driver we need to beat for target position
    // If we're above target, it's the driver just below target position
    // If we're below target, it's the driver at target position
    let keyRival = null;
    let keyRivalComp = null;
    let rivalMaxPoints = 0;

    if (myCurrentRank <= targetPosition) {
        // We need to stay ahead of drivers below target position
        let rivalStanding = standings.find(s => s.rank === targetPosition + 1);

        // If no one is at targetPosition + 1 (e.g., due to ties), look for rivals at the same rank
        if (!rivalStanding) {
            const tiedRivals = standings.filter(s =>
                s.rank === myCurrentRank && s.competitorId !== myDriver.id
            );
            if (tiedRivals.length > 0) {
                rivalStanding = tiedRivals[0];
            }
        }

        if (rivalStanding) {
            keyRival = rivalStanding;
            keyRivalComp = state.competitors.find(c => c.id === rivalStanding.competitorId);
            rivalMaxPoints = keyRivalComp ? calculateMaxPossiblePoints(keyRivalComp) : 0;
        }
    } else {
        // We need to catch/beat the driver at target position
        const rivalStanding = standings.find(s => s.rank === targetPosition);
        if (rivalStanding) {
            keyRival = rivalStanding;
            keyRivalComp = state.competitors.find(c => c.id === rivalStanding.competitorId);
            rivalMaxPoints = keyRivalComp ? calculateMaxPossiblePoints(keyRivalComp) : 0;
        }
    }

    // Edge case: Position already guaranteed
    if (myCurrentRank <= targetPosition) {
        const canBeCaught = keyRival && rivalMaxPoints >= myMinPoints;
        if (!canBeCaught) {
            return {
                type: 'GUARANTEED',
                message: 'Position already secured! No specific results needed.',
                contention: '',
                scenarios: []
            };
        }
    }

    // Edge case: Position not possible
    if (myCurrentRank > targetPosition) {
        const targetRivalStanding = standings.find(s => s.rank === targetPosition);
        const targetRivalComp = targetRivalStanding
            ? state.competitors.find(c => c.id === targetRivalStanding.competitorId)
            : null;
        const targetRivalMinPoints = targetRivalComp
            ? calculateMinPossiblePoints(targetRivalComp)
            : 0;

        if (myMaxPoints <= targetRivalMinPoints) {
            // Find best possible position
            let bestPossibleRank = 1;
            const allRivals = state.competitors.filter(c => c.id !== myDriver.id);
            for (const rival of allRivals) {
                const rivalMin = calculateMinPossiblePoints(rival);
                if (rivalMin > myMaxPoints) {
                    bestPossibleRank++;
                }
            }

            return {
                type: 'NOT_POSSIBLE',
                message: `Cannot achieve P${targetPosition}. Best possible: P${bestPossibleRank}.`,
                contention: '',
                scenarios: []
            };
        }
    }

    // Generate scenarios
    const scenarios = generateScenarios(myDriver, targetPosition, remainingRaceIndices);

    // Find the best (easiest) scenario that achieves target
    const safeScenarios = scenarios.filter(s => s.status === 'SAFE');
    const riskScenarios = scenarios.filter(s => s.status === 'RISK');

    let message = '';
    let contention = '';

    if (safeScenarios.length > 0) {
        // Find the easiest safe scenario (highest position numbers = least effort)
        const easiest = safeScenarios[safeScenarios.length - 1];
        const resultsStr = easiest.resultsDisplay;

        if (remainingRaces === 1) {
            message = `To guarantee P${targetPosition}: finish <strong>${resultsStr}</strong> in the final race.`;
        } else {
            message = `To guarantee P${targetPosition}: finish <strong>${resultsStr}</strong> in remaining races (any order).`;
        }
    } else if (riskScenarios.length > 0) {
        // No guaranteed path, show what's possible
        const best = riskScenarios[0];
        const resultsStr = best.resultsDisplay;

        message = `No guaranteed path to P${targetPosition}. Best hope: <strong>${resultsStr}</strong> (depends on rival results).`;
    } else {
        // Even best results won't help
        message = `P${targetPosition} cannot be achieved with remaining races.`;
    }

    // Calculate minimum to stay in contention
    if (remainingRaces > 0 && scenarios.length > 0) {
        // Find the minimum result needed to not be mathematically eliminated
        const viableScenarios = scenarios.filter(s => s.status !== 'FAIL');
        if (viableScenarios.length > 0) {
            // Get the worst acceptable position in first remaining race
            const worstViable = viableScenarios[viableScenarios.length - 1];
            const minPosition = Math.max(...worstViable.results);

            if (remainingRaces === 1) {
                contention = `Minimum to stay in contention: <strong>P${minPosition} or better</strong> in the final race.`;
            } else {
                contention = `Minimum to stay in contention: <strong>P${minPosition} or better</strong> average in remaining races.`;
            }
        }
    }

    return {
        type: 'SCENARIOS',
        message,
        contention,
        scenarios,
        rivalMaxPoints,
        rivalName: keyRival ? keyRival.name : null
    };
}

/**
 * Generate all relevant result scenarios
 * @param {Object} myDriver - The driver we're calculating for
 * @param {number} targetPosition - Target championship position
 * @param {Array} remainingRaceIndices - Indices of remaining races
 * @returns {Array} Array of scenario objects
 */
function generateScenarios(myDriver, targetPosition, remainingRaceIndices) {
    const { scoring, countBest, flEnabled, flBonus } = state.championship;
    const standings = calculateStandings();

    // Get max positions to consider (limit to scoring positions + a few more)
    const maxPosition = Math.min(scoring.length + 3, 20);
    const remainingRaces = remainingRaceIndices.length;

    // Get current race points
    const currentRacePoints = myDriver.results.map(r =>
        calculateRacePoints(r.position, r.fastestLap)
    );

    // Find the key rival for comparison
    let keyRival = null;
    let keyRivalComp = null;
    const myStanding = standings.find(s => s.competitorId === myDriver.id);
    const myCurrentRank = myStanding.rank;

    if (myCurrentRank <= targetPosition) {
        // We need to stay ahead of driver below target
        // First, check for rivals at the position just below target
        let rivalStanding = standings.find(s => s.rank === targetPosition + 1);

        // If no one is at targetPosition + 1 (e.g., due to ties), look for rivals at the same rank
        if (!rivalStanding) {
            // Find other drivers at the same rank (tied competitors)
            const tiedRivals = standings.filter(s =>
                s.rank === myCurrentRank && s.competitorId !== myDriver.id
            );
            if (tiedRivals.length > 0) {
                rivalStanding = tiedRivals[0];
            }
        }

        if (rivalStanding) {
            keyRival = rivalStanding;
            keyRivalComp = state.competitors.find(c => c.id === rivalStanding.competitorId);
        }
    } else {
        // We need to beat driver at target
        const rivalStanding = standings.find(s => s.rank === targetPosition);
        if (rivalStanding) {
            keyRival = rivalStanding;
            keyRivalComp = state.competitors.find(c => c.id === rivalStanding.competitorId);
        }
    }

    const rivalMinPoints = keyRivalComp ? calculateMinPossiblePoints(keyRivalComp) : 0;

    // Helper to calculate rival's max points given user's positions in each scenario
    // If user takes P1, rival can only get P2 at best in that race
    function calcRivalMaxWithUserPositions(userPositions) {
        if (!keyRivalComp) return 0;

        const maxRacePoints = (scoring[0] || 0) + (flEnabled ? flBonus : 0);

        // Get rival's current race points
        const rivalRacePoints = keyRivalComp.results.map(r =>
            calculateRacePoints(r.position, r.fastestLap)
        );

        // For remaining races, calculate rival's max considering user's positions
        userPositions.forEach((userPos, i) => {
            const raceIdx = remainingRaceIndices[i];
            // Rival's best position is one behind user (or P1 if user is outside scoring)
            const rivalBestPos = userPos + 1;
            const rivalBestPoints = (scoring[rivalBestPos - 1] || 0) + (flEnabled ? flBonus : 0);
            // But rival could still get P1 if user finishes outside top positions
            rivalRacePoints[raceIdx] = userPos <= 1 ? rivalBestPoints : maxRacePoints;
        });

        // Apply drop rounds
        const sorted = [...rivalRacePoints].sort((a, b) => b - a);
        return sorted.slice(0, countBest).reduce((sum, p) => sum + p, 0);
    }

    // Helper to generate detailed breakdown of how rivals reach their max points
    // Returns info for all threatening rivals, not just one
    function calcAllRivalsMaxWithBreakdown(userPositions) {
        const rivals = state.competitors.filter(c => c.id !== myDriver.id);
        const results = [];

        for (const rival of rivals) {
            const maxRacePoints = (scoring[0] || 0) + (flEnabled ? flBonus : 0);

            // Get rival's current race results with details
            const raceDetails = rival.results.map((r, idx) => ({
                raceNum: idx + 1,
                position: r.position,
                fastestLap: r.fastestLap,
                points: calculateRacePoints(r.position, r.fastestLap),
                isRemaining: r.position === null
            }));

            // Calculate rival's best scenario for remaining races
            userPositions.forEach((userPos, i) => {
                const raceIdx = remainingRaceIndices[i];
                const rivalBestPos = userPos <= 1 ? userPos + 1 : 1;
                const rivalBestPoints = (scoring[rivalBestPos - 1] || 0) + (flEnabled ? flBonus : 0);

                raceDetails[raceIdx] = {
                    raceNum: raceIdx + 1,
                    position: rivalBestPos,
                    fastestLap: flEnabled,
                    points: rivalBestPoints,
                    isRemaining: true,
                    isBestCase: true
                };
            });

            // Sort to find which race gets dropped
            const allPoints = raceDetails.map(r => r.points);
            const sortedWithIdx = allPoints.map((p, i) => ({ points: p, idx: i }))
                .sort((a, b) => b.points - a.points);

            const droppedIndices = sortedWithIdx.slice(countBest).map(x => x.idx);
            const totalPoints = sortedWithIdx.slice(0, countBest)
                .reduce((sum, x) => sum + x.points, 0);

            // Build breakdown string
            const breakdownParts = [];
            raceDetails.forEach((r, idx) => {
                if (r.position === null) return; // Skip if no result

                const isDropped = droppedIndices.includes(idx);
                let part = `R${r.raceNum}:`;

                if (r.isBestCase) {
                    part += `P${r.position}`;
                    if (r.fastestLap) part += '+FL';
                } else {
                    part += r.position ? `P${r.position}` : 'DNS';
                    if (r.fastestLap) part += '+FL';
                }

                if (isDropped) {
                    part = `(${part})`;  // Parentheses for dropped
                }

                breakdownParts.push({
                    text: part,
                    isDropped,
                    isBestCase: r.isBestCase,
                    points: r.points
                });
            });

            results.push({
                id: rival.id,
                name: rival.name,
                maxPoints: totalPoints,
                breakdown: breakdownParts,
                breakdownText: breakdownParts.map(p => p.text).join(' + ')
            });
        }

        // Sort by max points descending and filter to only include threats
        return results
            .sort((a, b) => b.maxPoints - a.maxPoints)
            .filter(r => r.maxPoints > 0);
    }

    // Helper to calculate total points with hypothetical results
    function calcPointsWithResults(positions) {
        const allPoints = [...currentRacePoints];
        positions.forEach((pos, i) => {
            const raceIdx = remainingRaceIndices[i];
            const racePoints = scoring[pos - 1] || 0;
            allPoints[raceIdx] = racePoints;
        });

        // Apply drop rounds
        const sorted = [...allPoints].sort((a, b) => b - a);
        return sorted.slice(0, countBest).reduce((sum, p) => sum + p, 0);
    }

    // Helper to determine which positions in the scenario will be dropped
    function getDroppedPositionIndices(positions) {
        const allPoints = [...currentRacePoints];
        const positionPoints = [];

        positions.forEach((pos, i) => {
            const raceIdx = remainingRaceIndices[i];
            const racePoints = scoring[pos - 1] || 0;
            allPoints[raceIdx] = racePoints;
            positionPoints.push({ idx: i, raceIdx, points: racePoints });
        });

        // Find the cutoff point value (the lowest point that still counts)
        const sorted = [...allPoints].sort((a, b) => b - a);
        const cutoffPoints = sorted[countBest - 1] || 0;

        // Mark positions that are at or below cutoff AND there are enough higher scores
        const droppedIndices = [];
        const countedScores = sorted.slice(0, countBest);

        positionPoints.forEach(({ idx, points }) => {
            // Check if this position's points are dropped
            // It's dropped if it's not in the "best N" scores
            const allPointsSorted = [...allPoints].sort((a, b) => b - a);
            const keptPoints = allPointsSorted.slice(0, countBest);

            // Count how many times this point value appears in kept vs total
            const timesInKept = keptPoints.filter(p => p === points).length;
            const timesInAll = allPoints.filter(p => p === points).length;

            // If this point value appears more times in total than kept,
            // and this is one of the excess ones (lowest), it's dropped
            if (points < cutoffPoints || (points === cutoffPoints && timesInAll > timesInKept)) {
                // More sophisticated check: is THIS specific result dropped?
                const indexInSorted = allPointsSorted.indexOf(points);
                if (indexInSorted >= countBest) {
                    droppedIndices.push(idx);
                }
            }
        });

        return droppedIndices;
    }

    // Helper to format results display with "any" for dropped rounds
    function formatResultsDisplay(positions) {
        const droppedIndices = getDroppedPositionIndices(positions);
        const dropCount = state.championship.totalRounds - countBest;

        // If there are drop rounds, show "any" for dropped positions
        if (dropCount > 0 && droppedIndices.length > 0) {
            return positions.map((pos, i) => {
                if (droppedIndices.includes(i)) {
                    return 'any';
                }
                return `P${pos}`;
            }).join(' + ');
        }

        return positions.map(p => `P${p}`).join(' + ');
    }

    // Generate position combinations
    const scenarios = [];
    const positionsToTry = [];
    for (let p = 1; p <= maxPosition; p++) {
        positionsToTry.push(p);
    }

    if (remainingRaces === 1) {
        // Single race - simple enumeration
        for (const pos of positionsToTry) {
            const myFinalPoints = calcPointsWithResults([pos]);
            const scenarioRivalMax = calcRivalMaxWithUserPositions([pos]);
            const rivalsBreakdown = calcAllRivalsMaxWithBreakdown([pos]);
            let status;

            if (myFinalPoints > scenarioRivalMax) {
                status = 'SAFE';
            } else if (myFinalPoints > rivalMinPoints) {
                status = 'RISK';
            } else {
                status = 'FAIL';
            }

            scenarios.push({
                results: [pos],
                resultsDisplay: formatResultsDisplay([pos]),
                myPoints: myFinalPoints,
                rivalMaxPoints: scenarioRivalMax,
                rivalsBreakdown: rivalsBreakdown,
                status
            });
        }
    } else if (remainingRaces === 2) {
        // Two races - generate combinations
        for (const pos1 of positionsToTry) {
            for (const pos2 of positionsToTry) {
                // Only include if pos1 <= pos2 (sorted order to avoid duplicates)
                if (pos1 <= pos2) {
                    const myFinalPoints = calcPointsWithResults([pos1, pos2]);
                    const scenarioRivalMax = calcRivalMaxWithUserPositions([pos1, pos2]);
                    const rivalsBreakdown = calcAllRivalsMaxWithBreakdown([pos1, pos2]);
                    let status;

                    if (myFinalPoints > scenarioRivalMax) {
                        status = 'SAFE';
                    } else if (myFinalPoints > rivalMinPoints) {
                        status = 'RISK';
                    } else {
                        status = 'FAIL';
                    }

                    scenarios.push({
                        results: [pos1, pos2],
                        resultsDisplay: formatResultsDisplay([pos1, pos2]),
                        myPoints: myFinalPoints,
                        rivalMaxPoints: scenarioRivalMax,
                        rivalsBreakdown: rivalsBreakdown,
                        status
                    });
                }
            }
        }
    } else {
        // 3+ races - generate representative combinations
        // Use combinations of key positions to limit output
        const keyPositions = [1, 2, 3, 4, 5, Math.min(8, maxPosition), Math.min(10, maxPosition)];

        function* generateCombinations(remaining, current = []) {
            if (remaining === 0) {
                yield [...current].sort((a, b) => a - b);
                return;
            }

            for (const pos of keyPositions) {
                current.push(pos);
                yield* generateCombinations(remaining - 1, current);
                current.pop();
            }
        }

        const seen = new Set();
        for (const combo of generateCombinations(remainingRaces)) {
            const key = combo.join(',');
            if (seen.has(key)) continue;
            seen.add(key);

            const myFinalPoints = calcPointsWithResults(combo);
            const scenarioRivalMax = calcRivalMaxWithUserPositions(combo);
            const rivalsBreakdown = calcAllRivalsMaxWithBreakdown(combo);
            let status;

            if (myFinalPoints > scenarioRivalMax) {
                status = 'SAFE';
            } else if (myFinalPoints > rivalMinPoints) {
                status = 'RISK';
            } else {
                status = 'FAIL';
            }

            scenarios.push({
                results: combo,
                resultsDisplay: formatResultsDisplay(combo),
                myPoints: myFinalPoints,
                rivalMaxPoints: scenarioRivalMax,
                rivalsBreakdown: rivalsBreakdown,
                status
            });
        }
    }

    // Sort scenarios: SAFE first, then RISK, then FAIL
    // Within each group, sort by "easiest" (highest sum of positions = less effort)
    const statusOrder = { 'SAFE': 0, 'RISK': 1, 'FAIL': 2 };
    scenarios.sort((a, b) => {
        if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
        }
        // Within same status, sort by points (descending) then by ease (sum of positions descending)
        if (a.myPoints !== b.myPoints) {
            return b.myPoints - a.myPoints;
        }
        const sumA = a.results.reduce((s, p) => s + p, 0);
        const sumB = b.results.reduce((s, p) => s + p, 0);
        return sumB - sumA;
    });

    // Deduplicate scenarios with same final points (due to drop rounds, many combos give same result)
    // Keep only the "easiest" scenario for each unique point total per status
    const deduplicatedScenarios = [];
    const seenPointsByStatus = {};

    for (const scenario of scenarios) {
        const key = `${scenario.status}-${scenario.myPoints}`;
        if (!seenPointsByStatus[key]) {
            seenPointsByStatus[key] = true;
            deduplicatedScenarios.push(scenario);
        }
    }

    // Limit to top scenarios for display
    const safeScenarios = deduplicatedScenarios.filter(s => s.status === 'SAFE').slice(0, 5);
    const riskScenarios = deduplicatedScenarios.filter(s => s.status === 'RISK').slice(0, 3);
    const failScenarios = deduplicatedScenarios.filter(s => s.status === 'FAIL').slice(0, 2);

    return [...safeScenarios, ...riskScenarios, ...failScenarios];
}

// ==========================================
// CELL EDITING FUNCTIONS
// ==========================================

// Start editing a result cell
function startEditCell(competitorId, raceIndex) {
    state.ui.editingCell = { competitorId, raceIndex };

    const competitor = state.competitors.find(c => c.id === competitorId);
    const currentValue = competitor.results[raceIndex].position;

    // Find the cell and replace with input
    const row = document.querySelector(`tr[data-id="${competitorId}"]`);
    const cells = row.querySelectorAll('.result-cell');
    const cell = cells[raceIndex];

    cell.classList.add('editing');
    cell.innerHTML = `
        <input type="number"
               class="result-input"
               value="${currentValue || ''}"
               min="1"
               id="editing-input">
    `;

    const input = document.getElementById('editing-input');
    input.focus();
    input.select();

    // Add blur handler
    input.addEventListener('blur', finishEditCell);
}

// Finish editing cell
function finishEditCell() {
    if (!state.ui.editingCell) return;

    const input = document.getElementById('editing-input');
    if (!input) return;

    const { competitorId, raceIndex } = state.ui.editingCell;
    const value = input.value;

    state.ui.editingCell = null;
    setResult(competitorId, raceIndex, value);
}

// Determine if a race is "completed" (any driver has a result)
function isRaceCompleted(raceIndex) {
    return state.competitors.some(c =>
        c.results[raceIndex] && c.results[raceIndex].position !== null
    );
}

// ==========================================
// TOOLTIP HELPER
// ==========================================

// Generate tooltip text for a result cell showing points
function getResultTooltip(position, hasFastestLap) {
    if (position === null || position === undefined) {
        return null;
    }

    const { scoring, flEnabled, flBonus } = state.championship;
    const positionPoints = scoring[position - 1] || 0;

    if (flEnabled && hasFastestLap) {
        const totalPoints = positionPoints + flBonus;
        return `P${position} + FL = ${totalPoints} pts`;
    } else if (positionPoints > 0) {
        return `P${position} = ${positionPoints} pts`;
    } else {
        return `P${position} = 0 pts (outside points)`;
    }
}

// ==========================================
// RENDER FUNCTIONS
// ==========================================

function render() {
    renderConfig();
    renderGrid();
    renderStatus();
    updateScrollIndicator();
}

function renderConfig() {
    const { scoring, totalRounds, countBest, flEnabled, flBonus, name } = state.championship;

    document.getElementById('championship-name').value = name;
    document.getElementById('scoring-input').value = scoring.join(',');
    document.getElementById('total-rounds').value = totalRounds;
    document.getElementById('count-best').value = countBest;
    document.getElementById('count-best').max = totalRounds;
    document.getElementById('total-display').textContent = totalRounds;
    document.getElementById('fl-enabled').checked = flEnabled;
    document.getElementById('fl-bonus').value = flBonus;

    const flBonusWrapper = document.getElementById('fl-bonus-wrapper');
    if (flEnabled) {
        flBonusWrapper.classList.remove('hidden');
    } else {
        flBonusWrapper.classList.add('hidden');
    }

    // Update config collapse state
    const configContent = document.getElementById('config-content');
    const configToggleIcon = document.getElementById('config-toggle-icon');
    const configToggle = document.getElementById('config-toggle');

    if (state.ui.configCollapsed) {
        configContent.classList.add('collapsed');
        configToggleIcon.classList.add('collapsed');
        configToggle.setAttribute('aria-expanded', 'false');
    } else {
        configContent.classList.remove('collapsed');
        configToggleIcon.classList.remove('collapsed');
        configToggle.setAttribute('aria-expanded', 'true');
    }
}

function renderGrid() {
    const { totalRounds, flEnabled } = state.championship;
    const standings = calculateStandings();

    // Render header
    const thead = document.getElementById('grid-head');
    let headerHtml = '<tr><th>Driver</th>';

    for (let i = 0; i < totalRounds; i++) {
        headerHtml += `<th>R${i + 1}</th>`;
        if (flEnabled) {
            headerHtml += `<th class="fl-header">FL</th>`;
        }
    }

    headerHtml += '<th>Total</th><th>Rank</th></tr>';
    thead.innerHTML = headerHtml;

    // Render body
    const tbody = document.getElementById('grid-body');

    if (state.competitors.length === 0) {
        const colSpan = 2 + totalRounds + (flEnabled ? totalRounds : 0) + 2;
        tbody.innerHTML = `
            <tr>
                <td colspan="${colSpan}" class="empty-grid-message">
                    No drivers yet. Click "+ Add Driver" to begin.
                </td>
            </tr>
        `;
        return;
    }

    // Build competitor rows ordered by standings
    let bodyHtml = '';
    standings.forEach(standing => {
        const competitor = state.competitors.find(c => c.id === standing.competitorId);
        const rowClass = competitor.isMyDriver ? 'my-driver-row' : '';

        bodyHtml += `<tr data-id="${competitor.id}" class="${rowClass}">`;

        // Driver cell with star marker
        const starClass = competitor.isMyDriver ? 'active' : 'inactive';
        const starSymbol = competitor.isMyDriver ? '\u2605' : '\u2606';
        bodyHtml += `
            <td>
                <div class="driver-cell">
                    <span class="my-driver-marker ${starClass}"
                          title="Mark as my driver"
                          role="button"
                          tabindex="0">${starSymbol}</span>
                    <span class="driver-name"
                          title="Click to edit name">${escapeHtml(competitor.name)}</span>
                    <span class="delete-driver"
                          title="Remove driver"
                          role="button"
                          tabindex="0">&times;</span>
                </div>
            </td>
        `;

        // Race result cells
        for (let i = 0; i < totalRounds; i++) {
            const result = competitor.results[i];
            const isCompleted = isRaceCompleted(i);
            const cellClass = isCompleted ? 'result-cell' : 'result-cell future';
            const displayValue = result.position !== null ? result.position : '';

            // Generate tooltip
            const tooltip = getResultTooltip(result.position, result.fastestLap);
            const tooltipAttr = tooltip ? `data-tooltip="${tooltip}"` : '';

            bodyHtml += `<td class="${cellClass}" ${tooltipAttr} data-race="${i}">${displayValue}</td>`;

            if (flEnabled) {
                const flChecked = result.fastestLap ? 'checked' : '';
                bodyHtml += `
                    <td class="fl-cell">
                        <input type="checkbox"
                               class="fl-checkbox"
                               ${flChecked}
                               data-race="${i}"
                               title="Fastest lap">
                    </td>
                `;
            }
        }

        // Total points
        bodyHtml += `<td class="total-cell">${standing.totalPoints}</td>`;

        // Rank with styling
        const rankClass = `rank-cell rank-${Math.min(standing.rank, 3)}`;
        const rankDisplay = standing.isTied ? `T${standing.rank}` : standing.rank;
        bodyHtml += `<td class="${rankClass}">${rankDisplay}</td>`;

        bodyHtml += '</tr>';
    });

    tbody.innerHTML = bodyHtml;
}

function renderStatus() {
    const myDriver = state.competitors.find(c => c.isMyDriver);
    const targetPosition = state.championship.targetPosition;

    // Update target position dropdown
    const targetSelect = document.getElementById('target-position');
    const maxPos = Math.max(state.competitors.length, 1);

    let optionsHtml = '';
    for (let i = 1; i <= maxPos; i++) {
        const selected = i === targetPosition ? 'selected' : '';
        const label = i === 1 ? '1st (Title)' :
                      i === 2 ? '2nd' :
                      i === 3 ? '3rd' :
                      `${i}th`;
        optionsHtml += `<option value="${i}" ${selected}>${label}</option>`;
    }
    targetSelect.innerHTML = optionsHtml;

    // Get status elements
    const nameEl = document.getElementById('my-driver-name');
    const pointsEl = document.getElementById('my-driver-points');
    const rankEl = document.getElementById('current-rank');
    const messageEl = document.getElementById('status-message');
    const detailsEl = document.getElementById('status-details');
    const rivalsSection = document.getElementById('rivals-section');
    const rivalList = document.getElementById('rival-list');
    const whatsNeededSection = document.getElementById('whats-needed-section');

    if (!myDriver || state.competitors.length < 2) {
        nameEl.textContent = '-';
        pointsEl.textContent = '0 pts';
        rankEl.textContent = '-';
        messageEl.textContent = 'Add competitors to begin';
        messageEl.className = 'status-message';
        detailsEl.textContent = '';
        rivalsSection.classList.add('hidden');
        whatsNeededSection.classList.add('hidden');
        return;
    }

    // Calculate position status
    const posStatus = calculatePositionStatus(myDriver, targetPosition);

    nameEl.textContent = myDriver.name;
    pointsEl.textContent = `${posStatus.myCurrentPoints} pts`;
    rankEl.textContent = `P${posStatus.myCurrentRank}`;

    // Set message
    messageEl.textContent = posStatus.message;

    // Set details
    detailsEl.textContent = posStatus.details;

    // Set status class for color coding
    let statusClass = 'status-message ';
    switch (posStatus.status) {
        case 'GUARANTEED':
            statusClass += 'status-guaranteed';
            break;
        case 'SECURED':
            statusClass += 'status-secured';
            break;
        case 'ON_TRACK':
            statusClass += 'status-on-track';
            break;
        case 'ACHIEVABLE':
            statusClass += 'status-achievable';
            break;
        case 'NOT_POSSIBLE':
            statusClass += 'status-not-possible';
            break;
        default:
            statusClass += '';
    }
    messageEl.className = statusClass;

    // Render rivals section
    if (posStatus.rivals && posStatus.rivals.length > 0) {
        rivalsSection.classList.remove('hidden');

        let rivalsHtml = '';
        posStatus.rivals.forEach(rival => {
            // Determine threat indicator
            const indicatorClass = rival.isThreat ? 'threat' : 'safe';
            const indicatorText = rival.isThreat ? 'THREAT' : 'SAFE';

            rivalsHtml += `
                <div class="rival-item">
                    <span class="rival-name">P${rival.currentRank} ${escapeHtml(rival.name)}</span>
                    <div class="rival-stats">
                        <span class="rival-current">${rival.currentPoints} pts</span>
                        <span class="rival-max-with-breakdown">
                            <span class="rival-max">max ${rival.maxPoints}</span>
                            ${rival.maxBreakdown ? `<span class="rival-breakdown-text">${escapeHtml(rival.maxBreakdown)}</span>` : ''}
                        </span>
                        <span class="rival-indicator ${indicatorClass}">${indicatorText}</span>
                    </div>
                </div>
            `;
        });

        rivalList.innerHTML = rivalsHtml;
    } else {
        rivalsSection.classList.add('hidden');
        rivalList.innerHTML = '';
    }

    // Render What's Needed section
    renderWhatsNeeded(myDriver, targetPosition);
}

function renderWhatsNeeded(myDriver, targetPosition) {
    const whatsNeededSection = document.getElementById('whats-needed-section');
    const summaryEl = document.getElementById('whats-needed-summary');
    const scenarioContainer = document.getElementById('scenario-table-container');
    const scenarioBody = document.getElementById('scenario-body');
    const scenarioTableWrapper = document.getElementById('scenario-table-wrapper');
    const scenarioToggle = document.getElementById('scenario-toggle');
    const scenarioToggleIcon = document.getElementById('scenario-toggle-icon');

    // Calculate required results
    const required = calculateRequiredResults(myDriver, targetPosition);

    // Handle edge cases
    if (required.type === 'NONE' || required.type === 'COMPLETE') {
        whatsNeededSection.classList.add('hidden');
        return;
    }

    whatsNeededSection.classList.remove('hidden');

    // Build summary HTML
    let summaryHtml = '';

    if (required.type === 'GUARANTEED') {
        summaryHtml = `<span class="guaranteed-text">${required.message}</span>`;
        scenarioContainer.classList.add('hidden');
    } else if (required.type === 'NOT_POSSIBLE') {
        summaryHtml = `<span class="impossible-text">${required.message}</span>`;
        scenarioContainer.classList.add('hidden');
    } else if (required.type === 'SCENARIOS') {
        summaryHtml = required.message;

        if (required.contention) {
            summaryHtml += `<div class="whats-needed-contention">${required.contention}</div>`;
        }

        // Show scenario table if we have scenarios
        if (required.scenarios && required.scenarios.length > 0) {
            scenarioContainer.classList.remove('hidden');

            // Build scenario table rows
            let rowsHtml = '';
            required.scenarios.forEach(scenario => {
                const statusClass = `scenario-${scenario.status.toLowerCase()}`;

                // Build rival breakdown - show all rivals inline
                let rivalsList = '';
                if (scenario.rivalsBreakdown && scenario.rivalsBreakdown.length > 0) {
                    const topRivals = scenario.rivalsBreakdown
                        .filter(r => r.maxPoints >= scenario.rivalMaxPoints - 10)
                        .slice(0, 4);

                    rivalsList = topRivals.map(r =>
                        `<div class="rival-inline-item">
                            <span class="rival-inline-name">${escapeHtml(r.name)}</span>
                            <span class="rival-inline-pts">${r.maxPoints}</span>
                            <span class="rival-inline-detail">${escapeHtml(r.breakdownText)}</span>
                        </div>`
                    ).join('');
                }

                rowsHtml += `
                    <tr>
                        <td>${scenario.resultsDisplay}</td>
                        <td>${scenario.myPoints}</td>
                        <td class="rival-max-cell">
                            <span class="rival-max-value">${scenario.rivalMaxPoints}</span>
                            <div class="rival-inline-list">${rivalsList}</div>
                        </td>
                        <td><span class="scenario-status ${statusClass}">${scenario.status}</span></td>
                    </tr>
                `;
            });
            scenarioBody.innerHTML = rowsHtml;

            // Update toggle state
            if (state.ui.scenarioTableExpanded) {
                scenarioTableWrapper.classList.remove('hidden');
                scenarioToggleIcon.classList.add('expanded');
            } else {
                scenarioTableWrapper.classList.add('hidden');
                scenarioToggleIcon.classList.remove('expanded');
            }
        } else {
            scenarioContainer.classList.add('hidden');
        }
    }

    summaryEl.innerHTML = summaryHtml;
}

// Toggle scenario table visibility
function toggleScenarioTable() {
    state.ui.scenarioTableExpanded = !state.ui.scenarioTableExpanded;

    const scenarioTableWrapper = document.getElementById('scenario-table-wrapper');
    const scenarioToggleIcon = document.getElementById('scenario-toggle-icon');

    if (state.ui.scenarioTableExpanded) {
        scenarioTableWrapper.classList.remove('hidden');
        scenarioToggleIcon.classList.add('expanded');
    } else {
        scenarioTableWrapper.classList.add('hidden');
        scenarioToggleIcon.classList.remove('expanded');
    }
}

// Toggle config panel visibility (mobile)
function toggleConfigPanel() {
    state.ui.configCollapsed = !state.ui.configCollapsed;
    renderConfig();
}

// Update scroll indicator for grid
function updateScrollIndicator() {
    const gridWrapper = document.getElementById('grid-wrapper');
    const gridContainer = document.getElementById('grid-container');

    if (gridContainer && gridWrapper) {
        const hasHorizontalScroll = gridContainer.scrollWidth > gridContainer.clientWidth;
        if (hasHorizontalScroll) {
            gridWrapper.classList.add('has-scroll');
        } else {
            gridWrapper.classList.remove('has-scroll');
        }
    }
}

// Utility: escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================================
// EVENT HANDLERS
// ==========================================

function initEventListeners() {
    // Championship name
    document.getElementById('championship-name').addEventListener('input', (e) => {
        state.championship.name = e.target.value;
    });

    // Save button
    document.getElementById('save-btn').addEventListener('click', () => {
        const result = saveToStorage();
        if (result.error) {
            alert(result.error);
        }
    });

    // New tournament button
    document.getElementById('new-btn').addEventListener('click', clearStorage);

    // Initialize tournament selector
    renderTournamentSelector();

    // Scoring input - parse comma-separated values
    document.getElementById('scoring-input').addEventListener('change', (e) => {
        const input = e.target.value;
        const values = input.split(',')
            .map(v => parseInt(v.trim(), 10))
            .filter(v => !isNaN(v) && v >= 0);

        if (values.length > 0) {
            updateConfig({ scoring: values });
        } else {
            // Revert to current value if invalid
            e.target.value = state.championship.scoring.join(',');
        }
    });

    // Total rounds
    document.getElementById('total-rounds').addEventListener('change', (e) => {
        const value = parseInt(e.target.value, 10);
        if (value >= 1 && value <= 50) {
            updateConfig({ totalRounds: value });
        } else {
            e.target.value = state.championship.totalRounds;
        }
    });

    // Count best (drop rounds)
    document.getElementById('count-best').addEventListener('change', (e) => {
        const value = parseInt(e.target.value, 10);
        if (value >= 1 && value <= state.championship.totalRounds) {
            updateConfig({ countBest: value });
        } else {
            e.target.value = state.championship.countBest;
        }
    });

    // Fastest lap toggle - show/hide bonus input
    document.getElementById('fl-enabled').addEventListener('change', (e) => {
        updateConfig({ flEnabled: e.target.checked });
    });

    // FL bonus value
    document.getElementById('fl-bonus').addEventListener('change', (e) => {
        const value = parseInt(e.target.value, 10);
        if (value >= 1 && value <= 10) {
            updateConfig({ flBonus: value });
        } else {
            e.target.value = state.championship.flBonus;
        }
    });

    // Add driver button - show modal
    document.getElementById('add-driver-btn').addEventListener('click', () => {
        document.getElementById('add-driver-modal').classList.remove('hidden');
        document.getElementById('new-driver-name').value = '';
        document.getElementById('new-driver-name').focus();
    });

    // Cancel add driver
    document.getElementById('cancel-add-driver').addEventListener('click', () => {
        document.getElementById('add-driver-modal').classList.add('hidden');
    });

    // Confirm add driver
    document.getElementById('confirm-add-driver').addEventListener('click', () => {
        const name = document.getElementById('new-driver-name').value;
        const result = addCompetitor(name);
        if (result.error) {
            alert(result.error);
        } else {
            document.getElementById('add-driver-modal').classList.add('hidden');
        }
    });

    // Enter key in driver name input
    document.getElementById('new-driver-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('confirm-add-driver').click();
        }
    });

    // Click outside modal to close
    document.getElementById('add-driver-modal').addEventListener('click', (e) => {
        if (e.target.id === 'add-driver-modal') {
            document.getElementById('add-driver-modal').classList.add('hidden');
        }
    });

    // Target position selector
    document.getElementById('target-position').addEventListener('change', (e) => {
        state.championship.targetPosition = parseInt(e.target.value, 10);
        render();
    });

    // Scenario table toggle
    document.getElementById('scenario-toggle').addEventListener('click', toggleScenarioTable);

    // Config panel toggle (mobile)
    document.getElementById('config-toggle').addEventListener('click', toggleConfigPanel);

    // Global keyboard handler for grid editing
    document.addEventListener('keydown', (e) => {
        if (!state.ui.editingCell) return;

        const input = document.getElementById('editing-input');
        if (!input) return;

        if (e.key === 'Enter') {
            e.preventDefault();
            const { competitorId, raceIndex } = state.ui.editingCell;
            finishEditCell();

            // Move to next row same column
            const currentIndex = state.competitors.findIndex(c => c.id === competitorId);
            if (currentIndex < state.competitors.length - 1) {
                setTimeout(() => {
                    startEditCell(state.competitors[currentIndex + 1].id, raceIndex);
                }, 10);
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const { competitorId, raceIndex } = state.ui.editingCell;
            finishEditCell();

            // Move to next cell
            const nextRace = raceIndex + 1;
            if (nextRace < state.championship.totalRounds) {
                setTimeout(() => {
                    startEditCell(competitorId, nextRace);
                }, 10);
            }
        } else if (e.key === 'Escape') {
            state.ui.editingCell = null;
            render();
        }
    });

    // Keyboard support for star marker and delete button
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const target = e.target;
            if (target.classList.contains('my-driver-marker') || target.classList.contains('delete-driver')) {
                e.preventDefault();
                target.click();
            }
        }
    });

    // Update scroll indicator on resize
    window.addEventListener('resize', updateScrollIndicator);

    // Expose functions globally for onclick handlers (required due to CSP)
    window.loadTournament = loadTournament;
    window.deleteTournament = deleteTournament;
    window.setMyDriver = setMyDriver;
    window.startEditDriverName = startEditDriverName;
    window.confirmRemoveCompetitor = confirmRemoveCompetitor;
    window.startEditCell = startEditCell;

    // Event delegation for results table (CSP blocks inline onclick handlers)
    // Use document-level delegation since grid-body content is created dynamically
    document.addEventListener('click', (e) => {
        const target = e.target;
        console.log('[RaceStand] Click detected on:', target.className, target.tagName);

        const row = target.closest('#grid-body tr');
        if (!row) {
            console.log('[RaceStand] No row found');
            return;
        }

        const competitorId = row.dataset.id;
        console.log('[RaceStand] Row found, competitorId:', competitorId);
        if (!competitorId) return;

        // Star marker click - set my driver
        if (target.classList.contains('my-driver-marker')) {
            console.log('[RaceStand] Star clicked for:', competitorId);
            setMyDriver(competitorId);
            return;
        }

        // Driver name click - edit name
        if (target.classList.contains('driver-name')) {
            console.log('[RaceStand] Driver name clicked for:', competitorId);
            startEditDriverName(competitorId);
            return;
        }

        // Delete button click - remove competitor
        if (target.classList.contains('delete-driver')) {
            console.log('[RaceStand] Delete clicked for:', competitorId);
            confirmRemoveCompetitor(competitorId);
            return;
        }

        // Result cell click - edit cell
        const cell = target.closest('td');
        if (cell && cell.dataset.race !== undefined) {
            const raceIndex = parseInt(cell.dataset.race, 10);
            console.log('[RaceStand] Cell clicked for:', competitorId, 'race:', raceIndex);
            startEditCell(competitorId, raceIndex);
        }
    });

    // Event delegation for fastest lap checkboxes
    document.addEventListener('change', (e) => {
        const target = e.target;
        if (target.classList.contains('fl-checkbox')) {
            const row = target.closest('#grid-body tr');
            if (!row) return;

            const competitorId = row.dataset.id;
            const raceIndex = parseInt(target.dataset.race, 10);
            setFastestLap(competitorId, raceIndex, target.checked);
        }
    });

    // Update scroll indicator on scroll
    const gridContainer = document.getElementById('grid-container');
    if (gridContainer) {
        gridContainer.addEventListener('scroll', () => {
            const gridWrapper = document.getElementById('grid-wrapper');
            if (gridWrapper) {
                const atEnd = gridContainer.scrollLeft >= (gridContainer.scrollWidth - gridContainer.clientWidth - 10);
                if (atEnd) {
                    gridWrapper.classList.remove('has-scroll');
                } else if (gridContainer.scrollWidth > gridContainer.clientWidth) {
                    gridWrapper.classList.add('has-scroll');
                }
            }
        });
    }
}

// ==========================================
// INITIALIZATION
// ==========================================

function init() {
    console.log('[RaceStand] init() called');
    initEventListeners();

    // Check for URL import parameter first
    console.log('[RaceStand] About to call checkUrlImport...');
    const importedData = checkUrlImport();
    console.log('[RaceStand] checkUrlImport returned:', !!importedData);

    if (importedData) {
        // Data imported from URL, render it
        console.log('Imported championship from URL');
    } else {
        // Try to load saved data
        const savedData = loadFromStorage();

        if (savedData && savedData.competitors && savedData.competitors.length > 0) {
            // Data loaded from storage, just render
            console.log('Loaded championship from storage:', savedData.savedAt);
        } else {
            // No saved data, add default drivers
            addDefaultDrivers();
        }
    }

    render();
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
