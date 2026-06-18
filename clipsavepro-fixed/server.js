const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// =====================
// RAPIDAPI CREDENTIALS
// Reads from environment variable if set (recommended for production),
// falls back to the hardcoded key for local development.
// =====================
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'bf2de52a0bmsh7f39bca2349bd1cp1597f8jsn38011c7455f5';

const HOSTS = {
    youtube:   'ytstream-download-youtube-videos.p.rapidapi.com',
    instagram: 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com',
    tiktok:    'tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com',
    facebook:  'facebook-video-downloader6.p.rapidapi.com'
};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// =====================
// HELPER: Extract YouTube video ID from URL
// =====================
function extractYouTubeId(url) {
    const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

// =====================
// HELPER: Detect platform from URL
// =====================
function detectPlatform(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
    return null;
}

// =====================
// SERVE FRONT-END
// =====================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =====================
// YOUTUBE DOWNLOAD
// =====================
async function downloadYouTube(videoId) {
    const options = {
        method: 'GET',
        url: `https://${HOSTS.youtube}/dl?id=${videoId}`,
        headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': HOSTS.youtube
        }
    };

    const response = await axios.request(options);
    const data = response.data;

    let downloadUrl = '';
    const title = data.title || 'YouTube Video';

    if (data && data.link) {
        const qualities = ['720p', '480p', '360p', '240p', '144p'];
        for (const q of qualities) {
            if (data.link[q]) {
                const entry = Array.isArray(data.link[q]) ? data.link[q][0] : data.link[q];
                downloadUrl = entry && entry.url ? entry.url : entry;
                if (downloadUrl) break;
            }
        }
    }

    // Fallback: formats array
    if (!downloadUrl && data.formats && data.formats.length > 0) {
        const fmt = data.formats.find(f => f.url);
        if (fmt) downloadUrl = fmt.url;
    }

    return { downloadUrl, title };
}

// =====================
// INSTAGRAM DOWNLOAD
// =====================
async function downloadInstagram(url) {
    const options = {
        method: 'GET',
        url: `https://${HOSTS.instagram}/index`,
        params: { url: url },
        headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': HOSTS.instagram
        }
    };

    const response = await axios.request(options);
    const data = response.data;

    let downloadUrl = '';
    const title = 'Instagram Video';

    if (data && data.media) {
        downloadUrl = data.media;
    } else if (data && data.url) {
        downloadUrl = data.url;
    } else if (Array.isArray(data) && data[0] && data[0].url) {
        downloadUrl = data[0].url;
    }

    return { downloadUrl, title };
}

// =====================
// TIKTOK DOWNLOAD
// =====================
async function downloadTikTok(url) {
    const options = {
        method: 'GET',
        url: `https://${HOSTS.tiktok}/vid/index`,
        params: { url: url },
        headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': HOSTS.tiktok
        }
    };

    const response = await axios.request(options);
    const data = response.data;

    let downloadUrl = '';
    const title = 'TikTok Video';

    if (data && data.video && data.video.length > 0) {
        downloadUrl = data.video[0];
    } else if (data && data.url) {
        downloadUrl = data.url;
    }

    return { downloadUrl, title };
}

// =====================
// FACEBOOK DOWNLOAD
// =====================
async function downloadFacebook(url) {
    const options = {
        method: 'GET',
        url: `https://${HOSTS.facebook}/fb`,
        params: { url: url },
        headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': HOSTS.facebook
        }
    };

    const response = await axios.request(options);
    const data = response.data;

    let downloadUrl = '';
    const title = 'Facebook Video';

    if (data && data.hd) {
        downloadUrl = data.hd;
    } else if (data && data.sd) {
        downloadUrl = data.sd;
    } else if (data && data.url) {
        downloadUrl = data.url;
    }

    return { downloadUrl, title };
}

// =====================
// MAIN API ENDPOINT
// =====================
app.post('/api/download', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.json({ success: false, error: 'Please provide a video URL.' });
    }

    const platform = detectPlatform(url);

    if (!platform) {
        return res.json({
            success: false,
            error: 'Only YouTube, Instagram, TikTok, and Facebook links are supported.'
        });
    }

    try {
        let result = { downloadUrl: '', title: '' };

        if (platform === 'youtube') {
            const videoId = extractYouTubeId(url);
            if (!videoId) {
                return res.json({ success: false, error: 'Invalid YouTube link.' });
            }
            result = await downloadYouTube(videoId);
        } else if (platform === 'instagram') {
            result = await downloadInstagram(url);
        } else if (platform === 'tiktok') {
            result = await downloadTikTok(url);
        } else if (platform === 'facebook') {
            result = await downloadFacebook(url);
        }

        if (result.downloadUrl) {
            return res.json({
                success: true,
                downloadUrl: result.downloadUrl,
                title: result.title,
                platform: platform
            });
        } else {
            return res.json({
                success: false,
                error: 'Download link not found. Make sure the video is public.'
            });
        }

    } catch (error) {
        console.error(`[${platform.toUpperCase()}] Error:`, error.message);

        if (error.response && error.response.status === 403) {
            return res.json({ success: false, error: 'API key error. Please check your RapidAPI credentials.' });
        }
        if (error.response && error.response.status === 429) {
            return res.json({ success: false, error: 'API rate limit reached. Please try again later.' });
        }

        return res.json({ success: false, error: 'Server error. Please try again.' });
    }
});

// =====================
// CATCH-ALL ROUTE
// =====================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =====================
// START SERVER
// =====================
app.listen(PORT, () => {
    console.log(`ClipSavePro is running on port ${PORT}`);
});
