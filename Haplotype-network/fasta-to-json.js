const fs = require("fs");
const path = require("path");

const fastaPath = path.join(__dirname, "Op-ASV1.fa"); // 你的檔案名
const raw = fs.readFileSync(fastaPath, "utf-8");

const lines = raw.trim().split("\n");
const sequences = {};
let currentName = "";

for (const line of lines) {
  if (line.startsWith(">")) {
    currentName = line.slice(1).trim();
    sequences[currentName] = "";
  } else {
    sequences[currentName] += line.trim();
  }
}

const output = {
  targetName: Object.keys(sequences)[0], // 用第一個當主比對基因
  sequences,
};

fs.writeFileSync("request.json", JSON.stringify(output, null, 2));
console.log("轉換完成，已輸出為 request.json");
