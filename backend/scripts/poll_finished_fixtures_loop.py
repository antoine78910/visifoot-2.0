"""
Boucle de polling Option A : appelle run_poll_finished_fixtures() toutes les N secondes.
N = POLLING_INTERVAL_SECONDS (10 pour test, 3600 pour prod).
Lancer : depuis la racine backend, python scripts/poll_finished_fixtures_loop.py
"""
import sys
import time

# Ajouter le répertoire parent au path pour importer app
sys.path.insert(0, ".")

from app.core.config import get_settings
from app.services.fixture_polling import run_poll_finished_fixtures


def main():
    interval = get_settings().polling_interval_seconds
    print(f"Polling every {interval}s (Ctrl+C to stop)")
    while True:
        try:
            result = run_poll_finished_fixtures()
            print(f"Checked {result['checked']}, processed {result['processed']}", end="")
            if result["errors"]:
                print(f", errors: {result['errors']}")
            else:
                print()
        except Exception as e:
            print(f"Error: {e}")
        time.sleep(interval)


if __name__ == "__main__":
    main()
