# cash-io

WARNING: work in progress! sloppy early-stage code!

Keep track of money you earn and spend, with graphs and reports.

# What is it?

* Copy/paste transactions from your account statement on your online bank.
* Feed them into cash-io.
* Browse to [127.0.0.1:8080](http://127.0.0.1:8080/).
* Assign unrecognized transactions to categories (such as 'food', 'mortgage', etc.).
* Look at all the nice graphs.

# Banks supported

* SEB

# Current state

cash-io is under irregular development and far from mature. It is foremost for
private use, and used as an excuse for learning new skills (such as python's
flask, javascript, ajax, jquery, etc.)

# Getting and running cash-io

```bash
# Clone project
git clone git@github.com:erwan-lemonnier/cash-io.git

# Setup dependencies
sudo pip install requests flask

# Run the cash-io web service:
cd cash-io; ./bin/www
```

And in a second terminal:
```bash
# Seed transaction database with dummy data
cd cash-io; ./bin/load-data
```

You can now introspect the database:
```bash
sqlite3 cash-io/db/cashio.db

sqlite> select * from categories;
sqlite> select * from transactions;
```

And explore the web service by browsing to
[127.0.0.1:8080](http://127.0.0.1:8080/).


