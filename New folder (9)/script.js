let currentAudio = null;
let songs = [];

// Convert seconds to MM:SS
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Fetch all .mp3 files from server
async function getSongs() {
    const res = await fetch("http://127.0.0.1:3000/songs/");
    const text = await res.text();
    const div = document.createElement("div");
    div.innerHTML = text;

    const anchors = div.getElementsByTagName("a");
    for (let element of anchors) {
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split("/songs/")[1]);
        }
    }
    return songs;
}

// Play selected song
function playmusic(track) {
    if (currentAudio) currentAudio.pause();

    currentAudio = new Audio("/songs/" + track);
    currentAudio.play();
    currentAudio.volume = document.getElementById("volumeSlider").value;


    // ✅ Reset seekbar immediately
    document.querySelector(".circle").style.left = "0%";
    document.querySelector(".songtime").innerText = "00:00 / 00:00";

    // Update play/pause icon
    const playToggle = document.getElementById("playToggle");
    if (playToggle) playToggle.src = "pause.svg";

    currentAudio.onended = () => {
        if (playToggle) playToggle.src = "play.svg";
    };

    currentAudio.addEventListener("timeupdate", () => {
        const current = currentAudio.currentTime;
        const total = currentAudio.duration;
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutesSeconds(current)} / ${secondsToMinutesSeconds(total)}`;
        document.querySelector(".circle").style.left = (current / total) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", (e) => {
        const percent = e.offsetX / e.currentTarget.getBoundingClientRect().width;
        if (currentAudio.duration) {
            currentAudio.currentTime = percent * currentAudio.duration;
        }
    });

    const songNameElem = document.querySelector(".current-song-name");
    if (songNameElem) songNameElem.innerText = track.replace(".mp3", "");
}

// Main initializer
async function main() {
    songs = await getSongs();
    const ul = document.querySelector(".songlist ul");

    // Render song list
    for (const song of songs) {
        ul.innerHTML += `
            <li>
                <img src="music.svg" alt="icon">
                <div class="info">
                    <div class="songname">${song.replace(".mp3", "")}</div>
                    <div class="songartist">Umer</div>
                </div>
                <div class="playnow">
                    <span>play now</span>
                    <img src="play.svg" alt="play icon">
                </div>
            </li>`;
    }

    // Song click to play
    document.querySelectorAll(".songlist ul li").forEach((li) => {
        li.addEventListener("click", () => {
            const songName = li.querySelector(".songname").innerText.trim();
            playmusic(songName + ".mp3");
        });
    });

    // Play/Pause toggle
    const playToggle = document.getElementById("playToggle");
    if (playToggle) {
        playToggle.addEventListener("click", () => {
            if (currentAudio) {
                if (currentAudio.paused) {
                    currentAudio.play();
                    playToggle.src = "pause.svg";
                } else {
                    currentAudio.pause();
                    playToggle.src = "play.svg";
                }
            }
        });
    }

    // Open sidebar on small screens
    const ham = document.querySelector(".ham");
    if (ham) {
        ham.addEventListener("click", () => {
            const left = document.querySelector(".left");
            left.style.left = "0";
            left.style.zIndex = "1000";
        });
    }

    // Close sidebar
    const closeBtn = document.querySelector(".close");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            const left = document.querySelector(".left");
            left.style.left = "-100%";
            left.style.zIndex = "-1";
        });
    }

    // Previous Button
    const previous = document.getElementById("previous");
    if (previous) {
        previous.addEventListener("click", () => {
            if (!currentAudio) return;

            const currentFile = decodeURIComponent(currentAudio.src).split("/songs/").pop();
            const index = songs.findIndex(song => song === currentFile);
            if (index > 0) {
                playmusic(songs[index - 1]);
            }
        });
    }

    // Next Button
    const next = document.getElementById("next");
    if (next) {
        next.addEventListener("click", () => {
            if (!currentAudio) return;

            const currentFile = decodeURIComponent(currentAudio.src).split("/songs/").pop();
            const index = songs.findIndex(song => song === currentFile);
            if (index !== -1 && index < songs.length - 1) {
                playmusic(songs[index + 1]);
            }
        });
    }
    // Volume control
const volumeSlider = document.getElementById("volumeSlider");
if (volumeSlider) {
  volumeSlider.addEventListener("input", () => {
    if (currentAudio) {
      currentAudio.volume = volumeSlider.value;
    }
  });
}

}

// Run main
main();
