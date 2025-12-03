/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const cors = require("cors");
const fs = require("node:fs");
const path = require("node:path");
const jwt = require("jsonwebtoken");
// const { OAuth2Client } = require("google-auth-library");
const { transcribeAudio, analyzePerformance } = require('./aiLogic');
require("dotenv").config();

let ffmpeg;
try {
  ffmpeg = require("fluent-ffmpeg");
  const ffmpegStatic = require("ffmpeg-static");
  ffmpeg.setFfmpegPath(ffmpegStatic);
} catch {
  console.warn("⚠️  fluent-ffmpeg not installed. MP3 conversion disabled.");
}

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
// Serve uploaded audio files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// إعداد قاعدة البيانات (استبدل بالبيانات الخاصة بك)
// Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'factory_db'
});

// إعداد رفع الملفات
const upload = multer({ dest: "uploads/" });

// Middleware للتحقق من JWT
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) {
    console.warn("⚠️  No token provided");
    return res.status(403).json({ error: "No token provided" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (!decoded.id) {
      return res.status(401).json({ error: "Token missing id field" });
    }
    req.userId = decoded.id;
    next();
  });
};


//================================================
// ------------------ API ROUTES -----------------
//================================================
// Google OAuth Login Endpoint
// app.post("/api/auth/google", async (req, res) => {
//   try {
//     const { token } = req.body;

//     if (!token) {
//       return res.status(400).json({ error: "Token is required" });
//     }

//     // Verify the Google token
//     const ticket = await googleClient.verifyIdToken({
//       idToken: token,
//       audience: GOOGLE_CLIENT_ID,
//     });

//     const payload = ticket.getPayload();
//     const email = payload.email;
//     const googleId = payload.sub;
//     const name = payload.name;

//     console.log("=== GOOGLE LOGIN ===");
//     console.log("Email:", email);
//     console.log("Google ID:", googleId);

//     // Check if user exists in database, if not create them
//     let [results] = await db
//       .promise()
//       .query("SELECT * FROM operators WHERE Email = ?", [email]);

//     let userId;
//     if (results.length === 0) {
//       // Create new user. Try inserting GoogleID; if the column doesn't exist, fallback.
//       let insertResult;
//       try {
//         [insertResult] = await db
//           .promise()
//           .query(
//             "INSERT INTO operators (Email, Password, GoogleID) VALUES (?, ?, ?)",
//             [email, "google_oauth", googleId]
//           );
//       } catch (err) {
//         // ER_BAD_FIELD_ERROR => unknown column (schema missing GoogleID)
//         if (err && err.code === "ER_BAD_FIELD_ERROR") {
//           console.warn(
//             "GoogleID column not found in operators table, inserting without it"
//           );
//           [insertResult] = await db
//             .promise()
//             .query("INSERT INTO operators (Email, Password) VALUES (?, ?)", [
//               email,
//               "google_oauth",
//             ]);
//         } else {
//           throw err;
//         }
//       }
//       userId = insertResult.insertId;
//       console.log("✓ New user created via Google");
//     } else {
//       userId = results[0].OperatorID;
//       // Update Google ID if not set
//       if (!results[0].GoogleID) {
//         try {
//           await db
//             .promise()
//             .query("UPDATE operators SET GoogleID = ? WHERE Email = ?", [
//               googleId,
//               email,
//             ]);
//         } catch (err) {
//           if (err && err.code === "ER_BAD_FIELD_ERROR") {
//             console.warn("GoogleID column not found; skipping update");
//           } else {
//             throw err;
//           }
//         }
//       }
//       console.log("✓ Existing user logged in via Google");
//     }

//     // Create JWT token
//     const jwtToken = jwt.sign(
//       { id: userId, role: "technician", email: email },
//       "your_secret_key",
//       { expiresIn: "24h" }
//     );

//     return res.json({
//       token: jwtToken,
//       role: "technician",
//       user: { id: userId, email: email, name: name },
//     });
//   } catch (error) {
//     // Log full error for debugging (development only)
//     console.error(
//       "Google auth error:",
//       error && error.message ? error.message : error
//     );
//     console.error(error && error.stack ? error.stack : "no-stack");
//     // Return error message to client to help debugging locally
//     return res
//       .status(401)
//       .json({
//         error: "Invalid token or authentication failed",
//         details: error && error.message ? error.message : null,
//       });
//   }
// });

