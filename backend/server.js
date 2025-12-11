const express = require("express");
const cors = require("cors");
const sociosRouter = require("./routes/socios");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Rutas API
app.use("/api", sociosRouter);

app.get("/", (req, res) => {
  res.send("Servidor backend del Gym funcionando");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
