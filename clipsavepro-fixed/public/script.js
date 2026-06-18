function initClipSavePro() {
    const downloadBtn = document.getElementById('downloadBtn');
    const urlInput = document.getElementById('urlInput');
    const loader = document.getElementById('loader');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');

    // Tab click handler
    document.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('tab-btn')) {
            e.preventDefault();
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            resultDiv.style.display = 'none';
            errorDiv.style.display = 'none';
            resultDiv.innerHTML = '';
            errorDiv.innerHTML = '';
        }
    });

    if (!downloadBtn || !urlInput) return;

    const handleDownload = async function (e) {
        if (e) e.preventDefault();
        const videoUrl = urlInput.value.trim();

        resultDiv.style.display = 'none';
        errorDiv.style.display = 'none';
        resultDiv.innerHTML = '';
        errorDiv.innerHTML = '';

        if (!videoUrl) {
            showError('একটি ভিডিও লিংক দিন!');
            return;
        }

        // Platform check
        const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
        const isInstagram = videoUrl.includes('instagram.com');
        const isTikTok = videoUrl.includes('tiktok.com');
        const isFacebook = videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch');

        if (!isYouTube && !isInstagram && !isTikTok && !isFacebook) {
            showError('শুধু YouTube, Instagram, TikTok এবং Facebook লিংক সাপোর্ট করে।');
            return;
        }

        // Show loader
        loader.style.display = 'block';
        downloadBtn.disabled = true;
        downloadBtn.innerText = 'Processing...';

        try {
            // ✅ আমাদের নিজের server এ request পাঠাচ্ছি
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: videoUrl })
            });

            const data = await response.json();
            loader.style.display = 'none';

            if (data.success && data.downloadUrl) {
                const platformEmoji = {
                    youtube: '🎬',
                    instagram: '📸',
                    tiktok: '🎵',
                    facebook: '📘'
                };
                const emoji = platformEmoji[data.platform] || '🎬';

                resultDiv.innerHTML = `
                    <p style="margin-bottom: 12px; font-weight: bold; color: #28a745; font-size: 1.1rem;">
                        ${emoji} ভিডিও রেডি!
                    </p>
                    <p style="color: #ccc; margin-bottom: 16px; font-size: 0.9rem;">${data.title}</p>
                    <a href="${data.downloadUrl}" target="_blank" rel="noopener noreferrer"
                        style="display: inline-block; background: #28a745; color: white;
                        text-decoration: none; padding: 14px 28px; border-radius: 10px;
                        font-weight: bold; font-size: 1rem;
                        box-shadow: 0 4px 15px rgba(40,167,69,0.3);">
                        ⬇️ ভিডিও ডাউনলোড করুন
                    </a>
                `;
                resultDiv.style.display = 'block';
            } else {
                showError(data.error || 'ভিডিও পাওয়া যায়নি। আবার চেষ্টা করুন।');
            }

        } catch (err) {
            console.error('Fetch error:', err);
            loader.style.display = 'none';
            showError('Server এর সাথে সংযোগ হয়নি। আবার চেষ্টা করুন।');
        } finally {
            loader.style.display = 'none';
            downloadBtn.disabled = false;
            downloadBtn.innerText = 'Download Video';
        }
    };

    function showError(msg) {
        errorDiv.innerHTML = `<div style="color: #ff6666;">${msg}</div>`;
        errorDiv.style.display = 'block';
    }

    downloadBtn.onclick = handleDownload;
    urlInput.onkeypress = function (e) {
        if (e.key === 'Enter') handleDownload(e);
    };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClipSavePro);
} else {
    initClipSavePro();
}
