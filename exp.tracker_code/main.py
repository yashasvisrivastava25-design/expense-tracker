"""Expense Tracker - a simple command-line app.

Run with:  python main.py
"""
from collections import defaultdict
from datetime import date, datetime

from storage import load_expenses, save_expenses, next_id

CURRENCY = "Rs."


def ask_date():
    raw = input("Date (YYYY-MM-DD, Enter for today): ").strip()
    if not raw:
        return date.today().isoformat()
    try:
        return datetime.strptime(raw, "%Y-%m-%d").date().isoformat()
    except ValueError:
        print("Invalid date, using today.")
        return date.today().isoformat()


def ask_amount():
    while True:
        try:
            amount = float(input("Amount: ").strip())
            if amount <= 0:
                raise ValueError
            return round(amount, 2)
        except ValueError:
            print("Please enter a positive number.")


def add_expense(expenses):
    print("\n--- Add Expense ---")
    exp = {
        "id": next_id(expenses),
        "date": ask_date(),
        "category": input("Category (food, travel, bills...): ").strip().title() or "Other",
        "amount": ask_amount(),
        "note": input("Note (optional): ").strip(),
    }
    expenses.append(exp)
    save_expenses(expenses)
    print("Expense added.")


def view_expenses(expenses):
    print("\n--- All Expenses ---")
    if not expenses:
        print("No expenses recorded yet.")
        return
    print(f"{'ID':<4} {'Date':<11} {'Category':<12} {'Amount':>10}  Note")
    print("-" * 60)
    for e in sorted(expenses, key=lambda x: x["date"]):
        print(f"{e['id']:<4} {e['date']:<11} {e['category']:<12} "
              f"{e['amount']:>10.2f}  {e['note']}")
    print("-" * 60)
    print(f"Total: {CURRENCY} {sum(e['amount'] for e in expenses):.2f}")


def delete_expense(expenses):
    view_expenses(expenses)
    if not expenses:
        return
    try:
        target = int(input("\nEnter ID to delete: "))
    except ValueError:
        print("Invalid ID.")
        return
    for e in expenses:
        if e["id"] == target:
            expenses.remove(e)
            save_expenses(expenses)
            print("Deleted.")
            return
    print("No expense with that ID.")


def bar(value, maximum, width=30):
    return "#" * int(width * value / maximum) if maximum else ""


def category_summary(expenses):
    print("\n--- Spending by Category ---")
    if not expenses:
        print("No data yet.")
        return
    totals = defaultdict(float)
    for e in expenses:
        totals[e["category"]] += e["amount"]
    biggest = max(totals.values())
    for cat, amt in sorted(totals.items(), key=lambda x: -x[1]):
        print(f"{cat:<12} {CURRENCY} {amt:>9.2f}  {bar(amt, biggest)}")


def monthly_summary(expenses):
    print("\n--- Spending by Month ---")
    if not expenses:
        print("No data yet.")
        return
    totals = defaultdict(float)
    for e in expenses:
        totals[e["date"][:7]] += e["amount"]
    biggest = max(totals.values())
    for month in sorted(totals):
        print(f"{month}  {CURRENCY} {totals[month]:>9.2f}  {bar(totals[month], biggest)}")


def search(expenses):
    word = input("Search text (category or note): ").strip().lower()
    hits = [e for e in expenses
            if word in e["category"].lower() or word in e["note"].lower()]
    if not hits:
        print("No matches.")
        return
    for e in hits:
        print(f"{e['id']:<4} {e['date']}  {e['category']:<12} {e['amount']:>9.2f}  {e['note']}")


MENU = """
===== EXPENSE TRACKER =====
1. Add expense
2. View all expenses
3. Delete expense
4. Summary by category
5. Summary by month
6. Search
7. Exit
"""

ACTIONS = {
    "1": add_expense,
    "2": view_expenses,
    "3": delete_expense,
    "4": category_summary,
    "5": monthly_summary,
    "6": search,
}


def main():
    expenses = load_expenses()
    while True:
        print(MENU)
        choice = input("Choose an option (1-7): ").strip()
        if choice == "7":
            print("Goodbye!")
            break
        action = ACTIONS.get(choice)
        if action:
            action(expenses)
        else:
            print("Invalid choice, try again.")


if __name__ == "__main__":
    main()
