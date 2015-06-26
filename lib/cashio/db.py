import os
import sqlite3
from contextlib import contextmanager
from cashio.common import Transaction

log = None

db_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'db')
db_path = os.path.join(db_dir, 'cashio.db')

schema = [

# A money transaction, basically a line from the bank account ledger
# The 'target' is the raw string identifying the transaction's recipient
# in the ledger. 'cleantarget' is that same string if we should use the
# generic category for that target, or a string of the format
# '<dateYYYYMMDD>:<target>' if we should make an exception and use an other
# category than the default one.
# '<dateYYMMDD>-<target>' should then have a mapping to a category in
# the categories table.
"""
CREATE TABLE     transactions (
    rawdata      CHAR(200) PRIMARY KEY,
    id           CHAR(50) NOT NULL,
    owner        CHAR(20) NOT NULL,
    date         DATE NOT NULL,
    amount       NUMBER NOT NULL,
    target       CHAR(50) NOT NULL,
    cleantarget  CHAR(50) NOT NULL
)""",

# Map a cleantarget (such as 'apotek fen' or '20150412:apotek fen') to
# a category (such as 'healthcare')
"""
CREATE TABLE     categories (
    cleantarget  CHAR(50) PRIMARY KEY,
    category     CHAR(50) NOT NULL
)""",

# A mechanism not implemented yet: the idea is to allow replacing
# mutating target names (such as 'mc donald A' and 'mc donald B')
# with a generic target ('mc donald') to avoid having to maintain
# multiple mappings.
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
            c.execute("INSERT INTO transactions (rawdata, id, owner, date, amount, target, cleantarget) " \
                      "VALUES (?, ?, ?, ?, ?, ?, ?)",
                      (t.raw, t.id, t.owner, t.date, t.amount, t.target, t.target))

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

def get_transactions(year, month=None):
    query = "SELECT t.date, t.amount, t.target, t.owner, t.rawdata, c.category, t.id " \
            "FROM transactions t " \
            "LEFT JOIN categories c " \
            "ON t.cleantarget=c.cleantarget WHERE " \
            "t.date LIKE ? ORDER BY date DESC"
    match = None

    if not year:
        raise ValueError("Not enough arguments to build query")
    elif not month:
        # Select all transactions for given year
        match = "{0}-%".format(year)
    else:
        # Select all transations for year and month
        match = "{0}-{1}-%".format(year, month)

    log.debug("Getting transactions for [%s] [%s]" % (query, match))
    transactions = []
    with get_cursor(True) as c:
        res = c.execute(query, (match, ))
        for r in c.fetchall():
            transactions.append(Transaction(r[0], r[1], r[2], r[3], r[4], r[5], r[6]))

    return transactions

def get_years():
    years = []
    query = "SELECT DISTINCT SUBSTR(date, 1, 4) FROM transactions"
    with get_cursor(False) as c:
        res = c.execute(query)
        for r in c.fetchall():
            years.append(r[0])
    return years

def get_categories_names():
    """Return a list of all categories, by order of having most to less transactions"""
    categories = []
    query = "SELECT c.category, COUNT(t.rawdata) AS s " \
            "FROM categories c, transactions t " \
            "WHERE t.cleantarget=c.cleantarget " \
            "GROUP BY c.category ORDER BY s DESC"
    with get_cursor(False) as c:
        res = c.execute(query)
        for r in c.fetchall():
            categories.append(r[0])
    return categories

def get_transactions_with_unknown_targets():
    """Return a list of all transactions with unknown targets, grouped
    by targets and ordered by decreasing date"""

    query = "SELECT t.date, t.amount, t.cleantarget, t.owner, t.rawdata, t.id " \
            "FROM transactions t " \
            "WHERE t.cleantarget NOT IN (SELECT DISTINCT cleantarget FROM categories) " \
            "ORDER BY DATE DESC LIMIT 200"

    log.debug("Getting transactions with unknown categories")
    transactions = []
    with get_cursor(True) as c:
        res = c.execute(query)
        for r in c.fetchall():
            transactions.append(Transaction(r[0], r[1], r[2], r[3], r[4], id=r[5]))

    return transactions

def assign_target_to_category(cleantarget, category, transactionid=None):
    """Assign target to that category for all transactions (if transactionid==None),
    or for that transaction only (if transactionid specified)"""

    with get_cursor(True) as c:
        if transactionid:
            # Set cleantarget to transactionid:cleantarget for this transaction,
            # then assign transactionid:cleantarget to that category in categories
            newcleantarget = "%s:%s" % (transactionid, cleantarget)

            # TODO: make sure transactionid really is unique. Currently (using hash()), it is not...
            log.debug("Assigning '%s' to category '%s' only for transaction '%s'" % (newcleantarget, category, transactionid))
            c.execute("UPDATE transactions SET cleantarget=? WHERE id=?",
                      (newcleantarget, transactionid))
            _insert_or_update_category(c, newcleantarget, category)
        else:
            _insert_or_update_category(c, cleantarget, category)

def _insert_or_update_category(c, cleantarget, category):
    c.execute("SELECT COUNT(*) FROM categories WHERE cleantarget=?", (cleantarget, ))
    cnt, = c.fetchone()
    assert int(cnt) in [0, 1]

    if int(cnt) == 0:
        log.debug("Inserting '%s'/'%s' into categories" % (cleantarget, category))
        c.execute("INSERT INTO categories (cleantarget, category) VALUES (?, ?)",
                  (cleantarget, category))
    else:
        log.debug("Changing '%s' to category '%s'" % (cleantarget, category))
        c.execute("UPDATE categories SET category=? WHERE cleantarget=?",
                  (category, cleantarget))
