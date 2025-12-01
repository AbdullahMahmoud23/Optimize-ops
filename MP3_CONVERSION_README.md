# Audio MP3 Conversion Setup Guide

## Overview
This guide explains how to convert existing audio recordings to MP3 format and automatically save new recordings as MP3 files.

## Directory Structure
```
backend/
├── uploads/              # Original audio files
│   ├── 92c4c340342a3dc0201090409c0c9bda
│   ├── ab84443b2eaec53f51104ae415a3ca21
│   ├── d07df544ad43a8eb21e17556d18c8fdf
│   └── mp3/             # MP3 files (created by conversion script)
├── convert-to-mp3.js    # Conversion script
└── server.js            # Updated with MP3 support
```

## Prerequisites

### Step 1: Install FFmpeg

**Windows:**
1. Visit https://ffmpeg.org/download.html
2. Click "Windows builds from gyan.dev"
3. Download `ffmpeg-release-full.zip` (full build recommended)
4. Extract to a folder (e.g., `C:\ffmpeg`)
5. Add to Windows PATH:
   - Press `Win + X` → Search "Environment Variables"
   - Click "Edit the system environment variables"
   - Click "Environment Variables" button
   - Under "System variables", select "Path" and click "Edit"
   - Click "New" and add: `C:\ffmpeg\bin`
   - Click OK on all dialogs
   - **Restart your terminal/PowerShell**
6. Verify: Open new terminal and run:
   ```powershell
   ffmpeg -version
   ```

**macOS:**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install ffmpeg
```

### Step 2: Install Node Packages

```bash
cd backend
npm install
```

This will install `fluent-ffmpeg` which is used by the conversion script.

## Converting Existing Files

### Automatic Batch Conversion

Run the conversion script to convert all files in `uploads/` folder to MP3:

```bash
cd backend
node convert-to-mp3.js
```

**Output:**
- Original files remain in `uploads/`
- Converted MP3 files are saved in `uploads/mp3/`
- Console will show progress and summary

### Example Output:
```
Found 4 files to convert to MP3

[1/4] Converting: 92c4c340342a3dc0201090409c0c9bda
  ✓ Successfully saved to: 92c4c340342a3dc0201090409c0c9bda.mp3
[2/4] Converting: ab84443b2eaec53f51104ae415a3ca21
  ✓ Successfully saved to: ab84443b2eaec53f51104ae415a3ca21.mp3
...

============================================================
CONVERSION SUMMARY
============================================================
Successfully converted: 4/4
Failed: 0/4

MP3 files location: C:\...\backend\uploads\mp3
============================================================
```

## Automatic MP3 Creation for New Recordings

When a new recording is uploaded via `/api/recordings` endpoint, the server will:
1. Save the original audio file
2. Automatically create an MP3 copy in `uploads/mp3/`
3. Name it as `recording_<recordingId>.mp3`

**Example:**
- Recording ID: 42
- MP3 file: `uploads/mp3/recording_42.mp3`

## Manual Conversion (Alternative)

If you prefer to convert files manually:

```bash
# Single file
ffmpeg -i uploads/filename -q:a 5 uploads/mp3/filename.mp3

# All files at once (Windows PowerShell)
Get-ChildItem uploads -File | ForEach-Object {
  ffmpeg -i $_.FullName -q:a 5 "uploads/mp3/$($_.Name).mp3"
}
```

## Configuration

Edit `convert-to-mp3.js` to customize conversion settings:

```javascript
ffmpeg(inputPath)
  .audioBitrate('192k')      // Change bitrate: 128k, 256k, 320k, etc.
  .audioChannels(2)          // 1 for mono, 2 for stereo
  .audioCodec('libmp3lame')
  .output(outputPath)
  .run();
```

**Bitrate Options:**
- `128k` - Lower quality, smaller file
- `192k` - Balanced (default)
- `256k` - Higher quality
- `320k` - Maximum MP3 quality

## Troubleshooting

### Error: "ffmpeg is not recognized"
**Solution:** 
- Verify FFmpeg is installed: `ffmpeg -version`
- Restart PowerShell/Terminal after adding to PATH
- Check Environment Variables (show path contents)

### Error: "fluent-ffmpeg not installed"
**Solution:**
```bash
cd backend
npm install
```

### Conversion is very slow
**Solution:**
- This is normal for large audio files
- Consider reducing bitrate in `convert-to-mp3.js`
- Close other applications to free up system resources

### MP3 files not created for new uploads
**Possible causes:**
- FFmpeg not installed
- `fluent-ffmpeg` not installed (`npm install`)
- Permissions issue in `uploads/` folder

**Debug:**
- Check server logs for warnings
- Manually test: `ffmpeg -i test.wav test.mp3`

## File Structure After Setup

```
backend/
├── uploads/
│   ├── 92c4c340342a3dc0201090409c0c9bda
│   ├── ab84443b2eaec53f51104ae415a3ca21
│   ├── d07df544ad43a8eb21e17556d18c8fdf
│   ├── 0661fd88ed7ae5e75d3b90331d8d1b75
│   └── mp3/
│       ├── 92c4c340342a3dc0201090409c0c9bda.mp3
│       ├── ab84443b2eaec53f51104ae415a3ca21.mp3
│       ├── d07df544ad43a8eb21e17556d18c8fdf.mp3
│       ├── 0661fd88ed7ae5e75d3b90331d8d1b75.mp3
│       └── recording_1.mp3      # Future uploads
```

## Next Steps

1. ✅ Install FFmpeg
2. ✅ Run `npm install` in backend
3. ✅ Run `node convert-to-mp3.js` to convert existing files
4. ✅ Restart server for automatic MP3 creation on new uploads
5. ✅ Access MP3 files from `uploads/mp3/` folder

## Support

For more information:
- FFmpeg Docs: https://ffmpeg.org/documentation.html
- fluent-ffmpeg: https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
