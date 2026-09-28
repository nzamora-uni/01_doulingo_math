"use strict";

/* =========================================================
   1. DATOS — banco de preguntas (arreglo de objetos)
   Cada pregunta: texto, 4 opciones, el índice de la única
   opción correcta y la categoría a la que pertenece. No se
   debe modificar correctIndex después de renderizar las
   opciones. El orden y contenido de las 20 preguntas es el
   mismo que en la versión original; solo se agregó "category".
   ========================================================= */
const QUESTIONS = [
  { text: "254 + 187 = ?", options: [441, 431, 451, 341], correctIndex: 0, category: "sumas" },
  { text: "1345 + 2789 = ?", options: [4144, 4134, 3134, 4024], correctIndex: 1, category: "sumas" },
  { text: "678 + 456 = ?", options: [1144, 1034, 1134, 1234], correctIndex: 2, category: "sumas" },
  { text: "903 + 588 = ?", options: [1481, 1391, 1491, 1591], correctIndex: 2, category: "sumas" },
  { text: "5032 - 1876 = ?", options: [3166, 3156, 3056, 4156], correctIndex: 1, category: "restas" },
  { text: "8000 - 3456 = ?", options: [4554, 4544, 4444, 3544], correctIndex: 1, category: "restas" },
  { text: "921 - 358 = ?", options: [573, 463, 563, 663], correctIndex: 2, category: "restas" },
  { text: "4500 - 2750 = ?", options: [1760, 1750, 1650, 1850], correctIndex: 1, category: "restas" },
  { text: "23 x 14 = ?", options: [312, 322, 332, 288], correctIndex: 1, category: "multiplicaciones" },
  { text: "9 x 8 = ?", options: [64, 81, 72, 56], correctIndex: 2, category: "multiplicaciones" },
  { text: "15 x 12 = ?", options: [170, 180, 190, 160], correctIndex: 1, category: "multiplicaciones" },
  { text: "34 x 6 = ?", options: [194, 214, 204, 184], correctIndex: 2, category: "multiplicaciones" },
  { text: "144 ÷ 12 = ?", options: [11, 13, 12, 10], correctIndex: 2, category: "divisiones" },
  { text: "96 ÷ 8 = ?", options: [10, 14, 8, 12], correctIndex: 3, category: "divisiones" },
  { text: "225 ÷ 15 = ?", options: [14, 16, 15, 13], correctIndex: 2, category: "divisiones" },
  { text: "480 ÷ 6 = ?", options: [70, 90, 60, 80], correctIndex: 3, category: "divisiones" },
  { text: "Ana tiene 45 canicas y regala 12 a su amigo. ¿Cuántas canicas le quedan?", options: [32, 34, 30, 33], correctIndex: 3, category: "problemas" },
  { text: "Un autobús tiene 6 filas con 8 asientos cada una. ¿Cuántos asientos tiene en total?", options: [46, 48, 42, 54], correctIndex: 1, category: "problemas" },
  { text: "Juan repartió 84 lápices en partes iguales entre 7 estudiantes. ¿Cuántos lápices recibió cada uno?", options: [11, 13, 12, 14], correctIndex: 2, category: "problemas" },
  { text: "Una tienda vendió 15 paquetes de 6 galletas cada uno. ¿Cuántas galletas vendió en total?", options: [84, 96, 90, 100], correctIndex: 2, category: "problemas" },
];

/* =========================================================
   0. API / SESIÓN — comunicación con el backend (login y
   progreso persistido en MySQL). El token JWT se guarda en
   localStorage y se manda como Authorization: Bearer <token>
   en cada llamada protegida.
   ========================================================= */
const API_BASE = "https://dou-matematico-api.artificialtechnology.tech/api";
const TOKEN_STORAGE_KEY = "retoMatematico.token";
const USERNAME_STORAGE_KEY = "retoMatematico.username";

function getStoredToken() {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

function getStoredUsername() {
  return window.localStorage.getItem(USERNAME_STORAGE_KEY);
}

function storeSession(token, username) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(USERNAME_STORAGE_KEY, username);
}

function clearSession() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(USERNAME_STORAGE_KEY);
}

