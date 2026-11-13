# Cashflow revamp plan

Written 2026-11-13. Status: agreed direction, nothing below is built unless marked "exists".

## Goal

A personal finance app for Nepal that people keep using because they never have to
type transactions in. Expandable to small businesses. Web, Android and iOS, plus an
admin panel. The experience must feel simple: automated, no setup barrier.

## How it stands out

Nepal has no bank-linking APIs, so global finance apps fall back to manual entry
here. Cashflow's edge is **zero-entry capture**, plus local fit.

- Capture from the messages and files people already receive (see "Capture").
- Categories that learn: correct once, the rule sticks.
- One number: Money Score (exists) is the home screen, with one suggested action.
- Local fit: NPR (exists), Nepal time (exists), Bikram Sambat dates, the
  Shrawan-Ashad fiscal year, Nepali language, udhaaro (lent/borrowed) ledger.

## Scope

| Area | In | Out for now |
|---|---|---|
| Personal | Accounts, captured transactions, budgets, goals, bills, Money Score, AI advisor | Investments, multi-currency, in-app payments |
| Small business | Separate workspace, udhaaro ledger, simple invoices, VAT summary, staff roles | Double-entry accounting, payroll, tax filing |
| Admin | Users, bank parser templates, category rules, AI usage and cost, content | Custom CRUD screens (use Django admin) |
| Mobile | One Expo (React Native) codebase for Android and iOS | Separate native apps |

Articles and bookmarks: proposed to leave the main navigation. Not yet decided.

## Architecture

- **Evolve, do not rewrite.** Keep Django + DRF + Postgres and the React/Vite web app.
- **One backend, three clients:** web app, mobile app, admin panel.
- **Workspaces from day one.** Every account and transaction belongs to a workspace
  (personal or business). Painful to retrofit, so it goes in first.
- **One capture pipeline.** Every capture method posts raw text or a file to the same
  ingest path, which parses, de-duplicates and saves. Adding or losing a method does
  not change the rest of the app.

## Capture

| Method | Platforms | User effort | Phase |
|---|---|---|---|
| Statement import | Both | One upload a month | Exists (`statements/`) |
| Ingest endpoint + SMS parser | Both | n/a | 1 |
| iOS Shortcut automation | iPhone | One-time setup | 1, after a real-device test |
| Weekly balance check-in | Both | One number a week | 2 |
| Share a payment screenshot | Both | Two taps | 3 |
| Share or paste SMS text | Both | Two taps | 3 |
| Home-screen quick-add widget | Both | About five seconds | 3 |
| Automatic SMS reading | Android | None | 3, only if Google approves |

Avoid: reading SMS through notification access (Play policy bans deriving SMS data
by other means), and distributing outside the Play Store.

### SMS parsing and categorising

Sample: `Dear user, Your account ##1769 is debited by NPR 1140 on 2026-11-12 14:25:44 by:FonePay:FPQR:1406231943`

This gives direction, amount, account ending, time, method (Fonepay QR) and a
reference. It gives **no merchant**, so it cannot be categorised from the text alone.

1. Save the certain facts at once; show "QR payment · NPR 1,140 · 2:25 PM", uncategorised.
2. Ask once, right away: a notification with three or four suggested categories.
3. Rank suggestions from the user's history (time of day, amount, optional location).
4. Fill in the merchant later by matching an imported statement on amount, time and reference.
5. Never block: uncategorised spending still counts; a weekly "payments to sort" screen clears the rest.

ATM withdrawals map to Cash, salary credits to Income, wallet top-ups to Transfers.
The raw SMS is shown only in the transaction's detail view.

### iOS Shortcut automation

Setup steps: [ios-shortcut.md](ios-shortcut.md).

- The user adds a ready-made shortcut (one tap), then creates the automation once,
  following an in-app walkthrough. Automations cannot be shared, only shortcuts.
- The shortcut posts the message text to the ingest endpoint with a per-user token.
- "Message Contains" takes one phrase per automation, and Sender accepts several
  senders. Use a single phrase common to debit and credit alerts (candidate: `NPR`)
  and let the server discard anything that is not a transaction. Fallback: one
  automation per keyword, with server-side de-duplication.
- Needs no mobile app, so it can ship with the web app.

### Android SMS reading

Google Play's live policy has an "SMS-based money management" exception covering
READ_SMS, RECEIVE_SMS, RECEIVE_MMS and RECEIVE_WAP_PUSH. It is a temporary exception
subject to review: Permissions Declaration Form, SMS capture promoted as a core
feature in the listing, in-app disclosure and consent, privacy policy. Do not store
or share non-financial messages; never use SMS data for ads. Filter on the phone to
known bank senders and send only the parsed transaction.

## Phases

1. **Foundation and ingest.** Workspace and account models, versioned API, commit the
   `statements` work, ingest endpoint with per-user token, SMS parser for the sample
   format, iOS Shortcut.
2. **Capture on web.** More statement formats, learning categories, recurring-payment
   detection, weekly balance check-in.
3. **Mobile MVP (Expo).** Dashboard, score, notifications, one-tap categorising,
   screenshot and SMS sharing, quick add; Android SMS reading behind the Play approval.
4. **Automation.** Suggested budgets, bill reminders, weekly digest, AI advisor
   grounded in the user's real data.
5. **Business workspace.** Udhaaro, invoices, VAT summary, roles.
6. **Admin and pricing.** Metrics panel, free personal tier, paid business tier.

## Open questions

- Does the iOS message automation run without a confirmation prompt on current iOS,
  and can an alphanumeric bank sender ID be used as a Sender? Needs a real iPhone.
- How much do SMS formats differ between Nepali banks and wallets? No public
  templates found; collect 10-15 real messages across banks, eSewa and Khalti.
- Will Google approve the SMS exception? Apply in parallel; nothing depends on it.
- Do Nepali banks send email alerts worth forwarding? Unchecked.
- Local competitors have not been researched.
- Keep or demote articles and bookmarks?

## Sources

- https://support.google.com/googleplay/android-developer/answer/10208820
- https://support.google.com/googleplay/android-developer/answer/17225965
- https://support.apple.com/guide/shortcuts/apdd711f9dff/ios
