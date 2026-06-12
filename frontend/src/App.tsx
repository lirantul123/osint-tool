import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import InvestigatePage from "./pages/InvestigatePage";
import StatisticsPage from "./pages/StatisticsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="investigate" element={<InvestigatePage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="people" element={<Navigate to="/investigate?mode=person" replace />} />
          <Route path="ip" element={<Navigate to="/investigate" replace />} />
          <Route path="domain" element={<Navigate to="/investigate" replace />} />
          <Route path="dns" element={<Navigate to="/investigate" replace />} />
          <Route path="subdomain" element={<Navigate to="/investigate" replace />} />
          <Route path="email" element={<Navigate to="/investigate" replace />} />
          <Route path="username" element={<Navigate to="/investigate" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
