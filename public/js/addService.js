// public/js/addService.js

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

let isUploadingBanner = false;

function setStatus(msg, type) {
  bannerStatus.textContent = msg || "";
  bannerStatus.className = "status";
  if (type === "error") bannerStatus.classList.add("error");
  if (type === "ok") bannerStatus.classList.add("ok");
}

function setPublishingEnabled(enabled) {
  publishBtn.disabled = !enabled;
  publishBtn.classList.toggle("disabled", !enabled);
}

function isEditorEmpty() {
  return quill.getText().trim().length === 0;
}

bannerFile.addEventListener("change", async () => {
  const file = bannerFile.files && bannerFile.files[0];
  bannerUrlInput.value = "";
  bannerPreview.style.display = "none";

  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setStatus("Please choose an image file.", "error");
    return;
  }

  // Local preview
  bannerPreview.src = URL.createObjectURL(file);
  bannerPreview.style.display = "block";

  const formData = new FormData();
  formData.append("banner", file); // MUST match upload.single("banner")

  try {
    isUploadingBanner = true;
    setPublishingEnabled(false);
    setStatus("Uploading banner...", "");

    const res = await fetch("/upload-banner", {
      method: "POST",
      body: formData
    });

    // Read as text first so we can show useful errors even if JSON parsing fails
    const raw = await res.text();
    let data = {};
    try {
      data = JSON.parse(raw);
    } catch {
      // ignore if not JSON
    }

    if (!res.ok) {
      const msg = (data && data.error) || raw || `Upload failed (HTTP ${res.status})`;
      throw new Error(msg);
    }

    if (!data.url) {
      throw new Error("Server did not return a url");
    }

    bannerUrlInput.value = data.url;
    setStatus("Banner uploaded.", "ok");
  } catch (err) {
    bannerUrlInput.value = "";
    setStatus(`Banner upload error: ${err.message}`, "error");
    console.error("Banner upload error:", err);
  } finally {
    isUploadingBanner = false;
    setPublishingEnabled(true);
  }
});

postForm.addEventListener("submit", (e) => {
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

  // Optional: require banner URL before allowing submit
  // if (!bannerUrlInput.value) {
  //   e.preventDefault();
  //   alert("Please upload a banner image.");
  //   return;
  // }

  contentHtmlInput.value = quill.root.innerHTML;
});