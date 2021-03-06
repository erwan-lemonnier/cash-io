import logging
import json
import string

logger = None

def setup_logging(name):
    """Setup console logging"""
    global logger
    if logger:
        return logger

    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    ch = logging.StreamHandler()
    ch.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch.setFormatter(formatter)
    logger.addHandler(ch)
    return logger

def create_http_response(data, status_code=200, headers=None, redirect_url=None):
    """Utility method for compiling the reply of @route methods"""
    if not data:
        raise Exception("No data provided")
    if not headers:
        headers = {}
    if isinstance(data, basestring):
        headers["content-type"] = "text/html"
        reply = data
    elif isinstance(data, dict):
        headers["content-type"] = "application/json"
        reply = json.dumps(data)
    else:
        raise Exception("Cannot handle data of type %s" % type(data))
    if redirect_url:
        headers["Location"] = redirect_url
        status_code = 203
    return (reply, status_code, headers)

class Transaction():

    def __init__(self, date, amount, target, owner, raw, category=None, id=None):
        self.date = date
        self.amount = float(amount)
        self.target = target
        self.owner = owner
        self.raw = raw
        self.category = category
        self.ignore = False
        if self.category:
            self.category = category.strip()
        else:
            self.category = 'unknown'

        # Some normalization of the category name
        self.category = self.category.replace('_', ' ').replace('-', ' ')

        if id:
            self.id = id
        else:
            self.id = "transaction-" + str(hash(self.raw))

        # Set the ignore flag
        if 'ignore' in self.category.lower():
            self.ignore = True

        # targetid: an html-id friendly string uniquely representing a target
        self.targetid = "target-" + str(hash(self.target))

    def to_json(self):
        return {
            'id': self.id,
            'date': self.date,
            'amount': self.amount,
            'target': self.target,
            'owner': self.owner,
            'raw': self.raw,
            'category': self.category,
        }
