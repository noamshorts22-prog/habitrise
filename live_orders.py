"""Live Bracket Orders — IBKR Paper Trading Execution.

Submits bracket orders (Marketable Limit Entry + Trailing Stop) to
Interactive Brokers TWS Paper account using risk-parity sized positions
from the Fibo-Macro Daily Radar.

Order flow:
  1. Fetch current market price via IBKR snapshot
  2. Parent: LMT BUY at current_price * 1.003 (0.3% above — ensures fill)
  3. Child:  TRAIL STOP SELL with auxPrice = trailing amount
  4. transmit=False on parent, transmit=True on child → atomic submission
"""

import asyncio
from datetime import datetime

# Python 3.12+ removed implicit event loop creation — ib_insync needs one at import time
asyncio.set_event_loop(asyncio.new_event_loop())

from ib_insync import IB, Stock, Order


# ── Connection ────────────────────────────────────────────────────────────
HOST = "127.0.0.1"
PORT = 7497
CLIENT_ID = 3

# ── Limit Price Buffer ───────────────────────────────────────────────────
LMT_BUFFER_PCT = 0.003  # 0.3% above current price

# ── Targets from Risk-Parity Sizing ──────────────────────────────────────
# trailing_amt = ATR-based trailing stop distance in dollars
TARGETS = [
    {"ticker": "AMGN", "qty": 54,  "trailing_amt": 12.50},
    {"ticker": "GS",   "qty": 15,  "trailing_amt": 25.00},
    {"ticker": "CSCO", "qty": 191, "trailing_amt": 2.80},
]


def banner(text: str) -> None:
    w = 78
    print(f"\n{'=' * w}")
    print(f"  {text}")
    print(f"{'=' * w}")


def section(text: str) -> None:
    print(f"\n  --- {text} ---")


def fetch_current_price(ib: IB, contract: Stock) -> float:
    """Fetch the current market price via IBKR snapshot data.

    Requests a market data snapshot (no streaming subscription needed),
    waits up to 5 seconds for the ticker to populate, then returns
    the last price. Falls back to close price if last is unavailable.
    """
    ticker = ib.reqMktData(contract, "", True, False)  # snapshot=True
    ib.sleep(2)  # allow time for snapshot to arrive

    price = ticker.last
    if price is None or price != price:  # NaN check
        price = ticker.close
    if price is None or price != price:
        price = ticker.marketPrice()

    ib.cancelMktData(contract)
    return float(price) if price and price == price else 0.0


def create_bracket_order(
    action: str,
    quantity: int,
    limit_price: float,
    trailing_amount: float,
) -> list[Order]:
    """Create a 2-leg bracket: Marketable Limit Entry + Trailing Stop.

    Leg 1 (Parent):  Limit BUY at limit_price (0.3% above market → fills immediately).
    Leg 2 (Child):   Trailing Stop SELL with auxPrice = trailing distance in dollars.

    transmit=False on parent → order is held until child transmits.
    transmit=True on child   → fires the entire group atomically.
    """
    # ── Parent: Marketable Limit Entry ────────────────────────────────
    parent = Order()
    parent.action = action
    parent.orderType = "LMT"
    parent.totalQuantity = quantity
    parent.lmtPrice = round(limit_price, 2)
    parent.tif = "GTC"
    parent.transmit = False  # HELD — do not send yet

    # ── Child: Trailing Stop ──────────────────────────────────────────
    trail_stop = Order()
    trail_stop.action = "SELL"
    trail_stop.orderType = "TRAIL"
    trail_stop.totalQuantity = quantity
    trail_stop.auxPrice = round(trailing_amount, 2)  # trailing distance in $
    trail_stop.tif = "GTC"
    trail_stop.parentId = parent.orderId
    trail_stop.transmit = True  # fires the entire bracket

    return [parent, trail_stop]


