import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.11.0", (api) => {
  // Only run when plugin enabled on the site
  const siteSettings = api.container.lookup("site-settings:main");
  if (!siteSettings || !siteSettings.topic_viewers_enabled) {
    return;
  }

  // helper to build avatar URL
  function avatarUrlFor(user) {
    if (!user || !user.avatar_template) return "";
    // Discourse avatar_template may contain {size}
    return user.avatar_template.replace("{size}", "45");
  }

  // Create and show overlay with list of users
  function showTopicViewersOverlay(users, topicId, postNumber) {
    const old = document.querySelector(".tv-overlay");
    if (old) old.remove();

    const overlay = document.createElement("div");
    overlay.className = "tv-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.right = 0;
    overlay.style.bottom = 0;
    overlay.style.background = "rgba(0,0,0,0.45)";
    overlay.style.zIndex = 50000;
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";

    const content = document.createElement("div");
    content.className = "tv-content";
    content.style.background = "#fff";
    content.style.borderRadius = "8px";
    content.style.padding = "16px";
    content.style.maxWidth = "720px";
    content.style.width = "min(95%, 720px)";
    content.style.maxHeight = "75%";
    content.style.overflow = "auto";
    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <h3 style="margin:0;font-size:1.1rem">Topic viewers</h3>
        <button class="tv-close" aria-label="Close" style="background:#eee;border:0;padding:6px 8px;border-radius:6px;cursor:pointer">Close</button>
      </div>
      <div class="tv-list" style="display:flex;flex-direction:column;gap:8px;"></div>
    `;

    const list = content.querySelector(".tv-list");

    if (!users || users.length === 0) {
      list.innerHTML = "<div style='color:#666'>No viewers found.</div>";
    } else {
      users.forEach((u) => {
        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.gap = "12px";
        item.style.padding = "6px 0";
        const img = document.createElement("img");
        img.src = avatarUrlFor(u) || "/images/default-avatar.png";
        img.width = 45;
        img.height = 45;
        img.style.borderRadius = "6px";
        img.style.objectFit = "cover";

        const info = document.createElement("div");
        info.style.display = "flex";
        info.style.flexDirection = "column";

        const name = document.createElement("div");
        name.style.fontWeight = "600";
        name.textContent = u.name || u.username;

        const usermeta = document.createElement("div");
        usermeta.style.fontSize = "0.9rem";
        usermeta.style.color = "#666";
        const viewedAt = u.viewed_at ? new Date(u.viewed_at) : null;
        usermeta.textContent = `${u.username}${viewedAt ? " — " + viewedAt.toLocaleString() : ""}`;

        info.appendChild(name);
        info.appendChild(usermeta);

        item.appendChild(img);
        item.appendChild(info);
        list.appendChild(item);
      });
    }

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Close handlers
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    content.querySelector(".tv-close").onclick = () => overlay.remove();
  }

  // Click handler for button (delegated)
  document.addEventListener("click", (event) => {
    const btn = event.target.closest(".topic-viewers-btn");
    if (!btn) return;

    event.preventDefault();

    const topicId = btn.getAttribute("data-topic-id");
    const postNumber = btn.getAttribute("data-post-number");

    if (!topicId) return;

    // show a loading overlay while we fetch
    showTopicViewersOverlay([], topicId, postNumber);

    const path = `/topic_viewers/${topicId}/${postNumber || 0}`;
    fetch(path, { credentials: "same-origin" })
      .then((r) => {
        if (!r.ok) throw new Error("Network error");
        return r.json();
      })
      .then((json) => {
        const users = json && json.users ? json.users : [];
        // replace overlay contents with actual list
        const old = document.querySelector(".tv-overlay");
        if (old) old.remove();
        showTopicViewersOverlay(users, topicId, postNumber);
      })
      .catch((err) => {
        console.error("Topic viewers fetch failed:", err);
        const old = document.querySelector(".tv-overlay");
        if (old) old.remove();
        showTopicViewersOverlay([], topicId, postNumber);
      });
  });
});
