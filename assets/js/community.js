const filterButtons = document.querySelectorAll('[data-filter]');
const posts = document.querySelectorAll('#postStack .post-card');

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    const filter = button.dataset.filter;
    posts.forEach(post => {
      const category = post.dataset.category;
      const show = filter === 'all' || filter === category;
      post.classList.toggle('hidden', !show);
    });
  });
});

function bindLikeButton(btn) {
  btn.addEventListener('click', () => {
    const counter = btn.querySelector('span');
    const current = Number(counter.textContent);
    const liked = btn.classList.toggle('active');
    counter.textContent = liked ? current + 1 : Math.max(current - 1, 0);
    btn.innerHTML = `${liked ? '♥' : '♡'} Appreciate <span>${counter.textContent}</span>`;
  });
}

document.querySelectorAll('.like-btn').forEach(bindLikeButton);

const composeForm = document.getElementById('composeForm');
const postStack = document.getElementById('postStack');

if (composeForm && postStack) {
  composeForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = document.getElementById('postTitle').value.trim();
    const category = document.getElementById('postCategory').value;
    const tags = document.getElementById('postTags').value
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
    const body = document.getElementById('postBody').value.trim();

    if (!title || !body) return;

    const categoryLabelMap = {
      reflection: 'Reflection',
      question: 'Discernment Question',
      growth: 'Growth Log',
      scroll: 'Scroll Thread'
    };

    const tagMarkup = [categoryLabelMap[category], ...tags]
      .map(tag => `<span class="tag">${tag}</span>`)
      .join('');

    const article = document.createElement('article');
    article.className = 'post-card';
    article.dataset.category = category;
    article.innerHTML = `
      <div class="post-head">
        <div class="post-user">
          <div class="avatar">Y</div>
          <div>
            <strong>You</strong>
            <span>${categoryLabelMap[category]} · Preview Mode</span>
          </div>
        </div>
        <div class="post-date">Just now</div>
      </div>
      <h3 style="margin-bottom: 10px;">${title}</h3>
      <p class="post-body">${body.replace(/\n/g, '<br>')}</p>
      <div class="tag-row">${tagMarkup}</div>
      <div class="action-row">
        <button class="pill-btn like-btn">♡ Appreciate <span>0</span></button>
        <button class="pill-btn">Comment</button>
        <button class="pill-btn">Save</button>
      </div>
    `;

    postStack.prepend(article);
    composeForm.reset();
    bindLikeButton(article.querySelector('.like-btn'));
    article.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
