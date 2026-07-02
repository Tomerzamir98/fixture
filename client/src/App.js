import { useState, useEffect } from "react";
import { API, POSITION_MAP } from "./constants";
import { theme } from "./theme";
import { sanitize } from "./utils";
import { ChipAdvisor } from "./components/ChipAdvisor";
import { PriceTracker } from "./components/PriceTracker";
import { CompareTable } from "./components/CompareTable";
import { PlayerRow } from "./components/PlayerRow";
import { MyTeam } from "./components/MyTeam";

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
