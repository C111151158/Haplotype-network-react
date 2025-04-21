// cityGeneDataWorker.js
self.onmessage = (e) => {
    const { type, data, partialData, currentData } = e.data;
  
    if (type === "init") {
      self.postMessage(data);
    }
  
    if (type === "update") {
      const updated = { ...currentData };
      for (const city in partialData) {
        updated[city] = { ...(updated[city] || {}), ...partialData[city] };
      }
      self.postMessage(updated);
    }
  };
  
  