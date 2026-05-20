# SCP PORTAL

Внутренний портал Фонда SCP — полноценный веб-сайт с системой УД, связью, документами и управлением.

---

## СТЕК

- **Frontend**: React 18 + React Router
- **Backend**: Node.js + Express + Socket.io
- **БД**: MongoDB Atlas (бесплатно)
- **Деплой**: Render.com (бесплатно)

---

## БЫСТРЫЙ СТАРТ — ДЕПЛОЙ НА GITHUB + RENDER

### ШАГ 1 — MongoDB Atlas (бесплатная БД)

1. Зайди на [mongodb.com/atlas](https://mongodb.com/atlas) → Sign Up (бесплатно)
2. Создай кластер **M0 Free Tier**
3. В `Database Access` → Add User → запомни логин/пароль
4. В `Network Access` → Add IP Address → `0.0.0.0/0` (разрешить всем)
5. В `Clusters` → Connect → Drivers → скопируй строку подключения:
   ```
   mongodb+srv://USER:PASSWORD@cluster.mongodb.net/scp_portal
   ```

---

### ШАГ 2 — Загрузка на GitHub

1. Создай новый репозиторий на GitHub (Public или Private)
2. В папке проекта:
   ```bash
   git init
   git add .
   git commit -m "initial"
   git branch -M main
   git remote add origin https://github.com/ТВО_НИК/ИМЯ_РЕПО.git
   git push -u origin main
   ```

---

### ШАГ 3 — Деплой Backend на Render

1. Зайди на [dashboard.render.com](https://dashboard.render.com) → New → Web Service
2. Connect GitHub → выбери репо
3. Настройки:
   - **Name**: `scp-portal-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. Environment Variables → Add:
   | Ключ | Значение |
   |------|---------|
   | `MONGO_URI` | строка из MongoDB Atlas |
   | `JWT_SECRET` | любая длинная случайная строка, напр. `mySuperSecretKey123456789` |
   | `FRONTEND_URL` | пока оставь пустым, заполним после деплоя фронтенда |
   | `PORT` | `5000` |
5. Deploy → запомни URL вида `https://scp-portal-backend.onrender.com`

---

### ШАГ 4 — Деплой Frontend на Render

1. Render → New → Static Site
2. Connect GitHub → то же репо
3. Настройки:
   - **Name**: `scp-portal-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
4. Environment Variables → Add:
   | Ключ | Значение |
   |------|---------|
   | `REACT_APP_API_URL` | `https://scp-portal-backend.onrender.com/api` |
5. Deploy → запомни URL фронтенда
6. Вернись в Backend на Render → Environment → добавь:
   - `FRONTEND_URL` = URL фронтенда (напр. `https://scp-portal-frontend.onrender.com`)

---

### ШАГ 5 — Создание первого суперадмина

После деплоя нужно создать суперадмина через MongoDB Atlas:

1. MongoDB Atlas → Browse Collections → `scp_portal` → `users`
2. Найди своего пользователя (сначала зарегистрируйся через сайт как обычно)
3. Нажми Edit → измени поля:
   - `status`: `"approved"`
   - `role`: `"superadmin"`
4. Обновить

**ИЛИ** используй MongoDB Shell / Compass:
```javascript
db.users.updateOne(
  { username: "твой_логин" },
  { $set: { status: "approved", role: "superadmin" } }
)
```

---

## ФУНКЦИОНАЛ

### Для обычных пользователей:
- ✅ Регистрация с анкетой (3 шага)
- ✅ УД-карточка (0-6 + расширения)
- ✅ Личные сообщения (1 на 1)
- ✅ Групповые чаты
- ✅ Редактирование/удаление своих сообщений
- ✅ Ответы на сообщения
- ✅ Документация с проверкой УД
- ✅ Запросы на повышение УД
- ✅ Запросы доступа к документам
- ✅ Твинк-аккаунты (доп. аккаунты)
- ✅ Смена позывного

### Для суперадмина/админа:
- ✅ Одобрение/отклонение заявок на регистрацию
- ✅ Назначение своего ID сотрудника
- ✅ Управление УД пользователей
- ✅ Одобрение твинков
- ✅ Блокировка всей связи (кнопка "режим рейда")
- ✅ Блокировка отдельных ЛС и групп
- ✅ Просмотр всех переписок
- ✅ Выдача УД других служб (АПАИБ и др.)
- ✅ Создание документов с ограничением по УД

---

## ЛОКАЛЬНАЯ РАЗРАБОТКА

```bash
# Backend
cd backend
npm install
cp .env.example .env
# заполни .env
npm run dev

# Frontend (другой терминал)
cd frontend
npm install
cp .env.example .env
# заполни .env
npm start
```

---

## СТРУКТУРА

```
scp-portal/
├── backend/
│   ├── models/       # User, Message, Document, Request
│   ├── routes/       # auth, users, messages, documents, requests, admin, twins
│   ├── middleware/   # auth.js
│   ├── controllers/  # socketController.js
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── context/  # AuthContext
│   │   ├── pages/    # все страницы
│   │   ├── components/ # Layout
│   │   └── utils/    # api.js, clearance.js
│   └── public/
├── render.yaml
└── README.md
```
