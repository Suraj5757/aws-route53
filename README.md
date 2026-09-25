# AWS Route53 Clone

A functional Route53-style DNS management application built for the assignment.

## Stack

- Frontend: Next.js + TypeScript
- Backend: FastAPI + SQLAlchemy
- Database: SQLite
- Authentication: mocked cookie-based session
- Styling: custom CSS inspired by the AWS console

## Features

- Mock login/logout with persistent session cookie
- Hosted Zones CRUD
- Hosted Zone search and pagination
- DNS Records CRUD
- Supported record types: A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA
- Record search and type filtering
- AWS-style navigation, tables, forms, notifications and modals
- Coming Soon pages for Dashboard, Traffic Policies, Health Checks, Resolver and Profiles
- Persistent SQLite storage
- API documentation through FastAPI `/docs`

## Project Structure

```text
aws-route53-clone/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── tsconfig.json
├── backend/
│   ├── app/
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## Database Schema

### hosted_zones

- id
- name
- type
- comment
- private_zone
- record_count
- created_at

### dns_records

- id
- hosted_zone_id
- name
- type
- ttl
- value
- routing_policy
- created_at

A hosted zone has many DNS records. Deleting a hosted zone also deletes its records.

## Run Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend API: http://localhost:8000  
Swagger docs: http://localhost:8000/docs

## Run Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:3000

The frontend expects the API at:

```text
http://localhost:8000/api
```

You can change it with:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Demo Login

Use any email and password. Authentication is intentionally mocked for the assignment.

Example:

```text
Email: admin@example.com
Password: password
```

## API Overview

```text
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/hosted-zones
POST   /api/hosted-zones
GET    /api/hosted-zones/{id}
PUT    /api/hosted-zones/{id}
DELETE /api/hosted-zones/{id}

GET    /api/hosted-zones/{id}/records
POST   /api/hosted-zones/{id}/records
PUT    /api/records/{id}
DELETE /api/records/{id}
```

## Notes

This project intentionally does not perform real DNS operations. It recreates the Route53 user experience and core CRUD workflows using local persistent data, as required by the assignment.
