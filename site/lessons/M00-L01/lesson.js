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
byId('answer').onchange = event => {
 const feedback = {old:'Верно. Флаг пропускает сборку, поэтому запускается прежний артефакт.',new:'Проверьте в пошаговом опыте, когда меняется версия DLL.',error:'Сборка уже существует. Какой этап пропускает флаг?', '':'Сначала сделайте прогноз.'};
 byId('feedback').textContent = feedback[event.target.value];
};

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
