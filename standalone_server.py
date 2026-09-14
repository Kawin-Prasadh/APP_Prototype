#!/usr/bin/env python3
"""
Night Mess Management System — Standalone Python Server (Zero Dependencies)
-------------------------------------------------------------------------
This server runs using ONLY Python's built-in standard library (no pip needed).
It provides the complete Night Mess REST API and web endpoints:
  - GET  /api/meals           -> Get dinner menu
  - POST /api/meals           -> Add new menu item
  - GET  /api/crowd           -> Live crowd and wait time metrics
  - POST /api/crowd/exit      -> Record student leaving dining hall
  - POST /create-order        -> Create order, generate QR pass and token
  - POST /api/validate-token  -> Gate QR scanner single-entry validation
  - GET  /order/<order_id>    -> Kitchen / vendor food dispensing slip

Run:
  python3 standalone_server.py
"""

import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
import uuid

PORT = 8080

MEALS = [
    {"id": 1, "name": "Chicken Biryani", "price": 80, "available": True, "icon": "🍗", "description": "Aromatic basmati rice cooked with spiced chicken."},
    {"id": 2, "name": "Veg Biryani", "price": 60, "available": True, "icon": "🥕", "description": "Fragrant saffron rice layered with garden vegetables."},
    {"id": 3, "name": "Full Meals Plate", "price": 50, "available": True, "icon": "🍛", "description": "Steamed rice, sambar, rasam, curd, crisp papad."},
    {"id": 4, "name": "Paneer Butter Masala & 3 Rotis", "price": 75, "available": True, "icon": "🫓", "description": "Cottage cheese cubes in rich makhani gravy."},
    {"id": 5, "name": "Egg Fried Rice & Schezwan Sauce", "price": 65, "available": True, "icon": "🍳", "description": "Wok-tossed rice with scrambled eggs and spices."},
    {"id": 6, "name": "Chapati & Dal Tadka (3 pcs)", "price": 45, "available": True, "icon": "🍲", "description": "Whole wheat chapatis served with aromatic dal."},
]

CROWD = {
    "current_count": 38,
    "capacity": 100,
    "tokens_today": 14,
}

ORDERS = {
    "8F2D9A7C": {
        "order_id": "8F2D9A7C",
        "token": "NM-8F2D9A7C",
        "student_id": "STU1023",
        "student_name": "Aditya Sharma",
        "items": [
            {"id": 1, "name": "Chicken Biryani", "price": 80, "quantity": 1},
            {"id": 3, "name": "Full Meals Plate", "price": 50, "quantity": 1},
        ],
        "total_amount": 130,
        "dinner_date": datetime.now().strftime("%Y-%m-%d"),
        "created_at": datetime.utcnow().isoformat(),
        "status": "paid",
        "verified_at": None,
    }
}


def get_crowd_metrics():
    count = CROWD["current_count"]
    cap = CROWD["capacity"]
    ratio = count / cap
    if ratio >= 0.85:
        level, wait = "Peak Rush", round(15 + (ratio - 0.85) * 40)
    elif ratio >= 0.6:
        level, wait = "Moderate Wait", round(7 + (ratio - 0.6) * 25)
    elif ratio >= 0.35:
        level, wait = "Normal Flow", round(3 + (ratio - 0.35) * 15)
    else:
        level, wait = "Comfortable", 2

    return {
        "currentCount": count,
        "capacity": cap,
        "tokensToday": CROWD["tokens_today"],
        "statusLevel": level,
        "waitTimeMinutes": max(1, wait),
        "percentage": min(100, round(ratio * 100)),
    }


