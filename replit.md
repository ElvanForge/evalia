# Evalia - Teacher Dashboard

## Overview

Evalia is a comprehensive teacher dashboard web application built with a modern full-stack architecture. It serves as an educational platform that allows teachers to create and manage quizzes, track student progress, manage classes, and handle assignments. The application features a React-based frontend with a Node.js/Express backend, PostgreSQL database, and integrates with external services like Stripe for payments and OpenAI for lesson plan generation.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with Tailwind CSS for styling
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with connection pooling
- **Authentication**: Passport.js with local strategy and bcrypt password hashing
- **Session Management**: Express sessions with PostgreSQL store

### UI/UX Design
- **Design System**: Custom theme based on shadcn/ui components
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Dark Mode**: Built-in theme switching capability

## Key Components

### Authentication System
- **Strategy**: Local authentication with username/password
- **Security**: Bcrypt password hashing with salt
- **Session Management**: PostgreSQL-backed session store
- **Role-based Access**: Teacher, Manager, and Admin roles

### Quiz Management
- **Creation**: Multi-step quiz builder with drag-and-drop functionality
- **Question Types**: Multiple choice with image support
- **Image Handling**: Advanced image upload system with fallback mechanisms
- **Real-time Preview**: Live quiz preview functionality

### File Upload System
- **Image Processing**: Multi-tier image handling with base64 conversion
- **Cache Management**: In-memory caching for improved performance
- **Error Recovery**: Multiple fallback strategies for image loading
- **Storage**: Local file system with structured directory organization

### Grade Tracking
- **Grade Scales**: Customizable grading systems
- **Analytics**: Grade distribution and performance metrics
- **Reporting**: Comprehensive student progress reports

### Lesson Planning
- **AI Integration**: OpenAI-powered lesson plan generation
- **Material Management**: Upload and organize lesson materials
- **Template System**: Reusable lesson plan templates

## Data Flow

### User Authentication Flow
1. User submits login credentials
2. Passport.js validates against database
3. Session created and stored in PostgreSQL
4. Frontend receives user data and manages auth state

### Quiz Creation Flow
1. Teacher creates quiz metadata
2. Questions and options added with validation
3. Images uploaded through enhanced handler
4. Quiz saved to database with relationships
5. Preview generated for testing

### Image Upload Flow
1. Files uploaded via multer middleware
2. Images processed and stored in uploads directory
3. Metadata cached for quick access
4. Multiple fallback URLs generated
5. Base64 conversion for reliable display

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL for production database
- **Payment Processing**: Stripe for subscription management
- **AI Services**: OpenAI API for lesson plan generation
- **Email**: Configured for notifications (service TBD)

### Development Dependencies
- **Type Safety**: TypeScript with strict configuration
- **Code Quality**: ESLint and Prettier (implied by structure)
- **Build Tools**: Vite with plugins for theme management
- **Testing**: Framework structure supports testing (not currently implemented)

### Third-party Integrations
- **Stripe**: Payment processing and subscription management
- **OpenAI**: AI-powered content generation
- **File Storage**: Local filesystem with planned cloud migration support

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized static assets
- **Backend**: ESBuild bundles server code
- **Assets**: Static files served via Express

### Environment Configuration
- **Database**: PostgreSQL connection via DATABASE_URL
- **Secrets**: Environment variables for API keys
- **File Storage**: Local uploads directory with persistence

### Production Considerations
- **Session Store**: PostgreSQL-backed for scalability
- **File Uploads**: Structured directory with proper permissions
- **Error Handling**: Comprehensive error boundaries and fallbacks
- **Performance**: Image caching and optimized database queries

## Changelog
- July 02, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.