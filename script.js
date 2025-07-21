// Array untuk menyimpan objek YouTube Player
let players = [];
let playerStates = {}; // Untuk menyimpan status putar/jeda setiap video
let watchHistoryCount = 0;

// Objek untuk menyimpan pengaturan
let settings = {
    autoPlayNewVideos: true,
    videoQuality: 'auto' // 'auto', 'highres', 'hd1080', dll.
};

// Fungsi yang dipanggil ketika YouTube IFrame API siap
function onYouTubeIframeAPIReady() {
    console.log("YouTube IFrame API is Ready.");
    loadSettings();
    updateHistoryCountDisplay();
}

// Fungsi untuk mendapatkan ID video dari URL YouTube
function getYouTubeVideoId(url) {
    const regExp = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.* [?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const match = url.match(regExp);
    return (match && match [1]) ? match [1] : null;
}

// Fungsi untuk menambahkan video ke grid
document.getElementById('addVideoButton').addEventListener('click', () => {
    const videoUrl = document.getElementById('videoUrlInput').value;
    const videoId = getYouTubeVideoId(videoUrl);

    if (videoId && players.length < 100) {
        const videoGrid = document.getElementById('videoGrid');
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';
        videoContainer.id = `video-container-${videoId}`;

        const playerDivId = `player-${videoId}`;
        videoContainer.innerHTML = `<div id="${playerDivId}"></div>
                                    <div class="video-controls">
                                        <button class="play-pause-btn" data-videoid="${videoId}"><i class="fas fa-play"></i></button>
                                        <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="0.5" data-videoid="${videoId}" title="Volume Video">
                                        <button class="remove-btn" data-videoid="${videoId}"><i class="fas fa-trash"></i></button>
                                    </div>`;
        videoGrid.appendChild(videoContainer);

        const newPlayer = new YT.Player(playerDivId, {
            videoId: videoId,
            playerVars: {
                autoplay: settings.autoPlayNewVideos ? 1 : 0,
                controls: 0,
                rel: 0,
                showinfo: 0,
                modestbranding: 1,
            },
            events: {
                'onReady': (event) => {
                    console.log(`Player ${videoId} siap.`);
                    playerStates [videoId] = settings.autoPlayNewVideos ? 'playing' : 'paused';
                    event.target.setVolume(document.getElementById('masterVolume').value * 100);
                    if (settings.autoPlayNewVideos) {
                        document.querySelector(`.play-pause-btn [data-videoid="${videoId}"] i`).className = 'fas fa-pause';
                    }
                    if (settings.videoQuality !== 'auto') {
                        event.target.setPlaybackQuality(settings.videoQuality);
                    }
                },
                'onStateChange': (event) => {
                    if (event.data === YT.PlayerState.ENDED) {
                        console.log(`Video ${videoId} selesai.`);
                        // Di implementasi nyata, Anda bisa mencatat video yang selesai ditonton di sini
                    } else if (event.data === YT.PlayerState.PLAYING) {
                        document.querySelector(`.play-pause-btn [data-videoid="${videoId}"] i`).className = 'fas fa-pause';
                        playerStates [videoId] = 'playing';
                        // Di implementasi nyata, Anda bisa mencatat awal tontonan di sini
                    } else if (event.data === YT.PlayerState.PAUSED) {
                        document.querySelector(`.play-pause-btn [data-videoid="${videoId}"] i`).className = 'fas fa-play';
                        playerStates [videoId] = 'paused';
                        // Di implementasi nyata, Anda bisa mencatat jeda tontonan di sini
                    }
                }
            }
        });
        players.push({ id: videoId, player: newPlayer });
        document.getElementById('videoUrlInput').value = '';
    } else if (players.length >= 100) {
        alert("Batas maksimum 100 video tercapai!");
    } else {
        alert("URL YouTube tidak valid!");
    }
});

// Kontrol Putar Semua
document.getElementById('playAllButton').addEventListener('click', () => {
    players.forEach(p => {
        p.player.playVideo();
        playerStates [p.id] = 'playing';
        const individualPlayPauseBtn = document.querySelector(`.play-pause-btn [data-videoid="${p.id}"] i`);
        if (individualPlayPauseBtn) {
            individualPlayPauseBtn.className = 'fas fa-pause';
        }
        incrementHistoryCount(); // Anggap memutar semua sebagai aktivitas menonton
    });
});

// Kontrol Jeda Semua
document.getElementById('pauseAllButton').addEventListener('click', () => {
    players.forEach(p => {
        p.player.pauseVideo();
        playerStates [p.id] = 'paused';
        const individualPlayPauseBtn = document.querySelector(`.play-pause-btn [data-videoid="${p.id}"] i`);
        if (individualPlayPauseBtn) {
            individualPlayPauseBtn.className = 'fas fa-play';
        }
    });
});

// Kontrol Volume Utama
document.getElementById('masterVolume').addEventListener('input', (event) => {
    const masterVolume = parseFloat(event.target.value);
    players.forEach(p => {
        p.player.setVolume(masterVolume * 100);
    });
});

// Delegasi event untuk tombol putar/jeda individual dan volume
document.getElementById('videoGrid').addEventListener('click', (event) => {
    if (event.target.closest('.play-pause-btn')) {
        const btn = event.target.closest('.play-pause-btn');
        const videoId = btn.dataset.videoid;
        const playerObj = players.find(p => p.id === videoId);
        if (playerObj) {
            if (playerStates [videoId] === 'playing') {
                playerObj.player.pauseVideo();
                playerStates [videoId] = 'paused';
                btn.querySelector('i').className = 'fas fa-play';
            } else {
                playerObj.player.playVideo();
                playerStates [videoId] = 'playing';
                btn.querySelector('i').className = 'fas fa-pause';
                incrementHistoryCount(); // Anggap setiap kali tombol putar individual ditekan sebagai aktivitas menonton
            }
        }
    } else if (event.target.closest('.remove-btn')) {
        const btn = event.target.closest('.remove-btn');
        const videoId = btn.dataset.videoid;
        const indexToRemove = players.findIndex(p => p.id === videoId);
        if (indexToRemove !== -1) {
            players [indexToRemove].player.destroy();
            players.splice(indexToRemove, 1);
            document.getElementById(`video-container-${videoId}`).remove();
            delete playerStates [videoId];
        }
    }
});

document.getElementById('videoGrid').addEventListener('input', (event) => {
    if (event.target.classList.contains('volume-slider')) {
        const videoId = event.target.dataset.videoid;
        const playerObj = players.find(p => p.id === videoId);
        if (playerObj) {
            const volume = parseFloat(event.target.value);
            playerObj.player.setVolume(volume * 100);
        }
    }
});


// --- Fitur Chat Sederhana ---
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessage');
const messagesDiv = document.getElementById('messages');

sendMessageBtn.addEventListener('click', () => {
    const message = chatInput.value.trim();
    if (message) {
        const msgElement = document.createElement('p');
        msgElement.textContent = `Anda: ${message}`;
        messagesDiv.appendChild(msgElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        chatInput.value = '';
    }
});

chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessageBtn.click();
    }
});


