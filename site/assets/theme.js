const root = document.documentElement;
let saved;
try { saved = localStorage.getItem('academy-theme'); } catch {}
root.dataset.theme = saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.querySelector('#theme').addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('academy-theme', root.dataset.theme); } catch {}
});