app.post("/api/signup", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send("Missing fields");

  db.query(
    "INSERT INTO Operators (Email, Password) VALUES (?, ?)",
    [email, password],
    (err, result) => {
      if (err) return res.status(500).send("Error creating user");
      res.send({ message: "User created successfully" });
    }
  );
});

// -- Technician: fetch targets for current user
app.get("/api/technician/targets", verifyToken, async (req, res) => {
  try {
    // Try to fetch targets joined with achievements for this operator
    const sql = `SELECT t.TargetID, t.Name AS TargetName, t.TargetValue, IFNULL(a.Achievement, 0) AS Achievement
                 FROM Targets t
                 LEFT JOIN TargetAchievements a ON t.TargetID = a.TargetID AND a.OperatorID = ?`;
    const [rows] = await db.promise().query(sql, [req.userId]);
    return res.json(rows);
  } catch (err) {
    // If tables don't exist in the user's schema, return empty list (graceful fallback)
    if (
      err &&
      (err.code === "ER_NO_SUCH_TABLE" || err.code === "ER_BAD_TABLE_ERROR")
    ) {
      console.warn("Targets table missing:", err.message || err);
      return res.json([]);
    }
    console.error("Error fetching targets:", err);
    return res.status(500).json({ error: "Error fetching targets" });
  }
});

// -- Technician: update achievement for a target (upsert)
app.post(
  "/api/technician/targets/:targetId/achievement",
  verifyToken,
  async (req, res) => {
    const targetId = req.params.targetId;
    const { achievement } = req.body;
    if (achievement == null)
      return res.status(400).json({ error: "Missing achievement value" });
    try {
      // Try update, otherwise insert
      const updateSql =
        "UPDATE TargetAchievements SET Achievement = ? WHERE TargetID = ? AND OperatorID = ?";
      const [updateRes] = await db
        .promise()
        .query(updateSql, [achievement, targetId, req.userId]);
      if (updateRes.affectedRows === 0) {
        const insertSql =
          "INSERT INTO TargetAchievements (TargetID, OperatorID, Achievement) VALUES (?, ?, ?)";
        await db
          .promise()
          .query(insertSql, [targetId, req.userId, achievement]);
      }
      return res.json({ ok: true });
    } catch (err) {
      if (err && err.code === "ER_NO_SUCH_TABLE") {
        console.warn("TargetAchievements table missing:", err.message || err);
        return res
          .status(500)
          .json({ error: "Target tracking not set up on the server" });
      }
      console.error("Error updating achievement:", err);
      return res.status(500).json({ error: "Error updating achievement" });
    }
  }
);

// -- Technician: list recordings for current user
app.get("/api/recordings", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      "SELECT * FROM Recordings WHERE OperatorID = ? ORDER BY RecordingID DESC",
      [req.userId]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

// -- Technician: get single recording metadata
app.get("/api/recordings/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await db
      .promise()
      .query(
        "SELECT RecordingID, Shift, Type, Transcript, AudioPath, CreatedAt FROM Recordings WHERE RecordingID = ? AND OperatorID = ?",
        [id, req.userId]
      );
    if (rows.length === 0)
      return res.status(404).json({ error: "Recording not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching recording:", err);
    return res.status(500).json({ error: "Error fetching recording" });
  }
});

// Create recording metadata without audio (useful when audio is optional)
// app.post("/api/recordings/metadata", verifyToken, async (req, res) => {
//   try {
//     const { shift, type, date } = req.body; // date optional (YYYY-MM-DD)
//     console.log("[DEBUG] /api/recordings/metadata - received:", {
//       userId: req.userId,
//       shift,
//       type,
//       date,
//     });

//     // Try to insert with CreatedAt
//     let sql =
//       "INSERT INTO Recordings (OperatorID, Shift, Type, AudioPath, Transcript, CreatedAt) VALUES (?, ?, ?, NULL, NULL, ?)";
//     let createdAt = date ? date + " 00:00:00" : new Date();
//     let params = [req.userId, shift || null, type || null, createdAt];

//     console.log("[DEBUG] Trying query:", sql, "with params:", params);

