import React from "react";
import { createRoot } from "react-dom/client";
// Inter is bundled locally (no Google Fonts call), so the demo works offline.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import App from "./App";
import "./styles.css";
import "./plain.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);