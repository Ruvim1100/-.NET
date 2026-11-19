const byId = id => document.getElementById(id);
function simulate() {
  const kit = byId('kit').value;
  const build = byId('op').value === 'build';
  const messages = {
    sdk: build ? 'Сборка успешна. SDK 11 поддерживает net11.0.' : 'Запуск успешен. В комплект входит Runtime 11.',
    runtime: build ? 'Сборка остановлена. Для исходников нужен SDK.' : 'Запуск успешен. Для этой готовой DLL достаточно Runtime 11.',
    ten: build ? 'Сборка остановлена. SDK 10 не поддерживает цель net11.0.' : 'Запуск остановлен. Приложению нужен Runtime 11.'
  };
  byId('result').textContent = messages[kit];
}
for (const id of ['kit','op']) byId(id).addEventListener('change',simulate);
simulate();

// Each row records what is observable immediately after one action.
const steps = [
  ['Чай', null, null, 'Сначала есть только исходный файл', 'Чтобы подготовить программу к запуску, соберите проект. Посмотрите, в какой из трёх областей появится результат.', 'Собрать проект'],
  ['Чай', 'Чай', null, 'Появилась первая сборка', 'Сборка (build) перевела сохранённый код в инструкции в DLL. Программа ещё не запускалась. Что она напечатает при запуске?', 'Запустить сборку'],
  ['Чай', 'Чай', 'Чай', 'Программа напечатала слово', 'При запуске выполнилась инструкция из DLL. Теперь измените в исходном файле слово «Чай» на «Кофе».', 'Сохранить «Кофе» в исходнике'],
  ['Кофе', 'Чай', 'Чай', 'Исходник изменился', 'Сравните файл и сборку. Что произойдёт, если ещё раз запустить готовую DLL?', 'Проверить запуском'],
  ['Кофе', 'Чай', 'Чай', 'Запустилась прежняя сборка', 'Команда выполнила инструкцию из существующей DLL. Чтобы новое слово попало в сборку, снова соберите проект.', 'Собрать заново'],
  ['Кофе', 'Кофе', 'Чай', 'Новая инструкция уже в DLL', 'Последний вывод всё ещё хранит результат предыдущего запуска. Проверьте, что произойдёт при следующем.', 'Запустить новую сборку'],
  ['Кофе', 'Кофе', 'Кофе', 'Новая сборка напечатала «Кофе»', 'Сохранение изменило исходник, сборка обновила DLL, запуск дал новый вывод. Повторите опыт или перейдите к командам ниже.', 'Повторить с начала']
];
let stage = 0;
const guess = byId('guess');
function paintStep() {
  const [source, binary, printed, title, explanation, next] = steps[stage];
  byId('source').textContent = 'Console.WriteLine("' + source + '");';
  byId('binary').textContent = binary === null ? 'Ещё не создана' : 'Инструкция: напечатать «' + binary + '»';
  byId('console').textContent = printed ?? 'Запуска ещё не было';
  byId('position').textContent = 'Шаг ' + (stage + 1) + ' из ' + steps.length;
  byId('step-title').textContent = title;
  byId('reason').textContent = explanation;
  byId('next').textContent = next;
  byId('back').disabled = stage === 0;
  byId('prediction').hidden = stage !== 3;
  byId('notice').textContent = stage === 4 ? 'Ваш прогноз: ' + guess.value + '. Фактический вывод: Чай.' : '';
}
byId('next').onclick = () => {
  if (stage === 3 && !guess.value) {
    byId('notice').textContent = 'Выберите прогноз, затем проверьте его запуском.';
    guess.focus();
    return;
  }
  stage = (stage + 1) % steps.length;
  if (stage === 0) guess.value = '';
  paintStep();
};
byId('back').onclick = () => { stage--; paintStep(); };
paintStep();

const draft = byId('draft');
let compiled = draft.value;
let printed = null;
function showBench() {
  byId('free-state').textContent = 'DLL напечатает: «' + compiled + '»\nПоследний вывод: ' +
    (printed === null ? 'запуска ещё не было' : '«' + printed + '»');
}
byId('compile').onclick = () => { compiled = draft.value; showBench(); };
byId('execute').onclick = () => { printed = compiled; showBench(); };
byId('restart').onclick = () => { draft.value = compiled = 'Чай'; printed = null; showBench(); };
showBench();

// The report is a private local draft; nothing is sent to a server.
const reportForm = byId('assessment-form');
const reportBlocks = [...reportForm.querySelectorAll('[data-assessment-id]')];
const reportFields = [...reportForm.querySelectorAll('[data-assessment-id] input, [data-assessment-id] textarea, [data-assessment-id] select')];
const reportVersion = '2026-11-19.1';
const reportStorageKey = 'dotnet-academy:M00-L01:answers:' + reportVersion;
const reportResult = byId('report-result');
const reportPreview = byId('report-preview');
const reportStatus = byId('report-status');

