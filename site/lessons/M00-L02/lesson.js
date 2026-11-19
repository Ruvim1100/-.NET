'use strict';
const $ = id => document.getElementById(id);

// A guided simulation of a typical framework-dependent .NET application.
const stages = [
  {kind:'source',source:'Чай',assembly:null,runtime:'Не запущен',printed:'Пусто',title:'Сначала есть только C#-файл',detail:'Program.cs — обычный текст. Сам по себе он не содержит готовую сборку; для этого проекта нам нужен SDK и этап сборки.',next:'Собрать проект'},
  {kind:'build',source:'Чай',assembly:'IL: напечатать «Чай»; есть метаданные',runtime:'Не запущен',printed:'Пусто',title:'Сборка создала DLL',detail:'Компилятор C# подготовил IL и метаданные. dotnet build также создаёт нужные сопутствующие файлы. Консольная инструкция ещё не выполнялась.',next:'Рассмотреть DLL'},
  {kind:'build',source:'Чай',assembly:'IL + метаданные (не текст C#)',runtime:'Не запущен',printed:'Пусто',title:'Содержимое DLL — это не исходник и не обязательно машинный код',detail:'IL — промежуточные инструкции. Метаданные описывают типы и методы. В этом сценарии они будут обработаны средой исполнения.',next:'Загрузить сборку'},
  {kind:'load',source:'Чай',assembly:'IL + метаданные',runtime:'Runtime 11 загрузил приложение',printed:'Пусто',title:'Runtime загрузил приложение',detail:'При команде dotnet TraceFlow.dll хост выбирает совместимую среду исполнения и использует конфигурацию и зависимости. Это уже запуск готового артефакта.',next:'Подготовить машинные инструкции'},
  {kind:'load',source:'Чай',assembly:'IL + метаданные',runtime:'JIT: IL → машинный код метода',printed:'Пусто',title:'JIT подготовил метод к выполнению',detail:'В типичном сценарии JIT (Just-in-Time, компиляция по требованию) превращает нужный IL-метод в инструкции процессора. Другие модели публикации рассмотрим позже.',next:'Выполнить программу'},
  {kind:'execute',source:'Чай',assembly:'IL + метаданные',runtime:'Метод выполняется',printed:'Чай',title:'Программа вывела «Чай»',detail:'Процессор выполнил подготовленные инструкции, а Console.WriteLine отправил текст в стандартный вывод.',next:'Изменить исходник'},
  {kind:'source',source:'Кофе',assembly:'IL: напечатать «Чай»',runtime:'Последний запуск завершён',printed:'Чай',title:'Исходник изменён — DLL пока прежняя',detail:'Сохранили слово «Кофе» только в Program.cs. Сделай прогноз: что напечатает прямой запуск старой DLL?',next:'Проверить прямым запуском'},
  {kind:'execute',source:'Кофе',assembly:'IL: напечатать «Чай»',runtime:'Повторный запуск старой DLL',printed:'Чай',title:'Выполнилась старая DLL',detail:'Прямой запуск использовал артефакт с прошлой компиляции. Чтобы обновить инструкции в DLL, нужен новый build.',next:'Пересобрать и запустить'},
  {kind:'execute',source:'Кофе',assembly:'IL: напечатать «Кофе»',runtime:'Новая сборка, новый запуск',printed:'Кофе',title:'Новая сборка вывела «Кофе»',detail:'dotnet build обновил IL в DLL, после чего Runtime выполнил изменённую инструкцию. Теперь ты можешь повторить путь и объяснить каждый этап.',next:'Повторить сценарий'}
];
let stageIndex = 0;
const stageGuess = $('stage-guess');
function drawStage() {
  const data = stages[stageIndex];
  $('stage-source').textContent = 'Console.WriteLine("' + data.source + '");';
  $('stage-assembly').textContent = data.assembly === null ? 'Ещё не создана' : data.assembly;
  $('stage-runtime').textContent = data.runtime;
  $('stage-console').textContent = data.printed;
  $('stage-counter').textContent = 'Шаг ' + (stageIndex + 1) + ' из ' + stages.length;
  $('stage-heading').textContent = data.title;
  $('stage-explanation').textContent = data.detail;
  $('stage-prev').disabled = stageIndex === 0;
  $('stage-next').textContent = data.next + ' →';
  $('stage-prediction').hidden = stageIndex !== 6;
  $('stage-feedback').textContent = stageIndex === 7 ? 'Твой прогноз: ' + stageGuess.value + '. Фактический вывод: Чай.' : '';
  for (const tile of document.querySelectorAll('.stage-tile')) {
    tile.classList.toggle('active', tile.dataset.stage === data.kind);
  }
}
$('stage-next').addEventListener('click', () => {
  if (stageIndex === 6 && !stageGuess.value) {
    $('stage-feedback').textContent = 'Прежде чем проверить, выбери прогноз.';
    stageGuess.focus();
    return;
  }
  stageIndex = (stageIndex + 1) % stages.length;
  if (stageIndex === 0) stageGuess.value = '';
  drawStage();
});
$('stage-prev').addEventListener('click', () => { if(stageIndex>0) { stageIndex--; drawStage(); } });
$('stage-reset').addEventListener('click', () => { stageIndex=0; stageGuess.value=''; drawStage(); });
drawStage();

