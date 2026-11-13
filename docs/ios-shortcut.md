# iOS Shortcut: automatic SMS capture

Sends each bank alert SMS to Cashflow, which turns it into a transaction.
Status: the server side is built and tested; these phone steps are **untested on a real iPhone**.
Menu names follow Apple's Shortcuts app and may differ slightly between iOS versions.

## 1. Make the server reachable from the phone (local testing)

The phone and the computer must be on the same Wi-Fi.

```bash
cd cashflow_backend
ALLOWED_HOSTS=<computer-ip> ../.venv/bin/python manage.py runserver 0.0.0.0:8000
```

Find `<computer-ip>` with `hostname -I` (for example `192.168.1.67`). On Fedora the firewall may
block the port: `sudo firewall-cmd --add-port=8000/tcp` opens it until the next reboot.

This is plain HTTP on your home network, which is fine for a test. A real deployment needs HTTPS.

## 2. Get your capture token

```bash
../.venv/bin/python manage.py drf_create_token <your-username>
```

The token only works on the ingest endpoint; it cannot read your data. To revoke it, call
`DELETE /api/capture/token/` while logged in, then create a new one.

## 3. Build the shortcut

In the Shortcuts app, create a shortcut named **Send to Cashflow** with one action:

- **Get Contents of URL**
  - URL: `http://<computer-ip>:8000/api/capture/ingest/`
  - Method: `POST`
  - Headers: `Authorization` = `Token <your-token>`
  - Request Body: `JSON`, with one field: `text` = **Shortcut Input**

## 4. Create the automation

Shortcuts > Automation > New Automation > **Message**.

- **Message Contains:** `NPR` (one phrase only; `NPR` is assumed to appear in both debit and credit alerts)
- **Sender:** leave empty, or add your bank's sender if the app accepts it
- Choose **Run Immediately** and turn off **Notify When Run**
- Action: run **Send to Cashflow**, passing the message as input

## 5. Test

Reply to yourself, or wait for a real alert. Then check the transaction list in Cashflow.

| Server reply | Meaning |
|---|---|
| `{"status": "created", ...}` | Saved as a new transaction |
| `{"status": "duplicate"}` | Already captured; nothing saved |
| `{"status": "ignored"}` | Not a transaction alert Cashflow recognises; nothing stored |
| `401` | Wrong or revoked token |
| `400 Bad Request` (HTML page) | The computer's address is missing from `ALLOWED_HOSTS` |

## What to report back

- Does the automation run without asking for confirmation?
- Does `NPR` catch both debit and credit alerts? Paste a real credit SMS so the parser can be checked.
- Any message that came back `ignored` but was a real transaction: its wording is a new format to add.
