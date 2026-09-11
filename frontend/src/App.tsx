import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from "./context/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppShell } from './components/layout/AppShell';

// Screen Imports
import DashboardScreen from './screens/DashboardScreen';
import LiveMonitoringScreen from './screens/LiveMonitoringScreen';
import SpillIncidentsScreen from './screens/SpillIncidentsScreen';
import VesselTrackingScreen from './screens/VesselTrackingScreen';
import SatelliteDataScreen from './screens/SatelliteDataScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';

export default function App() {
  return (
    <ErrorBoundary><AppProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/monitoring" element={<LiveMonitoringScreen />} />
            <Route path="/incidents" element={<SpillIncidentsScreen />} />
            <Route path="/vessels" element={<VesselTrackingScreen />} />
            <Route path="/satellite" element={<SatelliteDataScreen />} />
            <Route path="/analytics" element={<AnalyticsScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </AppProvider></ErrorBoundary>
  );
}
