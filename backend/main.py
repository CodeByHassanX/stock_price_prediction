from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from ml_model import get_stock_info, predict
from database import save_prediction, get_history, get_all_history

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictRequest(BaseModel):
    ticker: str
    days: int = 7

@app.get("/api/info/{ticker}")
def info(ticker: str):
    try:
        return get_stock_info(ticker.upper())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict")
def do_predict(req: PredictRequest):
    try:
        result = predict(req.ticker.upper(), req.days)
        
        # Save to database
        save_prediction(
            ticker=req.ticker.upper(),
            predicted_price=result["metrics"]["predicted_price"],
            actual_price=result["metrics"]["last_price"],
            mae=result["metrics"]["mae"],
            rmse=result["metrics"]["rmse"],
            trend=result["metrics"]["trend"]
        )
        
        return {
            "ticker": req.ticker.upper(),
            "days": req.days,
            **result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history/{ticker}")
def history(ticker: str):
    return get_history(ticker.upper())

@app.get("/api/history")
def all_history():
    return get_all_history()
