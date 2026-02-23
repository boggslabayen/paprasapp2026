// // public/js/addService.js

// const quill = new Quill("#editor", {
//   theme: "snow",
//   placeholder: "Write your post here...",
//   modules: {
//     toolbar: [
//       [{ header: [1, 2, 3, false] }],
//       ["bold", "italic", "underline", "strike"],
//       [{ list: "ordered" }, { list: "bullet" }],
//       ["blockquote", "code-block"],
//       ["link", "image"],
//       ["clean"]
//     ]
//   }
// });

// const postForm = document.getElementById("postForm");
// const bannerFile = document.getElementById("bannerFile");
// const bannerUrlInput = document.getElementById("bannerUrl");
// const bannerStatus = document.getElementById("bannerStatus");
// const bannerPreview = document.getElementById("bannerPreview");
// const publishBtn = document.getElementById("publishBtn");
// const contentHtmlInput = document.getElementById("contentHtml");

// let isUploadingBanner = false;

// function setStatus(msg, type) {
//   bannerStatus.textContent = msg || "";
//   bannerStatus.className = "status";
//   if (type === "error") bannerStatus.classList.add("error");
//   if (type === "ok") bannerStatus.classList.add("ok");
// }

// function setPublishingEnabled(enabled) {
//   publishBtn.disabled = !enabled;
//   publishBtn.classList.toggle("disabled", !enabled);
// }

// function isEditorEmpty() {
//   return quill.getText().trim().length === 0;
// }

// bannerFile.addEventListener("change", async () => {
//   const file = bannerFile.files && bannerFile.files[0];
//   bannerUrlInput.value = "";
//   bannerPreview.style.display = "none";

//   if (!file) return;

//   if (!file.type.startsWith("image/")) {
//     setStatus("Please choose an image file.", "error");
//     return;
//   }

//   // Local preview
//   bannerPreview.src = URL.createObjectURL(file);
//   bannerPreview.style.display = "block";

//   const formData = new FormData();
//   formData.append("banner", file); // MUST match upload.single("banner")

//   try {
//     isUploadingBanner = true;
//     setPublishingEnabled(false);
//     setStatus("Uploading banner...", "");

//     const res = await fetch("/upload-banner", {
//       method: "POST",
//       body: formData
//     });

//     // Read as text first so we can show useful errors even if JSON parsing fails
//     const raw = await res.text();
//     let data = {};
//     try {
//       data = JSON.parse(raw);
//     } catch {
//       // ignore if not JSON
//     }

//     if (!res.ok) {
//       const msg = (data && data.error) || raw || `Upload failed (HTTP ${res.status})`;
//       throw new Error(msg);
//     }

//     if (!data.url) {
//       throw new Error("Server did not return a url");
//     }

//     bannerUrlInput.value = data.url;
//     setStatus("Banner uploaded.", "ok");
//   } catch (err) {
//     bannerUrlInput.value = "";
//     setStatus(`Banner upload error: ${err.message}`, "error");
//     console.error("Banner upload error:", err);
//   } finally {
//     isUploadingBanner = false;
//     setPublishingEnabled(true);
//   }
// });

// postForm.addEventListener("submit", (e) => {
//   if (isUploadingBanner) {
//     e.preventDefault();
//     alert("Banner is still uploading.");
//     return;
//   }

//   if (isEditorEmpty()) {
//     e.preventDefault();
//     alert("Please write some content.");
//     return;
//   }

//   // Optional: require banner URL before allowing submit
//   // if (!bannerUrlInput.value) {
//   //   e.preventDefault();
//   //   alert("Please upload a banner image.");
//   //   return;
//   // }

//   contentHtmlInput.value = quill.root.innerHTML;
// });

// public/js/addService.js

// const quill = new Quill("#editor", {
//   theme: "snow",
//   placeholder: "Write your post here...",
//   modules: {
//     toolbar: [
//       [{ header: [1, 2, 3, false] }],
//       ["bold", "italic", "underline", "strike"],
//       [{ list: "ordered" }, { list: "bullet" }],
//       ["blockquote", "code-block"],
//       ["link", "image"],
//       ["clean"]
//     ]
//   }
// });

