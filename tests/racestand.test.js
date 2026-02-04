/**
 * RaceStand MVP - Automated Test Suite
 * Run with: node tests/racestand.test.js
 */

// ==========================================
// TEST FRAMEWORK
// ==========================================

const testResults = { passed: 0, failed: 0, tests: [] };
const bugs = [];

function assert(condition, message, details = '') {
    if (condition) {
        testResults.passed++;
        testResults.tests.push({ name: message, passed: true });
        console.log(`  [PASS] ${message}`);
    } else {
        testResults.failed++;
        testResults.tests.push({ name: message, passed: false, details });
        console.log(`  [FAIL] ${message}`);
        if (details) console.log(`         Details: ${details}`);
    }
    return condition;
}

function assertEqual(actual, expected, message) {
    const passed = JSON.stringify(actual) === JSON.stringify(expected);
    if (!passed) {
        assert(false, message, `Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)}`);
    } else {
        assert(true, message);
    }
    return passed;
}

function reportBug(title, description, severity = 'medium') {
    bugs.push({ title, description, severity });
    console.log(`\n  [BUG FOUND] ${title}`);
    console.log(`  Severity: ${severity}`);
    console.log(`  Description: ${description}\n`);
}

// ==========================================
// APPLICATION FUNCTIONS (ISOLATED FOR TESTING)
// ==========================================

let testState = null;

function resetTestState(overrides = {}) {
    testState = {
        championship: {
            name: '',
            scoring: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
            totalRounds: 5,
            countBest: 5,
            flEnabled: false,
            flBonus: 1,
            targetPosition: 1,
            ...overrides.championship
        },
        competitors: overrides.competitors || []
    };
}

function calculateRacePoints(position, hasFastestLap) {
    if (position === null || position === undefined) return 0;
    const { scoring, flEnabled, flBonus } = testState.championship;
    const positionPoints = scoring[position - 1] || 0;
    const flPoints = (flEnabled && hasFastestLap) ? flBonus : 0;
    return positionPoints + flPoints;
}

function calculateTotalPoints(results) {
    const { countBest } = testState.championship;
    const racePoints = results.map(r => calculateRacePoints(r.position, r.fastestLap));
    const sorted = [...racePoints].sort((a, b) => b - a);
    const best = sorted.slice(0, countBest);
    return best.reduce((sum, pts) => sum + pts, 0);
}

function countPositionFinishes(results, position) {
    return results.filter(r => r.position === position).length;
}

function calculateStandings() {
    const standings = testState.competitors.map(comp => {
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

    standings.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        for (let pos = 1; pos <= 20; pos++) {
            const aCount = countPositionFinishes(a.results, pos);
            const bCount = countPositionFinishes(b.results, pos);
            if (bCount !== aCount) return bCount - aCount;
        }
        return a.name.localeCompare(b.name);
    });

    let currentRank = 1;
    standings.forEach((standing, index) => {
        if (index > 0) {
            const prev = standings[index - 1];
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
            if (!isTied) currentRank = index + 1;
            standing.isTied = isTied;
        } else {
            standing.isTied = false;
        }
        standing.rank = currentRank;
    });

    return standings;
}

function calculateMaxPossiblePoints(competitor) {
    const { scoring, countBest, flEnabled, flBonus } = testState.championship;
    const maxRacePoints = (scoring[0] || 0) + (flEnabled ? flBonus : 0);
    const currentRacePoints = competitor.results.map(r => calculateRacePoints(r.position, r.fastestLap));
    const allPoints = [...currentRacePoints];
    for (let i = 0; i < allPoints.length; i++) {
        if (competitor.results[i].position === null) {
            allPoints[i] = maxRacePoints;
        }
    }
    const sorted = [...allPoints].sort((a, b) => b - a);
    return sorted.slice(0, countBest).reduce((sum, p) => sum + p, 0);
}

function calculateMinPossiblePoints(competitor) {
    const { countBest } = testState.championship;
    const currentRacePoints = competitor.results.map(r => calculateRacePoints(r.position, r.fastestLap));
    const sorted = [...currentRacePoints].sort((a, b) => b - a);
    return sorted.slice(0, countBest).reduce((sum, p) => sum + p, 0);
}

