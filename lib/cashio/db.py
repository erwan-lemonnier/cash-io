import os
import sqlite3
from contextlib import contextmanager
from cashio.common import Transaction

log = None

db_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'db')
db_path = os.path.join(db_dir, 'cashio.db')

schema = [
"""
CREATE TABLE     transactions (
    rawdata      CHAR(200) PRIMARY KEY,
    owner        CHAR(20) NOT NULL,
    date         DATE NOT NULL,
    amount       NUMBER NOT NULL,
    target       CHAR(50) NOT NULL,
    cleantarget  CHAR(50) NOT NULL
)""",
"""
CREATE TABLE     categories (
    cleantarget  CHAR(50) PRIMARY KEY,
    category     CHAR(50) NOT NULL
)""",
"""
CREATE TABLE     target_substitution (
    target       CHAR(50) PRIMARY KEY,
    cleantarget  CHAR(50) NOT NULL
)"""
]


class DBException(Exception):
    pass

@contextmanager
def get_cursor(autocommit=False):
    with sqlite3.connect(db_path) as conn:
        yield conn.cursor()
        if autocommit:
            conn.commit()

def create_database(logger):
    """Create cashio database, with initial sql schema"""
    global log
    log = logger

    if not os.path.exists(db_dir):
        os.mkdir(db_dir)

    with get_cursor(True) as c:

        for r in c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"):
            if r[0] in ('transactions', 'targets', 'categories'):
                log.debug("DB already created. Delete cashio.db to force recreation")
                return

        log.info("Creating cashio database")
        for statement in schema:
            c.execute(statement)


def add_transaction(t):
    """Add a row in the transactions table"""
    with get_cursor(True) as c:

        c.execute("SELECT COUNT(*) FROM transactions WHERE rawdata=?", (t.raw, ))
        cnt, = c.fetchone()
        assert int(cnt) in [0, 1]

        if int(cnt) == 0:
            # Should we substitute t.target with something more generic?
            # is there target_substitution.contains that is in t.target? if so set t.cleantarget to it
            # TODO: replace last t.target with t.cleantarget
            c.execute("INSERT INTO transactions (rawdata, owner, date, amount, target, cleantarget) " \
                      "VALUES (?, ?, ?, ?, ?, ?)",
                      (t.raw, t.owner, t.date, t.amount, t.target, t.target))

def add_target(cleantarget, category):
    """Add a row in the categories table"""
    with get_cursor(True) as c:

        c.execute("SELECT COUNT(*), category FROM categories WHERE cleantarget=?", (cleantarget, ))
        cnt, cat = c.fetchone()
        assert int(cnt) in [0, 1]

        if int(cnt) == 0:
            c.execute("INSERT INTO categories (cleantarget, category) VALUES (?, ?)",
                      (cleantarget, category))
        elif cat != category:
            raise DBException("cleantarget '%s' is already bound to category '%s'. cannot bind it to '%s'" %
                              (cleantarget, cat, category))
        # else: cat == category, so the target-category mapping already exists


def delete_category(category):
    with get_cursor(True) as c:
        cnt = c.execute("DELETE FROM categories WHERE category=?", (category, ))

def get_transactions(month=None):
    query = "SELECT t.date, t.amount, t.target, t.owner, t.rawdata, c.category " \
            "FROM transactions t " \
            "LEFT JOIN categories c " \
            "ON t.cleantarget=c.cleantarget WHERE "

    match = None
    if month:
        query = query + "t.date LIKE ? ORDER BY date DESC"
        match = month + "-%"
    else:
        raise ValueError("Not enough arguments to build query")

    log.debug("Getting transactions for [%s] [%s]" % (query, match))
    transactions = []
    with get_cursor(True) as c:
        res = c.execute(query, (match, ))
        for r in c.fetchall():
            transactions.append(Transaction(r[0], r[1], r[2], r[3], r[4], r[5]))

    return transactions

def get_years():
    years = []
    query = "SELECT DISTINCT SUBSTR(date, 1, 4) FROM transactions"
    with get_cursor(False) as c:
        res = c.execute(query)
        for r in c.fetchall():
            years.append(r[0])
    return years
