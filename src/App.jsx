import { useState } from "react";
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";

import HaplotypeNetworkApp from "./HaplotypeNetwork/HaplotypeNetworkApp";
import SequencealignmentAPP from "./Sequence alignment/SequencealignmentAPP";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function Navbar({ haplotypeFileName, onHaplotypeFileChange }) {
  return (
    <nav className="navbar">
      
      <div className="nav-links">
        <Link className="nav-link" to="/haplotype">Haplotype Network</Link>
        <Link className="nav-link" to="/sequence-alignment">Sequence Alignment</Link>
      </div>
      <div className="file-upload">
        <label className="custom-upload-label">
          {haplotypeFileName ? (
            <>
              Current Fasta: <span className="file-name">{haplotypeFileName}</span>
            </>
          ) : (
            "Upload Fasta"
          )}
          <input
            type="file"
            accept=".fa,.fasta,.txt"
            onChange={onHaplotypeFileChange}
            style={{ display: "none" }}
          />
        </label>
      </div>
    </nav>
  );
}

function App() {
  const [haplotypeContent, setHaplotypeContent] = useState("");
  const [haplotypeFileName, setHaplotypeFileName] = useState("");

  const handleHaplotypeFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setHaplotypeFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setHaplotypeContent(e.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <BrowserRouter>
      <div>
        <Navbar
          onHaplotypeFileChange={handleHaplotypeFileChange}
          haplotypeFileName={haplotypeFileName}
        />
        <div className="container-fluid" id="workspace-container">
          <Routes>
            <Route
              path="/haplotype"
              element={
                <HaplotypeNetworkApp initialFileContent={haplotypeContent} />
              }
            />
            <Route
              path="/sequence-alignment"
              element={
                <SequencealignmentAPP haplotypeContent={haplotypeContent} />
              }
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
