require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

//-------------------------------------------------------------
// CONFIG GITHUB
//-------------------------------------------------------------
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const repoOwner = process.env.REPO_OWNER;     // SaiyanWorldRPG
const repoName = process.env.REPO_NAME;       // SaiyanWorld-RankingAPI
const filePath = process.env.FILE_PATH;       // ranking.json

//-------------------------------------------------------------
// FUNÇÃO: Carregar ranking do GitHub
//-------------------------------------------------------------
async function loadRanking() {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

  try {
    const response = await axios.get(url, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });

    const sha = response.data.sha;
    const content = Buffer.from(response.data.content, "base64").toString();
    const json = JSON.parse(content);

    console.log("Ranking carregado do GitHub.");
    return { json, sha };

  } catch (e) {
    console.log("Arquivo não existe no GitHub. Será criado.");
    return { json: { players: {} }, sha: null };
  }
}

//-------------------------------------------------------------
// FUNÇÃO: Salvar ranking no GitHub (FUNCIONANDO)
//-------------------------------------------------------------
async function saveRanking(json, sha) {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;

  const newContent = Buffer.from(JSON.stringify(json, null, 2)).toString("base64");

  const body = {
    message: "Atualizar ranking global",
    content: newContent
  };

  // Só envia SHA se existir
  if (sha) {
    body.sha = sha;
  }

  try {
    const response = await axios.put(url, body, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });

    console.log("Ranking atualizado no GitHub.");
    return response.data;

  } catch (e) {
    console.error("Erro ao salvar no GitHub:", e.response?.data || e.message);
    throw e;
  }
}

//-------------------------------------------------------------
// POST /api/ranking — jogo envia score
//-------------------------------------------------------------
app.post("/api/ranking", async (req, res) => {
  try {
    console.log("Corpo recebido:", req.body);

    const { player_id, player_name, score, outfit, timestamp } = req.body;

    if (!player_id || !player_name || !score) {
      console.log("Dados inválidos:", req.body);
      return res.status(400).json({ error: "Dados inválidos" });
    }

    const { json, sha } = await loadRanking();

    json.players[player_id] = {
      player_id,
      player_name,
      score,
      outfit: outfit || 0,
      timestamp: timestamp || new Date().toISOString()
    };

    await saveRanking(json, sha);

    console.log("Ranking salvo para:", player_id);
    return res.json({ success: true });

  } catch (e) {
    console.error("Erro ao salvar ranking:", e.message);
    return res.status(500).json({ error: "Erro interno" });
  }
});

//-------------------------------------------------------------
// GET /api/ranking — jogo consulta ranking
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
