# Night Mess Management System — Python Backend & API

This project provides complete, production-ready Python implementations for the **Night Mess Management System**.

---

## 1. FastAPI Implementation (`main.py`)
Features Pydantic schema validation, automatic OpenAPI Swagger UI (`/docs`), Base64 QR code generation, CORS headers, and single-entry gate verification.

### Dependencies
```bash
pip install -r requirements.txt
# or
pip install fastapi "uvicorn[standard]" pydantic "qrcode[pil]" pillow
```

### Running the Server
```bash
uvicorn main:app --reload --port 8000
```
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Alternative ReDoc: `http://127.0.0.1:8000/redoc`

---

## 2. Flask Implementation (`app.py`)
Features standard microframework routing, session management, dynamic crowd wait calculation, token issuance, and kitchen counter HTML slips.

### Running the Server
```bash
pip install flask "qrcode[pil]" pillow
python app.py
```
- Base URL: `http://127.0.0.1:5000`

---

## 3. Zero-Dependency Server (`standalone_server.py`)
Uses standard library modules (`http.server`, `urllib`, `json`, `uuid`). Runs immediately with **no pip installations required**.

### Running the Server
```bash
python3 standalone_server.py
```
- Base URL: `http://127.0.0.1:8080`

---

## API Reference

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/meals` | Returns list of dinner menu meals and prices |
| `POST` | `/api/meals` | Add a new meal to the dinner menu |
| `GET` | `/api/crowd` | Live dining hall crowd count, capacity ratio, & wait times |
| `POST` | `/api/crowd/exit` | Record student exiting the dining hall |
| `POST` | `/create-order` | Places order, calculates total, generates secure QR token |
| `POST` | `/api/validate-token` | Gate QR scanner: verifies pass & enforces single-entry rule |
| `GET` | `/order/{order_id}` | Kitchen / Vendor serving slip (HTML view) |
