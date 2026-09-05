const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const data = await new Promise((resolve, reject) => {
    https
      .get(
        "https://fantasy.premierleague.com/api/bootstrap-static/",
        { headers: { "User-Agent": "Mozilla/5.0" } },
        (r) => {
          let body = "";
          r.on("data", (c) => (body += c));
          r.on("end", () => resolve(JSON.parse(body)));
        }
      )
      .on("error", reject);
  });
  const current = data.events.find((e) => e.is_current);
  const next = data.events.find((e) => e.is_next);
  const gw = current ? current.id : next ? next.id - 1 : 1;
  res.json({ gw });
};
