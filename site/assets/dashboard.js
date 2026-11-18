const { modules, published } = window.academy;
const byId = id => document.getElementById(id);
const category = byId('category');
const search = byId('search');
const availability = byId('available');
const panel = byId('module');
const menu = byId('modules');

function element(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

for (const group of new Set(modules.map(m => m.category))) category.add(new Option(group, group));
const first = modules.flatMap(m => m.lessons).find(l => published[l.id]);
if (first) {
  byId('start').href = published[first.id];
  byId('start').hidden = false;
}

function showModule(m, lessons) {
  panel.replaceChildren();
  const crumb = element('div', m.id + ' / ' + m.category, 'crumb');
  const title = element('h3', m.title);
  const info = element('p', m.hours + ' ч · Предпосылки: ', 'info');
  if (!m.prerequisites.length) info.append('можно начать сразу');
  for (const [index, id] of m.prerequisites.entries()) {
    if (index) info.append(', ');
    const link = element('a', id);
    link.href = '#' + id;
    link.addEventListener('click', () => {
      resetFilters();
      if (location.hash === link.hash) { render(); panel.focus(); }
    });
    info.append(link);
  }
  const list = element('ol', '', 'lesson-list');
  for (const lesson of lessons) {
    const path = published[lesson.id];
    const row = element(path ? 'a' : 'div', '', 'lesson-row');
    if (path) row.href = path;
    const label = element('span', '');
    label.append(element('small', lesson.id), element('span', lesson.title, 'lesson-title'));
    row.append(label, element('span', path ? 'Открыть →' : 'В плане', 'status'));
    const li = element('li', '');
    li.append(row);
    list.append(li);
  }
  panel.append(crumb, title, info, element('h4', 'Уроки'), list, element('h4', 'Практическая работа'), element('p', m.lab));
}

function resetFilters() { byId('filters').reset(); }

function render() {
  const query = search.value.trim().toLocaleLowerCase();
  const matches = text => text.toLocaleLowerCase().includes(query);
  const groups = [];
  for (const m of modules) {
    if (category.value && m.category !== category.value) continue;
    const moduleMatch = matches(m.id + ' ' + m.title);
    const lessons = m.lessons.filter(l => (moduleMatch || matches(l.id + ' ' + l.title)) &&
      (!availability.value || published[l.id]));
    if (lessons.length) groups.push({m, lessons});
  }
  const selected = groups.find(g => '#' + g.m.id === location.hash) || groups[0];
  menu.replaceChildren();
  panel.replaceChildren();
  let lessonCount = 0, live = 0;
  for (const {m, lessons} of groups) {
    lessonCount += lessons.length;
    live += lessons.filter(l => published[l.id]).length;
    const link = element('a', '');
    link.href = '#' + m.id;
    link.append(element('span', m.id, 'mid'), element('span', m.title));
    if (m === selected.m) link.setAttribute('aria-current', 'true');
    menu.append(link);
  }
  if (selected) showModule(selected.m, selected.lessons);
  byId('empty').hidden = Boolean(selected);
  byId('count').textContent = 'Модулей: ' + groups.length + ' · Уроков: ' + lessonCount + ' · Опубликовано: ' + live;
}

byId('filters').addEventListener('submit', e => e.preventDefault());
for (const control of [search, category, availability]) control.addEventListener('input', render);
byId('clear').onclick = () => { resetFilters(); render(); search.focus(); };
window.addEventListener('hashchange', () => {
  render();
  if (/^#M\d+$/.test(location.hash)) panel.focus();
});
render();
if (/^#M\d+$/.test(location.hash)) {
  menu.querySelector('[aria-current]')?.scrollIntoView({block:'nearest'});
  panel.focus();
}
