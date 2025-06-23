# TickenTen - Modern Ticketing Platform

TickenTen is an open-source ticketing platform built with modern web technologies. It allows event creators to easily create, manage, and sell tickets for their events, while providing attendees with a seamless experience to discover and purchase tickets.

## Features

- **Modern UI**: Built with React, Tailwind CSS, and Framer Motion for beautiful, responsive, and animated interfaces
- **Dark Mode**: Full support for light and dark themes
- **Authentication**: Secure user authentication with JWT and password reset functionality
- **Event Management**: Create, edit, and manage events with rich details
- **Ticket Types**: Support for multiple ticket types with different prices
- **Dashboard**: Comprehensive dashboard for event creators
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

### Frontend
- **React**: UI library
- **React Router**: For navigation
- **Tailwind CSS**: For styling
- **Framer Motion**: For animations
- **React Icons**: For icons
- **TanStack Query**: For data fetching and caching
- **Formik & Yup**: For form handling and validation

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **JWT**: For authentication
- **Passport.js**: Authentication middleware
- **Nodemailer**: For sending emails

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tickenten.git
cd tickenten
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd server
npm install
```

4. Create a `.env` file in the server directory (copy from `.env.example`):
```bash
cp .env.example .env
```

5. Update the `.env` file with your configuration values.

### Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. In a new terminal, start the frontend:
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
tickenten/
├── public/              # Public assets
├── src/                 # Frontend source code
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── context/         # React context providers
│   ├── utils/           # Utility functions
│   ├── App.js           # Main App component
│   └── index.js         # Entry point
├── server/              # Backend source code
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Route controllers
│   │   ├── models/      # Mongoose models
│   │   ├── routes/      # Express routes
│   │   ├── middleware/  # Custom middleware
│   │   ├── utils/       # Utility functions
│   │   └── index.js     # Server entry point
│   └── package.json     # Backend dependencies
└── package.json         # Frontend dependencies
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [TanStack Query](https://tanstack.com/query/latest)
