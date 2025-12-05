import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("1.14.0", (api) => {
  if (!api.siteSettings.topic_viewers_enabled) {
    return;
  }

  let currentTopicId = null;

  // Track current topic ID
  api.onAppEvent("topic:current-changed", (topic) => {
    currentTopicId = topic?.id || null;
  });

  // Attach a single global click handler
  if (!window.__topicViewersClickRegistered) {
    window.__topicViewersClickRegistered = true;

    document.addEventListener("click", (event) => {
      const button = event.target.closest(".topic-map__views-trigger");
      if (!button) {
        return;
      }
      if (!currentTopicId) {
        return;
      }

      event.preventDefault();
      openTopicViewersModal(currentTopicId);
    });
  }
});

function openTopicViewersModal(topicId) {
  fetch(`/topic-viewers/${topicId}.json`)
    .then((response) => response.json())
    .then((data) => {
      showTopicViewersOverlay(data.users || []);
    })
    .catch((e) => {
      // Silent fail in UI, or log to console
      // eslint-disable-next-line no-console
      console.error("Error loading topic viewers", e);
    });
}

function showTopicViewersOverlay(users) {
  // Remove old overlay if any
  const old = document.querySelector(".tv-overlay");
  if (old) {
    old.remove();
  }

  const overlay = document.createElement("div");
  overlay.className = "tv-overlay";

  const content = document.createElement("div");
  content.className = "tv-modal";

  content.innerHTML = `
    <div class="tv-header">
      <span class="tv-title">Users who viewed this topic</span>
      <button class="tv-close" type="button" aria-label="Close">×</button>
    </div>
    <div class="tv-body">
      ${
        users.length === 0
          ? `<div class="tv-empty">No viewer data available.</div>`
          : `
        <div class="tv-list">
          ${users
            .map((u) => {
              const viewedDate = u.viewed_at
                ? new Date(u.viewed_at).toLocaleString()
                : "";
              const name = u.name || "";
              return `
                <div class="tv-item">
                  <img src="${u.avatar_url}" class="tv-avatar" loading="lazy" />
                  <div class="tv-user-meta">
                    <div class="tv-line">
                      <span class="tv-username">@${u.username}</span>
                      ${
                        name
                          ? `<span class="tv-name">(${escapeHtml(name)})</span>`
                          : ""
                      }
                    </div>
                    ${
                      viewedDate
                        ? `<div class="tv-viewed-at">${viewedDate}</div>`
                        : ""
                    }
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `
      }
    </div>
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // Close handlers
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  const closeBtn = content.querySelector(".tv-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => overlay.remove());
  }
}

function escapeHtml(str) {
  if (!str) {
    return "";
  }
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
