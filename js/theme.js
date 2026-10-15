(() => {
  try {
    const saved = localStorage.getItem('kalkandam:theme');
    if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
  } catch {}
  const view = location.hash.slice(1).split('/')[0];
  if (view === 'convert' || view === 'try') document.documentElement.dataset.view = view;
})();
