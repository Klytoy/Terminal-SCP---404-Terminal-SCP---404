# КАК БЕЗОПАСНО ОБНОВИТЬ НА GITHUB (не потерять старое)

## Метод 1 — Через GitHub (самый простой, без риска)

1. Зайди в репо на github.com
2. Нажми на папку `frontend/src/pages` 
3. Нажми **"Add file"** → **"Upload files"**
4. Перетащи новые файлы страниц из этого архива
5. Повтори для `backend/models`, `backend/routes`
6. Для изменённых файлов (Layout.js, App.js, api.js) — открой файл → нажми карандаш ✏️ → вставь новый код → **Commit**

## Метод 2 — Через Git (надёжный)

```bash
# 1. Перейди в папку репо
cd путь/к/репо

# 2. Создай новую ветку (ВАЖНО — не трогает main!)
git checkout -b v3-update

# 3. Скопируй все файлы из архива в репо (перезапиши)
# Просто скопируй содержимое scp-portal-v3/ в корень репо

# 4. Коммит
git add .
git commit -m "v3: personnel, collapsible sidebar, mobile"

# 5. Пуш новой ветки
git push origin v3-update

# 6. На GitHub: Pull Requests → New → v3-update → main → Merge
# Это безопасно — если что-то пойдёт не так, можно откатить!
```

## Метод 3 — Просто перезалить файлы

Самый простой:
1. Распакуй архив
2. Зайди в GitHub → твоё репо
3. Для каждого изменённого файла — нажми на него → карандаш → вставь новый код → Commit
4. Для новых файлов — Add file → Upload

## ЧТО ИЗМЕНИЛОСЬ В v3

### Новые файлы (просто добавить):
- `backend/models/PersonnelRecord.js`
- `backend/routes/personnel.js`  
- `frontend/src/pages/PersonnelPage.js`

### Изменённые файлы:
- `backend/models/User.js` — добавлены поля personnelStatus, biography, photo
- `backend/routes/users.js` — добавлен редакт/засекречивание по УД
- `backend/server.js` — добавлен роут /api/personnel
- `frontend/src/components/Layout.js` — сворачиваемое меню
- `frontend/src/App.js` — добавлен роут /personnel
- `frontend/src/utils/api.js` — новые функции
- `frontend/src/index.css` — мобильные стили

