import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Get the root element from the DOM
const rootElement = document.getElementById("root");

// Create a root and render the app
const root = createRoot(rootElement);
root.render(<App />);