async function apiRequest(path, options = {}) {
  const token = getStoredToken();
  const headers = Object.assign(
    { "Content-Type": "application/json" },
    options.headers || {},
    token ? { Authorization: `Bearer ${token}` } : {}
  );

  const response = await fetch(`${API_BASE}${path}`, Object.assign({}, options, { headers }));
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || "Error de comunicación con el servidor.");
    error.status = response.status;
    throw error;
  }

  return data;
}

async function loginRequest(username, password) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

async function fetchProgress() {
  return apiRequest("/progress");
}

async function saveCategoryProgress(categoryId, completed, correctCount) {
  return apiRequest(`/progress/${categoryId}`, {
    method: "PUT",
    body: JSON.stringify({ completed, correctCount }),
  });
}

async function resetProgressOnServer() {
  return apiRequest("/progress/reset", { method: "POST" });
}

const TOTAL_QUESTIONS = QUESTIONS.length;
const TOTAL_LIVES = 3;
const QUESTIONS_PER_CATEGORY = 4;

/* Mapa de lecciones: una categoría por bloque de 4 preguntas,
   en el mismo orden en que aparecen en QUESTIONS. */
const CATEGORIES = [
  { id: "sumas", name: "Sumas", icon: "➕" },
  { id: "restas", name: "Restas", icon: "➖" },
  { id: "multiplicaciones", name: "Multiplicaciones", icon: "✖️" },
  { id: "divisiones", name: "Divisiones", icon: "➗" },
  { id: "problemas", name: "Problemas", icon: "🧩" },
];

/* Preguntas de cada categoría, agrupadas por su posición en QUESTIONS. */
const categoryQuestions = CATEGORIES.map((category) =>
  QUESTIONS.filter((question) => question.category === category.id)
);

/* =========================================================
   2. ESTADO — estado del juego, sin tocar el DOM
   Las vidas son por ronda (por categoría): cada categoría se
   juega con 3 vidas propias. Si se pierden todas antes de
   terminar las 4 preguntas, la ronda se aborta y el nodo NO
   se marca como completado (se puede reintentar desde cero).
   El acumulado global (para el resultado final sobre 20) solo
   suma los aciertos de categorías que sí se completaron.
   ========================================================= */
const state = {
  currentCategoryIndex: null,
  roundPosition: 0,
  roundLives: TOTAL_LIVES,
  roundCorrect: 0,
  totalScore: 0,
  hasAnswered: false,
};

/* Progreso por categoría: completada o no, y aciertos logrados
   en el intento con el que se completó. */
let categoryProgress = CATEGORIES.map(() => ({ completed: false, correctCount: 0 }));

function resetAllProgress() {
  categoryProgress = CATEGORIES.map(() => ({ completed: false, correctCount: 0 }));
  state.currentCategoryIndex = null;
  state.roundPosition = 0;
  state.roundLives = TOTAL_LIVES;
  state.roundCorrect = 0;
  state.totalScore = 0;
  state.hasAnswered = false;
}

/* Aplica el progreso recibido del backend (GET /api/progress) al arreglo
   local categoryProgress, respetando el orden de CATEGORIES. */
function applyServerProgress(progressFromServer) {
  const byCategoryId = new Map(
    (progressFromServer || []).map((entry) => [entry.categoryId, entry])
  );

  categoryProgress = CATEGORIES.map((category) => {
    const entry = byCategoryId.get(category.id);
    return {
      completed: Boolean(entry && entry.completed),
      correctCount: entry ? entry.correctCount : 0,
    };
  });

  state.totalScore = globalCorrectCount() * 10;
}

function getCurrentQuestion() {
  const questions = categoryQuestions[state.currentCategoryIndex];
  return questions[state.roundPosition];
}

function isLastInRound() {
  return state.roundPosition >= QUESTIONS_PER_CATEGORY - 1;
}

function isRoundOutOfLives() {
  return state.roundLives <= 0;
}

function allCategoriesCompleted() {
  return categoryProgress.every((progress) => progress.completed);
}

function completedCategoryCount() {
  return categoryProgress.filter((progress) => progress.completed).length;
}

function globalCorrectCount() {
  return categoryProgress.reduce((sum, progress) => sum + progress.correctCount, 0);
}

function submitAnswer(selectedIndex) {
  const question = getCurrentQuestion();
  const isCorrect = selectedIndex === question.correctIndex;

  state.hasAnswered = true;

  if (isCorrect) {
    state.totalScore += 10;
    state.roundCorrect += 1;
  } else {
    state.roundLives -= 1;
  }

  return isCorrect;
}

