function calculateSimilarity(seq1, seq2) {
    const minLen = Math.min(seq1.length, seq2.length);
    let matchCount = 0;
    for (let i = 0; i < minLen; i++) {
      if (seq1[i] === seq2[i]) matchCount++;
    }
    return (matchCount / minLen) * 100;
  }
  
  onmessage = function (e) {
    const { targetGene, geneSequences, min, max } = e.data;
    const targetSeq = geneSequences[targetGene];
    const allGenes = Object.entries(geneSequences)
      .filter(([name]) => name !== targetGene);
  
    const chunkSize = 200;
    let completed = 0;
    let total = allGenes.length;
  
    function processChunk(startIndex) {
      const chunk = allGenes.slice(startIndex, startIndex + chunkSize);
      const chunkMatches = [];
  
      for (const [name, seq] of chunk) {
        const similarity = calculateSimilarity(targetSeq, seq);
        if (similarity >= min && similarity <= max) {
          chunkMatches.push({ name, similarity });
        }
        completed++;
      }
  
      // 傳回這一批的結果
      postMessage({ type: "chunk", data: chunkMatches });
  
      // 傳回進度（可選）
      postMessage({ type: "progress", completed, total });
  
      if (startIndex + chunkSize < allGenes.length) {
        setTimeout(() => processChunk(startIndex + chunkSize), 10);
      } else {
        postMessage({ type: "done" }); // 不再傳 matches（已分批傳送）
      }
    }
  
    processChunk(0);
  };
  