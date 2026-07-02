import { useState } from "react";
import { API } from "../constants";
import { theme } from "../theme";

export function ChipAdvisor({ dark }) {
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
