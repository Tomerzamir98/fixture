import { useState, useEffect } from "react";
import { API, POSITION_MAP } from "../constants";
import { theme } from "../theme";

export function PriceTracker({ dark }) {
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