function createCompetitor(name, results, isMyDriver = false) {
    return {
        id: `comp_${name.replace(/\s/g, '_')}`,
        name,
        isMyDriver,
        results: results.map(r => ({
            position: r.position !== undefined ? r.position : r,
            fastestLap: r.fastestLap || false
        }))
    };
}

function calculatePositionStatus(myDriver, targetPosition) {
    if (!myDriver || testState.competitors.length < 2) {
        return { status: 'NONE', message: 'Add competitors to begin' };
    }

    const standings = calculateStandings();
    const myStanding = standings.find(s => s.competitorId === myDriver.id);
    const myCurrentRank = myStanding.rank;
    const myCurrentPoints = myStanding.totalPoints;
    const myMaxPoints = calculateMaxPossiblePoints(myDriver);
    const myMinPoints = calculateMinPossiblePoints(myDriver);

    const remainingRaces = myDriver.results.filter(r => r.position === null).length;
    const hasRemainingRaces = remainingRaces > 0;

    const allRivals = testState.competitors
        .filter(c => c.id !== myDriver.id)
        .map(rival => {
            const rivalStanding = standings.find(s => s.competitorId === rival.id);
            return {
                id: rival.id,
                name: rival.name,
                currentPoints: rivalStanding.totalPoints,
                currentRank: rivalStanding.rank,
                maxPoints: calculateMaxPossiblePoints(rival),
                minPoints: calculateMinPossiblePoints(rival)
            };
        });

    let status;

    if (myCurrentRank <= targetPosition) {
        // Also include tied rivals as threats (they can still beat us even if at same rank)
        const threatsFromBelow = allRivals.filter(t =>
            (t.currentRank > targetPosition || t.currentRank === myCurrentRank) && t.maxPoints >= myMinPoints
        );

        if (threatsFromBelow.length === 0 && !hasRemainingRaces) {
            status = 'GUARANTEED';
        } else if (threatsFromBelow.length === 0) {
            status = 'SECURED';
        } else {
            status = 'ON_TRACK';
        }
    } else {
        const targetRivalStanding = standings.find(s => s.rank === targetPosition);
        const targetRivalComp = targetRivalStanding
            ? testState.competitors.find(c => c.id === targetRivalStanding.competitorId)
            : null;
        const targetRivalMinPoints = targetRivalComp
            ? calculateMinPossiblePoints(targetRivalComp)
            : 0;

        if (myMaxPoints > targetRivalMinPoints) {
            status = 'ACHIEVABLE';
        } else {
            status = 'NOT_POSSIBLE';
        }
    }

    return { status, myCurrentRank, myCurrentPoints, myMaxPoints, myMinPoints, remainingRaces };
}

