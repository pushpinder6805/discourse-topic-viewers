import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.11.0", (api) => {
  const siteSettings = api.container.lookup("site-settings:main");
  if (!siteSettings.topic_viewers_enabled) {
    console.log("Topic Viewers plugin disabled or missing setting");
    return;
  }

  console.log("Topic Viewers initializer loaded");

  document.addEventListener("click", (event) => {
    const btn = event.target.closest(".topic-viewers-btn");
    if (!btn) return;

    console.log("Topic Viewers button clicked"); // DEBUG

    const topicId = btn.dataset.topicId;
    const postNumber = btn.dataset.postNumber || 0;

    fetch(`/topic_viewers/${topicId}/${postNumber}`)
      .then((r) => r.json())
      .then((data) => {
        console.log("Fetched viewers:", data);
      })
      .catch((e) => console.error("Viewer fetch failed", e));
  });
});
