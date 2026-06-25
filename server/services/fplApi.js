const axios = require("axios");

const FPL_BASE = "https://fantasy.premierleague.com/api";

const getBootstrap = async () => {
  const res = await axios.get(`${FPL_BASE}/bootstrap-static/`);
  return res.data;
};

const getFixtures = async () => {
  const res = await axios.get(`${FPL_BASE}/fixtures/`);
  return res.data;
};

const getPlayerSummary = async (playerId) => {
  const res = await axios.get(`${FPL_BASE}/element-summary/${playerId}/`);
  return res.data;
};

module.exports = { getBootstrap, getFixtures, getPlayerSummary };
