// content.js - SimGrid to RaceStand Importer
// Injects an import button on SimGrid standings pages

(function() {
  'use strict';

  /**
   * Checks if current URL is a standings page.
   * @returns {boolean}
   */
  function isStandingsPage() {
    return /\/championships\/\d+\/standings/.test(window.location.pathname);
  }

  /**
   * Default F1 2010+ scoring system.
   * Points awarded by position: P1=25, P2=18, P3=15, etc.
   */
  const DEFAULT_SCORING = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

  /**
   * Default fastest lap bonus points.
   */
  const DEFAULT_FL_BONUS = 1;

  /**
   * Default target position (championship win).
   */
  const DEFAULT_TARGET_POSITION = 1;

  /**
   * Extracts the championship ID from the current URL.
   * URL format: https://www.thesimgrid.com/championships/{id}/standings
   * @returns {string|null} The championship ID or null if not found
   */
  function extractChampionshipId() {
    const url = window.location.href;
    const match = url.match(/\/championships\/(\d+)/);

    if (match && match[1]) {
      console.log('[RaceStand] Extracted championship ID:', match[1]);
      return match[1];
    }

    console.warn('[RaceStand] Could not extract championship ID from URL:', url);
    return null;
  }

  /**
   * Fetches the scoring page and extracts the points table.
   * @param {string} championshipId - The championship ID
   * @returns {Promise<{scoring: number[], flBonus: number}|null>} Scoring data or null on failure
   */
  async function fetchScoringData(championshipId) {
    const url = `https://www.thesimgrid.com/championships/${championshipId}/scoring`;
    console.log('[RaceStand] Fetching scoring data from:', url);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error('[RaceStand] Scoring page fetch failed:', response.status, response.statusText);
        return null;
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Look for scoring tables - SimGrid typically has tables with position and points columns
      const tables = doc.querySelectorAll('table');
      let scoringArray = [];
      let flBonus = DEFAULT_FL_BONUS;

      for (const table of tables) {
        const rows = table.querySelectorAll('tbody tr');

        for (const row of rows) {
          const cells = row.querySelectorAll('td');

          // Look for rows that have position info (P1, P2, 1st, 2nd, etc.) and points
          if (cells.length >= 2) {
            const firstCellText = cells[0].textContent.trim();

            // Check for fastest lap row
            if (/fastest\s*lap|FL|bonus/i.test(firstCellText)) {
              // Extract fastest lap bonus points
              for (let i = 1; i < cells.length; i++) {
                const points = parseInt(cells[i].textContent.trim(), 10);
                if (!isNaN(points) && points > 0) {
                  flBonus = points;
                  console.log('[RaceStand] Found fastest lap bonus:', flBonus);
                  break;
                }
              }
              continue;
            }

            // Try to extract position number
            const positionMatch = firstCellText.match(/^(?:P)?(\d+)(?:st|nd|rd|th)?$/i);
            if (positionMatch) {
              const position = parseInt(positionMatch[1], 10);

              // Look for points in the remaining cells
              for (let i = 1; i < cells.length; i++) {
                const pointsText = cells[i].textContent.trim();
                const points = parseInt(pointsText, 10);

                if (!isNaN(points)) {
                  // Ensure array is large enough
                  while (scoringArray.length < position) {
                    scoringArray.push(0);
                  }
                  scoringArray[position - 1] = points;
                  break;
                }
              }
            }
          }
        }
      }

      // Alternative: Look for definition lists or other structures
      if (scoringArray.length === 0) {
        // Try looking for elements with position and points data
        const positionElements = doc.querySelectorAll('[class*="position"], [class*="scoring"], [class*="points"]');

        positionElements.forEach(el => {
          const text = el.textContent.trim();
          // Match patterns like "P1: 25" or "1st - 25 points"
          const match = text.match(/(?:P)?(\d+)(?:st|nd|rd|th)?[:\s-]+(\d+)/i);
          if (match) {
            const position = parseInt(match[1], 10);
            const points = parseInt(match[2], 10);

            while (scoringArray.length < position) {
              scoringArray.push(0);
            }
            scoringArray[position - 1] = points;
          }
        });
      }

      // Also try to parse from plain text patterns in the page
      if (scoringArray.length === 0) {
        const pageText = doc.body.textContent || '';

        // Look for patterns like "1st: 25", "P1 = 25", "Position 1: 25 points"
        const patterns = [
          /(?:P|Position\s*)?(\d+)(?:st|nd|rd|th)?[:\s=]+(\d+)\s*(?:pts?|points?)?/gi,
        ];

        for (const pattern of patterns) {
          let match;
          while ((match = pattern.exec(pageText)) !== null) {
            const position = parseInt(match[1], 10);
            const points = parseInt(match[2], 10);

            if (position > 0 && position <= 50 && points >= 0) {
              while (scoringArray.length < position) {
                scoringArray.push(0);
              }
              if (scoringArray[position - 1] === 0 || scoringArray[position - 1] === undefined) {
                scoringArray[position - 1] = points;
              }
            }
          }
        }
      }

      // Remove trailing zeros
      while (scoringArray.length > 0 && scoringArray[scoringArray.length - 1] === 0) {
        scoringArray.pop();
      }

      if (scoringArray.length > 0) {
        console.log('[RaceStand] Extracted scoring from scoring page:', scoringArray);
        console.log('[RaceStand] Fastest lap bonus:', flBonus);
        return { scoring: scoringArray, flBonus: flBonus };
      }

      console.warn('[RaceStand] Could not parse scoring table from scoring page');
      return null;

    } catch (e) {
      console.error('[RaceStand] Failed to fetch scoring:', e);
      return null;
    }
  }

  /**
   * Fetches the races page and extracts the total number of races.
   * @param {string} championshipId - The championship ID
   * @returns {Promise<number|null>} Total race count or null on failure
   */
  async function fetchRacesData(championshipId) {
    const url = `https://www.thesimgrid.com/championships/${championshipId}/races`;
    console.log('[RaceStand] Fetching races data from:', url);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error('[RaceStand] Races page fetch failed:', response.status, response.statusText);
        return null;
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Debug: Log what we find
      console.log('[RaceStand] Races page loaded, analyzing structure...');

      // Collect all detection results for comparison
      const detectionResults = {};

      // Method 0 (PRIORITY): Look for round/race headers - most reliable for total scheduled races
      // Extract unique round numbers to avoid counting duplicates (e.g., "Round 1", "R1 - Spa", "R1 - Spa")
      const roundElements = doc.querySelectorAll('[class*="round"], h2, h3, h4, h5');
      const uniqueRoundNumbers = new Set();
      const foundRounds = [];
      roundElements.forEach(el => {
        const text = el.textContent.trim();
        // Match "Round 1", "R1", "Race 1" etc. and extract the number
        const roundMatch = text.match(/^(?:Round\s*|R|Race\s*)(\d+)/i);
        if (roundMatch) {
          const roundNum = parseInt(roundMatch[1], 10);
          if (!uniqueRoundNumbers.has(roundNum)) {
            uniqueRoundNumbers.add(roundNum);
            foundRounds.push(text.substring(0, 30));
          }
        }
      });

      if (uniqueRoundNumbers.size > 0) {
        console.log('[RaceStand] Found', uniqueRoundNumbers.size, 'unique rounds:', foundRounds);
        detectionResults.roundHeaders = uniqueRoundNumbers.size;
        return uniqueRoundNumbers.size;
      }

      // Method 1: Count race entries in a table
      const raceTables = doc.querySelectorAll('table');
      for (const table of raceTables) {
        const rows = table.querySelectorAll('tbody tr');
        if (rows.length > 0) {
          // Check if this looks like a races table
          const firstRow = rows[0];
          const hasRaceLink = firstRow.querySelector('a[href*="/races/"], a[href*="race"]');
          const hasDateInfo = firstRow.textContent.match(/\d{1,2}[\/\-]\d{1,2}|\w+\s+\d{1,2}/);

          if (hasRaceLink || hasDateInfo) {
            console.log('[RaceStand] Found races table with', rows.length, 'races');
            return rows.length;
          }
        }
      }

      // Method 2: Count race cards/items
      const raceCards = doc.querySelectorAll('[class*="race-card"], [class*="race-item"], [class*="event-card"], .race, .event');
      if (raceCards.length > 0) {
        console.log('[RaceStand] Found', raceCards.length, 'race cards');
        return raceCards.length;
      }

      // Method 3: Count links to individual races
      const raceLinks = doc.querySelectorAll('a[href*="/races/"]');
      // Filter to unique race IDs
      const uniqueRaceIds = new Set();
      raceLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        const raceIdMatch = href.match(/\/races\/(\d+)/);
        if (raceIdMatch) {
          uniqueRaceIds.add(raceIdMatch[1]);
        }
      });

      if (uniqueRaceIds.size > 0) {
        console.log('[RaceStand] Found', uniqueRaceIds.size, 'unique race links');
        return uniqueRaceIds.size;
      }

      // Method 4: (moved to Method 0 at the top - round headers are most reliable)

      // Method 5: Count any list items that might be races
      const listItems = doc.querySelectorAll('ul li, ol li');
      let raceListItems = 0;
      listItems.forEach(li => {
        const text = li.textContent.trim();
        // Look for track names or race indicators
        if (li.querySelector('a[href*="race"]') || /round|race|gp|grand\s*prix/i.test(text)) {
          raceListItems++;
        }
      });

      if (raceListItems > 0) {
        console.log('[RaceStand] Found', raceListItems, 'race list items');
        return raceListItems;
      }

      // Method 6: Look for any elements with race numbers in text
      const allText = doc.body.textContent;
      const raceMatches = allText.match(/R\d+\s*[-–:]/g);
      if (raceMatches) {
        const uniqueRaces = new Set(raceMatches.map(m => m.match(/R(\d+)/)[1]));
        console.log('[RaceStand] Found races from text pattern:', uniqueRaces.size, Array.from(uniqueRaces));
        return uniqueRaces.size;
      }

      // Method 7: Count elements that contain track names (common in race lists)
      const trackPatterns = /Spa|Monza|Silverstone|Nurburgring|Imola|Brands|Zandvoort|Barcelona|Hungaroring|Suzuka|Interlagos|Monaco|Le Mans|Daytona|Sebring|Road America|Watkins/gi;
      const trackMatches = allText.match(trackPatterns);
      if (trackMatches) {
        // Count unique tracks
        const uniqueTracks = new Set(trackMatches.map(t => t.toLowerCase()));
        console.log('[RaceStand] Found tracks:', uniqueTracks.size, Array.from(uniqueTracks));
        if (uniqueTracks.size > 0) {
          return uniqueTracks.size;
        }
      }

      // Debug: show page structure
      console.log('[RaceStand] Page title:', doc.title);
      console.log('[RaceStand] Tables found:', doc.querySelectorAll('table').length);
      console.log('[RaceStand] Links with /races/:', doc.querySelectorAll('a[href*="/races/"]').length);

      console.warn('[RaceStand] Could not determine race count from races page');
      return null;

    } catch (e) {
      console.error('[RaceStand] Failed to fetch races:', e);
      return null;
    }
  }

  /**
   * Extracts the championship name from the page header.
   * Looks for the h1.event-title element on SimGrid championship pages.
   * @returns {string} The championship name, or empty string if not found.
   */
  function extractChampionshipName() {
    // Primary selector: h1 with class "event-title"
    const titleElement = document.querySelector('h1.event-title');

    if (titleElement) {
      // Get text content and clean it up
      let name = titleElement.textContent || '';

      // Trim whitespace and normalize internal spaces
      name = name.trim().replace(/\s+/g, ' ');

      // Remove emoji/flag characters (Unicode ranges for emojis and regional indicators)
      // This regex removes:
      // - Emoji symbols (U+1F300-U+1F9FF)
      // - Regional indicator symbols (U+1F1E0-U+1F1FF) used for flags
      // - Miscellaneous symbols (U+2600-U+26FF)
      // - Dingbats (U+2700-U+27BF)
      // - Variation selectors (U+FE00-U+FE0F)
      name = name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]/gu, '');

      // Clean up any extra whitespace that might have been left after emoji removal
      name = name.trim().replace(/\s+/g, ' ');

      console.log('[RaceStand] Extracted championship name:', name);
      return name;
    }

    // Fallback: try to get the name from the page title
    const pageTitle = document.title || '';
    if (pageTitle.includes('|')) {
      // SimGrid titles are formatted as "Championship Name | SimGrid"
      let name = pageTitle.split('|')[0].trim();
      // Apply the same cleaning
      name = name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]/gu, '');
      name = name.trim().replace(/\s+/g, ' ');

      if (name) {
        console.log('[RaceStand] Extracted championship name from page title:', name);
        return name;
      }
    }

    // Fallback: try meta tags
    const metaTitle = document.querySelector('meta[property="og:title"]');
    if (metaTitle) {
      let name = metaTitle.getAttribute('content') || '';
      // Remove " on SimGrid" suffix if present
      name = name.replace(/\s+on\s+SimGrid$/i, '');
      name = name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]/gu, '');
      name = name.trim().replace(/\s+/g, ' ');

      if (name) {
        console.log('[RaceStand] Extracted championship name from meta tag:', name);
        return name;
      }
    }

    console.warn('[RaceStand] Could not find championship name on page');
    return '';
  }

  /**
   * Extracts the total number of race rounds from the standings table.
   * Counts the number of race columns (R1, R2, R3, etc.) in the table header.
   * Race columns are identified by <th> elements containing links with "results?race_id=" in their href.
   * @returns {number} The total number of rounds, or 0 if table not found.
   */
  function extractTotalRounds() {
    const standingsTable = document.querySelector('table.table-results');

    if (!standingsTable) {
      console.warn('[RaceStand] Could not find standings table for round count');
      return 0;
    }

    // Find all header cells that contain race result links
    // Race columns have <a> tags with href containing "results?race_id="
    const thead = standingsTable.querySelector('thead');
    if (!thead) {
      console.warn('[RaceStand] Could not find table header');
      return 0;
    }

    // Count <th> elements that contain race links
    const raceHeaders = thead.querySelectorAll('th a[href*="results?race_id="]');
    const totalRounds = raceHeaders.length;

    console.log('[RaceStand] Extracted total rounds from standings:', totalRounds);
    return totalRounds;
  }

  /**
   * Parses a race result cell text into a position number.
   * Handles various formats: "1", "P1", "DNS", "DNF", "DSQ", em dashes, etc.
   * @param {string} text - The text content of the result cell
   * @returns {number|null} The position as a number, or null for non-finishes
   */
  function parsePosition(text) {
    if (!text) {
      return null;
    }

    // Trim and normalize the text
    const normalized = text.trim().toUpperCase();

    // Handle empty or dash results (future races, no result)
    if (normalized === '' || normalized === '—' || normalized === '-' || normalized === '–') {
      return null;
    }

    // Handle non-finish statuses
    if (normalized === 'DNS' || normalized === 'DNF' || normalized === 'DSQ' || normalized === 'NC') {
      return null;
    }

    // Try to extract a number, handling "P1", "P2", etc. format
    const numberMatch = normalized.match(/P?(\d+)/);
    if (numberMatch) {
      return parseInt(numberMatch[1], 10);
    }

    // If we couldn't parse it, return null
    return null;
  }

  /**
   * Common points systems used in SimGrid championships.
   * Maps position to base points (without fastest lap bonus).
   * We use multiple common systems to detect fastest lap bonuses.
   */
  const POINTS_SYSTEMS = {
    // F1 2010+ style (25 points for P1)
    f1Modern: {
      1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
      6: 8, 7: 6, 8: 4, 9: 2, 10: 1
    },
    // ACC/SimGrid common (25/20)
    acc25: {
      1: 25, 2: 20, 3: 16, 4: 13, 5: 11,
      6: 9, 7: 7, 8: 5, 9: 3, 10: 1
    },
    // Simple descending (25/24/23...)
    descending: {
      1: 25, 2: 24, 3: 23, 4: 22, 5: 21,
      6: 20, 7: 19, 8: 18, 9: 17, 10: 16
    }
  };

  /**
   * Detects if fastest lap data is available on the current championship page.
   * SimGrid championships may or may not award fastest lap bonus points.
   *
   * Detection methods:
   * 1. Look for any fastest lap related text/elements on the page
   * 2. Check if any race results show bonus points patterns (+1 over expected)
   *
   * @returns {boolean} True if fastest lap data appears to be enabled for this championship
   */
  function extractFastestLapEnabled() {
    // Method 1: Check for explicit fastest lap mentions on the page
    // This could appear in championship rules or notes
    const pageText = document.body.textContent || '';
    const hasFLMention = /fastest\s*lap|FL\s*bonus|bonus\s*point/i.test(pageText);

    if (hasFLMention) {
      console.log('[RaceStand] Fastest lap enabled: found FL mention in page text');
      return true;
    }

    // Method 2: Analyze points to detect +1 bonus pattern
    // If we see points that are exactly 1 higher than standard for a position,
    // it's likely a fastest lap bonus
    const standingsTable = document.querySelector('table.table-results');
    if (!standingsTable) {
      console.log('[RaceStand] Fastest lap detection: no standings table found');
      return false;
    }

    const tbody = standingsTable.querySelector('tbody');
    if (!tbody) {
      return false;
    }

    // Collect position-points pairs from all race results
    const positionPointsPairs = [];
    const rows = tbody.querySelectorAll('tr');

    // Find race column indices
    const thead = standingsTable.querySelector('thead');
    const headerCells = thead ? thead.querySelectorAll('th') : [];
    const raceColumnIndices = [];

    headerCells.forEach((th, index) => {
      const raceLink = th.querySelector('a[href*="results?race_id="]');
      if (raceLink) {
        raceColumnIndices.push(index);
      }
    });

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');

      raceColumnIndices.forEach(colIndex => {
        const cell = cells[colIndex];
        if (!cell) return;

        const positionSpan = cell.querySelector('span.show_positions');
        const pointsSpan = cell.querySelector('span.show_points');

        if (positionSpan && pointsSpan) {
          const position = parsePosition(positionSpan.textContent);
          const points = parseInt(pointsSpan.textContent.trim(), 10);

          if (position && !isNaN(points) && position <= 10) {
            positionPointsPairs.push({ position, points });
          }
        }
      });
    });

    // Check if any points are +1 higher than expected in any points system
    // This indicates a fastest lap bonus
    for (const pair of positionPointsPairs) {
      const { position, points } = pair;

      for (const systemName in POINTS_SYSTEMS) {
        const system = POINTS_SYSTEMS[systemName];
        const basePoints = system[position];

        if (basePoints !== undefined && points === basePoints + 1) {
          console.log(`[RaceStand] Fastest lap enabled: detected +1 bonus (P${position}: ${points} pts vs base ${basePoints})`);
          return true;
        }
      }
    }

    console.log('[RaceStand] Fastest lap not detected for this championship');
    return false;
  }

  /**
   * Detects the points system used by comparing actual points with known systems.
   * @param {Array} positionPointsPairs - Array of {position, points} objects
   * @returns {Object|null} The detected points system or null
   */
  function detectPointsSystem(positionPointsPairs) {
    // Count matches for each system
    const matchCounts = {};

    for (const systemName in POINTS_SYSTEMS) {
      matchCounts[systemName] = 0;
      const system = POINTS_SYSTEMS[systemName];

      for (const pair of positionPointsPairs) {
        const { position, points } = pair;
        const basePoints = system[position];

        // Match if points equals base or base+1 (with FL bonus)
        if (basePoints !== undefined && (points === basePoints || points === basePoints + 1)) {
          matchCounts[systemName]++;
        }
      }
    }

    // Return the system with most matches
    let bestSystem = null;
    let bestCount = 0;

    for (const systemName in matchCounts) {
      if (matchCounts[systemName] > bestCount) {
        bestCount = matchCounts[systemName];
        bestSystem = systemName;
      }
    }

    return bestSystem ? POINTS_SYSTEMS[bestSystem] : null;
  }

  /**
   * Extracts competitor/driver names and their race results from the standings table.
   * Also detects fastest lap for each race result when FL data is available.
   * @param {number[]|null} scoringTable - The actual scoring table from /scoring page (optional)
   * @param {number|null} flBonus - The fastest lap bonus points (optional, default 1)
   * @returns {Array<{name: string, isMyDriver: boolean, results: Array<{position: number|null, fastestLap: boolean}>}>} Array of competitor objects
   */
  function extractCompetitors(scoringTable = null, flBonus = 1) {
    const competitors = [];

    // Find the standings table - SimGrid uses table.table-results for standings
    const standingsTable = document.querySelector('table.table-results');

    if (!standingsTable) {
      console.warn('[RaceStand] Could not find standings table on page');
      return competitors;
    }

    // First, identify the column indices for race results
    // We need to find which columns contain race data
    const thead = standingsTable.querySelector('thead');
    const tbody = standingsTable.querySelector('tbody');

    if (!thead || !tbody) {
      console.warn('[RaceStand] Could not find table header or body');
      return competitors;
    }

    // Find the race column indices by looking at header cells
    const headerCells = thead.querySelectorAll('th');
    const raceColumnIndices = [];

    headerCells.forEach((th, index) => {
      // Check if this header contains a race results link
      const raceLink = th.querySelector('a[href*="results?race_id="]');
      if (raceLink) {
        raceColumnIndices.push(index);
      }
    });

    console.log('[RaceStand] Found race columns at indices:', raceColumnIndices);

    // Regex to remove emoji/flag characters (same as used in extractChampionshipName)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1FA00}-\u{1FAFF}]|[\u{1F000}-\u{1F02F}]/gu;

    // First pass: collect all position-points data for fastest lap detection
    const allRaceData = []; // Array of arrays, one per race
    raceColumnIndices.forEach(() => allRaceData.push([]));

    const rows = tbody.querySelectorAll('tr');

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');

      raceColumnIndices.forEach((colIndex, raceIndex) => {
        const cell = cells[colIndex];
        if (!cell) return;

        const positionSpan = cell.querySelector('span.show_positions');
        const pointsSpan = cell.querySelector('span.show_points');

        if (positionSpan && pointsSpan) {
          const position = parsePosition(positionSpan.textContent);
          const points = parseInt(pointsSpan.textContent.trim(), 10);

          if (position && !isNaN(points)) {
            allRaceData[raceIndex].push({ position, points, row });
          }
        }
      });
    });

    // For each race, find who got the fastest lap
    // If we have actual scoring table, use it; otherwise fall back to detection
    const fastestLapDriversByRace = []; // Array of row elements, one per race
    const actualFlBonus = flBonus || 1;

    if (scoringTable && scoringTable.length > 0) {
      // Use the actual scoring table to detect FL
      console.log('[RaceStand] Using fetched scoring table for FL detection:', scoringTable);
      console.log('[RaceStand] FL bonus:', actualFlBonus);

      raceColumnIndices.forEach((colIndex, raceIndex) => {
        let flDriver = null;

        for (const data of allRaceData[raceIndex]) {
          // Get expected points for this position from scoring table
          const expectedPoints = scoringTable[data.position - 1];

          if (expectedPoints !== undefined) {
            // Check if actual points = expected + FL bonus
            if (data.points === expectedPoints + actualFlBonus) {
              flDriver = data.row;
              console.log(`[RaceStand] Race ${raceIndex + 1}: FL detected - P${data.position} got ${data.points} pts (expected ${expectedPoints}, bonus ${actualFlBonus})`);
              break;
            }
          }
        }

        fastestLapDriversByRace.push(flDriver);
      });
    } else {
      // Fallback: detect points system from the data
      console.log('[RaceStand] No scoring table provided, falling back to points system detection');
      const allPairs = allRaceData.flat().map(d => ({ position: d.position, points: d.points }));
      const detectedSystem = detectPointsSystem(allPairs);

      console.log('[RaceStand] Detected points system:', detectedSystem ? 'found' : 'unknown');

      if (detectedSystem) {
        raceColumnIndices.forEach((colIndex, raceIndex) => {
          let flDriver = null;

          for (const data of allRaceData[raceIndex]) {
            const basePoints = detectedSystem[data.position];

            // Only top 10 can get FL bonus in most systems
            if (basePoints !== undefined && data.position <= 10) {
              if (data.points === basePoints + 1) {
                flDriver = data.row;
                break;
              }
            }
          }

          fastestLapDriversByRace.push(flDriver);
        });
      } else {
        // No points system detected, fill with nulls
        raceColumnIndices.forEach(() => fastestLapDriversByRace.push(null));
      }
    }

    // Second pass: extract competitor data with fastest lap info
    rows.forEach((row) => {
      // Find the driver name element in this row
      const nameElement = row.querySelector('a.entrant-name');

      if (!nameElement) {
        // Skip rows without a driver name (could be headers or separators)
        return;
      }

      // Extract and clean the driver name
      let name = nameElement.textContent || '';
      name = name.replace(emojiRegex, '');
      name = name.trim().replace(/\s+/g, ' ');

      // Remove trailing iRating numbers (e.g., "2,937" or "3140")
      // These appear after the driver name on SimGrid
      name = name.replace(/\s+[\d,]+$/, '');
      name = name.trim();

      if (!name) {
        return;
      }

      // Extract race results for this driver
      const results = [];
      const cells = row.querySelectorAll('td');

      raceColumnIndices.forEach((colIndex, raceIndex) => {
        const cell = cells[colIndex];
        let position = null;
        let fastestLap = false;

        if (cell) {
          // Look for the show_positions span which contains the displayed position
          const positionSpan = cell.querySelector('span.show_positions');

          if (positionSpan) {
            // Get the text content, which could be a number, "DNS", "DNF", or em dash
            const positionText = positionSpan.textContent || '';
            position = parsePosition(positionText);
          } else {
            // Fallback: try to get text directly from cell
            const cellText = cell.textContent || '';
            position = parsePosition(cellText);
          }

          // Check if this driver got fastest lap for this race
          // Only drivers in top 10 with a valid position can have FL
          if (position && position <= 10 && fastestLapDriversByRace[raceIndex] === row) {
            fastestLap = true;
          }
        }

        results.push({
          position: position,
          fastestLap: fastestLap
        });
      });

      competitors.push({
        name: name,
        isMyDriver: false,
        results: results
      });
    });

    console.log('[RaceStand] Extracted', competitors.length, 'competitors with race results');

    // Log fastest lap summary
    const flSummary = [];
    raceColumnIndices.forEach((_, raceIndex) => {
      const flRow = fastestLapDriversByRace[raceIndex];
      if (flRow) {
        const nameEl = flRow.querySelector('a.entrant-name');
        const name = nameEl ? nameEl.textContent.replace(emojiRegex, '').trim().replace(/\s+[\d,]+$/, '').trim() : 'Unknown';
        flSummary.push(`R${raceIndex + 1}: ${name}`);
      } else {
        flSummary.push(`R${raceIndex + 1}: none detected`);
      }
    });
    console.log('[RaceStand] Fastest lap by race:', flSummary.join(', '));

    return competitors;
  }

  /**
   * Validates the extracted championship data to ensure all required fields are present.
   * @param {Object} data - The extracted championship data object
   * @returns {{valid: boolean, errors: string[]}} Validation result with any error messages
   */
  function validateChampionshipData(data) {
    const errors = [];

    // Validate championship object
    if (!data.championship) {
      errors.push('Missing championship object');
    } else {
      // Required: name
      if (!data.championship.name || typeof data.championship.name !== 'string' || data.championship.name.trim() === '') {
        errors.push('Championship name is required and must be a non-empty string');
      }

      // Required: scoring
      if (!Array.isArray(data.championship.scoring) || data.championship.scoring.length === 0) {
        errors.push('Scoring must be a non-empty array of numbers');
      } else if (!data.championship.scoring.every(s => typeof s === 'number' && s >= 0)) {
        errors.push('Scoring array must contain only non-negative numbers');
      }

      // Required: totalRounds
      if (typeof data.championship.totalRounds !== 'number' || data.championship.totalRounds < 1) {
        errors.push('Total rounds must be a number >= 1');
      }

      // Optional but validate if present: countBest
      if (data.championship.countBest !== undefined) {
        if (typeof data.championship.countBest !== 'number' || data.championship.countBest < 1) {
          errors.push('countBest must be a number >= 1');
        } else if (data.championship.countBest > data.championship.totalRounds) {
          errors.push('countBest cannot exceed totalRounds');
        }
      }

      // Optional but validate if present: flEnabled
      if (data.championship.flEnabled !== undefined && typeof data.championship.flEnabled !== 'boolean') {
        errors.push('flEnabled must be a boolean');
      }

      // Optional but validate if present: flBonus
      if (data.championship.flBonus !== undefined) {
        if (typeof data.championship.flBonus !== 'number' || data.championship.flBonus < 0) {
          errors.push('flBonus must be a non-negative number');
        }
      }

      // Optional but validate if present: targetPosition
      if (data.championship.targetPosition !== undefined) {
        if (typeof data.championship.targetPosition !== 'number' || data.championship.targetPosition < 1) {
          errors.push('targetPosition must be a number >= 1');
        }
      }
    }

    // Validate competitors array
    if (!Array.isArray(data.competitors)) {
      errors.push('Competitors must be an array');
    } else if (data.competitors.length === 0) {
      errors.push('At least one competitor is required');
    } else {
      // Validate each competitor
      data.competitors.forEach((competitor, index) => {
        // Required: name
        if (!competitor.name || typeof competitor.name !== 'string' || competitor.name.trim() === '') {
          errors.push(`Competitor ${index + 1}: name is required and must be a non-empty string`);
        }

        // Optional but validate if present: isMyDriver
        if (competitor.isMyDriver !== undefined && typeof competitor.isMyDriver !== 'boolean') {
          errors.push(`Competitor ${index + 1}: isMyDriver must be a boolean`);
        }

        // Required: results array
        if (!Array.isArray(competitor.results)) {
          errors.push(`Competitor ${index + 1}: results must be an array`);
        } else {
          // Check results length matches totalRounds
          if (data.championship && competitor.results.length !== data.championship.totalRounds) {
            errors.push(`Competitor ${index + 1}: results length (${competitor.results.length}) does not match totalRounds (${data.championship.totalRounds})`);
          }

          // Validate each result
          competitor.results.forEach((result, resultIndex) => {
            // position: number or null
            if (result.position !== null && (typeof result.position !== 'number' || result.position < 1)) {
              errors.push(`Competitor ${index + 1}, Result ${resultIndex + 1}: position must be a positive number or null`);
            }

            // fastestLap: boolean
            if (typeof result.fastestLap !== 'boolean') {
              errors.push(`Competitor ${index + 1}, Result ${resultIndex + 1}: fastestLap must be a boolean`);
            }
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Extracts complete championship data from the SimGrid page and formats it
   * according to the RaceStand import schema.
   *
   * This function combines all individual extraction functions and assembles
   * the complete data structure with default values for configuration.
   *
   * @param {Object} options - Optional overrides for scoring and total rounds
   * @param {number[]|null} options.scoring - Override scoring array from fetched data
   * @param {number|null} options.totalRoundsFromRacesPage - Override total rounds from fetched data
   * @param {number|null} options.flBonus - Override fastest lap bonus from fetched data
   * @returns {{data: Object|null, validation: {valid: boolean, errors: string[]}}}
   *          The extracted data object and validation result
   */
  function extractChampionshipData(options = {}) {
    console.log('[RaceStand] Starting complete data extraction...');

    // Extract individual data components
    const championshipName = extractChampionshipName();
    const totalRoundsFromStandings = extractTotalRounds();
    const fastestLapEnabled = extractFastestLapEnabled();

    // Pass scoring data to extractCompetitors for accurate FL detection
    const competitors = extractCompetitors(options.scoring, options.flBonus);

    // Use fetched data if available, otherwise fall back to defaults/detected values
    const scoring = options.scoring || DEFAULT_SCORING;
    const flBonus = options.flBonus !== undefined && options.flBonus !== null ? options.flBonus : DEFAULT_FL_BONUS;

    // For total rounds: prefer fetched data, then standings data
    let totalRounds = totalRoundsFromStandings;
    if (options.totalRoundsFromRacesPage && options.totalRoundsFromRacesPage > 0) {
      // Use the larger value - races page might show all scheduled races including future ones
      totalRounds = Math.max(totalRoundsFromStandings, options.totalRoundsFromRacesPage);
      console.log('[RaceStand] Using total rounds:', totalRounds,
        `(standings: ${totalRoundsFromStandings}, races page: ${options.totalRoundsFromRacesPage})`);
    }

    // Pad competitor results to match totalRounds (for future/unrun races)
    const paddedCompetitors = competitors.map(comp => {
      const currentLength = comp.results.length;
      if (currentLength < totalRounds) {
        // Pad with empty results for future races
        const paddedResults = [...comp.results];
        for (let i = currentLength; i < totalRounds; i++) {
          paddedResults.push({ position: null, fastestLap: false });
        }
        return { ...comp, results: paddedResults };
      }
      return comp;
    });

    if (competitors.length > 0 && competitors[0].results.length < totalRounds) {
      console.log(`[RaceStand] Padded results from ${competitors[0].results.length} to ${totalRounds} races`);
    }

    // Build the complete data structure matching RaceStand import schema
    const data = {
      championship: {
        // Required fields
        name: championshipName,
        scoring: scoring,
        totalRounds: totalRounds,

        // Optional fields with defaults
        countBest: totalRounds,           // No drop rounds by default
        flEnabled: fastestLapEnabled,
        flBonus: flBonus,
        targetPosition: DEFAULT_TARGET_POSITION
      },
      competitors: paddedCompetitors
    };

    // Validate the extracted data
    const validation = validateChampionshipData(data);

    // Log validation results
    if (validation.valid) {
      console.log('[RaceStand] Data validation passed');
    } else {
      console.warn('[RaceStand] Data validation failed with errors:', validation.errors);
    }

    return {
      data: validation.valid ? data : null,
      validation: validation
    };
  }

  /**
   * Compresses championship data for URL transfer using LZString.
   * The compressed output is safe to use in URL parameters.
   *
   * @param {Object} data - The championship data object to compress
   * @returns {string} The compressed string safe for URL parameters
   */
  function compressData(data) {
    // Convert the data object to a JSON string
    const jsonString = JSON.stringify(data);

    // Compress the JSON string using LZString's URI-safe encoding
    // This uses a character set that is safe for URLs without additional encoding
    const compressed = LZString.compressToEncodedURIComponent(jsonString);

    // Log compression statistics
    console.log('[RaceStand] Compression Statistics:');
    console.log('  Original size:', jsonString.length, 'bytes');
    console.log('  Compressed size:', compressed.length, 'bytes');
    console.log('  Compression ratio:', ((1 - compressed.length / jsonString.length) * 100).toFixed(1) + '%');

    return compressed;
  }

  /**
   * Sets the import button to loading state.
   * @param {HTMLElement} button - The import button element
   * @param {boolean} loading - Whether to show loading state
   */
  function setButtonLoading(button, loading) {
    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = 'Importing...';
      button.classList.add('loading');
      button.classList.remove('error', 'success');
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || 'Import to RaceStand';
      button.classList.remove('loading');
    }
  }

  /**
   * Sets the button to success state temporarily.
   * @param {HTMLElement} button - The import button element
   */
  function setButtonSuccess(button) {
    button.classList.remove('loading', 'error');
    button.classList.add('success');
    button.textContent = 'Opening RaceStand...';

    // Reset after 3 seconds
    setTimeout(() => {
      button.classList.remove('success');
      button.textContent = button.dataset.originalText || 'Import to RaceStand';
    }, 3000);
  }

  /**
   * Sets the button to error state temporarily.
   * @param {HTMLElement} button - The import button element
   */
  function setButtonError(button) {
    button.classList.remove('loading', 'success');
    button.classList.add('error');
    button.textContent = 'Import Failed';

    // Reset after 3 seconds
    setTimeout(() => {
      button.classList.remove('error');
      button.textContent = button.dataset.originalText || 'Import to RaceStand';
    }, 3000);
  }

  /**
   * Shows an error popup with the given title and details.
   * @param {string} title - The error title
   * @param {string} message - A user-friendly error message
   * @param {string[]} details - Optional array of specific error details
   */
  function showErrorPopup(title, message, details = []) {
    // Remove any existing popup
    hideErrorPopup();

    const popup = document.createElement('div');
    popup.id = 'racestand-error-popup';

    let detailsHtml = '';
    if (details.length > 0) {
      detailsHtml = `
        <div class="popup-details">
          <ul>
            ${details.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    popup.innerHTML = `
      <div class="popup-header">
        <div class="popup-icon"></div>
        <h3 class="popup-title">${escapeHtml(title)}</h3>
      </div>
      <p class="popup-message">${escapeHtml(message)}</p>
      ${detailsHtml}
      <button class="popup-close">Dismiss</button>
    `;

    document.body.appendChild(popup);

    // Add close button handler
    popup.querySelector('.popup-close').addEventListener('click', () => {
      hideErrorPopup();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
      hideErrorPopup();
    }, 10000);

    console.log('[RaceStand] Error popup shown:', title, message, details);
  }

  /**
   * Hides the error popup with animation.
   */
  function hideErrorPopup() {
    const popup = document.getElementById('racestand-error-popup');
    if (popup) {
      popup.classList.add('hiding');
      setTimeout(() => {
        popup.remove();
      }, 300);
    }
  }

  /**
   * Shows a success popup that auto-hides.
   * @param {string} message - Success message to display
   */
  function showSuccessPopup(message) {
    // Remove any existing popups
    hideErrorPopup();
    const existingSuccess = document.getElementById('racestand-success-popup');
    if (existingSuccess) existingSuccess.remove();

    const popup = document.createElement('div');
    popup.id = 'racestand-success-popup';

    popup.innerHTML = `
      <div class="popup-header">
        <div class="popup-icon"></div>
        <h3 class="popup-title">${escapeHtml(message)}</h3>
      </div>
    `;

    document.body.appendChild(popup);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      popup.classList.add('hiding');
      setTimeout(() => {
        popup.remove();
      }, 300);
    }, 3000);
  }

  /**
   * Escapes HTML special characters to prevent XSS.
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Generates user-friendly error messages based on validation errors.
   * @param {string[]} errors - Array of validation error strings
   * @returns {{title: string, message: string, details: string[]}}
   */
  function formatValidationErrors(errors) {
    // Categorize errors
    const hasNameError = errors.some(e => e.toLowerCase().includes('championship name'));
    const hasCompetitorError = errors.some(e => e.toLowerCase().includes('competitor'));
    const hasScoringError = errors.some(e => e.toLowerCase().includes('scoring'));
    const hasRoundsError = errors.some(e => e.toLowerCase().includes('rounds'));

    let title = 'Import Failed';
    let message = 'Could not extract championship data from this page.';

    if (hasNameError && !hasCompetitorError) {
      title = 'Championship Not Found';
      message = 'Could not find the championship name on this page. Make sure you are on a SimGrid championship standings page.';
    } else if (hasCompetitorError && errors.some(e => e.includes('At least one'))) {
      title = 'No Drivers Found';
      message = 'Could not find any driver entries in the standings table. The page structure may have changed.';
    } else if (hasScoringError) {
      title = 'Scoring Error';
      message = 'Could not determine the points system for this championship.';
    } else if (hasRoundsError) {
      title = 'Race Data Error';
      message = 'Could not determine the number of races in this championship.';
    }

    return {
      title,
      message,
      details: errors.slice(0, 5) // Limit to 5 errors for readability
    };
  }

  /**
   * Gets the extension version from the manifest.
   * @returns {string} The extension version string
   */
  function getExtensionVersion() {
    try {
      return chrome.runtime.getManifest().version;
    } catch (e) {
      console.warn('[RaceStand] Could not get extension version:', e);
      return '1.0.0'; // Fallback version
    }
  }

  /**
   * Injects the "Import to RaceStand" button into the page.
   * Only injects on standings pages.
   * The button is styled via styles.css (loaded by manifest.json).
   */
  function injectImportButton() {
    // Only inject on standings pages
    if (!isStandingsPage()) {
      console.log('[RaceStand] Not a standings page, skipping button injection');
      return;
    }

    // Check if button already exists to prevent duplicates
    if (document.getElementById('racestand-import-btn')) {
      console.log('[RaceStand] Import button already exists, skipping injection');
      return;
    }

    // Get extension version for the tooltip
    const version = getExtensionVersion();

    // Create the import button
    const button = document.createElement('button');
    button.id = 'racestand-import-btn';
    button.textContent = 'Import to RaceStand';
    button.title = `Import to RaceStand v${version}`;

    // Add click handler to extract and log data
    button.addEventListener('click', handleImportClick);

    // Append button to the document body
    document.body.appendChild(button);

    console.log('[RaceStand] Import button injected');
  }

  /**
   * Handles the import button click.
   * Extracts complete championship data, compresses it, and sends it to the
   * background service worker to open RaceStand in a new tab.
   */
  async function handleImportClick() {
    console.log('[RaceStand] Import button clicked - extracting complete data...');
    console.log('[RaceStand] ========================================');

    // Get the button and set loading state
    const button = document.getElementById('racestand-import-btn');
    if (button) {
      setButtonLoading(button, true);
    }

    try {
      // First, verify we're on a valid standings page
      const standingsTable = document.querySelector('table.table-results');
      if (!standingsTable) {
        throw new Error('NOT_STANDINGS_PAGE');
      }

      // Extract championship ID from URL
      const championshipId = extractChampionshipId();

      let scoringData = null;
      let racesData = null;

      if (championshipId) {
        // Fetch scoring and races data in parallel
        console.log('[RaceStand] Fetching scoring and races data...');

        try {
          const [fetchedScoring, fetchedRaces] = await Promise.all([
            fetchScoringData(championshipId),
            fetchRacesData(championshipId)
          ]);

          scoringData = fetchedScoring;
          racesData = fetchedRaces;

          console.log('[RaceStand] Fetched scoring data:', scoringData);
          console.log('[RaceStand] Fetched races data:', racesData);
        } catch (fetchError) {
          console.warn('[RaceStand] Fetch failed, using fallback detection:', fetchError);
          // Continue with fallback - don't throw
        }
      } else {
        console.warn('[RaceStand] Could not extract championship ID, using fallback detection');
      }

      // Extract complete championship data with fetched overrides
      let result;
      try {
        result = extractChampionshipData({
          scoring: scoringData ? scoringData.scoring : null,
          totalRoundsFromRacesPage: racesData,
          flBonus: scoringData ? scoringData.flBonus : null
        });
      } catch (extractError) {
        console.error('[RaceStand] Extraction error:', extractError);
        throw new Error('EXTRACTION_FAILED');
      }

      // Log validation status
      console.log('[RaceStand] Validation Status:', result.validation.valid ? 'PASSED' : 'FAILED');

      if (!result.validation.valid) {
        console.error('[RaceStand] Validation Errors:');
        result.validation.errors.forEach((error, index) => {
          console.error(`  ${index + 1}. ${error}`);
        });
        console.log('[RaceStand] ========================================');

        // Show user-friendly error popup
        const { title, message, details } = formatValidationErrors(result.validation.errors);
        showErrorPopup(title, message, details);

        if (button) {
          setButtonError(button);
        }
        return;
      }

      const data = result.data;

      // Log the complete JSON structure
      console.log('[RaceStand] Complete Championship Data (RaceStand Schema):');
      console.log(JSON.stringify(data, null, 2));

      // Log summary information
      console.log('[RaceStand] ========================================');
      console.log('[RaceStand] Summary:');
      console.log(`  Championship: ${data.championship.name}`);
      console.log(`  Total Rounds: ${data.championship.totalRounds}`);
      console.log(`  Count Best: ${data.championship.countBest}`);
      console.log(`  Scoring: [${data.championship.scoring.join(', ')}]`);
      console.log(`  Fastest Lap Enabled: ${data.championship.flEnabled}`);
      console.log(`  Fastest Lap Bonus: ${data.championship.flBonus}`);
      console.log(`  Target Position: ${data.championship.targetPosition}`);
      console.log(`  Competitors: ${data.competitors.length}`);

      // Log competitor summary
      console.log('[RaceStand] ----------------------------------------');
      console.log('[RaceStand] Competitor Summary:');
      data.competitors.forEach((competitor, index) => {
        const positions = competitor.results.map(r => r.position === null ? '-' : r.position).join(', ');
        const flCount = competitor.results.filter(r => r.fastestLap).length;
        const flIndicator = flCount > 0 ? ` (FL: ${flCount})` : '';
        console.log(`  ${index + 1}. ${competitor.name}: [${positions}]${flIndicator}`);
      });

      // Log fastest lap distribution if enabled
      if (data.championship.flEnabled) {
        console.log('[RaceStand] ----------------------------------------');
        console.log('[RaceStand] Fastest Lap Distribution:');
        for (let i = 0; i < data.championship.totalRounds; i++) {
          const flDriver = data.competitors.find(c => c.results[i] && c.results[i].fastestLap === true);
          console.log(`  Round ${i + 1}: ${flDriver ? flDriver.name : 'No FL detected'}`);
        }
      }

      console.log('[RaceStand] ========================================');

      // Compress the data for URL transfer
      console.log('[RaceStand] Compressing data for URL transfer...');
      let compressedData;
      try {
        compressedData = compressData(data);
      } catch (compressError) {
        console.error('[RaceStand] Compression error:', compressError);
        throw new Error('COMPRESSION_FAILED');
      }

      console.log('[RaceStand] Compressed string (first 100 chars):', compressedData.substring(0, 100) + '...');
      console.log('[RaceStand] ========================================');

      // Send message to background script to open RaceStand
      console.log('[RaceStand] Sending data to background script...');
      chrome.runtime.sendMessage(
        { type: 'OPEN_RACESTAND', data: compressedData },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('[RaceStand] Message error:', chrome.runtime.lastError);
            showErrorPopup(
              'Extension Error',
              'Could not communicate with the extension. Try reloading the page.',
              [chrome.runtime.lastError.message || 'Unknown communication error']
            );
            if (button) {
              setButtonError(button);
            }
            return;
          }

          if (response && response.success) {
            console.log('[RaceStand] RaceStand opened successfully');
            if (button) {
              setButtonSuccess(button);
            }
            showSuccessPopup('Championship imported!');
          } else {
            console.error('[RaceStand] Failed to open RaceStand');
            showErrorPopup(
              'Failed to Open RaceStand',
              'The extension could not open RaceStand. Please try again.',
              []
            );
            if (button) {
              setButtonError(button);
            }
          }
        }
      );

      // Log raw data object for debugging
      console.log('[RaceStand] Raw Data Object:', data);

    } catch (error) {
      console.error('[RaceStand] Import error:', error);

      // Handle specific error types
      if (error.message === 'NOT_STANDINGS_PAGE') {
        showErrorPopup(
          'Not a Standings Page',
          'This page does not appear to be a SimGrid championship standings page.',
          ['Navigate to a championship standings page to use the import feature.']
        );
      } else if (error.message === 'EXTRACTION_FAILED') {
        showErrorPopup(
          'Extraction Failed',
          'Failed to extract championship data from the page.',
          ['The page structure may have changed.', 'Try refreshing the page and try again.']
        );
      } else if (error.message === 'COMPRESSION_FAILED') {
        showErrorPopup(
          'Data Processing Error',
          'Failed to process the championship data.',
          ['The data may be too large or contain invalid characters.']
        );
      } else {
        showErrorPopup(
          'Unexpected Error',
          'An unexpected error occurred during import.',
          [error.message || 'Unknown error']
        );
      }

      if (button) {
        setButtonError(button);
      }
    } finally {
      // Reset loading state (but not error/success state)
      if (button && button.classList.contains('loading')) {
        setButtonLoading(button, false);
      }
    }
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'triggerImport') {
      handleImportClick();
      sendResponse({ success: true });
    }
    return true; // Keep message channel open for async response
  });

  /**
   * Handles URL changes in SPA navigation.
   * Injects or removes button based on current page.
   */
  function handleUrlChange() {
    const button = document.getElementById('racestand-import-btn');

    if (isStandingsPage()) {
      if (!button) {
        console.log('[RaceStand] Navigated to standings page, injecting button');
        injectImportButton();
      }
    } else {
      if (button) {
        console.log('[RaceStand] Left standings page, removing button');
        button.remove();
      }
    }
  }

  /**
   * Sets up monitoring for SPA navigation.
   */
  function setupNavigationMonitoring() {
    // Store the current URL
    let lastUrl = window.location.href;

    // Create observer to detect DOM changes (SPA navigation often changes content)
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log('[RaceStand] URL changed:', lastUrl);
        handleUrlChange();
      }
    });

    // Observe the document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also listen for popstate (browser back/forward)
    window.addEventListener('popstate', () => {
      console.log('[RaceStand] Popstate event');
      handleUrlChange();
    });

    // Override history methods to catch programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      console.log('[RaceStand] pushState detected');
      handleUrlChange();
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      console.log('[RaceStand] replaceState detected');
      handleUrlChange();
    };
  }

  // Run injection when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectImportButton();
      setupNavigationMonitoring();
    });
  } else {
    // DOM is already loaded, inject immediately
    injectImportButton();
    setupNavigationMonitoring();
  }
})();
