const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}=== Tickenten Installation Script ===${colors.reset}\n`);

try {
  // Install server dependencies
  console.log(`${colors.yellow}Installing server dependencies...${colors.reset}`);
  execSync('cd server && npm install', { stdio: 'inherit' });
  console.log(`${colors.green}Server dependencies installed successfully!${colors.reset}\n`);

  // Install client dependencies
  console.log(`${colors.yellow}Installing client dependencies...${colors.reset}`);
  execSync('npm install', { stdio: 'inherit' });
  console.log(`${colors.green}Client dependencies installed successfully!${colors.reset}\n`);

  // Check if .env file exists, if not create it
  const envPath = path.join(__dirname, 'server', '.env');
  if (!fs.existsSync(envPath)) {
    console.log(`${colors.yellow}Creating .env file...${colors.reset}`);
    
    const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://stream:telvinteum@stream.o3qip.mongodb.net/?retryWrites=true&w=majority&appName=stream

# JWT Configuration
JWT_SECRET=tickenten-super-secret-jwt-token
JWT_EXPIRE=7d

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USERNAME=telvinteum@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@tickenten.com

# OAuth2 Configuration (Optional)
EMAIL_USE_OAUTH=false
EMAIL_CLIENT_ID=your-client-id
EMAIL_CLIENT_SECRET=your-client-secret
EMAIL_REFRESH_TOKEN=your-refresh-token
EMAIL_ACCESS_TOKEN=your-access-token

# Frontend URL for email verification and password reset
FRONTEND_URL=http://localhost:3000`;

    fs.writeFileSync(envPath, envContent);
    console.log(`${colors.green}.env file created successfully!${colors.reset}\n`);
  }

  console.log(`${colors.bright}${colors.green}Installation completed successfully!${colors.reset}`);
  console.log(`
${colors.bright}Next steps:${colors.reset}
1. Update the email configuration in server/.env with your email credentials
2. Start the server: ${colors.cyan}cd server && npm run dev${colors.reset}
3. Start the client: ${colors.cyan}npm start${colors.reset}
  `);

} catch (error) {
  console.error(`${colors.red}Installation failed:${colors.reset}`, error);
  process.exit(1);
} 