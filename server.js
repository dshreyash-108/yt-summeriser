const express = require('express');
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');

const app = express();
app.use(cors());
app.use(express.json());

const transcriptCache = {}; // In-memory cache

// Utility to extract video ID
function extractVideoId(url) {
  const match = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
  return match ? match[1] : null;
}

app.post('/transcript', async (req, res) => {
  const videoUrl = req.body.videoUrl;

  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing videoUrl in request body.' });
  }

  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube URL.' });
  }

  // Return from cache if available
  if (transcriptCache[videoId]) {
    return res.json({ transcript: transcriptCache[videoId], cached: true });
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const fullText = transcript.map(item => item.text).join(' ');
    transcriptCache[videoId] = fullText;
    return res.json({ transcript: fullText });
  } catch (error) {
    console.error(`[ERROR] Transcript fetch failed: ${error.message}`);

    if (error.message.includes('captcha') || error.message.includes('TooManyRequest')) {
      return res.status(429).json({
        error: 'YouTube is rate-limiting this service. Try again later.',
        transcript: '[TRANSCRIPT UNAVAILABLE DUE TO RATE LIMIT]',
      });
    }

    return res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
