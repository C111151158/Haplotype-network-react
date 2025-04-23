 // server.js

const express = require("express");
const cors = require("cors");
const { Worker } = require("worker_threads");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "100mb" }));

// 🧠 暫存 gene 序列資料（記憶體版）
let geneSequences = {};

// 🧠 暫存 gene counts 編輯資料（來自 GeneTable）
let geneCounts = [];

// === 1. 接收上傳 gene 序列資料 ===
app.post("/uploadSequences", (req, res) => {
  const { sequences } = req.body;
  if (!sequences || typeof sequences !== "object") {
    return res.status(400).json({ error: "Invalid sequences" });
  }

  geneSequences = sequences;
  console.log("✔ 已儲存 gene sequences，共", Object.keys(sequences).length, "筆");
  res.json({ message: "Gene sequences uploaded and stored." });
});

// === 2. 提供前端查詢目前的 geneNames 和 sequences ===
app.get("/sequences", (req, res) => {
  const geneNames = Object.keys(geneSequences);
  res.json({ geneNames, sequences: geneSequences });
});

app.post("/compare", (req, res) => {
  const { targetName, sequences } = req.body;

  if (!targetName || !sequences || !sequences[targetName]) {
    return res.status(400).json({ error: "Invalid request" });
  }

  const worker = new Worker(path.resolve(__dirname, "./worker.js"), {
    workerData: { targetName, sequences },
  });

  worker.on("message", (result) => {
    res.json(result);
  });

  worker.on("error", (err) => {
    console.error("❌ Worker error:", err);
    res.status(500).json({ error: "Worker error" });
  });

  worker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`⚠️ Worker stopped with exit code ${code}`);
    }
  });
});

// === 4. 儲存 GeneTable 編輯後的 counts ===
app.post("/saveGeneCounts", (req, res) => {
  const { genes } = req.body;
  if (!Array.isArray(genes)) {
    return res.status(400).json({ error: "Invalid gene data format" });
  }

  geneCounts = genes;
  console.log("✔ 已儲存 gene counts，共", genes.length, "筆");
  res.json({ message: "Gene counts saved successfully" });
});

// === 5. 取得目前 gene counts  ===
app.get("/getGeneCounts", (req, res) => {
  res.json({ genes: geneCounts });
});

// === 6. Server 啟動 ===
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

 
