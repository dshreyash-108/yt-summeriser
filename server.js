const express = require('express');
const { YoutubeTranscript } = require('youtube-transcript');
const app = express();
const cors = require('cors');

app.use(express.json());

app.use(cors());

app.post('/transcript', async (req, res) => {
  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Missing videoUrl' });
    }

    const url = new URL(videoUrl);
    const videoId = url.searchParams.get('v');

    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const fullText = transcript.map(t => t.text).join(' ');

    res.json({ transcript: fullText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch transcript', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