function generateScenarios(myDriver, targetPosition, remainingRaceIndices) {
    const { scoring, countBest } = testState.championship;
    const standings = calculateStandings();
    const maxPosition = Math.min(scoring.length + 3, 20);
    const remainingRaces = remainingRaceIndices.length;

    const currentRacePoints = myDriver.results.map(r => calculateRacePoints(r.position, r.fastestLap));

    let keyRivalComp = null;
    const myStanding = standings.find(s => s.competitorId === myDriver.id);
    const myCurrentRank = myStanding.rank;

    if (myCurrentRank <= targetPosition) {
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
            keyRivalComp = testState.competitors.find(c => c.id === rivalStanding.competitorId);
        }
    } else {
        const rivalStanding = standings.find(s => s.rank === targetPosition);
        if (rivalStanding) {
            keyRivalComp = testState.competitors.find(c => c.id === rivalStanding.competitorId);
        }
    }

    const rivalMinPoints = keyRivalComp ? calculateMinPossiblePoints(keyRivalComp) : 0;

    // Helper to calculate rival's max points given user's positions in each scenario
    // If user takes P1, rival can only get P2 at best in that race
    function calcRivalMaxWithUserPositions(userPositions) {
        if (!keyRivalComp) return 0;

        const maxRacePoints = scoring[0] || 0;

        // Get rival's current race points
        const rivalRacePoints = keyRivalComp.results.map(r =>
            calculateRacePoints(r.position, r.fastestLap)
        );

        // For remaining races, calculate rival's max considering user's positions
        userPositions.forEach((userPos, i) => {
            const raceIdx = remainingRaceIndices[i];
            // Rival's best position is one behind user (or P1 if user is outside top positions)
            const rivalBestPos = userPos + 1;
            const rivalBestPoints = scoring[rivalBestPos - 1] || 0;
            // If user takes P1, rival is limited to P2; otherwise rival can still get P1
            rivalRacePoints[raceIdx] = userPos <= 1 ? rivalBestPoints : maxRacePoints;
        });

        // Apply drop rounds
        const sorted = [...rivalRacePoints].sort((a, b) => b - a);
        return sorted.slice(0, countBest).reduce((sum, p) => sum + p, 0);
    }

    function calcPointsWithResults(positions) {
        const allPoints = [...currentRacePoints];
        positions.forEach((pos, i) => {
            const raceIdx = remainingRaceIndices[i];
            const racePoints = scoring[pos - 1] || 0;
            allPoints[raceIdx] = racePoints;
        });
        const sorted = [...allPoints].sort((a, b) => b - a);
        return sorted.slice(0, countBest).reduce((sum, p) => sum + p, 0);
    }

    const scenarios = [];
    const positionsToTry = [];
    for (let p = 1; p <= maxPosition; p++) positionsToTry.push(p);

    if (remainingRaces === 1) {
        for (const pos of positionsToTry) {
            const myFinalPoints = calcPointsWithResults([pos]);
            const scenarioRivalMax = calcRivalMaxWithUserPositions([pos]);
            let status;
            if (myFinalPoints > scenarioRivalMax) status = 'SAFE';
            else if (myFinalPoints > rivalMinPoints) status = 'RISK';
            else status = 'FAIL';
            scenarios.push({ results: [pos], myPoints: myFinalPoints, rivalMaxPoints: scenarioRivalMax, status });
        }
    } else if (remainingRaces === 2) {
        for (const pos1 of positionsToTry) {
            for (const pos2 of positionsToTry) {
                if (pos1 <= pos2) {
                    const myFinalPoints = calcPointsWithResults([pos1, pos2]);
                    const scenarioRivalMax = calcRivalMaxWithUserPositions([pos1, pos2]);
                    let status;
                    if (myFinalPoints > scenarioRivalMax) status = 'SAFE';
                    else if (myFinalPoints > rivalMinPoints) status = 'RISK';
                    else status = 'FAIL';
                    scenarios.push({ results: [pos1, pos2], myPoints: myFinalPoints, rivalMaxPoints: scenarioRivalMax, status });
                }
            }
        }
    }

    return scenarios;
}

// ==========================================
// TEST SUITES
// ==========================================

console.log('\n========================================');
console.log('  RaceStand MVP - Test Suite');
console.log('========================================\n');

// TEST 1: SCORING TABLE FORMATS
console.log('\n--- Test 1: Scoring Table Formats ---\n');

resetTestState({ championship: { scoring: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1] } });
assertEqual(calculateRacePoints(1, false), 25, 'F1 scoring: P1 = 25 points');
assertEqual(calculateRacePoints(2, false), 18, 'F1 scoring: P2 = 18 points');
assertEqual(calculateRacePoints(10, false), 1, 'F1 scoring: P10 = 1 point');
assertEqual(calculateRacePoints(11, false), 0, 'F1 scoring: P11 = 0 points (outside scoring)');

resetTestState({ championship: { scoring: [30, 27, 24, 21, 18] } });
assertEqual(calculateRacePoints(1, false), 30, 'Custom scoring: P1 = 30 points');
assertEqual(calculateRacePoints(5, false), 18, 'Custom scoring: P5 = 18 points');
assertEqual(calculateRacePoints(6, false), 0, 'Custom scoring: P6 = 0 points (outside table)');

