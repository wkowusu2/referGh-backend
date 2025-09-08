const express = require('express'); 
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db.js');
const adminRoute = require('./routes/adminRoute');
const clinicRoute = require('./routes/clinicRoute');
const unitRoute = require('./routes/unitRoute');

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
    cors: {
        origin: "https://refer-ghana-9w25ozixq-tooknown27-4065s-projects.vercel.app", // Vite dev server
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: "https://refer-ghana-9w25ozixq-tooknown27-4065s-projects.vercel.app",
    credentials: true
}));
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

// Connect to database
connectDB();

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room based on user type and ID
    socket.on('join-room', (data) => {
        const { userType, userId } = data;
        const room = `${userType}-${userId}`;
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    // Join hospital room for all units in that hospital
    socket.on('join-hospital', (hospitalId) => {
        const room = `hospital-${hospitalId}`;
        socket.join(room);
        console.log(`User ${socket.id} joined hospital room: ${room}`);
    });

    // Handle unit status updates
    socket.on('update-unit-status', (data) => {
        // Broadcast to all connected clients
        socket.broadcast.emit('unit-status-updated', data);
        
        // Also broadcast to hospital room
        if (data.hospitalId) {
            socket.to(`hospital-${data.hospitalId}`).emit('unit-status-updated', data);
        }
    });

    // Handle bed count updates
    socket.on('update-bed-count', (data) => {
        // Broadcast to all connected clients
        socket.broadcast.emit('bed-count-updated', data);
        
        // Also broadcast to hospital room
        if (data.hospitalId) {
            socket.to(`hospital-${data.hospitalId}`).emit('bed-count-updated', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Routes
app.get('/', (req, res) => {
    res.json({ message: "Backend is running successfully" });
});

app.use('/api/admin', adminRoute);
app.use('/api/clinic', clinicRoute);
app.use('/api/unit', unitRoute);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});


// 404 handler
// app.use('*', (req, res) => {
//     res.status(404).json({ message: 'Route not found' });
// });


const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
    console.log(`Backend is running on port ${PORT}`);
});