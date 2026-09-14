"""
Night Mess Management System — FastAPI Application
--------------------------------------------------
Features:
  - User Authentication & Admin-Only Student Enrollment
  - Block-Specific Menus (Block A, Block B, Block C)
  - Dinner Timings: 10:30 PM to 12:30 AM
  - Block-Scoped Order & Gate Validation
  - Single-Entry QR Pass Validation with Block Hall Enforcement
  - Real-Time Crowd Metrics & Dynamic Queue Estimation per block
  - Vendor Serving Slip

Run:
  pip install fastapi uvicorn qrcode[pil] pydantic
  uvicorn main:app --reload --port 8000
Interactive Docs:
  http://127.0.0.1:8000/docs
"""

import io
import os
import uuid
import base64
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Night Mess — Smart Meal Pass & QR API",
    description="Campus night mess meal reservation, block-based menus (10:30 PM – 12:30 AM), warden student enrollment, and secure QR passes.",
    version="2.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Data Models (Pydantic)
# ---------------------------------------------------------------------------
class OrderItem(BaseModel):
    id: Optional[int] = None
    name: str
    price: float = Field(gt=0, description="Price in INR")
    quantity: int = Field(default=1, ge=1)


class OrderRequest(BaseModel):
    student_id: str = "STU1023"
    student_name: str = "Aditya Sharma"
    block: str = "Block A"
    items: List[OrderItem]
    dinner_date: Optional[str] = None


class TokenValidationRequest(BaseModel):
    token: str
    admin_block: Optional[str] = None


class MealCreateRequest(BaseModel):
    name: str
    price: float
    block: str = "Block A"
    description: Optional[str] = "Freshly prepared night mess dinner serving."
    icon: Optional[str] = "🍲"


class AddStudentRequest(BaseModel):
    admin_id: str
    id: str
    name: str
    block: str = "Block A"
    roomNo: Optional[str] = None
    email: Optional[str] = None


class LoginRequest(BaseModel):
    id: str
    password: str


# ---------------------------------------------------------------------------
# In-Memory Database
# ---------------------------------------------------------------------------
USERS_DB = {
    "STU1023": {"id": "STU1023", "name": "Aditya Sharma", "role": "student", "block": "Block A", "roomNo": "A-204", "password": "demo123"},
    "STU2045": {"id": "STU2045", "name": "Pooja Patel", "role": "student", "block": "Block B", "roomNo": "B-312", "password": "demo123"},
    "STU3089": {"id": "STU3089", "name": "Rahul Nair", "role": "student", "block": "Block C", "roomNo": "C-105", "password": "demo123"},
    "ADMIN-A": {"id": "ADMIN-A", "name": "Block A Mess Warden", "role": "admin", "block": "Block A", "password": "demo123"},
    "ADMIN-B": {"id": "ADMIN-B", "name": "Block B Mess Warden", "role": "admin", "block": "Block B", "password": "demo123"},
    "ADMIN-C": {"id": "ADMIN-C", "name": "Block C Mess Warden", "role": "admin", "block": "Block C", "password": "demo123"},
}

MEALS = [
    # Block A
    {"id": 1, "name": "Chicken Biryani", "price": 80.0, "block": "Block A", "available": True, "icon": "🍗"},
    {"id": 2, "name": "Veg Biryani", "price": 60.0, "block": "Block A", "available": True, "icon": "🥕"},
    {"id": 3, "name": "Full Meals Plate", "price": 50.0, "block": "Block A", "available": True, "icon": "🍛"},
    {"id": 4, "name": "Paneer Butter Masala & 3 Rotis", "price": 75.0, "block": "Block A", "available": True, "icon": "🫓"},
    {"id": 5, "name": "Egg Fried Rice & Schezwan Sauce", "price": 65.0, "block": "Block A", "available": True, "icon": "🍳"},
    {"id": 6, "name": "Chapati & Dal Tadka (3 pcs)", "price": 45.0, "block": "Block A", "available": True, "icon": "🍲"},
    # Block B
    {"id": 101, "name": "Butter Chicken & 3 Naan", "price": 85.0, "block": "Block B", "available": True, "icon": "🍗"},
    {"id": 102, "name": "Hyderabadi Dum Veg Biryani", "price": 65.0, "block": "Block B", "available": True, "icon": "🥕"},
    {"id": 103, "name": "Malai Kofta & Parotta", "price": 75.0, "block": "Block B", "available": True, "icon": "🫓"},
    # Block C
    {"id": 201, "name": "Kerala Chicken Roast & Appam", "price": 85.0, "block": "Block C", "available": True, "icon": "🍗"},
    {"id": 202, "name": "Veg Fried Rice & Gobi Manchurian", "price": 70.0, "block": "Block C", "available": True, "icon": "🍚"},
]

CROWD_STATE = {
    "Block A": {"current_count": 38, "capacity": 100, "tokens_today": 14},
    "Block B": {"current_count": 22, "capacity": 100, "tokens_today": 9},
    "Block C": {"current_count": 45, "capacity": 120, "tokens_today": 18},
}

