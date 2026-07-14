require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

//-------------------------------------------------------------
// CONFIGURAÇÕES DO GITHUB (USANDO VARIÁVEIS DO RAILWAY)
//-------------------------------------------------------------
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const repoOwner = process.env.REPO_OWNER;     // SaiyanWorldRPG
const repoName = process.env.REPO_NAME;       // Pokemon-Ranking
const filePath = process.env.FILE_PATH;       // ranking.json

//-------------------------------------------------------------
// FUNÇÃO: Carrega ranking do GitHub
//-------------------------------------------------------------
async function loadRanking() {
  try {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

    const response = await axios.get(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });

    const sha = response.data.sha;
    const content = Buffer.from(response.data.content, "base64").toString();
    const json = content ? JSON.parse(content) : { players: {} };

    return { json, sha };
  } catch (e) {
    console.error("Erro ao carregar ranking:", e.message);
    return { json: { players: {} }, sha: null };
  }
}

//-------------------------------------------------------------
// FUNÇÃO: Salva ranking no GitHub
//-------------------------------------------------------------
async function saveRanking(json, sha) {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

  const newContent = Buffer.from(JSON.stringify(json, null, 2)).toString("base64");

  return axios.put(
    url,
    {
      message: "Atualizar ranking global",
      content: newContent,
      sha: sha
    },
    {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    }
  );
}

//-------------------------------------------------------------
// POST /api/ranking — jogo envia score
//-------------------------------------------------------------
app.post("/api/ranking", async (req, res) => {
  try {
    const { player_id, player_name, score, timestamp } = req.body;

    if (!player_id || !player_name || !score) {
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const { json, sha } = await loadRanking();

    if (!json.players) json.players = {};

    json.players[player_id] = {
      player_id,
      player_name,
      score,
      timestamp: timestamp || new Date().toISOString()
    };

    await saveRanking(json, sha);

    return res.json({ success: true });
  } catch (e) {
    console.error("Erro ao salvar ranking:", e.message);
    return res.status(500).json({ error: "Erro interno" });
  }
});

//-------------------------------------------------------------
// GET /api/ranking — jogo ou bot consulta ranking
//-------------------------------------------------------------
app.get("/api/ranking", async (req, res) => {
  try {
    const { json } = await loadRanking();
    return res.json(json);
  } catch (e) {
    console.error("Erro ao carregar ranking:", e.message);
    return res.status(500).json({ error: "Erro interno" });
  }
});

//-------------------------------------------------------------
// INICIAR SERVIDOR
//-------------------------------------------------------------
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Ranking API rodando na porta ${PORT}`);
});
