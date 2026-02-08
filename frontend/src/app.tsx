import { useState } from "react";
import "./app.css";
import GraphPage from "./pages/GraphPage";

type Page = "home" | "graph";

const App = () => {
  const [page, setPage] = useState<Page>("home");

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-title">MediScan</span>
          <span className="brand-subtitle">
            Interactive medication explorer
          </span>
        </div>
        <nav className="nav">
          <button
            className={page === "home" ? "nav-button active" : "nav-button"}
            onClick={() => setPage("home")}
            type="button"
          >
            Overview
          </button>
          <button
            className={page === "graph" ? "nav-button active" : "nav-button"}
            onClick={() => setPage("graph")}
            type="button"
          >
            Graph Lab
          </button>
        </nav>
      </header>
      <main className="app-main">
        {page === "home" ? (
          <section className="home">
            <h1>Map relationships between meds, ingredients, and effects.</h1>
            <p>
              Use the graph lab to add nodes, drag them around, and explore how
              medications relate to side effects and symptoms.
            </p>
            <div className="home-card">
              <div>
                <h2>Quick start</h2>
                <ul>
                  <li>Open Graph Lab to spawn new nodes.</li>
                  <li>Drag nodes to pin them in place.</li>
                  <li>Zoom to inspect dense clusters.</li>
                </ul>
              </div>
              <div className="home-note">
                <span>Tip</span>
                The layout keeps animating while you explore, so the network
                stays readable.
              </div>
            </div>
          </section>
        ) : (
          <GraphPage />
        )}
      </main>
    </div>
  );
};

export default App;
