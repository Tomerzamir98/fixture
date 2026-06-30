const express = require("express");
const router = express.Router();
const { getBootstrap, getPlayerSummary } = require("../services/fplApi");
const { getPlayerVsOpponent } = require("../services/historicalData");
const axios = require("axios");

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

// GET /api/players/price-tracker
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

// GET /api/players/team/:teamId/:gw
router.get("/team/:teamId/:gw", async (req, res) => {
  try {
    const { teamId, gw } = req.params;

    const picksRes = await axios.get(
      `https://fantasy.premierleague.com/api/entry/${teamId}/event/${gw}/picks/`,
    );
    const picks = picksRes.data.picks;
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
        multiplier: pick.multiplier,
        isCaptain: pick.is_captain,
        isViceCaptain: pick.is_vice_captain,
        pickPosition: pick.position,
      };
    });

    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/chip-advisor/:teamId/:gw
router.get("/chip-advisor/:teamId/:gw", async (req, res) => {
  try {
    const { teamId, gw } = req.params;

    const historyRes = await axios.get(
      `https://fantasy.premierleague.com/api/entry/${teamId}/history/`,
    );
    const chipsUsed = historyRes.data.chips.map((c) => c.name);

    const picksRes = await axios.get(
      `https://fantasy.premierleague.com/api/entry/${teamId}/event/${gw}/picks/`,
    );
    const picks = picksRes.data.picks;

    const bootstrap = await getBootstrap();
    const currentGW = bootstrap.events.find((e) => e.is_current);
    const nextGW = bootstrap.events.find((e) => e.is_next);
    const gwId = nextGW?.id || currentGW?.id;

    const fixturesRes = await axios.get(
      `https://fantasy.premierleague.com/api/fixtures/?event=${gwId}`,
    );
    const fixtures = fixturesRes.data;

    const teamGameCount = {};
    fixtures.forEach((f) => {
      teamGameCount[f.team_h] = (teamGameCount[f.team_h] || 0) + 1;
      teamGameCount[f.team_a] = (teamGameCount[f.team_a] || 0) + 1;
    });

    const isDoubleGW = Object.values(teamGameCount).some((c) => c >= 2);
    const isBlankGW = fixtures.length < 8;

    const getPlayerRec = async (pick) => {
      const el = bootstrap.elements.find((e) => e.id === pick.element);
      if (!el) return null;
      try {
        const summary = await getPlayerSummary(pick.element);
        const nextMatch = summary.history[summary.history.length - 1];
        if (!nextMatch)
          return {
            id: pick.element,
            name: `${el.first_name} ${el.second_name}`,
            rec: "BENCH",
            score: 0,
            hasFixture: false,
            hasDouble: false,
            pickPosition: pick.position,
            isCaptain: pick.is_captain,
            avg: "0",
            formAvg: "0",
          };

        const opponentId = nextMatch.opponent_team;
        const fullName = `${el.first_name} ${el.second_name}`;
        const vsHistorical = getPlayerVsOpponent(fullName, opponentId);
        const vsCurrent = summary.history.filter(
          (g) => g.opponent_team === opponentId,
        );
        const vsOpponent = vsHistorical.length > 0 ? vsHistorical : vsCurrent;
        const avg = vsOpponent.length
          ? vsOpponent.reduce(
              (s, g) => s + parseFloat(g.total_points || 0),
              0,
            ) / vsOpponent.length
          : 0;

        const last5 = summary.history.slice(-5);
        const formAvg = last5.length
          ? last5.reduce((s, g) => s + g.total_points, 0) / last5.length
          : 0;
        const minutesPct = last5.length
          ? last5.filter((g) => g.minutes >= 60).length / last5.length
          : 0;

        const pos = el.element_type;
        const startT = pos <= 2 ? 4 : pos === 3 ? 5.5 : 5;
        const considerT = pos <= 2 ? 2.5 : pos === 3 ? 3.5 : 3;
        const rec =
          avg >= startT ? "START" : avg >= considerT ? "CONSIDER" : "BENCH";
        const score = Math.round(
          ((avg / 12) * 0.4 + (formAvg / 12) * 0.4 + minutesPct * 0.2) * 100,
        );

        const playerTeam = el.team;
        const hasFixture = !!teamGameCount[playerTeam];
        const hasDouble = (teamGameCount[playerTeam] || 0) >= 2;

        return {
          id: pick.element,
          name: fullName,
          position: pos,
          rec,
          score,
          avg: avg.toFixed(1),
          formAvg: formAvg.toFixed(1),
          hasFixture,
          hasDouble,
          isCaptain: pick.is_captain,
          isViceCaptain: pick.is_vice_captain,
          pickPosition: pick.position,
        };
      } catch (e) {
        return null;
      }
    };

    const allPlayerData = await Promise.all(picks.map(getPlayerRec));
    const validPlayers = allPlayerData.filter(Boolean);
    const starterData = validPlayers.filter((p) => p.pickPosition <= 11);
    const benchData = validPlayers.filter((p) => p.pickPosition > 11);

    const benchedStarters = starterData.filter((p) => p.rec === "BENCH").length;
    const wildcardReason =
      benchedStarters >= 4
        ? `⚠️ ${benchedStarters} of your starting 11 are rated BENCH — strong case to Wildcard.`
        : benchedStarters >= 2
          ? `${benchedStarters} of your starters are rated BENCH. Consider Wildcarding if you have other issues too.`
          : `Your squad looks solid — ${benchedStarters} starters rated BENCH. No urgent need to Wildcard.`;

    const benchAvg = benchData.length
      ? (
          benchData.reduce((s, p) => s + parseFloat(p.avg), 0) /
          benchData.length
        ).toFixed(1)
      : 0;
    const benchWithDouble = benchData.filter((p) => p.hasDouble).length;

    let bbReason = "";
    if (!isDoubleGW) {
      bbReason = `⏳ Wait for a Double GW. Your bench avg is ${benchAvg} pts — save it for when they play twice.`;
    } else if (parseFloat(benchAvg) < 3) {
      bbReason = `⚠️ Double GW detected but your bench avg is only ${benchAvg} pts. Consider improving your bench before activating.`;
    } else {
      bbReason = `✅ Double GW${gwId} detected! Your bench avg is ${benchAvg} pts${benchWithDouble > 0 ? ` and ${benchWithDouble} bench players have a double` : ""}. Good time to use it.`;
    }

    const bestCaptain = [...starterData].sort((a, b) => b.score - a.score)[0];
    let tcReason = "";
    if (!isDoubleGW) {
      tcReason = `⏳ Best used in a Double GW. Your best captain option is ${bestCaptain?.name} (score: ${bestCaptain?.score}/100).`;
    } else if (bestCaptain?.hasDouble) {
      tcReason = `✅ Double GW${gwId} and ${bestCaptain?.name} has a double! Score: ${bestCaptain?.score}/100 — strong Triple Captain candidate.`;
    } else {
      tcReason = `⚠️ Double GW detected but ${bestCaptain?.name} (score: ${bestCaptain?.score}/100) may not have a double fixture.`;
    }

    const startersWithoutFixture = starterData.filter(
      (p) => !p.hasFixture,
    ).length;
    let fhReason = "";
    if (startersWithoutFixture >= 4) {
      fhReason = `✅ ${startersWithoutFixture} of your starters have no fixture this GW — good time to use Free Hit.`;
    } else if (isBlankGW) {
      fhReason = `⚠️ Blank GW detected. ${startersWithoutFixture} of your starters affected.`;
    } else {
      fhReason = `⏳ ${startersWithoutFixture} starters without a fixture. Best used when 4+ starters are blanked.`;
    }

    const ALL_CHIPS = ["wildcard", "bboost", "3xc", "freehit"];
    const CHIP_LABELS = {
      wildcard: "🃏 Wildcard",
      bboost: "🪑 Bench Boost",
      "3xc": "3️⃣ Triple Captain",
      freehit: "🆓 Free Hit",
    };

    const chips = ALL_CHIPS.map((chip) => {
      const used = chipsUsed.includes(chip);
      let recommendation = "";
      let status = "neutral";

      if (used) {
        recommendation = "Already used this season.";
        status = "used";
      } else if (chip === "wildcard") {
        recommendation = wildcardReason;
        status =
          benchedStarters >= 4
            ? "good"
            : benchedStarters >= 2
              ? "neutral"
              : "bad";
      } else if (chip === "bboost") {
        recommendation = bbReason;
        status = !isDoubleGW
          ? "bad"
          : parseFloat(benchAvg) < 3
            ? "neutral"
            : "good";
      } else if (chip === "3xc") {
        recommendation = tcReason;
        status =
          isDoubleGW && bestCaptain?.hasDouble
            ? "good"
            : !isDoubleGW
              ? "bad"
              : "neutral";
      } else if (chip === "freehit") {
        recommendation = fhReason;
        status =
          startersWithoutFixture >= 4 ? "good" : isBlankGW ? "neutral" : "bad";
      }

      return { chip, label: CHIP_LABELS[chip], used, status, recommendation };
    });

    res.json({
      chips,
      isDoubleGW,
      isBlankGW,
      nextGW: gwId,
      currentGW: currentGW?.id || null,
      bestCaptain,
      benchAvg,
      benchedStarters,
    });
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

    let vsOpponentHistorical = [];
    if (fullName) {
      vsOpponentHistorical = getPlayerVsOpponent(fullName, opponentId);
    }

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

module.exports = router;
