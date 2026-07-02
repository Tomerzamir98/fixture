import { useState } from "react";
import { API, POSITION_MAP, TEAM_MAP } from "../constants";
import { theme } from "../theme";

export function TeamCard({ player, dark }) {
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
