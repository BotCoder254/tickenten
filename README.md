# TickenTen - Event Ticketing Platform

TickenTen is a full-stack event ticketing platform built with React and Node.js.

## Features

- User authentication and authorization
- Event creation and management
- Ticket purchasing and verification
- User profiles and dashboards
- Search and filter events
- Email notifications
- Mobile-responsive design

## Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT, Passport.js
- **Notifications**: Email, SMS
- **Deployment**: Docker, Render

## Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/tickenten.git
   cd tickenten
   ```

2. Install dependencies for frontend:
   ```
   npm install
   ```

3. Install dependencies for backend:
   ```
   cd server
   npm install
   ```

4. Create environment files:
   - Create `.env` in the root directory for frontend
   - Create `.env` in the `server` directory for backend

5. Start the development servers:
   ```
   # In the root directory (frontend)
   npm start
   
   # In the server directory (backend)
   npm run dev
   ```

## Deployment

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions.

### Quick Deployment Options

1. **Render**: Use the included `render.yaml` file for Blueprint deployment
2. **Docker**: Use the provided Docker files and docker-compose.yml

## Environment Variables

### Frontend (.env)
```
REACT_APP_API_URL=https://api.tickenten.onrender.com/api
```

### Backend (server/.env)
```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/tickenten
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_FROM=noreply@tickenten.com
FRONTEND_URL=https://tickenten.onrender.com
```

## License

This project is licensed under the MIT License.

## Acknowledgments

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
