import React, { useState, useEffect } from "react";
import TaiwanMapComponent from "./components/TaiwanMapComponent";
import FilteredTaiwanMapComponent from "./components/FilteredTaiwanMapComponent";
import HaplotypeList from "./components/HaplotypeList";
import GeneTable from "./components/GeneTable";
import GeneSelector from "./components/GeneSelector";

const generateColors = (num) => {
  return Array.from({ length: num }, (_, i) => `hsl(${(i * 137) % 360}, 70%, 50%)`);
};

const App = () => {
  const [genes, setGenes] = useState([]);
  const [geneColors, setGeneColors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGene, setSelectedGene] = useState(null);
  const [activeGene, setActiveGene] = useState(null);
  const [activeSimilarityGroup, setActiveSimilarityGroup] = useState([]);
  const [geneSequences, setGeneSequences] = useState({});
  const [cityUpdateFlags, setCityUpdateFlags] = useState({});
  const [cityGeneData, setCityGeneData] = useState({});

  const genesPerPage = 500;
  const totalPages = Math.ceil(genes.length / genesPerPage);
  const paginatedGenes = genes.slice((currentPage - 1) * genesPerPage, currentPage * genesPerPage);

  const updateMapData = (updatedCities) => {
    setCityUpdateFlags((prev) => {
      const next = { ...prev };
      for (const city of updatedCities) {
        next[city] = (next[city] || 0) + 1;
      }
      return next;
    });
  };

  const showAllGenes = () => setActiveGene(null);
  const showSpecificGene = () => selectedGene && setActiveGene(selectedGene);

  useEffect(() => {
    if (window.Worker) {
      const worker = new Worker(new URL("./workers/fileWorker.js", import.meta.url), {
        type: "module",
      });

      worker.onmessage = async (event) => {
        const {sequences } = event.data;
      
        try {
          await fetch("http://localhost:3000/uploadSequences", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sequences }),
          });
      
          console.log("基因序列成功上傳到後端");
      
          // 💡 從後端取回 geneNames 做顯示（但不保留 sequences）
          const res = await fetch("http://localhost:3000/sequences");
          const data = await res.json();
      
          const colors = {};
          const generatedColors = generateColors(data.geneNames.length);
          data.geneNames.forEach((name, index) => {
            colors[name] = generatedColors[index % generatedColors.length];
          });
      
          setGeneColors(colors);
          setGenes(data.geneNames.map((name) => ({ name, counts: {} })));
          setGeneSequences({}); // 空的
        } catch (error) {
          console.error("上傳或讀取基因資料失敗:", error);
        }
      };
      

      window.handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => worker.postMessage(e.target.result);
        reader.readAsText(file);
      };
    }
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
      <input type="file" accept=".fa,.fasta,.txt" onChange={(e) => window.handleFileChange(e)} />

      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        <TaiwanMapComponent
          genes={genes}
          cityGeneData={cityGeneData}
          geneColors={geneColors}
          cityUpdateFlags={cityUpdateFlags}
        />
        <GeneSelector
          genes={genes}
          selectedGene={selectedGene}
          setSelectedGene={setSelectedGene}
          showAllGenes={showAllGenes}
          showSpecificGene={showSpecificGene}
          geneColors={geneColors}
          geneSequences={geneSequences}
          setActiveSimilarityGroup={setActiveSimilarityGroup}
        />
        <FilteredTaiwanMapComponent
          genes={genes}
          geneColors={geneColors}
          activeGene={selectedGene}
          activeSimilarityGroup={activeSimilarityGroup}
        />
      </div>

      <div style={{ marginTop: "10px" }}>
        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
          上一頁
        </button>
        <span> 第 {currentPage} 頁 / 共 {totalPages} 頁 </span>
        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
          下一頁
        </button>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <HaplotypeList paginatedGenes={paginatedGenes} geneColors={geneColors} />
        <GeneTable
          genes={genes}
          setGenes={setGenes}
          paginatedGenes={paginatedGenes}
          currentPage={currentPage}
          itemsPerPage={genesPerPage}
          updateMapData={updateMapData}
          geneColors={geneColors}
          setCityGeneData={setCityGeneData} // 👈 傳給 GeneTable
        />
      </div>
    </div>
  );
};

export default App;