resetTestState({ championship: { scoring: [10] } });
assertEqual(calculateRacePoints(1, false), 10, 'Single value: P1 = 10 points');
assertEqual(calculateRacePoints(2, false), 0, 'Single value: P2 = 0 points');

resetTestState({ championship: { scoring: [25, 18, 15], flEnabled: true, flBonus: 1 } });
assertEqual(calculateRacePoints(1, true), 26, 'FL bonus: P1 + FL = 26 points');
assertEqual(calculateRacePoints(1, false), 25, 'FL bonus: P1 without FL = 25 points');

resetTestState({ championship: { scoring: [25, 18], flEnabled: true, flBonus: 5 } });
assertEqual(calculateRacePoints(1, true), 30, 'FL bonus 5pts: P1 + FL = 30 points');

assertEqual(calculateRacePoints(null, false), 0, 'Null position = 0 points');
assertEqual(calculateRacePoints(undefined, false), 0, 'Undefined position = 0 points');

// TEST 2: DROP ROUNDS CALCULATION
console.log('\n--- Test 2: Drop Rounds Calculation ---\n');

resetTestState({
    championship: { scoring: [25, 18, 15, 12, 10], totalRounds: 5, countBest: 4 }
});

const results1 = [
    { position: 1, fastestLap: false },
    { position: 2, fastestLap: false },
    { position: 3, fastestLap: false },
    { position: 4, fastestLap: false },
    { position: 5, fastestLap: false }
];
assertEqual(calculateTotalPoints(results1), 70, 'Best 4 of 5: drops lowest (25+18+15+12=70)');

const results2 = [
    { position: 1, fastestLap: false },
    { position: 1, fastestLap: false },
    { position: null, fastestLap: false },
    { position: null, fastestLap: false },
    { position: 5, fastestLap: false }
];
assertEqual(calculateTotalPoints(results2), 60, 'Best 4 of 5 with DNFs: 25+25+10+0=60');

resetTestState({
    championship: { scoring: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], totalRounds: 10, countBest: 8 }
});

const results3 = [];
for (let i = 0; i < 10; i++) {
    results3.push({ position: i + 1, fastestLap: false });
}
assertEqual(calculateTotalPoints(results3), 98, 'Best 8 of 10: drops 2 lowest (98 pts)');

resetTestState({
    championship: { scoring: [25, 18, 15, 12, 10], totalRounds: 5, countBest: 5 }
});
assertEqual(calculateTotalPoints(results1), 80, 'Best 5 of 5: no drops, all count (80 pts)');

// TEST 3: TIEBREAKER SCENARIOS
console.log('\n--- Test 3: Tiebreaker Scenarios ---\n');

resetTestState({
    championship: { scoring: [10, 6, 4], totalRounds: 3, countBest: 3 },
    competitors: [
        createCompetitor('Alice', [{ position: 1 }, { position: 3 }, { position: 3 }], true),
        createCompetitor('Bob', [{ position: 2 }, { position: 2 }, { position: 2 }])
    ]
});

let standings = calculateStandings();
assertEqual(standings[0].name, 'Alice', 'Tiebreaker: same points (18), more wins -> Alice wins');
assertEqual(standings[1].name, 'Bob', 'Bob ranks second');

resetTestState({
    championship: { scoring: [10, 6, 4], totalRounds: 4, countBest: 4 },
    competitors: [
        createCompetitor('Alice', [{ position: 1 }, { position: 2 }, { position: 3 }, { position: 3 }], true),
        createCompetitor('Bob', [{ position: 1 }, { position: 3 }, { position: 2 }, { position: 3 }])
    ]
});

standings = calculateStandings();
assertEqual(standings[0].name, 'Alice', 'Completely tied -> alphabetical: Alice first');
assertEqual(standings[1].isTied, true, 'Second with same record marked as tied');

resetTestState({
    championship: { scoring: [10, 6, 4, 2], totalRounds: 4, countBest: 4 },
    competitors: [
        createCompetitor('Alice', [{ position: 1 }, { position: 2 }, { position: 2 }, { position: 4 }], true),
        createCompetitor('Bob', [{ position: 1 }, { position: 2 }, { position: 3 }, { position: 3 }])
    ]
});

