self.onmessage=r=>{const{type:i,fileContent:s}=r.data;if(i==="parseFile"){if(typeof s!="string"){console.error("❌ fileContent 不是字串，實際為:",typeof s);return}const o=[],t={};let e=null;s.split(`
`).forEach(n=>{n.startsWith(">")?(e=n.substring(1).trim(),o.push(e),t[e]=""):e&&(t[e]+=n.trim())}),self.postMessage({geneNames:o,sequences:t})}};
