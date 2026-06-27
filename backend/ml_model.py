import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.metrics import mean_absolute_error, mean_squared_error
from datetime import datetime, timedelta

def get_stock_info(ticker):
    stock = yf.Ticker(ticker)
    info = stock.info
    current_price = info.get('currentPrice') or info.get('regularMarketPrice') or 0.0
    previous_close = info.get('previousClose') or current_price
    
    change_percent = 0.0
    if previous_close > 0:
        change_percent = ((current_price - previous_close) / previous_close) * 100
        
    return {
        "current_price": current_price,
        "company_name": info.get('longName', ticker),
        "change_percent": round(change_percent, 2),
        "sector": info.get('sector', 'Unknown')
    }

def download_data(ticker):
    stock = yf.Ticker(ticker)
    hist = stock.history(period="2y")
    if hist.empty:
        return None
    # Filter out empty or zero columns before returning
    hist = hist.dropna(subset=['Close'])
    hist = hist[hist['Close'] > 0]
    hist = hist.reset_index()
    return hist

def prepare_data(prices):
    # prices is a numpy array or list of closing prices
    data = np.array(prices).reshape(-1, 1)
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(data)
    
    X, y = [], []
    seq_length = 60
    for i in range(seq_length, len(scaled_data)):
        X.append(scaled_data[i-seq_length:i, 0])
        y.append(scaled_data[i, 0])
        
    X, y = np.array(X), np.array(y)
    if len(X) > 0:
        X = np.reshape(X, (X.shape[0], X.shape[1], 1))
    
    return X, y, scaler, scaled_data

def predict(ticker, days):
    hist = download_data(ticker)
    if hist is None or len(hist) < 65:
        raise ValueError(f"Not enough historical data for {ticker}. Needs at least 65 days.")
        
    prices = hist['Close'].values
    dates = hist['Date'].dt.strftime('%Y-%m-%d').tolist()
    
    X, y, scaler, scaled_data = prepare_data(prices)
    if len(X) == 0:
        raise ValueError(f"Could not prepare sequences for {ticker}.")
        
    # Split train/test (last 60 days for testing)
    split_index = int(len(X) * 0.9)
    X_train, y_train = X[:split_index], y[:split_index]
    X_test, y_test = X[split_index:], y[split_index:]
    
    if len(X_train) == 0 or len(X_test) == 0:
        X_train, y_train = X, y
        X_test, y_test = X[-10:], y[-10:]
    
    # Build LSTM Model as requested
    model = Sequential()
    model.add(LSTM(64, return_sequences=True, input_shape=(X_train.shape[1], 1)))
    model.add(Dropout(0.2))
    model.add(LSTM(32))
    model.add(Dropout(0.2))
    model.add(Dense(1))
    
    model.compile(optimizer='adam', loss='mse')
    
    # Train
    model.fit(X_train, y_train, epochs=15, batch_size=32, verbose=0)
    
    # Calculate MAE & RMSE on test data
    test_predict = model.predict(X_test, verbose=0)
    test_predict_unscaled = scaler.inverse_transform(test_predict)
    y_test_unscaled = scaler.inverse_transform(y_test.reshape(-1, 1))
    
    mae = mean_absolute_error(y_test_unscaled, test_predict_unscaled)
    rmse = np.sqrt(mean_squared_error(y_test_unscaled, test_predict_unscaled))
    
    # Predict future N days
    future_predictions = []
    current_seq = scaled_data[-60:]
    
    last_date = hist['Date'].iloc[-1]
    future_dates = []
    
    for i in range(days):
        seq = current_seq.reshape((1, 60, 1))
        pred = model.predict(seq, verbose=0)[0][0]
        future_predictions.append(float(pred))
        
        # update seq
        current_seq = np.append(current_seq[1:], [[pred]], axis=0)
        
        # calculate next business day
        next_date = last_date + timedelta(days=1)
        while next_date.weekday() >= 5: # skip weekends
            next_date += timedelta(days=1)
        last_date = next_date
        future_dates.append(next_date.strftime('%Y-%m-%d'))
        
    future_predictions_unscaled = scaler.inverse_transform(np.array(future_predictions).reshape(-1, 1)).flatten()
    
    trend = "up" if future_predictions_unscaled[-1] > prices[-1] else "down"
    
    # Package historical prices for chart
    historical_prices = [{"date": d, "price": round(p, 2)} for d, p in zip(dates, prices)]
    
    # future prices array
    future_prices_list = [{"date": d, "predicted_price": round(float(p), 2)} for d, p in zip(future_dates, future_predictions_unscaled)]
    
    return {
        "historical": historical_prices,
        "future": future_prices_list,
        "metrics": {
            "mae": round(float(mae), 2),
            "rmse": round(float(rmse), 2),
            "trend": trend,
            "last_price": round(float(prices[-1]), 2),
            "predicted_price": round(float(future_predictions_unscaled[-1]), 2)
        }
    }
