import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from "./context/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppShell } from './components/layout/AppShell';

// Screen Imports
import DashboardScreen from './screens/DashboardScreen';
import LiveMonitoringScreen from './screens/LiveMonitoringScreen';
import SpillIncidentsScreen from './screens/SpillIncidentsScreen';
import EnnoreDemoScreen from './screens/EnnoreDemoScreen';
import VesselTrackingScreen from './screens/VesselTrackingScreen';
import SatelliteDataScreen from './screens/SatelliteDataScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import EnvironmentalImpactScreen from './screens/EnvironmentalImpactScreen';
import AlertsScreen from './screens/AlertsScreen';
import CaseHistoryScreen from './screens/CaseHistoryScreen';
import DataManagementScreen from './screens/DataManagementScreen';

export default function App() {
  return (
    <ErrorBoundary><AppProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardScreen />} />
            <Route path="/monitoring" element={<LiveMonitoringScreen />} />
            <Route path="/incidents" element={<SpillIncidentsScreen />} />
            <Route path="/demo/ennore" element={<EnnoreDemoScreen />} />
            <Route path="/vessels" element={<VesselTrackingScreen />} />
            <Route path="/satellite" element={<SatelliteDataScreen />} />
            <Route path="/analytics" element={<AnalyticsScreen />} />
            <Route path="/environment" element={<EnvironmentalImpactScreen />} />
            <Route path="/alerts" element={<AlertsScreen />} />
            <Route path="/cases" element={<CaseHistoryScreen />} />
            <Route path="/data-management" element={<DataManagementScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </AppProvider></ErrorBoundary>
  );
}
