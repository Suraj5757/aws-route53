from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    email: str = Field(min_length=1)
    password: str = Field(min_length=1)


class UserResponse(BaseModel):
    email: str
    name: str


class HostedZoneCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str = "Public"
    comment: str = ""
    private_zone: bool = False


class HostedZoneUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str = "Public"
    comment: str = ""
    private_zone: bool = False


class HostedZoneResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: str
    comment: str
    private_zone: bool
    created_at: datetime
    record_count: int = 0


class DNSRecordCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str
    ttl: int = Field(default=300, ge=0, le=86400)
    value: str = Field(min_length=1)
    routing_policy: str = "Simple"


class DNSRecordUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str
    ttl: int = Field(default=300, ge=0, le=86400)
    value: str = Field(min_length=1)
    routing_policy: str = "Simple"


class DNSRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    hosted_zone_id: int
    name: str
    type: str
    ttl: int
    value: str
    routing_policy: str
    created_at: datetime


class PaginatedHostedZones(BaseModel):
    items: list[HostedZoneResponse]
    page: int
    page_size: int
    total: int
    pages: int

class PaginatedRecords(BaseModel):
    items: list[DNSRecordResponse]
    page: int
    page_size: int
    total: int
    pages: int
