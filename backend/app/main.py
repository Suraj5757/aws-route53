from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from .database import Base, engine, get_db
from .models import HostedZone, DNSRecord
from .schemas import (
    LoginRequest,
    UserResponse,
    HostedZoneCreate,
    HostedZoneUpdate,
    HostedZoneResponse,
    DNSRecordCreate,
    DNSRecordUpdate,
    DNSRecordResponse,
    PaginatedHostedZones,
    PaginatedRecords,
)

ALLOWED_RECORD_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Route53 Clone API",
    version="1.0.0",
    description="Mock Route53-style API for the assignment.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_session(session: str | None = Cookie(default=None)):
    if session != "route53-demo-session":
        raise HTTPException(status_code=401, detail="Authentication required")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/auth/login", response_model=UserResponse)
def login(payload: LoginRequest, response: Response):
    response.set_cookie(
        key="session",
        value="route53-demo-session",
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24,
    )
    return {"email": payload.email, "name": payload.email.split("@")[0].title()}


@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("session")
    return {"message": "Logged out"}


@app.get("/api/auth/me", response_model=UserResponse)
def me(session: str | None = Cookie(default=None)):
    if session != "route53-demo-session":
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"email": "admin@example.com", "name": "Admin"}


@app.get("/api/hosted-zones", response_model=PaginatedHostedZones)
def list_hosted_zones(
    search: str = "",
    page: int = 1,
    page_size: int = 8,
    db: Session = Depends(get_db),
    _: None = Depends(require_session),
):
    query = select(HostedZone).order_by(HostedZone.id.desc())
    if search.strip():
        query = query.where(HostedZone.name.ilike(f"%{search.strip()}%"))

    page = max(1, page)
    page_size = min(max(1, page_size), 50)
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    zones = db.scalars(query.offset((page-1)*page_size).limit(page_size)).all()
    result = []
    for zone in zones:
        result.append(
            HostedZoneResponse(
                id=zone.id,
                name=zone.name,
                type=zone.type,
                comment=zone.comment,
                private_zone=zone.private_zone,
                created_at=zone.created_at,
                record_count=len(zone.records),
            )
        )
    pages = max(1, (total + page_size - 1) // page_size)
    return {"items": result, "page": page, "page_size": page_size, "total": total, "pages": pages}


@app.post("/api/hosted-zones", response_model=HostedZoneResponse, status_code=201)
def create_hosted_zone(
    payload: HostedZoneCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_session),
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Zone name is required")

    zone = HostedZone(
        name=name,
        type=payload.type,
        comment=payload.comment,
        private_zone=payload.private_zone,
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)

    return HostedZoneResponse(
        id=zone.id,
        name=zone.name,
        type=zone.type,
        comment=zone.comment,
        private_zone=zone.private_zone,
        created_at=zone.created_at,
        record_count=0,
    )


@app.get("/api/hosted-zones/{zone_id}", response_model=HostedZoneResponse)
def get_hosted_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_session),
):
    zone = db.get(HostedZone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    return HostedZoneResponse(
        id=zone.id,
        name=zone.name,
        type=zone.type,
        comment=zone.comment,
        private_zone=zone.private_zone,
        created_at=zone.created_at,
        record_count=len(zone.records),
    )


@app.put("/api/hosted-zones/{zone_id}", response_model=HostedZoneResponse)
def update_hosted_zone(
    zone_id: int,
    payload: HostedZoneUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(require_session),
):
    zone = db.get(HostedZone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    zone.name = payload.name.strip()
    zone.type = payload.type
    zone.comment = payload.comment
    zone.private_zone = payload.private_zone
    db.commit()
    db.refresh(zone)

    return HostedZoneResponse(
        id=zone.id,
        name=zone.name,
        type=zone.type,
        comment=zone.comment,
        private_zone=zone.private_zone,
        created_at=zone.created_at,
        record_count=len(zone.records),
    )


@app.delete("/api/hosted-zones/{zone_id}")
def delete_hosted_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_session),
):
    zone = db.get(HostedZone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    db.delete(zone)
    db.commit()
    return {"message": "Hosted zone deleted"}


@app.get("/api/hosted-zones/{zone_id}/records", response_model=PaginatedRecords)
def list_records(
    zone_id: int,
    search: str = "",
    record_type: str = "",
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
    _: None = Depends(require_session),
):
    zone = db.get(HostedZone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    query = select(DNSRecord).where(DNSRecord.hosted_zone_id == zone_id)
    if search.strip():
        query = query.where(
            (DNSRecord.name.ilike(f"%{search.strip()}%"))
            | (DNSRecord.value.ilike(f"%{search.strip()}%"))
        )
    if record_type.strip():
        query = query.where(DNSRecord.type == record_type.strip().upper())

    page = max(1, page)
    page_size = min(max(1, page_size), 100)
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    rows = db.scalars(query.order_by(DNSRecord.id.desc()).offset((page-1)*page_size).limit(page_size)).all()
    pages = max(1, (total + page_size - 1) // page_size)
    return {"items": rows, "page": page, "page_size": page_size, "total": total, "pages": pages}


@app.post(
    "/api/hosted-zones/{zone_id}/records",
    response_model=DNSRecordResponse,
    status_code=201,
)
def create_record(
    zone_id: int,
    payload: DNSRecordCreate,
    db: Session = Depends(get_db),
    _: None = Depends(require_session),
):
    if not db.get(HostedZone, zone_id):
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    if payload.type.upper() not in ALLOWED_RECORD_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported record type")

    record = DNSRecord(
        hosted_zone_id=zone_id,
        name=payload.name.strip(),
        type=payload.type.upper(),
        ttl=payload.ttl,
        value=payload.value.strip(),
        routing_policy=payload.routing_policy,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.put("/api/records/{record_id}", response_model=DNSRecordResponse)
def update_record(
    record_id: int,
    payload: DNSRecordUpdate,
    db: Session = Depends(get_db),
    _: None = Depends(require_session),
):
    record = db.get(DNSRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if payload.type.upper() not in ALLOWED_RECORD_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported record type")

    record.name = payload.name.strip()
    record.type = payload.type.upper()
    record.ttl = payload.ttl
    record.value = payload.value.strip()
    record.routing_policy = payload.routing_policy
    db.commit()
    db.refresh(record)
    return record


@app.delete("/api/records/{record_id}")
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    _: None = Depends(require_session),
):
    record = db.get(DNSRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return {"message": "Record deleted"}


@app.get("/api/export/hosted-zones/{zone_id}")
def export_zone(zone_id: int, db: Session = Depends(get_db), _: None = Depends(require_session)):
    zone = db.get(HostedZone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return {"hosted_zone": {"id": zone.id, "name": zone.name, "type": zone.type, "comment": zone.comment, "private_zone": zone.private_zone},
            "records": [{"name": r.name, "type": r.type, "ttl": r.ttl, "value": r.value, "routing_policy": r.routing_policy} for r in zone.records]}
