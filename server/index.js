const express = require("express");
const cors = require("cors");
const playersRouter = require("./routes/players");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/players", playersRouter);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
