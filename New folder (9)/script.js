let currentAudio = null;
let songs = [];
let currFolder = "";

// Convert seconds to MM:SS
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}


// Fetch .mp3 files from folder
async function getSongs(folder) {
    currFolder = folder;
    const res = await fetch(`http://127.0.0.1:3000/${folder}/`);
    const text = await res.text();
    const div = document.createElement("div");
    div.innerHTML = text;

    const anchors = div.getElementsByTagName("a");
    songs = [];
    for (let element of anchors) {
        if (element.href.endsWith(".mp3")) {
            // Extract only filename from full path
            songs.push(element.href.split("/").pop());
        }
    }

    return songs;
}

// Play selected song
function playmusic(track) {
    if (currentAudio) currentAudio.pause();


    currentAudio = new Audio(`/${currFolder}/` + track);
    currentAudio.play();
    currentAudio.volume = document.getElementById("volumeSlider").value;

    document.querySelector(".circle").style.left = "0%";
    document.querySelector(".songtime").innerText = "00:00 / 00:00";

    const playToggle = document.getElementById("playToggle");
    if (playToggle) playToggle.src = "pause.svg";

    currentAudio.onended = () => {
        if (playToggle) playToggle.src = "play.svg";
    };

    currentAudio.addEventListener("timeupdate", () => {
        const current = currentAudio.currentTime;
        const total = currentAudio.duration;
        document.querySelector(".songtime").innerText =
            `${secondsToMinutesSeconds(current)} / ${secondsToMinutesSeconds(total)}`;
        document.querySelector(".circle").style.left = (current / total) * 100 + "%";
    });

    document.querySelector(".seekbar").onclick = (e) => {
        const percent = e.offsetX / e.currentTarget.getBoundingClientRect().width;
        if (currentAudio.duration) {
            currentAudio.currentTime = percent * currentAudio.duration;
        }
    };

    const songNameElem = document.querySelector(".current-song-name");
    if (songNameElem) songNameElem.innerText = track.replace(".mp3", "");
}

// Load song list into UI
function loadSongListUI(songArray) {
    const ul = document.querySelector(".songlist ul");
    ul.innerHTML = "";

    for (const song of songArray) {
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

    document.querySelectorAll(".songlist ul li").forEach((li) => {
        li.addEventListener("click", () => {
            const songName = li.querySelector(".songname").innerText.trim();
            playmusic(songName + ".mp3");
        });
    });
}

async function displayAlbums() {
    console.log("Displaying albums...");

    let res = await fetch(`/songs/`);
    let html = await res.text();
    let div = document.createElement("div");
    div.innerHTML = html;

    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors);

    for (let index = 0; index < array.length; index++) {
        const e = array[index];

        if (e.href.includes("/songs") && !e.href.includes(".htaccess") && !e.href.endsWith(".mp3")) {
            let folder = e.href.split("/").slice(-2)[0];

            try {
                // Get the metadata of the folder
                let metaRes = await fetch(`/songs/${folder}/info.json`);
                let metaData = await metaRes.json();

                cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.png" alt="${metaData.title}">
                        <h2>${metaData.title}</h2>
                        <p>${metaData.description}</p>
                    </div>`;
            } catch (err) {
                console.warn(`Error loading info for folder "${folder}":`, err.message);
            }
        }
    }
}

// Initialize app
async function main() {
    songs = await getSongs("songs/ncs"); // default playlist
    loadSongListUI(songs);

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

    const ham = document.querySelector(".ham");
    if (ham) {
        ham.addEventListener("click", () => {
            const left = document.querySelector(".left");
            left.style.left = "0";
            left.style.zIndex = "1000";
        });
    }

    const closeBtn = document.querySelector(".close");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            const left = document.querySelector(".left");
            left.style.left = "-100%";
            left.style.zIndex = "-1";
        });
    }

    const previous = document.getElementById("previous");
    if (previous) {
        previous.addEventListener("click", () => {
            if (!currentAudio) return;
            const currentFile = decodeURIComponent(currentAudio.src).split("/").pop();
            const index = songs.findIndex(song => song === currentFile);
            if (index > 0) {
                playmusic(songs[index - 1]);
            }
        });
    }

    const next = document.getElementById("next");
    if (next) {
        next.addEventListener("click", () => {
            if (!currentAudio) return;
            const currentFile = decodeURIComponent(currentAudio.src).split("/").pop();
            const index = songs.findIndex(song => song === currentFile);
            if (index !== -1 && index < songs.length - 1) {
                playmusic(songs[index + 1]);
            }
        });
    }

    const volumeSlider = document.getElementById("volumeSlider");
    if (volumeSlider) {
        volumeSlider.addEventListener("input", () => {
            if (currentAudio) {
                currentAudio.volume = volumeSlider.value;
            }
        });
    }

    // ✅ Playlist Card Click to Load Songs
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async e => {
            const folder = e.currentTarget.dataset.folder;
            if (!folder) return;

            const newSongs = await getSongs(`songs/${folder}`);
            loadSongListUI(newSongs);

            if (newSongs.length > 0) {
                playmusic(newSongs[0]);
            }
        });
    });
   document.querySelector(".volume-control img").addEventListener("click", (e) => {
    if (!currentAudio) return;

    const icon = e.target;

    // Check if volume is not muted
    if (currentAudio.volume > 0) {
        currentAudio.volume = 0;
        document.getElementById("volumeSlider").value = 0;
        icon.src = "mute.svg"; // ✅ Update to your mute icon
    } else {
        currentAudio.volume = 1;
        document.getElementById("volumeSlider").value = 1;
        icon.src = "volume.svg"; // ✅ Back to volume icon
    }
});

}

// Run the app
main();
