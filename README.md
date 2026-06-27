# 📈 Deep Learning Stock Price Predictor

A full-stack, AI-powered web application that uses a Long Short-Term Memory (LSTM) Neural Network to predict future stock prices. Built with a modern React frontend, a FastAPI backend, and Supabase for persistent history tracking.

## 🚀 Features

- **Deep Learning Predictions:** Uses an advanced TensorFlow/Keras LSTM model trained on-the-fly for any stock ticker.
- **Dynamic Forecasting:** Predict 7, 14, 30, or 60 days into the future.
- **Multi-Stock Comparison:** Compare predictions and trends for up to 3 different stocks simultaneously.
- **Persistent History:** Every prediction is saved to a PostgreSQL database via Supabase.
- **Beautiful UI:** A dark-themed, highly responsive user interface with interactive Recharts graphs.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Recharts, React Router
- **Backend:** FastAPI, Python, Uvicorn
- **Machine Learning:** TensorFlow, Keras, Scikit-Learn (MinMaxScaler)
- **Data Source:** yfinance (Yahoo Finance)
- **Database:** Supabase (PostgreSQL)

## 💻 Running Locally

### 1. Backend Setup

Open a terminal and navigate to the `backend` folder:
```bash
cd backend
```

Install the required Python dependencies:
```bash
pip install -r requirements.txt
```

Set up your environment variables by copying the example file:
```bash
cp .env.example .env
```
*(Open the `.env` file and insert your Supabase URL and Anon Key).*

Start the FastAPI server:
```bash
python -m uvicorn main:app --port 8001
```

### 2. Frontend Setup

Open a new, separate terminal and navigate to the `frontend` folder:
```bash
cd frontend
```

Install the Node modules:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

### 3. View the App
Open your browser and navigate to `http://localhost:5173` (or the port Vite provides) to start predicting!
