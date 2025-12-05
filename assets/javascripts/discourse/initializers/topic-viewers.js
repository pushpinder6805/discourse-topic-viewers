import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.11.0", (api) => {
  // Use a global click handler to catch all buttons in the post stream
  document.addEventListener("click", (event) => {
    const btn = event.target.closest(".topic-viewers-btn");
    if (!btn) return;

    event.preventDefault();

    const topicId = btn.getAttribute("data-topic-id");
    const postNumber = btn.getAttribute("data-post-number");

    if (topicId && postNumber) {
      openTopicViewersModal(topicId, postNumber);
    }
  });
});

function openTopicViewersModal(topicId, postNumber) {
  // Pass post_number as a query parameter
  fetch(`/topic-viewers/${topicId}.json?post_number=${postNumber}`)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      showTopicViewersOverlay(data.users || []);
    })
    .catch((e) => {
      console.error("Error loading topic viewers", e);
      // Show empty list on error
      showTopicViewersOverlay([]);
    });
}

// ... (Keep your existing showTopicViewersOverlay function exactly as it is) ...
function showTopicViewersOverlay(users) {
  const old = document.querySelector(".tv-overlay");
  if (old) old.remove();

  const overlay = document.createElement("div");
  overlay.className = "tv-overlay";
  
  const content = document.createElement("div");
  content.className = "tv-modal";

  content.innerHTML = `
    <div class="tv-header">
      <span class="tv-title">Read by ${users.length} users</span>
      <button class="tv-close" type="button">×</button>
    </div>
    <div class="tv-body">
      ${users.length === 0 ? `<div class="tv-empty">No one has read this far yet.</div>` : 
      `<div class="tv-list">
          ${users.map(u => `
            <div class="tv-item">
              <img src="${u.avatar_url}" class="tv-avatar">
              <div class="tv-user-meta">
                <span class="tv-username">@${u.username}</span>
                <span class="tv-viewed-at">${new Date(u.viewed_at).toLocaleDateString()}</span>
              </div>
            </div>
          `).join('')}
       </div>`
      }
    </div>
  `;

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  // Close handlers
  overlay.onclick = (e) => { if(e.target === overlay) overlay.remove() };
  content.querySelector(".tv-close").onclick = () => overlay.remove();
}
