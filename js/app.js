"use strict";

/* =========================================================
   1. DATOS — banco de preguntas (arreglo de objetos)
   Cada pregunta: texto, 4 opciones y el índice de la única
   opción correcta. No se debe modificar correctIndex después
   de renderizar las opciones.
   ========================================================= */
const QUESTIONS = [
  { text: "254 + 187 = ?", options: [441, 431, 451, 341], correctIndex: 0 },
  { text: "1345 + 2789 = ?", options: [4144, 4134, 3134, 4024], correctIndex: 1 },
  { text: "678 + 456 = ?", options: [1144, 1034, 1134, 1234], correctIndex: 2 },
  { text: "903 + 588 = ?", options: [1481, 1391, 1491, 1591], correctIndex: 2 },
  { text: "5032 - 1876 = ?", options: [3166, 3156, 3056, 4156], correctIndex: 1 },
  { text: "8000 - 3456 = ?", options: [4554, 4544, 4444, 3544], correctIndex: 1 },
  { text: "921 - 358 = ?", options: [573, 463, 563, 663], correctIndex: 2 },
  { text: "4500 - 2750 = ?", options: [1760, 1750, 1650, 1850], correctIndex: 1 },
  { text: "23 x 14 = ?", options: [312, 322, 332, 288], correctIndex: 1 },
  { text: "9 x 8 = ?", options: [64, 81, 72, 56], correctIndex: 2 },
  { text: "15 x 12 = ?", options: [170, 180, 190, 160], correctIndex: 1 },
  { text: "34 x 6 = ?", options: [194, 214, 204, 184], correctIndex: 2 },
  { text: "144 ÷ 12 = ?", options: [11, 13, 12, 10], correctIndex: 2 },
  { text: "96 ÷ 8 = ?", options: [10, 14, 8, 12], correctIndex: 3 },
  { text: "225 ÷ 15 = ?", options: [14, 16, 15, 13], correctIndex: 2 },
  { text: "480 ÷ 6 = ?", options: [70, 90, 60, 80], correctIndex: 3 },
  { text: "Ana tiene 45 canicas y regala 12 a su amigo. ¿Cuántas canicas le quedan?", options: [32, 34, 30, 33], correctIndex: 3 },
  { text: "Un autobús tiene 6 filas con 8 asientos cada una. ¿Cuántos asientos tiene en total?", options: [46, 48, 42, 54], correctIndex: 1 },
  { text: "Juan repartió 84 lápices en partes iguales entre 7 estudiantes. ¿Cuántos lápices recibió cada uno?", options: [11, 13, 12, 14], correctIndex: 2 },
  { text: "Una tienda vendió 15 paquetes de 6 galletas cada uno. ¿Cuántas galletas vendió en total?", options: [84, 96, 90, 100], correctIndex: 2 },
];

const TOTAL_QUESTIONS = QUESTIONS.length;
const TOTAL_LIVES = 3;

/* =========================================================
   2. ESTADO — estado del juego, sin tocar el DOM
   ========================================================= */
const state = {
  currentIndex: 0,
  score: 0,
  correctCount: 0,
  answeredCount: 0,
  lives: TOTAL_LIVES,
  hasAnswered: false,
  gameOver: false,
};

function resetState() {
  state.currentIndex = 0;
  state.score = 0;
  state.correctCount = 0;
  state.answeredCount = 0;
  state.lives = TOTAL_LIVES;
  state.hasAnswered = false;
  state.gameOver = false;
}

function submitAnswer(selectedIndex) {
  const question = QUESTIONS[state.currentIndex];
  const isCorrect = selectedIndex === question.correctIndex;

  state.hasAnswered = true;
  state.answeredCount += 1;

  if (isCorrect) {
    state.score += 10;
    state.correctCount += 1;
  } else {
    state.lives -= 1;
  }

  return isCorrect;
}

function isLastQuestion() {
  return state.currentIndex >= TOTAL_QUESTIONS - 1;
}

function isOutOfLives() {
  return state.lives <= 0;
}

function advanceQuestion() {
  state.currentIndex += 1;
  state.hasAnswered = false;
}

/* =========================================================
   3. DOM — referencias y funciones de renderizado
   ========================================================= */
const dom = {
  progressLabel: document.getElementById("progress-label"),
  progressFill: document.getElementById("progress-fill"),
  scoreLabel: document.getElementById("score-label"),
  hearts: document.querySelectorAll(".heart"),
  questionScreen: document.getElementById("question-screen"),
  questionText: document.getElementById("question-text"),
  optionsContainer: document.getElementById("options-container"),
  feedbackText: document.getElementById("feedback-text"),
  continueBtn: document.getElementById("continue-btn"),
  resultScreen: document.getElementById("result-screen"),
  resultTitle: document.getElementById("result-title"),
  resultScore: document.getElementById("result-score"),
  resultPercentage: document.getElementById("result-percentage"),
  resultMessage: document.getElementById("result-message"),
  restartBtn: document.getElementById("restart-btn"),
};

