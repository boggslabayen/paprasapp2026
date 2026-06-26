const Link = Quill.import("formats/link");

class ContentButtonLink extends Link {
  static create(value) {
    const href = typeof value === "string" ? value : value.href;
    const node = super.create(href);
    node.setAttribute("href", href);
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
    node.classList.add("content-button");
    return node;
  }

  static formats(domNode) {
    return domNode.getAttribute("href");
  }
}

ContentButtonLink.blotName = "contentButton";
ContentButtonLink.tagName = "a";
ContentButtonLink.className = "content-button";

Quill.register(ContentButtonLink);

const quill = new Quill("#editor", {
  theme: "snow",
  placeholder: "Write your post here...",
  modules: {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote", "code-block"],
        ["link", "image", "contentButton"],
        ["clean"]
      ],
      handlers: {
        image: handleEditorImageUpload,
        contentButton: handleEditorButtonInsert
      }
    }
  }
});

const postForm = document.getElementById("postForm");
const editorElement = document.getElementById("editor");
const bannerFile = document.getElementById("bannerFile");
const bannerUrlInput = document.getElementById("bannerUrl");
const bannerStatus = document.getElementById("bannerStatus");
const bannerPreview = document.getElementById("bannerPreview");
const publishBtn = document.getElementById("publishBtn");
const contentHtmlInput = document.getElementById("contentHtml");
const removeBannerBtn = document.getElementById("removeBannerBtn");
const contentButtonToolbarBtn = document.querySelector(".ql-contentButton");

// Optional (edit screen preload)
const contentHtmlInitial = document.getElementById("contentHtmlInitial");

let isUploadingBanner = false;
let isUploadingEditorImage = false;
let currentPreviewObjectUrl = null;

function setStatus(msg, type) {
  if (!bannerStatus) return;
  bannerStatus.textContent = msg || "";
  bannerStatus.className = "status";
  if (type === "error") bannerStatus.classList.add("error");
  if (type === "ok") bannerStatus.classList.add("ok");
}

function createEditorStatus() {
  if (!editorElement) return null;

  const status = document.createElement("div");
  status.id = "editorStatus";
  status.className = "status editor-status";
  editorElement.insertAdjacentElement("afterend", status);
  return status;
}

const editorStatus = createEditorStatus();

function setEditorStatus(msg, type) {
  if (!editorStatus) return;
  editorStatus.textContent = msg || "";
  editorStatus.className = "status editor-status";
  if (type === "error") editorStatus.classList.add("error");
  if (type === "ok") editorStatus.classList.add("ok");
}

function setPublishingEnabled(enabled) {
  if (!publishBtn) return;
  publishBtn.disabled = !enabled;
  publishBtn.classList.toggle("disabled", !enabled);
}

function updatePublishButtonState() {
  setPublishingEnabled(!isUploadingBanner && !isUploadingEditorImage);
}

function isEditorEmpty() {
  const hasText = quill.getText().trim().length > 0;
  const hasImage = !!quill.root.querySelector("img");
  return !hasText && !hasImage;
}

function normalizeExternalUrl(url) {
  const trimmedUrl = (url || "").trim();
  if (!trimmedUrl) return "";

  const normalizedUrl = /^https?:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;

  try {
    const parsedUrl = new URL(normalizedUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) return "";
    if (!parsedUrl.hostname) return "";
    return parsedUrl.href;
  } catch {
    return "";
  }
}

function hasBanner() {
  return !!(bannerUrlInput?.value || bannerPreview?.getAttribute("src"));
}

function updateBannerControls() {
  if (bannerPreview) bannerPreview.style.display = hasBanner() ? "block" : "none";
  if (removeBannerBtn) removeBannerBtn.style.display = hasBanner() ? "inline-flex" : "none";
}

function revokePreviewObjectUrl() {
  if (currentPreviewObjectUrl) {
    URL.revokeObjectURL(currentPreviewObjectUrl);
    currentPreviewObjectUrl = null;
  }
}

function clearBannerUI({ keepStatus = false } = {}) {
  // Don’t destroy uploaded banner on server here—this is purely UI/state.
  if (bannerUrlInput) bannerUrlInput.value = "";
  if (bannerFile) bannerFile.value = "";

  revokePreviewObjectUrl();

  if (bannerPreview) {
    bannerPreview.removeAttribute("src");
    bannerPreview.style.display = "none";
  }

  if (!keepStatus) setStatus("", "");
  updateBannerControls();
}

// Optional: won’t break if server endpoint doesn’t exist
async function deleteBannerOnServer(urlToDelete) {
  if (!urlToDelete) return;
  try {
    await fetch("/upload-banner", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlToDelete })
    });
  } catch (e) {
    console.warn("Could not delete banner from server:", e);
  }
}

async function uploadEditorImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch("/upload-content-image", {
    method: "POST",
    body: formData
  });

  const raw = await res.text();
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  if (!res.ok) {
    const msg = data?.error || raw || `Upload failed (HTTP ${res.status})`;
    throw new Error(msg);
  }
  if (!data.url) throw new Error("Server did not return a url");

  return data.url;
}

