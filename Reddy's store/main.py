from fastapi import FastAPI, HTTPException, Response, Query
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
import os
import json
import uuid
import datetime
import io

app = FastAPI(title="Samrudhi Store E-Commerce Platform API")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ORDERS_FILE = os.path.join(BASE_DIR, "orders.json")

class CartItem(BaseModel):
    productId: int
    quantity: int

class ShippingDetails(BaseModel):
    fullName: str
    email: EmailStr
    address: str
    city: str
    zipCode: str

class CheckoutRequest(BaseModel):
    items: List[CartItem]
    shipping: ShippingDetails
    couponCode: Optional[str] = None

PRODUCTS = [
    {
        "id": 1,
        "name": "AeroBook Pro 16",
        "description": "Ultra-thin aluminum chassis featuring an M3-class processor, 16GB unified memory, and a brilliant 120Hz Liquid Retina display. Ideal for high-end professional compilation and content creation.",
        "price": 1499.99,
        "rating": 4.9,
        "reviews": 124,
        "category": "Laptops",
        "image": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80",
        "badge": "Hot",
        "specs": ["16\" Liquid Retina", "16GB RAM", "512GB SSD", "M3 chip"]
    },
    {
        "id": 2,
        "name": "NovaPhone 13 Ultra",
        "description": "Redefining photography with a 200MP quad-sensor, Snapdragon 8 Gen 4 processor, and massive 5000mAh battery with 120W wireless hyper-charging.",
        "price": 1099.99,
        "rating": 4.8,
        "reviews": 312,
        "category": "Phones",
        "image": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=400&q=80",
        "badge": "Premium",
        "specs": ["6.8\" AMOLED 144Hz", "200MP Quad Camera", "12GB RAM", "5G Support"]
    },
    {
        "id": 3,
        "name": "SoundZen Wireless ANC",
        "description": "Lose yourself in high-fidelity acoustics. Hybrid active noise-cancellation (ANC), custom-engineered 40mm titanium drivers, and an industry-leading 45 hours of playback.",
        "price": 299.99,
        "rating": 4.7,
        "reviews": 88,
        "category": "Audio",
        "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
        "badge": "Top Seller",
        "specs": ["Hybrid ANC", "Hi-Res Audio", "45hr Battery", "Bluetooth 5.3"]
    },
    {
        "id": 4,
        "name": "Chronos SmartWatch 4",
        "description": "Elegant circular design paired with advanced health monitoring sensors, ECG tracing, sleep scoring, dynamic GPS tracks, and custom offline voice assistant.",
        "price": 349.99,
        "rating": 4.6,
        "reviews": 215,
        "category": "Wearables",
        "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
        "badge": "New",
        "specs": ["AMOLED Display", "ECG & Heart Monitor", "GPS Track", "Waterproof 50m"]
    },
    {
        "id": 5,
        "name": "Apex Gaming Rig X",
        "description": "Maximized frame rates. Equipped with RTX 4080 Mobile graphics, AMD Ryzen 9 7945HX processor, 32GB DDR5 RAM, and liquid cooling vents.",
        "price": 2499.99,
        "rating": 4.9,
        "reviews": 67,
        "category": "Laptops",
        "image": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=400&q=80",
        "badge": "Extreme",
        "specs": ["RTX 4080 GPU", "Ryzen 9 CPU", "32GB DDR5", "240Hz screen"]
    },
    {
        "id": 6,
        "name": "NovaPad Pro 12",
        "description": "Unlock workstation mobility. Features a sleek 12.4-inch display, active stylus compatibility, and powerful multi-tasking desktop engine.",
        "price": 699.99,
        "rating": 4.7,
        "reviews": 142,
        "category": "Phones",
        "image": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80",
        "badge": "Work",
        "specs": ["12.4\" Display", "Stylus Included", "8GB RAM", "128GB Storage"]
    },
    {
        "id": 7,
        "name": "SoundZen Studio Buds",
        "description": "Microscopic dimensions, monumental sound. Custom micro-drivers, smart tap-touch controls, sweat-proof design, and compact charging case.",
        "price": 149.99,
        "rating": 4.5,
        "reviews": 96,
        "category": "Audio",
        "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80",
        "badge": "Compact",
        "specs": ["True Wireless", "Sweat-proof IPX4", "24hr total charge", "Touch Controls"]
    },
    {
        "id": 8,
        "name": "Chronos Active Band",
        "description": "Ultra-lightweight fitness tracker. Features automated workout logging, heart-rate tracking, step metrics, and incredible 14-day battery life.",
        "price": 89.99,
        "rating": 4.4,
        "reviews": 189,
        "category": "Wearables",
        "image": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&w=400&q=80",
        "badge": "Sale",
        "specs": ["1.4\" AMOLED", "14-day Battery", "10 Sports modes", "Lightweight"]
    },
    {
        "id": 9,
        "name": "VoltCharge Dual Pad",
        "description": "Sleek glassmorphic desktop pad designed to rapidly power up two Qi-compatible devices concurrently at 15W speed.",
        "price": 49.99,
        "rating": 4.3,
        "reviews": 54,
        "category": "Accessories",
        "image": "https://images.unsplash.com/photo-1622445262465-2481c4574875?auto=format&fit=crop&w=400&q=80",
        "badge": "Convenient",
        "specs": ["15W Fast Wireless", "Dual QI Pad", "USB-C Powered", "Anti-slip glass"]
    },
    {
        "id": 10,
        "name": "AeroHub 8-in-1 Type-C",
        "description": "Premium aluminum hub expanding a single Type-C port into a full workstation including 4K HDMI, Gigabit Ethernet, SD card, and 100W power delivery.",
        "price": 79.99,
        "rating": 4.5,
        "reviews": 76,
        "category": "Accessories",
        "image": "https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&w=400&q=80",
        "badge": "Essential",
        "specs": ["4K HDMI", "Gigabit Ethernet", "100W PD Pass-thru", "3x USB 3.0"]
    }
]

