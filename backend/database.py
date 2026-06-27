import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY and SUPABASE_URL != "your_supabase_url_here":
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Failed to initialize Supabase: {e}")

def save_prediction(ticker: str, predicted_price: float, actual_price: float, mae: float, rmse: float, trend: str):
    if not supabase:
        print("Supabase not configured, skipping save.")
        return None
    try:
        data = {
            "ticker": ticker.upper(),
            "predicted_price": predicted_price,
            "actual_price": actual_price,
            "mae": mae,
            "rmse": rmse,
            "trend": trend,
            "predicted_on": datetime.utcnow().isoformat()
        }
        result = supabase.table("predictions").insert(data).execute()
        return result
    except Exception as e:
        print(f"Error saving to Supabase: {e}")
        return None

def get_history(ticker: str):
    if not supabase:
        return []
    try:
        result = supabase.table("predictions").select("*").eq("ticker", ticker.upper()).order("predicted_on", desc=True).execute()
        return result.data
    except Exception as e:
        print(f"Error fetching history for {ticker}: {e}")
        return []

def get_all_history():
    if not supabase:
        return []
    try:
        result = supabase.table("predictions").select("*").order("predicted_on", desc=True).execute()
        return result.data
    except Exception as e:
        print(f"Error fetching all history: {e}")
        return []
