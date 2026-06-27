import React, { useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function CompareStocks() {
  const [tickers, setTickers] = useState(['AAPL', 'MSFT', '']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const handleTickerChange = (index, value) => {
    const newTickers = [...tickers];
    newTickers[index] = value.toUpperCase();
    setTickers(newTickers);
  };

  const fetchComparison = async (e) => {
    e.preventDefault();
    const validTickers = tickers.filter(t => t.trim() !== '');
    if (validTickers.length === 0) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const promises = validTickers.map(ticker => 
        axios.post(`http://localhost:8001/api/predict`, { ticker, days: 14 })
      );
      
      const responses = await Promise.allSettled(promises);
      const successful = responses.filter(r => r.status === 'fulfilled').map(r => r.value.data);
      
      if (successful.length === 0) {
        throw new Error("Failed to fetch any of the provided tickers.");
      }
      
      setResults(successful);
    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Merge future predictions for the chart
  const mergedChartData = () => {
    if (results.length === 0) return [];
    
    // Use the first result's dates as the baseline
    const baseDates = results[0].future.map(f => f.date);
    
    return baseDates.map((date, i) => {
      const point = { date };
      results.forEach(res => {
        point[res.ticker] = res.future[i]?.predicted_price || null;
      });
      return point;
    });
  };

  const colors = ['#38bdf8', '#a855f7', '#10b981'];

  return (
    <div className="panel">
      <h2 className="page-title">Compare Stocks (14-Day Forecast)</h2>
      
      <form onSubmit={fetchComparison} className="flex-row" style={{ marginBottom: '2rem' }}>
        {tickers.map((ticker, index) => (
          <input
            key={index}
            type="text"
            placeholder={`Stock ${index + 1}`}
            value={ticker}
            onChange={(e) => handleTickerChange(index, e.target.value)}
            style={{ width: '120px' }}
          />
        ))}
        <button type="submit" disabled={loading}>
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </form>

      {error && <div style={{ color: 'var(--danger-color)' }}>{error}</div>}

      {results.length > 0 && !loading && (
        <div>
          <div className="chart-container" style={{ marginBottom: '2rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.5)" tickFormatter={(val) => `$${val}`} />
                <Tooltip contentStyle={{ backgroundColor: '#141a2b', borderColor: '#38bdf8' }} />
                {results.map((res, idx) => (
                  <Line 
                    key={res.ticker}
                    type="monotone" 
                    dataKey={res.ticker} 
                    stroke={colors[idx % colors.length]} 
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Current Price</th>
                  <th>Predicted (14d)</th>
                  <th>Trend</th>
                  <th>Change %</th>
                  <th>MAE</th>
                </tr>
              </thead>
              <tbody>
                {results.map(res => {
                  const change = ((res.metrics.predicted_price - res.metrics.last_price) / res.metrics.last_price) * 100;
                  return (
                    <tr key={res.ticker}>
                      <td style={{ fontWeight: 'bold' }}>{res.ticker}</td>
                      <td>${res.metrics.last_price}</td>
                      <td>${res.metrics.predicted_price}</td>
                      <td className={res.metrics.trend === 'up' ? 'up' : 'down'}>
                        {res.metrics.trend.toUpperCase()}
                      </td>
                      <td className={change >= 0 ? 'up' : 'down'}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </td>
                      <td>{res.metrics.mae}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompareStocks;
