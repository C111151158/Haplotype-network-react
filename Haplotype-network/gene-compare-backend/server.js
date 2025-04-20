 // server.js
const express = require("express");
const cors = require("cors"); // ← 加這一行
const { Worker } = require("worker_threads");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors()); // ← 這裡啟用 CORS，允許從前端請求
app.use(express.json({ limit: "100mb" }));

app.post("/compare", (req, res) => {

    console.log("Received request:", req.body);
    
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
    console.error("Worker error:", err);
    res.status(500).json({ error: "Worker error" });
  });

  worker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Worker stopped with exit code ${code}`);

    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

});




 

