// geneNameWorker.js

// 接收來自主線程的消息
self.onmessage = function (e) {
    const { type, similarityResults, colorGenerationData } = e.data;
  
    if (type === "processSimilarityResults") {
      // 處理 similarityResults，從中提取基因名稱
      const geneNames = extractGeneNames(similarityResults);
      
      // 使用顏色生成邏輯為基因名稱生成顏色
      const processedResults = processGeneNames(geneNames, colorGenerationData);
      
      // 返回處理結果
      self.postMessage({ type: "processedGeneNames", results: processedResults });
    }
  };
  
  // 從 similarityResults 中提取基因名稱
  function extractGeneNames(similarityResults) {
    return similarityResults.map(result => result.geneName);
  }
  
  // 處理基因名稱，生成顏色等相關資料
  function processGeneNames(geneNames, colorGenerationData) {
    return geneNames.map((geneName, index) => {
      const color = generateColor(index, colorGenerationData.numColors);
      return {
        geneName,
        color,
      };
    });
  }
  
  // 顏色生成邏輯
  function generateColor(index, numColors) {
    return `hsl(${(index * 137) % 360}, 70%, 50%)`;  // 顏色邏輯
  }
  