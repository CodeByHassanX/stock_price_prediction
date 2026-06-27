import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import SingleStock from './pages/SingleStock';
import CompareStocks from './pages/CompareStocks';
import History from './pages/History';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav>
          <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}>Single Stock</NavLink>
          <NavLink to="/compare" className={({ isActive }) => isActive ? "active" : ""}>Compare Stocks</NavLink>
          <NavLink to="/history" className={({ isActive }) => isActive ? "active" : ""}>History</NavLink>
        </nav>
        
        <Routes>
          <Route path="/" element={<SingleStock />} />
          <Route path="/compare" element={<CompareStocks />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
