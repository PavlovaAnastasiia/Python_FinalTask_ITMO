import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import MarketDetails from './components/MarketDetails';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/Register" element={<Register />} />
        {/* Protected routes */}
        <Route path="/markets" element={<Dashboard />} />
        <Route path="/markets/:id" element={<MarketDetails />} />

      </Routes>
    </Router>
  );
};

export default App;
