"""Market Radar Telegram — Fibo-Macro signals with Confidence Score."""

import os
from datetime import datetime
from pathlib import Path

import pandas as pd
import requests
import yfinance as yf
from dotenv import load_dotenv

# ── Load .env (needed for VPS cron — no shell env vars) ─────────────────
load_dotenv(Path(__file__).parent / ".env")

# ── Output file for pipeline ───────────────────────────────────────────
SIGNALS_CSV = Path(__file__).parent / "signals.csv"

# ── Telegram (from environment) ──────────────────────────────────────────
TOKEN = os.environ.get("TELEGRAM_TOKEN", "").strip()
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "").strip()

# ── Strategy Parameters ──────────────────────────────────────────────────
LOOKBACK = 60
MACRO_PERIOD = 150
FIB_50 = 0.50
FIB_618 = 0.618
ATR_PERIOD = 14
ATR_MULT = 2.5

# ── Portfolio Sizing ─────────────────────────────────────────────────────
PORTFOLIO = 2_700.0
RISK_PCT = 0.02          # 2% max risk per trade
RISK_AMOUNT = PORTFOLIO * RISK_PCT  # $54

# ── Universe: Top 50 US Stocks ───────────────────────────────────────────
UNIVERSE = [
    "AAPL", "MSFT", "NVDA", "AMZN", "META", "TSLA", "GOOGL", "GOOG",
    "AVGO", "BRK-B", "JPM", "LLY", "V", "MA", "UNH", "COST", "NFLX",
    "HD", "JNJ", "ABBV", "WMT", "PG", "XOM", "CRM", "BAC",
    "ORCL", "MRK", "CVX", "KO", "PEP", "AMD", "ADBE", "TMO",
    "CSCO", "LIN", "ACN", "MCD", "ABT", "DHR", "TXN",
    "INTC", "NEE", "PM", "ISRG", "AMGN", "QCOM", "INTU", "AMAT", "CAT", "GS",
]


def send_telegram_msg(text: str) -> int:
    """Send a message via Telegram Bot API. Returns HTTP status code."""
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    resp = requests.post(url, data={
        "chat_id": CHAT_ID,
        "text": text,
        "parse_mode": "Markdown",
    })
    return resp.status_code


def fetch_data(ticker: str) -> pd.DataFrame | None:
    """Download daily OHLCV, return cleaned DataFrame or None."""
    try:
        df = yf.download(ticker, period="1y", auto_adjust=True, progress=False)
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


def calc_confidence(close: float, fib_top: float, fib_bot: float,
                    sma150: float) -> int:
    """Calculate confidence score (70-99) based on pullback depth and trend strength.

    Base:  70
    +0-15: Proximity to Fib 61.8% (deeper pullback = better value)
    +0-15: Distance above SMA 150 (stronger macro trend)
    Cap:   99
    """
    score = 70

    # Pullback depth: how close is price to the 61.8% level?
    zone_width = fib_top - fib_bot
    if zone_width > 0:
        depth_ratio = (fib_top - close) / zone_width  # 0 = at 50%, 1 = at 61.8%
        score += int(min(depth_ratio, 1.0) * 15)

    # Macro trend strength: how far above SMA 150?
    if sma150 > 0:
        dist_pct = (close - sma150) / sma150 * 100  # % above SMA 150
        # 0% above = +0, 10%+ above = +15
        trend_pts = min(dist_pct / 10.0, 1.0) * 15
        score += int(trend_pts)

    return min(score, 99)


def scan_ticker(df: pd.DataFrame) -> dict | None:
    """Check if latest bar meets Macro + Golden Zone. Returns setup or None."""
    df["sma_150"] = df["close"].rolling(MACRO_PERIOD).mean()
    df["swing_high"] = df["high"].rolling(LOOKBACK).max()
    df["swing_low"] = df["low"].rolling(LOOKBACK).min()
    df["fib_50"] = df["swing_high"] - FIB_50 * (df["swing_high"] - df["swing_low"])
    df["fib_618"] = df["swing_high"] - FIB_618 * (df["swing_high"] - df["swing_low"])

    prev_close = df["close"].shift(1)
    tr = pd.concat([
        df["high"] - df["low"],
        (df["high"] - prev_close).abs(),
        (df["low"] - prev_close).abs(),
    ], axis=1).max(axis=1)
    df["atr"] = tr.rolling(ATR_PERIOD).mean()

    last = df.iloc[-1]
    close = float(last["close"])
    sma150 = float(last["sma_150"])
    fib_top = float(last["fib_50"])
    fib_bot = float(last["fib_618"])
    swing_high = float(last["swing_high"])
    atr = float(last["atr"])

    if any(pd.isna(v) for v in [close, sma150, fib_top, fib_bot, swing_high, atr]):
        return None

    # Filter 1: Macro — close must be above SMA 150
    if close <= sma150:
        return None

    # Filter 2: Golden Zone — price inside Fib 50%-61.8%
    if not (fib_bot < close < fib_top):
        return None

    # ATR stop-loss
    stop = close - (ATR_MULT * atr)

    # Confidence score
    confidence = calc_confidence(close, fib_top, fib_bot, sma150)

    # Position sizing for $2,700 portfolio at 2% risk
    risk_per_share = close - stop
    if risk_per_share <= 0:
        return None

    shares = int(RISK_AMOUNT / risk_per_share)

    # Cap to what portfolio can actually afford
    max_affordable = int(PORTFOLIO / close)
    if shares > max_affordable:
        shares = max_affordable

    if shares <= 0:
        return None

    return {
        "close": round(close, 2),
        "tp": round(swing_high, 2),
        "stop": round(stop, 2),
        "shares": shares,
        "confidence": confidence,
    }


