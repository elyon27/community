"use strict";
const form = document.getElementById('chamberForm');
if (form) {
  const date = document.getElementById('entryDate');
  const now = new Date();
  date.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const title = document.querySelector('[data-chamber]').dataset.chamber;
  let dirty = false;
  form.addEventListener('entry-saved', () => { dirty = false; });
  form.addEventListener('input', () => { dirty = true; });
  window.addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  function entry() {
    return title + '\n' + date.value + '\n\n' + [...form.querySelectorAll('textarea')].map(field => field.name + '\n' + field.value.trim()).join('\n\n');
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    document.getElementById('entryPreview').textContent = entry();
    document.getElementById('previewPanel').hidden = false;
    document.getElementById('entryStatus').textContent = 'Preview ready below. This entry has not been published.';
  });
  document.getElementById('downloadEntry').addEventListener('click', () => {
    if (!form.reportValidity()) return;
    const url = URL.createObjectURL(new Blob([entry()], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = title.toLowerCase().replaceAll(' ', '-') + '-' + date.value + '.txt';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    dirty = false;
    document.getElementById('entryStatus').textContent = 'Download requested. Keep your copy before leaving this page.';
  });
}
const timer = document.getElementById('timer');
if (timer) {
  let remaining = 300, deadline = 0, interval = null;
  const start = document.getElementById('startTimer');
  const status = document.getElementById('timerStatus');
  function render() { timer.textContent = String(Math.floor(remaining/60)).padStart(2,'0') + ':' + String(remaining%60).padStart(2,'0'); }
  function tick() {
    remaining = Math.max(0, Math.ceil((deadline-Date.now())/1000)); render();
    if (!remaining) { clearInterval(interval); interval=null; start.textContent='Begin again'; status.textContent='Your quiet time is complete. Take a moment to give thanks.'; }
  }
  start.addEventListener('click', () => {
    if (interval) { tick(); clearInterval(interval); interval=null; start.textContent='Continue'; status.textContent='Paused.'; return; }
    if (!remaining) remaining=300;
    deadline=Date.now()+remaining*1000; interval=setInterval(tick,250); start.textContent='Pause'; status.textContent='Quiet time in progress.';
  });
  document.getElementById('resetTimer').addEventListener('click', () => { clearInterval(interval); interval=null; remaining=300; render(); start.textContent='Begin five minutes'; status.textContent='Begin whenever you are ready.'; });
}
