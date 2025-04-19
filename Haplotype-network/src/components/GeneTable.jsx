import React, { useEffect } from "react";

const GeneTable = ({
  genes,
  setGenes,
  paginatedGenes,
  currentPage,
  itemsPerPage,
  updateMapData,
  geneColors,
  setCityGeneData,
}) => {
  const locations = [
    "台北", "新北", "基隆", "桃園", "新竹", "苗栗", "台中",
    "彰化", "南投", "雲林", "嘉義", "台南", "高雄", "屏東",
    "花蓮", "台東", "宜蘭",
  ];

  // 每次基因資料變動，重建 cityGeneData
  useEffect(() => {
    const cityMap = {};
    for (const loc of locations) cityMap[loc] = [];

    genes.forEach((gene) => {
      locations.forEach((loc) => {
        const count = gene.counts?.[loc] || 0;
        if (count > 0) {
          cityMap[loc].push({
            name: gene.name,
            color: geneColors[gene.name] || "#000",
            value: count,
          });
        }
      });
    });

    setCityGeneData(cityMap);
  }, [genes, geneColors, setCityGeneData]);

  const handleEditGeneCount = (geneIndex, location, newValue) => {
    setGenes((prevGenes) => {
      const updatedGenes = [...prevGenes];
      const actualIndex = (currentPage - 1) * itemsPerPage + geneIndex;
      updatedGenes[actualIndex] = {
        ...updatedGenes[actualIndex],
        counts: {
          ...updatedGenes[actualIndex].counts,
          [location]: newValue ? parseInt(newValue, 10) : 0,
        },
      };
      return updatedGenes;
    });

    // 只告知被修改的城市名稱
    setTimeout(() => updateMapData([location]), 0);
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <h2>基因數據表</h2>
      <table border="1">
        <thead>
          <tr>
            <th>基因</th>
            {locations.map((loc) => (
              <th key={loc}>{loc}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedGenes.length > 0 ? (
            paginatedGenes.map((gene, index) => (
              <tr key={index}>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      width: "12px",
                      height: "12px",
                      backgroundColor: geneColors[gene.name] || "black",
                      marginRight: "5px",
                    }}
                  ></span>
                  {gene.name}
                </td>
                {locations.map((loc) => (
                  <td key={`${index}-${loc}`}>
                    <input
                      type="number"
                      min="0"
                      value={gene.counts?.[loc] || 0}
                      onChange={(e) => handleEditGeneCount(index, loc, e.target.value)}
                      style={{ width: "40px" }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={locations.length + 1}>無基因數據</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default GeneTable;


