import { apiInitializer } from "discourse/lib/api";
import { ajax } from "discourse/lib/ajax";

export default apiInitializer("0.11.0", (api) => {
  console.log("Topic Viewers initializer loaded");

  const siteSettings = api.container.lookup("site-settings:main");
  if (!siteSettings || !siteSettings.topic_viewers_enabled) {
    return;
  }

  function avatarUrlFor(user) {
    if (!user || !user.avatar_template) return "";
    return user.avatar_template.replace("{size}", "45");
  }

  function showTopicViewersOverlay(users) {
    const old = document.querySelector(".tv-overlay");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.className = "tv-overlay";
    overlay.style = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.45);
      z-index: 50000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const content = document.createElement("div");
    content.style = `
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      max-width: 720px;
      width: min(95%, 720px);
      max-height: 75%;
      overflow: auto;
    `;

    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h3 style="margin:0;font-size:1.1rem">Topic viewers</h3>
        <button class="tv-close" style="background:#eee;border:0;padding:6px 8px;border-radius:6px;cursor:pointer">
          Close
        </button>
      </div>
      <div class="tv-list" style="display:flex;flex-direction:column;gap:8px;"></div>
    `;

    const list = content.querySelector(".tv-list");

    if (!users || users.length === 0) {
      list.innerHTML = "<div style='color:#666'>No viewers found.</div>";
    } else {
      users.forEach((u) => {
        const item = document.createElement("div");
        item.style = "display:flex;gap:12px;align-items:center;padding:6px 0;";

        const img = document.createElement("img");
        img.src = avatarUrlFor(u);
        img.width = 45;
        img.height = 45;
        img.style = "border-radius:6px;object-fit:cover;";

        const info = document.createElement("div");
        info.innerHTML = `
          <div style="font-weight:600">${u.name || u.username}</div>
          <div style="font-size:0.9rem;color:#666">
            ${u.username} — ${new Date(u.viewed_at).toLocaleString()}
          </div>
        `;

        item.appendChild(img);
        item.appendChild(info);
        list.appendChild(item);
      });
    }

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    content.querySelector(".tv-close").onclick = () => overlay.remove();
  }

  document.addEventListener("click", (event) => {
    const btn = event.target.closest(".topic-viewers-btn");
    if (!btn) return;

    console.log("Topic Viewers button clicked");

    const topicId = btn.dataset.topicId;
    const postNumber = btn.dataset.postNumber || 1;

    if (!topicId) {
      console.error("Missing topic ID");
      return;
    }

    showTopicViewersOverlay([]);

    ajax(`/topic_viewers/${topicId}/${postNumber}`)
      .then((json) => {
        showTopicViewersOverlay(json.users || []);
      })
      .catch((err) => {
        console.error("Viewer fetch failed", err);
        showTopicViewersOverlay([]);
      });
  });
});
