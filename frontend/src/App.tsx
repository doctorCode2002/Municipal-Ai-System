import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import CitizenDashboard from './pages/CitizenDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/citizen" element={<CitizenDashboard />} />
      </Routes>
    </Router>
  );
}
