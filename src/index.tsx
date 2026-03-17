import React from "react";
import ReactDOM from "react-dom/client";
import { Buffer } from "buffer";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

if (!(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}

console.log("[Pulse] index.tsx loaded");

const rootEl = document.getElementById("root");
console.log("[Pulse] root element:", rootEl);

if (!rootEl) {
  console.error("[Pulse] FATAL: #root element not found in DOM");
} else {
  const root = ReactDOM.createRoot(rootEl);
  console.log("[Pulse] ReactDOM root created, rendering App...");
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
  console.log("[Pulse] root.render() called");
}
