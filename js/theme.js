(() => {
  try {
    const saved = localStorage.getItem('kalkandam:theme');
    if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
  } catch {}
})();
