const fs = require('fs');
const path = require('path');

// Try to use fluent-ffmpeg, but provide helpful error message if ffmpeg not installed
let ffmpeg;
try {
  ffmpeg = require('fluent-ffmpeg');
  // Try to use ffmpeg-static if available
  try {
    const ffmpegStatic = require('ffmpeg-static');
    ffmpeg.setFfmpegPath(ffmpegStatic);
  } catch (e) {
    // ffmpeg-static not available, will try system ffmpeg
  }
} catch (e) {
  console.error('fluent-ffmpeg not installed. Please run: npm install');
  process.exit(1);
}

const uploadsDir = path.join(__dirname, 'uploads');
const mp3Dir = path.join(__dirname, 'uploads', 'mp3');

// Create mp3 directory if it doesn't exist
if (!fs.existsSync(mp3Dir)) {
  fs.mkdirSync(mp3Dir, { recursive: true });
  console.log('Created mp3 directory:', mp3Dir);
}

console.log('FFMPEG CONVERSION UTILITY');
console.log('========================\n');
console.log('IMPORTANT: ffmpeg must be installed on your system');
console.log('To install ffmpeg on Windows:');
console.log('1. Download from: https://ffmpeg.org/download.html');
console.log('2. Extract to a folder (e.g., C:\\ffmpeg)');
console.log('3. Add the bin folder to Windows PATH environment variable');
console.log('4. Restart your terminal and try again\n');

// Get all files in uploads directory
fs.readdir(uploadsDir, (err, files) => {
  if (err) {
    console.error('Error reading uploads directory:', err);
    return;
  }

  // Filter out subdirectories and only process actual audio files
  const audioFiles = files.filter(file => {
    const fullPath = path.join(uploadsDir, file);
    const stats = fs.statSync(fullPath);
    return stats.isFile();
  });

  if (audioFiles.length === 0) {
    console.log('No audio files found in uploads directory');
    return;
  }

  console.log(`Found ${audioFiles.length} files to convert to MP3\n`);
  let convertedCount = 0;
  let failedCount = 0;

  audioFiles.forEach((file, index) => {
    const inputPath = path.join(uploadsDir, file);
    const outputPath = path.join(mp3Dir, `${file}.mp3`);

    console.log(`[${index + 1}/${audioFiles.length}] Converting: ${file}`);

    ffmpeg(inputPath)
      .audioBitrate('192k')
      .audioChannels(2)
      .audioCodec('libmp3lame')
      .output(outputPath)
      .on('end', () => {
        convertedCount++;
        console.log(`  ✓ Successfully saved to: ${file}.mp3`);
        if (convertedCount + failedCount === audioFiles.length) {
          printSummary();
        }
      })
      .on('error', (err) => {
        failedCount++;
        console.error(`  ✗ Failed: ${err.message}`);
        if (convertedCount + failedCount === audioFiles.length) {
          printSummary();
        }
      })
      .run();
  });

  function printSummary() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('CONVERSION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Successfully converted: ${convertedCount}/${audioFiles.length}`);
    console.log(`Failed: ${failedCount}/${audioFiles.length}`);
    console.log(`\nMP3 files location: ${mp3Dir}`);
    console.log('='.repeat(60));
    
    // List all mp3 files created
    fs.readdir(mp3Dir, (err, mp3Files) => {
      if (!err && mp3Files.length > 0) {
        console.log('\nGenerated MP3 files:');
        mp3Files.forEach(mp3File => {
          const filePath = path.join(mp3Dir, mp3File);
          const stats = fs.statSync(filePath);
          const sizeKB = (stats.size / 1024).toFixed(2);
          console.log(`  • ${mp3File} (${sizeKB} KB)`);
        });
      }
    });
  }
});
