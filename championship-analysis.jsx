import { useState } from "react";

const POINTS_TABLE = [30, 27, 24, 21, 18, 16, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

const competitors = [
  { name: "Slashchov", r1: 27, r2: 24, car: "McLaren 570s GT4" },
  { name: "Pynda", r1: 21, r2: 27, car: "Aston Martin GT4" },
  { name: "Terekhov", r1: 24, r2: 0, car: "Aston Martin GT4" },
  { name: "Mochulskyi", r1: 18, r2: 18, car: "Aston Martin GT4" },
  { name: "Kotliarskyi", r1: 0, r2: 21, car: "Aston Martin GT4" },
  { name: "Ivanyuk", r1: 8, r2: 16, car: "Aston Martin GT4" },
];

function best4of5(results) {
  const sorted = [...results].sort((a, b) => b - a);
  return sorted.slice(0, 4).reduce((a, b) => a + b, 0);
}

export default function ChampionshipAnalysis() {
  const [r3Pos, setR3Pos] = useState(1);
  const [r4Pos, setR4Pos] = useState(2);
  const [r3FL, setR3FL] = useState(false);
  const [r4FL, setR4FL] = useState(false);

  const kazR1 = 31, kazR2 = 31;
  const kazR3 = (POINTS_TABLE[r3Pos - 1] || 0) + (r3FL ? 1 : 0);
  const kazR4 = (POINTS_TABLE[r4Pos - 1] || 0) + (r4FL ? 1 : 0);
  const kazR5worst = 0;

  const kazTotal = best4of5([kazR1, kazR2, kazR3, kazR4, kazR5worst]);

  const threats = competitors.map((c) => {
    const maxInR3 = r3Pos === 1 ? 28 : 31;
    const maxInR4 = r4Pos === 1 ? 28 : 31;
    const maxR5 = 31;
    const results = [c.r1, c.r2, maxInR3, maxInR4, maxR5];
    const total = best4of5(results);
    return { ...c, maxTotal: total, results };
  });

  const worstThreat = threats.reduce((a, b) => (b.maxTotal > a.maxTotal ? b : a));
  const gap = kazTotal - worstThreat.maxTotal;
  const isSafe = gap > 0;

  const scenarios = [
    { label: "P1 + P1", r3: 1, r4: 1 },
    { label: "P1 + P2", r3: 1, r4: 2 },
    { label: "P2 + P1", r3: 2, r4: 1 },
    { label: "P1 + P3", r3: 1, r4: 3 },
    { label: "P2 + P2", r3: 2, r4: 2 },
    { label: "P3 + P1", r3: 3, r4: 1 },
    { label: "P2 + P3", r3: 2, r4: 3 },
    { label: "P1 + P4", r3: 1, r4: 4 },
  ];

  const scenarioResults = scenarios.map((s) => {
    const k3 = POINTS_TABLE[s.r3 - 1] || 0;
    const k4 = POINTS_TABLE[s.r4 - 1] || 0;
    const kTotal = best4of5([31, 31, k3, k4, 0]);

    let maxThreat = 0;
    let threatName = "";
    competitors.forEach((c) => {
      const cMaxR3 = s.r3 === 1 ? 28 : 31;
      const cMaxR4 = s.r4 === 1 ? 28 : 31;
      const cTotal = best4of5([c.r1, c.r2, cMaxR3, cMaxR4, 31]);
      if (cTotal > maxThreat) {
        maxThreat = cTotal;
        threatName = c.name;
      }
    });

    return {
      ...s,
      kazPts: kTotal,
      threatPts: maxThreat,
      threatName,
      gap: kTotal - maxThreat,
      safe: kTotal > maxThreat,
    };
  });

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      background: "linear-gradient(165deg, #0a0e17 0%, #111827 40%, #0f172a 100%)",
      color: "#e2e8f0",
      minHeight: "100vh",
      padding: "32px 20px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .glow-green { text-shadow: 0 0 20px rgba(34,197,94,0.4); }
        .glow-red { text-shadow: 0 0 20px rgba(239,68,68,0.4); }
        .glow-gold { text-shadow: 0 0 20px rgba(234,179,8,0.3); }
        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }
        .pos-btn {
          width: 52px; height: 40px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: #94a3b8;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.15s;
        }
        .pos-btn:hover { background: rgba(255,255,255,0.08); }
        .pos-btn.active {
          background: rgba(234,179,8,0.15);
          border-color: rgba(234,179,8,0.5);
          color: #eab308;
          font-weight: 700;
        }
        .fl-toggle {
          padding: 6px 14px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.03);
          color: #64748b;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          transition: all 0.15s;
        }
        .fl-toggle.active {
          background: rgba(168,85,247,0.15);
          border-color: rgba(168,85,247,0.5);
          color: #a855f7;
        }
        .scenario-row {
          display: grid;
          grid-template-columns: 90px 1fr 70px 70px 80px;
          align-items: center;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .scenario-row:hover { background: rgba(255,255,255,0.02); }
        .bar {
          height: 6px;
          border-radius: 3px;
          transition: width 0.4s ease;
        }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 36, textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>
            Championship Analysis
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28,
            fontWeight: 700,
            background: "linear-gradient(135deg, #e2e8f0, #eab308)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 6,
          }}>
            🏁 Kazlanzhy — шлях до титулу
          </h1>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            5 гонок · 1 дроп-раунд · Найкращі 4 з 5 результатів
          </p>
        </div>

        {/* Current standings card */}
        <div className="card" style={{ padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#64748b", textTransform: "uppercase", marginBottom: 14 }}>
            Поточні очки (R1 + R2, без дропу)
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { name: "Kazlanzhy", pts: 62, color: "#eab308" },
              { name: "Slashchov", pts: 51, color: "#94a3b8" },
              { name: "Pynda", pts: 48, color: "#94a3b8" },
              { name: "Mochulskyi", pts: 36, color: "#64748b" },
            ].map((d) => (
              <div key={d.name} style={{
                flex: 1,
                minWidth: 100,
                padding: "10px 14px",
                borderRadius: 8,
                background: d.name === "Kazlanzhy" ? "rgba(234,179,8,0.08)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${d.name === "Kazlanzhy" ? "rgba(234,179,8,0.2)" : "rgba(255,255,255,0.04)"}`,
              }}>
                <div style={{ fontSize: 11, color: d.color, fontWeight: 600 }}>{d.name}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: d.color }}>{d.pts}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive simulator */}
        <div className="card" style={{ padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#64748b", textTransform: "uppercase", marginBottom: 16 }}>
            Симулятор: обери позиції R3 та R4
          </div>

          {[
            { label: "R3", pos: r3Pos, setPos: setR3Pos, fl: r3FL, setFL: setR3FL },
            { label: "R4", pos: r4Pos, setPos: setR4Pos, fl: r4FL, setFL: setR4FL },
          ].map((race) => (
            <div key={race.label} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#eab308", width: 28 }}>{race.label}</span>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                  <button
                    key={p}
                    className={`pos-btn ${race.pos === p ? "active" : ""}`}
                    onClick={() => race.setPos(p)}
                  >
                    P{p}
                  </button>
                ))}
                <button
                  className={`fl-toggle ${race.fl ? "active" : ""}`}
                  onClick={() => race.setFL(!race.fl)}
                >
                  ⚡FL
                </button>
              </div>
            </div>
          ))}

          {/* Result */}
          <div style={{
            marginTop: 20,
            padding: "18px 20px",
            borderRadius: 10,
            background: isSafe
              ? "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))"
              : "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.02))",
            border: `1px solid ${isSafe ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                  Kazlanzhy (R5=0, worst case)
                </div>
                <span style={{ fontSize: 32, fontWeight: 700, color: isSafe ? "#22c55e" : "#ef4444" }}
                  className={isSafe ? "glow-green" : "glow-red"}>
                  {kazTotal}
                </span>
                <span style={{ fontSize: 13, color: "#64748b", marginLeft: 8 }}>
                  = 31+31+{kazR3}+{kazR4} − {Math.min(kazR3, kazR4, 0)}(drop)
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                  {worstThreat.name} (max можливий)
                </div>
                <span style={{ fontSize: 32, fontWeight: 700, color: "#94a3b8" }}>
                  {worstThreat.maxTotal}
                </span>
              </div>
            </div>
            <div style={{
              marginTop: 14,
              fontSize: 15,
              fontWeight: 700,
              color: isSafe ? "#22c55e" : "#ef4444",
              textAlign: "center",
            }}>
              {isSafe
                ? `✅ ТИТУЛ ГАРАНТОВАНО! Перевага: +${gap} очок`
                : gap === 0
                  ? `⚠️ НІЧИЯ — титул під питанням (${-gap} очок)`
                  : `❌ НЕ ГАРАНТОВАНО — дефіцит: ${gap} очок`}
            </div>
          </div>
        </div>

        {/* Scenarios table */}
        <div className="card" style={{ padding: "20px 0", marginBottom: 20, overflow: "hidden" }}>
          <div style={{ padding: "0 24px 14px", fontSize: 11, letterSpacing: 2, color: "#64748b", textTransform: "uppercase" }}>
            Всі сценарії (без FL, R5=0)
          </div>
          <div className="scenario-row" style={{
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            fontSize: 11,
            color: "#64748b",
            fontWeight: 600,
            letterSpacing: 1,
          }}>
            <div>R3+R4</div>
            <div>Відрив</div>
            <div style={{ textAlign: "right" }}>ТЕБЕ</div>
            <div style={{ textAlign: "right" }}>ЗАГР.</div>
            <div style={{ textAlign: "right" }}>СТАТУС</div>
          </div>
          {scenarioResults.map((s, i) => {
            const maxBar = 130;
            const kazW = Math.min(maxBar, (s.kazPts / 130) * maxBar);
            const threatW = Math.min(maxBar, (s.threatPts / 130) * maxBar);
            return (
              <div key={i} className="scenario-row" style={{
                background: s.safe ? "rgba(34,197,94,0.03)" : "transparent",
              }}>
                <div style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: s.safe ? "#eab308" : "#64748b",
                }}>
                  {s.label}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div className="bar" style={{
                    width: kazW,
                    background: s.safe
                      ? "linear-gradient(90deg, #22c55e, #16a34a)"
                      : "linear-gradient(90deg, #ef4444, #dc2626)",
                  }} />
                  <div className="bar" style={{
                    width: threatW,
                    background: "linear-gradient(90deg, #475569, #334155)",
                  }} />
                </div>
                <div style={{ textAlign: "right", fontWeight: 600, fontSize: 14, color: s.safe ? "#22c55e" : "#ef4444" }}>
                  {s.kazPts}
                </div>
                <div style={{ textAlign: "right", fontSize: 14, color: "#94a3b8" }}>
                  {s.threatPts}
                </div>
                <div style={{
                  textAlign: "right",
                  fontSize: 13,
                  fontWeight: 700,
                  color: s.safe ? "#22c55e" : "#ef4444",
                }}>
                  {s.safe ? `+${s.gap}` : s.gap}
                </div>
              </div>
            );
          })}
        </div>

        {/* Conclusion */}
        <div className="card" style={{
          padding: "24px",
          background: "linear-gradient(135deg, rgba(234,179,8,0.06), rgba(234,179,8,0.01))",
          border: "1px solid rgba(234,179,8,0.15)",
        }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#eab308", textTransform: "uppercase", marginBottom: 12 }}>
            Висновок
          </div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 600, color: "#f1f5f9", lineHeight: 1.5, marginBottom: 12 }}>
            Мінімум для гарантії: <span style={{ color: "#eab308" }}>P1 + P2</span> (у будь-якому порядку)
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
            <p>
              При P1+P2 (навіть без FL) ти набираєш <strong style={{ color: "#22c55e" }}>119 очок</strong> (best 4 of 5),
              а найкращий суперник (Slashchov/Pynda) максимально може набрати лише <strong style={{ color: "#94a3b8" }}>117</strong>.
            </p>
            <p style={{ marginTop: 8 }}>
              Перевага <strong style={{ color: "#eab308" }}>+2 очки</strong> — R5 вже не має значення, навіть якщо ти не виїдеш на старт.
            </p>
            <p style={{ marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.06)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.12)", color: "#f87171" }}>
              ⚠️ P1+P3 або P2+P2 — вже НЕ гарантують титул. Суперник може обійти.
            </p>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#475569" }}>
          Розрахунок: worst case R5=0 для тебе, max R5=31 (P1+FL) для суперника
        </div>
      </div>
    </div>
  );
}
