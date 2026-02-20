// header-nav.js

function main() {
  // ===== Desktop dropdown (hover + click safe) =====
  const dropdown = document.getElementById("patient-education");
  const dropBtn = dropdown?.querySelector(".nav-dropbtn");
  const menu = dropdown?.querySelector(".drop-down-menu");

  let closeTimer = null;

  function openMenu() {
    if (!menu || !dropBtn) return;
    clearTimeout(closeTimer);
    menu.classList.add("open");
    dropBtn.setAttribute("aria-expanded", "true");
  }

  function closeMenuNow() {
    if (!menu || !dropBtn) return;
    clearTimeout(closeTimer);
    menu.classList.remove("open");
    dropBtn.setAttribute("aria-expanded", "false");
  }

  function scheduleCloseMenu() {
    if (!menu || !dropBtn) return;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      menu.classList.remove("open");
      dropBtn.setAttribute("aria-expanded", "false");
    }, 150);
  }

  if (dropdown && dropBtn && menu) {
    dropdown.addEventListener("pointerenter", openMenu);
    dropdown.addEventListener("pointerleave", scheduleCloseMenu);

    dropBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      menu.classList.contains("open") ? closeMenuNow() : openMenu();
    });

    menu.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", closeMenuNow);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenuNow();
    });
  }

  // ===== Mobile drawer =====
  const menuToggle = document.querySelector(".menu-toggle");
  const drawer = document.getElementById("mobileDrawer");
  const overlay = document.querySelector(".drawer-overlay");
  const drawerClose = document.querySelector(".drawer-close");

  function openDrawer() {
    closeMenuNow(); // close desktop dropdown if open
    if (!drawer || !overlay || !menuToggle) return;
    drawer.classList.add("open");
    overlay.hidden = false;
    document.body.classList.add("no-scroll");
    menuToggle.setAttribute("aria-expanded", "true");
    drawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer() {
    if (!drawer || !overlay || !menuToggle) return;
    drawer.classList.remove("open");
    overlay.hidden = true;
    document.body.classList.remove("no-scroll");
    menuToggle.setAttribute("aria-expanded", "false");
    drawer.setAttribute("aria-hidden", "true");
  }

  menuToggle?.addEventListener("click", (e) => {
    e.stopPropagation();
    openDrawer();
  });

  drawerClose?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  // ===== Drawer accordion (Patient Education) =====
  const drawerDropdownBtn = document.querySelector(".drawer-dropdown-toggle");
  const drawerSubmenu = document.getElementById("drawerPatientEdu");

  if (drawerDropdownBtn && drawerSubmenu) {
    // Ensure starts collapsed
    drawerDropdownBtn.setAttribute("aria-expanded", "false");
    drawerSubmenu.hidden = true;

    drawerDropdownBtn.addEventListener("click", (e) => {
      // IMPORTANT: stop link navigation + stop bubbling to overlay/document
      e.preventDefault();
      e.stopPropagation();

      const isOpen = drawerDropdownBtn.getAttribute("aria-expanded") === "true";
      drawerDropdownBtn.setAttribute("aria-expanded", String(!isOpen));

      // Toggle submenu visibility
      drawerSubmenu.hidden = isOpen;

      // Optional: if you also rely on a class for styling/animation
      drawerSubmenu.classList.toggle("open", !isOpen);
    });
  } else {
    console.warn(
      "Drawer dropdown not found. Expected .drawer-dropdown-toggle and #drawerPatientEdu"
    );
  }


}

document.addEventListener("DOMContentLoaded", main);
