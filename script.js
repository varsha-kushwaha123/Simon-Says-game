
const colors = ["green", "red", "yellow", "blue"];

const buttons = {};
colors.forEach(color => {
    buttons[color] = document.getElementById(color);
});

const levelDisplay = document.getElementById("level");
const bestScoreDisplay = document.getElementById("best-score");
const message = document.getElementById("message");
const startButton = document.getElementById("start-btn");

let sequence = [];
let playerSequence = [];
let level = 0;
let isPlaying = false;
let acceptingInput = false;
let audioContext = null;
let bestScore = 0;

// Load best score safely from browser storage
try {
    bestScore = Number(localStorage.getItem("simonBestScore")) || 0;
} catch (error) {
    bestScore = 0;
}

bestScoreDisplay.textContent = bestScore;

// Different sounds for each color
const frequencies = {
    green: 329.63,
    red: 261.63,
    yellow: 392.00,
    blue: 440.00
};

function playSound(color) {
    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequencies[color];

        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.2, audioContext.currentTime + 0.02
        );
        gain.gain.exponentialRampToValueAtTime(
            0.0001, audioContext.currentTime + 0.25
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.26);
    } catch (error) {
        // The game remains playable if audio is unavailable.
    }
}

// Flash a color and play its sound
function flashColor(color, duration = 400) {
    return new Promise(resolve => {
        const button = buttons[color];

        button.classList.add("active");
        playSound(color);

        setTimeout(() => {
            button.classList.remove("active");
            resolve();
        }, duration);
    });
}

// Enable or disable all color buttons
function setButtonsEnabled(enabled) {
    colors.forEach(color => {
        buttons[color].disabled = !enabled;
    });
}

// Start a new game
function startGame() {
    sequence = [];
    playerSequence = [];
    level = 0;
    isPlaying = true;
    acceptingInput = false;

    levelDisplay.textContent = level;
    message.textContent = "Get ready...";
    startButton.disabled = true;

    if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
    }

    setButtonsEnabled(false);

    setTimeout(() => {
        nextLevel();
    }, 700);
}

// Add one random color and show the complete sequence
async function nextLevel() {
    if (!isPlaying) return;

    level++;
    levelDisplay.textContent = level;
    playerSequence = [];

    sequence.push(colors[Math.floor(Math.random() * colors.length)]);

    message.textContent = "Watch the sequence carefully!";
    setButtonsEnabled(false);

    await new Promise(resolve => setTimeout(resolve, 500));

    for (const color of sequence) {
        if (!isPlaying) return;

        await flashColor(color, 450);
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!isPlaying) return;

    message.textContent = "Your turn! Repeat the sequence.";
    acceptingInput = true;
    setButtonsEnabled(true);
}

// Check the player's selected color
async function handleColorClick(color) {
    if (!isPlaying || !acceptingInput) return;

    acceptingInput = false;
    setButtonsEnabled(false);

    await flashColor(color, 200);

    if (!isPlaying) return;

    playerSequence.push(color);

    const currentIndex = playerSequence.length - 1;

    // Wrong color means game over
    if (playerSequence[currentIndex] !== sequence[currentIndex]) {
        endGame();
        return;
    }

    // Correctly completed the whole sequence
    if (playerSequence.length === sequence.length) {
        message.textContent = "Correct! Get ready for the next level.";

        setTimeout(() => {
            nextLevel();
        }, 700);
    } else {
        acceptingInput = true;
        setButtonsEnabled(true);
    }
}

// End the game and save the best score
function endGame() {
    isPlaying = false;
    acceptingInput = false;

    setButtonsEnabled(false);

    message.textContent = `Game Over! You reached level ${level}.`;
    startButton.textContent = "Play Again";
    startButton.disabled = false;

    if (level > bestScore) {
        bestScore = level;
        bestScoreDisplay.textContent = bestScore;

        try {
            localStorage.setItem("simonBestScore", bestScore);
        } catch (error) {
            // The game works even if browser storage is unavailable.
        }

        message.textContent += " New best score!";
    }
}

// Connect button clicks
colors.forEach(color => {
    buttons[color].addEventListener("click", () => {
        handleColorClick(color);
    });
});

// Start or restart the game
startButton.addEventListener("click", startGame);
