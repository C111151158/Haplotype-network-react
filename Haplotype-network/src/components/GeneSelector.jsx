// GeneSelector.jsx - Optimized for 100,000+ genes
import React, { useState, useRef, useEffect } from "react";
import { FixedSizeList as List } from "react-window";

const GeneSelector = ({
  genes,
  selectedGene,
  setSelectedGene,
  showAllGenes,
  showSpecificGene,
  geneColors,
  geneSequences,
  setActiveSimilarityGroup,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [customMin, setCustomMin] = useState(95);
  const [customMax, setCustomMax] = useState(100);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState([]);

  const workerRef = useRef(null);
  const chunkedResults = useRef([]);

  const pageSize = 15;
  const totalPages = Math.ceil(genes.length / pageSize);
  const currentGenes = genes.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const handleSelect = (geneName) => {
    const isDeselecting = selectedGene === geneName;
    setSelectedGene(isDeselecting ? null : geneName);
    setResults([]);
    chunkedResults.current = [];
    setActiveSimilarityGroup([]);
  };

  const handlePageChange = (dir) => {
    setCurrentPage((prev) => (dir === "prev" ? Math.max(prev - 1, 0) : Math.min(prev + 1, totalPages - 1)));
  };

  const filterBySimilarity = (min, max) => {
    if (!selectedGene || !geneSequences[selectedGene]) return;

    setProgress({ completed: 0, total: 0 });
    setResults([]);
    chunkedResults.current = [];

    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker(new URL("../workers/compareWorker.js", import.meta.url), { type: "module" });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, data, completed, total } = e.data;
    
      if (type === "progress") {
        setProgress({ completed, total });
      } else if (type === "batch") {
        // 每批處理後，將結果添加到現有的結果中
        const filtered = data.filter(({ similarity }) => similarity >= min && similarity <= max);
        chunkedResults.current = [...chunkedResults.current, ...filtered];
    
        // 在這裡延遲更新狀態（例如在處理完成所有批次後再一次性更新）
        if (completed === total) {
          setResults([...chunkedResults.current].sort((a, b) => b.similarity - a.similarity));
        }
      } else if (type === "done") {
        // 完成後
        setProgress(null);
        setActiveSimilarityGroup(chunkedResults.current.map((g) => g.name));
        worker.terminate();
      }
    };
    

    worker.onerror = (err) => {
      console.error("Worker error:", err);
      setProgress(null);
      worker.terminate();
    };

    worker.postMessage({ targetGene: selectedGene, geneSequences });
  };

  return (
    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "5px", minWidth: "220px" }}>
        <button
          onClick={() => {
            setSelectedGene(null);
            chunkedResults.current = [];
            setResults([]);
            setActiveSimilarityGroup([]);
            showAllGenes();
          }}
        >
          顯示所有基因
        </button>

        {currentGenes.map((gene) => (
          <button
            key={gene.name}
            onClick={() => {
              handleSelect(gene.name);
              showSpecificGene();
            }}
            style={{
              backgroundColor: selectedGene === gene.name ? "#cde" : geneColors[gene.name] || "#fff",
              color: "#000",
              border: "1px solid #aaa",
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            {gene.name}
          </button>
        ))}

        <div style={{ marginTop: "10px", display: "flex", justifyContent: "center", gap: "10px" }}>
          <button onClick={() => handlePageChange("prev")} disabled={currentPage === 0}>
            上一頁
          </button>
          <span>第 {currentPage + 1} 頁 / 共 {totalPages} 頁</span>
          <button onClick={() => handlePageChange("next")} disabled={currentPage === totalPages - 1}>
            下一頁
          </button>
        </div>
      </div>

      {selectedGene && (
        <div style={{ flex: 1 }}>
          <strong>比對相似基因：</strong>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "5px" }}>
            <button onClick={() => filterBySimilarity(100, 100)}>100% 相似</button>
            <button onClick={() => filterBySimilarity(90, 99.99)}>90%~99%</button>
            <button onClick={() => filterBySimilarity(80, 89.99)}>80%~89%</button>
          </div>

          <div style={{ display: "flex", gap: "8px", marginTop: "10px", alignItems: "center" }}>
            <span>自訂相似度範圍：</span>
            <input
              type="number"
              min={0}
              max={100}
              value={customMin}
              onChange={(e) => setCustomMin(Number(e.target.value))}
              style={{ width: "60px" }}
            />
            <span>~</span>
            <input
              type="number"
              min={0}
              max={100}
              value={customMax}
              onChange={(e) => setCustomMax(Number(e.target.value))}
              style={{ width: "60px" }}
            />
            <button
              onClick={() => {
                if (customMin <= customMax) {
                  filterBySimilarity(customMin, customMax);
                } else {
                  alert("請確認相似度範圍有效（最小 <= 最大）");
                }
              }}
            >
              查詢
            </button>
          </div>

          {progress && (
            <p style={{ marginTop: "10px", color: "blue" }}>
              正在比對中... ({progress.completed} / {progress.total})
            </p>
          )}

          {results.length > 0 && (
            <div style={{ marginTop: "10px", borderTop: "1px solid #ccc", paddingTop: "10px" }}>
              <strong>比對結果：</strong>
              <List
                height={600}
                width={400}
                itemCount={results.length}
                itemSize={35}
              >
                {({ index, style }) => {
                  const { name, similarity } = results[index];
                  return (
                    <div key={name} style={style}>
                      <span style={{ color: geneColors[name] || "#000" }}>{name}</span> — {similarity.toFixed(1)}%
                    </div>
                  );
                }}
              </List>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GeneSelector;
