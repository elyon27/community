"use strict";
document.querySelectorAll('[data-password-target]').forEach(button => {
  const input = document.getElementById(button.dataset.passwordTarget);
  if (!input) return;
  const setVisible = visible => {
    input.type = visible ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(visible));
    button.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
    button.title = visible ? 'Hide password' : 'Show password';
  };
  button.addEventListener('click', () => setVisible(input.type === 'password'));
  input.form?.addEventListener('reset', () => setVisible(false));
  input.form?.addEventListener('submit', () => setVisible(false));
});
