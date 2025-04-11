document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".navbar a");
  const pages = document.querySelectorAll(".page");

  function showPage(pageId) {
    pages.forEach(page => {
      page.classList.add("hidden");
    });
    const activePage = document.getElementById(pageId);
    if (activePage) {
      activePage.classList.remove("hidden");
    }
  }

  function handleNavigation(event) {
    const pageId = event.target.getAttribute("data-page");
    if (pageId) {
      showPage(pageId);
      window.location.hash = pageId;
    }
  }

  navLinks.forEach(link => {
    link.addEventListener("click", handleNavigation);
  });

  // Handle initial load based on hash or default to home
  const initialPage = window.location.hash.replace("#", "") || "home";
  showPage(initialPage);
});
