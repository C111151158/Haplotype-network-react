import React, { useState } from "react";

// 工具函式：計算兩個序列的相似度百分比
const calculateSimilarity = (seq1, seq2) => {
  if (!seq1 || !seq2) return 0;
  const len = Math.min(seq1.length, seq2.length);
  let match = 0;
  for (let i = 0; i < len; i++) {
    if (seq1[i] === seq2[i]) match++;
  }
  return (match / len) * 100;
};

const GeneSelector = ({
  genes,
  selectedGene,
  setSelectedGene,
  geneColors,
  geneSequences, //從 App 傳入所有基因序列
  setActiveSimilarityGroup,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [similarGenes, setSimilarGenes] = useState([]);
  const pageSize = 15;

  const totalPages = Math.ceil(genes.length / pageSize);
  const currentGenes = genes.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  const handleSelect = (geneName) => {
    setSelectedGene(selectedGene === geneName ? null : geneName);
    setSimilarGenes([]); 
    setActiveSimilarityGroup([]);
  };

  const handlePageChange = (direction) => {
    setCurrentPage((prev) =>
      direction === "prev" ? Math.max(prev - 1, 0) : Math.min(prev + 1, totalPages - 1)
    );
  };

  const findSimilarGenes = (min, max) => {
    if (!selectedGene || !geneSequences[selectedGene]) return;

    const targetSeq = geneSequences[selectedGene];
    const matches = Object.entries(geneSequences)
      .filter(([name]) => name !== selectedGene)
      .map(([name, seq]) => ({
        name,
        similarity: calculateSimilarity(targetSeq, seq),
      }))
      .filter(({ similarity }) => similarity >= min && similarity < max)
      .sort((a, b) => b.similarity - a.similarity);

    setSimilarGenes(matches);
    setActiveSimilarityGroup(matches.map((m) => m.name));
  };

  return (
    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
      {/* 左側：基因選擇清單 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "5px", minWidth: "220px" }}>
        <button
          onClick={() => setSelectedGene(null)}
          style={{
            backgroundColor: selectedGene === null ? "#ddd" : "#fff",
            padding: "6px 12px",
            border: "1px solid #aaa",
            cursor: "pointer",
          }}
        >
          Selector
        </button>
  
        {currentGenes.map((gene) => (
          <button
            key={gene.name}
            onClick={() => handleSelect(gene.name)}
            style={{
              backgroundColor:
                selectedGene === gene.name ? "#cde" : geneColors[gene.name] || "#fff",
              color: "#000",
              border: "1px solid #aaa",
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            {gene.name}
          </button>
        ))}
  
        {/* 分頁控制 */}
        <div style={{ marginTop: "10px", display: "flex", justifyContent: "center", gap: "10px" }}>
          <button onClick={() => handlePageChange("prev")} disabled={currentPage === 0}>
            上一頁
          </button>
          <span>
            第 {currentPage + 1} 頁 / 共 {totalPages} 頁
          </span>
          <button onClick={() => handlePageChange("next")} disabled={currentPage === totalPages - 1}>
            下一頁
          </button>
        </div>
      </div>
  
      {/* 右側：相似度比對與結果 */}
      {selectedGene && (
        <div style={{ flex: 1 }}>
          <div>
            <strong>比對相似基因：</strong>
            <div style={{ display: "flex", gap: "10px", marginTop: "5px", flexWrap: "wrap" }}>
              <button onClick={() => findSimilarGenes(100, 101)}>100% 相似</button>
              <button onClick={() => findSimilarGenes(90, 100)}>90%~99%</button>
              <button onClick={() => findSimilarGenes(80, 90)}>80%~89%</button>
            </div>
          </div>
  
          {similarGenes.length > 0 && (
          <div style={{ marginTop: "10px", borderTop: "1px solid #ccc", paddingTop: "10px" }}>
            <strong>比對結果：</strong>
            <ul style={{ maxHeight: "200px", overflowY: "auto", paddingLeft: "20px" }}>
              {similarGenes.map(({ name, similarity }) => (
                <li key={name}>
                  <span style={{ color: geneColors[name] || "#000" }}>
                    {name}
                  </span>{" "}
                   — {similarity.toFixed(1)}%
                </li>
              ))}
            </ul>
          </div>
          )}
        </div>
      )}
    </div>
  );
  
};

export default GeneSelector;
