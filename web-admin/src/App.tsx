import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import RoutesPage from './pages/Routes';
import Drivers from './pages/Drivers';
import Vehicles from './pages/Vehicles';
import Login from './pages/Login';
import './styles/global.css';

const AuthenticatedLayout: React.FC = () => {
  return (
    <div className="dashboard-layout" style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ 
        marginLeft: '260px', 
        width: 'calc(100% - 260px)', 
        minHeight: '100vh',
        backgroundColor: 'var(--background)' 
      }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/routes" element={<RoutesPage />} />
          
          {/* Admin Only Routes */}
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/vehicles" element={<Vehicles />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<AuthenticatedLayout />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