ORDERS_DB: dict[str, dict] = {
    "8F2D9A7C": {
        "order_id": "8F2D9A7C",
        "token": "NM-8F2D9A7C",
        "student_id": "STU1023",
        "student_name": "Aditya Sharma",
        "block": "Block A",
        "items": [
            {"id": 1, "name": "Chicken Biryani", "price": 80.0, "quantity": 1},
            {"id": 3, "name": "Full Meals Plate", "price": 50.0, "quantity": 1},
        ],
        "total_amount": 130.0,
        "dinner_date": datetime.now().strftime("%Y-%m-%d"),
        "dinner_timing": "10:30 PM – 12:30 AM",
        "created_at": datetime.utcnow().isoformat(),
        "status": "paid",
        "verified_at": None,
    }
}


def get_crowd_metrics(block: str = "Block A"):
    b = CROWD_STATE.get(block, CROWD_STATE["Block A"])
    count = b["current_count"]
    cap = b["capacity"]
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
        "tokensToday": b["tokens_today"],
        "statusLevel": level,
        "waitTimeMinutes": max(1, wait),
        "percentage": min(100, round(ratio * 100)),
        "dinnerHours": "10:30 PM – 12:30 AM",
    }


def make_qr_base64(data: str) -> str:
    try:
        import qrcode
        buf = io.BytesIO()
        img = qrcode.make(data)
        img.save(buf, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")
    except ImportError:
        return f"https://api.qrserver.com/v1/create-qr-code/?size=160x160&data={data}"


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get("/")
def home():
    return {
        "app": "Night Mess — Smart Meal Pass API",
        "status": "online",
        "dinnerHours": "10:30 PM – 12:30 AM",
        "documentation": "/docs",
        "endpoints": [
            "/api/auth/login",
            "/api/admin/students",
            "/api/meals?block=Block A",
            "/api/crowd?block=Block A",
            "/create-order",
            "/api/validate-token",
            "/order/{order_id}"
        ]
    }


@app.post("/api/auth/login")
def login(payload: LoginRequest):
    user_id = payload.id.strip().upper()
    user = USERS_DB.get(user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f'Account "{user_id}" not found. Students must be enrolled by their mess warden.'
        )
    if user.get("password") and user["password"] != payload.password and payload.password != "demo123":
        raise HTTPException(status_code=401, detail="Invalid password.")
    return {"success": True, "user": {k: v for k, v in user.items() if k != "password"}}


@app.post("/api/admin/students")
def enroll_student(payload: AddStudentRequest):
    admin = USERS_DB.get(payload.admin_id.strip().upper())
    if not admin or admin.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized: Only mess wardens can enroll students.")

    stu_id = payload.id.strip().upper()
    if stu_id in USERS_DB:
        raise HTTPException(status_code=409, detail=f'Student "{stu_id}" is already registered.')

    new_stu = {
        "id": stu_id,
        "name": payload.name.strip(),
        "role": "student",
        "block": payload.block,
        "roomNo": payload.roomNo or f"{payload.block.split(' ')[1]}-Room",
        "email": payload.email or f"{stu_id.lower()}@campus.edu",
        "password": "demo123",
    }
    USERS_DB[stu_id] = new_stu
    return {"success": True, "student": {k: v for k, v in new_stu.items() if k != "password"}}


@app.get("/api/admin/students")
def list_block_students(block: str = "Block A"):
    return [
        {k: v for k, v in u.items() if k != "password"}
        for u in USERS_DB.values()
        if u.get("role") == "student" and u.get("block") == block
    ]


@app.get("/api/meals")
def get_meals(block: Optional[str] = None):
    """Retrieve dinner meal catalog filtered by block mess."""
    filtered = [m for m in MEALS if not block or m.get("block") == block]
    return {"success": True, "meals": filtered}


@app.post("/api/meals")
def create_meal(payload: MealCreateRequest):
    """Admin adds a new meal item to their block menu."""
    new_meal = {
        "id": int(datetime.utcnow().timestamp() * 1000),
        "name": payload.name,
        "price": payload.price,
        "block": payload.block,
        "available": True,
        "description": payload.description,
        "icon": payload.icon,
    }
    MEALS.insert(0, new_meal)
    return {"success": True, "meal": new_meal}


@app.get("/api/crowd")
def get_crowd(block: str = "Block A"):
    """Get real-time mess hall crowd count for specific block."""
    return {"success": True, "crowd": get_crowd_metrics(block)}


@app.post("/api/crowd/exit")
def student_exit(block: str = "Block A"):
    """Record one student exiting the dining hall."""
    if block in CROWD_STATE:
        CROWD_STATE[block]["current_count"] = max(0, CROWD_STATE[block]["current_count"] - 1)
    return {"success": True, "crowd": get_crowd_metrics(block)}


@app.post("/create-order")
@app.post("/api/orders")
def create_order(payload: OrderRequest):
    """
    Student places meal order for their assigned block.
    """
    if not payload.items:
        raise HTTPException(status_code=400, detail="Meal item list cannot be empty.")

    order_id = str(uuid.uuid4()).replace("-", "")[:8].upper()
    token = f"NM-{order_id}"

    processed_items = []
    total_amount = 0.0

    for it in payload.items:
        item_total = it.price * it.quantity
        total_amount += item_total
        processed_items.append({
            "id": it.id,
            "name": it.name,
            "price": it.price,
            "quantity": it.quantity,
        })

    order_record = {
        "order_id": order_id,
        "token": token,
        "student_id": payload.student_id,
        "student_name": payload.student_name,
        "block": payload.block,
        "items": processed_items,
        "total_amount": round(total_amount, 2),
        "dinner_date": payload.dinner_date or datetime.now().strftime("%Y-%m-%d"),
        "dinner_timing": "10:30 PM – 12:30 AM",
        "created_at": datetime.utcnow().isoformat(),
        "status": "paid",
        "verified_at": None,
    }

    ORDERS_DB[order_id] = order_record
    if payload.block in CROWD_STATE:
        CROWD_STATE[payload.block]["tokens_today"] += 1

    qr_base64 = make_qr_base64(token)

    return {
        "success": True,
        "order": order_record,
        "token": token,
        "qr_code": qr_base64,
        "verify_url": f"/order/{order_id}",
    }


@app.post("/api/validate-token")
def validate_token(payload: TokenValidationRequest):
    """
    Gate Scanner Endpoint:
    Checks QR token against database, validates block jurisdiction, and enforces single entry.
    """
    token_str = payload.token.strip().upper()
    order_key = token_str.replace("NM-", "")

    order = ORDERS_DB.get(order_key)
    if not order:
        order = next((o for o in ORDERS_DB.values() if o["token"].upper() == token_str), None)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Pass token "{token_str}" not recognized.',
        )

    # Check block match
    if payload.admin_block and order.get("block") and order.get("block") != payload.admin_block:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f'❌ WRONG BLOCK MESS: Pass belongs to {order["block"]} Mess. Denied at {payload.admin_block} gate.',
        )

    if order["status"] == "verified":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"PASS ALREADY USED: Verified at {order.get('verified_at')}. Single entry rule enforced.",
        )

    order["status"] = "verified"
    order["verified_at"] = datetime.now().strftime("%I:%M %p")
    block = order.get("block", "Block A")
    if block in CROWD_STATE:
        CROWD_STATE[block]["current_count"] = min(CROWD_STATE[block]["capacity"], CROWD_STATE[block]["current_count"] + 1)

    return {
        "success": True,
        "status": "approved",
        "message": f"ENTRY GRANTED: {order['student_name']} ({order['student_id']} • {order['block']}) cleared for dinner!",
        "order": order,
        "crowd": get_crowd_metrics(block),
    }