standings = calculateStandings();
assertEqual(standings[0].name, 'Alice', 'Same points, same wins, more P2s -> Alice wins');

// TEST 4: TARGET POSITION CALCULATIONS
console.log('\n--- Test 4: Target Position Calculations ---\n');

resetTestState({
    championship: { scoring: [25, 18, 15], totalRounds: 3, countBest: 3 },
    competitors: [
        createCompetitor('Leader', [{ position: 1 }, { position: 1 }, { position: 1 }], true),
        createCompetitor('Challenger', [{ position: 2 }, { position: 2 }, { position: 2 }])
    ]
});

let status = calculatePositionStatus(testState.competitors[0], 1);
assertEqual(status.status, 'GUARANTEED', 'P1 GUARANTEED when all races done and unbeatable');
assertEqual(status.myCurrentRank, 1, 'Current rank is 1');

resetTestState({
    championship: { scoring: [25, 18, 15], totalRounds: 3, countBest: 3 },
    competitors: [
        createCompetitor('Leader', [{ position: 1 }, { position: 1 }, { position: null }], true),
        createCompetitor('Challenger', [{ position: 2 }, { position: 2 }, { position: null }])
    ]
});

status = calculatePositionStatus(testState.competitors[0], 1);
assertEqual(status.status, 'ON_TRACK', 'P1 ON_TRACK when leading but races remain');

status = calculatePositionStatus(testState.competitors[1], 1);
assertEqual(status.status, 'ACHIEVABLE', 'P1 ACHIEVABLE when behind but can catch up');

resetTestState({
    championship: { scoring: [25, 18, 15], totalRounds: 3, countBest: 3 },
    competitors: [
        createCompetitor('Leader', [{ position: 1 }, { position: 1 }, { position: 1 }], false),
        createCompetitor('Challenger', [{ position: 2 }, { position: 2 }, { position: 2 }], true)
    ]
});

status = calculatePositionStatus(testState.competitors[1], 1);
assertEqual(status.status, 'NOT_POSSIBLE', 'P1 NOT_POSSIBLE when mathematically eliminated');

// TEST 5: WHAT'S NEEDED / SCENARIO CALCULATOR
console.log('\n--- Test 5: What\'s Needed Calculator ---\n');

resetTestState({
    championship: { scoring: [25, 18, 15, 12, 10], totalRounds: 3, countBest: 3 },
    competitors: [
        createCompetitor('Leader', [{ position: 1 }, { position: 2 }, { position: null }], true),
        createCompetitor('Challenger', [{ position: 2 }, { position: 1 }, { position: null }])
    ]
});

let scenarios = generateScenarios(testState.competitors[0], 1, [2]);
assert(scenarios.length > 0, 'Scenarios generated for single remaining race');

const p1Scenario = scenarios.find(s => s.results[0] === 1);
assertEqual(p1Scenario.myPoints, 68, 'P1 finish gives 68 total points');
assertEqual(p1Scenario.status, 'SAFE', 'P1 result is SAFE because rival can only get P2 (61 pts) when user takes P1');

const p3Scenario = scenarios.find(s => s.results[0] === 3);
assertEqual(p3Scenario.myPoints, 58, 'P3 finish gives 58 total points');

// TEST 6: SCENARIO TABLE ACCURACY
console.log('\n--- Test 6: Scenario Table Accuracy ---\n');

resetTestState({
    championship: { scoring: [25, 18, 15, 12, 10], totalRounds: 3, countBest: 3 },
    competitors: [
        createCompetitor('Me', [{ position: 1 }, { position: 1 }, { position: null }], true),
        createCompetitor('Rival', [{ position: 5 }, { position: 5 }, { position: null }])
    ]
});

scenarios = generateScenarios(testState.competitors[0], 1, [2]);
const allSafe = scenarios.every(s => s.status === 'SAFE');
assert(allSafe, 'All scenarios SAFE when min points > rival max');

