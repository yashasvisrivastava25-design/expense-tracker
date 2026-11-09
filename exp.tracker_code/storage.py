"""Storage layer: saves and loads expenses from a CSV file."""
import csv
import os

FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "expenses.csv")
FIELDS = ["id", "date", "category", "amount", "note"]


def load_expenses():
    """Return a list of expense dicts (empty list if no file yet)."""
    if not os.path.exists(FILE):
        return []
    with open(FILE, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    for r in rows:
        r["id"] = int(r["id"])
        r["amount"] = float(r["amount"])
    return rows


def save_expenses(expenses):
    """Overwrite the CSV with the given list of expenses."""
    with open(FILE, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(expenses)


def next_id(expenses):
    return max((e["id"] for e in expenses), default=0) + 1
