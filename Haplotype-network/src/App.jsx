import React, { useState, useEffect, useRef } from "react";
import TaiwanMapComponent from "./components/TaiwanMapComponent";
import FilteredTaiwanMapComponent from "./components/FilteredTaiwanMapComponent";
import HaplotypeList from "./components/HaplotypeList";
import GeneTable from "./components/GeneTable";
import GeneSelector from "./components/GeneSelector";

const generateColors = (num) =>
  Array.from({ length: num }, (_, i) => `hsl(${(i * 137) % 360}, 70%, 50%)`);

const App = () => {
  const [genes, setGenes] = useState([]);
  const [geneColors, setGeneColors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGene, setSelectedGene] = useState(null);
  const [activeSimilarityGroup, setActiveSimilarityGroup] = useState([]);
  const [cityUpdateFlags, setCityUpdateFlags] = useState({});
  const [cityGeneData, setCityGeneData] = useState({});
  const cityGeneDataRef = useRef({});
  const workerRef = useRef(null);

  const genesPerPage = 100;
  const totalPages = Math.ceil(genes.length / genesPerPage);
  const paginatedGenes = genes.slice(
    (currentPage - 1) * genesPerPage,
    currentPage * genesPerPage
  );

  const updateMapData = (updatedCities) => {
    const partialData = {};

    updatedCities.forEach((city) => {
      const cityData = {};
      genes.forEach((gene) => {
        const count = gene.counts[city] || 0;
        if (count > 0) {
          cityData[gene.name] = count;
        }
      });
      partialData[city] = cityData;
    });

    setCityUpdateFlags((prev) => {
      const next = { ...prev };
      updatedCities.forEach((city) => {
        next[city] = (next[city] || 0) + 1;
      });
      return next;
    });

    // send to Web Worker
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "update",
        partialData,
        currentData: cityGeneDataRef.current,
      });
    }
  };

  const showAllGenes = () => setSelectedGene(null);
  const showSpecificGene = () => selectedGene && setSelectedGene(selectedGene);

  const loadGeneCountsFromBackend = async (geneNames) => {
    try {
      const res = await fetch("http://localhost:3000/getGeneCounts");
      const data = await res.json();
      const countMap = new Map(data.genes.map((g) => [g.name, g.counts]));

      const updatedGenes = geneNames.map((name) => ({
        name,
        counts: countMap.get(name) || {},
      }));

      setGenes(updatedGenes);

      // Build full cityGeneData
      const fullCityData = {};
      updatedGenes.forEach((gene) => {
        Object.entries(gene.counts).forEach(([city, count]) => {
          if (!fullCityData[city]) fullCityData[city] = {};
          fullCityData[city][gene.name] = count;
        });
      });

      if (workerRef.current) {
        workerRef.current.postMessage({ type: "init", data: fullCityData });
      }
    } catch (err) {
      console.error("❌ 無法從後端載入 gene counts:", err);
      setGenes(geneNames.map((name) => ({ name, counts: {} })));
    }
  };

  const saveGeneCountsToBackend = async (updatedGenes) => {
    try {
      const res = await fetch("http://localhost:3000/saveGeneCounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genes: updatedGenes }),
      });
      const data = await res.json();
      console.log("✔ Gene counts 儲存成功:", data.message);
    } catch (err) {
      console.error("❌ Gene counts 儲存失敗:", err);
    }
  };

  const handleEditGeneCount = (actualIndex, location, newValue) => {
    const updatedGenes = [...genes];
    updatedGenes[actualIndex] = {
      ...updatedGenes[actualIndex],
      counts: {
        ...updatedGenes[actualIndex].counts,
        [location]: newValue ? parseInt(newValue, 10) : 0,
      },
    };
    setGenes(updatedGenes);
    saveGeneCountsToBackend(updatedGenes);
  };

  useEffect(() => {
    if (window.Worker) {
      // Setup fileWorker
      const fileWorker = new Worker(new URL("./workers/fileWorker.js", import.meta.url), {
        type: "module",
      });

      fileWorker.onmessage = async (event) => {
        const { sequences } = event.data;

        try {
          await fetch("http://localhost:3000/uploadSequences", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sequences }),
          });

          const res = await fetch("http://localhost:3000/sequences");
          const data = await res.json();

          const generatedColors = generateColors(data.geneNames.length);
          const colors = {};
          data.geneNames.forEach((name, index) => {
            colors[name] = generatedColors[index % generatedColors.length];
          });
          setGeneColors(colors);

          await loadGeneCountsFromBackend(data.geneNames);
        } catch (error) {
          console.error("❌ 上傳或讀取基因資料失敗:", error);
        }
      };

      window.handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => fileWorker.postMessage(e.target.result);
        reader.readAsText(file);
      };

      // Setup cityGeneDataWorker
      const cityWorker = new Worker(new URL("./workers/cityGeneDataWorker.js", import.meta.url), {
        type: "module",
      });

      cityWorker.onmessage = (e) => {
        cityGeneDataRef.current = e.data;
        setCityGeneData(e.data);
      };

      workerRef.current = cityWorker;
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
          currentPage={currentPage}
          itemsPerPage={genesPerPage}
          updateMapData={updateMapData}
          geneColors={geneColors}
          setCityGeneData={setCityGeneData}
          onEditGeneCount={handleEditGeneCount}
        />
      </div>
    </div>
  );
};

export default App;
