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
let source = 1, binary = 1, last = null;
function show() {
  byId('state').textContent = 'Исходник: v' + source + '\nСборка: v' + binary + '\nПоследний вывод: ' + (last === null ? 'запуска ещё не было' : 'v' + last);
}
byId('edit').onclick = () => { source++; show(); };
byId('build').onclick = () => { binary = source; show(); };
byId('run').onclick = () => { last = binary; show(); };
byId('reset').onclick = () => { source = binary = 1; last = null; show(); };
byId('answer').onchange = event => {
 const feedback = {old:'Верно. Флаг пропускает сборку, поэтому запускается прежний артефакт.',new:'Проверьте в эксперименте 02, когда меняется версия DLL.',error:'Сборка уже существует. Какой этап пропускает флаг?', '':'Сначала сделайте прогноз.'};
 byId('feedback').textContent = feedback[event.target.value];
};
show();