// const postForm = document.getElementById("postForm");
// const bannerFile = document.getElementById("bannerFile");
// const bannerUrlInput = document.getElementById("bannerUrl");
// const bannerStatus = document.getElementById("bannerStatus");
// const bannerPreview = document.getElementById("bannerPreview");
// const publishBtn = document.getElementById("publishBtn");
// const contentHtmlInput = document.getElementById("contentHtml");

// // NEW: remove button (make sure you added it in HTML)
// const removeBannerBtn = document.getElementById("removeBannerBtn");

// let isUploadingBanner = false;

// // NEW: track object URL so we can revoke it (avoid memory leaks)
// let currentPreviewObjectUrl = null;

// function setStatus(msg, type) {
//   bannerStatus.textContent = msg || "";
//   bannerStatus.className = "status";
//   if (type === "error") bannerStatus.classList.add("error");
//   if (type === "ok") bannerStatus.classList.add("ok");
// }

// function setPublishingEnabled(enabled) {
//   publishBtn.disabled = !enabled;
//   publishBtn.classList.toggle("disabled", !enabled);
// }

// function isEditorEmpty() {
//   return quill.getText().trim().length === 0;
// }

// // NEW: show/hide remove button based on whether we have a banner selected or uploaded
// function showRemoveButtonIfNeeded() {
//   if (!removeBannerBtn) return;
//   const hasBanner =
//     !!bannerUrlInput.value ||
//     (bannerFile.files && bannerFile.files.length > 0) ||
//     (bannerPreview && bannerPreview.style.display !== "none" && bannerPreview.getAttribute("src"));
//   removeBannerBtn.style.display = hasBanner ? "inline-flex" : "none";
// }

// // NEW: clear banner UI + form values
// function clearBannerUI({ keepStatus = false } = {}) {
//   // Clear hidden URL (what you submit)
//   bannerUrlInput.value = "";

//   // Clear file input (allows re-selecting the same file)
//   bannerFile.value = "";

//   // Clear preview and revoke object URL
//   if (currentPreviewObjectUrl) {
//     URL.revokeObjectURL(currentPreviewObjectUrl);
//     currentPreviewObjectUrl = null;
//   }
//   bannerPreview.removeAttribute("src");
//   bannerPreview.style.display = "none";

//   if (!keepStatus) setStatus("", "");

//   showRemoveButtonIfNeeded();
// }

// // NEW: optional server delete (won't break if you haven't implemented it)
// async function deleteBannerOnServer(urlToDelete) {
//   if (!urlToDelete) return;

//   try {
//     await fetch("/upload-banner", {
//       method: "DELETE",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ url: urlToDelete })
//     });
//   } catch (e) {
//     // Non-blocking: UI already cleared. Log only.
//     console.warn("Could not delete banner from server:", e);
//   }
// }

// // NEW: remove button click
// removeBannerBtn?.addEventListener("click", async () => {
//   // Capture current uploaded URL before clearing
//   const urlToDelete = bannerUrlInput.value;

//   // Clear client-side state immediately
//   clearBannerUI();

//   // Optional: delete from server (only works if you add DELETE /upload-banner)
//   await deleteBannerOnServer(urlToDelete);
// });

// bannerFile.addEventListener("change", async () => {
//   const file = bannerFile.files && bannerFile.files[0];

//   // Reset current submitted URL on every new selection
//   bannerUrlInput.value = "";

//   // Hide preview until we validate
//   bannerPreview.style.display = "none";

//   // If user cancelled the picker, just update button visibility and exit
//   if (!file) {
//     showRemoveButtonIfNeeded();
//     return;
//   }

//   if (!file.type.startsWith("image/")) {
//     setStatus("Please choose an image file.", "error");
//     clearBannerUI({ keepStatus: true }); // clear preview/file/url but keep error text
//     return;
//   }

//   // Local preview (revoke old object URL first)
//   if (currentPreviewObjectUrl) URL.revokeObjectURL(currentPreviewObjectUrl);
//   currentPreviewObjectUrl = URL.createObjectURL(file);
//   bannerPreview.src = currentPreviewObjectUrl;
//   bannerPreview.style.display = "block";
//   showRemoveButtonIfNeeded();

