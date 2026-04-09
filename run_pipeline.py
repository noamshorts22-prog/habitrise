"""StockRadar Pipeline Orchestrator — Daily 21:00 IDT (18:00 UTC).

Execution order:
  1. Run market_radar_telegram.py  (scan 50 tickers, send Telegram, save signals.csv)
  2. Check signals.csv             (if empty -> exit, no trades today)
  3. Run live_orders.py            (place brackets via IBKR, insert to Supabase)
"""

import subprocess
import sys
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PYTHON = sys.executable  # use the same Python that launched this script


def banner(text: str) -> None:
    w = 78
    print(f"\n{'=' * w}")
    print(f"  {text}")
    print(f"{'=' * w}")


def run_step(name: str, script: str) -> bool:
    """Run a Python script as a subprocess. Returns True on success."""
    print(f"\n  >> Running: {script}")
    result = subprocess.run(
        [PYTHON, str(SCRIPT_DIR / script)],
        cwd=str(SCRIPT_DIR),
        timeout=600,  # 10 min max per step
    )
    if result.returncode != 0:
        print(f"  !! {name} FAILED (exit code {result.returncode})")
        return False
    print(f"  << {name} completed successfully")
    return True


def signals_exist() -> bool:
    """Check if signals.csv has actionable trades."""
    csv_path = SCRIPT_DIR / "signals.csv"
    if not csv_path.exists():
        return False
    content = csv_path.read_text().strip()
    if not content:
        return False
    # Must have at least a header + one data row
    lines = content.splitlines()
    return len(lines) >= 2


def main() -> None:
    banner(f"STOCKRADAR PIPELINE  |  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # ── Step 1: Scan + Telegram ───────────────────────────────────────
    print("\n  [1/3] SCANNER + TELEGRAM")
    if not run_step("Scanner", "market_radar_telegram.py"):
        banner("PIPELINE ABORTED -- Scanner failed")
        sys.exit(1)

    # ── Step 2: Check signals ─────────────────────────────────────────
    print("\n  [2/3] CHECKING SIGNALS")
    if not signals_exist():
        print("  No actionable signals in signals.csv.")
        print("  Skipping order execution. Market not in Golden Zone today.")
        banner("PIPELINE COMPLETE -- No trades")
        sys.exit(0)

    signal_count = len((SCRIPT_DIR / "signals.csv").read_text().strip().splitlines()) - 1
    print(f"  Found {signal_count} actionable signal(s) in signals.csv")

    # ── Step 3: Execute orders ────────────────────────────────────────
    print("\n  [3/3] IBKR EXECUTION + SUPABASE")
    if not run_step("Execution", "live_orders.py"):
        banner("PIPELINE COMPLETE -- Execution had errors")
        sys.exit(1)

    banner("PIPELINE COMPLETE -- All steps succeeded")


if __name__ == "__main__":
    main()
