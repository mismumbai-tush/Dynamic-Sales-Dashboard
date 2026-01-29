import React, { useState, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import DashboardLayout from './components/DashboardLayout';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = useCallback(() => setIsAuthenticated(true), []);
  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const AppContent = () => {
    if (!isAuthenticated) {
      return <LoginPage onLogin={handleLogin} />;
    }
    return <DashboardLayout onLogout={handleLogout} />;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <AppContent />
    </div>
  );
};

export default App;