const components = {
  header: "/sections/01-header.html",
  hero: "/sections/02-hero.html",
  architecture: "/sections/03-architecture.html",
  feed: "/sections/04-community-feed.html",
  reflection: "/sections/05-reflection.html",
  role-progression: "/sections/06-role-progression.html",
  featured-gateways: "/sections/07-featured-gateways.html",
  community-events: "/sections/08-community-events.html",
  footer: "/sections/09-footer.html"
};

for (const id in components) {
  fetch(components[id])
    .then(res => res.text())
    .then(html => {
      document.getElementById(id).innerHTML = html;
    });
}