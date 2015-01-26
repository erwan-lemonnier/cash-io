import os
import sqlite3
from contextlib import contextmanager
from cashio.common import Transaction

log = None

db_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', '..', 'db')
db_path = os.path.join(db_dir, 'cashio.db')

schema = [
"""
CREATE TABLE  transactions (
    rawdata   CHAR(200) PRIMARY KEY,
    owner     CHAR(20) NOT NULL,
    date      DATE NOT NULL,
    amount    NUMBER NOT NULL,
    target    CHAR(50) NOT NULL,
    recipient INTEGER NULL
)""",
"""
CREATE TABLE  recipients (
    name      CHAR(50) PRIMARY KEY,
    regexp    BOOLEAN,
    category  CHAR(50) NOT NULL
)"""]


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
    with get_cursor(True) as c:

        cnt = c.execute("SELECT COUNT(*) FROM transactions WHERE rawdata=?", (t.raw,))
        cnt, = c.fetchone()
        cnt = int(cnt)
        assert cnt >= 0

        if cnt == 1:
            #log.debug("Transaction already exists. Skipping [%s]" % raw)
            pass
        elif cnt > 1:
            raise Exception("Duplicate transaction in database [%s]. Rm db and rebuild." % t.raw)
        else:
            # TODO: try to identify a recipient for the target string
            #     select * from recipients where name==transaction.target
            #     if match:
            #         set transaction.recipient=transaction.target
            #     for name in recipients where regexp is true:
            #         if name in transaction.target:
            #             set transaction.recipient=recipient.name
            #             break
            recipient = None
            c.execute("INSERT INTO transactions (rawdata, owner, date, amount, target, recipient) VALUES (?, ?, ?, ?, ?, ?)",
                      (t.raw, t.owner, t.date, t.amount, t.target, t.recipient))


def delete_category(name):
    # for each recipient having this category:
    #    for each transaction having this recipient:
    #        set transaction recipient to NULL
    #    delete recipient
    # commit
    pass

def add_recipient(name, category, regexp=False):
    # add recipient entry
    # for each transaction where recipient is null:
    #     if (regexp and name in transaction.target) or (name == transaction.target):
    #         set transaction.recipient to this recipient id
    # if regexp:
    #     for each transaction where transaction.recipient is null:
    #         if name in transaction.target:
    #             set transaction.recipient = recipient.name
    # else:
    #     for each transaction where transaction.target == name:
    #         set transaction.recipient = recipient.name
    pass

def get_transactions(month=None):
    query = "SELECT date, amount, target, owner, rawdata, recipient FROM transactions WHERE "
    match = None
    if month:
        query = query + "date LIKE ? ORDER BY date DESC"
        match = month + "-%"
    else:
        raise ValueError("Not enough arguments to build query")

    transactions = []
    with get_cursor(True) as c:
        res = c.execute(query, (match, ))
        for r in c.fetchall():
            transactions.append(Transaction(r[0], r[1], r[2], r[3], r[4], r[5]))

    return transactions