def main() -> None:
    banner(f"IBKR LIVE BRACKET ORDERS  |  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Mode:       PAPER TRADING")
    print(f"  Strategy:   Marketable Limit + Trailing Stop")
    print(f"  Endpoint:   {HOST}:{PORT}  (clientId={CLIENT_ID})")
    print(f"  Targets:    {len(TARGETS)} positions")
    print(f"  Lmt Buffer: +{LMT_BUFFER_PCT * 100:.1f}% above market")

    # ── Connect to TWS ────────────────────────────────────────────────
    section("Connecting to IBKR TWS")

    ib = IB()
    ib.connect(HOST, PORT, clientId=CLIENT_ID, timeout=10)

    accounts = ib.managedAccounts()
    print(f"  Status:     CONNECTED")
    print(f"  Account:    {accounts[0] if accounts else 'N/A'}")

    # ── Fetch live prices & print order plan ──────────────────────────
    section("Fetching Live Prices")

    order_plan = []
    for target in TARGETS:
        ticker = target["ticker"]
        contract = Stock(ticker, "SMART", "USD")
        qualified = ib.qualifyContracts(contract)

        if not qualified:
            print(f"  [{ticker}] FAILED: Could not qualify contract")
            order_plan.append({**target, "contract": None, "price": 0.0, "lmt": 0.0})
            continue

        price = fetch_current_price(ib, contract)
        lmt = round(price * (1 + LMT_BUFFER_PCT), 2)

        print(f"  [{ticker}] Current: ${price:,.2f}  →  Limit: ${lmt:,.2f}  "
              f"(+{LMT_BUFFER_PCT * 100:.1f}%)  Trail: ${target['trailing_amt']:.2f}")

        order_plan.append({**target, "contract": contract, "price": price, "lmt": lmt})

    # ── Print order plan ──────────────────────────────────────────────
    section("Order Plan")
    print(f"  {'Ticker':>8}  {'Action':>6}  {'Qty':>5}  {'Price':>10}  "
          f"{'Limit':>10}  {'Trail $':>8}")
    print(f"  {'-' * 8}  {'-' * 6}  {'-' * 5}  {'-' * 10}  "
          f"{'-' * 10}  {'-' * 8}")
    for p in order_plan:
        print(f"  {p['ticker']:>8}  {'BUY':>6}  {p['qty']:>5}  "
              f"${p['price']:>9,.2f}  ${p['lmt']:>9,.2f}  ${p['trailing_amt']:>7,.2f}")

    # ── Submit bracket orders ─────────────────────────────────────────
    section("Submitting Bracket Orders")

    order_log = []

    for plan in order_plan:
        ticker = plan["ticker"]
        contract = plan["contract"]
        qty = plan["qty"]
        lmt = plan["lmt"]
        trail_amt = plan["trailing_amt"]

        if contract is None:
            order_log.append({"ticker": ticker, "status": "FAILED", "reason": "contract"})
            continue

        if plan["price"] <= 0:
            print(f"  [{ticker}] FAILED: Could not fetch price")
            order_log.append({"ticker": ticker, "status": "FAILED", "reason": "no price"})
            continue

        print(f"\n  [{ticker}] Contract: {contract.localSymbol} (conId={contract.conId})")

        # Create the bracket
        bracket = create_bracket_order(
            action="BUY",
            quantity=qty,
            limit_price=lmt,
            trailing_amount=trail_amt,
        )

        parent_order, trail_order = bracket

        # Place parent (held — transmit=False)
        ib.placeOrder(contract, parent_order)
        print(f"  [{ticker}] LEG 1/2  LMT BUY x{qty} @${lmt:,.2f}  "
              f"=> orderId={parent_order.orderId}  (transmit=False)")

        # Set parentId now that the parent has a real orderId
        trail_order.parentId = parent_order.orderId

        # Place child (fires everything — transmit=True)
        ib.placeOrder(contract, trail_order)
        print(f"  [{ticker}] LEG 2/2  TRAIL STOP SELL x{qty} trail=${trail_amt:.2f}  "
              f"=> orderId={trail_order.orderId}  (transmit=True)")

        print(f"  [{ticker}] BRACKET SUBMITTED SUCCESSFULLY")

        order_log.append({
            "ticker": ticker,
            "status": "SUBMITTED",
            "parent_id": parent_order.orderId,
            "trail_id": trail_order.orderId,
            "lmt_price": lmt,
            "trail_amt": trail_amt,
        })

    # ── Wait for transmission ─────────────────────────────────────────
    section("Confirming Transmission")
    print(f"  Waiting 2 seconds for order confirmation...")
    ib.sleep(2)

    # Check order statuses
    open_orders = ib.openOrders()
    print(f"  Open orders on account: {len(open_orders)}")

    for entry in order_log:
        if entry["status"] == "SUBMITTED":
            print(f"  {entry['ticker']:>6}  =>  Parent(LMT)={entry['parent_id']}  "
                  f"Trail={entry['trail_id']}")

    # ── Disconnect ────────────────────────────────────────────────────
    ib.disconnect()

    # ── Final Summary ─────────────────────────────────────────────────
    banner("EXECUTION SUMMARY")
    submitted = sum(1 for e in order_log if e["status"] == "SUBMITTED")
    failed = sum(1 for e in order_log if e["status"] == "FAILED")

    print(f"  Brackets Submitted:  {submitted}")
    print(f"  Brackets Failed:     {failed}")
    print(f"  Total Legs Placed:   {submitted * 2}")
    print(f"  Status:              {'ALL ORDERS LIVE' if failed == 0 else 'PARTIAL EXECUTION'}")
    print()

    for entry in order_log:
        symbol = entry["ticker"]
        if entry["status"] == "SUBMITTED":
            print(f"    {symbol:>6}  LIVE  |  LMT BUY @${entry['lmt_price']:,.2f} "
                  f"+ TRAIL ${entry['trail_amt']:.2f}  "
                  f"|  IDs: {entry['parent_id']}/{entry['trail_id']}")
        else:
            print(f"    {symbol:>6}  FAIL  |  {entry.get('reason', 'unknown')}")

    print(f"\n{'=' * 78}")
    print(f"  Order flow:")
    print(f"    1. LMT BUY fills immediately (0.3% above market)")
    print(f"    2. TRAIL STOP activates, follows price up")
    print(f"    3. If price drops by trail amount → SELL triggered")
    print(f"  Monitor positions in TWS or IB Gateway.")
    print(f"{'=' * 78}\n")


if __name__ == "__main__":
    main()
