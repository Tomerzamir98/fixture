import { useState } from "react";
import { API } from "../constants";
import { theme } from "../theme";
import { TeamCard } from "./TeamCard";

export function MyTeam({ dark }) {
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
