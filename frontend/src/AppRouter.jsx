import { Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import AdminApp from "./AdminApp.jsx";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}