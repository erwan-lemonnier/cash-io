import logging
import re
import cashio.db as db
from cashio.common import Transaction

log = logging.getLogger(__name__)

def add_transactions(transactions):
    log.debug("Got %s transactions" % len(transactions))
    log.debug("First one is: %s" % transactions[0])
    for t in transactions:
        t = Transaction(t['date'],
                        t['amount'],
                        t['target'],
                        t['owner'],
                        t['raw'])
        db.add_transaction(t)

def create_or_update_category(category, exact_matches, partial_matches):
    log.debug("Got category %s, with %s exact matches and %s partial ones" %
              (category, len(exact_matches), len(partial_matches)))

    db.delete_category(category)

    for s in exact_matches:
        db.add_recipient(s, category, False)

    for s in partial_matches:
        db.add_recipient(s, category, True)

    # TODO: store cats in db, and update all transactions

def get_transactions(date):
    """date is either a yyyy-mm or a yyyy. Return a list of transactions, and
    sums of amounts spent, earned and total"""
    transactions = []
    total_earned, total_spent, total = 0, 0, 0
    if re.match("^\d\d\d\d-\d\d$", date):
        for t in db.get_transactions(month=date):
            transactions.append(t.to_json())
            total = total + t.amount
            if t.amount > 0:
                total_earned = total_earned + t.amount
            else:
                total_spent = total_spent + t.amount
    else:
        raise ValueError("Date format not supported: %s" % date)

    return {
        'transactions': transactions,
        'total_spent': total_spent,
        'total_earned': total_earned,
        'total': total,
    }