function renderHeader() {
  const questionNumber = Math.min(state.currentIndex + 1, TOTAL_QUESTIONS);
  dom.progressLabel.textContent = `Pregunta ${questionNumber} de ${TOTAL_QUESTIONS}`;
  dom.progressFill.style.width = `${(questionNumber / TOTAL_QUESTIONS) * 100}%`;
  dom.scoreLabel.textContent = `Puntos: ${state.score}`;

  dom.hearts.forEach((heart) => {
    const lifeNumber = Number(heart.dataset.life);
    heart.classList.toggle("heart--lost", lifeNumber > state.lives);
  });
}

function renderQuestion() {
  const question = QUESTIONS[state.currentIndex];

  dom.questionText.textContent = question.text;
  dom.optionsContainer.innerHTML = "";
  dom.feedbackText.hidden = true;
  dom.feedbackText.textContent = "";
  dom.feedbackText.className = "feedback";
  dom.continueBtn.hidden = true;

  question.options.forEach((optionValue, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-btn";
    button.textContent = String(optionValue);
    button.dataset.index = String(index);
    button.addEventListener("click", () => handleOptionClick(index));
    dom.optionsContainer.appendChild(button);
  });
}

function renderAnswerFeedback(selectedIndex, isCorrect) {
  const question = QUESTIONS[state.currentIndex];
  const optionButtons = dom.optionsContainer.querySelectorAll(".option-btn");

  optionButtons.forEach((button, index) => {
    button.disabled = true;
    if (index === question.correctIndex) {
      button.classList.add("option-btn--correct");
    } else if (index === selectedIndex) {
      button.classList.add("option-btn--incorrect");
    }
  });

  dom.feedbackText.hidden = false;
  dom.feedbackText.textContent = isCorrect ? "¡Correcto!" : "Incorrecto.";
  dom.feedbackText.classList.add(isCorrect ? "feedback--correct" : "feedback--incorrect");

  dom.continueBtn.hidden = false;
}

function renderResult() {
  dom.questionScreen.hidden = true;
  dom.resultScreen.hidden = false;

  const percentage = Math.round((state.correctCount / TOTAL_QUESTIONS) * 100);

  dom.resultScore.textContent = `Aciertos: ${state.correctCount} de ${TOTAL_QUESTIONS}`;
  dom.resultPercentage.textContent = `Porcentaje: ${percentage}%`;

  let message;
  if (isOutOfLives() && state.answeredCount < TOTAL_QUESTIONS) {
    dom.resultTitle.textContent = "Te quedaste sin vidas";
    message = "No te rindas, inténtalo de nuevo y sigue practicando.";
  } else if (percentage >= 90) {
    dom.resultTitle.textContent = "¡Excelente trabajo!";
    message = "Dominas las matemáticas de sexto grado.";
  } else if (percentage >= 70) {
    dom.resultTitle.textContent = "¡Muy bien!";
    message = "Vas muy bien, sigue practicando para mejorar aún más.";
  } else if (percentage >= 50) {
    dom.resultTitle.textContent = "Buen intento";
    message = "Vas por buen camino, repasa un poco más.";
  } else {
    dom.resultTitle.textContent = "Reto terminado";
    message = "Sigue practicando, cada intento te hace mejor.";
  }

  dom.resultMessage.textContent = message;
}

function showQuestionScreen() {
  dom.resultScreen.hidden = true;
  dom.questionScreen.hidden = false;
}

/* =========================================================
   4. CONTROLADOR / EVENTOS — conecta estado con DOM
   ========================================================= */
function handleOptionClick(selectedIndex) {
  if (state.hasAnswered || state.gameOver) {
    return;
  }

  const isCorrect = submitAnswer(selectedIndex);
  renderAnswerFeedback(selectedIndex, isCorrect);
  renderHeader();
}

function handleContinueClick() {
  if (!state.hasAnswered) {
    return;
  }

  if (isOutOfLives() || isLastQuestion()) {
    state.gameOver = true;
    renderResult();
    return;
  }

  advanceQuestion();
  renderHeader();
  renderQuestion();
}

function handleRestartClick() {
  resetState();
  showQuestionScreen();
  renderHeader();
  renderQuestion();
}

function initGame() {
  resetState();
  dom.continueBtn.addEventListener("click", handleContinueClick);
  dom.restartBtn.addEventListener("click", handleRestartClick);
  renderHeader();
  renderQuestion();
}

document.addEventListener("DOMContentLoaded", initGame);
