import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import TaiwanMapImage from "../assets/TW.png";
import { cityCoordinates } from "../data/cityCoordinates";

const genesPerPage = 100;
const mapWidth = 400;
const mapHeight = 600;

const areEqual = (prevProps, nextProps) => {
  if (prevProps.city !== nextProps.city) return false;
  if (prevProps.chartData.totalCount !== nextProps.chartData.totalCount) return false;

  const prevData = prevProps.chartData.data;
  const nextData = nextProps.chartData.data;

  if (prevData.length !== nextData.length) return false;

  for (let i = 0; i < prevData.length; i++) {
    if (
      prevData[i].name !== nextData[i].name ||
      prevData[i].value !== nextData[i].value
    ) {
      return false;
    }
  }

  return true;
};

const CityPieChart = React.memo(({ city, chartData, geneColors, position }) => {
  const { data, totalCount } = chartData;
  const outerRadius = Math.min(10 + Math.floor(totalCount / 10) * 10, 50);

  return (
    <div
      style={{
        position: "absolute",
        left: `${position.cx}px`,
        top: `${position.cy}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <PieChart width={outerRadius * 2} height={outerRadius * 2}>
        <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={outerRadius}>
          {data.map((entry, index) => (
            <Cell key={`cell-${city}-${index}`} fill={geneColors[entry.name] || "#ccc"} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </div>
  );
}, areEqual);

const FilteredTaiwanMapComponent = ({ selectedGene, activeSimilarityGroup, geneColors }) => {
  const [genes, setGenes] = useState([]);
  const [latLon, setLatLon] = useState({ lat: 0, lon: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");  // 搜尋框的文字
  const [selectedGenes, setSelectedGenes] = useState([]);  // 追蹤選擇的基因

  useEffect(() => {
    const fetchGeneCounts = async () => {
      try {
        const response = await fetch("http://localhost:3000/getGeneCounts");
        const data = await response.json();
        setGenes(data.genes);
      } catch (error) {
        console.error("無法獲取基因數據", error);
      }
    };

    fetchGeneCounts();
  }, []);

  const targetGeneNames = useMemo(() => {
    return [
      ...(selectedGene ? [selectedGene] : []),
      ...(activeSimilarityGroup || []),
    ];
  }, [selectedGene, activeSimilarityGroup]);

  // 計算基因名稱分頁
  const totalPages = Math.ceil(targetGeneNames.length / genesPerPage);

  const paginatedGeneNames = useMemo(() => {
    const start = (currentPage - 1) * genesPerPage;
    const end = start + genesPerPage;
    return targetGeneNames.slice(start, end);
  }, [targetGeneNames, currentPage]);

  // 根據搜尋框過濾基因名稱
  const filteredGeneNames = useMemo(() => {
    return paginatedGeneNames.filter((name) =>
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [paginatedGeneNames, searchTerm]);

  // 計算每個城市的 pie chart 資料
  const memoizedChartData = useMemo(() => {
    const result = {};

    for (const city of Object.keys(cityCoordinates)) {
      const data = [];
      let totalCount = 0;

      for (const geneName of targetGeneNames) {  // 這裡顯示全部基因，不分頁
        const gene = genes.find((g) => g.name === geneName);
        if (!gene) continue;

        const value = gene.counts?.[city] || 0;
        if (value > 0) {
          data.push({ name: geneName, value });
          totalCount += value;
        }
      }

      if (data.length > 0) {
        result[city] = { data, totalCount };
      }
    }

    return result;
  }, [genes, targetGeneNames]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lon = 120.0 + (x / mapWidth) * (122.0 - 120.0);
    const lat = 25.0 - (y / mapHeight) * (25.0 - 22.0);

    setLatLon({
      lat: lat.toFixed(4),
      lon: lon.toFixed(4),
    });
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleSelectAll = () => {
    setSelectedGenes(filteredGeneNames);
  };

  const handleClearAll = () => {
    setSelectedGenes([]);
  };

  const toggleGene = (geneName) => {
    setSelectedGenes((prevSelected) =>
      prevSelected.includes(geneName)
        ? prevSelected.filter((name) => name !== geneName)
        : [...prevSelected, geneName]
    );
  };

  return (
    <div style={{ display: "flex" }}>
      {/* 地圖區塊 */}
      <div
        style={{ position: "relative", width: `${mapWidth}px`, height: `${mapHeight}px` }}
        onMouseMove={handleMouseMove}
      >
        <img src={TaiwanMapImage} alt="Taiwan Map" width={mapWidth} height={mapHeight} />

        {Object.entries(memoizedChartData).map(([city, chartData]) => (
          <CityPieChart
            key={city}
            city={city}
            chartData={chartData}
            geneColors={geneColors}
            position={cityCoordinates[city]}
          />
        ))}

        <div
          style={{
            position: "absolute",
            bottom: "5px",
            left: "5px",
            backgroundColor: "rgb(4, 248, 24)",
            padding: "4px 8px",
            borderRadius: "5px",
            fontSize: "12px",
            fontFamily: "monospace",
          }}
        >
          經度: {latLon.lon}°E<br />
          緯度: {latLon.lat}°N
        </div>
      </div>

      {/* 基因選單區域 */}
      <div style={{ display: "flex", flexDirection: "column", width: "260px" }}>
        <div style={{ flex: "1", overflowY: "auto", maxHeight: "560px" }}>
          <h4>選擇顯示基因：</h4>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋基因名稱"
            style={{ width: "100%", marginBottom: "8px" }}
          />
          <div style={{ display: "flex", gap: "5px", marginBottom: "8px" }}>
            <button onClick={handleSelectAll}>全選</button>
            <button onClick={handleClearAll}>清除選擇</button>
          </div>
          {filteredGeneNames.map((name) => (
            <label key={name} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <input
                type="checkbox"
                checked={selectedGenes.includes(name)}
                onChange={() => toggleGene(name)}
              />
              <span style={{ color: geneColors[name] || "black" }}>{name}</span>
            </label>
          ))}
        </div>

        {/* 分頁控制 */}
        <div style={{ marginTop: "10px", display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={handlePrevPage} disabled={currentPage === 1}>
            上一頁
          </button>
          <span>第 {currentPage} 頁 / 共 {totalPages} 頁</span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            下一頁
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilteredTaiwanMapComponent;
