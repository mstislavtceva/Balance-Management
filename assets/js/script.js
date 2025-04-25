// Конфигурация
const API_BASE_URL = "https://dev-space.su/api/v1/a";

// Состояние приложения
let currentDeviceId = null;
let currentDeviceName = "";
let currentPlaceId = null;
let pinpadModal = null;

// DOM элементы
const devices = document.getElementById("devices");
const devicesList = document.getElementById("devices-list");
const players = document.getElementById("players");
const playersList = document.getElementById("players-list");
const backButton = document.getElementById("back-button");
const notification = document.getElementById("notification");
const notificationMessage = document.getElementById("notification-message");
const pinpadInput = document.getElementById("pinpad-input");

// Инициализация приложения
document.addEventListener("DOMContentLoaded", () => {
  // Инициализация модального окна нумпада
  pinpadModal = new bootstrap.Modal(document.getElementById("pinpadModal"));

  loadDevices();
  setupEventListeners();
  setupPinpad();
});

// Настройка обработчиков событий
function setupEventListeners() {
  // Клик по девайсу
  devicesList.addEventListener("click", (e) => {
    const deviceCard = e.target.closest(".device-card");
    if (deviceCard) {
      const deviceId = parseInt(deviceCard.dataset.deviceId);
      currentDeviceId = deviceId;
      currentDeviceName = deviceCard.dataset.deviceName;
      loadPlayers(currentDeviceId);
    }
  });

  // Клик по игроку
  playersList.addEventListener("click", (e) => {
    const playerCard = e.target.closest(".player-card");
    if (!playerCard) return;

    currentPlaceId = parseInt(playerCard.dataset.placeId);
    const amountInput = playerCard.querySelector(".amount-input");
    const amount = parseFloat(amountInput.value);
    const errorElement = playerCard.querySelector(".error-message");

    if (e.target.classList.contains("deposit-btn")) {
      handleBalanceOperation(amount, "deposit", errorElement);
    }

    if (e.target.classList.contains("withdraw-btn")) {
      handleBalanceOperation(amount, "withdraw", errorElement);
    }

    if (e.target.classList.contains("pinpad-btn")) {
      openPinpad(amountInput);
    }
  });

  // Кнопка "Назад"
  backButton.addEventListener("click", () => {
    players.style.display = "none";
    devices.style.display = "block";
  });
}

// Настройка нумпада
function setupPinpad() {
  // Обработчики для кнопок нумпада
  document.querySelectorAll(".pinpad-btn").forEach((btn) => {
    if (btn.id) return; // Пропускаем кнопки с ID

    btn.addEventListener("click", () => {
      pinpadInput.value += btn.textContent;
    });
  });

  // Кнопки операций в нумпаде
  document.getElementById("pinpad-deposit").addEventListener("click", () => {
    const amount = parseFloat(pinpadInput.value);
    const playerCard = document.querySelector(
      `.player-card[data-place-id="${currentPlaceId}"]`
    );
    const errorElement = playerCard.querySelector(".error-message");

    if (validateAmount(amount, errorElement)) {
      handleBalanceOperation(amount, "deposit", errorElement);
      pinpadModal.hide();
    }
  });

  document.getElementById("pinpad-withdraw").addEventListener("click", () => {
    const amount = parseFloat(pinpadInput.value);
    const playerCard = document.querySelector(
      `.player-card[data-place-id="${currentPlaceId}"]`
    );
    const errorElement = playerCard.querySelector(".error-message");

    if (validateAmount(amount, errorElement)) {
      handleBalanceOperation(amount, "withdraw", errorElement);
      pinpadModal.hide();
    }
  });
}

// Открытие нумпада
function openPinpad(amountInput) {
  pinpadInput.value = amountInput.value;
  pinpadModal.show();
}

