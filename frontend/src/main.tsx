import React from "react";
import ReactDOM from "react-dom/client";
import { Navigate, Route, HashRouter as Router, Routes } from "react-router-dom";
import "mapbox-gl/dist/mapbox-gl.css";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import { AppLayout } from "./layouts/AppLayout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Tracking } from "./pages/Tracking";
import { Drivers } from "./pages/Drivers";
import { DriverProfile } from "./pages/DriverProfile";
import { RoutesPage } from "./pages/RoutesPage";
import { Assets } from "./pages/Assets";
import { Maintenance } from "./pages/Maintenance";
import { Alerts } from "./pages/Alerts";
import { Reports } from "./pages/Reports";
import { Assistant } from "./pages/Assistant";
import { MonitoringWorks } from "./pages/MonitoringWorks";
import { ProtectedRoute } from "./utils/auth";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="tracking" element={<Tracking />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="drivers/:id" element={<DriverProfile />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="assets" element={<Assets />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="reports" element={<Reports />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="monitoring" element={<MonitoringWorks />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
