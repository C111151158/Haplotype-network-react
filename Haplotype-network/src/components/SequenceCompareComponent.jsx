import React, { useState } from "react";

// 計算相似度
const calculateSimilarity = (seq1, seq2) => {
  if (!seq1 || !seq2 || seq1.length !== seq2.length) return 0;
  let matches = 0;
  for (let i = 0; i < seq1.length; i++) {
    if (seq1[i] === seq2[i]) matches++;
  }
  return (matches / seq1.length) * 100;
};

// 解析 FASTA 檔
const parseFasta = (text) => {
  const lines = text.split(/\r?\n/);
  const result = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith(">")) {
      if (current) result.push(current);
      current = { name: line.substring(1).trim(), sequence: "" };
    } else if (current) {
      current.sequence += line.trim();
    }
  }
  if (current) result.push(current);
  return result;
};

const SequenceCompareComponent = () => {
  const [sequences, setSequences] = useState([]);
  const [selectedName, setSelectedName] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const totalPages = Math.ceil(filteredResults.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedResults = filteredResults.slice(startIdx, startIdx + itemsPerPage);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseFasta(e.target.result);
      setSequences(parsed);
      if (parsed.length > 0) {
        setSelectedName(parsed[0].name);
      }
    };
    reader.readAsText(file);
  };

  const filterBySimilarity = (rangeMin, rangeMax) => {
    const targetSeq = sequences.find((seq) => seq.name === selectedName);
    if (!targetSeq) return;

    const results = sequences
      .filter((seq) => seq.name !== selectedName)
      .map((seq) => {
        const similarity = calculateSimilarity(targetSeq.sequence, seq.sequence);
        return { name: seq.name, similarity: similarity.toFixed(2) };
      })
      .filter((seq) => seq.similarity >= rangeMin && seq.similarity <= rangeMax);

    setFilteredResults(results);
    setCurrentPage(1); // 重置頁碼
  };

  return (
    <div style={{ width: "400px" }}>
      <h3>基因序列比對</h3>
      <input type="file" accept=".fa,.fasta,.txt" onChange={handleFileChange} />

      {sequences.length > 0 && (
        <>
          <div style={{ marginTop: "10px" }}>
            <label>選擇基因：</label>
            <select value={selectedName} onChange={(e) => setSelectedName(e.target.value)}>
              {sequences.map((seq) => (
                <option key={seq.name} value={seq.name}>
                  {seq.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: "10px" }}>
            <button onClick={() => filterBySimilarity(100, 100)}>100%</button>
            <button onClick={() => filterBySimilarity(90, 99.99)}>90%–99%</button>
            <button onClick={() => filterBySimilarity(80, 89.99)}>80%–89%</button>
          </div>

          {/* 分頁按鈕：放在相似度按鈕下方 */}
          {filteredResults.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                上一頁
              </button>
              <span style={{ margin: "0 10px" }}>
                第 {currentPage} 頁 / 共 {totalPages} 頁
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                下一頁
              </button>
            </div>
          )}

          <div style={{ marginTop: "10px" }}>
            <h4>比對結果：</h4>
            {paginatedResults.length > 0 ? (
              <ul>
                {paginatedResults.map((res) => (
                  <li key={res.name}>
                    {res.name} – 相似度 {res.similarity}%
                  </li>
                ))}
              </ul>
            ) : (
              <p>無結果</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SequenceCompareComponent;