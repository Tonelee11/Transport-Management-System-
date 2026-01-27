# Transport Management System

A comprehensive Logistics and Transport Management System designed for efficiency and reliability. This system features a robust PHP backend, a modern Vanilla JavaScript PWA frontend, and seamless SMS integration via Beem Africa.

## 🚀 Features

- **Waybill Management**: Create, track, and manage cargo waybills with ease.
- **Client Hub**: Centralized portal for managing client data and shipment history.
- **PWA Frontend**: A fast, responsive, and installable web application for mobile and desktop.
- **Automated SMS Notifications**: Keep clients informed with real-time updates (Receipt, Departure, On-Road, and Arrival) using Beem Africa API.
- **User Management**: Role-based access control (Admin/Clerk) with secure authentication and CSRF protection.
- **Modern UI**: Clean, professional interface with Dark/Light mode support.

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3, JavaScript (ES6+).
- **Backend**: PHP 8.2.
- **Database**: MySQL 8.0.
- **Server**: Nginx.
- **Deployment**: Dockerized services for consistent environment across development and production.

## 📦 Setting Up (Local Development)

### Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Tonelee11/Transport-Management-System-.git
   cd Transport-Management-System-
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the `api/` directory (you can use `.env.example` as a template):
   ```bash
   cp api/.env.example api/.env
   ```
   Add your **Beem Africa** API credentials and database configuration.

3. **Start the Services**:
   ```bash
   docker-compose up -d
   ```

4. **Access the Application**:
   - **Frontend**: [http://localhost](http://localhost)
   - **Adminer (Database GUI)**: [http://localhost:8080](http://localhost:8080)

## 📡 Deployment

This project is optimized for deployment on platforms that support Docker, such as **Render**, **Railway**, or a **VPS**. For a 100% free setup, we recommend:
- **Web/API**: Render.com (Free Tier)
- **Database**: TiDB Cloud (MySQL-compatible Free Tier)

## 📄 License

This project is licensed under the MIT License.
