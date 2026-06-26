const express = require("express");
const router = express.Router();
const { getBootstrap, getPlayerSummary } = require("../services/fplApi");
const { getPlayerVsOpponent } = require("../services/historicalData");

// GET /api/players?search=salah
router.get("/", async (req, res) => {
  try {
    const { search } = req.query;
    const data = await getBootstrap();

    let players = data.elements.map((p) => ({
      id: p.id,
      name: `${p.first_name} ${p.second_name}`,
      team: p.team,
      position: p.element_type,
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
    const bootstrap = await getBootstrap();

    const nextMatch = data.history[data.history.length - 1];
    if (!nextMatch) return res.json(null);

    const opponentId = nextMatch.opponent_team;

    const playerElement = bootstrap.elements.find(
      (e) => e.id === parseInt(req.params.id),
    );
    const fullName = playerElement
      ? `${playerElement.first_name} ${playerElement.second_name}`
      : null;

    // נסה היסטוריה מ-CSV
    let vsOpponentHistorical = [];
    if (fullName) {
      vsOpponentHistorical = getPlayerVsOpponent(fullName, opponentId);
    }

    // fallback לעונה הנוכחית
    const vsOpponentCurrent = data.history.filter(
      (g) => g.opponent_team === opponentId,
    );
    const vsOpponent =
      vsOpponentHistorical.length > 0
        ? vsOpponentHistorical
        : vsOpponentCurrent;

    const avgPoints = vsOpponent.length
      ? (
          vsOpponent.reduce((s, g) => s + parseFloat(g.total_points || 0), 0) /
          vsOpponent.length
        ).toFixed(1)
      : null;

    const goals = vsOpponent.reduce(
      (s, g) => s + parseInt(g.goals_scored || 0),
      0,
    );
    const assists = vsOpponent.reduce(
      (s, g) => s + parseInt(g.assists || 0),
      0,
    );
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

    const avg = avgPoints ? parseFloat(avgPoints) : 0;
    const position = playerElement ? playerElement.element_type : 3;
    const formScore = parseFloat(formAvg) / 12;
    const vsScore = avg / 12;
    const score = Math.round(
      (vsScore * 0.4 + formScore * 0.4 + minutesPct * 0.2) * 100,
    );

    let startThreshold, considerThreshold;
    if (position === 1 || position === 2) {
      startThreshold = 4;
      considerThreshold = 2.5;
    } else if (position === 3) {
      startThreshold = 5.5;
      considerThreshold = 3.5;
    } else {
      startThreshold = 5;
      considerThreshold = 3;
    }

    const recommendation =
      avg >= startThreshold
        ? "START"
        : avg >= considerThreshold
          ? "CONSIDER"
          : "BENCH";

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
      dataSource:
        vsOpponentHistorical.length > 0
          ? `${vsOpponentHistorical.length} games (3 seasons)`
          : `${vsOpponentCurrent.length} games (this season)`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team/:teamId/:gw
router.get("/team/:teamId/:gw", async (req, res) => {
  try {
    const { teamId, gw } = req.params;
    const axios = require("axios");

    // שליפת השחקנים בהרכב
    const picksRes = await axios.get(
      `https://fantasy.premierleague.com/api/entry/${teamId}/event/${gw}/picks/`,
    );
    const picks = picksRes.data.picks;

    // שליפת כל השחקנים
    const bootstrap = await getBootstrap();

    const players = picks.map((pick) => {
      const player = bootstrap.elements.find((e) => e.id === pick.element);
      return {
        id: player.id,
        name: `${player.first_name} ${player.second_name}`,
        position: player.element_type,
        price: player.now_cost / 10,
        totalPoints: player.total_points,
        form: player.form,
        multiplier: pick.multiplier, // 0=bench, 1=playing, 2=captain, 3=triple
        isCaptain: pick.is_captain,
        isViceCaptain: pick.is_vice_captain,
        pickPosition: pick.position, // 1-11 = starting, 12-15 = bench
      };
    });

    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/price-tracker
router.get("/price-tracker", async (req, res) => {
  try {
    const data = await getBootstrap();
    const players = data.elements.map((p) => ({
      id: p.id,
      name: `${p.first_name} ${p.second_name}`,
      position: p.element_type,
      price: p.now_cost / 10,
      transfersIn: p.transfers_in_event,
      transfersOut: p.transfers_out_event,
      net: p.transfers_in_event - p.transfers_out_event,
    }));

    const sorted = players
      .filter((p) => Math.abs(p.net) > 1000)
      .sort((a, b) => b.net - a.net);

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
