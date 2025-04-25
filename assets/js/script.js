// DOM элементы
const devices = document.getElementById("devices");
const devicesList = document.getElementById("devices-list");
const notification = document.getElementById("notification");
const notificationMessage = document.getElementById("notification-message");

// Инициализация приложения
document.addEventListener("DOMContentLoaded", () => {
  loadDevices();
});

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
    console.error("Ошибка при загрузке девайсов:", error);
    showError("Couldn't load the device list");
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
