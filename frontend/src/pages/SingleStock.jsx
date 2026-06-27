import React, { useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function SingleStock() {
  const [ticker, setTicker] = useState('AAPL');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const popularStocks = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'GOOGL', 'AMZN'];

  const handleQuickPick = (symbol) => {
    setTicker(symbol);
  };

  const fetchPrediction = async (e) => {
    e?.preventDefault();
    if (!ticker) return;
    
    setLoading(true);
    setError(null);
    setData(null);
    
    try {
      setLoadingStep("Fetching data & Training LSTM (This takes ~15-30s)...");
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const response = await axios.post(`${API_URL}/api/predict`, {
        ticker: ticker,
        days: parseInt(days)
      });
      
      setLoadingStep("Generating predictions...");
      
      // Merge historical and future for chart
      const chartData = [
        ...response.data.historical.map(d => ({ ...d, type: 'actual' })),
        ...response.data.future.map(d => ({ date: d.date, predicted_price: d.predicted_price, type: 'predicted' }))
      ];
      
      // Find the dividing date
      const splitDate = response.data.historical[response.data.historical.length - 1].date;

      setData({
        ...response.data,
        chartData,
        splitDate
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch prediction data. Please check if backend is running.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'rgba(20, 26, 43, 0.95)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '10px', borderRadius: '8px' }}>
          <p style={{ color: '#94a3b8', marginBottom: '5px' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color, fontWeight: 'bold' }}>
              {entry.name}: ${entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="panel">
      <h2 className="page-title">LSTM Stock Prediction</h2>
      
      <form onSubmit={fetchPrediction} className="flex-row" style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Ticker Symbol"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          required
        />
        <select value={days} onChange={(e) => setDays(e.target.value)}>
          <option value={7}>7 Days</option>
          <option value={14}>14 Days</option>
          <option value={30}>30 Days</option>
          <option value={60}>60 Days</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Predict'}
        </button>
      </form>

      <div className="quick-picks">
        {popularStocks.map(s => (
          <button key={s} type="button" className="quick-pick-btn" onClick={() => handleQuickPick(s)}>
            {s}
          </button>
        ))}
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <span style={{ color: 'var(--accent-color)' }}>{loadingStep}</span>
        </div>
      )}

      {error && <div style={{ color: 'var(--danger-color)', marginTop: '1rem' }}>{error}</div>}

      {data && !loading && (
        <div style={{ marginTop: '2rem' }}>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Current Price</div>
              <div className="metric-value">${data.metrics.last_price}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Predicted Price ({data.days}d)</div>
              <div className="metric-value">${data.metrics.predicted_price}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Trend</div>
              <div className={`metric-value ${data.metrics.trend === 'up' ? 'up' : 'down'}`}>
                {data.metrics.trend.toUpperCase()} {data.metrics.trend === 'up' ? '↑' : '↓'}
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-label">MAE</div>
              <div className="metric-value">{data.metrics.mae}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">RMSE</div>
              <div className="metric-value">{data.metrics.rmse}</div>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.5)" 
                  minTickGap={30}
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  stroke="rgba(255,255,255,0.5)"
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                
                <ReferenceLine x={data.splitDate} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
                
                <Line type="monotone" dataKey="price" stroke="#38bdf8" strokeWidth={2} dot={false} name="Actual Price" />
                <Line type="monotone" dataKey="predicted_price" stroke="#a855f7" strokeWidth={2} dot={false} name="Predicted Price" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export default SingleStock;
