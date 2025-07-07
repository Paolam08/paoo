const gameArea = document.getElementById('gameArea');
const timeLeftDisplay = document.getElementById('timeLeft');
const scoreDisplay = document.getElementById('score');
const gameMessage = document.getElementById('gameMessage');
const altar = document.getElementById('altar');
const startButton = document.getElementById('startButton');
const startOverlay = document.getElementById('startOverlay');


let timeLeft = 60;
let score = 0;
let timerInterval;
let requiredItems = {};
let collectedItems = {};
let gameActive = false;
let currentLevel = 0;


const ITEMS = {
    'uva': { emoji: '🍇', count: 0 },
    'vasija': { emoji: '🏺', count: 0 },
    'pergamino': { emoji: '📜', count: 0 },
    'moneda': { emoji: '🪙', count: 0 }
};

const LEVEL_SETTINGS = [
    { time: 60, items: { uva: 3, vasija: 1 } },
    { time: 50, items: { uva: 2, vasija: 2, pergamino: 1 } },
    { time: 40, items: { uva: 1, vasija: 2, pergamino: 2, moneda: 1 } }
];

// --- FUNCIONES DEL JUEGO ---

/**
 * Inicia el juego o lo reinicia.
 */
function startGame() {
    gameActive = true;
    score = 0;
    currentLevel = 0;
    scoreDisplay.textContent = score;
    startOverlay.style.display = 'none';
    loadLevel();
}

/**
 * Carga la configuración del nivel actual, genera objetos y reinicia el temporizador.
 */
function loadLevel() {

    if (currentLevel >= LEVEL_SETTINGS.length) {
        endGame(true);
        return;
    }

    const level = LEVEL_SETTINGS[currentLevel];
    timeLeft = level.time;
    requiredItems = { ...level.items };
    collectedItems = {}; // Reset collected items for the new level
    for (const item in ITEMS) {
        collectedItems[item] = 0;
    }

    timeLeftDisplay.textContent = timeLeft;
    gameMessage.textContent = buildRequiredMessage();

    // Clear previous collectibles
    gameArea.querySelectorAll('.collectible').forEach(item => item.remove());


    generateCollectibles(level.items);

    // Always create traps for each level
    createCollectible('trampa', '💀');
    createCollectible('trampa', '🕷️');

    // Clear any existing timer before setting a new one
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
}

/**
 * Construye el mensaje que indica los objetos que el jugador debe recolectar.
 * @returns {string} El mensaje con los objetos y sus cantidades.
 */
function buildRequiredMessage() {
    let message = "Necesitas: ";
    let parts = [];
    for (const item in requiredItems) {
        if (requiredItems[item] > 0) {
            parts.push(`${requiredItems[item]} ${ITEMS[item].emoji}`);
        }
    }
    return message + parts.join(', ');
}

/**
 * Genera un número especificado de objetos recolectables en el área de juego.
 * @param {object} itemsToGenerate Un objeto con los tipos y cantidades de ítems a generar.
 */
function generateCollectibles(itemsToGenerate) {
    for (const itemType in itemsToGenerate) {
        for (let i = 0; i < itemsToGenerate[itemType]; i++) {
            createCollectible(itemType, ITEMS[itemType].emoji);
        }
    }
}

/**
 * Crea un único objeto recolectable y lo añade al área de juego en una posición aleatoria.
 * @param {string} type El tipo de objeto (ej: 'uva', 'vasija', 'trampa').
 * @param {string} emoji El emoji a mostrar para el objeto.
 */
function createCollectible(type, emoji) {
    const collectible = document.createElement('div');
    collectible.classList.add('collectible');
    collectible.textContent = emoji;
    collectible.dataset.type = type;

    const gameAreaRect = gameArea.getBoundingClientRect();
    const altarRect = altar.getBoundingClientRect();

    let randomX, randomY;
    let attempts = 0;
    const maxAttempts = 100;
    const padding = 20; // Padding from the edges of gameArea
    const minDistanceToAltar = 150; // Minimum distance from center of altar

    // Loop to find a position that is not too close to the altar and within bounds
    do {
        // Calculate max allowed positions to keep collectible fully inside gameArea
        const maxX = gameAreaRect.width - collectible.offsetWidth - padding;
        const maxY = gameAreaRect.height - collectible.offsetHeight - padding;

        randomX = padding + Math.random() * (maxX - padding);
        randomY = padding + Math.random() * (maxY - padding);
        attempts++;

        // Calculate distance from the center of the collectible to the center of the altar
        const collectibleCenterX = randomX + collectible.offsetWidth / 2;
        const collectibleCenterY = randomY + collectible.offsetHeight / 2;

        const altarCenterX = altarRect.left - gameAreaRect.left + altarRect.width / 2;
        const altarCenterY = altarRect.top - gameAreaRect.top + altarRect.height / 2;

        const dist = Math.sqrt(
            Math.pow(collectibleCenterX - altarCenterX, 2) +
            Math.pow(collectibleCenterY - altarCenterY, 2)
        );

        if (dist > minDistanceToAltar || attempts >= maxAttempts) {
            break; // Found a good spot or ran out of attempts
        }
    } while (true);

    collectible.style.left = `${randomX}px`;
    collectible.style.top = `${randomY}px`;

    collectible.addEventListener('click', handleCollectibleClick);
    gameArea.appendChild(collectible);
}

