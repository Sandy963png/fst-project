require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
// Ensure server respects the hosting provider's assigned ENV PORT
const PORT = process.env.PORT || 3000;

// CORS logic (Important for cloud deployments)
const corsOptions = {
  origin: '*', // Automatically allows Vercel Domains
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection (Switching to dynamic URI for MongoDB Atlas)
const DB_URI = process.env.MONGO_URI || 'mongodb+srv://Sandeep:123@cluster0.wrjfsnx.mongodb.net/fst_guide_hub?appName=Cluster0';

mongoose.connect(DB_URI)
    .then(() => console.log('✅ Connected to MongoDB Database successfully!'))
    .catch((err) => console.error('❌ Error connecting to MongoDB:', err));

const studentSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    researchTopic: { type: String, required: true },
    role: { type: String, default: 'student' }
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    department: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'guide' }
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true }, 
    text: { type: String, required: true }
}, { timestamps: true });

const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    studentEmail: { type: String, required: true },
    studentName: { type: String, required: true },
    status: { type: String, enum: ['pending', 'revision', 'approved'], default: 'pending' }
}, { timestamps: true });

const meetingSchema = new mongoose.Schema({
    studentEmail: { type: String, required: true },
    studentName: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

const Student = mongoose.model('Student', studentSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Message = mongoose.model('Message', messageSchema);
const Milestone = mongoose.model('Milestone', milestoneSchema);
const Meeting = mongoose.model('Meeting', meetingSchema);

app.post('/api/milestones', async (req, res) => {
    try {
        const { title, studentEmail, studentName } = req.body;
        if (!title || !studentEmail) return res.status(400).json({ message: 'Missing fields' });

        const newMilestone = new Milestone({ title, studentEmail, studentName, status: 'pending' });
        await newMilestone.save();
        res.status(201).json(newMilestone);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

app.get('/api/milestones/student/:email', async (req, res) => {
    try {
        const milestones = await Milestone.find({ studentEmail: req.params.email });
        res.json(milestones);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

app.get('/api/milestones', async (req, res) => {
    try {
        const milestones = await Milestone.find();
        res.json(milestones);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

app.put('/api/milestones/:id', async (req, res) => {
    try {
        const { status } = req.body; 
        const updated = await Milestone.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

app.post('/api/meetings', async (req, res) => {
    try {
        const { studentEmail, studentName, date, time } = req.body;
        if (!date || !time) return res.status(400).json({ message: 'Missing fields' });
        const newMeeting = new Meeting({ studentEmail, studentName, date, time, status: 'pending' });
        await newMeeting.save();
        res.status(201).json(newMeeting);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

app.get('/api/meetings/student/:email', async (req, res) => {
    try {
        const meetings = await Meeting.find({ studentEmail: req.params.email }).sort({ date: 1 });
        res.json(meetings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

app.get('/api/meetings', async (req, res) => {
    try {
        const meetings = await Meeting.find().sort({ date: 1 });
        res.json(meetings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

app.put('/api/meetings/:id', async (req, res) => {
    try {
        const { status } = req.body; 
        const updated = await Meeting.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: 1 }); 
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { senderName, senderRole, text } = req.body;
        if (!text || text.trim() === '') return res.status(400).json({ message: 'Text is required' });

        const newMsg = new Message({ senderName, senderRole, text });
        await newMsg.save();
        res.status(201).json(newMsg);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

app.post('/api/student/register', async (req, res) => {
    try {
        const { fullName, email, password, researchTopic } = req.body;
        if (!fullName || !email || !password || !researchTopic) return res.status(400).json({ message: 'All fields are required' });
        
        const existingStudent = await Student.findOne({ email });
        if (existingStudent) return res.status(400).json({ message: 'Student already exists' });

        const newStudent = new Student({ fullName, email, password, researchTopic });
        await newStudent.save();

        res.status(201).json({ message: 'Student registered successfully', student: newStudent });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

app.post('/api/student/login', async (req, res) => {
    try {
        const email = req.body.email?.trim();
        const password = req.body.password;
        const student = await Student.findOne({ 
            email: { $regex: new RegExp(`^${email}$`, 'i') }, 
            password 
        });
        if (!student) return res.status(401).json({ message: 'Invalid credentials' });
        
        res.json({ message: 'Login successful', student });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

app.post('/api/admin/register', async (req, res) => {
    try {
        const { fullName, department, email, password } = req.body;
        if (!fullName || !department || !email || !password) return res.status(400).json({ message: 'All fields are required' });
        
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) return res.status(400).json({ message: 'Guide already exists' });

        const newAdmin = new Admin({ fullName, department, email, password });
        await newAdmin.save();

        res.status(201).json({ message: 'Guide registered successfully', admin: newAdmin });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

app.post('/api/admin/login', async (req, res) => {
    try {
        const email = req.body.email?.trim();
        const password = req.body.password;
        const admin = await Admin.findOne({ 
            email: { $regex: new RegExp(`^${email}$`, 'i') }, 
            password 
        });
        if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
        
        res.json({ message: 'Login successful', admin });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

app.use((req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
    console.log(`API Server running securely on port ${PORT}`);
    console.log(`📘 Student API: /api/student/*`);
    console.log(`📙 Admin API: /api/admin/*`);
    console.log(`🎯 Milestone API: /api/milestones`);
});