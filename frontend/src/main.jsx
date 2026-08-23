import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { CarritoProvider } from "./context/CarritoContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FavoritosProvider } from "./context/FavoritosContext.jsx";
import "./styles/theme.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FavoritosProvider>
          <CarritoProvider>
            <App />
          </CarritoProvider>
        </FavoritosProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
