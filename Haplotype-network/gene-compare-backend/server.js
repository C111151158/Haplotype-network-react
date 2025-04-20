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
 
 // === 3. 接收比對請求（使用 worker） ===
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
 
 // === 4. Server 啟動 ===
 app.listen(PORT, () => {
   console.log(`🚀 Server running at http://localhost:${PORT}`);
 });
 