// --- Fungsi Pengaturan & Navigasi ---
const settingsButton = document.getElementById('settingsButton');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsButton = settingsModal.querySelector('.close-button');
const autoPlayNewVideosCheckbox = document.getElementById('autoPlayNewVideos');
const videoQualitySelect = document.getElementById('videoQuality');
const clearAllVideosButton = document.getElementById('clearAllVideos');

const homeButton = document.getElementById('homeButton');
const exploreButton = document.getElementById('exploreButton');
const contactButton = document.getElementById('contactButton');
const contactModal = document.getElementById('contactModal');
const closeContactButton = contactModal.querySelector('.close-button');

// Buka modal pengaturan
settingsButton.addEventListener('click', () => {
    autoPlayNewVideosCheckbox.checked = settings.autoPlayNewVideos;
    videoQualitySelect.value = settings.videoQuality;
    settingsModal.style.display = 'flex';
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    settingsButton.classList.add('active');
});

// Tutup modal pengaturan
closeSettingsButton.addEventListener('click', () => {
    settingsModal.style.display = 'none';
});

// Buka modal kontak
contactButton.addEventListener('click', () => {
    contactModal.style.display = 'flex';
});

// Tutup modal kontak
closeContactButton.addEventListener('click', () => {
    contactModal.style.display = 'none';
});

