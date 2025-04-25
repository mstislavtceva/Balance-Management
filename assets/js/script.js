// DOM элементы
const devices = document.getElementById("devices");
const devicesList = document.getElementById("devices-list");
const players = document.getElementById("players");
const playersList = document.getElementById("players-list");
const backButton = document.getElementById("back-button");
const notification = document.getElementById("notification");
const notificationMessage = document.getElementById("notification-message");

// Инициализация приложения
document.addEventListener("DOMContentLoaded", () => {
  loadDevices();
  setupEventListeners();
});

function setupEventListeners() {
  // Клик по девайсу
  document.addEventListener("click", (e) => {
    const deviceCard = e.target.closest(".device-card");
    if (deviceCard) {
      const deviceId = parseInt(deviceCard.dataset.deviceId);
      loadPlayers(deviceId);
    }
  });
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
                     placeholder="Сумма" min="0.01" step="0.01">
              <button class="btn btn-success deposit-btn mt-4">Deposit</button>
              <button class="btn btn-danger withdraw-btn mt-4">Withdraw</button>
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
  devicesList.innerHTML = "";

  try {
    const response = await fetch("https://dev-space.su/api/v1/a/devices/", {
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
  }
}

// Функция загрузки конкретного девайса по ID
async function loadDeviceById(deviceId) {
  try {
    const response = await fetch(
      `https://dev-space.su/api/v1/a/devices/${deviceId}/`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

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
        <span class="badge bg-primary">Places: ${places.length}</span>
        <span class="badge bg-info">Total Balance: ${total} KES</span>
      </div>
    `;
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
