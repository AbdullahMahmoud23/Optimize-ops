#!/usr/bin/env node

/**
 * INSTRUCTIONS: How to convert audio files to MP3
 * 
 * This document provides step-by-step instructions to convert the audio files
 * in the uploads folder to MP3 format.
 * 
 * REQUIREMENTS:
 * - FFmpeg must be installed on your system
 * 
 * INSTALLATION INSTRUCTIONS:
 * 
 * Windows:
 * --------
 * 1. Visit https://ffmpeg.org/download.html
 * 2. Click "Windows builds from gyan.dev"
 * 3. Download the full build (ffmpeg-release-full.zip)
 * 4. Extract to a folder (e.g., C:\ffmpeg)
 * 5. Add C:\ffmpeg\bin to your Windows PATH:
 *    - Open Environment Variables (search "environment" in Windows)
 *    - Click "Environment Variables"
 *    - Under "System variables", click "Path", then "Edit"
 *    - Click "New" and add: C:\ffmpeg\bin
 *    - Click OK and restart your terminal
 * 6. Verify installation by running: ffmpeg -version
 * 
 * Mac:
 * ----
 * Using Homebrew:
 * brew install ffmpeg
 * 
 * Linux (Ubuntu/Debian):
 * ----
 * sudo apt-get install ffmpeg
 * 
 * USAGE:
 * ------
 * Once FFmpeg is installed, run:
 * 
 *   node convert-to-mp3.js
 * 
 * This will:
 * 1. Scan the uploads/ folder
 * 2. Convert all audio files to MP3 format
 * 3. Save MP3 files to uploads/mp3/ folder
 * 4. Display a summary of converted files
 * 
 * ALTERNATIVE: Manual Conversion
 * --------------------------------
 * To convert individual files manually:
 * 
 *   ffmpeg -i uploads/filename -q:a 5 uploads/mp3/filename.mp3
 * 
 * Or convert all files at once:
 * 
 *   for /r uploads %f in (*) do ffmpeg -i "%f" -q:a 5 "uploads/mp3/%~nxf.mp3"
 * 
 * CONFIGURATION:
 * ---------------
 * You can modify the convert-to-mp3.js script to change:
 * - Audio bitrate (currently 192k): change .audioBitrate('192k')
 * - Audio channels (currently 2): change .audioChannels(2)
 * - Output folder: modify the mp3Dir variable
 */

console.log(`
╔════════════════════════════════════════════════════════════╗
║         AUDIO TO MP3 CONVERSION - SETUP GUIDE             ║
╚════════════════════════════════════════════════════════════╝

STEP 1: Install FFmpeg
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Windows: Download from https://ffmpeg.org/download.html
Mac:     brew install ffmpeg
Linux:   sudo apt-get install ffmpeg

STEP 2: Verify Installation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run in terminal: ffmpeg -version

STEP 3: Run Conversion Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Run: node convert-to-mp3.js

This will convert all files in:
  📁 backend/uploads/
to:
  📁 backend/uploads/mp3/

CONFIGURATION OPTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Edit convert-to-mp3.js to customize:
  • Bitrate: .audioBitrate('192k')  // Change to 128k, 256k, etc.
  • Channels: .audioChannels(2)     // 1 for mono, 2 for stereo
  • Output path: mp3Dir variable

TROUBLESHOOTING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Q: "ffmpeg is not recognized"
A: Make sure FFmpeg is installed and added to PATH, then restart terminal

Q: "fluent-ffmpeg not installed"
A: Run: npm install (in backend folder)

Q: Conversion is slow
A: This is normal for large files. Be patient or reduce bitrate.

Need Help? Check:
  • https://ffmpeg.org/documentation.html
  • https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
`);
