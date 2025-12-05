import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.11.0", (api) => {
  let currentTopicId = null;

  // Track topic changes using onPageChange
  api.onPageChange((url, title) => {
    // Extract topic ID from URL pattern /t/slug/id
    const match = url.match(/\/t\/[^\/]+\/(\d+)/);
    currentTopicId = match ? parseInt(match[1], 10) : null;
  });

  // Register global click handler
  if (!window.__topicViewersClickRegistered) {
    window.__topicViewersClickRegistered = true;

    document.addEventListener("click", (event) => {
      const btn = event.target.closest(".topic-viewers-btn");
      if (!btn) {
        return;
      }

      // Get topic ID from data attribute or tracked value
      const topicId = btn.dataset.topicId
        ? parseInt(btn.dataset.topicId, 10)
        : currentTopicId;

      if (!topicId) {
        console.warn("No topic ID available");
        return;
      }

      event.preventDefault();
      openTopicViewersModal(topicId);
    });
  }
});

// Load viewer list from backend
function openTopicViewersModal(topicId) {
  fetch(`/topic-viewers/${topicId}.json`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      showTopicViewersOverlay(data.users || []);
    })
    .catch((e) => {
      console.error("Error loading topic viewers", e);
      showTopicViewersOverlay([]);
    });
}

// UI Overlay
function showTopicViewersOverlay(users) {
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

