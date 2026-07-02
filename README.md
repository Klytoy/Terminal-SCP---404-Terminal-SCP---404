# SITE-81 // TERMINAL_CORE

RP-терминал базы данных Фонда SCP для площадки **Site-81**. Стилизован под ретро-футуристичный
терминал 1980-х (сканлайны, фосфорно-зелёная палитра, моноширинные шрифты). Дизайн-система
описана в `DESIGN.md` (в корне вложенного архива дизайна) — использованы токены JetBrains Mono /
Space Mono и палитра "Phosphor-on-Black".

Репозиторий состоит из двух частей:

```
backend/    Node.js + Express + MongoDB (Mongoose) — API терминала
frontend/   React + Vite + TailwindCSS — клиентский терминал (SPA)
```

## Реализованный функционал (по ТЗ)

1. **Фракции / МОГ-отряды** — сидинг боевых отрядов по образцу Omega-1 («Расколотый шип» и др.),
   поля `callsignPrefix`, `specialization`, `status`.
2. **Допуски и расширения** — единый справочник `backend/config/extensions.js`, страница
   «Допуски» на фронтенде с уровнями 0–6 и расширениями (АпАИБ, СО, КпЭ, МТФ, НРП, ФФ и др.).
3. **Личные дела с нарушениями** — вкладка «Личное дело» у каждого сотрудника,
   `POST/GET/DELETE /api/users/:id/notes`, аналогично для `PersonnelRecord`.
4. **Твинк-аккаунты** — заявка → одобрение админом → создание аккаунта с `parentAccount`,
   `GET /api/admin/twins/:userId` для просмотра связи админом.
5. **Фальшивые удостоверения** — `fakeIdentity`, `PATCH /api/users/me/fake-identity` (требует СО),
   `GET /api/terminal/verify/:employeeId` с меткой `⚠ ОБНАРУЖЕНО НЕСООТВЕТСТВИЕ` для АпАИБ/admin.
6. **Терминальные ключи** — кража только при `infiltratedFraction === key.ownerFraction`,
   полный `usageLog`, `POST /api/terminal/keys/:id/revoke`.
7. **Логи для АпАИБ** — доступ по расширению (не только role), фильтры по `userId`/датам/`action`.
8. **Счёт фракции** — `Faction.balance` + `balanceLog`, перевод руководителем на личный счёт.
9. **Чёрный рынок** — категория `key` только при реальном владении ключом, `anonymous`-лоты,
   логирование сделок.
10. **НРП** — отдельная видимость в «Розыске» (`nrpVisibility`), `Document.requiredExtension`.
11. **Статусы персонала** — добавлен `vacation`, автоматический возврат в `active` по `vacationUntil`.

Все чувствительные операции защищены `auth` + `requireRole`/`requireExtension`/`requireClearance`
(см. `backend/middleware/auth.js`) и логируются через `createLog` в `ActivityLog`.

## Быстрый старт

### Backend

```bash
cd backend
cp .env.example .env    # укажите MONGO_URI и JWT_SECRET
npm install
npm run seed             # создаст фракции/МОГ-отряды и суперадмина (login: o5-1 / password: changeme123)
npm run dev               # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173 (проксирует /api на :4000)
```

Соберите продакшн-версию: `npm run build` (папка `dist/`).

## Технологии

- **Backend:** Node.js, Express, MongoDB/Mongoose, JWT (bcryptjs для паролей).
- **Frontend:** React 18, React Router, Vite, TailwindCSS (кастомная тема под терминал).

## Важно

- Смените пароль суперадмина `o5-1` сразу после первого входа.
- `JWT_SECRET` в `.env` обязательно замените на собственное значение перед деплоем.
- Все тексты интерфейса и ошибок — на русском, в духе внутренней документации Фонда.
