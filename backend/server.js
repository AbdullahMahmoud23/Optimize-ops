const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const speech = require('@google-cloud/speech');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
// Serve uploaded audio files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Google OAuth Client - استبدل بـ Google Client ID الخاص بك
// أو استخدم متغير البيئة: process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '694856927034-9mjh5nn6ifosdtbq9g1ms1hae60t0n96.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

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

// Google OAuth Login Endpoint
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const googleId = payload.sub;
    const name = payload.name;

    console.log('=== GOOGLE LOGIN ===');
    console.log('Email:', email);
    console.log('Google ID:', googleId);

    // Check if user exists in database, if not create them
    let [results] = await db.promise().query(
      'SELECT * FROM operators WHERE Email = ?',
      [email]
    );

    let userId;
    if (results.length === 0) {
      // Create new user. Try inserting GoogleID; if the column doesn't exist, fallback.
      let insertResult;
      try {
        [insertResult] = await db.promise().query(
          'INSERT INTO operators (Email, Password, GoogleID) VALUES (?, ?, ?)',
          [email, 'google_oauth', googleId]
        );
      } catch (err) {
        // ER_BAD_FIELD_ERROR => unknown column (schema missing GoogleID)
        if (err && err.code === 'ER_BAD_FIELD_ERROR') {
          console.warn('GoogleID column not found in operators table, inserting without it');
          [insertResult] = await db.promise().query(
            'INSERT INTO operators (Email, Password) VALUES (?, ?)',
            [email, 'google_oauth']
          );
        } else {
          throw err;
        }
      }
      userId = insertResult.insertId;
      console.log('✓ New user created via Google');
    } else {
      userId = results[0].OperatorID;
      // Update Google ID if not set
      if (!results[0].GoogleID) {
        try {
          await db.promise().query(
            'UPDATE operators SET GoogleID = ? WHERE Email = ?',
            [googleId, email]
          );
        } catch (err) {
          if (err && err.code === 'ER_BAD_FIELD_ERROR') {
            console.warn('GoogleID column not found; skipping update');
          } else {
            throw err;
          }
        }
      }
      console.log('✓ Existing user logged in via Google');
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      { id: userId, role: 'technician', email: email },
      'your_secret_key',
      { expiresIn: '24h' }
    );

    return res.json({
      token: jwtToken,
      role: 'technician',
      user: { id: userId, email: email, name: name }
    });

  } catch (error) {
    // Log full error for debugging (development only)
    console.error('Google auth error:', error && error.message ? error.message : error);
    console.error(error && error.stack ? error.stack : 'no-stack');
    // Return error message to client to help debugging locally
    return res.status(401).json({ error: 'Invalid token or authentication failed', details: error && error.message ? error.message : null });
  }
});

app.post('/api/signup', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send('Missing fields');

  db.query('INSERT INTO Operators (Email, Password) VALUES (?, ?)', [email, password], (err, result) => {
    if (err) return res.status(500).send('Error creating user');
    res.send({ message: 'User created successfully' });
  });
});

