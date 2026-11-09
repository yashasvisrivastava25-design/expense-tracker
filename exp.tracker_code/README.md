# Expense Tracker (Python)

A command-line app to record, view, search and summarise your daily expenses.
Uses only the Python standard library. No installation needed.

## Features
- Add expenses with date, category, amount and note
- View all expenses with a running total
- Delete an expense by ID
- Spending summary by category and by month (with text bar charts)
- Search by category or note
- Data is saved automatically in `expenses.csv`

## How to run
1. Install Python 3.8 or newer.
2. Open a terminal in this folder.
3. Run:

       python main.py

(Use `python3 main.py` on Linux/macOS.)

## Project structure
    expense_tracker/
    |-- main.py       # menu, user input, summaries
    |-- storage.py    # reading/writing the CSV file
    |-- README.md

## Concepts used
Functions, dictionaries, lists, loops, input validation, exception handling,
file handling (CSV), the `datetime` and `collections` modules, and modular code
split across files.

## Possible extensions
Add monthly budgets, export to Excel, a Tkinter GUI, or charts with matplotlib.