//     try {
//       const [result] = await db.promise().query(sql, params);
//       console.log("[DEBUG] ✓ Insert successful, recordingId:", result.insertId);
//       return res.json({ ok: true, recordingId: result.insertId });
//     } catch (err1) {
//       // If CreatedAt column doesn't exist, try without it
//       console.warn("[WARN] CreatedAt error:", err1.code, err1.message);
//       sql =
//         "INSERT INTO Recordings (OperatorID, Shift, Type, AudioPath, Transcript) VALUES (?, ?, ?, NULL, NULL)";
//       params = [req.userId, shift || null, type || null];

//       console.log(
//         "[DEBUG] Retrying without CreatedAt:",
//         sql,
//         "with params:",
//         params
//       );

//       const [result] = await db.promise().query(sql, params);
//       console.log("[DEBUG] ✓ Retry successful, recordingId:", result.insertId);
//       return res.json({ ok: true, recordingId: result.insertId });
//     }
//   } catch (err) {
//     console.error("[ERROR] Recording metadata creation failed:", {
//       code: err.code,
//       message: err.message,
//       sql: err.sql,
//       errno: err.errno,
//     });
//     return res.status(500).json({
//       error: "Error creating recording metadata",
//       details: err.message,
//       code: err.code,
//     });
//   }
// });