class NightMessHandler(BaseHTTPRequestHandler):
    def send_json(self, data, status_code=200):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def send_html(self, html_str, status_code=200):
        body = html_str.encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path.rstrip("/")

        if path == "" or path == "/":
            self.send_json({
                "message": "Night Mess Management System Python Server (Standard Library)",
                "status": "online",
                "endpoints": [
                    "/api/meals",
                    "/api/crowd",
                    "POST /create-order",
                    "POST /api/validate-token",
                    "/order/<order_id>",
                ]
            })
        elif path == "/api/meals":
            self.send_json({"success": True, "meals": MEALS})
        elif path == "/api/crowd":
            self.send_json({"success": True, "crowd": get_crowd_metrics()})
        elif path == "/api/orders":
            self.send_json({"success": True, "orders": list(ORDERS.values())})
        elif path.startswith("/order/"):
            order_id = path.replace("/order/", "").upper()
            order = ORDERS.get(order_id)
            if not order:
                order = next((o for o in ORDERS.values() if o["token"].upper() == order_id), None)

            if not order:
                self.send_html("<h2>❌ Order not found</h2>", 404)
                return

            items_list = "".join(
                f"<li style='display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;'>"
                f"<span><b>{it['name']}</b></span>"
                f"<span style='background:#17253a;color:#fff;padding:2px 8px;border-radius:4px;'>× {it['quantity']}</span>"
                f"</li>"
                for it in order["items"]
            )
            html = f"""<!doctype html><html><body style="font-family:sans-serif;padding:30px;background:#fffaf0;display:flex;justify-content:center;">
            <div style="background:white;padding:24px;border-radius:16px;box-shadow:0 8px 30px rgba(0,0,0,0.08);max-width:400px;width:100%;">
                <h2 style="color:#13736d;margin-top:0;">🍽️ KITCHEN VENDOR SLIP</h2>
                <p><b>Student:</b> {order['student_name']} ({order['student_id']})</p>
                <p><b>Token:</b> <span style="color:#ff7759;font-weight:bold;">{order['token']}</span></p>
                <p><b>Status:</b> <span style="color:#087444;font-weight:bold;">{order['status'].upper()}</span></p>
                <hr style="border:none;border-top:1px dashed #ddd;margin:16px 0;">
                <ul style="list-style:none;padding:0;">{items_list}</ul>
                <div style="display:flex;justify-content:space-between;margin-top:16px;">
                    <span>Total: <b>₹{order['total_amount']}</b></span>
                    <span>Date: {order['dinner_date']}</span>
                </div>
            </div></body></html>"""
            self.send_html(html)
        else:
            self.send_json({"error": "Endpoint not found"}, 404)

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        path = url.path.rstrip("/")
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"

        try:
            payload = json.loads(body) if body else {}
        except json.JSONDecodeError:
            self.send_json({"success": False, "error": "Invalid JSON"}, 400)
            return

        if path in ("/create-order", "/api/orders"):
            items = payload.get("items", [])
            if not items:
                self.send_json({"success": False, "error": "Items cannot be empty"}, 400)
                return

            order_id = str(uuid.uuid4()).replace("-", "")[:8].upper()
            token = f"NM-{order_id}"
            total = sum(float(it.get("price", 0)) * int(it.get("quantity", 1)) for it in items)

            order = {
                "order_id": order_id,
                "token": token,
                "student_id": payload.get("student_id", "STU1023"),
                "student_name": payload.get("student_name", "Aditya Sharma"),
                "items": items,
                "total_amount": round(total, 2),
                "dinner_date": payload.get("dinner_date", datetime.now().strftime("%Y-%m-%d")),
                "created_at": datetime.utcnow().isoformat(),
                "status": "paid",
                "verified_at": None,
            }
            ORDERS[order_id] = order
            CROWD["tokens_today"] += 1

            # Standard web QR image generator fallback
            qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=180x180&data={token}"

            self.send_json({
                "success": True,
                "order": order,
                "token": token,
                "qr_url": qr_url,
                "vendor_slip_url": f"/order/{order_id}",
            })

        elif path == "/api/validate-token":
            raw_token = str(payload.get("token", "")).strip().upper()
            order_key = raw_token.replace("NM-", "")
            order = ORDERS.get(order_key)
            if not order:
                order = next((o for o in ORDERS.values() if o["token"].upper() == raw_token), None)

            if not order:
                self.send_json({"success": False, "status": "not_found", "message": f'Token "{raw_token}" not found.'}, 404)
                return

            if order["status"] == "verified":
                self.send_json({
                    "success": False,
                    "status": "rejected",
                    "message": f"ALREADY USED: Entry was granted at {order.get('verified_at')}.",
                    "order": order
                }, 403)
                return

            order["status"] = "verified"
            order["verified_at"] = datetime.now().strftime("%I:%M %p")
            CROWD["current_count"] = min(CROWD["capacity"], CROWD["current_count"] + 1)

            self.send_json({
                "success": True,
                "status": "approved",
                "message": f"ENTRY GRANTED: {order['student_name']} ({order['student_id']}) cleared!",
                "order": order,
                "crowd": get_crowd_metrics(),
            })

        elif path == "/api/crowd/exit":
            CROWD["current_count"] = max(0, CROWD["current_count"] - 1)
            self.send_json({"success": True, "crowd": get_crowd_metrics()})

        elif path == "/api/meals":
            name = payload.get("name")
            price = float(payload.get("price", 0))
            if not name or price <= 0:
                self.send_json({"success": False, "error": "Valid name and price required"}, 400)
                return
            new_meal = {
                "id": int(datetime.utcnow().timestamp()),
                "name": name,
                "price": price,
                "available": True,
                "icon": payload.get("icon", "🍲"),
                "description": payload.get("description", "Fresh dining item"),
            }
            MEALS.insert(0, new_meal)
            self.send_json({"success": True, "meal": new_meal})
        else:
            self.send_json({"error": "Unknown POST route"}, 404)


if __name__ == "__main__":
    print(f"🚀 Night Mess Python Server starting on port {PORT}...")
    server = HTTPServer(("0.0.0.0", PORT), NightMessHandler)
    print(f"👉 API Ready: http://localhost:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        server.server_close()
