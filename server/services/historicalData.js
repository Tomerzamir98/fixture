const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

let cachedData = null;

const loadHistoricalData = () => {
  if (cachedData) return cachedData;

  const seasons = ["2022-23", "2023-24", "2024-25"];
  const allRows = [];

  for (const season of seasons) {
    const filePath = path.join(
      __dirname,
      "../../data",
      `merged_gw_${season}.csv`,
    );
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    const rows = parse(content, { columns: true, skip_empty_lines: true });
    rows.forEach((r) => {
      r.season = season;
    });
    allRows.push(...rows);
  }

  cachedData = allRows;
  console.log(`Loaded ${allRows.length} historical rows`);
  return cachedData;
};

const getPlayerVsOpponent = (playerName, opponentTeamId) => {
  const data = loadHistoricalData();
  return data.filter(
    (r) =>
      r.name.toLowerCase() === playerName.toLowerCase() &&
      parseInt(r.opponent_team) === parseInt(opponentTeamId),
  );
};

module.exports = { loadHistoricalData, getPlayerVsOpponent };
