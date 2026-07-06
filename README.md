Simple install & run guide
===========================

This guide shows how to run the project that uses `main.py` on Windows (PowerShell).

1) Get Python
- Install Python 3.10 or newer from https://www.python.org/downloads/
- Make sure `python` works in PowerShell (type `python --version`).

2) Open PowerShell and go to the project folder

```powershell
cd "C:\Users\Abhishek\OneDrive\Documents\High money table institution"
```

3) Make and turn on a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If activation is blocked, run this first (only for this PowerShell session):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

4) Install required packages

```powershell
python -m pip install --upgrade pip
pip install fastapi uvicorn
```

5) Start the app

- Option A (recommended in development):

```powershell
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

- Option B (runs the script):

```powershell
python main.py
```

6) Quick checks
- Open the API docs: http://127.0.0.1:8000/docs
- See products: http://127.0.0.1:8000/api/products

7) Make a test order (simple example)

Create `checkout.json` with this content:

```json
{
  "items": [{ "productId": 1, "quantity": 1 }],
  "shipping": {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "address": "123 Main St",
    "city": "Cityville",
    "zipCode": "12345"
  },
  "couponCode": "SAMRUDHI15"
}
```

Send it from PowerShell:

```powershell
$body = Get-Content -Raw .\checkout.json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/api/checkout -ContentType 'application/json' -Body $body
```

You should get back JSON with `orderId` and `total`.

8) Download the invoice

Replace `RS-XXXXXX` with the `orderId` you received:

```powershell
$orderId = 'RS-XXXXXX'
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/invoice/$orderId" -OutFile "invoice_$orderId.txt"
```

Notes
- Orders are saved to `orders.json` next to `main.py`.
- If `index.html`, `style.css`, or `script.js` are missing, the web UI at `/` won't load — but the API endpoints will still work.
- If port 8000 is busy, change `--port` to another number.

If you want, I can also:
- create a `requirements.txt`, or
- add small placeholder `index.html`, `style.css`, `script.js`, or
- add a PowerShell script to automate setup and start.