function handleEditorImageUpload() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setEditorStatus("Please choose an image file.", "error");
      return;
    }

    const range = quill.getSelection(true);

    try {
      isUploadingEditorImage = true;
      updatePublishButtonState();
      setEditorStatus("Uploading image...", "");

      const imageUrl = await uploadEditorImage(file);
      quill.insertEmbed(range.index, "image", imageUrl, "user");
      quill.setSelection(range.index + 1, 0, "silent");
      setEditorStatus("Image added to content.", "ok");
    } catch (err) {
      setEditorStatus(`Image upload error: ${err.message}`, "error");
      console.error("Editor image upload error:", err);
    } finally {
      isUploadingEditorImage = false;
      updatePublishButtonState();
    }
  });

  input.click();
}

function handleEditorButtonInsert() {
  const range = quill.getSelection(true);
  const selectedText = quill.getText(
    range.index,
    range.length
  ).trim();

  const buttonText = window.prompt("Button text", selectedText || "Learn more");
  if (!buttonText?.trim()) return;

  const buttonUrl = normalizeExternalUrl(window.prompt("External link URL", "https://"));
  if (!buttonUrl) {
    alert("Please enter a valid external link.");
    return;
  }

  if (range.length > 0) {
    quill.deleteText(range.index, range.length, "user");
  }

  quill.insertText(range.index, buttonText.trim(), "contentButton", buttonUrl, "user");
  quill.insertText(range.index + buttonText.trim().length, "\n", "user");
  quill.setSelection(range.index + buttonText.trim().length + 1, 0, "silent");
}

if (contentButtonToolbarBtn) {
  contentButtonToolbarBtn.setAttribute("type", "button");
  contentButtonToolbarBtn.setAttribute("title", "Insert button link");
  contentButtonToolbarBtn.textContent = "Button";
}

// Hydrate existing content/banner for edit screens
function hydrateEditScreenIfPresent() {
  // Quill HTML preload
 const contentContainer = document.getElementById("contentHtmlInitial");
if (contentContainer && contentContainer.innerHTML.trim()) {
  quill.root.innerHTML = contentContainer.innerHTML;
}

  // Banner preload (bannerUrlInput is server-rendered with a value)
  const existingBannerUrl = bannerUrlInput?.value?.trim();
  if (existingBannerUrl && bannerPreview) {
    // IMPORTANT: do NOT set currentPreviewObjectUrl here (it’s not an object URL)
    bannerPreview.src = existingBannerUrl;
  }

  updateBannerControls();
}

removeBannerBtn?.addEventListener("click", async () => {
  const urlToDelete = bannerUrlInput?.value?.trim();

  // Clear client-side immediately so form submits with empty bannerUrl
  clearBannerUI();

  // Optional server cleanup
  await deleteBannerOnServer(urlToDelete);
});

bannerFile?.addEventListener("change", async () => {
  const file = bannerFile.files && bannerFile.files[0];

  // User canceled file dialog
  if (!file) {
    updateBannerControls();
    return;
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    setStatus("Please choose an image file.", "error");
    clearBannerUI({ keepStatus: true });
    return;
  }

  // New selection replaces existing banner URL (until upload returns a new one)
  if (bannerUrlInput) bannerUrlInput.value = "";

  // Local preview (safe: revoke prior object URL)
  revokePreviewObjectUrl();
  currentPreviewObjectUrl = URL.createObjectURL(file);

  if (bannerPreview) {
    bannerPreview.src = currentPreviewObjectUrl;
    bannerPreview.style.display = "block";
  }
  updateBannerControls();

  const formData = new FormData();
  formData.append("banner", file);

  try {
    isUploadingBanner = true;
    updatePublishButtonState();
    setStatus("Uploading banner...", "");

    const res = await fetch("/upload-banner", { method: "POST", body: formData });

    const raw = await res.text();
    let data = {};
    try { data = JSON.parse(raw); } catch {}

    if (!res.ok) {
      const msg = data?.error || raw || `Upload failed (HTTP ${res.status})`;
      throw new Error(msg);
    }
    if (!data.url) throw new Error("Server did not return a url");

    // Replace preview with returned URL (not object URL)
    revokePreviewObjectUrl();
    if (bannerPreview) bannerPreview.src = data.url;

    if (bannerUrlInput) bannerUrlInput.value = data.url;
    setStatus("Banner uploaded.", "ok");
    updateBannerControls();
  } catch (err) {
    if (bannerUrlInput) bannerUrlInput.value = "";
    setStatus(`Banner upload error: ${err.message}`, "error");
    console.error("Banner upload error:", err);

    // Keep preview so user can try again, or clear if you prefer:
    // clearBannerUI({ keepStatus: true });

    updateBannerControls();
  } finally {
    isUploadingBanner = false;
    updatePublishButtonState();
  }
});

postForm?.addEventListener("submit", (e) => {
  if (isUploadingBanner || isUploadingEditorImage) {
    e.preventDefault();
    alert("An image is still uploading.");
    return;
  }

  if (isEditorEmpty()) {
    e.preventDefault();
    alert("Please write some content.");
    return;
  }

  // Always submit the editor HTML
  if (contentHtmlInput) contentHtmlInput.value = quill.root.innerHTML;
});

postForm.addEventListener("submit", (e) => {
  contentHtmlInput.value = quill.root.innerHTML;
});

// Init
hydrateEditScreenIfPresent();
