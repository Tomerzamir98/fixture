import { useState } from "react";
import { API, POSITION_MAP, TEAM_MAP } from "../constants";
import { theme } from "../theme";

export function CompareTable({ players, onClose, dark }) {
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
