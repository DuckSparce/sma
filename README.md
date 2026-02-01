# SMA - Student Management Application

A full-stack web application for managing students with real-time chat functionality. Built with Laravel (PHP backend), Socket.IO (real-time messaging), and MongoDB (chat storage).

## Project Purpose

This application provides a comprehensive platform for student management with the following features:
- **Student CRUD Operations**: Create, read, update, and delete student records
- **User Authentication**: Login and registration system
- **Real-time Messaging**: Private and group chat functionality using WebSockets
- **Dashboard**: View and manage student information
- **Task Management**: Track student tasks and assignments
- **Responsive UI**: Modern, mobile-friendly interface

## Technologies Used

### Backend
- **Laravel 12** - PHP framework for web application backend
- **PHP 8.2** - Server-side programming language
- **SQLite** - Lightweight database for student data
- **Composer** - PHP dependency manager

### Real-time Chat Server
- **Node.js** - JavaScript runtime for chat server
- **Express.js 5.1** - Web framework for Node.js
- **Socket.IO 4.8** - Real-time bidirectional event-based communication
- **MongoDB** - NoSQL database for storing messages and chat groups
- **Mongoose 8.15** - MongoDB object modeling for Node.js

### Frontend
- **Vite 6.2** - Modern frontend build tool
- **TailwindCSS 4.0** - Utility-first CSS framework
- **Axios** - HTTP client for API requests
- **Vanilla JavaScript** - Client-side scripting

### Development Tools
- **PHPUnit** - PHP testing framework
- **Laravel Pint** - Code style fixer
- **Laravel Sail** - Docker development environment
- **Concurrently** - Run multiple commands concurrently

## Prerequisites

Before starting, ensure you have the following installed:
- **PHP 8.2 or higher** - [Download PHP](https://www.php.net/downloads)
- **Composer** - [Install Composer](https://getcomposer.org/download/)
- **Node.js (v16 or higher)** - [Download Node.js](https://nodejs.org/)
- **MongoDB** - [Install MongoDB](https://www.mongodb.com/try/download/community)

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd sma
```

### 2. Install PHP Dependencies
```bash
composer install
```

### 3. Install Node.js Dependencies (Frontend)
```bash
npm install
```

### 4. Install Chat Server Dependencies
```bash
cd chat-server
npm install
cd ..
```

### 5. Environment Configuration
```bash
# Copy the example environment file
copy .env.example .env

# Generate application key
php artisan key:generate
```

### 6. Database Setup
```bash
# Create SQLite database file (if it doesn't exist)
type nul > database\database.sqlite

# Run migrations to create tables
php artisan migrate
```

### 7. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# Or run manually
mongod
```

### 8. Start the Application

You need to run three processes simultaneously:

#### Terminal 1 - Laravel Backend
```bash
php artisan serve
```
This will start the Laravel application at `http://localhost:8000`

#### Terminal 2 - Chat Server
```bash
cd chat-server
node index.js
```
This will start the Socket.IO chat server (typically on port 3000)

#### Terminal 3 - Frontend Build (Development)
```bash
npm run dev
```
This will start Vite for hot module replacement

### Alternative: Run All Services Concurrently
If you have `concurrently` configured, you can run all services at once:
```bash
npm run dev
```

## Accessing the Application

Once all services are running:
- **Main Application**: http://localhost:8000
- **Students Page**: http://localhost:8000/students
- **Dashboard**: http://localhost:8000/dashboard
- **Messages**: http://localhost:8000/messages
- **Tasks**: http://localhost:8000/tasks

## Project Structure

```
sma/
├── app/                    # Laravel application code
│   ├── Http/Controllers/   # Request handlers
│   ├── Models/             # Database models (Student, User)
│   └── Providers/          # Service providers
├── chat-server/            # Node.js chat server
│   ├── models/             # MongoDB models (Message, Group, Student)
│   ├── index.js            # Socket.IO server
│   └── package.json        # Chat server dependencies
├── database/               # Database files and migrations
├── public/                 # Public assets (CSS, JS, images)
├── resources/              # Views and frontend source
│   ├── views/              # Blade templates
│   ├── css/                # Stylesheets
│   └── js/                 # JavaScript files
├── routes/                 # Application routes
└── config/                 # Configuration files
```

## Common Issues

### Issue: `php artisan serve` fails
**Solution**: Make sure PHP is properly installed and added to PATH. Check PHP version:
```bash
php --version
```

### Issue: Database connection errors
**Solution**: Ensure the SQLite database file exists at `database/database.sqlite`

### Issue: Chat not working
**Solution**: 
1. Verify MongoDB is running: `mongod --version`
2. Check that the chat server is running on the correct port
3. Verify Socket.IO connection in browser console

### Issue: Frontend assets not loading
**Solution**: Run `npm run build` to compile assets, or ensure `npm run dev` is running

## Development

### Running Tests
```bash
php artisan test
```

### Code Formatting
```bash
./vendor/bin/pint
```

### Building for Production
```bash
npm run build
```
