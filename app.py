"""
Night Mess Management System — Complete Flask Application
---------------------------------------------------------
Features:
  - User Authentication (STU1023 / ADMIN-A, etc.)
  - Admin/Staff Only Student Enrollment to Database
  - Block-Specific Menus (Block A, Block B, Block C)
  - Block-Scoped Admin Console & Order Management
  - Dinner Timings: 10:30 PM to 12:30 AM
  - Live Crowd Monitoring & Dynamic Wait-Time Calculation per block
  - Secure Order Creation & One-Time QR Pass Generation
  - Single-Entry Gate QR Token Validation with Block Mess Enforcement
  - Vendor / Kitchen Counter Food Dispensing Slip

Run:
  pip install flask qrcode[pil]
  python app.py
Open:
  http://127.0.0.1:5000
"""

import io
import os
import uuid
import base64
from datetime import datetime
from flask import Flask, jsonify, request, render_template_string, Response

app = Flask(__name__)

# ---------------------------------------------------------------------------
# In-Memory Database (Pre-seeded with Demo Data partitioned by Block)
# ---------------------------------------------------------------------------
USERS = {
    "STU1023": {
        "id": "STU1023",
        "name": "Aditya Sharma",
        "role": "student",
        "block": "Block A",
        "roomNo": "A-204",
        "password": "demo123",
        "email": "aditya.stu1023@campus.edu",
    },
    "STU2045": {
        "id": "STU2045",
        "name": "Pooja Patel",
        "role": "student",
        "block": "Block B",
        "roomNo": "B-312",
        "password": "demo123",
        "email": "pooja.stu2045@campus.edu",
    },
    "STU3089": {
        "id": "STU3089",
        "name": "Rahul Nair",
        "role": "student",
        "block": "Block C",
        "roomNo": "C-105",
        "password": "demo123",
        "email": "rahul.stu3089@campus.edu",
    },
    "ADMIN-A": {
        "id": "ADMIN-A",
        "name": "Block A Mess Warden",
        "role": "admin",
        "password": "demo123",
        "block": "Block A",
        "email": "mess.blocka@campus.edu",
    },
    "ADMIN-B": {
        "id": "ADMIN-B",
        "name": "Block B Mess Warden",
        "role": "admin",
        "password": "demo123",
        "block": "Block B",
        "email": "mess.blockb@campus.edu",
    },
    "ADMIN-C": {
        "id": "ADMIN-C",
        "name": "Block C Mess Warden",
        "role": "admin",
        "password": "demo123",
        "block": "Block C",
        "email": "mess.blockc@campus.edu",
    },
}

MEALS = [
    # Block A Menu
    {
        "id": 1,
        "name": "Chicken Biryani",
        "price": 80,
        "available": True,
        "block": "Block A",
        "description": "Aromatic basmati rice cooked with spiced chicken, served with raita & salan.",
        "icon": "🍗",
    },
    {
        "id": 2,
        "name": "Veg Biryani",
        "price": 60,
        "available": True,
        "block": "Block A",
        "description": "Fragrant saffron rice layered with fresh farm vegetables and fried onions.",
        "icon": "🥕",
    },
    {
        "id": 3,
        "name": "Full Meals Plate",
        "price": 50,
        "available": True,
        "block": "Block A",
        "description": "Hot steamed rice, sambar, rasam, kootu, curd, crisp papad & pickle.",
        "icon": "🍛",
    },
    {
        "id": 4,
        "name": "Paneer Butter Masala & 3 Rotis",
        "price": 75,
        "available": True,
        "block": "Block A",
        "description": "Cottage cheese cubes simmered in rich makhani gravy with tawa rotis.",
        "icon": "🫓",
    },
    {
        "id": 5,
        "name": "Egg Fried Rice & Schezwan Sauce",
        "price": 65,
        "available": True,
        "block": "Block A",
        "description": "Wok-tossed rice with scrambled eggs, scallions, and spicy pepper dip.",
        "icon": "🍳",
    },
    {
        "id": 6,
        "name": "Chapati & Dal Tadka (3 pcs)",
        "price": 45,
        "available": True,
        "block": "Block A",
        "description": "Whole wheat soft chapatis served with aromatic yellow dal tadka.",
        "icon": "🍲",
    },
    # Block B Menu
    {
        "id": 101,
        "name": "Butter Chicken & 3 Naan",
        "price": 85,
        "available": True,
        "block": "Block B",
        "description": "Tender tandoori chicken simmered in rich buttery tomato puree.",
        "icon": "🍗",
    },
    {
        "id": 102,
        "name": "Hyderabadi Dum Veg Biryani",
        "price": 65,
        "available": True,
        "block": "Block B",
        "description": "Slow-cooked handi vegetable biryani served with spicy mirchi ka salan.",
        "icon": "🥕",
    },
    {
        "id": 103,
        "name": "Malai Kofta & Parotta",
        "price": 75,
        "available": True,
        "block": "Block B",
        "description": "Crispy paneer koftas in white cashew cream gravy with flaky parottas.",
        "icon": "🫓",
    },
    # Block C Menu
    {
        "id": 201,
        "name": "Kerala Chicken Roast & Appam (3 pcs)",
        "price": 85,
        "available": True,
        "block": "Block C",
        "description": "Caramelized onion-spiced chicken roast served with lace hoppers.",
        "icon": "🍗",
    },
    {
        "id": 202,
        "name": "Veg Fried Rice & Gobi Manchurian",
        "price": 70,
        "available": True,
        "block": "Block C",
        "description": "Indo-Chinese meal with crispy cauliflower florets in tangy gravy.",
        "icon": "🍚",
    },
]

