import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { installApiAuthentication } from "./utils/apiAuth.ts";
import "./index.css";
import "./styles.css";

installApiAuthentication();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