// -- Technician: fetch targets for current user
app.get('/api/technician/targets', verifyToken, async (req, res) => {
  try {
    // Try to fetch targets joined with achievements for this operator
    const sql = `SELECT t.TargetID, t.Name AS TargetName, t.TargetValue, IFNULL(a.Achievement, 0) AS Achievement
                 FROM Targets t
                 LEFT JOIN TargetAchievements a ON t.TargetID = a.TargetID AND a.OperatorID = ?`;
    const [rows] = await db.promise().query(sql, [req.userId]);
    return res.json(rows);
  } catch (err) {
    // If tables don't exist in the user's schema, return empty list (graceful fallback)
    if (err && (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_TABLE_ERROR')) {
      console.warn('Targets table missing:', err.message || err);
      return res.json([]);
    }
    console.error('Error fetching targets:', err);
    return res.status(500).json({ error: 'Error fetching targets' });
  }
});

// -- Technician: update achievement for a target (upsert)
app.post('/api/technician/targets/:targetId/achievement', verifyToken, async (req, res) => {
  const targetId = req.params.targetId;
  const { achievement } = req.body;
  if (achievement == null) return res.status(400).json({ error: 'Missing achievement value' });
  try {
    // Try update, otherwise insert
    const updateSql = 'UPDATE TargetAchievements SET Achievement = ? WHERE TargetID = ? AND OperatorID = ?';
    const [updateRes] = await db.promise().query(updateSql, [achievement, targetId, req.userId]);
    if (updateRes.affectedRows === 0) {
      const insertSql = 'INSERT INTO TargetAchievements (TargetID, OperatorID, Achievement) VALUES (?, ?, ?)';
      await db.promise().query(insertSql, [targetId, req.userId, achievement]);
    }
    return res.json({ ok: true });
  } catch (err) {
    if (err && err.code === 'ER_NO_SUCH_TABLE') {
      console.warn('TargetAchievements table missing:', err.message || err);
      return res.status(500).json({ error: 'Target tracking not set up on the server' });
    }
    console.error('Error updating achievement:', err);
    return res.status(500).json({ error: 'Error updating achievement' });
  }
});

// -- Technician: list recordings for current user
app.get('/api/recordings', verifyToken, async (req, res) => {
  try {
    // Optional filters: date (YYYY-MM-DD), shift, type
    const { date, shift, type } = req.query;
    let sql = 'SELECT RecordingID, Shift, Type, Transcript, AudioPath, CreatedAt FROM Recordings WHERE OperatorID = ?';
    const params = [req.userId];
    if (date) {
      sql += ' AND DATE(CreatedAt) = ?';
      params.push(date);
    }
    if (shift) {
      sql += ' AND Shift = ?';
      params.push(shift);
    }
    if (type) {
      sql += ' AND Type = ?';
      params.push(type);
    }
    sql += ' ORDER BY CreatedAt DESC';

    const [rows] = await db.promise().query(sql, params);
    return res.json(rows);
  } catch (err) {
    // Graceful fallback if column or table missing
    if (err && (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR')) {
      console.warn('Recordings table or columns missing:', err.message || err);
      try {
        // Attempt simpler query (no CreatedAt)
        const [rows] = await db.promise().query('SELECT RecordingID, Shift, Type, Transcript, AudioPath FROM Recordings WHERE OperatorID = ? ORDER BY RecordingID DESC', [req.userId]);
        return res.json(rows);
      } catch (innerErr) {
        console.error('Error fetching recordings fallback:', innerErr);
        return res.json([]);
      }
    }
    console.error('Error fetching recordings:', err);
    return res.status(500).json({ error: 'Error fetching recordings' });
  }
});

// -- Technician: get single recording metadata
app.get('/api/recordings/:id', verifyToken, async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await db.promise().query('SELECT RecordingID, Shift, Type, Transcript, AudioPath, CreatedAt FROM Recordings WHERE RecordingID = ? AND OperatorID = ?', [id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Recording not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching recording:', err);
    return res.status(500).json({ error: 'Error fetching recording' });
  }
});

// Create recording metadata without audio (useful when audio is optional)
app.post('/api/recordings/metadata', verifyToken, async (req, res) => {
  try {
    const { shift, type, date } = req.body; // date optional (YYYY-MM-DD)
    // Insert into Recordings; CreatedAt will default to NOW() if column set accordingly
    const sql = 'INSERT INTO Recordings (OperatorID, Shift, Type, AudioPath, Transcript, CreatedAt) VALUES (?, ?, ?, NULL, NULL, ? )';
    // If date provided, use that as CreatedAt else use NOW()
    const createdAt = date ? date + ' 00:00:00' : new Date();
    const [result] = await db.promise().query(sql, [req.userId, shift || null, type || null, createdAt]);
    return res.json({ ok: true, recordingId: result.insertId });
  } catch (err) {
    console.error('Error creating recording metadata:', err);
    return res.status(500).json({ error: 'Error creating recording metadata' });
  }
});

// Stream audio file for a recording (supports Range requests)
app.get('/api/recordings/:id/audio', verifyToken, async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await db.promise().query('SELECT AudioPath FROM Recordings WHERE RecordingID = ? AND OperatorID = ?', [id, req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Recording not found' });
    const audioPath = rows[0].AudioPath;
    if (!audioPath) return res.status(404).json({ error: 'No audio file for this recording' });

    // Resolve to absolute path under uploads directory (prevent path traversal)
    const absolutePath = path.isAbsolute(audioPath) ? audioPath : path.join(__dirname, audioPath);
    if (!absolutePath.startsWith(path.join(__dirname, 'uploads'))) {
      // Ensure we only serve files from uploads folder
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!fs.existsSync(absolutePath)) return res.status(404).json({ error: 'Audio file not found' });

    const stat = fs.statSync(absolutePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = 'audio/wav';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      if (start >= fileSize || end >= fileSize) {
        res.status(416).set('Content-Range', `bytes */${fileSize}`).end();
        return;
      }
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': contentType,
      });
      const stream = fs.createReadStream(absolutePath, { start, end });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType,
      });
      const stream = fs.createReadStream(absolutePath);
      stream.pipe(res);
    }
  } catch (err) {
    console.error('Error streaming audio:', err);
    return res.status(500).json({ error: 'Error streaming audio' });
  }
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
    // If file is not WAV/LINEAR16, skip transcription and save file only
    const mimetype = req.file.mimetype || '';
    let transcript = null;
    if (mimetype === 'audio/wav' || mimetype === 'audio/x-wav') {
      try {
        const client = new speech.SpeechClient();
        const audio = { content: fs.readFileSync(audioPath).toString('base64') };
        const config = { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: 'ar-SA' };
        const request = { audio, config };
        const [response] = await client.recognize(request);
        transcript = response.results.map(result => result.alternatives[0].transcript).join('\n');
      } catch (speechErr) {
        console.warn('Speech recognition failed, saving without transcript:', speechErr && speechErr.message ? speechErr.message : speechErr);
        transcript = null;
      }
    } else {
      console.info('Uploaded audio is not WAV, skipping transcription. mimetype=', mimetype);
    }

    // Insert recording (use promise API)
    const insertSql = 'INSERT INTO Recordings (OperatorID, Shift, Type, Transcript, AudioPath) VALUES (?, ?, ?, ?, ?)';
    const [result] = await db.promise().query(insertSql, [operatorId, shift, type, transcript, audioPath]);
    const recordingId = result.insertId;

    // Simple automatic evaluation (example)
    const score = transcript && transcript.includes('إنجاز') ? 90 : 60;
    try {
      await db.promise().query('INSERT INTO Evaluations (RecordingID, Score, Details) VALUES (?, ?, ?)', [recordingId, score, 'مقارنة أساسية']);
    } catch (evalErr) {
      console.warn('Could not insert evaluation:', evalErr && evalErr.message ? evalErr.message : evalErr);
    }

    if (transcript) {
      return res.json({ message: 'Recording saved and transcribed', transcript, recordingId });
    } else {
      return res.json({ message: 'Recording saved (no transcript)', recordingId });
    }
  } catch (error) {
    console.error('Error processing audio upload:', error);
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