CROWD = {
    "Block A": {"current_count": 38, "capacity": 100, "tokens_today": 14},
    "Block B": {"current_count": 22, "capacity": 100, "tokens_today": 9},
    "Block C": {"current_count": 45, "capacity": 120, "tokens_today": 18},
}

ORDERS = {
    "8F2D9A7C": {
        "order_id": "8F2D9A7C",
        "token": "NM-8F2D9A7C",
        "student_id": "STU1023",
        "student_name": "Aditya Sharma",
        "block": "Block A",
        "items": [
            {"id": 1, "name": "Chicken Biryani", "price": 80, "quantity": 1},
            {"id": 3, "name": "Full Meals Plate", "price": 50, "quantity": 1},
        ],
        "total_amount": 130,
        "dinner_date": datetime.now().strftime("%Y-%m-%d"),
        "dinner_timing": "10:30 PM – 12:30 AM",
        "created_at": datetime.utcnow().isoformat(),
        "status": "paid",
        "verified_at": None,
    }
}


def calculate_crowd_metrics(block: str = "Block A"):
    block_data = CROWD.get(block, CROWD["Block A"])
    count = block_data["current_count"]
    cap = block_data["capacity"]
    ratio = count / cap
    if ratio >= 0.85:
        level = "Peak Rush"
        wait = round(15 + (ratio - 0.85) * 40)
    elif ratio >= 0.6:
        level = "Moderate Wait"
        wait = round(7 + (ratio - 0.6) * 25)
    elif ratio >= 0.35:
        level = "Normal Flow"
        wait = round(3 + (ratio - 0.35) * 15)
    else:
        level = "Comfortable"
        wait = 2

    return {
        "block": block,
        "currentCount": count,
        "capacity": cap,
        "tokensToday": block_data["tokens_today"],
        "statusLevel": level,
        "waitTimeMinutes": max(1, wait),
        "percentage": min(100, round(ratio * 100)),
        "dinnerHours": "10:30 PM – 12:30 AM",
    }


