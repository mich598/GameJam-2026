const MathRaceGame = {

    timer: 30,
    currentQuestionIndex: 0,
    questions: [],
    isActive: false,
    interval: null,

    init() {

        this.timer = 30;
        this.currentQuestionIndex = 0;
        this.isActive = true;

        this.questions = [
            this.generateRectangleQuestion(),
            this.generateTriangleQuestion(),
            this.generateSquareQuestion()
        ];

        document.getElementById("mathScene").classList.remove("hidden");
        document.getElementById("endScene").classList.add("hidden");

        document.getElementById("feedback").textContent = "";
        document.getElementById("finalResult").textContent = "";
        document.getElementById("answerInput").value = "";
        document.getElementById("timer").textContent = "Time: 30";

        this.renderQuestion();
        this.updateProgressBar();
        this.startTimer();
    },

    startTimer() {

        clearInterval(this.interval);

        this.interval = setInterval(() => {

            if (!this.isActive) return;

            this.timer--;

            document.getElementById("timer").textContent =
                `Time: ${this.timer}`;

            if (this.timer <= 0) {
                this.loseGame();
            }

        }, 1000);
    },

    renderQuestion() {

        const question = this.questions[this.currentQuestionIndex];

        document.getElementById("shapeTitle").textContent = question.shape;

        document.getElementById("formulaBox").innerHTML =
            `<h3>${question.formula}</h3>`;

        document.getElementById("valueBox").innerHTML =
            `Calculate the area.`;

        document.getElementById("progress").textContent =
            `Question ${this.currentQuestionIndex + 1} / ${this.questions.length}`;

        this.renderShapeDiagram(question);
    },

    renderShapeDiagram(question) {

        const container = document.getElementById("shapeDiagram");
        // Label style shared across all shapes
        const lbl = 'fill="#1a0a00" font-size="16" font-weight="bold" font-family="Fredoka One, sans-serif"';

        if (question.shape === "Rectangle") {
            // Shape: x=60 y=40 w=220 h=120  (right edge 280, bottom 160)
            container.innerHTML = `
            <svg width="350" height="210">
                <rect x="60" y="30" width="220" height="120"
                      fill="#e8612a" stroke="rgba(0,0,0,0.15)" stroke-width="2" rx="4"/>
                <!-- b label: centred below shape -->
                <text x="170" y="200" ${lbl} text-anchor="middle">b = ${question.width}</text>
                <!-- h label: left of shape, clearly outside -->
                <text x="52" y="95"  ${lbl} text-anchor="end">h = ${question.height}</text>
            </svg>`;
        }

        if (question.shape === "Triangle") {
            // Points: 60,180  300,180  180,40
            container.innerHTML = `
            <svg width="350" height="230">
                <polygon points="60,175 300,175 180,35"
                         fill="#4caf50" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>
                <!-- b label: centred below base -->
                <text x="180" y="215" ${lbl} text-anchor="middle">b = ${question.base}</text>
                <!-- h label: left of triangle, well outside leftmost point (x=60) -->
                <text x="48"  y="110" ${lbl} text-anchor="end">h = ${question.height}</text>
            </svg>`;
        }

        if (question.shape === "Square") {
            const scale = Math.min(130, question.side * 10);
            const sx = (350 - scale) / 2;
            container.innerHTML = `
            <svg width="350" height="${scale + 80}">
                <rect x="${sx}" y="20" width="${scale}" height="${scale}"
                      fill="#fbbf24" stroke="rgba(0,0,0,0.15)" stroke-width="2" rx="4"/>
                <!-- s label: centred below square -->
                <text x="175" y="${20 + scale + 26}" ${lbl} text-anchor="middle">s = ${question.side}</text>
            </svg>`;
        }
    },

    checkAnswer() {

        if (!this.isActive) return;

        const question = this.questions[this.currentQuestionIndex];

        const userAnswer = parseFloat(
            document.getElementById("answerInput").value
        );

        if (isNaN(userAnswer)) return;

        if (userAnswer === question.answer) {

            document.getElementById("feedback").textContent =
                "Correct answer.";

            this.currentQuestionIndex++;

            document.getElementById("answerInput").value = "";

            // update progress bar after a correct answer
            this.updateProgressBar();

            if (this.currentQuestionIndex >= this.questions.length) {
                this.winGame();
                return;
            }

            this.renderQuestion();

        } else {

            document.getElementById("feedback").textContent =
                "Incorrect answer.";
        }
    },

    winGame() {

        this.isActive = false;

        clearInterval(this.interval);

        document.getElementById("mathScene").classList.add("hidden");
        document.getElementById("endScene").classList.remove("hidden");

        document.getElementById("finalResult").textContent =
            "You convinced the police the business is legal.";

        // ensure progress shows full
        const fill = document.getElementById("progressFill");
        const text = document.getElementById("progressText");
        if (fill) fill.style.width = "100%";
        if (text) text.textContent = `${this.questions.length} / ${this.questions.length}`;
    },

    loseGame() {

        this.isActive = false;

        clearInterval(this.interval);

        // Deduct $1 fine from main game earnings
        const current  = parseFloat(localStorage.getItem('earnings') || '0');
        const newTotal = Math.max(0, current - 1).toFixed(2);
        localStorage.setItem('earnings', newTotal);

        document.getElementById("mathScene").classList.add("hidden");
        document.getElementById("endScene").classList.remove("hidden");

        document.getElementById("finalResult").textContent =
            `🚔 You've been fined $1 for illegitimate business practices!\nYour earnings are now $${newTotal}.`;
    },

    generateRectangleQuestion() {

        const width = this.randomNumber(4, 12);
        const height = this.randomNumber(4, 12);

        return {
            shape: "Rectangle",
            width,
            height,
            formula: "A = b × h",
            answer: width * height
        };
    },

    generateTriangleQuestion() {

        // Make height always even so (base * height) / 2 is an integer
        const base = this.randomNumber(6, 12);
        const height = this.randomNumber(2, 6) * 2; // 4,6,8,10,12

        return {
            shape: "Triangle",
            base,
            height,
            formula: "A = (b × h) ÷ 2",
            answer: (base * height) / 2
        };
    },

    generateSquareQuestion() {

        const side = this.randomNumber(4, 12);

        return {
            shape: "Square",
            side,
            formula: "A = s × s",
            answer: side * side
        };
    },

    updateProgressBar() {
        const total = this.questions.length;
        const correctSoFar = Math.max(0, this.currentQuestionIndex);
        const pct = Math.round((correctSoFar / total) * 100);
        const fill = document.getElementById("progressFill");
        const text = document.getElementById("progressText");

        if (fill) fill.style.width = `${pct}%`;
        if (text) text.textContent = `${correctSoFar} / ${total}`;
    },

    randomNumber(min, max) {
        return Math.floor(
            Math.random() * (max - min + 1)
        ) + min;
    }
};