def load_orders() -> List[Dict[str, Any]]:
    if not os.path.exists(ORDERS_FILE):
        return []
    try:
        with open(ORDERS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_orders(orders: List[Dict[str, Any]]):
    try:
        with open(ORDERS_FILE, "w") as f:
            json.dump(orders, f, indent=4)
    except Exception as e:
        print(f"Error saving orders file: {e}")

@app.get("/")
def get_home():
    return FileResponse(os.path.join(BASE_DIR, "index.html"))

@app.get("/style.css")
def get_style():
    return FileResponse(os.path.join(BASE_DIR, "style.css"))

@app.get("/script.js")
def get_script():
    return FileResponse(os.path.join(BASE_DIR, "script.js"))

@app.get("/api/products")
def get_products():
    return PRODUCTS

@app.get("/api/products/search")
def search_products(
    q: Optional[str] = Query(None),
    category: Optional[str] = Query("All"),
    min_price: float = Query(0.0),
    max_price: float = Query(9999.0),
    sort: Optional[str] = Query(None)
):
    results = PRODUCTS.copy()

    if q:
        q_lower = q.lower()
        results = [
            p for p in results
            if q_lower in p["name"].lower() or q_lower in p["description"].lower()
        ]

    if category and category != "All":
        results = [p for p in results if p["category"].lower() == category.lower()]

    results = [p for p in results if min_price <= p["price"] <= max_price]

    if sort == "price_asc":
        results.sort(key=lambda x: x["price"])
    elif sort == "price_desc":
        results.sort(key=lambda x: x["price"], reverse=True)
    elif sort == "rating_desc":
        results.sort(key=lambda x: x["rating"], reverse=True)

    return results

@app.post("/api/checkout")
def checkout(req: CheckoutRequest):
    if not req.items:
        raise HTTPException(status_code=400, detail="Shopping cart is empty.")

    subtotal = 0.0
    order_items = []
    product_map = {p["id"]: p for p in PRODUCTS}

    for item in req.items:
        if item.productId not in product_map:
            raise HTTPException(status_code=404, detail=f"Product ID {item.productId} not found.")
        prod = product_map[item.productId]
        item_total = prod["price"] * item.quantity
        subtotal += item_total
        order_items.append({
            "productId": prod["id"],
            "name": prod["name"],
            "price": prod["price"],
            "quantity": item.quantity,
            "total": item_total
        })

    discount = 0.0
    coupon_applied = ""
    shipping_fee = 15.0 if subtotal < 150.0 else 0.0

    if req.couponCode:
        code = req.couponCode.strip().upper()
        if code == "SAMRUDHI15":
            discount = subtotal * 0.15
            coupon_applied = "SAMRUDHI15 (-15%)"
        elif code == "FREESHIP":
            shipping_fee = 0.0
            coupon_applied = "FREESHIP (Free Shipping)"
        elif code == "COLLEGE20":
            discount = subtotal * 0.20
            coupon_applied = "COLLEGE20 (-20% College Discount)"

    taxable_amount = max(0.0, subtotal - discount)
    tax = taxable_amount * 0.08
    total = taxable_amount + shipping_fee + tax

    order_id = f"RS-{uuid.uuid4().hex[:6].upper()}"

    order = {
        "orderId": order_id,
        "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "customer": req.shipping.fullName,
        "email": req.shipping.email,
        "shipping": req.shipping.dict(),
        "items": order_items,
        "subtotal": round(subtotal, 2),
        "discount": round(discount, 2),
        "couponApplied": coupon_applied,
        "shippingFee": round(shipping_fee, 2),
        "tax": round(tax, 2),
        "total": round(total, 2),
        "deliveryDate": (datetime.datetime.now() + datetime.timedelta(days=3)).strftime("%Y-%m-%d")
    }

    orders = load_orders()
    orders.append(order)
    save_orders(orders)

    return {
        "status": "success",
        "orderId": order_id,
        "subtotal": order["subtotal"],
        "discount": order["discount"],
        "couponApplied": order["couponApplied"],
        "shippingFee": order["shippingFee"],
        "tax": order["tax"],
        "total": order["total"],
        "message": "Checkout completed! Your order is being processed."
    }

@app.get("/api/orders")
def get_orders():
    return load_orders()

@app.get("/api/invoice/{order_id}")
def get_invoice(order_id: str):
    orders = load_orders()
    target_order = None
    for o in orders:
        if o["orderId"] == order_id:
            target_order = o
            break

    if not target_order:
        raise HTTPException(status_code=404, detail="Order invoice not found.")

    invoice_str = f"""==================================================
              SAMRUDHI STORE - TECH SHOP
             INVOICE & ORDER CONFIRMATION
==================================================
Order Reference: {target_order["orderId"]}
Date & Time:     {target_order["date"]}
Payment Status:  PAID (Simulated Gateway)
Estimated Delivery: {target_order["deliveryDate"]}
==================================================
CUSTOMER DETAILS
--------------------------------------------------
Customer Name:    {target_order["customer"]}
Email Address:    {target_order["email"]}
Shipping Address: {target_order["shipping"]["address"]}
                  {target_order["shipping"]["city"]}, {target_order["shipping"]["zipCode"]}
==================================================
PURCHASE SUMMARY
--------------------------------------------------
"""
    for item in target_order["items"]:
        name_pad = item["name"].ljust(30)
        qty_str = f"{item['quantity']}x @ ${item['price']:.2f}"
        qty_pad = qty_str.ljust(15)
        item_total_str = f"${item['total']:.2f}"
        invoice_str += f"{name_pad}{qty_pad}{item_total_str.rjust(5)}\n"

    invoice_str += f"""--------------------------------------------------
Subtotal:                              ${target_order["subtotal"]:.2f}
"""

    if target_order["discount"] > 0:
        invoice_str += f"Discount ({target_order['couponApplied']}):          -${target_order['discount']:.2f}\n"

    invoice_str += f"""Shipping Fee:                          ${target_order["shippingFee"]:.2f}
Tax (Estimated 8%):                    ${target_order["tax"]:.2f}
==================================================
GRAND TOTAL:                           ${target_order["total"]:.2f}
==================================================

Thank you for shopping at Samrudhi Store!
This receipt is your official order record.

For support or return queries:
Email: support@samrudhistore.com
=================================================="""\

    file_stream = io.BytesIO(invoice_str.encode("utf-8"))

    return StreamingResponse(
        file_stream,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=samrudhi_invoice_{order_id}.txt"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)