function advanceRoundPosition() {
  state.roundPosition += 1;
  state.hasAnswered = false;
}

function startRound(categoryIndex) {
  state.currentCategoryIndex = categoryIndex;
  state.roundPosition = 0;
  state.roundLives = TOTAL_LIVES;
  state.roundCorrect = 0;
  state.hasAnswered = false;
}

/* =========================================================
   3. DOM — referencias y funciones de renderizado
   ========================================================= */
const dom = {
  gameHeader: document.getElementById("game-header"),
  progressLabel: document.getElementById("progress-label"),
  progressFill: document.getElementById("progress-fill"),
  scoreLabel: document.getElementById("score-label"),
  hearts: document.querySelectorAll(".heart"),

  loginScreen: document.getElementById("login-screen"),
  loginForm: document.getElementById("login-form"),
  loginUsername: document.getElementById("login-username"),
  loginPassword: document.getElementById("login-password"),
  loginError: document.getElementById("login-error"),
  loginSubmitBtn: document.getElementById("login-submit-btn"),

  mapScreen: document.getElementById("map-screen"),
  mapPath: document.getElementById("map-path"),
  mapSubtitle: document.getElementById("map-subtitle"),
  mapRestartBtn: document.getElementById("map-restart-btn"),
  mapUserLabel: document.getElementById("map-user-label"),
  logoutBtn: document.getElementById("logout-btn"),

  questionScreen: document.getElementById("question-screen"),
  questionCategoryLabel: document.getElementById("question-category-label"),
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

function renderMap() {
  dom.mapPath.innerHTML = "";

  categoryProgress.forEach((progress, index) => {
    const category = CATEGORIES[index];

    const node = document.createElement("button");
    node.type = "button";
    node.className = "map__node";
    if (progress.completed) {
      node.classList.add("map__node--completed");
    }
    node.dataset.categoryIndex = String(index);
    node.setAttribute(
      "aria-label",
      `${category.name}${progress.completed ? " (completada)" : ""}`
    );

    const circle = document.createElement("span");
    circle.className = "map__circle";
    circle.textContent = progress.completed ? "✔" : category.icon;

    const label = document.createElement("span");
    label.className = "map__label";
    label.textContent = category.name;

    node.appendChild(circle);
    node.appendChild(label);
    node.addEventListener("click", () => handleNodeClick(index));

    dom.mapPath.appendChild(node);
  });

  dom.mapSubtitle.textContent = `${completedCategoryCount()} de ${CATEGORIES.length} categorías completadas`;
}

function renderHeader() {
  const category = CATEGORIES[state.currentCategoryIndex];
  const questionNumber = Math.min(state.roundPosition + 1, QUESTIONS_PER_CATEGORY);

  dom.progressLabel.textContent = `${category.name} · Pregunta ${questionNumber} de ${QUESTIONS_PER_CATEGORY}`;
  dom.progressFill.style.width = `${(questionNumber / QUESTIONS_PER_CATEGORY) * 100}%`;
  dom.scoreLabel.textContent = `Puntos: ${state.totalScore}`;

  dom.hearts.forEach((heart) => {
    const lifeNumber = Number(heart.dataset.life);
    heart.classList.toggle("heart--lost", lifeNumber > state.roundLives);
  });
}

function renderQuestion() {
  const category = CATEGORIES[state.currentCategoryIndex];
  const question = getCurrentQuestion();

  dom.questionCategoryLabel.textContent = category.name;
  dom.questionText.textContent = question.text;
  dom.optionsContainer.innerHTML = "";
  dom.feedbackText.hidden = true;
  dom.feedbackText.textContent = "";
  dom.feedbackText.className = "feedback";
  dom.continueBtn.hidden = true;
  dom.continueBtn.textContent = "Continuar";

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
  const question = getCurrentQuestion();
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

  if (isLastInRound()) {
    dom.continueBtn.textContent = "Volver al mapa";
  } else if (isRoundOutOfLives()) {
    dom.continueBtn.textContent = "Volver al mapa";
  } else {
    dom.continueBtn.textContent = "Continuar";
  }

  dom.continueBtn.hidden = false;
}

function renderResult() {
  dom.questionScreen.hidden = true;
  dom.mapScreen.hidden = true;
  dom.gameHeader.hidden = true;
  dom.resultScreen.hidden = false;

  const totalCorrect = globalCorrectCount();
  const percentage = Math.round((totalCorrect / TOTAL_QUESTIONS) * 100);

  dom.resultScore.textContent = `Aciertos: ${totalCorrect} de ${TOTAL_QUESTIONS}`;
  dom.resultPercentage.textContent = `Porcentaje: ${percentage}%`;

  let message;
  if (percentage >= 90) {
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

function showLoginScreen() {
  dom.mapScreen.hidden = true;
  dom.questionScreen.hidden = true;
  dom.resultScreen.hidden = true;
  dom.gameHeader.hidden = true;
  dom.loginScreen.hidden = false;
  dom.loginError.hidden = true;
  dom.loginError.textContent = "";
  dom.loginPassword.value = "";
}

function showMapScreen() {
  dom.loginScreen.hidden = true;
  dom.questionScreen.hidden = true;
  dom.resultScreen.hidden = true;
  dom.gameHeader.hidden = true;
  dom.mapScreen.hidden = false;
  dom.mapUserLabel.textContent = `Hola, ${getStoredUsername() || ""}`;
  renderMap();
}

function showQuestionScreen() {
  dom.loginScreen.hidden = true;
  dom.mapScreen.hidden = true;
  dom.resultScreen.hidden = true;
  dom.gameHeader.hidden = false;
  dom.questionScreen.hidden = false;
}

/* =========================================================
   4. CONTROLADOR / EVENTOS — conecta estado con DOM
   ========================================================= */
function handleNodeClick(categoryIndex) {
  startRound(categoryIndex);
  showQuestionScreen();
  renderHeader();
  renderQuestion();
}

function handleOptionClick(selectedIndex) {
  if (state.hasAnswered) {
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

  if (isLastInRound()) {
    const categoryIndex = state.currentCategoryIndex;
    categoryProgress[categoryIndex] = {
      completed: true,
      correctCount: state.roundCorrect,
    };

    const category = CATEGORIES[categoryIndex];
    saveCategoryProgress(category.id, true, state.roundCorrect).catch((err) => {
      console.error("No se pudo guardar el progreso en el servidor:", err);
    });

    if (allCategoriesCompleted()) {
      renderResult();
    } else {
      showMapScreen();
    }
    return;
  }

  if (isRoundOutOfLives()) {
    showMapScreen();
    return;
  }

  advanceRoundPosition();
  renderHeader();
  renderQuestion();
}

function handleRestartAllClick() {
  resetAllProgress();
  showMapScreen();
  resetProgressOnServer().catch((err) => {
    console.error("No se pudo reiniciar el progreso en el servidor:", err);
  });
}

function handleLogoutClick() {
  clearSession();
  resetAllProgress();
  showLoginScreen();
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const username = dom.loginUsername.value.trim();
  const password = dom.loginPassword.value;

  dom.loginError.hidden = true;
  dom.loginError.textContent = "";
  dom.loginSubmitBtn.disabled = true;
  dom.loginSubmitBtn.textContent = "Entrando…";

  try {
    const { token, username: confirmedUsername } = await loginRequest(username, password);
    storeSession(token, confirmedUsername);
    await loadProgressAndShowMap();
  } catch (err) {
    dom.loginError.textContent = err.message || "No se pudo iniciar sesión.";
    dom.loginError.hidden = false;
  } finally {
    dom.loginSubmitBtn.disabled = false;
    dom.loginSubmitBtn.textContent = "Entrar";
  }
}

async function loadProgressAndShowMap() {
  const { progress } = await fetchProgress();
  applyServerProgress(progress);
  showMapScreen();
}

async function initGame() {
  resetAllProgress();

  dom.continueBtn.addEventListener("click", handleContinueClick);
  dom.restartBtn.addEventListener("click", handleRestartAllClick);
  dom.mapRestartBtn.addEventListener("click", handleRestartAllClick);
  dom.loginForm.addEventListener("submit", handleLoginSubmit);
  dom.logoutBtn.addEventListener("click", handleLogoutClick);

  if (!getStoredToken()) {
    showLoginScreen();
    return;
  }

  try {
    await loadProgressAndShowMap();
  } catch (err) {
    console.error("Sesión inválida o vencida, se pide iniciar sesión de nuevo:", err);
    clearSession();
    showLoginScreen();
  }
}

document.addEventListener("DOMContentLoaded", initGame);
