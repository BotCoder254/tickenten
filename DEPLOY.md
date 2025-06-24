# Deploying TickenTen to Render

This guide explains how to deploy the TickenTen application to Render.

## Prerequisites

1. A [Render](https://render.com) account
2. A MongoDB database (you can use MongoDB Atlas)
3. Git repository with your TickenTen code

## Deployment Options

You have two options for deploying to Render:

1. Using the `render.yaml` file for Blueprint deployment
2. Manual deployment of each service

## Option 1: Blueprint Deployment (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. In Render dashboard, click "New" and select "Blueprint"
3. Connect your Git repository
4. Render will detect the `render.yaml` file and configure the services
5. Set up the required environment variables:
   - `JWT_SECRET`: A secure random string for JWT token signing
   - `MONGO_URI`: Your MongoDB connection string
   - `EMAIL_SERVICE`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: Email service credentials
6. Click "Apply" to deploy the services

## Option 2: Manual Deployment

### Backend API Service

1. In Render dashboard, click "New" and select "Web Service"
2. Connect your Git repository
3. Configure the service:
   - **Name**: tickenten-api
   - **Environment**: Node
   - **Region**: Choose the closest region
   - **Branch**: main (or your preferred branch)
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: Free (or choose a paid plan for production)
4. Add the following environment variables:
   - `NODE_ENV`: production
   - `PORT`: 10000 (Render's default)
   - `JWT_SECRET`: A secure random string
   - `JWT_EXPIRE`: 30d
   - `MONGO_URI`: Your MongoDB connection string
   - `EMAIL_SERVICE`: Your email service (e.g., smtp)
   - `EMAIL_HOST`: Your email host
   - `EMAIL_PORT`: Your email port (e.g., 587)
   - `EMAIL_USER`: Your email username
   - `EMAIL_PASS`: Your email password
   - `EMAIL_FROM`: noreply@tickenten.com
   - `FRONTEND_URL`: Your frontend URL (e.g., https://tickenten.onrender.com)
5. Click "Create Web Service"

### Frontend Static Site

1. In Render dashboard, click "New" and select "Static Site"
2. Connect your Git repository
3. Configure the site:
   - **Name**: tickenten-frontend
   - **Branch**: main (or your preferred branch)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: build
   - **Environment Variables**: 
     - `REACT_APP_API_URL`: https://tickenten-api.onrender.com/api
4. Click "Create Static Site"

## Docker Deployment (Alternative)

If you prefer to use Docker for local development or other hosting platforms:

1. Make sure Docker and Docker Compose are installed
2. Update environment variables in the `docker-compose.yml` file
3. Run `docker-compose up -d` to start all services
4. Access the application at http://localhost

## Troubleshooting

- **Backend not connecting to MongoDB**: Check your `MONGO_URI` environment variable
- **Frontend not connecting to backend**: Verify the `REACT_APP_API_URL` environment variable
- **CORS errors**: Ensure the backend's `FRONTEND_URL` environment variable matches your frontend URL
- **Missing uploads directory**: Create an uploads directory in the server folder if it doesn't exist

## Monitoring and Logs

- View logs for each service in the Render dashboard
- Set up alerts for service health in Render
- Consider adding application monitoring with a service like New Relic or Datadog 