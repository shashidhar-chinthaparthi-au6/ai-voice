# Voice-Based AI Culture Survey Assistant

A multitenant voice-based AI culture survey platform that enables organizations to collect and analyze cultural insights through voice responses and AI-powered sentiment analysis.

## Features

### 🎤 Voice Recording
- High-quality voice recording with noise suppression
- Real-time transcription using OpenAI Whisper
- Voice sentiment analysis and confidence scoring

### 🏢 Multitenant Architecture
- Complete tenant isolation with subdomain/domain support
- Tenant-specific settings, themes, and feature toggles
- Role-based access control (Admin, Manager, Analyst, Viewer)
- Subscription management with usage limits

### 📊 Advanced Analytics
- Real-time survey analytics and insights
- Demographic analysis and response trends
- AI-powered survey insights and recommendations
- Export capabilities for data analysis

### 🔒 Security & Compliance
- JWT-based authentication
- Rate limiting and security headers
- Data encryption and secure file handling
- GDPR-compliant data handling

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **OpenAI API** for AI processing
- **Multer** for file uploads
- **Rate limiting** and security middleware

### Frontend
- **React 18** with TypeScript
- **Material-UI** for modern UI components
- **React Router** for navigation
- **Axios** for API communication
- **Voice recording** with Web Audio API

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB 4.4+
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
```bash
cd ~/Desktop/voice-ai-culture-survey
npm run install:all
```

2. **Set up environment variables:**
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and OpenAI API key

# Frontend
cd ../frontend
# .env is already configured for development
```

3. **Start MongoDB:**
```bash
# Make sure MongoDB is running on localhost:27017
mongod
```

4. **Start the application:**
```bash
# From project root
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

### First Time Setup

1. **Create your first tenant:**
   - The system will automatically create a default tenant for localhost
   - Access the application at http://localhost:3000

2. **Register your first user:**
   - Go to http://localhost:3000/register
   - Create an admin account
   - You'll be automatically logged in

3. **Create your first survey:**
   - Use the dashboard to create voice-based surveys
   - Configure questions with voice, text, multiple choice, rating, or yes/no options
   - Set survey settings and permissions

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Surveys
- `GET /api/surveys` - List surveys
- `POST /api/surveys` - Create survey
- `GET /api/surveys/:id` - Get survey details
- `PUT /api/surveys/:id` - Update survey
- `DELETE /api/surveys/:id` - Delete survey
- `PATCH /api/surveys/:id/toggle` - Toggle survey status

### Responses
- `POST /api/responses/:surveyId` - Submit survey response
- `POST /api/responses/upload-audio` - Upload audio file
- `GET /api/responses/:surveyId` - Get survey responses

### Analytics
- `GET /api/analytics/survey/:id` - Get survey analytics
- `GET /api/analytics/tenant` - Get tenant analytics

### Tenant Management
- `GET /api/tenant` - Get tenant information
- `PUT /api/tenant/settings` - Update tenant settings
- `GET /api/tenant/users` - List tenant users
- `POST /api/tenant/users` - Create user
- `PUT /api/tenant/users/:id` - Update user
- `DELETE /api/tenant/users/:id` - Delete user

## Multitenant Configuration

### Tenant Resolution
The system supports multiple tenant resolution methods:

1. **Header-based**: `X-Tenant-ID` header
2. **Subdomain-based**: `tenant.yourdomain.com`
3. **Domain-based**: `tenantdomain.com`
4. **Default tenant**: For development

### Tenant Settings
Each tenant can configure:
- **Theme**: Primary/secondary colors, logo
- **Features**: Voice recording, AI analysis, custom questions, analytics
- **Limits**: Max surveys, responses, users
- **Subscription**: Plan type and status

## Voice Processing Pipeline

1. **Recording**: High-quality audio capture with noise suppression
2. **Upload**: Secure file upload to server
3. **Transcription**: OpenAI Whisper API for speech-to-text
4. **Analysis**: Sentiment analysis and confidence scoring
5. **Storage**: Processed data stored with metadata

## Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm start
```

### Database Management
```bash
# Connect to MongoDB
mongosh voice-ai-culture-survey

# View collections
show collections

# View tenants
db.tenants.find()
```

## Production Deployment

### Environment Variables
Ensure all production environment variables are set:
- `MONGODB_URI` - Production MongoDB connection
- `JWT_SECRET` - Strong secret key
- `OPENAI_API_KEY` - OpenAI API key
- `NODE_ENV=production`

### Security Considerations
- Use HTTPS in production
- Set up proper CORS origins
- Configure rate limiting
- Use environment-specific secrets
- Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

Built with ❤️ for cultural research and voice-based data collection.
# ai-voice