// Tutup modal jika klik di luar konten modal
window.addEventListener('click', (event) => {
    if (event.target === settingsModal) {
        settingsModal.style.display = 'none';
    } else if (event.target === contactModal) {
        contactModal.style.display = 'none';
    }
});

// Simpan pengaturan saat nilai berubah
autoPlayNewVideosCheckbox.addEventListener('change', () => {
    settings.autoPlayNewVideos = autoPlayNewVideosCheckbox.checked;
    saveSettings();
});

videoQualitySelect.addEventListener('change', () => {
    settings.videoQuality = videoQualitySelect.value;
    saveSettings();
    players.forEach(p => {
        if (p.player && settings.videoQuality !== 'auto') {
            p.player.setPlaybackQuality(settings.videoQuality);
        }
    });
});

// Tombol Hapus Semua Video
clearAllVideosButton.addEventListener('click', () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua video? Aksi ini tidak bisa dibatalkan.")) {
        players.forEach(p => {
            if (p.player && typeof p.player.destroy === 'function') {
                 p.player.destroy();
            }
            document.getElementById(`video-container-${p.id}`).remove();
        });
        players = [];
        playerStates = {};
        console.log("Semua video telah dihapus.");
        settingsModal.style.display = 'none';
    }
});


// Fungsi untuk menyimpan pengaturan ke Local Storage
function saveSettings() {
    try {
        localStorage.setItem('mutitubeSettings', JSON.stringify(settings));
        console.log("Pengaturan disimpan:", settings);
    } catch (e) {
        console.error("Gagal menyimpan pengaturan ke Local Storage:", e);
    }
}

// Fungsi untuk memuat pengaturan dari Local Storage
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('mutitubeSettings');
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
            console.log("Pengaturan dimuat:", settings);
        }
    } catch (e) {
        console.error("Gagal memuat pengaturan dari Local Storage:", e);
    }
}

// --- Fungsionalitas Tombol Navigasi Bawah & Histori ---
homeButton.addEventListener('click', () => {
    settingsModal.style.display = 'none';
    contactModal.style.display = 'none';
    console.log("Tombol Beranda diklik");
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    homeButton.classList.add('active');
    // Logika Beranda
});

exploreButton.addEventListener('click', () => {
    settingsModal.style.display = 'none';
    contactModal.style.display = 'none';
    console.log("Tombol Jelajah diklik");
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    exploreButton.classList.add('active');
    // Logika Jelajah
});

// Membuka modal pengaturan (dipindahkan ke fungsi sendiri)
settingsButton.addEventListener('click', openSettingsModal);

function openSettingsModal() {
    autoPlayNewVideosCheckbox.checked = settings.autoPlayNewVideos;
    videoQualitySelect.value = settings.videoQuality;
    settingsModal.style.display = 'flex';
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    settingsButton.classList.add('active');
}

// Fungsi untuk meningkatkan jumlah histori tontonan
function incrementHistoryCount() {
    watchHistoryCount++;
    updateHistoryCountDisplay();
    // Di implementasi nyata, Anda mungkin ingin menyimpan ini di localStorage atau backend
}

// Fungsi untuk memperbarui tampilan jumlah histori
function updateHistoryCountDisplay() {
    document.getElementById('historyCount').textContent = `(${watchHistoryCount})`;
}

// Panggil saat skrip pertama kali dimuat
loadSettings();
updateHistoryCountDisplay();
