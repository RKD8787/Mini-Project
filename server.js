const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = 3000;

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
let currentSessionId = Date.now(); // initialize when server starts

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const DATA_FILE = path.join(dataDir, 'attendance.json');

app.use(cors());
app.use(bodyParser.json());

// ✅ FIX: Serve static files from current directory (where HTML, CSS, JS files are located)
app.use(express.static(__dirname));

// ✅ FIX: Serve HTML files from root directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/student.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'student.html'));
});

// ✅ Serve CSS and JS files explicitly to ensure they're accessible
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'script.js'));
});

let attendanceData = {};
if (fs.existsSync(DATA_FILE)) {
    try {
        attendanceData = JSON.parse(fs.readFileSync(DATA_FILE));
    } catch (error) {
        console.log('Error reading attendance file, starting fresh');
        attendanceData = {};
    }
}

// Function to get network IP address
function getNetworkIP() {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    
    return 'localhost'; // fallback
}

// Endpoint to provide network information
app.get('/api/network-info', (req, res) => {
    const networkIp = getNetworkIP();
    res.json({ 
        networkIp: networkIp,
        port: PORT,
        studentUrl: `http://${networkIp}:${PORT}/student.html`
    });
});

// ✅ FIXED: Get attendance data - Return actual attendance data AND session ID
app.get('/api/attendance', (req, res) => {
    res.json({ 
        sessionId: currentSessionId,
        attendanceData: attendanceData  // ✅ Include actual attendance data
    });
});

// ✅ FIXED: Add separate endpoint for session check
app.get('/api/session', (req, res) => {
    res.json({ sessionId: currentSessionId });
});

// Post attendance (mark student present)
app.post('/api/attendance', (req, res) => {
    const { student } = req.body;
    if (!student) return res.status(400).json({ message: "Missing student name" });

    if (attendanceData[student]) {
        return res.status(409).json({ message: "Student already marked present" });
    }

    attendanceData[student] = new Date().toISOString();
    
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(attendanceData, null, 2));
        console.log(`✅ Attendance recorded for: ${student}`);
        res.json({ message: "Attendance recorded successfully" });
    } catch (error) {
        console.error('Error writing attendance file:', error);
        res.status(500).json({ message: "Error saving attendance" });
    }
});

// Delete specific student from attendance
app.delete('/api/attendance/:student', (req, res) => {
    const student = decodeURIComponent(req.params.student);

    if (attendanceData[student]) {
        delete attendanceData[student];
        try {
            fs.writeFileSync(DATA_FILE, JSON.stringify(attendanceData, null, 2));
            console.log(`✅ Removed ${student} from attendance`);
            res.json({ message: `${student} removed from attendance` });
        } catch (error) {
            console.error('Error writing attendance file:', error);
            res.status(500).json({ message: "Error saving attendance" });
        }
    } else {
        res.status(404).json({ message: "Student not found in attendance" });
    }
});

// ✅ FIXED: Clear all attendance - Generate new session ID
app.delete('/api/attendance', (req, res) => {
    attendanceData = {};
    currentSessionId = Date.now(); // ✅ Generate new session ID

    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(attendanceData, null, 2));
        console.log('✅ All attendance cleared and new session started');
        res.json({ 
            message: "All attendance cleared",
            sessionId: currentSessionId  // ✅ Return new session ID
        });
    } catch (error) {
        console.error('Error writing attendance file:', error);
        res.status(500).json({ message: "Error clearing attendance" });
    }
});

// Start server on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
    const networkIp = getNetworkIP();
    console.log(`✅ QR Attendance System Server Started!`);
    console.log(`\n📍 Server running on:`);
    console.log(`   Local: http://localhost:${PORT}`);
    console.log(`   Network: http://${networkIp}:${PORT}`);
    console.log(`\n🖥️  Access URLs:`);
    console.log(`   Faculty View: http://${networkIp}:${PORT}/index.html`);
    console.log(`   Student View: http://${networkIp}:${PORT}/student.html`);
    console.log(`\n📱 Students can scan QR code to access from their phones!`);
    console.log(`\n🔧 Make sure all files are in the same directory as server.js`);
});