// An honest artifact explorer: binary payloads are explained, never faked as raw IL.
const artifacts = {
  cs:{kind:'ИСХОДНЫЙ ТЕКСТ',name:'Program.cs',display:'Console.WriteLine("Чай");',description:'Этот файл пишет разработчик. Он не нужен на машине, где запускается уже подготовленное приложение.'},
  dll:{kind:'БИНАРНАЯ СБОРКА',name:'TraceFlow.dll',display:'Бинарный PE-файл: IL и метаданные.\nТекстовое представление здесь намеренно не имитируется.',description:'Для нашего обычного проекта DLL содержит IL и описание типов. Runtime выполняет методы, обычно используя JIT для получения машинных инструкций.'},
  runtimeconfig:{kind:'КОНФИГУРАЦИЯ ИСПОЛНЕНИЯ',name:'TraceFlow.runtimeconfig.json',display:'{\n  "runtimeOptions": {\n    "tfm": "net11.0",\n    "framework": {\n      "name": "Microsoft.NETCore.App",\n      "version": "11.0.0"\n    }\n  }\n}',description:'Упрощённый пример для net11.0: файл сообщает, какой общий framework ожидается. Это не список установленных Runtime на машине.'},
  deps:{kind:'ЗАВИСИМОСТИ',name:'TraceFlow.deps.json',display:'Машинно-читаемое описание зависимостей.\nСтруктура и версии в реальном файле зависят от проекта.',description:'Помогает среде определить зависимости приложения. Это не исходный код и не лог запуска.'},
  pdb:{kind:'ОТЛАДОЧНАЯ ИНФОРМАЦИЯ',name:'TraceFlow.pdb',display:'Отладочные символы: соответствие сборки исходным строкам.',description:'Помогает отладчику сопоставлять исполняемые инструкции с исходниками. Для обычного запуска наличие PDB не является обязательным.'}
};
function showArtifact(key) {
  const info = artifacts[key];
  $('artifact-kind').textContent = info.kind;
  $('artifact-name').textContent = info.name;
  $('artifact-display').textContent = info.display;
  $('artifact-explain').textContent = info.description;
  for (const button of document.querySelectorAll('.artifact-choice')) {
    button.setAttribute('aria-pressed',String(button.dataset.file === key));
  }
}
document.querySelectorAll('.artifact-choice').forEach(button => button.addEventListener('click',() => showArtifact(button.dataset.file)));
showArtifact('cs');

// The independent experiment is a state machine, not a command executor.
let compiledWord = 'Чай';
let lastOutput = 'Ещё не запускали';
const sourceSelect = $('experiment-source');
const actionSelect = $('experiment-command');
const guessSelect = $('experiment-guess');
function renderExperiment() {
  $('experiment-draft').textContent = sourceSelect.value;
  $('experiment-binary').textContent = compiledWord;
  $('experiment-output').textContent = lastOutput;
}
sourceSelect.addEventListener('change', renderExperiment);
$('experiment-execute').addEventListener('click', () => {
  if (!guessSelect.value) {
    $('experiment-feedback').textContent = 'Сначала выбери прогноз, затем выполняй действие.';
    guessSelect.focus();
    return;
  }
  const command = actionSelect.value;
  let currentOutput = 'none';
  if (command === 'build') {
    compiledWord = sourceSelect.value;
    lastOutput = 'Сборка без запуска';
  } else {
    if (command === 'run') compiledWord = sourceSelect.value;
    currentOutput = compiledWord;
    lastOutput = compiledWord;
  }
  const correct = guessSelect.value === currentOutput;
  const description = command === 'build' ? 'build обновил DLL, но не исполнял программу.' :
    command === 'run' ? 'run подготовил актуальную сборку и запустил приложение.' :
    'Прямой запуск выполнил инструкции уже существующей DLL.';
  $('experiment-feedback').textContent = (correct ? 'Прогноз совпал. ' : 'Прогноз не совпал. ') +
    'Фактический результат: ' + (currentOutput === 'none' ? 'нет вывода программы' : currentOutput) + '. ' + description;
  renderExperiment();
});
$('experiment-reset').addEventListener('click', () => {
  compiledWord = 'Чай'; lastOutput = 'Ещё не запускали';
  sourceSelect.value = 'Чай'; actionSelect.value = 'build'; guessSelect.value = '';
  $('experiment-feedback').textContent = 'Эксперимент сброшен: DLL снова содержит «Чай».';
  renderExperiment();
});
renderExperiment();