// Обработка операций с балансом
async function handleBalanceOperation(amount, operationType, errorElement) {
  try {
    // Валидация
    if (!validateAmount(amount, errorElement)) return;

    errorElement.style.display = "none";

    // Отправка запроса
    const response = await fetch(
      `${API_BASE_URL}/devices/${currentDeviceId}/place/${currentPlaceId}/update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          delta: operationType === "deposit" ? amount : -amount,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Server error");
    }

    // Обновление интерфейса
    showSuccess(
      `The balance has been successfully ${
        operationType === "deposit" ? "replenished" : "changed"
      }`
    );
    await loadPlayers(currentDeviceId);
  } catch (error) {
    console.error(`Error ${operationType}:`, error);
    errorElement.textContent = error.message;
    errorElement.style.display = "block";
  }
}

// Функция загрузки списка игроков для девайса
async function loadPlayers(deviceId) {
  try {
    // Загружаем детали конкретного девайса
    const device = await loadDeviceById(deviceId);

    if (device && device.places) {
      renderPlayers(device.places, device.name);
    } else {
      throw new Error("No data found");
    }
  } catch (error) {
    console.error("Error when uploading data:", error);
    showError("Couldn't upload information");
  }
}

// Функция отображения игроков
function renderPlayers(places, deviceName) {
  playersList.innerHTML = `
      <h3 class="mb-4">${deviceName}</h3>
      <div class="row row-cols-1 g-3" id="places-container"></div>
    `;

  const placesContainer = document.getElementById("places-container");

  places.forEach((place) => {
    const placeCard = document.createElement("div");
    placeCard.className = "col";
    placeCard.innerHTML = `
        <div class="card player-card mb-3 text-center" data-place-id="${
          place.place
        }">
          <div class="card-body">
            <h5 class="card-title">Player ${place.place}</h5>
            <p class="card-text ${
              place.balances < 0 ? "text-danger" : "text-success"
            }">
              Balance: ${place.balances} ${place.currency}
            </p>
            
            <div class="balance-controls">
              <input type="number" class="form-control amount-input" 
                     placeholder="Amount" min="1" step="1">
              <button class="btn btn-success deposit-btn mt-4">Deposit</button>
              <button class="btn btn-danger withdraw-btn mt-4">Withdraw</button>
              <button class="btn btn-outline-primary pinpad-btn mt-4">Numpad</button>
            </div>
            
            <div class="error-message mt-2 text-danger" style="display: none;"></div>
          </div>
        </div>
      `;
    placesContainer.appendChild(placeCard);
  });

  // Убираем девайсы, показываем игроков
  devices.style.display = "none";
  players.style.display = "block";
}

// Функция загрузки списка девайсов
async function loadDevices() {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const devicesData = await response.json();
    renderDevices(devicesData);
  } catch (error) {
    console.error("Error loading devices:", error);
    showError("Couldn't load the device list");
    devicesList.innerHTML = "";
  }
}

// Функция загрузки конкретного девайса по ID
async function loadDeviceById(deviceId) {
  try {
    const response = await fetch(`${API_BASE_URL}/devices/${deviceId}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const device = await response.json();
    return device;
  } catch (error) {
    console.error("Error loading the device:", error);
    showError(`Failed to upload device ID data: ${deviceId}`);
    return null;
  }
}

// Функция отображения девайсов
function renderDevices(devices) {
  devicesList.innerHTML = "";

  if (!devices || devices.length === 0) {
    devicesList.innerHTML =
      '<div class="col-12 text-center text-muted">Нет доступных девайсов</div>';
    return;
  }

  devices.forEach((device) => {
    const deviceCard = document.createElement("div");
    deviceCard.className = "col";
    deviceCard.innerHTML = `
        <div class="card device-card h-100" data-device-id="${device.id}">
          <div class="card-body text-center">
            <h5 class="card-title">${device.name}</h5>
            <p class="card-text">
              <small>Updated: ${formatDate(device.updated_at)}</small>
            </p>
            <div class="places-summary">
              ${renderPlacesSummary(device.places)}
            </div>
          </div>
        </div>
      `;
    devicesList.appendChild(deviceCard);
  });
}

// Краткая сводка по places
function renderPlacesSummary(places) {
  const total = places.reduce((sum, place) => sum + place.balances, 0);

  return `
      <div class="places-stats">
        <span class="badge bg-primary">Players: ${places.length}</span>
        <span class="badge bg-info">Total Balance: ${total} KES</span>
      </div>
    `;
}

// Валидация суммы
function validateAmount(amount, errorElement) {
  if (!amount || isNaN(amount)) {
    errorElement.textContent = "Enter the amount";
    errorElement.style.display = "block";
    return false;
  }

  if (amount <= 0) {
    errorElement.textContent = "The amount must be positive";
    errorElement.style.display = "block";
    return false;
  }

  return true;
}

// Вспомогательная функция для форматирования даты
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString();
}

// Функция отображения ошибки
function showError(message) {
  notification.classList.remove("alert-success", "fade");
  notification.classList.add("alert-danger", "show");
  notificationMessage.textContent = message;
  setTimeout(() => notification.classList.remove("show"), 3000);
}

function showSuccess(message) {
  notification.classList.remove("alert-danger", "fade");
  notification.classList.add("alert-success", "show");
  notificationMessage.textContent = message;
  setTimeout(() => notification.classList.remove("show"), 3000);
}