resetTestState({
    championship: { scoring: [25, 18, 15, 12, 10], totalRounds: 3, countBest: 3 },
    competitors: [
        createCompetitor('Me', [{ position: 1 }, { position: 5 }, { position: null }], true),
        createCompetitor('Rival', [{ position: 2 }, { position: 2 }, { position: null }])
    ]
});

scenarios = generateScenarios(testState.competitors[0], 1, [2]);
const myP1 = scenarios.find(s => s.results[0] === 1);
assertEqual(myP1.status, 'SAFE', 'P1 result is SAFE because rival limited to P2 (54 pts) when user takes P1 (60 pts)');

// TEST 7: 20+ DRIVERS PERFORMANCE
console.log('\n--- Test 7: 20+ Drivers Performance ---\n');

resetTestState({
    championship: { scoring: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], totalRounds: 10, countBest: 8 },
    competitors: []
});

for (let i = 0; i < 25; i++) {
    const results = [];
    for (let r = 0; r < 10; r++) {
        const pos = ((i + r) % 20) + 1;
        results.push({ position: pos, fastestLap: r === 0 && i === 0 });
    }
    testState.competitors.push(createCompetitor(`Driver ${i + 1}`, results, i === 0));
}

const startTime = Date.now();
standings = calculateStandings();
const endTime = Date.now();

assertEqual(standings.length, 25, '25 drivers in standings');
assert(endTime - startTime < 100, `Standings calculation under 100ms (took ${endTime - startTime}ms)`);

const allHaveRanks = standings.every(s => s.rank >= 1 && s.rank <= 25);
assert(allHaveRanks, 'All 25 drivers have valid ranks');

// TEST 8: ALL DNF RACE
console.log('\n--- Test 8: All DNF Race ---\n');

resetTestState({
    championship: { scoring: [25, 18, 15], totalRounds: 3, countBest: 3 },
    competitors: [
        createCompetitor('Alice', [{ position: 1 }, { position: null }, { position: null }], true),
        createCompetitor('Bob', [{ position: null }, { position: null }, { position: null }])
    ]
});

standings = calculateStandings();
assertEqual(standings[0].totalPoints, 25, 'Alice has 25 points (1 race finish)');
assertEqual(standings[1].totalPoints, 0, 'Bob has 0 points (all DNF)');

resetTestState({
    championship: { scoring: [25, 18, 15], totalRounds: 3, countBest: 3 },
    competitors: [
        createCompetitor('Alice', [{ position: null }, { position: null }, { position: null }], true),
        createCompetitor('Bob', [{ position: null }, { position: null }, { position: null }])
    ]
});

standings = calculateStandings();
assertEqual(standings[0].totalPoints, 0, 'All DNF: First place has 0 points');
assertEqual(standings[1].totalPoints, 0, 'All DNF: Second place has 0 points');
assertEqual(standings[0].name, 'Alice', 'All DNF: Alphabetical tiebreaker - Alice first');

// TEST 9: POSITION STATUS TRANSITIONS
console.log('\n--- Test 9: Position Status Transitions ---\n');

resetTestState({
    championship: { scoring: [25, 18, 15], totalRounds: 5, countBest: 5 },
    competitors: [
        createCompetitor('Alice', [{ position: null }, { position: null }, { position: null }, { position: null }, { position: null }], true),
        createCompetitor('Bob', [{ position: null }, { position: null }, { position: null }, { position: null }, { position: null }])
    ]
});

status = calculatePositionStatus(testState.competitors[0], 1);
assertEqual(status.status, 'ON_TRACK', 'Start of championship: P1 is ON_TRACK (tied at 0)');

testState.competitors[0].results[0].position = 1;
testState.competitors[1].results[0].position = 2;

status = calculatePositionStatus(testState.competitors[0], 1);
assertEqual(status.status, 'ON_TRACK', 'After R1: Leader is ON_TRACK');

