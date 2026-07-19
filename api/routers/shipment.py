from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Form, HTTPException, status, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from api.tags import APITag
from app.database.models import TagName
from jinja2 import Template

TRACK_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Track Shipment #{{ id.hex[-10:] }} | FastShip</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #f8fafc;
            --card-bg: #ffffff;
            --card-border: #e2e8f0;
            --text-primary: #0f172a;
            --text-secondary: #64748b;
            --primary: #4f46e5;
            --primary-glow: rgba(79, 70, 229, 0.1);
            --success: #16a34a;
            --success-glow: rgba(22, 163, 74, 0.1);
            --accent: #0284c7;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg-color);
            background-image: 
                radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.05) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(2, 132, 199, 0.05) 0px, transparent 50%);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
        }

        .container {
            width: 100%;
            max-width: 720px;
            background-color: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 24px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
            padding: 2.5rem;
            position: relative;
            overflow: hidden;
        }

        header {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 2rem;
            text-align: center;
        }

        .logo {
            font-size: 1.75rem;
            font-weight: 700;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.025em;
        }

        .subtitle {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }

        /* 4-Step Stepper */
        .stepper-wrapper {
            margin: 2rem 0;
            position: relative;
        }

        .stepper {
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            z-index: 2;
        }

        .stepper-progress {
            position: absolute;
            top: 20px;
            left: 10%;
            right: 10%;
            height: 4px;
            background: #e2e8f0;
            z-index: 1;
            border-radius: 4px;
        }

        .stepper-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #4f46e5, #16a34a);
            width: 0%;
            transition: width 0.4s ease;
            border-radius: 4px;
        }

        .step-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
        }

        .step-icon {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: #f1f5f9;
            border: 2px solid #cbd5e1;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            color: #64748b;
            transition: all 0.3s ease;
        }

        .step-item.active .step-icon {
            background: #e0e7ff;
            border-color: #4f46e5;
            color: #4f46e5;
            box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15);
        }

        .step-item.completed .step-icon {
            background: #dcfce7;
            border-color: #16a34a;
            color: #16a34a;
        }

        .step-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .step-item.active .step-label,
        .step-item.completed .step-label {
            color: #0f172a;
        }

        /* OTP PIN Box */
        .otp-box {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            border: 2px dashed #f59e0b;
            border-radius: 16px;
            padding: 1.25rem;
            text-align: center;
            margin: 1.5rem 0;
        }

        .otp-title {
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #92400e;
        }

        .otp-code {
            font-family: monospace;
            font-size: 2.2rem;
            font-weight: 800;
            letter-spacing: 0.35em;
            color: #92400e;
            margin: 0.5rem 0;
        }

        .otp-subtitle {
            font-size: 0.8rem;
            color: #78350f;
        }

        /* Rating Box */
        .rating-box {
            background: linear-gradient(135deg, #f0fdf4, #dcfce7);
            border: 1px solid #86efac;
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
            margin: 1.5rem 0;
        }

        .star-rating {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            margin: 0.75rem 0;
            font-size: 1.8rem;
            cursor: pointer;
        }

        .star-rating span {
            color: #cbd5e1;
            transition: color 0.2s;
        }

        .star-rating span.selected,
        .star-rating span:hover {
            color: #f59e0b;
        }

        .shipment-card {
            background-color: var(--bg-color);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            padding: 1.5rem;
            margin-bottom: 2.5rem;
        }

        .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
        }

        .meta-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .meta-label {
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
        }

        .meta-value {
            font-size: 1.1rem;
            font-weight: 500;
        }

        .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.35rem 0.85rem;
            border-radius: 9999px;
            font-size: 0.85rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            border: 1px solid transparent;
            width: fit-content;
        }

        .status-badge.placed { background-color: #f1f5f9; color: #334155; border-color: #cbd5e1; }
        .status-badge.in_transit { background-color: #e0f2fe; color: #0369a1; border-color: #bae6fd; }
        .status-badge.out_for_delivery { background-color: #fef3c7; color: #b45309; border-color: #fde68a; }
        .status-badge.delivered { background-color: #dcfce7; color: #15803d; border-color: #bbf7d0; }
        .status-badge.cancelled { background-color: #fee2e2; color: #b91c1c; border-color: #fecaca; }

        .timeline-section {
            margin-top: 1rem;
        }

        .timeline-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1.75rem;
            color: var(--text-primary);
        }

        .timeline {
            position: relative;
            padding-left: 2rem;
            list-style: none;
        }

        .timeline::before {
            content: '';
            position: absolute;
            top: 0.5rem;
            bottom: 0.5rem;
            left: 5px;
            width: 2px;
            background-color: var(--card-border);
        }

        .timeline-item {
            position: relative;
            margin-bottom: 2rem;
        }

        .timeline-item:last-child {
            margin-bottom: 0;
        }

        .timeline-marker {
            position: absolute;
            left: -2rem;
            top: 0.3rem;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: var(--card-border);
            border: 2px solid var(--bg-color);
            transition: all 0.3s ease;
        }

        .timeline-item.active .timeline-marker {
            background-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.15);
        }

        .timeline-item.latest .timeline-marker {
            background-color: var(--success);
            box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.15);
        }

        .timeline-content {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .timeline-status {
            font-size: 1rem;
            font-weight: 600;
            text-transform: capitalize;
        }

        .timeline-desc {
            font-size: 0.9rem;
            color: var(--text-secondary);
        }

        .timeline-time {
            font-size: 0.8rem;
            color: var(--text-secondary);
            opacity: 0.8;
        }

        footer {
            margin-top: 2rem;
            text-align: center;
            font-size: 0.8rem;
            color: var(--text-secondary);
            opacity: 0.6;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">FastShip</div>
            <div class="subtitle">Real-time Shipment Tracking</div>
        </header>

        <!-- Visual Package Stepper -->
        <div class="stepper-wrapper">
            <div class="stepper-progress">
                <div class="stepper-progress-bar" id="progress-bar"></div>
            </div>
            <div class="stepper">
                <div class="step-item" id="step-placed">
                    <div class="step-icon">📦</div>
                    <div class="step-label">Placed</div>
                </div>
                <div class="step-item" id="step-in_transit">
                    <div class="step-icon">🚚</div>
                    <div class="step-label">In Transit</div>
                </div>
                <div class="step-item" id="step-out_for_delivery">
                    <div class="step-icon">🛵</div>
                    <div class="step-label">Out for Delivery</div>
                </div>
                <div class="step-item" id="step-delivered">
                    <div class="step-icon">✅</div>
                    <div class="step-label">Delivered</div>
                </div>
            </div>
        </div>

        {% if 'out_for_delivery' in status|string or verification_code %}
        <!-- OTP Box -->
        <div class="otp-box">
            <div class="otp-title">🔐 Delivery Verification PIN</div>
            <div class="otp-code">{{ verification_code if verification_code else '849201' }}</div>
            <div class="otp-subtitle">Share this 6-digit PIN with your delivery partner to receive your package.</div>
        </div>
        {% endif %}

        {% if 'delivered' in status|string %}
        <!-- Rating Box -->
        <div class="rating-box">
            <h3 style="font-weight: 600; color: #15803d; font-size: 1.1rem;">Rate Your Delivery Experience</h3>
            <div class="star-rating" id="star-rating">
                <span onclick="rate(1)">★</span>
                <span onclick="rate(2)">★</span>
                <span onclick="rate(3)">★</span>
                <span onclick="rate(4)">★</span>
                <span onclick="rate(5)">★</span>
            </div>
            <p id="rating-msg" style="font-size: 0.85rem; color: #16a34a; font-weight: 500;"></p>
        </div>
        {% endif %}

        <section class="shipment-card">
            <div class="meta-grid">
                <div class="meta-item">
                    <span class="meta-label">Order ID</span>
                    <span class="meta-value" style="font-family: monospace; font-size: 0.95rem; word-break: break-all;">{{ id.hex[-10:] }}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Current Status</span>
                    <span class="status-badge {{ status }}">{{ status.replace('_', ' ').replace('ShipmentStatus.', '').title() }}</span>
                </div>
                <span class="meta-item">
                    <span class="meta-label">Seller</span>
                    <span class="meta-value">{{ seller }}</span>
                </span>
                <div class="meta-item">
                    <span class="meta-label">Delivery Partner</span>
                    <span class="meta-value">{{ partner }}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Shipment Item</span>
                    <span class="meta-value">{{ content }}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Created At</span>
                    <span class="meta-value">{{ created_at.strftime('%d-%m-%Y %H:%M') }}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Estimated Delivery</span>
                    <span class="meta-value">{{ estimated_delivery.strftime('%d-%m-%Y %H:%M') }}</span>
                </div>
            </div>
        </section>

        <section class="timeline-section">
            <h2 class="timeline-title">Shipment History</h2>
            {% if timeline %}
                <ul class="timeline">
                    {% for event in timeline %}
                        <li class="timeline-item {% if loop.first %}latest{% else %}active{% endif %}">
                            <span class="timeline-marker"></span>
                            <div class="timeline-content">
                                <span class="timeline-status status-badge {{ event.status }}" style="font-size: 0.72rem; padding: 0.15rem 0.5rem; margin-bottom: 0.2rem;">{{ event.status.value if event.status.value is defined else event.status }}</span>
                                <span class="timeline-desc">{{ event.description }}</span>
                                <span class="timeline-time">{{ event.created_at.strftime('%d-%m-%Y %H:%M') }}</span>
                            </div>
                        </li>
                    {% endfor %}
                </ul>
            {% else %}
                <p style="color: var(--text-secondary); font-size: 0.9rem;">No timeline events recorded yet.</p>
            {% endif %}
        </section>
    </div>

    <script>
        const currentStatus = "{{ status }}";
        const steps = ['placed', 'in_transit', 'out_for_delivery', 'delivered'];
        const currentIdx = steps.indexOf(currentStatus.replace('ShipmentStatus.', ''));
        
        if (currentIdx !== -1) {
            const progressBar = document.getElementById('progress-bar');
            if (progressBar) {
                progressBar.style.width = (currentIdx / (steps.length - 1)) * 100 + '%';
            }
            steps.forEach((step, idx) => {
                const el = document.getElementById('step-' + step);
                if (el) {
                    if (idx < currentIdx) el.classList.add('completed');
                    else if (idx === currentIdx) el.classList.add('active');
                }
            });
        }

        function rate(stars) {
            const spans = document.querySelectorAll('#star-rating span');
            spans.forEach((s, idx) => {
                if (idx < stars) s.classList.add('selected');
                else s.classList.remove('selected');
            });
            document.getElementById('rating-msg').innerText = 'Thank you for rating us ' + stars + ' Stars! ⭐';
        }
    </script>
    <footer>
        &copy; 2026 FastShip Courier & Shipment Management System. All rights reserved.
    </footer>
</body>
</html>
"""

from ..dependencies import DeliveryPartnerDep, SellerDep, ShipmentServiceDep, TagServiceDep
from ..schemas.shipment import ShipmentCreate, ShipmentRead, ShipmentReview, ShipmentUpdate, ShipmentTrackResponse
from core.exceptions import NothingToUpdate

# api router to group endpoints
router = APIRouter(prefix="/shipment", tags=[APITag.SHIPMENT])


### Read a shipment by id
@router.get("/", response_model=ShipmentRead)
async def get_shipment(id: UUID,_:SellerDep, service: ShipmentServiceDep):
    return await service.get(id)


### Create a new shipment with content and weight
@router.post(
    "/",
    response_model=ShipmentRead,
    status_code=status.HTTP_201_CREATED,
    name="create_shipment",
    description="Submit a new **shipment**",
    responses={
        201: {
            "description": "Shipment is created successfully",
        },
        406: {
            "description": "Delivery partner is not available",
        }
    }
)
async def submit_shipment(
    seller:SellerDep,
    shipment: ShipmentCreate,
    service: ShipmentServiceDep,
):
    return await service.add(shipment, seller)


### Update fields of a shipment
@router.patch("/", response_model=ShipmentRead)
async def update_shipment(
    id: UUID,
    shipment_update: ShipmentUpdate,
    partner:DeliveryPartnerDep,
    service: ShipmentServiceDep,
):
    # Update data with given fields
    update = shipment_update.model_dump(exclude_none=True)

    if not update:
        raise NothingToUpdate()
        
    return await service.update(id,shipment_update,partner)

###Add a tag to a shipment
@router.get("/tag",response_model=ShipmentRead)
async def add_tag_to_shipment(
    id:UUID,
    tag:TagName,
    service:ShipmentServiceDep
):
    return await service.add_tag(id,tag)
    
    
###Remove a tag from a shipment
@router.delete("/tag",response_model=ShipmentRead)
async def remove_tag_from_shipment(
    id:UUID,
    tag:TagName,
    service:ShipmentServiceDep
):
    return await service.remove_tag(id,tag)


###Get all shipments by tag
@router.get("/tag/{tag_name}", response_model=list[ShipmentRead])
async def get_shipments_by_tag(
    tag_name: TagName,
    service: TagServiceDep
):
    return await service.get_shipments_by_tag(tag_name)


### cancel a shipment by id
@router.get("/cancel",response_model=ShipmentRead )
async def cancel_shipment(
    id: UUID,
    seller:SellerDep,
    service: ShipmentServiceDep,
):
    return await service.cancel(id,seller)
    


### Public endpoint to track a shipment via query parameter: GET /shipment/track?id=<uuid>
@router.get("/track", response_class=HTMLResponse, include_in_schema=False)
async def track_shipment(request: Request, id: UUID, service: ShipmentServiceDep):
    shipment = await service.get(id)
    
    context=shipment.model_dump()
    status_str = shipment.status.value if hasattr(shipment.status, "value") else str(shipment.status or "")
    context["status"] = status_str
    context["partner"] = shipment.delivery_partner.name if shipment.delivery_partner else "Not Assigned"
    context["seller"] = shipment.seller.name if shipment.seller else "FastShip Store"
    context["timeline"] = list(reversed(shipment.timeline)) if shipment.timeline else []
    
    # Generate or retrieve 6-digit OTP when package is out_for_delivery
    if "out_for_delivery" in status_str.lower():
        from app.database.redis import get_shipment_verification_code, add_shipment_verification_code
        from random import randint
        try:
            code = await get_shipment_verification_code(shipment.id)
        except Exception:
            code = None
        if not code:
            code = str(randint(100_000, 999_999))
            try:
                await add_shipment_verification_code(shipment.id, int(code))
            except Exception:
                pass
        context["verification_code"] = str(code)
    else:
        context["verification_code"] = None
    
    
    shipment.created_at.strftime("%d/%m/%Y, %H:%M")
    
    context["request"] = request
    template = Template(TRACK_HTML)
    html_content = template.render(**context)
    return HTMLResponse(content=html_content)

###Get review form for a shipment
@router.get("/review")
async def get_review_form(request:Request,token:str,):
    return templates.TemplateResponse(
        request=request,
        name="review.html",
        context={
            "request_url":f"http://{app_settings.APP_DOMAIN}/shipment/review?token={token}"
        }
    )

###Submit a review for a shipment
@router.post("/review")
async def submit_review(
    token:str,
    rating:Annotated[int,Form(ge=1,le=5)],
    comment:Annotated[str | None,Form()],
    service:ShipmentServiceDep,
):
    await service.rate(token, ShipmentReview(rating=rating, comment=comment))
    return {"detail": "Review Submitted"}