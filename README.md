# 🛡️ Cloudflare Telegram Control Suite

Потужний інструмент для керування інфраструктурою Cloudflare прямо з Telegram. Проект включає розумного бота, Express-сервер для моніторингу та React-адмін-панель для керування доступом.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white)

---

## 🚀 Основні можливості

### 🤖 Telegram Бот
- **Обмежений доступ:** Бот реагує лише в конкретному груповому чаті (`ALLOWED_CHAT_ID`).
- **White-list система:** Лише верифіковані користувачі з бази даних можуть виконувати команди.
- **Керування доменами:** Реєстрація (додавання) нових зон у Cloudflare.
- **DNS Менеджер:** Повний цикл (CRUD) роботи з DNS записами (A, CNAME, TXT тощо).

### 🖥️ Admin Panel (React)
- **Авторизація:** Захищений вхід за адмін-паролем.
- **User Management:** Зручний інтерфейс для додавання/видалення користувачів Telegram у білий список.
- **Responsive Design:** Побудовано на MUI (Material UI), адаптовано під мобільні пристрої.

### 🌐 Webhook Logging
- Автоматичне відстеження запитів до API через маршрут `/webhook-log`.
- Миттєве сповіщення в Telegram про IP-адресу, метод та параметри вхідного запиту.

---

## 🛠️ Технологічний стек

- **Backend:** Node.js, Express, Telegraf (Telegram API), Mongoose (MongoDB ODM).
- **Frontend:** React, Vite, Axios, Material UI (MUI).
- **Security:** Case-insensitive username validation, Admin Key header protection, Environment variables isolation.

---

## ⚙️ Налаштування та встановлення

### 1. Підготовка оточення
Створіть файл `.env` у папці `/backend` за прикладом:

```env
# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
ALLOWED_CHAT_ID=-100123456789

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname

# Cloudflare
CLOUDFLARE_API_TOKEN=your_long_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Security & Server
PORT=3000
ADMIN_PASSWORD=super_secret_password

# 2. Запуск Backend
cd backend
npm install
npm start

# 3. Запуск Frontend
cd frontend
npm install
npm run dev

📖 Довідник команд бота
Команда	Опис
/start	Перевірка доступу та вітання
/add_domain <domain>	Додати зону в Cloudflare та отримати NS
/dns_list <domain>	Показати всі записи та їх ID
/dns_add <domain> <type> <name> <content>	Створити новий запис
/dns_update <domain> <id> <content>	Оновити існуючий запис за ID
/dns_delete <domain> <id>	Видалити запис