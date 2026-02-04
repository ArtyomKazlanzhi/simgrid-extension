# RaceStand — Product Roadmap

- **Version:** 1.0
- **Last Updated:** 2026-02-03

---

## Release Overview

| Version | Name | Focus | Status |
|---------|------|-------|--------|
| v0.1 | MVP | Core calculator with all essential features | ✅ Completed |
| v1.0 | Stable | Local storage + polish | ✅ Completed |
| v1.1 | Social | Shareable URLs + export/import | Future |

---

## v0.1 — MVP (Minimum Viable Product)

**Goal:** A fully functional championship calculator that racers can use immediately.

### Features

1. **Championship Configuration**
   - Custom scoring table (user defines points per position)
   - Number of rounds configuration
   - Drop rounds setting ("best X of Y")
   - Fastest lap bonus toggle

2. **Competitor Management**
   - Add/edit/remove competitors
   - Enter race results per competitor per round
   - Display current standings with points totals

3. **Scenario Simulator**
   - Select hypothetical finishing positions for upcoming races
   - Instant recalculation of standings
   - Clear status display: "Title Guaranteed" / "At Risk" / "Cannot Win"
   - Show point gaps and what's needed to win

4. **Basic UI**
   - Clean, responsive web interface
   - Works on desktop and mobile browsers
   - Dark theme (racing aesthetic)

### Exit Criteria
- User can configure any championship format
- User can enter competitors and results
- User can simulate future race outcomes
- Calculations are accurate for all scenarios

---

## v1.0 — Stable Release

**Goal:** Reliable, persistent experience that users can trust for ongoing championships.

### Features

1. **Local Storage**
   - Championship data persists in browser storage
   - Auto-save on changes
   - Load previous championship on return visit
   - Clear data option

2. **UI Polish**
   - Improved visual design and animations
   - Better mobile experience
   - Loading states and error handling
   - Keyboard navigation support

3. **Preset Scoring Systems**
   - F1 scoring (25-18-15-12-10-8-6-4-2-1)
   - Common sim racing formats
   - One-click apply presets

### Exit Criteria
- Data persists between browser sessions
- No data loss on refresh
- Polished, professional appearance

---

## v1.1 — Social & Sharing

**Goal:** Enable sharing and data portability for league use and social virality.

### Features

1. **Shareable URLs**
   - Encode championship state in URL
   - Share specific scenarios with others
   - Recipients see exact same calculation

2. **Export/Import**
   - Export championship to JSON file
   - Import championship from JSON
   - CSV export for spreadsheet users

3. **Social Features**
   - "Share to Twitter/X" button with scenario summary
   - Copy results as text for Discord/forums
   - Embed widget for league websites (stretch)

### Exit Criteria
- Users can share scenarios via URL
- Data can be exported and re-imported
- Social sharing is one-click

---

## Future Considerations (v2.0+)

These are out of scope for now but may be considered later:

- **Multi-championship tracking** — manage multiple series simultaneously
- **Team/constructor championships** — aggregate driver points to teams
- **Cloud sync & accounts** — cross-device access with login
- **Live data integration** — auto-import from iRacing, ACC, etc.
- **Mobile native apps** — iOS/Android applications
- **League management** — tools for league organizers

---

## Dependencies & Risks

| Risk | Mitigation |
|------|------------|
| Complex drop-round calculations | Thorough testing with edge cases |
| URL state encoding size limits | Use compression or short codes |
| Browser storage limits | Warn users, offer export |
| Mobile browser compatibility | Test on major mobile browsers |

---

## Success Metrics by Release

| Version | Key Metric | Target |
|---------|-----------|--------|
| v0.1 | Functional calculator | Works for any championship format |
| v1.0 | Retention | Users return to update results |
| v1.1 | Sharing | URLs shared in racing communities |