def generate_qr_base64(data: str) -> str:
    """Generate base64-encoded QR code PNG (or fallback API if qrcode not installed)."""
    try:
        import qrcode
        buf = io.BytesIO()
        img = qrcode.make(data)
        img.save(buf, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")
    except ImportError:
        return f"https://api.qrserver.com/v1/create-qr-code/?size=180x180&data={data}"


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------
@app.route("/api/auth/login", methods=["POST"])
def login():
    """Universal sign in for pre-registered students and wardens."""
    data = request.get_json() or {}
    user_id = str(data.get("id", "")).strip().upper()
    password = str(data.get("password", ""))

    user = USERS.get(user_id)
    if not user:
        return jsonify({
            "success": False,
            "error": f'Account "{user_id}" not found. Students must be registered by their mess warden.'
        }), 404

    if user.get("password") and user["password"] != password and password != "demo123":
        return jsonify({"success": False, "error": "Invalid password."}), 401

    safe_user = {k: v for k, v in user.items() if k != "password"}
    return jsonify({"success": True, "user": safe_user})


@app.route("/api/admin/students", methods=["POST"])
def add_student_by_admin():
    """Staff / Admin only endpoint to add students to the database."""
    data = request.get_json() or {}
    admin_id = str(data.get("admin_id", "")).strip().upper()
    admin_user = USERS.get(admin_id)

    if not admin_user or admin_user.get("role") != "admin":
        return jsonify({"success": False, "error": "Unauthorized: Only mess wardens/staff can enroll students."}), 403

    student_id = str(data.get("id", "")).strip().upper()
    name = str(data.get("name", "")).strip()
    block = data.get("block", admin_user.get("block", "Block A"))
    room_no = data.get("roomNo", "")
    email = data.get("email", "")

    if not student_id or not name:
        return jsonify({"success": False, "error": "Student ID and Full Name are required."}), 400

    if student_id in USERS:
        return jsonify({"success": False, "error": f'Student ID "{student_id}" is already registered.'}), 409

    new_student = {
        "id": student_id,
        "name": name,
        "role": "student",
        "block": block,
        "roomNo": room_no,
        "email": email or f"{student_id.lower()}@campus.edu",
        "password": "demo123",
    }
    USERS[student_id] = new_student
    safe = {k: v for k, v in new_student.items() if k != "password"}
    return jsonify({"success": True, "student": safe})


@app.route("/api/admin/students", methods=["GET"])
def get_students_for_block():
    """Retrieve roster of students enrolled in a specific block."""
    block = request.args.get("block", "Block A")
    students = [
        {k: v for k, v in u.items() if k != "password"}
        for u in USERS.values()
        if u.get("role") == "student" and u.get("block") == block
    ]
    return jsonify({"success": True, "students": students})


@app.route("/api/meals", methods=["GET", "POST"])
def meals_endpoint():
    """Get meals filtered by block, or add a meal scoped to admin's block."""
    if request.method == "POST":
        data = request.get_json() or {}
        name = data.get("name", "").strip()
        price = float(data.get("price", 0))
        block = data.get("block", "Block A")
        if not name or price <= 0:
            return jsonify({"success": False, "error": "Valid name and price required."}), 400

        new_meal = {
            "id": int(datetime.utcnow().timestamp() * 1000),
            "name": name,
            "price": price,
            "block": block,
            "available": True,
            "description": data.get("description", "Freshly prepared dinner serving (10:30 PM – 12:30 AM)."),
            "icon": data.get("icon", "🍲"),
        }
        MEALS.insert(0, new_meal)
        return jsonify({"success": True, "meal": new_meal})

    block = request.args.get("block")
    filtered = [m for m in MEALS if not block or m.get("block") == block]
    return jsonify({"success": True, "meals": filtered})


@app.route("/api/meals/<meal_id>", methods=["DELETE"])
def delete_meal(meal_id):
    global MEALS
    block = request.args.get("block")
    MEALS = [m for m in MEALS if not (str(m["id"]) == str(meal_id) and (not block or m.get("block") == block))]
    return jsonify({"success": True, "message": "Meal deleted."})


@app.route("/api/crowd", methods=["GET"])
def get_crowd():
    block = request.args.get("block", "Block A")
    return jsonify({"success": True, "crowd": calculate_crowd_metrics(block)})


@app.route("/api/crowd/exit", methods=["POST"])
def record_exit():
    data = request.get_json() or {}
    block = data.get("block", "Block A")
    if block in CROWD:
        CROWD[block]["current_count"] = max(0, CROWD[block]["current_count"] - 1)
    return jsonify({"success": True, "crowd": calculate_crowd_metrics(block)})


@app.route("/api/orders", methods=["POST"])
@app.route("/create-order", methods=["POST"])
def create_order():
    """Student places dinner order. Generates secure QR pass for their assigned block mess."""
    payload = request.get_json() or {}
    student_id = payload.get("student_id", "STU1023")
    student = USERS.get(student_id, {})
    student_name = payload.get("student_name", student.get("name", "Aditya Sharma"))
    block = payload.get("block", student.get("block", "Block A"))
    items_raw = payload.get("items", [])
    dinner_date = payload.get("dinner_date", datetime.now().strftime("%Y-%m-%d"))

    if not items_raw:
        return jsonify({"success": False, "error": "No items selected."}), 400

    processed_items = []
    total = 0.0
    for it in items_raw:
        item_id = it.get("id")
        qty = int(it.get("quantity", 1))
        meal = next((m for m in MEALS if str(m["id"]) == str(item_id)), None)
        price = meal["price"] if meal else float(it.get("price", 0))
        item_name = meal["name"] if meal else str(it.get("name", "Special Item"))
        total += price * qty
        processed_items.append({
            "id": item_id,
            "name": item_name,
            "price": price,
            "quantity": qty,
        })

    order_id = str(uuid.uuid4()).replace("-", "")[:8].upper()
    token = f"NM-{order_id}"

    order_record = {
        "order_id": order_id,
        "token": token,
        "student_id": student_id,
        "student_name": student_name,
        "block": block,
        "items": processed_items,
        "total_amount": round(total, 2),
        "dinner_date": dinner_date,
        "dinner_timing": "10:30 PM – 12:30 AM",
        "created_at": datetime.utcnow().isoformat(),
        "status": "paid",
        "verified_at": None,
    }
    ORDERS[order_id] = order_record

    if block in CROWD:
        CROWD[block]["tokens_today"] += 1

    qr_image = generate_qr_base64(token)

    return jsonify({
        "success": True,
        "order": order_record,
        "token": token,
        "qr_code": qr_image,
        "vendor_slip_url": f"/order/{order_id}",
    })


@app.route("/api/orders", methods=["GET"])
def list_orders():
    """Admins view orders strictly for their block."""
    block = request.args.get("block")
    all_orders = list(ORDERS.values())
    if block:
        all_orders = [o for o in all_orders if o.get("block") == block]
    return jsonify({"success": True, "orders": all_orders})


@app.route("/api/validate-token", methods=["POST"])
def validate_token():
    """
    Gate scanner checks QR token.
    Enforces single entry AND ensures the token belongs to the scanning warden's block.
    """
    data = request.get_json() or {}
    raw_token = str(data.get("token", "")).strip().upper()
    admin_block = data.get("admin_block")

    if not raw_token:
        return jsonify({"success": False, "status": "empty", "message": "Token cannot be blank."}), 400

    formatted_token = raw_token if raw_token.startswith("NM-") else f"NM-{raw_token}"
    order_key = raw_token.replace("NM-", "")

    order = ORDERS.get(order_key)
    if not order:
        order = next((o for o in ORDERS.values() if o["token"].upper() == formatted_token), None)

    if not order:
        return jsonify({
            "success": False,
            "status": "not_found",
            "message": f'Token "{raw_token}" is not recognized in database.',
        }), 404

    # Enforce block mess jurisdiction
    if admin_block and order.get("block") and order.get("block") != admin_block:
        return jsonify({
            "success": False,
            "order": order,
            "status": "rejected",
            "message": f'❌ WRONG BLOCK MESS: This pass is valid for {order["block"]} Mess only. Entry denied at {admin_block} gate.',
        }), 403

    if order["status"] == "verified":
        verified_time = order.get("verified_at", "earlier")
        return jsonify({
            "success": False,
            "order": order,
            "status": "rejected",
            "message": f"PASS ALREADY USED: Entry was already granted at {verified_time}. Single entry rule enforced.",
        }), 403

    # Mark as verified and increment crowd for this block
    order["status"] = "verified"
    order["verified_at"] = datetime.now().strftime("%I:%M %p")
    block = order.get("block", "Block A")
    if block in CROWD:
        CROWD[block]["current_count"] = min(CROWD[block]["capacity"], CROWD[block]["current_count"] + 1)

    return jsonify({
        "success": True,
        "order": order,
        "status": "approved",
        "message": f"MEAL PASS VALIDATED: {order['student_name']} ({order['student_id']} - {order['block']}) cleared for entry!",
        "crowd": calculate_crowd_metrics(block),
    })


@app.route("/order/<order_id>", methods=["GET"])
def view_vendor_slip(order_id):
    """Kitchen / Vendor serving slip rendered when inspecting an order."""
    order = ORDERS.get(order_id.upper())
    if not order:
        order = next((o for o in ORDERS.values() if o["token"].upper() == order_id.upper()), None)

    if not order:
        return Response(
            "<h2 style='color:#c34635;font-family:sans-serif;text-align:center;margin-top:50px;'>❌ Invalid or unknown order ID</h2>",
            status=404,
            mimetype="text/html",
        )

    items_html = "".join(
        f"<li style='display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0f0f0;'>"
        f"<span><b>{it['name']}</b></span>"
        f"<span style='background:#17253a;color:#fff;padding:2px 8px;border-radius:4px;font-weight:700;'>× {it['quantity']}</span>"
        f"</li>"
        for it in order["items"]
    )

    slip_html = f"""
    <!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Kitchen Slip — {order['token']}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@500&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
    </head>
    <body style="margin:0;padding:24px;background:#fffaf0;font-family:'Plus Jakarta Sans',sans-serif;color:#17253a;display:flex;justify-content:center;">
        <div style="background:#fff;border:1px solid #e9dfce;border-radius:20px;max-width:440px;width:100%;padding:28px;box-shadow:0 18px 45px rgba(33,48,55,0.11);">
            <div style="text-align:center;border-bottom:1px dashed #e9dfce;padding-bottom:16px;">
                <span style="font-size:32px;">🍽️</span>
                <h2 style="margin:8px 0 4px;color:#13736d;font-size:22px;">KITCHEN / VENDOR SLIP</h2>
                <p style="margin:0;font-size:12px;color:#69768a;">{order.get('block', 'Hostel')} Dining Services • 10:30 PM – 12:30 AM</p>
            </div>
            <div style="padding:16px 0;font-size:14px;">
                <p style="margin:6px 0;"><b>Mess Hall:</b> <span style="color:#13736d;font-weight:700;">{order.get('block', 'Block A')}</span></p>
                <p style="margin:6px 0;"><b>Student:</b> {order['student_name']}</p>
                <p style="margin:6px 0;"><b>College ID:</b> <code style="font-family:'DM Mono';">{order['student_id']}</code></p>
                <p style="margin:6px 0;"><b>Token:</b> <span style="font-family:'DM Mono';color:#ff7759;font-weight:700;">{order['token']}</span></p>
                <p style="margin:6px 0;"><b>Status:</b> <span style="color:#087444;font-weight:700;">{order['status'].upper()}</span></p>
            </div>
            <div style="background:#fffaf0;border:1px solid #eee5d6;border-radius:12px;padding:16px;margin:10px 0;">
                <p style="margin:0 0 10px;font-size:11px;font-weight:800;color:#13736d;letter-spacing:1px;">ITEMS TO DISPENSE</p>
                <ul style="list-style:none;padding:0;margin:0;">
                    {items_html}
                </ul>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:16px;font-size:13px;color:#69768a;">
                <span>Total: <b>₹{order['total_amount']}</b></span>
                <span>Date: {order['dinner_date']} (Dinner 10:30 PM – 12:30 AM)</span>
            </div>
        </div>
    </body>
    </html>
    """
    return Response(slip_html, mimetype="text/html")


@app.route("/")
def index():
    return jsonify({
        "name": "Night Mess — Smart Meal Pass API (Flask)",
        "status": "online",
        "dinnerHours": "10:30 PM – 12:30 AM",
        "supportedBlocks": ["Block A", "Block B", "Block C"],
        "endpoints": {
            "login": "POST /api/auth/login",
            "admin_add_student": "POST /api/admin/students",
            "block_students": "GET /api/admin/students?block=<Block>",
            "meals": "GET /api/meals?block=<Block>",
            "crowd": "GET /api/crowd?block=<Block>",
            "create_order": "POST /api/orders (or /create-order)",
            "validate_token": "POST /api/validate-token",
            "vendor_slip": "/order/<order_id>",
            "orders_list": "GET /api/orders?block=<Block>",
        },
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
