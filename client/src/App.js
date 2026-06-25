import { useState } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:3001";

const POSITION_MAP = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" };

const TEAM_MAP = {
  1: "ARS",
  2: "AVL",
  3: "BOU",
  4: "BRE",
  5: "BHA",
  6: "CHE",
  7: "CRY",
  8: "EVE",
  9: "FUL",
  10: "IPS",
  11: "LEI",
  12: "LIV",
  13: "MCI",
  14: "MUN",
  15: "NEW",
  16: "NFO",
  17: "SOU",
  18: "TOT",
  19: "WHU",
  20: "WOL",
};

const pointsColor = (pts) => {
  if (pts >= 9) return "#00985f";
  if (pts >= 6) return "#00b87a";
  if (pts >= 2) return "#d4a017";
  return "#c0392b";
};

const calcBreakdown = (f, position) => {
  const lines = [];
  if (f.minutes >= 60) lines.push("⏱ Played 60+ min · 2pts");
  else if (f.minutes > 0) lines.push("⏱ Played <60 min · 1pt");
  if (position === 4 && f.goals_scored)
    lines.push(
      `⚽ ${f.goals_scored} goal${f.goals_scored > 1 ? "s" : ""} · ${f.goals_scored * 4}pts`,
    );
  else if (position === 3 && f.goals_scored)
    lines.push(
      `⚽ ${f.goals_scored} goal${f.goals_scored > 1 ? "s" : ""} · ${f.goals_scored * 5}pts`,
    );
  else if (f.goals_scored)
    lines.push(
      `⚽ ${f.goals_scored} goal${f.goals_scored > 1 ? "s" : ""} · ${f.goals_scored * 6}pts`,
    );
  if (f.assists)
    lines.push(
      `🅰️ ${f.assists} assist${f.assists > 1 ? "s" : ""} · ${f.assists * 3}pts`,
    );
  if (f.clean_sheets && position <= 2) lines.push("🧤 Clean sheet · 4pts");
  if (f.clean_sheets && position === 3) lines.push("🧤 Clean sheet · 1pt");
  if (f.bonus) lines.push(`⭐ Bonus · ${f.bonus}pts`);
  if (f.yellow_cards) lines.push("🟨 Yellow card · -1pt");
  if (f.red_cards) lines.push("🟥 Red card · -3pts");
  if (f.goals_conceded >= 2 && position <= 2)
    lines.push(`🔴 Goals conceded · -${Math.floor(f.goals_conceded / 2)}pts`);
  return lines;
};

