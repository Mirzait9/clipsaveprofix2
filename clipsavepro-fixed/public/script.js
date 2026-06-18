function initClipSavePro() {
    const downloadBtn = document.getElementById('downloadBtn');
    const urlInput    = document.getElementById('urlInput');
    const loader      = document.getElementById('loader');
    const resultDiv   = document.getElementById('result');
    const errorDiv    = document.getElementById('error');

    // Guard: abort if critical elements are missing
    if (!downloadBtn || !urlInput || !loader || !resultDiv || !errorDiv) return;

    // =====================
    // TAB CLICK HANDLER
    // =====================
    document.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('tab-btn')) {
            e.preventDefault();
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            clearUI();
        }
    });

    // =====================
    // HELPERS
    // =====================
    function clearUI() {
        resultDiv.style.display = 'none';
        errorDiv.style.display  = 'none';
        resultDiv.innerHTML = '';
        errorDiv.innerHTML  = '';
    }

    function showLoader(on) {
        loader.style.display    = on ? 'block' : 'none';
        downloadBtn.disabled    = on;
        downloadBtn.textContent = on ? 'Processing...' : 'Download Video';
    }

    function showError(msg) {
        // textContent prevents any HTML in msg from being rendered
        const div = document.createElement('div');
        div.style.color = '#ff6666';
        div.textContent = msg;
        errorDiv.innerHTML = '';
        errorDiv.appendChild(div);
        errorDiv.style.display = 'block';
    }

    function showResult(data) {
        const platformEmoji = { youtube: '🎬', instagram: '📸', tiktok: '🎵', facebook: '📘' };
        const emoji = platformEmoji[data.platform] || '🎬';

        // Build DOM nodes instead of innerHTML to avoid XSS
        resultDiv.innerHTML = '';

        const status = document.createElement('p');
        status.style.cssText = 'margin-bottom:12px;font-weight:bold;color:#28a745;font-size:1.1rem;';
        status.textContent = emoji + ' Video is ready!';

        const titleEl = document.createElement('p');
        titleEl.style.cssText = 'color:#ccc;margin-bottom:16px;font-size:0.9rem;';
        titleEl.textContent = data.title || '';

        const link = document.createElement('a');
        link.href   = data.downloadUrl;
        link.target = '_blank';
        link.rel    = 'noopener noreferrer';
        link.style.cssText = [
            'display:inline-block', 'background:#28a745', 'color:#fff',
            'text-decoration:none', 'padding:14px 28px', 'border-radius:10px',
            'font-weight:bold', 'font-size:1rem',
            'box-shadow:0 4px 15px rgba(40,167,69,0.3)'
        ].join(';');
        link.textContent = '⬇️ Download Video';

        resultDiv.appendChild(status);
        resultDiv.appendChild(titleEl);
        resultDiv.appendChild(link);
        resultDiv.style.display = 'block';
    }

    // =====================
    // MAIN DOWNLOAD HANDLER
    // =====================
    const handleDownload = async function (e) {
        if (e) e.preventDefault();

        const videoUrl = urlInput.value.trim();
        clearUI();

        if (!videoUrl) {
            showError('Please paste a video link first.');
            return;
        }

        showLoader(true);

        try {
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: videoUrl })
            });

            // Handle non-2xx HTTP responses (e.g. 500 from server crash)
            if (!response.ok) {
                throw new Error('Server returned status ' + response.status);
            }

            const data = await response.json();

            if (data.success && data.downloadUrl) {
                showResult(data);
            } else {
                showError(data.error || 'Video not found. Please check the link and try again.');
            }

        } catch (err) {
            console.error('Fetch error:', err);
            showError('Could not connect to the server. Please try again.');
        } finally {
            // Always runs — resets button and hides loader whether success or error
            showLoader(false);
        }
    };

    // =====================
    // EVENT LISTENERS
    // =====================
    downloadBtn.addEventListener('click', handleDownload);

    // keydown replaces deprecated onkeypress
    urlInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') handleDownload(e);
    });
}

// =====================
// INIT
// =====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClipSavePro);
} else {
    initClipSavePro();
}

