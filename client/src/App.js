import { useState, useEffect } from "react";

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

const sanitize = (str) => str.replace(/[^a-zA-Z\s'-]/g, "").slice(0, 50);

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

const theme = (dark) => ({
  bg: dark ? "#0f0f0f" : "#f4f4f4",
  card: dark ? "#1a1a1a" : "#fff",
  cardOpen: dark ? "#1e1224" : "#f5eef8",
  bg2: dark ? "#222" : "#fafafa",
  border: dark ? "#333" : "#e0e0e0",
  border2: dark ? "#444" : "#ececec",
  text: dark ? "#f0f0f0" : "#333",
  text2: dark ? "#aaa" : "#666",
  text3: dark ? "#666" : "#888",
  inputBg: dark ? "#1a1a1a" : "#fff",
  dropdownBg: dark ? "#1a1a1a" : "#fff",
  dropdownHover: dark ? "#2a1a2e" : "#f5eef8",
  tableHeader: dark ? "#1e1224" : "#f5eef8",
  tableBg1: dark ? "#1a1a1a" : "#fff",
  tableBg2: dark ? "#141414" : "#fafafa",
  navActive: "#38003c",
  navInactiveColor: dark ? "#a78bfa" : "#38003c",
  navBorder: dark ? "#a78bfa" : "#38003c",
});

function ChipAdvisor({ dark }) {
  const [teamId, setTeamId] = useState("");
  const [gw, setGw] = useState("38");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const t = theme(dark);

  const load = async () => {
    const safeId = teamId.replace(/[^0-9]/g, "").slice(0, 10);
    if (!safeId) return;
    setLoading(true);
    setError(null);
    try {
      const safeGw = gw.replace(/[^0-9]/g, "").slice(0, 2);
      const res = await fetch(
        `${API}/api/players/chip-advisor/${safeId}/${safeGw}`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (err) {
      setError("Team not found. Check your Team ID.");
    }
    setLoading(false);
  };

  const statusColor = (status) =>
    status === "good"
      ? "#00985f"
      : status === "bad"
        ? "#c0392b"
        : status === "used"
          ? "#888"
          : "#d4a017";

  return (
    <div>
      <p style={{ fontSize: 12, color: t.text3, marginBottom: 16 }}>
        🃏 Enter your FPL Team ID to see which chips you have left and when to
        use them.
      </p>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          value={teamId}
          onChange={(e) => setTeamId(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="FPL Team ID (e.g. 6359518)"
          style={{
            flex: 1,
            padding: "11px 14px",
            borderRadius: 8,
            border: `2px solid ${t.border}`,
            fontSize: 14,
            outline: "none",
            background: t.inputBg,
            color: t.text,
          }}
        />
        <input
          value={gw}
          onChange={(e) => setGw(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="GW"
          style={{
            width: 70,
            padding: "11px 10px",
            borderRadius: 8,
            border: `2px solid ${t.border}`,
            fontSize: 14,
            outline: "none",
            background: t.inputBg,
            color: t.text,
          }}
        />
        <button
          onClick={load}
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
          Analyse
        </button>
      </div>

      {error && <p style={{ color: "#c0392b", fontSize: 14 }}>{error}</p>}
      {loading && <p style={{ color: t.text3 }}>Loading...</p>}

      {data && (
        <div>
          {data.isDoubleGW && (
            <div
              style={{
                background: "#00985f",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              🔥 Double GW{data.nextGW} detected! Great time for Bench Boost or
              Triple Captain.
            </div>
          )}
          {data.isBlankGW && (
            <div
              style={{
                background: "#d4a017",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ⚠️ Blank GW{data.nextGW} detected! Consider using Free Hit.
            </div>
          )}
          {data.chips.map((chip) => (
            <div
              key={chip.chip}
              style={{
                marginBottom: 12,
                borderRadius: 10,
                border: `2px solid ${chip.used ? t.border : statusColor(chip.status)}`,
                background: t.card,
                overflow: "hidden",
                opacity: chip.used ? 0.6 : 1,
              }}
            >
              <div style={{ padding: "14px 16px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <strong style={{ fontSize: 16, color: t.text }}>
                    {chip.label}
                  </strong>
                  <span
                    style={{
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      background: statusColor(chip.status),
                      color: "#fff",
                    }}
                  >
                    {chip.used
                      ? "USED"
                      : chip.status === "good"
                        ? "USE NOW"
                        : "WAIT"}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: t.text2,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {chip.recommendation}
                </p>
              </div>
            </div>
          ))}
          <p style={{ fontSize: 11, color: t.text3, marginTop: 8 }}>
            GW{data.currentGW} ·{" "}
            {data.nextGW ? `Next GW: ${data.nextGW}` : "Season ended"}
          </p>
        </div>
      )}
    </div>
  );
}

function PriceTracker({ dark }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("rise");
  const t = theme(dark);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/api/players/price-tracker`);
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = players
    .filter((p) => filter === "all" || p.position === parseInt(filter))
    .filter((p) => (view === "rise" ? p.net > 0 : p.net < 0))
    .slice(0, 20);

  const formatNet = (n) =>
    n > 0 ? `+${n.toLocaleString()}` : n.toLocaleString();

  return (
    <div>
      <p style={{ fontSize: 12, color: t.text3, marginBottom: 16 }}>
        📊 Based on this GW's transfer activity. Players with high net transfers
        are likely to rise in price.
      </p>
      <div
        style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "1", "2", "3", "4"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                border: `1.5px solid ${t.navBorder}`,
                background: filter === f ? t.navActive : "transparent",
                color: filter === f ? "#fff" : t.navInactiveColor,
              }}
            >
              {f === "all" ? "All" : POSITION_MAP[parseInt(f)]}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          <button
            onClick={() => setView("rise")}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              border: "1.5px solid #00985f",
              background: view === "rise" ? "#00985f" : "transparent",
              color: view === "rise" ? "#fff" : "#00985f",
            }}
          >
            📈 Rising
          </button>
          <button
            onClick={() => setView("fall")}
            style={{
              padding: "5px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              border: "1.5px solid #c0392b",
              background: view === "fall" ? "#c0392b" : "transparent",
              color: view === "fall" ? "#fff" : "#c0392b",
            }}
          >
            📉 Falling
          </button>
        </div>
      </div>
      {loading && <p style={{ color: t.text3 }}>Loading...</p>}
      {!loading && filtered.length === 0 && (
        <p style={{ color: t.text3, fontSize: 14 }}>
          No data available for this GW yet.
        </p>
      )}
      {!loading &&
        filtered.map((p, i) => {
          const isRise = p.net > 0;
          const barWidth = Math.min((Math.abs(p.net) / 100000) * 100, 100);
          return (
            <div
              key={p.id}
              style={{
                marginBottom: 10,
                borderRadius: 10,
                border: `1.5px solid ${t.border}`,
                background: t.card,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "12px 14px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: t.text3,
                        fontWeight: 700,
                        minWidth: 20,
                      }}
                    >
                      #{i + 1}
                    </span>
                    <strong style={{ fontSize: 14, color: t.text }}>
                      {p.name}
                    </strong>
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
                      {POSITION_MAP[p.position]}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <span style={{ fontSize: 13, color: t.text2 }}>
                      £{p.price}m
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isRise ? "#00985f" : "#c0392b",
                      }}
                    >
                      {isRise ? "↑" : "↓"} {formatNet(p.net)}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    background: t.border,
                    borderRadius: 4,
                    height: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 4,
                      width: `${barWidth}%`,
                      background: isRise ? "#00985f" : "#c0392b",
                      transition: "width 0.3s",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 6,
                    fontSize: 11,
                    color: t.text3,
                  }}
                >
                  <span>🟢 In: {p.transfersIn.toLocaleString()}</span>
                  <span>🔴 Out: {p.transfersOut.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

function CompareTable({ players, onClose, dark }) {
  const [recs, setRecs] = useState({});
  const t = theme(dark);

  useState(() => {
    players.forEach(async (p) => {
      try {
        const res = await fetch(`${API}/api/players/${p.id}/recommendation`);
        const data = await res.json();
        setRecs((prev) => ({ ...prev, [p.id]: data }));
      } catch (err) {
        console.error(err);
      }
    });
  }, []);

  const recColor = (r) =>
    r === "START" ? "#00985f" : r === "CONSIDER" ? "#d4a017" : "#c0392b";
  const recLabel = (r) =>
    r === "START" ? "✅ START" : r === "CONSIDER" ? "⚠️ CONSIDER" : "❌ BENCH";

  const rows = [
    { label: "Position", key: (p) => POSITION_MAP[p.position] },
    { label: "Price", key: (p) => `£${p.price}m` },
    { label: "Total pts", key: (p) => `${p.totalPoints}pts` },
    {
      label: "Next match",
      key: (p) =>
        recs[p.id]
          ? `vs ${TEAM_MAP[recs[p.id].opponent]} ${recs[p.id].isHome ? "🏠" : "✈️"}`
          : "—",
    },
    {
      label: "Recommendation",
      key: (p) => (recs[p.id] ? recLabel(recs[p.id].recommendation) : "—"),
      color: (p) => (recs[p.id] ? recColor(recs[p.id].recommendation) : "#888"),
    },
    {
      label: "Avg vs opponent",
      key: (p) =>
        recs[p.id]
          ? `${recs[p.id].avgPoints} pts (${recs[p.id].gamesVs} games)`
          : "—",
    },
    {
      label: "Form avg (last 5)",
      key: (p) => (recs[p.id] ? `${recs[p.id].formAvg} pts` : "—"),
    },
    {
      label: "Score",
      key: (p) => (recs[p.id] ? `${recs[p.id].score}/100` : "—"),
    },
  ];

  return (
    <div
      style={{
        marginTop: 24,
        borderRadius: 12,
        border: "2px solid #38003c",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "#38003c",
          color: "#fff",
          padding: "12px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong style={{ fontSize: 15 }}>⚖️ Player Comparison</strong>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            fontSize: 18,
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr style={{ background: t.tableHeader }}>
              <th
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#38003c",
                  borderBottom: `1px solid ${t.border}`,
                  minWidth: 130,
                }}
              ></th>
              {players.map((p) => (
                <th
                  key={p.id}
                  style={{
                    padding: "10px 14px",
                    textAlign: "center",
                    fontWeight: 700,
                    color: "#38003c",
                    borderBottom: `1px solid ${t.border}`,
                    minWidth: 120,
                  }}
                >
                  {p.name.split(" ").slice(-1)[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                style={{ background: i % 2 === 0 ? t.tableBg1 : t.tableBg2 }}
              >
                <td
                  style={{
                    padding: "10px 14px",
                    fontWeight: 600,
                    color: t.text2,
                    borderBottom: `1px solid ${t.border2}`,
                  }}
                >
                  {row.label}
                </td>
                {players.map((p) => (
                  <td
                    key={p.id}
                    style={{
                      padding: "10px 14px",
                      textAlign: "center",
                      borderBottom: `1px solid ${t.border2}`,
                      background: row.color ? row.color(p) : "transparent",
                      color: row.color ? "#fff" : t.text,
                      fontWeight: row.color ? 700 : 400,
                    }}
                  >
                    {row.key(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlayerRow({ player, onAddCompare, inCompare, dark }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(false);
  const t = theme(dark);

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
        border: `2px solid ${open ? "#38003c" : t.border}`,
        overflow: "hidden",
        boxShadow: open
          ? "0 4px 16px rgba(56,0,60,0.15)"
          : "0 1px 4px rgba(0,0,0,0.08)",
      }}
    >
      <div
        onClick={toggle}
        style={{
          padding: "12px 14px",
          cursor: "pointer",
          background: open ? t.cardOpen : t.card,
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
              color: t.text,
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddCompare(player);
            }}
            style={{
              padding: "3px 8px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              background: inCompare ? "#38003c" : "transparent",
              color: inCompare ? "#fff" : t.navInactiveColor,
              border: `1.5px solid ${t.navBorder}`,
            }}
          >
            {inCompare ? "✓ Added" : "+ Compare"}
          </button>
          <span style={{ fontSize: 12, color: t.text, fontWeight: 600 }}>
            {player.totalPoints}pts
          </span>
          <span style={{ fontSize: 12, color: t.text2 }}>£{player.price}m</span>
          <span style={{ fontSize: 14, color: "#38003c" }}>
            {open ? "▲" : "▼"}
          </span>
        </div>
      </div>
      {open && (
        <div
          style={{
            padding: "14px 12px 16px",
            background: t.bg2,
            borderTop: `1px solid ${t.border2}`,
          }}
        >
          {loading && (
            <p style={{ color: t.text3, fontSize: 14 }}>Loading...</p>
          )}
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
            <p style={{ color: t.text3, fontSize: 14 }}>No data found.</p>
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
                      border: `1px solid ${t.border}`,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
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
                        background: t.card,
                        padding: "8px 8px",
                        minHeight: 40,
                      }}
                    >
                      {breakdown.length === 0 ? (
                        <div
                          style={{
                            fontSize: 11,
                            color: t.text3,
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
                              color: t.text,
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

function TeamCard({ player, dark }) {
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const t = theme(dark);

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
        border: `2px solid ${player.isCaptain ? "#f4a700" : player.isViceCaptain ? "#888" : t.border}`,
        background: player.pickPosition > 11 ? t.bg2 : t.card,
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
                background: "#555",
                color: "#ccc",
                padding: "1px 5px",
                borderRadius: 4,
                fontWeight: 700,
              }}
            >
              BENCH
            </span>
          )}
          <strong style={{ fontSize: 14, color: t.text }}>{player.name}</strong>
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
        <div style={{ fontSize: 12, color: t.text2 }}>£{player.price}m</div>
      </div>
      <div style={{ marginTop: 8 }}>
        {loading && (
          <span style={{ fontSize: 12, color: t.text3 }}>Loading...</span>
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
            <span style={{ fontSize: 11, color: t.text2 }}>
              vs {TEAM_MAP[rec.opponent]} {rec.isHome ? "🏠" : "✈️"} · avg{" "}
              {rec.avgPoints} pts ({rec.gamesVs} games)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MyTeam({ dark }) {
  const [teamId, setTeamId] = useState("");
  const [gw, setGw] = useState("38");
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const t = theme(dark);

  const loadTeam = async () => {
    if (!teamId) return;
    const safeId = teamId.replace(/[^0-9]/g, "").slice(0, 10);
    const safeGw = gw.replace(/[^0-9]/g, "").slice(0, 2);
    if (!safeId || !safeGw) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/players/team/${safeId}/${safeGw}`);
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
          onChange={(e) => setTeamId(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="FPL Team ID (e.g. 6359518)"
          style={{
            flex: 1,
            minWidth: 180,
            padding: "11px 14px",
            borderRadius: 8,
            border: `2px solid ${t.border}`,
            fontSize: 14,
            outline: "none",
            background: t.inputBg,
            color: t.text,
          }}
        />
        <input
          value={gw}
          onChange={(e) => setGw(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="GW"
          style={{
            width: 70,
            padding: "11px 10px",
            borderRadius: 8,
            border: `2px solid ${t.border}`,
            fontSize: 14,
            outline: "none",
            background: t.inputBg,
            color: t.text,
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
      {loading && <p style={{ color: t.text3 }}>Loading team...</p>}
      {team && (
        <div>
          <p style={{ fontSize: 12, color: t.text3, marginBottom: 16 }}>
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
            <TeamCard key={p.id} player={p} dark={dark} />
          ))}
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: t.text2,
              marginBottom: 10,
              marginTop: 16,
            }}
          >
            🪑 Bench
          </h3>
          {bench.map((p) => (
            <TeamCard key={p.id} player={p} dark={dark} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(false);
  const [page, setPage] = useState("search");
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [comparePlayers, setComparePlayers] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const t = theme(dark);

  useEffect(() => {
    document.body.style.background = t.bg;
    document.body.style.margin = "0";
  }, [dark, t.bg]);

  const clearSearch = () => {
    setSearch("");
    setSuggestions([]);
    setResults([]);
    setSelectedPlayer(null);
    setShowDropdown(false);
  };

  const fetchSuggestions = async (value) => {
    const term = sanitize(value);
    if (!term || term.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await fetch(
        `${API}/api/players?search=${encodeURIComponent(term)}`,
      );
      const data = await res.json();
      setSuggestions(data.slice(0, 8));
      setShowDropdown(true);
    } catch (err) {
      console.error(err);
    }
  };

  const searchAll = async () => {
    const term = sanitize(search);
    if (!term || term.length < 2) return;
    setLoading(true);
    setShowDropdown(false);
    setSelectedPlayer(null);
    setSuggestions([]);
    try {
      const res = await fetch(
        `${API}/api/players?search=${encodeURIComponent(term)}`,
      );
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const selectPlayer = (player) => {
    setSearch(player.name);
    setSelectedPlayer(player);
    setResults([]);
    setSuggestions([]);
    setShowDropdown(false);
  };

  const toggleCompare = (player) => {
    if (comparePlayers.find((p) => p.id === player.id)) {
      setComparePlayers(comparePlayers.filter((p) => p.id !== player.id));
    } else if (comparePlayers.length < 4) {
      setComparePlayers([...comparePlayers, player]);
    }
  };

  const displayedPlayers = selectedPlayer ? [selectedPlayer] : results;

  const navBtn = (id, label) => (
    <button
      key={id}
      onClick={() => setPage(id)}
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        background: page === id ? t.navActive : "transparent",
        color: page === id ? "#fff" : t.navInactiveColor,
        border: `2px solid ${t.navBorder}`,
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        background: t.bg,
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div>
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
            <p style={{ color: t.text3, fontSize: 13, margin: 0 }}>
              FPL Fixture Analyzer
            </p>
          </div>
          <button
            onClick={() => setDark(!dark)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: t.card,
              border: `1px solid ${t.border}`,
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            {dark ? "☀️" : "🌙"}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {navBtn("search", "🔍 Search")}
          {navBtn("myteam", "👕 My Team")}
          {navBtn("tracker", "📈 Price Tracker")}
          {navBtn("chips", "🃏 Chip Advisor")}
        </div>

        {page === "search" && (
          <>
            <div style={{ position: "relative", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={search}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearch(val);
                    setSelectedPlayer(null);
                    setResults([]);
                    clearTimeout(window._searchTimer);
                    window._searchTimer = setTimeout(
                      () => fetchSuggestions(val),
                      300,
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") searchAll();
                  }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  onFocus={() =>
                    suggestions.length > 0 && setShowDropdown(true)
                  }
                  placeholder="Search player (e.g. Salah, Haaland...)"
                  style={{
                    flex: 1,
                    padding: "11px 14px",
                    borderRadius: 8,
                    border: `2px solid ${t.border}`,
                    fontSize: 15,
                    outline: "none",
                    minWidth: 0,
                    background: t.inputBg,
                    color: t.text,
                  }}
                />
                <button
                  onClick={clearSearch}
                  style={{
                    padding: "11px 12px",
                    borderRadius: 8,
                    background: "transparent",
                    color: t.navInactiveColor,
                    border: `2px solid ${t.navBorder}`,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  Clear
                </button>
              </div>

              {showDropdown && suggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: t.dropdownBg,
                    border: `2px solid ${t.border}`,
                    borderRadius: 8,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                    zIndex: 100,
                    overflow: "hidden",
                    marginTop: 4,
                  }}
                >
                  {suggestions.map((p) => (
                    <div
                      key={p.id}
                      onMouseDown={() => selectPlayer(p)}
                      style={{
                        padding: "10px 14px",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderBottom: `1px solid ${t.border2}`,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = t.dropdownHover)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = t.dropdownBg)
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: t.text,
                          }}
                        >
                          {p.name}
                        </span>
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
                          {POSITION_MAP[p.position]}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: t.text3 }}>
                        £{p.price}m · {p.totalPoints}pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {loading && <p style={{ color: t.text3 }}>Loading...</p>}

            {displayedPlayers.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                onAddCompare={toggleCompare}
                inCompare={!!comparePlayers.find((c) => c.id === p.id)}
                dark={dark}
              />
            ))}

            {comparePlayers.length > 0 && (
              <div
                style={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "#38003c",
                  color: "#fff",
                  padding: "12px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  zIndex: 200,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  ⚖️ Compare:
                </span>
                {comparePlayers.map((p) => (
                  <span
                    key={p.id}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 12,
                    }}
                  >
                    {p.name.split(" ").slice(-1)[0]}
                    <button
                      onClick={() => toggleCompare(p)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#fff",
                        cursor: "pointer",
                        marginLeft: 4,
                        fontSize: 12,
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {comparePlayers.length >= 2 && (
                  <button
                    onClick={() => setShowCompare(!showCompare)}
                    style={{
                      marginLeft: "auto",
                      padding: "6px 16px",
                      borderRadius: 8,
                      background: "#fff",
                      color: "#38003c",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {showCompare ? "Hide" : "Compare →"}
                  </button>
                )}
                <button
                  onClick={() => {
                    setComparePlayers([]);
                    setShowCompare(false);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Clear all
                </button>
              </div>
            )}

            {showCompare && comparePlayers.length >= 2 && (
              <div style={{ marginBottom: comparePlayers.length > 0 ? 80 : 0 }}>
                <CompareTable
                  players={comparePlayers}
                  onClose={() => setShowCompare(false)}
                  dark={dark}
                />
              </div>
            )}

            {comparePlayers.length > 0 && <div style={{ height: 70 }} />}
          </>
        )}

        {page === "myteam" && <MyTeam dark={dark} />}
        {page === "tracker" && <PriceTracker dark={dark} />}
        {page === "chips" && <ChipAdvisor dark={dark} />}
      </div>
    </div>
  );
}
