import { useState } from "react";
import { API, POSITION_MAP, TEAM_MAP } from "../constants";
import { theme } from "../theme";
import { calcBreakdown, pointsColor, difficultyColor } from "../utils";

export function PlayerRow({ player, onAddCompare, inCompare, dark }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [rec, setRec] = useState(null);
  const [loading, setLoading] = useState(false);
  const t = theme(dark);

  const toggle = async () => {
    if (!open && history.length === 0) {
      setLoading(true);
      try {
        const [histRes, upcomingRes, recRes] = await Promise.all([
          fetch(`${API}/api/players/${player.id}/fixtures`),
          fetch(`${API}/api/players/${player.id}/upcoming`),
          fetch(`${API}/api/players/${player.id}/recommendation`),
        ]);
        const histData = await histRes.json();
        const upcomingData = await upcomingRes.json();
        const recData = await recRes.json();
        setHistory(histData);
        setUpcoming(upcomingData);
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
          {!loading && upcoming.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: t.text2,
                  marginBottom: 8,
                }}
              >
                🗓 Next {upcoming.length} Fixtures
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  paddingBottom: 8,
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {upcoming.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      flex: "0 0 90px",
                      borderRadius: 10,
                      overflow: "hidden",
                      border: `1px solid ${t.border}`,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                      textAlign: "center",
                      background: t.card,
                    }}
                  >
                    <div
                      style={{
                        background: difficultyColor(f.difficulty),
                        color: "#fff",
                        padding: "8px 6px",
                      }}
                    >
                      <div
                        style={{ fontSize: 11, fontWeight: 600, opacity: 0.85 }}
                      >
                        GW{f.round}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>
                        {TEAM_MAP[f.opponent] || `T${f.opponent}`}{" "}
                        {f.isHome ? "🏠" : "✈️"}
                      </div>
                    </div>
                    <div style={{ padding: "6px 4px", fontSize: 11, color: t.text3 }}>
                      {new Date(f.kickoffTime).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                ))}
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