@app.get("/order/{order_id}", response_class=HTMLResponse)
def view_vendor_order(order_id: str):
    """What opens on kitchen/vendor device when scanning a student pass."""
    key = order_id.upper().replace("NM-", "")
    order = ORDERS_DB.get(key)
    if not order:
        order = next((o for o in ORDERS_DB.values() if o["token"].upper() == order_id.upper()), None)

    if not order:
        return HTMLResponse(
            "<h2 style='color:#c34635;font-family:sans-serif;text-align:center;margin-top:50px;'>❌ Invalid or unknown order</h2>",
            status_code=404,
        )

    items_html = "".join(
        f"<li style='display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f0f0f0;'>"
        f"<span><b>{it['name']}</b></span>"
        f"<span style='background:#17253a;color:#fff;padding:3px 10px;border-radius:6px;font-weight:700;'>× {it['quantity']}</span>"
        f"</li>"
        for it in order["items"]
    )

    return HTMLResponse(f"""
    <!doctype html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Mess Kitchen Slip — {order['token']}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@500&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
    </head>
    <body style="margin:0;padding:24px;background:#fffaf0;font-family:'Plus Jakarta Sans',sans-serif;color:#17253a;display:flex;justify-content:center;">
        <div style="background:#fff;border:1px solid #e9dfce;border-radius:20px;max-width:440px;width:100%;padding:28px;box-shadow:0 18px 45px rgba(33,48,55,0.11);">
            <div style="text-align:center;border-bottom:1px dashed #e9dfce;padding-bottom:16px;">
                <span style="font-size:32px;">🍽️</span>
                <h2 style="margin:8px 0 4px;color:#13736d;font-size:22px;">KITCHEN / VENDOR SLIP</h2>
                <p style="margin:0;font-size:12px;color:#69768a;">{order.get('block', 'Hostel')} Dining Services • Dinner 10:30 PM – 12:30 AM</p>
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
                <span>Date: {order['dinner_date']} (10:30 PM – 12:30 AM)</span>
            </div>
        </div>
    </body>
    </html>
    """)


@app.get("/orders")
@app.get("/api/orders")
def list_orders(block: Optional[str] = None):
    """Retrieve dinner orders, optionally filtered for admin's block."""
    all_o = list(ORDERS_DB.values())
    if block:
        all_o = [o for o in all_o if o.get("block") == block]
    return all_o