/**
 * Maneja el evento de clic en un objeto recolectable.
 * @param {Event} event El evento de clic.
 */
function handleCollectibleClick(event) {
    if (!gameActive) return;
    const clickedItem = event.target;
    const itemType = clickedItem.dataset.type;


    if (itemType === 'trampa') {
        gameMessage.textContent = "¡Cuidado! ¡Eso no es una ofrenda!";
        score = Math.max(0, score - 5);
        scoreDisplay.textContent = score;
        clickedItem.classList.add('collected');
        // Remove trap after a short delay to allow transition
        setTimeout(() => clickedItem.remove(), 500);
        return;
    }

    if (requiredItems[itemType] && collectedItems[itemType] < requiredItems[itemType]) {
        collectedItems[itemType]++;
        score += 10;
        scoreDisplay.textContent = score;
        gameMessage.textContent = `Has recogido ${collectedItems[itemType]} de ${requiredItems[itemType]} ${ITEMS[itemType].emoji}`;
        clickedItem.classList.add('collected');
        // Remove collected item after a short delay to allow transition
        setTimeout(() => clickedItem.remove(), 500);
    } else {
        gameMessage.textContent = "Ya tienes suficientes de estos o no los necesitas.";
    }
}

/**
 * Actualiza el temporizador cada segundo y verifica si el tiempo se ha agotado.
 */
function updateTimer() {
    if (!gameActive) return;

    timeLeft--;
    timeLeftDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endGame(false); // Tiempo agotado
    }
}

/**
 * Verifica si el jugador ha recolectado todos los objetos requeridos para el nivel actual.
 * @returns {boolean} True si se han recolectado todos los ítems, False en caso contrario.
 */
function checkWinCondition() {
    for (const itemType in requiredItems) {
        if (collectedItems[itemType] < requiredItems[itemType]) {
            return false; // Aún faltan objetos de este tipo
        }
    }
    return true;
}

/**
 * Maneja el evento de clic en el altar. Si las ofrendas están completas, pasa al siguiente nivel.
 */
altar.addEventListener('click', () => {
    if (!gameActive) return;

    if (checkWinCondition()) {
        score += 50;
        scoreDisplay.textContent = score;
        gameMessage.textContent = "¡Ofrendas entregadas! ¡Pasas al siguiente nivel!";
        currentLevel++;
        setTimeout(loadLevel, 2000); // Wait 2 seconds before loading next level
    } else {
        gameMessage.textContent = "¡Te faltan ofrendas! Revisa lo que necesitas.";
    }
});

/**
 * Finaliza el juego, mostrando un mensaje de victoria o derrota.
 * @param {boolean} won
 */
function endGame(won) {
    gameActive = false;
    clearInterval(timerInterval);
    startOverlay.style.display = 'flex'; // Show the overlay again

    if (won) {
        startOverlay.querySelector('h2').textContent = "¡Victoria Gloriosa!";
        startOverlay.querySelector('p').innerHTML = `Has completado todos los desafíos y tu puntuación final es: ${score}<br>¡Bien hecho, héroe antiguo!`;
        startButton.textContent = "Jugar de Nuevo";
    } else {
        startOverlay.querySelector('h2').textContent = "Tiempo Agotado";
        startOverlay.querySelector('p').innerHTML = `No lograste completar la tarea a tiempo. Tu puntuación final es: ${score}<br>¡Inténtalo de nuevo!`;
        startButton.textContent = "Reintentar";
    }
}

// Event listener to start the game
startButton.addEventListener('click', startGame);

// Initialize game message with initial instructions (optional, handled by startGame for levels)
// gameMessage.textContent = "¡Recoge las ofrendas para el sacerdote!"; // Removed, as loadLevel sets it