// Stream audio file for a recording (supports Range requests)
app.get("/api/recordings/:id/audio", verifyToken, async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await db
      .promise()
      .query(
        "SELECT AudioPath FROM Recordings WHERE RecordingID = ? AND OperatorID = ?",
        [id, req.userId]
      );
    if (rows.length === 0)
      return res.status(404).json({ error: "Recording not found" });
    const audioPath = rows[0].AudioPath;
    if (!audioPath)
      return res
        .status(404)
        .json({ error: "No audio file for this recording" });

    // Resolve to absolute path under uploads directory (prevent path traversal)
    const absolutePath = path.isAbsolute(audioPath)
      ? audioPath
      : path.join(__dirname, audioPath);
    if (!absolutePath.startsWith(path.join(__dirname, "uploads"))) {
      // Ensure we only serve files from uploads folder
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!fs.existsSync(absolutePath))
      return res.status(404).json({ error: "Audio file not found" });

    const stat = fs.statSync(absolutePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = "audio/wav";

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      if (start >= fileSize || end >= fileSize) {
        res.status(416).set("Content-Range", `bytes */${fileSize}`).end();
        return;
      }
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": contentType,
      });
      const stream = fs.createReadStream(absolutePath, { start, end });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": contentType,
      });
      const stream = fs.createReadStream(absolutePath);
      stream.pipe(res);
    }
  } catch (err) {
    console.error("Error streaming audio:", err);
    return res.status(500).json({ error: "Error streaming audio" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email:", email);

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check admins
    let [results] = await db
      .promise()
      .query("SELECT * FROM admins WHERE email = ? AND password = ?", [
        email,
        password,
      ]);

    if (results.length > 0) {
      const token = jwt.sign(
        { id: results[0].id, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );
      console.log("✓ Admin login success");
      return res.json({
        token,
        role: "admin",
        user: { id: results[0].id, email: results[0].email },
      });
    }

    // Check supervisors
    [results] = await db
      .promise()
      .query("SELECT * FROM supervisors WHERE email = ? AND password = ?", [
        email,
        password,
      ]);

    if (results.length > 0) {
      const token = jwt.sign(
        { id: results[0].id, role: "supervisor" },
        process.env.JWT_SECRET || "",
        { expiresIn: "24h" }
      );
      console.log("✓ Supervisor login success");
      return res.json({
        token,
        role: "supervisor",
        user: { id: results[0].id, email: results[0].email },
      });
    }

    // Check operators (technicians)
    [results] = await db
      .promise()
      .query("SELECT * FROM operators WHERE Email = ? AND Password = ?", [
        email,
        password,
      ]);

    if (results.length > 0) {
      const token = jwt.sign(
        { id: results[0].OperatorID, role: "technician" },
        process.env.JWT_SECRET || "",
        { expiresIn: "24h" }
      );
      console.log("✓ Technician login success");
      return res.json({
        token,
        role: "technician",
        user: { id: results[0].OperatorID, email: results[0].Email },
      });
    }

    console.log("✗ No match found for credentials");
    return res.status(401).json({ error: "Invalid credentials" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// API لرفع التسجيلات الصوتية
app.post(
  "/api/recordings",
  verifyToken,
  upload.single("audio"),
  async (req, res) => {
    try {
      // Validate file upload
      if (!req.file) return res.status(400).json({ error: "No audio file uploaded" });

      const { shift, type } = req.body;
      const operatorId = req.userId;

      // Browsers send blobs without extensions. Groq needs an extension to work.
      const mimeType = req.file.mimetype || "audio/webm";
      let extension = ".webm"; // Default for Chrome recording
      if (mimeType.includes("wav")) extension = ".wav";
      if (mimeType.includes("mp4") || mimeType.includes("m4a")) extension = ".m4a";
      if (mimeType.includes("mpeg") || mimeType.includes("mp3")) extension = ".mp3";

      const originalPath = req.file.path;
      const newPath = `${req.file.path}${extension}`;
      
      // Rename file so Groq recognizes it
      fs.renameSync(originalPath, newPath);

      console.log(`🎤 Processing Recording (User ${operatorId}) - Format: ${extension}`);

      // --- CALL AI LOGIC ---
      const transcript = await transcribeAudio(newPath);

      let aiAnalysis = { score: 50, details: "No transcript detected", tasks: [] };
      if (transcript) {
          aiAnalysis = await analyzePerformance(transcript);
      }

      // --- SAVE TO DATABASE ---
      
      // A. Save Recording
      const insertRecSql = "INSERT INTO Recordings (OperatorID, Shift, Type, Transcript, AudioPath) VALUES (?, ?, ?, ?, ?)";
      const [recResult] = await db.promise().query(insertRecSql, [operatorId, shift, type, transcript, newPath]);
      const recordingId = recResult.insertId;

      // B. Save Evaluation (FIX 1: Corrected Variable Names)
      if (transcript) {
        try {
          await db.promise().query(
            "INSERT INTO Evaluations (RecordingID, Score, Details) VALUES (?, ?, ?)",
            [recordingId, aiAnalysis.score, aiAnalysis.details]
          );
          console.log("✓ Evaluation saved to DB");
        } catch (dbError) {
          console.warn("Could not insert evaluation:", dbError.message);
        }
      }

      // Convert to MP3 if ffmpeg is available
      if (ffmpeg) {
        const mp3Dir = path.join(__dirname, "uploads", "mp3");
        if (!fs.existsSync(mp3Dir)) fs.mkdirSync(mp3Dir, { recursive: true });
        
        const mp3Path = path.join(mp3Dir, `recording_${recordingId}.mp3`);
        ffmpeg(newPath)
          .audioBitrate("128k")
          .save(mp3Path)
          .on("error", (err) => console.warn("MP3 warning:", err.message));
      }

      // --- SEND RESPONSE ---
      return res.json({
        message: "Recording processed successfully",
        transcript,
        analysis: aiAnalysis,
        recordingId
      });
    } catch (error) {
      console.error("❌ Error processing audio:", error);
      res.status(500).json({ error: "Server error processing file" });
    }
  }
);

// API لاسترجاع التقييمات
app.get("/api/evaluations", verifyToken, (req, res) => {
  db.query(
    "SELECT * FROM Evaluations WHERE RecordingID IN (SELECT RecordingID FROM Recordings WHERE OperatorID = ?)",
    [req.userId],
    (err, results) => {
      if (err) return res.status(500).send("Error fetching evaluations");
      res.json(results);
    }
  );
});

// API لاسترجاع التوقفات (لإدارة التخطيط)
app.get("/api/stops", verifyToken, (req, res) => {
  db.query(
    "SELECT * FROM Stops WHERE OperatorID = ?",
    [req.userId],
    (err, results) => {
      if (err) return res.status(500).send("Error fetching stops");
      res.json(results);
    }
  );
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log("Backend running on port 3000"));

/*

تمام يا بشمهندس، أنا خلصت صيانة المكنة رقم خمسة، وغيرت الزيت والسيور، والمكنة شغالة زي الفل.
أنا وصلت الأوردر للعميل في المعادي، واستلمت المبلغ كاش، وحالياً أنا راجع على المخزن عشان أسلم العهده.
النهاردة خلصت تقرير المبيعات الشهري وبعته للإدارة.اشتغلت النهاردة حوالي 8 ساعات في المكتب.
فيه مشكلة كبيرة النهاردة. العربية عطلت مني على الطريق الدائري والونش اتأخر، فمعرفتش أكمل باقي الشغل.
أنا سلمت الوردية لزميلي أحمد، وكل حاجة تمام ومفيش أي مشاكل واجهتنا طول اليوم.
*/