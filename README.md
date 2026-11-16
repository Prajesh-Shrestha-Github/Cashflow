# Cashflow

A personal finance app for Nepal, built so you rarely have to type a transaction in.
Cashflow captures spending from the messages and files you already receive, scores your
financial health, and gives you AI-backed advice in NPR.

> Status: active development. See [docs/PLAN.md](docs/PLAN.md) for the roadmap.

## Features

- **Zero-entry capture**: an ingest endpoint with an SMS parser, plus bank statement import
  with preview and duplicate detection. An iOS Shortcut can post SMS automatically
  ([setup guide](docs/ios-shortcut.md)).
- **Money Score**: one number for your financial health, with a what-if simulator and streaks.
- **AI advisor**: chat-style recommendations and history.
- **Workspaces and accounts**: separate personal and business ledgers.
- **Goals and health**: financial goals and a financial health summary.
- **Reminders**: recurring bills and transactions.
- **Articles and bookmarks**: money-education content.
- **Dashboard**: balances and stats.

## Tech stack

| Layer | Tools |
|---|---|
| Backend | Django 5.1, Django REST Framework, SimpleJWT, PostgreSQL |
| Frontend | React 19, Vite 6, Tailwind CSS 3, Axios, Vitest |

## Project layout

```
cashflow_backend/   Django API (accounts, transactions, capture, statements,
                    moneyscore, recommendations, articles, reminders, ...)
cashflow-frontend/  React + Vite web app
docs/               Plan and setup guides
requirements.txt    Python dependencies
```

## Getting started

### Backend

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cd cashflow_backend
# create .env with the variables below (ROUTER_API_KEY is required)
USE_SQLITE=1 python manage.py migrate   # drop USE_SQLITE to use PostgreSQL
USE_SQLITE=1 python manage.py runserver
```

The API is served under `/api/` (also `/api/v1/`).

### Frontend

```bash
cd cashflow-frontend
npm install
npm run dev        # http://localhost:5173
```

### Demo data

Fill a demo user with sample data for every feature (safe to re-run):

```bash
python manage.py seed_demo --user spideyy
```

New demo users get the password `demo12345`. Do not use this command against production.

## Environment variables

Set these in `cashflow_backend/.env`.

| Variable | Purpose | Default |
|---|---|---|
| `SECRET_KEY` | Django secret key | insecure dev key, change in production |
| `DEBUG` | `True` for development | `False` |
| `ALLOWED_HOSTS` | Extra comma-separated hosts | localhost only |
| `DATABASE_NAME` / `_USER` / `_PASSWORD` / `_HOST` / `_PORT` | PostgreSQL connection | `cashflow_db` / `postgres` / empty / `localhost` / `5432` |
| `USE_SQLITE` | Set to `1` to run on SQLite without Postgres | unset |
| `ROUTER_API_KEY` | API key for the AI advisor (**required**, the server fails to start without it) | none |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | SMTP for password reset | Gmail SMTP, port 587 |

## Tests

```bash
cd cashflow_backend && python manage.py test
cd cashflow-frontend && npm test
```

## API overview

| Prefix | Area |
|---|---|
| `/api/accounts/` | Registration, login, profile, password reset |
| `/api/transactions/` | Transactions |
| `/api/dashboard/` | Dashboard stats and balances |
| `/api/score/` | Money Score and what-if |
| `/api/capture/` | Token and SMS ingest |
| `/api/statements/` | Statement preview and import |
| `/api/recommendations/` | AI advisor and history |
| `/api/financial/` | Goals and financial health |
| `/api/reminders/` | Recurring reminders |
| `/api/articles/` | Articles and bookmarks |
| `/api/token/refresh/` | JWT refresh |

## License

No license has been chosen yet. Add one before accepting contributions.