// In-page answers: local-only draft, deterministic Markdown export, safe clipboard fallback.
const assessmentForm = $('assessment-form');
const questionBlocks = [...assessmentForm.querySelectorAll('[data-assessment-id]')];
const answerInputs = [...assessmentForm.querySelectorAll('[data-assessment-id] input,[data-assessment-id] textarea')];
const storageKey = 'dotnet-academy:M00-L02:2026-11-19.1';
const reportPreview = $('report-preview');
const reportResult = $('report-result');
const reportStatus = $('report-status');

function answersOf(block) {
  const inputs = [...block.querySelectorAll('input,textarea')];
  const processed = new Set();
  const answers = [];
  for (const input of inputs) {
    if(processed.has(input.name)) continue;
    processed.add(input.name);
    const group = inputs.filter(item=>item.name === input.name);
    const label = input.type === 'radio'||input.type === 'checkbox' ? 'Ответ' :
      (input.closest('label')?.childNodes[0]?.textContent?.trim() || input.name);
    let value = 'Не отвечено';
    if(input.type === 'radio' || input.type === 'checkbox') {
      const selected = group.filter(x=>x.checked);
      if(selected.length) value = selected.map(x=>x.closest('label').textContent.trim().replace(/\s+/g,' ')).join('; ');
    } else if(input.value.trim()) {
      value = input.value;
    }
    answers.push({label,value,filled:value!=='Не отвечено'});
  }
  return answers;
}
function updateProgress() {
  const necessary=questionBlocks.filter(x=>x.dataset.optional!=='true');
  const done=necessary.filter(x=>answersOf(x).every(a=>a.filled)).length;
  $('assessment-progress').max=necessary.length;
  $('assessment-progress').value=done;
  $('assessment-count').textContent=done+' из '+necessary.length+' разделов заполнено';
}
function buildReport() {
  const lines=[
    'C# & .NET Engineering Academy — отчёт ученика',
    'Урок: M00-L02 — От исходника до запуска',
    'Версия урока: 2026-11-19.1',
    'Сформировано: '+new Date().toLocaleString('ru-RU')+' (местное время устройства)',
    'Тип работы: M00, диагностическая, без проходного балла',
    '',
    '=== Вопросы и ответы ==='
  ];
  for (const block of questionBlocks) {
    lines.push('', block.querySelector('[data-report-title]').textContent.replace(/\s+/g,' ').trim());
    for (const a of answersOf(block)) lines.push(a.label+': '+a.value);
  }
  lines.push('','=== Конец отчёта ===');
  return lines.join('\n');
}
function persistDraft() {
  try {
    const data={};
    for (const input of answerInputs) data[input.id] = input.type==='radio'||input.type==='checkbox' ? input.checked : input.value;
    localStorage.setItem(storageKey,JSON.stringify(data));
  } catch { reportStatus.textContent='Локальное сохранение недоступно — скопируй отчёт до закрытия страницы.'; }
}
function restoreDraft() {
  try {
    const json=JSON.parse(localStorage.getItem(storageKey) || 'null');
    if(!json || typeof json!=='object' || Array.isArray(json)) return;
    for(const input of answerInputs) {
      if(!Object.prototype.hasOwnProperty.call(json,input.id)) continue;
      if(input.type==='radio'||input.type==='checkbox') input.checked=json[input.id]===true;
      else if(typeof json[input.id]==='string') input.value=json[input.id];
    }
  } catch { reportStatus.textContent='Не удалось восстановить черновик. Поля остаются доступными.'; }
}
function onEdit() {
  updateProgress();
  persistDraft();
  if(!reportResult.hidden) {
    reportPreview.value=buildReport();
    reportStatus.textContent='Отчёт обновлён после изменения ответа. Нажми «Собрать и скопировать» ещё раз.';
  }
}
assessmentForm.addEventListener('input',onEdit);
assessmentForm.addEventListener('change',onEdit);
$('report-copy').addEventListener('click',async()=>{
  const text=buildReport();
  reportResult.hidden=false;
  reportPreview.value=text;
  try {
    if(!navigator.clipboard?.writeText) throw new Error('Clipboard недоступен');
    await navigator.clipboard.writeText(text);
    reportStatus.textContent='Отчёт скопирован. Вставь его в чат для Code Review.';
  } catch {
    reportPreview.focus(); reportPreview.select();
    reportStatus.textContent='Автокопирование не сработало. Текст выделен: нажми Ctrl+C или «Копировать» на телефоне.';
  }
});
$('report-reset').addEventListener('click',()=>{
  if(!window.confirm('Удалить все ответы и локальный черновик M00-L02?')) return;
  assessmentForm.reset();
  try {localStorage.removeItem(storageKey);}catch { /* No local storage permission. */ }
  reportResult.hidden=true;
  reportPreview.value='';
  updateProgress();
  reportStatus.textContent='Ответы сброшены. Начни заполнение заново.';
});
restoreDraft();updateProgress();
