import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
{/* cd Haplotype-network  npm run dev  */}
{/* cd gene-compare-backend  node server.js  */}