def main() -> None:
    if not TOKEN or not CHAT_ID:
        print("ERROR: Set TELEGRAM_TOKEN and TELEGRAM_CHAT_ID environment variables.")
        return

    print(f"\n{'=' * 68}")
    print(f"  FIBO-MACRO TELEGRAM RADAR  |  {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"  Portfolio: ${PORTFOLIO:,.0f}  |  Risk: {RISK_PCT*100:.0f}% (${RISK_AMOUNT:.0f})")
    print(f"  Scanning {len(UNIVERSE)} tickers...")
    print(f"{'=' * 68}")

    setups: list[tuple[str, dict]] = []

    for i, ticker in enumerate(UNIVERSE, 1):
        print(f"  [{i:>2}/{len(UNIVERSE)}] {ticker:<6}", end="", flush=True)
        df = fetch_data(ticker)
        if df is None:
            print(" skip")
            continue
        result = scan_ticker(df)
        if result:
            setups.append((ticker, result))
            print(f" ** SETUP ** (confidence: {result['confidence']}%)")
        else:
            print(" --")

    print(f"\n{'=' * 68}")
    print(f"  Setups found: {len(setups)}")
    print(f"{'=' * 68}")

    if setups:
        for ticker, s in setups:
            msg = (
                "\U0001f6a8 *\u05d0\u05d9\u05ea\u05d5\u05ea \u05e8\u05d3\u05d0\u05e8 \u05d7\u05d3\u05e9!* \U0001f6a8\n"
                f"\U0001f4c8 \u05de\u05e0\u05d9\u05d4: *{ticker}*\n"
                f"\U0001f4b0 \u05de\u05d7\u05d9\u05e8: {s['close']}$\n"
                f"\U0001f3af \u05d9\u05e2\u05d3 \u05e8\u05d5\u05d5\u05d7 (TP): {s['tp']}$\n"
                f"\U0001f6d1 \u05e1\u05d8\u05d5\u05e4 (ATR): {s['stop']}$\n"
                f"\U0001f4ca \u05de\u05d3\u05d3 \u05d1\u05d9\u05d8\u05d7\u05d5\u05df: {s['confidence']}%\n"
                f"\u2696\ufe0f \u05db\u05de\u05d5\u05ea \u05de\u05d5\u05de\u05dc\u05e6\u05ea: {s['shares']} \u05de\u05e0\u05d9\u05d5\u05ea"
            )
            status = send_telegram_msg(msg)
            print(f"  => {ticker}  Telegram API: {status} {'OK' if status == 200 else 'FAIL'}")
    else:
        no_setup_msg = (
            "\U0001f50d \u05e1\u05e8\u05d9\u05e7\u05d4 \u05d9\u05d5\u05de\u05d9\u05ea \u05d4\u05d5\u05e9\u05dc\u05de\u05d4: "
            "\u05dc\u05d0 \u05e0\u05de\u05e6\u05d0\u05d5 \u05d4\u05d6\u05d3\u05de\u05e0\u05d5\u05d9\u05d5\u05ea "
            "\u05db\u05e0\u05d9\u05e1\u05d4 \u05d1\u05d0\u05d6\u05d5\u05e8 \u05d4\u05d6\u05d4\u05d1 \u05d4\u05d9\u05d5\u05dd."
        )
        status = send_telegram_msg(no_setup_msg)
        print(f"  => No setups. Telegram API: {status} {'OK' if status == 200 else 'FAIL'}")

    # ── Export signals.csv for pipeline ─────────────────────────────────
    if setups:
        rows = []
        for ticker, s in setups:
            trailing_amt = round(s["close"] - s["stop"], 2)
            rows.append({
                "ticker": ticker,
                "price": s["close"],
                "stop": s["stop"],
                "tp": s["tp"],
                "shares": s["shares"],
                "trailing_amt": trailing_amt,
                "confidence": s["confidence"],
            })
        df_out = pd.DataFrame(rows)
        df_out.to_csv(SIGNALS_CSV, index=False)
        print(f"  Saved {len(rows)} signals to {SIGNALS_CSV.name}")
    else:
        # Clear stale signals
        SIGNALS_CSV.write_text("")
        print(f"  Cleared {SIGNALS_CSV.name} (no setups)")

    print(f"\n{'=' * 68}")
    print(f"  Radar complete.")
    print(f"{'=' * 68}\n")


if __name__ == "__main__":
    main()
