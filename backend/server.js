const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const speech = require('@google-cloud/speech');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// إعداد قاعدة البيانات (استبدل بالبيانات الخاصة بك)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root1234',
  database: 'factory_db'
});

// إعداد رفع الملفات
const upload = multer({ dest: 'uploads/' });

// Middleware للتحقق من JWT
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).send('No token provided');
  jwt.verify(token, 'your_secret_key', (err, decoded) => {
    if (err) return res.status(401).send('Invalid token');
    req.userId = decoded.id;
    next();
  });
};
app.post('/api/signup', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send('Missing fields');

  db.query('INSERT INTO Operators (Email, Password) VALUES (?, ?)', [email, password], (err, result) => {
    if (err) return res.status(500).send('Error creating user');
    res.send({ message: 'User created successfully' });
  });
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check admins
    let [results] = await db.promise().query(
      'SELECT * FROM admins WHERE email = ? AND password = ?',
      [email, password]
    );
    
    if (results.length > 0) {
      const token = jwt.sign(
        { id: results[0].id, role: 'admin' },
        'your_secret_key',
        { expiresIn: '24h' }
      );
      console.log('✓ Admin login success');
      return res.json({ 
        token, 
        role: 'admin',
        user: { id: results[0].id, email: results[0].email }
      });
    }

    // Check supervisors
    [results] = await db.promise().query(
      'SELECT * FROM supervisors WHERE email = ? AND password = ?',
      [email, password]
    );
    
    if (results.length > 0) {
      const token = jwt.sign(
        { id: results[0].id, role: 'supervisor' },
        'your_secret_key',
        { expiresIn: '24h' }
      );
      console.log('✓ Supervisor login success');
      return res.json({ 
        token, 
        role: 'supervisor',
        user: { id: results[0].id, email: results[0].email }
      });
    }

    // Check operators (technicians)
    [results] = await db.promise().query(
      'SELECT * FROM operators WHERE Email = ? AND Password = ?',
      [email, password]
    );
    
    if (results.length > 0) {
      const token = jwt.sign(
        { id: results[0].OperatorID, role: 'technician' },
        'your_secret_key',
        { expiresIn: '24h' }
      );
      console.log('✓ Technician login success');
      return res.json({ 
        token, 
        role: 'technician',
        user: { id: results[0].OperatorID, email: results[0].Email }
      });
    }

    console.log('✗ No match found for credentials');
    return res.status(401).json({ error: 'Invalid credentials' });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// API لرفع التسجيلات الصوتية
app.post('/api/recordings', verifyToken, upload.single('audio'), async (req, res) => {
  const { shift, type } = req.body;
  const audioPath = req.file.path;
  const operatorId = req.userId;

  try {
    const client = new speech.SpeechClient();
    const audio = { content: fs.readFileSync(audioPath).toString('base64') };
    const config = { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: 'ar-SA' };
    const request = { audio, config };
    const [response] = await client.recognize(request);
    const transcript = response.results.map(result => result.alternatives[0].transcript).join('\n');

    db.query('INSERT INTO Recordings (OperatorID, Shift, Type, Transcript, AudioPath) VALUES (?, ?, ?, ?, ?)', 
      [operatorId, shift, type, transcript, audioPath], (err, result) => {
        if (err) return res.status(500).send('Error saving recording');
        
        // إنشاء تقييم تلقائي (مقارنة مع targets إذا كان مرتبطاً)
        const recordingId = result.insertId;
        // منطق بسيط: حساب نسبة بناءً على النص (يمكن تحسينه)
        const score = transcript.includes('إنجاز') ? 90 : 60; // مثال
        db.query('INSERT INTO Evaluations (RecordingID, Score, Details) VALUES (?, ?, ?)', [recordingId, score, 'مقارنة أساسية']);
        
        res.send({ message: 'Recording saved and transcribed', transcript });
      });
  } catch (error) {
    res.status(500).send('Error processing audio');
  }
});

// API لاسترجاع التقييمات
app.get('/api/evaluations', verifyToken, (req, res) => {
  db.query('SELECT * FROM Evaluations WHERE RecordingID IN (SELECT RecordingID FROM Recordings WHERE OperatorID = ?)', [req.userId], (err, results) => {
    if (err) return res.status(500).send('Error fetching evaluations');
    res.json(results);
  });
});

// API لاسترجاع التوقفات (لإدارة التخطيط)
app.get('/api/stops', verifyToken, (req, res) => {
  db.query('SELECT * FROM Stops WHERE OperatorID = ?', [req.userId], (err, results) => {
    if (err) return res.status(500).send('Error fetching stops');
    res.json(results);
  });
});

app.listen(3000, () => console.log('Backend running on port 3000'));