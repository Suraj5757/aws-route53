# AWS Route 53 Clone

A functional AWS Route 53-style DNS management console built for the Software Development Intern assignment.

## Live Demo

https://aws-route53-brown.vercel.app/

## GitHub Repository

https://github.com/Suraj5757/aws-route53

## Tech Stack

- Frontend: Next.js + TypeScript
- Backend: FastAPI + Python
- Database: SQLite
- ORM: SQLAlchemy
- Authentication: Mock session-based authentication
- Deployment:
  - Frontend: Vercel
  - Backend: Render

## Features

### Authentication
- Mock login/logout
- Session persistence using HTTP-only cookies

### Hosted Zones
- Create hosted zones
- View hosted zones
- Search hosted zones
- Edit hosted zones
- Delete hosted zones
- Pagination

### DNS Records
- Create DNS records
- Edit DNS records
- Delete DNS records
- Search records
- Filter by record type
- Pagination
- JSON export

Supported record types:

- A
- AAAA
- CNAME
- TXT
- MX
- NS
- PTR
- SRV
- CAA

### Additional UI
- AWS Route 53-style navigation
- Dashboard
- Traffic Policies placeholder
- Health Checks placeholder
- Resolver placeholder
- Profiles placeholder
- Notifications/toasts
- Responsive console layout

## Architecture

```text
User
  |
  v
Next.js Frontend
  |
  | HTTP API
  v
FastAPI Backend
  |
  v
SQLAlchemy
  |
  v
SQLite Database