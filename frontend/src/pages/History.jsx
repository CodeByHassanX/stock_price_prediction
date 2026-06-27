import React, { useState, useEffect } from 'react';
import axios from 'axios';

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
        const response = await axios.get(`${API_URL}/api/history`);
        setHistory(response.data);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => 
    item.ticker.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="panel">
      <h2 className="page-title">Prediction History</h2>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          placeholder="Filter by Ticker..." 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div> Loading history...
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Predicted On</th>
                <th>Actual Price</th>
                <th>Predicted Price</th>
                <th>Trend</th>
                <th>MAE</th>
                <th>RMSE</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((row) => (
                  <tr key={row.id || Math.random()}>
                    <td style={{ fontWeight: 'bold' }}>{row.ticker}</td>
                    <td>{new Date(row.predicted_on).toLocaleString()}</td>
                    <td>${row.actual_price}</td>
                    <td>${row.predicted_price}</td>
                    <td className={row.trend === 'up' ? 'up' : 'down'}>
                      {row.trend.toUpperCase()}
                    </td>
                    <td>{row.mae}</td>
                    <td>{row.rmse}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No predictions found. Make sure Supabase is configured in backend/.env.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default History;
