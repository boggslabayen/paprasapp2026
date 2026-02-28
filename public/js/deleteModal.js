document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("deleteModal");
  const eventName = document.getElementById("eventName");
  const deleteForm = document.getElementById("deleteForm");
  const cancelBtn = document.getElementById("cancelDelete");

  // Open modal
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("delete-btn")) {
      const title = e.target.dataset.title;
      const route = e.target.dataset.route;

      eventName.textContent = title;
      deleteForm.action = route;

      modal.classList.remove("hidden");
      modal.classList.add("flex");
    }
  });

  // Close modal
  cancelBtn.addEventListener("click", function () {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });

  // Close on background click
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  });
});