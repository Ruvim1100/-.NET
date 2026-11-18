# Данные и публикация

roadmap.json хранит план и зависимости. build-catalog.mjs сопоставляет ID с реальными каталогами site/lessons, проверяет пару lesson.json + index.html и создаёт catalog.json и автономный catalog.js. Dashboard работает также через file://. GitHub Actions проверяет изменения, публикует только site/. Персональные работы и результаты доступны отдельно в Google Sheets.
