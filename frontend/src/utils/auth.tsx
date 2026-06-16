import { Navigate } from "react-router-dom";
import type { ReactElement } from "react";

export function isAuthenticated() {
  return Boolean(localStorage.getItem("fleetiq_token"));
}

export function ProtectedRoute({ children }: { children: ReactElement }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
