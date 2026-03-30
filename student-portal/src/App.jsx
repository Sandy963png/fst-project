import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
function App() {
  const [currentView, setCurrentView] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [messages, setMessages] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [meetings, setMeetings] = useState([]);

  const [inputText, setInputText] = useState('');
  const [milestoneInput, setMilestoneInput] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [activeTab, setActiveTab] = useState('milestones');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [researchTopic, setResearchTopic] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || 'https://fst-project.onrender.com';

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/messages`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('hub_token')}` } });
      if (res.ok) setMessages(await res.json());
    } catch (err) { }
  }, [API_BASE]);

  const fetchMilestones = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/milestones/student/${currentUser.email}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('hub_token')}` } });
      if (res.ok) setMilestones(await res.json());
    } catch (err) { }
  }, [currentUser?.email, API_BASE]);

  const fetchMeetings = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/meetings/student/${currentUser.email}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('hub_token')}` } });
      if (res.ok) setMeetings(await res.json());
    } catch (err) { }
  }, [currentUser?.email, API_BASE]);

  useEffect(() => {
    let interval;
    if (currentView === 'dashboard') {
      fetchMessages();
      fetchMilestones();
      fetchMeetings();
      interval = setInterval(() => {
        fetchMessages();
        fetchMilestones();
        fetchMeetings();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [currentView, fetchMessages, fetchMilestones, fetchMeetings]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('hub_token')}` },
        body: JSON.stringify({ senderName: currentUser.fullName, senderRole: 'student', text: inputText })
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages(prev => [...prev, newMsg]);
        setInputText('');
      }
    } catch (err) { }
  };

  const submitMilestone = async () => {
    if (!milestoneInput.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('hub_token')}` },
        body: JSON.stringify({ title: milestoneInput, studentEmail: currentUser.email, studentName: currentUser.fullName })
      });
      if (res.ok) {
        const newMilestone = await res.json();
        setMilestones(prev => [...prev, newMilestone]);
        setMilestoneInput('');
      }
    } catch (err) { }
  };

  const requestMeeting = async () => {
    if (!meetingDate || !meetingTime) return;
    try {
      const res = await fetch(`${API_BASE}/api/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('hub_token')}` },
        body: JSON.stringify({
          studentEmail: currentUser.email,
          studentName: currentUser.fullName,
          date: meetingDate,
          time: meetingTime
        })
      });
      if (res.ok) {
        const newMeeting = await res.json();
        setMeetings(prev => [...prev, newMeeting]);
        setMeetingDate('');
        setMeetingTime('');
      }
    } catch (err) { }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/student/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('hub_token', data.token);
        setCurrentUser(data.student);
        setCurrentView('dashboard');
      } else setErrorMsg(data.message || 'Login failed');
    } catch (err) { setErrorMsg('Server connection failed.'); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/student/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, researchTopic })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('hub_token', data.token);
        setCurrentUser(data.student);
        setCurrentView('dashboard');
      } else setErrorMsg(data.message || 'Registration failed');
    } catch (err) { setErrorMsg('Server connection failed.'); }
  };

  const renderLogin = () => (
    <div className="auth-container">
      <div className="glass-panel auth-card zoom-in">
        <h2 className="title">Student Portal</h2>
        <p className="subtitle">PG/PhD Guide Hub</p>
        {errorMsg && <p style={{ color: '#ef4444', marginBottom: '10px' }}>{errorMsg}</p>}
        <form onSubmit={handleLogin}>
          <div className="input-group"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="input-group"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
          <button type="submit" className="primary-btn">Sign In</button>
        </form>
        <p className="switch-text">New researcher? <span onClick={() => { setCurrentView('register'); setErrorMsg(''); }} className="link">Register here</span></p>
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="auth-container">
      <div className="glass-panel auth-card fade-in">
        <h2 className="title">Join the Hub</h2>
        <p className="subtitle">Create your researcher account</p>
        {errorMsg && <p style={{ color: '#ef4444', marginBottom: '10px' }}>{errorMsg}</p>}
        <form onSubmit={handleRegister}>
          <div className="input-group"><label>Full Name</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required /></div>
          <div className="input-group"><label>Research Topic</label><input type="text" value={researchTopic} onChange={e => setResearchTopic(e.target.value)} required /></div>
          <div className="input-group"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div className="input-group"><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
          <button type="submit" className="primary-btn">Register</button>
        </form>
        <p className="switch-text">Already registered? <span onClick={() => { setCurrentView('login'); setErrorMsg(''); }} className="link">Login</span></p>
      </div>
    </div>
  );

  const renderDashboardContent = () => {
    switch (activeTab) {
      case 'milestones':
        const pending = milestones.filter(m => m.status === 'pending');
        const revision = milestones.filter(m => m.status === 'revision');
        const approved = milestones.filter(m => m.status === 'approved');
        return (
          <div className="tab-content fade-in">
            <h3>Research Milestone Tracker</h3>
            <div className="input-group row" style={{ marginTop: '20px', maxWidth: '500px' }}>
              <input type="text" value={milestoneInput} onChange={e => setMilestoneInput(e.target.value)} placeholder="E.g., Finished Chapter 2" style={{ width: '70%' }} />
              <button className="primary-btn" onClick={submitMilestone} style={{ width: '30%' }}>Submit Stage</button>
            </div>
            <div className="kanban-board">
              <div className="kanban-col">
                <h4>Pending Approvals</h4>
                {pending.map(m => <div className="kanban-card" key={m._id}>{m.title}</div>)}
              </div>
              <div className="kanban-col">
                <h4>Needs Revision</h4>
                {revision.map(m => <div className="kanban-card" style={{ borderLeftColor: '#f59e0b' }} key={m._id}>{m.title}</div>)}
              </div>
              <div className="kanban-col">
                <h4>Approved</h4>
                {approved.map(m => <div className="kanban-card" style={{ borderLeftColor: '#10b981', opacity: 0.7 }} key={m._id}>{m.title}</div>)}
              </div>
            </div>
          </div>
        );
      case 'meetings':
        return (
          <div className="tab-content fade-in">
            <h3>Meeting Scheduler</h3>
            <p>Request 1-on-1 reviews with your guide.</p>
            <div className="meeting-form" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} />
              <input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} />
              <button className="primary-btn" style={{ width: 'auto' }} onClick={requestMeeting}>Request</button>
            </div>

            <h4 style={{ marginTop: '30px' }}>Your Requested Meetings</h4>
            {meetings.length === 0 && <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No meeting requests submitted yet.</p>}
            <div className="upcoming-meetings" style={{ marginTop: '10px' }}>
              {meetings.map((m) => (
                <div key={m._id} className="meeting-card" style={m.status === 'accepted' ? { borderLeft: '4px solid #10b981' } : m.status === 'rejected' ? { borderLeft: '4px solid #ef4444' } : {}}>
                  {m.date} at {m.time}
                  <span style={{ float: 'right', fontWeight: 'bold', color: m.status === 'accepted' ? '#10b981' : m.status === 'rejected' ? '#ef4444' : '#f59e0b' }}>
                    {m.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'qa':
        return (
          <div className="tab-content fade-in">
            <h3>Q&A Board (Live Communication)</h3>
            <div className="chat-box">
              {messages.length === 0 && <p style={{ textAlign: 'center', color: '#9ca3af', marginTop: '2rem' }}>No messages yet.</p>}
              {messages.map((msg, idx) => (
                <div key={msg._id || idx} className={`msg ${msg.senderRole === 'guide' ? 'guide' : 'student'}`} style={msg.senderRole === 'student' ? { alignSelf: 'flex-end', marginLeft: 'auto' } : {}}>
                  <strong>{msg.senderName} <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: msg.senderRole === 'guide' ? '#f3f4f6' : '#ffffff33', color: msg.senderRole === 'guide' ? '#800000' : '#ffffff' }}>{msg.senderRole === 'guide' ? 'Guide' : 'Student'}</span>:</strong> {msg.text}
                </div>
              ))}
            </div>
            <div className="input-group row"><input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyUp={(e) => e.key === 'Enter' && sendMessage()} placeholder="Message..." style={{ width: '80%' }} /><button className="primary-btn" onClick={sendMessage} style={{ width: '20%' }}>Send</button></div>
          </div>
        );
      default: return null;
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-container">
      <nav className="glass-panel sidebar">
        <h2 className="logo">Hub</h2>
        <ul className="nav-links">
          <li className={activeTab === 'milestones' ? 'active' : ''} onClick={() => setActiveTab('milestones')}>🎯 Milestones</li>
          <li className={activeTab === 'meetings' ? 'active' : ''} onClick={() => setActiveTab('meetings')}>📅 Meetings</li>
          <li className={activeTab === 'qa' ? 'active' : ''} onClick={() => setActiveTab('qa')}>💬 Q&A Board</li>
        </ul>
        <button onClick={() => { localStorage.removeItem('hub_token'); setCurrentUser(null); setCurrentView('login'); }} className="logout-btn">Log Out</button>
      </nav>
      <main className="dashboard-main">
        <header className="glass-panel header">
          <h1>Student Workspace</h1>
          <div className="user-profile" style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{currentUser?.fullName?.charAt(0) || 'U'}</div>
            {currentUser?.fullName || 'Student'}
          </div>
        </header>
        <div className="glass-panel main-content">{renderDashboardContent()}</div>
      </main>
    </div>
  );

  return (
    <div className="app-root">
      {currentView === 'login' && renderLogin()}
      {currentView === 'register' && renderRegister()}
      {currentView === 'dashboard' && renderDashboard()}
    </div>
  );
}

export default App;
