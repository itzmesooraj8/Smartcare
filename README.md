# Welcome to  the  project

## Project info


# Smartcare Platform

> **CONFIDENTIAL & PROPRIETARY**
> This repository contains confidential information and proprietary software belonging to **Smartcare**.
> Unauthorized copying, distribution, modification, public display, or use of this software, via any medium, is strictly prohibited.

![Build Status](https://img.shields.io/badge/Build-Passing-success) ![Security](https://img.shields.io/badge/Security-HIPAA_Ready-blue) ![License](https://img.shields.io/badge/License-Proprietary-red)

## 1. Executive Summary

Smartcare is a next-generation Telehealth and Electronic Health Record (EHR) orchestration engine designed to reduce clinical friction and improve patient outcomes. Unlike standard video conferencing tools, Smartcare integrates real-time communication directly with clinical workflows, offering AI-assisted triage, encrypted record keeping, and audit-compliant file exchange.

The platform is engineered for high availability, low latency, and strict adherence to healthcare data privacy standards (HIPAA/GDPR).

## 2. System Architecture

Smartcare operates on a decoupled microservices-ready architecture:

* **Frontend:** Single Page Application (SPA) built with **React/TypeScript**, utilizing atomic design principles for UI scalability.
* **Backend:** High-performance REST API built with **Python FastAPI**, leveraging asynchronous processing for concurrent request handling.
* **Real-Time Layer:** Custom signaling server using **WebSockets** and **Redis Pub/Sub** for millisecond-latency peer discovery.
* **Data Persistence:** **PostgreSQL** with Row-Level Security (RLS) for multi-tenant data isolation.
* **Storage:** Secure object storage with time-limited signed URLs for ephemeral file access.

## 3. Key Technical Features

### 🔐 Security & Compliance
* **Zero-Knowledge Architecture:** Patient diagnosis and prescription fields are encrypted at the application level (AES-256/Fernet) before persistence. Database administrators cannot view sensitive PHI (Protected Health Information).
* **Immutable Audit Trails:** A comprehensive audit logging system tracks every read, write, and export action, recording user identity, timestamp, and IP address to satisfy regulatory requirements.
* **Role-Based Access Control (RBAC):** Strict separation of concerns between `Patient`, `Doctor`, and `Admin` roles.

### 🎥 Telemedicine Infrastructure
* **Dynamic Network Traversal:** Implements a fallback strategy for restrictive hospital networks, utilizing dynamic TURN credential generation to tunnel traffic through firewalls when P2P (STUN) connections fail.
* **Secure Data Channels:** In-call file sharing utilizes server-side signed URLs. Files are never exposed publicly; access is granted strictly on a per-session basis and logged for auditing.

### 🤖 Clinical Decision Support
* **AI Triage Engine:** An integrated LLM-based triage system assesses patient symptoms pre-consultation, routing high-acuity cases to emergency services and low-acuity cases to telemedicine queues.

## 4. Technology Stack

| Domain | Technology |
| :--- | :--- |
| **Client** | React 18, TypeScript, Vite, Tailwind CSS, Shadcn/UI |
| **Server** | Python 3.10+, FastAPI, SQLAlchemy, Pydantic |
| **Database** | PostgreSQL 15+ (Relational), Redis (Transient State) |
| **Infrastructure** | Docker, Nginx (Reverse Proxy) |
| **Testing** | Pytest, Jest |

## 5. Development Setup (Internal Use Only)

**Prerequisites:** Docker, Node.js v18+, Python 3.10+.

### Backend Initialization
```bash
cd smartcare-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start the development server with hot-reload
uvicorn app.main:app --reload