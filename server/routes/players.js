const express = require("express");
const router = express.Router();
const { getBootstrap, getPlayerSummary } = require("../services/fplApi");

// GET /api/players?search=salah
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    const data = await getBootstrap();

    let players = data.elements.map((p) => ({
      id: p.id,
      name: `${p.first_name} ${p.second_name}`,
      team: p.team,
      position: p.element_type, // 1=GK 2=DEF 3=MID 4=FWD
      price: p.now_cost / 10,
      totalPoints: p.total_points,
      form: p.form,
    }));

    if (search) {
      players = players.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/:id/fixtures
router.get("/:id/fixtures", async (req, res) => {
  try {
    const data = await getPlayerSummary(req.params.id);
    res.json(data.history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/:id/recommendation
// TODO: כשהעונה תחזור — להחליף history.slice(-1) ב-fixtures.slice(0,1)
router.get("/:id/recommendation", async (req, res) => {
  try {
    const data = await getPlayerSummary(req.params.id);

    const nextMatch = data.history[data.history.length - 1];
    if (!nextMatch) return res.json(null);

    const opponentId = nextMatch.opponent_team;
    const vsOpponent = data.history.filter(
      (g) => g.opponent_team === opponentId,
    );

    const avgPoints = vsOpponent.length
      ? (
          vsOpponent.reduce((s, g) => s + g.total_points, 0) / vsOpponent.length
        ).toFixed(1)
      : null;

    const goals = vsOpponent.reduce((s, g) => s + g.goals_scored, 0);
    const assists = vsOpponent.reduce((s, g) => s + g.assists, 0);
    const gamesVs = vsOpponent.length;

    const last5 = data.history.slice(-5);
    const formAvg = last5.length
      ? (last5.reduce((s, g) => s + g.total_points, 0) / last5.length).toFixed(
          1,
        )
      : 0;

    const minutesPct = last5.length
      ? last5.filter((g) => g.minutes >= 60).length / last5.length
      : 0;

    const vsScore = avgPoints ? parseFloat(avgPoints) / 12 : 0.5;
    const formScore = parseFloat(formAvg) / 12;
    const score = Math.round(
      (vsScore * 0.35 + formScore * 0.45 + minutesPct * 0.2) * 100,
    );

    const recommendation =
      score >= 65 ? "START" : score >= 45 ? "CONSIDER" : "BENCH";

    res.json({
      opponent: opponentId,
      isHome: nextMatch.was_home,
      round: nextMatch.round,
      score,
      recommendation,
      gamesVs,
      avgPoints,
      goals,
      assists,
      formAvg,
      minutesPct: Math.round(minutesPct * 100),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
