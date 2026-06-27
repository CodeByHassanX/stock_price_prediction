import yfinance as yf
import pandas as pd

def fetch_stock_data(ticker_symbol, period="1y"):
    """
    Fetches historical stock data for a given ticker.
    
    Parameters:
    ticker_symbol (str): The stock ticker (e.g., 'AAPL', 'MSFT', 'TSLA')
    period (str): The time period to fetch (e.g., '1mo', '1y', '5y', 'max')
    """
    print(f"Fetching data for {ticker_symbol} over the last {period}...")
    ticker = yf.Ticker(ticker_symbol)
    
    # Fetch historical data
    hist = ticker.history(period=period)
    
    if hist.empty:
        print(f"No data found for {ticker_symbol}.")
        return None
        
    # Reset index to make 'Date' a standard column instead of an index
    hist = hist.reset_index()
    
    # Optional: We can drop dividends and stock splits if we only want price data
    if 'Dividends' in hist.columns and 'Stock Splits' in hist.columns:
        hist = hist.drop(columns=['Dividends', 'Stock Splits'])
        
    return hist

if __name__ == "__main__":
    # Example usage: Fetching Apple stock data for the last 2 years
    symbol = "AAPL"
    df = fetch_stock_data(symbol, period="2y")
    
    if df is not None:
        print("\nFirst 5 rows of the data:")
        print(df.head())
        
        print("\nData Summary:")
        print(df.info())
        
        # Save the fetched data to a CSV file for later use in our models
        filename = f"{symbol}_historical_data.csv"
        df.to_csv(filename, index=False)
        print(f"\n✅ Data successfully saved to {filename}")