//   const formData = new FormData();
//   formData.append("banner", file); // MUST match upload.single("banner")

//   try {
//     isUploadingBanner = true;
//     setPublishingEnabled(false);
//     setStatus("Uploading banner...", "");

//     const res = await fetch("/upload-banner", {
//       method: "POST",
//       body: formData
//     });

//     // Read as text first so we can show useful errors even if JSON parsing fails
//     const raw = await res.text();
//     let data = {};
//     try {
//       data = JSON.parse(raw);
//     } catch {
//       // ignore if not JSON
//     }

//     if (!res.ok) {
//       const msg = (data && data.error) || raw || `Upload failed (HTTP ${res.status})`;
//       throw new Error(msg);
//     }

//     if (!data.url) {
//       throw new Error("Server did not return a url");
//     }

//     bannerUrlInput.value = data.url;
//     setStatus("Banner uploaded.", "ok");
//     showRemoveButtonIfNeeded();
//   } catch (err) {
//     bannerUrlInput.value = "";
//     setStatus(`Banner upload error: ${err.message}`, "error");
//     console.error("Banner upload error:", err);

//     // Optional behavior:
//     // - keep preview so user can try again (current default)
//     // - OR clear everything:
//     // clearBannerUI({ keepStatus: true });

//     showRemoveButtonIfNeeded();
//   } finally {
//     isUploadingBanner = false;
//     setPublishingEnabled(true);
//   }
// });

// postForm.addEventListener("submit", (e) => {
//   if (isUploadingBanner) {
//     e.preventDefault();
//     alert("Banner is still uploading.");
//     return;
//   }

//   if (isEditorEmpty()) {
//     e.preventDefault();
//     alert("Please write some content.");
//     return;
//   }

//   // Optional: require banner URL before allowing submit
//   // if (!bannerUrlInput.value) {
//   //   e.preventDefault();
//   //   alert("Please upload a banner image.");
//   //   return;
//   // }

//   contentHtmlInput.value = quill.root.innerHTML;
// });

// // NEW: initial state
// showRemoveButtonIfNeeded();

// public/js/articleEditor.js
// Works for BOTH add + edit screens.
// Requirements in HTML:
// - #postForm, #editor, #contentHtml, #publishBtn
// - #bannerFile, #bannerUrl, #bannerPreview, #bannerStatus, #removeBannerBtn
// Optional for edit screens:
// - #contentHtmlInitial (hidden input containing existing HTML)

const quill = new Quill("#editor", {
  theme: "snow",
  placeholder: "Write your post here...",
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link", "image"],
      ["clean"]
    ]
  }
});

const postForm = document.getElementById("postForm");
const bannerFile = document.getElementById("bannerFile");
const bannerUrlInput = document.getElementById("bannerUrl");
const bannerStatus = document.getElementById("bannerStatus");
const bannerPreview = document.getElementById("bannerPreview");
const publishBtn = document.getElementById("publishBtn");
const contentHtmlInput = document.getElementById("contentHtml");
const removeBannerBtn = document.getElementById("removeBannerBtn");

// Optional (edit screen preload)
const contentHtmlInitial = document.getElementById("contentHtmlInitial");

let isUploadingBanner = false;
let currentPreviewObjectUrl = null;

function setStatus(msg, type) {
  if (!bannerStatus) return;
  bannerStatus.textContent = msg || "";
  bannerStatus.className = "status";
  if (type === "error") bannerStatus.classList.add("error");
  if (type === "ok") bannerStatus.classList.add("ok");
}

function setPublishingEnabled(enabled) {
  if (!publishBtn) return;
  publishBtn.disabled = !enabled;
  publishBtn.classList.toggle("disabled", !enabled);
}

function isEditorEmpty() {
  return quill.getText().trim().length === 0;
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
    setPublishingEnabled(false);
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
    setPublishingEnabled(true);
  }
});

postForm?.addEventListener("submit", (e) => {
  if (isUploadingBanner) {
    e.preventDefault();
    alert("Banner is still uploading.");
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