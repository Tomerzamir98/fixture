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
        marginBottom: 12,
        borderRadius: 12,
        border: `2px solid ${open ? "#38003c" : "#e0e0e0"}`,
        overflow: "hidden",
        boxShadow: open
          ? "0 4px 16px rgba(56,0,60,0.10)"
          : "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      <div
        onClick={toggle}
        style={{
          padding: "12px 14px",
          cursor: "pointer",
          background: open ? "#f5eef8" : "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          userSelect: "none",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
        >
          <strong
            style={{
              fontSize: 15,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {player.name}
          </strong>
          <span
            style={{
              background: "#38003c",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            {POSITION_MAP[player.position]}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "#333", fontWeight: 600 }}>
            {player.totalPoints}pts
          </span>
          <span style={{ fontSize: 12, color: "#666" }}>£{player.price}m</span>
          <span style={{ fontSize: 14, color: "#38003c" }}>
            {open ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {open && (
        <div
          style={{
            padding: "14px 12px 16px",
            background: "#fafafa",
            borderTop: "1px solid #ececec",
          }}
        >
          {loading && <p style={{ color: "#888", fontSize: 14 }}>Loading...</p>}
          {!loading && rec && (
            <div
              style={{
                marginBottom: 14,
                padding: "14px 16px",
                borderRadius: 12,
                background: recColor,
                color: "#fff",
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 4 }}>
                GW{rec.round} · vs {TEAM_MAP[rec.opponent]}{" "}
                {rec.isHome ? "🏠 Home" : "✈️ Away"}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                {recLabel}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.7 }}>
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
                  🔥 Form avg (last 5 fixtures):{" "}
                  <strong>{rec.formAvg} pts</strong>
                </div>
                <div>
                  ⏱ Started 60+ min: <strong>{rec.minutesPct}%</strong> of last
                  5 games
                </div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>
                  Score: {rec.score}/100
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
                gap: 8,
                overflowX: "auto",
                paddingBottom: 8,
                WebkitOverflowScrolling: "touch",
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
                      flex: "0 0 100px",
                      borderRadius: 10,
                      overflow: "hidden",
                      border: "1px solid #e0e0e0",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                    }}
                  >
                    <div
                      style={{
                        background: pointsColor(f.total_points),
                        color: "#fff",
                        textAlign: "center",
                        padding: "10px 6px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          opacity: 0.85,
                          marginBottom: 1,
                        }}
                      >
                        GW{f.round}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          marginBottom: 6,
                        }}
                      >
                        vs {opponent} {f.was_home ? "🏠" : "✈️"}
                      </div>
                      <div
                        style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}
                      >
                        {f.total_points}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                        pts
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#fff",
                        padding: "8px 8px",
                        minHeight: 40,
                      }}
                    >
                      {breakdown.length === 0 ? (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#bbb",
                            textAlign: "center",
                            paddingTop: 6,
                          }}
                        >
                          —
                        </div>
                      ) : (
                        breakdown.map((line, j) => (
                          <div
                            key={j}
                            style={{
                              fontSize: 10,
                              color: "#333",
                              marginBottom: 4,
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

function TeamCard({ player }) {
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/players/${player.id}/recommendation`);
      const data = await res.json();
      setRec(data);
      setLoaded(true);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useState(() => {
    load();
  }, []);

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
        padding: "12px 14px",
        borderRadius: 10,
        border: `2px solid ${player.isCaptain ? "#f4a700" : player.isViceCaptain ? "#aaa" : "#e0e0e0"}`,
        background: player.pickPosition > 11 ? "#f9f9f9" : "#fff",
        marginBottom: 8,
        opacity: player.pickPosition > 11 ? 0.7 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {player.isCaptain && (
            <span
              style={{
                fontSize: 11,
                background: "#f4a700",
                color: "#fff",
                padding: "1px 5px",
                borderRadius: 4,
                fontWeight: 700,
              }}
            >
              C
            </span>
          )}
          {player.isViceCaptain && (
            <span
              style={{
                fontSize: 11,
                background: "#888",
                color: "#fff",
                padding: "1px 5px",
                borderRadius: 4,
                fontWeight: 700,
              }}
            >
              V
            </span>
          )}
          {player.pickPosition > 11 && (
            <span
              style={{
                fontSize: 11,
                background: "#ccc",
                color: "#555",
                padding: "1px 5px",
                borderRadius: 4,
                fontWeight: 700,
              }}
            >
              BENCH
            </span>
          )}
          <strong style={{ fontSize: 14 }}>{player.name}</strong>
          <span
            style={{
              background: "#38003c",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 5px",
              borderRadius: 4,
            }}
          >
            {POSITION_MAP[player.position]}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#666" }}>£{player.price}m</div>
      </div>
      <div style={{ marginTop: 8 }}>
        {loading && (
          <span style={{ fontSize: 12, color: "#aaa" }}>Loading...</span>
        )}
        {rec && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                background: recColor,
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 6,
              }}
            >
              {recLabel}
            </span>
            <span style={{ fontSize: 11, color: "#666" }}>
              vs {TEAM_MAP[rec.opponent]} {rec.isHome ? "🏠" : "✈️"} · avg{" "}
              {rec.avgPoints} pts ({rec.gamesVs} games)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MyTeam() {
  const [teamId, setTeamId] = useState("");
  const [gw, setGw] = useState("38");
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTeam = async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/players/team/${teamId}/${gw}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTeam(data);
    } catch (err) {
      setError("Team not found. Check your Team ID and GW.");
    }
    setLoading(false);
  };

  const starters = team?.filter((p) => p.pickPosition <= 11) || [];
  const bench = team?.filter((p) => p.pickPosition > 11) || [];

  return (
    <div>
      <div
        style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}
      >
        <input
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          placeholder="FPL Team ID (e.g. 6359518)"
          style={{
            flex: 1,
            minWidth: 180,
            padding: "11px 14px",
            borderRadius: 8,
            border: "2px solid #e0e0e0",
            fontSize: 14,
            outline: "none",
          }}
        />
        <input
          value={gw}
          onChange={(e) => setGw(e.target.value)}
          placeholder="GW"
          style={{
            width: 70,
            padding: "11px 10px",
            borderRadius: 8,
            border: "2px solid #e0e0e0",
            fontSize: 14,
            outline: "none",
          }}
        />
        <button
          onClick={loadTeam}
          style={{
            padding: "11px 16px",
            borderRadius: 8,
            background: "#38003c",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Load Team
        </button>
      </div>

      {error && <p style={{ color: "#c0392b", fontSize: 14 }}>{error}</p>}
      {loading && <p style={{ color: "#888" }}>Loading team...</p>}

      {team && (
        <div>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
            💡 Find your Team ID in the URL of your FPL team page
          </p>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#38003c",
              marginBottom: 10,
            }}
          >
            ⬆️ Starting XI
          </h3>
          {starters.map((p) => (
            <TeamCard key={p.id} player={p} />
          ))}
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#888",
              marginBottom: 10,
              marginTop: 16,
            }}
          >
            🪑 Bench
          </h3>
          {bench.map((p) => (
            <TeamCard key={p.id} player={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("search");
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
        margin: "0 auto",
        padding: "20px 16px",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 2,
            color: "#38003c",
            letterSpacing: -1,
          }}
        >
          ⚽ FIXTURE
        </h1>
        <p style={{ color: "#888", fontSize: 13, margin: 0 }}>
          FPL Fixture Analyzer
        </p>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setPage("search")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: page === "search" ? "#38003c" : "#fff",
            color: page === "search" ? "#fff" : "#38003c",
            border: "2px solid #38003c",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          🔍 Search
        </button>
        <button
          onClick={() => setPage("myteam")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            background: page === "myteam" ? "#38003c" : "#fff",
            color: page === "myteam" ? "#fff" : "#38003c",
            border: "2px solid #38003c",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          👕 My Team
        </button>
      </div>

      {page === "search" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchPlayers()}
              placeholder="Search player..."
              style={{
                flex: 1,
                padding: "11px 14px",
                borderRadius: 8,
                border: "2px solid #e0e0e0",
                fontSize: 15,
                outline: "none",
                minWidth: 0,
              }}
            />
            <button
              onClick={searchPlayers}
              style={{
                padding: "11px 16px",
                borderRadius: 8,
                background: "#38003c",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Search
            </button>
            <button
              onClick={clearSearch}
              style={{
                padding: "11px 12px",
                borderRadius: 8,
                background: "#fff",
                color: "#38003c",
                border: "2px solid #38003c",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Clear
            </button>
          </div>
          {loading && <p style={{ color: "#888" }}>Loading...</p>}
          {players.map((p) => (
            <PlayerRow key={p.id} player={p} />
          ))}
        </>
      )}

      {page === "myteam" && <MyTeam />}
    </div>
  );
}