// ── Return to the main game, adjusting timer for time spent here ──────────────
function returnToGame() {
    const pauseStart = parseInt(localStorage.getItem('minigamePauseStart') || Date.now());
    const pausedMs   = Date.now() - pauseStart;
    const gameStart  = parseInt(localStorage.getItem('gameStartTime')      || Date.now());
    localStorage.setItem('gameStartTime', String(gameStart + pausedMs));
    localStorage.removeItem('minigamePauseStart');
    localStorage.setItem('fromMinigame', 'true');
    sessionStorage.setItem('gameStarted', 'true');
    window.location.href = 'index.html';
}

window.addEventListener("load", () => {
    // Apply police position/size from minigame2_layout.js
    const police = document.getElementById('mg2-police');
    if (police && typeof MINIGAME2_LAYOUT !== 'undefined') {
        Object.assign(police.style, MINIGAME2_LAYOUT.police);
    }

    // Begin button dismisses the intro and starts the game
    document.getElementById('beginBtn').addEventListener('click', () => {
        document.getElementById('introScene').style.display = 'none';
        document.getElementById('topBar').classList.remove('hidden');
        document.getElementById('mathScene').classList.remove('hidden');
        MathRaceGame.init();
    });

    const submitBtn = document.getElementById("submitAnswer");
    if (submitBtn) {
        submitBtn.addEventListener("click", () => MathRaceGame.checkAnswer());
    }

    const restartBtn = document.getElementById("restartBtn");
    if (restartBtn) {
        restartBtn.addEventListener("click", () => returnToGame());
    }

    const answerInput = document.getElementById("answerInput");
    if (answerInput) {
        answerInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") MathRaceGame.checkAnswer();
        });
    }
});