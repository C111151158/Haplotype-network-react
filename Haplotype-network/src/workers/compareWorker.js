// 計算字串相似度，這裡使用的是基於字符比較的快速相似度方法
function fastSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let match = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) match++;
  }
  return (match / a.length) * 100;
}

// 設定每批處理的基因數量
const CHUNK_SIZE = 100; // 調整每批大小

// 處理比對
onmessage = async (e) => {
  const { targetGene, geneSequences } = e.data;

  // 記錄當前處理的基因名稱和其對應的序列
  const targetSequence = geneSequences[targetGene];
  
  // 所有基因名稱（假設是基因ID陣列）
  const allGenes = Object.keys(geneSequences);
  const totalGenes = allGenes.length;

  let completed = 0;
  let results = [];

  // 從 0 開始，每次處理 CHUNK_SIZE 筆基因
  for (let i = 0; i < totalGenes; i += CHUNK_SIZE) {
    const chunk = allGenes.slice(i, i + CHUNK_SIZE);
    const chunkResults = chunk.map((gene) => {
      const similarity = fastSimilarity(targetSequence, geneSequences[gene]);
      return { name: gene, similarity };
    });

    // 將這批結果發送回主線程
    postMessage({
      type: 'batch',
      data: chunkResults,
      completed: Math.min(i + CHUNK_SIZE, totalGenes),
      total: totalGenes,
    });

    completed = Math.min(i + CHUNK_SIZE, totalGenes);

    // 插入小延遲，防止阻塞 UI
    await new Promise((resolve) => setTimeout(resolve, 100)); // 稍微增加延遲

  }

  // 完成所有批次處理
  postMessage({ type: 'done', results });
};


