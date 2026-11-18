const { modules, published } = window.academy;
const find = id => document.getElementById(id);
const category = find('category');
for (const group of new Set(modules.map(m => m.category))) category.add(new Option(group, group));
function render() {
  const query = find('search').value.trim().toLocaleLowerCase();
  const host = find('modules');
  host.replaceChildren();
  let total = 0, ready = 0;
  for (const m of modules) {
    const available = m.lessons.filter(l => published[l.id]);
    const searchable = [m.id, m.title, ...m.lessons.map(l => l.id + ' ' + l.title)].join(' ').toLocaleLowerCase();
    if (!searchable.includes(query) || (category.value && category.value !== m.category) || (find('available').value && !available.length)) continue;
    const box = document.createElement('details');
    box.id = m.id;
    box.open = Boolean(query) || location.hash === '#' + m.id || (!location.hash && m.id === 'M00');
    const summary = document.createElement('summary');
    summary.textContent = m.id + ' · ' + m.title + ' (' + available.length + '/' + m.lessons.length + ')';
    const description = document.createElement('p');
    description.textContent = m.lab + '. Предпосылки: ' + (m.prerequisites.join(', ') || 'нет') + '. Ориентир: ' + m.hours + ' ч.';
    const list = document.createElement('ol');
    for (const lesson of m.lessons) {
      const li = document.createElement('li');
      const item = document.createElement(published[lesson.id] ? 'a' : 'span');
      item.textContent = lesson.id + ' · ' + lesson.title + (published[lesson.id] ? '' : ' · запланирован');
      if (published[lesson.id]) item.href = published[lesson.id];
      li.append(item); list.append(li);
    }
    box.append(summary, description, list); host.append(box);
    total += m.lessons.length; ready += available.length;
  }
  find('count').textContent = 'Модулей: ' + host.children.length + ' · Уроков в плане: ' + total + ' · Опубликовано: ' + ready;
}
for (const id of ['search', 'category', 'available']) find(id).addEventListener('input', render);
render();
