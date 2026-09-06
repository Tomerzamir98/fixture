const axios = require("axios");

const FPL_BASE = "https://fantasy.premierleague.com/api";

// Cache
const cache = {};
const pending = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 דקות

const cachedGet = async (url) => {
  const now = Date.now();
  if (cache[url] && now - cache[url].time < CACHE_TTL) {
    return cache[url].data;
  }
  if (pending[url]) return pending[url];

  pending[url] = axios
    .get(url)
    .then((res) => {
      cache[url] = { data: res.data, time: Date.now() };
      return res.data;
    })
    .finally(() => {
      delete pending[url];
    });

  return pending[url];
};

const getBootstrap = async () => {
  return cachedGet(`${FPL_BASE}/bootstrap-static/`);
};

const getFixtures = async () => {
  return cachedGet(`${FPL_BASE}/fixtures/`);
};

const getPlayerSummary = async (playerId) => {
  return cachedGet(`${FPL_BASE}/element-summary/${playerId}/`);
};

module.exports = { getBootstrap, getFixtures, getPlayerSummary };