function PlayerRow({ player }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!open && history.length === 0) {
      setLoading(true);
      try {
        const [histRes, recRes] = await Promise.all([
          fetch(`${API}/api/players/${player.id}/fixtures`),
          fetch(`${API}/api/players/${player.id}/recommendation`),
        ]);
        const histData = await histRes.json();
        const recData = await recRes.json();
        setHistory(histData);
        setRec(recData);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    setOpen(!open);
  };

  const recColor =
    rec?.recommendation === "START"
      ? "#00985f"
      : rec?.recommendation === "CONSIDER"
        ? "#d4a017"
        : "#c0392b";
  const recLabel =
    rec?.recommendation === "START"
      ? "✅ START"
      : rec?.recommendation === "CONSIDER"
        ? "⚠️ CONSIDER"
        : "❌ BENCH";

  return (
    <div
      style={{
        marginBottom: 14,
        borderRadius: 12,
        border: `2px solid ${open ? "#38003c" : "#e0e0e0"}`,
        overflow: "hidden",
        boxShadow: open
          ? "0 4px 16px rgba(56,0,60,0.10)"
          : "0 1px 4px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.2s",
      }}
    >
      <div
        onClick={toggle}
        style={{
          padding: "14px 18px",
          cursor: "pointer",
          background: open ? "#f5eef8" : "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <strong style={{ fontSize: 16 }}>{player.name}</strong>
          <span
            style={{
              background: "#38003c",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: 4,
              letterSpacing: 1,
            }}
          >
            {POSITION_MAP[player.position]}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 13, color: "#666" }}>£{player.price}m</span>
          <span style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>
            {player.totalPoints} pts
          </span>
          <span style={{ fontSize: 13, color: "#666" }}>
            Form: <strong>{player.form}</strong>
          </span>
          <span style={{ fontSize: 16, color: "#38003c" }}>
            {open ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {open && (
        <div
          style={{
            padding: "18px 18px 20px",
            background: "#fafafa",
            borderTop: "1px solid #ececec",
          }}
        >
          {loading && <p style={{ color: "#888", fontSize: 14 }}>Loading...</p>}

          {!loading && rec && (
            <div
              style={{
                marginBottom: 16,
                padding: "16px 20px",
                borderRadius: 12,
                background: recColor,
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>
                  GW{rec.round} · vs {TEAM_MAP[rec.opponent]}{" "}
                  {rec.isHome ? "(H)" : "(A)"}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{recLabel}</div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                  Score: {rec.score}/100
                </div>
              </div>
              <div
                style={{ textAlign: "right", fontSize: 13, lineHeight: 1.8 }}
              >
                <div>
                  📊 Avg vs {TEAM_MAP[rec.opponent]}:{" "}
                  <strong>{rec.avgPoints} pts</strong> ({rec.gamesVs} game
                  {rec.gamesVs !== 1 ? "s" : ""})
                </div>
                <div>
                  ⚽ {rec.goals} goal{rec.goals !== 1 ? "s" : ""} · 🅰️{" "}
                  {rec.assists} assist{rec.assists !== 1 ? "s" : ""}
                </div>
                <div>
                  🔥 Form avg: <strong>{rec.formAvg} pts</strong>
                </div>
                <div>
                  ⏱ Plays 60+ min: <strong>{rec.minutesPct}%</strong>
                </div>
              </div>
            </div>
          )}

          {!loading && history.length === 0 && (
            <p style={{ color: "#aaa", fontSize: 14 }}>No data found.</p>
          )}
          {!loading && history.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 12,
                overflowX: "auto",
                paddingBottom: 8,
              }}
            >
              {history.map((f, i) => {
                const breakdown = calcBreakdown(f, player.position);
                const opponent =
                  TEAM_MAP[f.opponent_team] || `T${f.opponent_team}`;
                return (
                  <div
                    key={i}
                    style={{
                      flex: "0 0 120px",
                      borderRadius: 10,
                      overflow: "hidden",
                      border: "1px solid #e0e0e0",
                      boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                    }}
                  >
                    <div
                      style={{
                        background: pointsColor(f.total_points),
                        color: "#fff",
                        textAlign: "center",
                        padding: "14px 8px 12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          opacity: 0.85,
                          marginBottom: 2,
                        }}
                      >
                        GW{f.round}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          marginBottom: 8,
                        }}
                      >
                        vs {opponent} {f.was_home ? "(H)" : "(A)"}
                      </div>
                      <div
                        style={{ fontSize: 34, fontWeight: 800, lineHeight: 1 }}
                      >
                        {f.total_points}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 3 }}>
                        pts
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#fff",
                        padding: "10px 12px",
                        minHeight: 50,
                      }}
                    >
                      {breakdown.length === 0 ? (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#bbb",
                            textAlign: "center",
                            paddingTop: 8,
                          }}
                        >
                          —
                        </div>
                      ) : (
                        breakdown.map((line, j) => (
                          <div
                            key={j}
                            style={{
                              fontSize: 12,
                              color: "#333",
                              marginBottom: 5,
                              lineHeight: 1.4,
                            }}
                          >
                            {line}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [search, setSearch] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);

  const clearSearch = () => {
    setSearch("");
    setPlayers([]);
  };

  const searchPlayers = async () => {
    if (!search) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/players?search=${search}`);
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      console.error("Search error:", err);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        maxWidth: 860,
        margin: "40px auto",
        padding: "0 24px",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 4,
            color: "#38003c",
            letterSpacing: -1,
          }}
        >
          ⚽ FIXTURE
        </h1>
        <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
          FPL Fixture Analyzer — Last 5 Games
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchPlayers()}
          placeholder="Search player (e.g. Salah, Haaland...)"
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 8,
            border: "2px solid #e0e0e0",
            fontSize: 15,
            outline: "none",
          }}
        />
        <button
          onClick={searchPlayers}
          style={{
            padding: "12px 24px",
            borderRadius: 8,
            background: "#38003c",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          Search
        </button>
        <button
          onClick={clearSearch}
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            background: "#fff",
            color: "#38003c",
            border: "2px solid #38003c",
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          Clear
        </button>
      </div>

      {loading && <p style={{ color: "#888" }}>Loading players...</p>}
      {players.map((p) => (
        <PlayerRow key={p.id} player={p} />
      ))}
    </div>
  );
}