function getGroupAnswers(block) {
  const fields = [...block.querySelectorAll('input, textarea, select')];
  const visitedNames = new Set();
  const results = [];
  for (const field of fields) {
    if (visitedNames.has(field.name)) continue;
    visitedNames.add(field.name);
    const sameName = fields.filter(item => item.name === field.name);
    const label = field.dataset.answerLabel || 'Ответ';
    let answer = 'Не отвечено';
    if (field.type === 'radio' || field.type === 'checkbox') {
      const selected = sameName.filter(item => item.checked);
      if (selected.length) {
        answer = selected.map(item => item.closest('label').textContent.replace(/\s+/g, ' ').trim()).join('; ');
      }
    } else if (field.value.trim()) {
      // Preserve the original line breaks and spacing in code and terminal logs.
      answer = field.value;
    }
    results.push({label, answer, answered: answer !== 'Не отвечено'});
  }
  return results;
}

function updateReportProgress() {
  const required = reportBlocks.filter(block => block.dataset.optional !== 'true');
  const completed = required.filter(block => getGroupAnswers(block).every(item => item.answered)).length;
  byId('assessment-progress').max = required.length;
  byId('assessment-progress').value = completed;
  byId('assessment-count').textContent = completed + ' из ' + required.length + ' разделов заполнено';
}

function makeReviewReport() {
  const content = [
    'C# & .NET Engineering Academy — отчёт ученика',
    'Урок: M00-L01 — SDK и Runtime: как проверить среду',
    'Версия урока: ' + reportVersion,
    'Сформировано: ' + new Date().toLocaleString('ru-RU') + ' (местное время устройства)',
    'Тип работы: диагностика M00, без проходного балла',
    '',
    '=== Проверка понимания ==='
  ];
  for (const block of reportBlocks) {
    if (block.dataset.assessmentId === 'P01') content.push('', '=== Самостоятельная практика ===');
    const heading = block.querySelector('[data-report-title]').textContent.replace(/\s+/g, ' ').trim();
    content.push('', heading);
    for (const item of getGroupAnswers(block)) {
      content.push(item.label + ': ' + item.answer);
    }
  }
  content.push('', '=== Конец отчёта ===');
  return content.join('\n');
}

function saveReviewDraft() {
  try {
    const snapshot = {};
    for (const field of reportFields) {
      snapshot[field.id] = field.type === 'checkbox' || field.type === 'radio' ? field.checked : field.value;
    }
    localStorage.setItem(reportStorageKey, JSON.stringify(snapshot));
  } catch {
    reportStatus.textContent = 'Локальный черновик не удалось сохранить. Скопируй отчёт до закрытия страницы.';
  }
}

function restoreReviewDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(reportStorageKey) || 'null');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
    for (const field of reportFields) {
      if (!Object.prototype.hasOwnProperty.call(saved, field.id)) continue;
      if (field.type === 'radio' || field.type === 'checkbox') {
        field.checked = saved[field.id] === true;
      } else if (typeof saved[field.id] === 'string') {
        field.value = saved[field.id];
      }
    }
  } catch {
    reportStatus.textContent = 'Сохранённый черновик недоступен. Можно заполнить форму заново.';
  }
}

function onAssessmentInput() {
  updateReportProgress();
  saveReviewDraft();
  if (!reportResult.hidden) {
    reportPreview.value = makeReviewReport();
    reportStatus.textContent = 'Ответы изменены. Отчёт обновлён — нажми «Собрать и скопировать», чтобы скопировать новую версию.';
  }
}
reportForm.addEventListener('input', onAssessmentInput);
reportForm.addEventListener('change', onAssessmentInput);

byId('report-copy').addEventListener('click', async () => {
  const report = makeReviewReport();
  reportPreview.value = report;
  reportResult.hidden = false;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API недоступен');
    await navigator.clipboard.writeText(report);
    reportStatus.textContent = 'Отчёт скопирован! Теперь вставь его в чат для Code Review.';
  } catch {
    reportPreview.focus();
    reportPreview.select();
    reportStatus.textContent = 'Автокопирование недоступно. Текст отчёта выделен ниже: нажми Ctrl+C (или «Копировать» на телефоне).';
  }
});

byId('report-reset').addEventListener('click', () => {
  if (!window.confirm('Удалить все ответы и локальный черновик этого урока?')) return;
  reportForm.reset();
  try { localStorage.removeItem(reportStorageKey); } catch { /* Storage may be disabled. */ }
  reportResult.hidden = true;
  reportPreview.value = '';
  updateReportProgress();
  reportStatus.textContent = 'Ответы сброшены. Можно пройти диагностику снова.';
});

restoreReviewDraft();
updateReportProgress();
