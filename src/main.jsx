/**
 * Application Entry Point
 *
 * This file is the starting point of the React application:
 * - Renders the root App component into the HTML page
 * - Sets up React Router with HashRouter for client-side routing
 * - Enables React StrictMode for development warnings
 * - Connects React to the DOM element with id="root"
 *
 * Part of the app: Application initialization
 * Manages: React setup, routing configuration, DOM mounting
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
