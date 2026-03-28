console.log("Hermes Livesss!!");

// 1. Mood data first
const moodData = {
    focused: {
        songs: ["https://www.youtube.com/embed/E1mZuIgYW1g?si=F9Ajj3YjGXoTq0DZ", "https://www.youtube.com/embed/ANkwAll22zc?si=N-4kI-kFjPxVr9iA"],
        album: "focused album"
    },
    calm: {
        songs: ["https://www.youtube.com/embed/NRi0WWzCi7c?si=b23m-l4YqF-lov29", "https://www.youtube.com/embed/lFcSrYw-ARY"],
        album: "calm album"
    },
    pumped: {
        songs: ["https://www.youtube.com/embed/AcM8O6E_Yok?si=SsSf8mFTYFtrvs4b", "https://www.youtube.com/embed/6_SS7mTvvyg?si=OBGa2kSM__vmK3HD"],
        album: "pumped album"
    },
    energetic: {
        songs: ["https://www.youtube.com/embed/OzGnKBCfeFE?si=9WpxtUxrQKK0S7zF", "https://www.youtube.com/embed/0nlJuwO0GDs"],
        album: "energetic album"
    },
    somber: {
        songs: ["https://www.youtube.com/embed/QSppBylDFzQ?si=wR09aZcslVAVtEWs", "https://www.youtube.com/embed/iMLNeCAKjAI?si=1hqDdQ5qag0VDJzv"],
        album: "somber album"
    },
    reflective: {
        songs: ["https://www.youtube.com/embed/pQsF3pzOc54", "https://www.youtube.com/embed/bVvA7VOU0MI?si=HXbBks9HPZ62Z8LP"],
        album: "reflective album"
    },
}

// State tracking for check-ins
let checkInCount = 0;
const MAX_CHECKINS = 3;

// 2. YouTube Player State
let ytPlayer = null;         // the YT.Player instance
let currentSongIndex = 0;   // which song in the playlist we're on
let currentPlaylist = [];    // array of video IDs for the active mood

const playlistArea = document.getElementById("playlist-area");

// YouTube IFrame API
// The API calls this automatically when it's ready
function onYouTubeIframeAPIReady() {
    console.log("YouTube IFrame API ready");
}