testState.competitors[0].results[1].position = 1;
testState.competitors[0].results[2].position = 1;
testState.competitors[0].results[3].position = 1;
testState.competitors[0].results[4].position = 1;
testState.competitors[1].results[1].position = 2;
testState.competitors[1].results[2].position = 2;
testState.competitors[1].results[3].position = 2;
testState.competitors[1].results[4].position = 2;

status = calculatePositionStatus(testState.competitors[0], 1);
assertEqual(status.status, 'GUARANTEED', 'Championship over: Leader has GUARANTEED P1');

status = calculatePositionStatus(testState.competitors[1], 1);
assertEqual(status.status, 'NOT_POSSIBLE', 'Championship over: Challenger NOT_POSSIBLE');

// TEST 10: EDGE CASES
console.log('\n--- Test 10: Edge Cases ---\n');

resetTestState({
    championship: { scoring: [25, 18], totalRounds: 2, countBest: 2 },
    competitors: [
        createCompetitor('Alice', [{ position: 1 }, { position: 2 }], true),
        createCompetitor('Bob', [{ position: 2 }, { position: 1 }])
    ]
});

standings = calculateStandings();
assertEqual(standings.length, 2, 'Minimum 2 drivers works correctly');
assertEqual(standings[0].totalPoints, 43, 'Tied points: 43');

resetTestState({
    championship: { scoring: [25, 18, 15, 12, 10], totalRounds: 50, countBest: 50 },
    competitors: [createCompetitor('Marathoner', Array(50).fill({ position: 1 }), true)]
});

standings = calculateStandings();
assertEqual(standings[0].totalPoints, 1250, '50 races at P1 = 1250 points');

resetTestState({
    championship: { scoring: [25, 18, 15], totalRounds: 3, countBest: 5 },
    competitors: [createCompetitor('Test', [{ position: 1 }, { position: 2 }, { position: 3 }], true)]
});

standings = calculateStandings();
assertEqual(standings[0].totalPoints, 58, 'Count best > total: uses all available races');

resetTestState({
    championship: { scoring: [25, 18, 15], totalRounds: 1, countBest: 1 },
    competitors: [
        createCompetitor('Winner', [{ position: 1 }], true),
        createCompetitor('Second', [{ position: 2 }])
    ]
});

standings = calculateStandings();
assertEqual(standings[0].name, 'Winner', 'Single race: winner determined');

status = calculatePositionStatus(testState.competitors[0], 1);
assertEqual(status.status, 'GUARANTEED', 'Single race completed: GUARANTEED');

resetTestState({
    championship: { scoring: [25, 18, 15], totalRounds: 3, countBest: 3, flEnabled: true, flBonus: 1 },
    competitors: [
        createCompetitor('Speedy', [
            { position: 1, fastestLap: true },
            { position: 1, fastestLap: false },
            { position: 1, fastestLap: true }
        ], true)
    ]
});

standings = calculateStandings();
assertEqual(standings[0].totalPoints, 77, 'FL bonus: 26+25+26 = 77 points');

testState.championship.flEnabled = false;
standings = calculateStandings();
assertEqual(standings[0].totalPoints, 75, 'FL disabled: 25+25+25 = 75 points');

// ==========================================
// SUMMARY
// ==========================================

console.log('\n========================================');
console.log('  TEST SUMMARY');
console.log('========================================\n');

console.log(`  PASSED: ${testResults.passed}`);
console.log(`  FAILED: ${testResults.failed}`);
console.log(`  TOTAL:  ${testResults.passed + testResults.failed}`);

if (testResults.failed > 0) {
    console.log('\n--- FAILED TESTS ---\n');
    testResults.tests.filter(t => !t.passed).forEach(test => {
        console.log(`  - ${test.name}`);
        if (test.details) console.log(`    ${test.details}`);
    });
}

if (bugs.length > 0) {
    console.log('\n--- BUGS FOUND ---\n');
    bugs.forEach((bug, i) => {
        console.log(`  ${i + 1}. ${bug.title} [${bug.severity}]`);
        console.log(`     ${bug.description}`);
    });
}

console.log('\n========================================\n');

// Exit with error code if tests failed
process.exit(testResults.failed > 0 ? 1 : 0);
