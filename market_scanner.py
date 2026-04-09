"""Market Scanner — Daily Radar using Fibo-Macro logic on top 50 US stocks."""

import pandas as pd
import yfinance as yf
from datetime import datetime

# ── Universe: Top 50 S&P 500 / Nasdaq components ─────────────────────────
UNIVERSE = [
    "AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "GOOG", "TSLA",
    "AVGO", "BRK-B", "JPM", "LLY", "V", "MA", "UNH", "COST", "NFLX",
    "HD", "JNJ", "ABBV", "WMT", "PG", "XOM", "CRM", "BAC",
    "ORCL", "MRK", "CVX", "KO", "PEP", "AMD", "ADBE", "TMO",
    "CSCO", "LIN", "ACN", "MCD", "ABT", "DHR", "TXN",
    "INTC", "NEE", "PM", "ISRG", "AMGN", "QCOM", "INTU", "AMAT", "CAT", "GS",
]

# ── Strategy Parameters (matching strategy_fibo_macro.py) ────────────────
LOOKBACK = 60       # swing high/low window
MACRO_PERIOD = 150  # SMA macro filter
FIB_50 = 0.50
FIB_618 = 0.618
ATR_PERIOD = 14
ATR_MULT = 2.5
FETCH_DAYS = "1y"   # fetch 1 year to guarantee 200+ trading days


def fetch_data(ticker: str) -> pd.DataFrame | None:
    """Download daily OHLCV, return cleaned DataFrame or None on failure."""
    try:
        df = yf.download(ticker, period=FETCH_DAYS, auto_adjust=True, progress=False)
        if df is None or len(df) < MACRO_PERIOD + 10:
            return None
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        df.columns = [c.lower() for c in df.columns]
        df.reset_index(inplace=True)
        df.columns = [c.lower() for c in df.columns]
        return df
    except Exception:
        return None


def scan_ticker(df: pd.DataFrame) -> dict | None:
    """Check if the latest bar meets both Macro + Golden Zone conditions.

    Returns a dict with setup details if actionable, else None.
    """
    # SMA 150
    df["sma_150"] = df["close"].rolling(MACRO_PERIOD).mean()

    # Fibonacci levels
    df["swing_high"] = df["high"].rolling(LOOKBACK).max()
    df["swing_low"] = df["low"].rolling(LOOKBACK).min()
    df["fib_50"] = df["swing_high"] - FIB_50 * (df["swing_high"] - df["swing_low"])
    df["fib_618"] = df["swing_high"] - FIB_618 * (df["swing_high"] - df["swing_low"])

    # ATR
    prev_close = df["close"].shift(1)
    tr = pd.concat([
        df["high"] - df["low"],
        (df["high"] - prev_close).abs(),
        (df["low"] - prev_close).abs(),
    ], axis=1).max(axis=1)
    df["atr"] = tr.rolling(ATR_PERIOD).mean()

    # Grab latest bar
    last = df.iloc[-1]
    close = last["close"]
    sma150 = last["sma_150"]
    fib_top = last["fib_50"]      # top of golden zone (50% retrace)
    fib_bot = last["fib_618"]     # bottom of golden zone (61.8% retrace)
    swing_high = last["swing_high"]
    atr = last["atr"]

    # Skip if any indicator is NaN
    if any(pd.isna(v) for v in [close, sma150, fib_top, fib_bot, swing_high, atr]):
        return None

    # ── Condition A: Macro Filter ─────────────────────────────────────
    if close <= sma150:
        return None

    # ── Condition B: Price inside Golden Zone ─────────────────────────
    if not (fib_bot < close < fib_top):
        return None

    # ── Both conditions met => actionable setup ───────────────────────
    atr_stop = close - (ATR_MULT * atr)
    risk_pct = (close - atr_stop) / close * 100
    reward_pct = (swing_high - close) / close * 100
    rr_ratio = reward_pct / risk_pct if risk_pct > 0 else 0.0

    return {
        "Ticker": last.get("ticker", ""),
        "Price": round(float(close), 2),
        "Fib 50% (Top)": round(float(fib_top), 2),
        "Fib 61.8% (Bot)": round(float(fib_bot), 2),
        "Take Profit": round(float(swing_high), 2),
        "ATR Stop": round(float(atr_stop), 2),
        "Risk %": round(risk_pct, 2),
        "Reward %": round(reward_pct, 2),
        "R:R": round(rr_ratio, 2),
    }


def main() -> None:
    width = 78
    print(f"\n{'=' * width}")
    print(f"  FIBO-MACRO DAILY RADAR  |  {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"  Scanning {len(UNIVERSE)} stocks for Golden Zone setups")
    print(f"{'=' * width}")

    setups: list[dict] = []

    for i, ticker in enumerate(UNIVERSE, 1):
        status = f"  [{i:>2}/{len(UNIVERSE)}] {ticker:<6}"
        print(f"{status} scanning...", end="\r", flush=True)

        df = fetch_data(ticker)
        if df is None:
            continue

        result = scan_ticker(df)
        if result is not None:
            result["Ticker"] = ticker
            setups.append(result)
            print(f"{status} ** SETUP FOUND **")
        else:
            print(f"{status} --             ")

    print(f"\n{'=' * width}")

    if setups:
        print(f"  ACTIONABLE SETUPS: {len(setups)} stocks in the Golden Zone today")
        print(f"{'=' * width}\n")

        report = pd.DataFrame(setups)
        report = report.sort_values("R:R", ascending=False).reset_index(drop=True)
        report.index += 1

        # Format dollar columns
        for col in ["Price", "Fib 50% (Top)", "Fib 61.8% (Bot)", "Take Profit", "ATR Stop"]:
            report[col] = report[col].apply(lambda x: f"${x:,.2f}")
        for col in ["Risk %", "Reward %"]:
            report[col] = report[col].apply(lambda x: f"{x:.1f}%")
        report["R:R"] = report["R:R"].apply(lambda x: f"{x:.1f}x")

        print(report.to_string())

        print(f"\n{'=' * width}")
        print(f"  Legend:")
        print(f"    Fib 50% (Top)  = Top of Golden Zone (shallowest pullback)")
        print(f"    Fib 61.8% (Bot)= Bottom of Golden Zone (deepest pullback)")
        print(f"    Take Profit    = 60-day Swing High (Fib 0% level)")
        print(f"    ATR Stop       = Entry Price - 2.5 x ATR(14)")
        print(f"    R:R            = Reward-to-Risk ratio")
        print(f"{'=' * width}\n")
    else:
        print(f"  NO SETUPS TODAY")
        print(f"  The market is not offering optimal Fibo-Macro entries right now.")
        print(f"  Stay patient. Stay in cash. Wait for the Golden Zone.")
        print(f"{'=' * width}\n")


if __name__ == "__main__":
    main()