// Pull the video ID out of a YouTube embed URL
// e.g. "https://www.youtube.com/embed/3JZ_D3ELwOQ" → "3JZ_D3ELwOQ"
function extractVideoId(url) {
    if (!url || url.trim() === "") return null;
    const match = url.match(/embed\/([^?&"'>]+)/);
    return match ? match[1] : null;
}

// Build a clean playlist of video IDs from a mood's songs array
function buildPlaylist(songs) {
    return songs
        .map(song => {
            const url = typeof song === "object" ? song.embed : song;
            return extractVideoId(url);
        })
        .filter(id => id !== null); // strip out blanks / invalid entries
}

// Create (or re-use) the YT.Player pointed at a given video ID
function loadPlayer(videoId) {
    if (ytPlayer) {
        // Player already exists — just swap the video
        ytPlayer.loadVideoById(videoId);
        return;
    }

    // First time: build the player inside #yt-player-container
    ytPlayer = new YT.Player("yt-player-container", {
        height: "170",
        width: "300",
        videoId: videoId,
        playerVars: {
            autoplay: 1,
            rel: 0,          // don't show unrelated videos at the end
        },
        events: {
            onStateChange: onPlayerStateChange,
        }
    });
}

// Called by the YouTube API whenever playback state changes
function onPlayerStateChange(event) {
    // YT.PlayerState.ENDED === 0
    if (event.data === YT.PlayerState.ENDED) {
        playNextSong();
    }
}

// Advance to the next song, wrapping back to 0 at the end
function playNextSong() {
    if (currentPlaylist.length === 0) return;
    currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length;
    loadPlayer(currentPlaylist[currentSongIndex]);
    updateSongCounter();
}

// Go back to the previous song
function playPrevSong() {
    if (currentPlaylist.length === 0) return;
    currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
    loadPlayer(currentPlaylist[currentSongIndex]);
    updateSongCounter();
}

// Keep the "Song X / Y" label in sync
function updateSongCounter() {
    const counter = document.getElementById("song-counter");
    if (counter) {
        counter.textContent = `Song ${currentSongIndex + 1} / ${currentPlaylist.length}`;
    }
}

// Listen for ANY click anywhere on the page
// Use DOMContentLoaded to ensure the DOM is fully ready before attaching listeners
document.addEventListener("DOMContentLoaded", () => {

    // Inject the YouTube IFrame API script dynamically
    const ytScript = document.createElement("script");
    ytScript.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(ytScript);

    const moodPrompt = document.getElementById("mood-prompt");

    // Use event delegation on the stable mood-prompt container
    moodPrompt.addEventListener("click", (e) => {

        // Check if what was clicked (or its parent) is a mood button
        const button = e.target.closest(".mood-btn");

        // If a mood button WAS clicked...
        if (button) {

            // Get the mood value from the button (data-mood="focused", etc.)
            const mood = button.dataset.mood;

            // Save the selected mood so we can use it later
            localStorage.setItem("lastMood", mood);

            // Move to the next step (fitness / movement flow)
            askMovement();
        }
    });

    // Grab elements for Notepad section
    const notebookIcon = document.getElementById("notebook-icon");
    const notebookPanel = document.getElementById("notebook-panel");
    const taskList = document.getElementById("task-list");
    const taskInput = document.getElementById("task-input");
    const addTaskBtn = document.getElementById("add-task-btn");

    // Load tasks from localStorage
    let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
    renderTasks(taskList, tasks);

    // Toggle panel
    notebookIcon.onclick = () => {
        notebookPanel.classList.toggle("open");
    }

    // Add a new task
    addTaskBtn.onclick = () => {
        const taskText = taskInput.value.trim();
        if (!taskText) return;
        const newTask = { text: taskText, completed: false };
        tasks.push(newTask);
        localStorage.setItem("tasks", JSON.stringify(tasks));
        taskInput.value = "";
        renderTasks(taskList, tasks);
    }

    const lastMood = localStorage.getItem("lastMood");
    const liked = localStorage.getItem("likedPlaylist");

    if (lastMood && liked === "true") {
        showAlbum(moodData[lastMood].album);
    }

    // loading animation
    startLoadingAnimation();

    // particles
    createParticles();
});

// 4. Most Recent Section - Figuring Out The Fitness Tracker
function startPlaylistFlow() {
    const mood = localStorage.getItem("lastMood");
    showPlaylist(mood);
}

function askMovement() { // Are we moving?
    playlistArea.innerHTML = `
        <h2>Are we moving today?</h2>
        <button class="flow-btn" id="move-yes">Yes</button>
        <button class="flow-btn" id="move-no">No</button>
    `;

    document.getElementById("move-yes").onclick = showMovementOptions;
    document.getElementById("move-no").onclick = startPlaylistFlow;
}

function showMovementOptions() { //Movement type?
    playlistArea.innerHTML = `
        <h2>What kind of movement?</h2>
        <button class="flow-btn" onclick="setMovement('walk')">Walk</button>
        <button class="flow-btn" onclick="setMovement('run')">Run</button>
        <button class="flow-btn" onclick="setMovement('gym')">Gym</button>
    `;
}

function setMovement(type) { //What's the movement goal?
    localStorage.setItem("movementType", type);

    if (type === "walk") {
        showGoalInput("steps");
    } else if (type === "run") {
        showGoalInput("miles");
    } else {
        showGymOptions();
    }
}

function showGoalInput(type) {
    playlistArea.innerHTML = `
        <h2>Set your ${type} goal</h2>
        <input type="number" id="goal-input" />
        <button class="flow-btn" id="save-goal">Start</button>
    `;

    document.getElementById("save-goal").onclick = () => {
        const goal = document.getElementById("goal-input").value;
        localStorage.setItem("goal", goal);

        startSession(type);
    };
}

function showGymOptions() {
    playlistArea.innerHTML = `
        <h2>What are we hitting?</h2>
        <button class="flow-btn" onclick="startGym('Chest & Tri')">Chest & Tri</button>
        <button class="flow-btn" onclick="startGym('Back & Bi')">Back & Bi</button>
        <button class="flow-btn" onclick="startGym('Legs/Cardio')">Legs/Cardio</button>
        <button class="flow-btn" onclick="startGym('Calisthenics')">Calisthenics</button>
    `;
}

function startGym(workout) {
    localStorage.setItem("movementType", "gym");
    localStorage.setItem("workoutType", workout);

    startSession("gym");
}

// Starting Workout Session
function startSession(type) {
    checkInCount = 0;

    const mood = localStorage.getItem("lastMood");

    // Show BOTH playlist + tracker UI
    // Use the YouTube player instead of a plain iframe so we can detect song endings
    currentPlaylist = buildPlaylist(moodData[mood].songs);
    currentSongIndex = 0;

    const playerHTML = currentPlaylist.length > 0
        ? `<div id="yt-player-container"></div>
           <div id="player-controls">
               <button class="flow-btn" onclick="playPrevSong()">⏮ Prev</button>
               <span id="song-counter">Song 1 / ${currentPlaylist.length}</span>
               <button class="flow-btn" onclick="playNextSong()">Next ⏭</button>
           </div>`
        : "<p>No songs available for this mood yet.</p>";

    playlistArea.innerHTML = `
        <h2>Session Started</h2>

        ${playerHTML}

        <div id="tracker"></div>
        <div id="feedback"></div>
    `;

    // Boot up the YouTube player on the first song
    if (currentPlaylist.length > 0) {
        // Destroy old player instance if one exists, so we get a fresh one
        if (ytPlayer) {
            ytPlayer.destroy();
            ytPlayer = null;
        }
        loadPlayer(currentPlaylist[currentSongIndex]);
    }

    const tracker = document.getElementById("tracker");

    if (type !== "gym") {
        tracker.innerHTML = `
            <input type="number" id="progress-input" placeholder="Enter progress" />
            <button class="flow-btn" id="submit-progress">Check In</button>
        `;

        document.getElementById("submit-progress").onclick = handleCheckIn;
    } else {
        tracker.innerHTML = `
            <button class="flow-btn" id="complete-workout">Workout Complete</button>
        `;

        document.getElementById("complete-workout").onclick = () => {
            showSuccess(1, 1); // treat as completed
        };
    }
}

// Check-in handler
function handleCheckIn() {
    const progress = Number(document.getElementById("progress-input").value);
    const goal = Number(localStorage.getItem("goal"));

    checkInCount++;

    if (progress >= goal) {
        showSuccess(progress, goal);
    } else if (checkInCount >= MAX_CHECKINS) {
        // Used all check-ins, still didn't hit goal
        showRetry(true);
    } else {
        showRetry(false);
    }
}

function showRetry(outOfCheckins) {
    const feedback = document.getElementById("feedback");

    if (outOfCheckins) {
        feedback.innerHTML = `
            <p>Keep pushing! You got this!</p>
        `;
    } else {
        feedback.innerHTML = `
            <p>Keep pushing! You got this! (${MAX_CHECKINS - checkInCount} check-in${MAX_CHECKINS - checkInCount !== 1 ? "s" : ""} left)</p>
            <button class="flow-btn" id="retry-btn">Try Again</button>
        `;

        document.getElementById("retry-btn").onclick = () => {
            feedback.innerHTML = "";
        };
    }
}

function showSuccess(progress, goal) {
    let message = progress > goal
        ? "You went above and beyond! Reward yourself!"
        : "We Did It! Congratulations, Soldier!";

    playlistArea.innerHTML = `
        <h2>${message}</h2>
        <button class="flow-btn" onclick="startPlaylistFlow()">Continue</button>
    `;
}

// 5. Existing Functions - Playlist & Album
function showPlaylist(mood) {
    const data = moodData[mood];

    // Build the playlist and boot the YouTube player
    currentPlaylist = buildPlaylist(data.songs);
    currentSongIndex = 0;

    const playerHTML = currentPlaylist.length > 0
        ? `<div id="yt-player-container"></div>
           <div id="player-controls">
               <button class="flow-btn" onclick="playPrevSong()">⏮ Prev</button>
               <span id="song-counter">Song 1 / ${currentPlaylist.length}</span>
               <button class="flow-btn" onclick="playNextSong()">Next ⏭</button>
           </div>`
        : "<p>No songs available for this mood yet.</p>";

    playlistArea.innerHTML = `
        <h2>Your ${mood} playlist</h2>

        ${playerHTML}

        <div class="feedback">
            <button class="flow-btn" id="like-btn">Like</button>
            <button class="flow-btn" id="dislike-btn">Dislike</button>
        </div>
    `;

    // Boot up the YouTube player
    if (currentPlaylist.length > 0) {
        if (ytPlayer) {
            ytPlayer.destroy();
            ytPlayer = null;
        }
        loadPlayer(currentPlaylist[currentSongIndex]);
    }

    document.getElementById("like-btn").onclick = () => {
        localStorage.setItem("likedPlaylist", "true");
        showAlbum(data.album);
    };

    document.getElementById("dislike-btn").onclick = () => {
        localStorage.setItem("likedPlaylist", "false");
        playlistArea.innerHTML = `<p>Try another mood?</p>`;
    };
}

function showAlbum(album) {
    playlistArea.innerHTML = `
    <h2>Album of the Day</h2>
    <p>${album}</p>
    `;
}

// Render tasks
function renderTasks(taskList, tasks) {
    taskList.innerHTML = "";
    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <input type="checkbox" ${task.completed ? "checked" : ""} />
            <span>${task.text}</span>
        `;
        if (task.completed) li.classList.add("completed");

        // Toggle complete
        li.querySelector("input").onclick = () => {
            tasks[index].completed = !tasks[index].completed;
            localStorage.setItem("tasks", JSON.stringify(tasks));
            renderTasks(taskList, tasks);
        }

        taskList.appendChild(li);
    });
}

// Our Loading Screen Effect
function startLoadingAnimation() {
    const textContainer = document.getElementById("loading-text");
    const loadingScreen = document.getElementById("loading-screen");
    const mainApp = document.getElementById("main-app");

    const words = ["Hermes", "Lives!"];

    // Add words one by one
    words.forEach((word, index) => {
        const span = document.createElement("span");
        span.textContent = word;
        span.classList.add("word");

        span.style.animationDelay = `${index * 0.6}s`;

        textContainer.appendChild(span);
    });

    // After animation finishes, Fade Out
    setTimeout(() => {
        loadingScreen.classList.add("fade-out");

        setTimeout(() => {
            loadingScreen.style.display = "none";
            mainApp.style.display = "block";
        }, 1500);

    }, 2500); // total time before fade
}

// Our shimmering PS5 particles
function createParticles() {
    const container = document.getElementById("particles");

    for (let i = 0; i < 40; i++) {
        const p = document.createElement("div");
        p.classList.add("particle");

        p.style.left = Math.random() * 100 + "vw";
        p.style.animationDuration = (5 + Math.random() * 10) + "s";
        p.style.opacity = Math.random();

        container.appendChild(p);
    }
}