export const sanitize = (str) => str.replace(/[^a-zA-Z\s'-]/g, "").slice(0, 50);

export const pointsColor = (pts) => {
  if (pts >= 9) return "#00985f";
  if (pts >= 6) return "#00b87a";
  if (pts >= 2) return "#d4a017";
  return "#c0392b";
};

export const calcBreakdown = (f, position) => {
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
