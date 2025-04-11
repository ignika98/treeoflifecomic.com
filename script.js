document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".navbar a");
  const pages = document.querySelectorAll(".page");
  const chapterViewer = document.getElementById("latest-chapter");
  let comicPages = [];
  let currentPage = 0;
  let mode = window.innerWidth < 768 ? "portrait" : "landscape";

  // Function to show the correct page
  function showPage(pageId) {
    pages.forEach(page => page.classList.add("hidden"));
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.remove("hidden");
  }

  // Handle navigation bar clicks
  function handleNavigation(event) {
    event.preventDefault();  // Prevent page jump
    const pageId = event.target.getAttribute("data-page");
    if (pageId) {
      showPage(pageId);
      window.location.hash = pageId;
    }
  }

  // Add event listeners for each nav link
  navLinks.forEach(link => {
    link.addEventListener("click", handleNavigation);
  });

  // Initial page load based on hash or default to "home"
  const initialPage = window.location.hash.replace("#", "") || "home";
  showPage(initialPage);

  // === Chapter Viewer Logic ===
  function renderPages() {
    if (!chapterViewer || comicPages.length === 0) return;
    chapterViewer.innerHTML = "";
    const container = document.createElement("div");
    container.className = `comic-viewer ${mode}`;

    if (mode === "landscape") {
      const leftPage = document.createElement("img");
      leftPage.src = comicPages[currentPage];
      container.appendChild(leftPage);

      const rightPage = document.createElement("img");
      if (comicPages[currentPage + 1]) {
        rightPage.src = comicPages[currentPage + 1];
      }
      container.appendChild(rightPage);
    } else {
      for (let i = currentPage; i < comicPages.length; i++) {
        const page = document.createElement("img");
        page.src = comicPages[i];
        container.appendChild(page);
      }
    }

    chapterViewer.appendChild(container);

    if (mode === "landscape") {
      container.addEventListener("click", event => {
        const rect = container.getBoundingClientRect();
        if (event.clientX < rect.width / 2) {
          if (currentPage > 1) currentPage -= 2;
        } else {
          if (currentPage + 2 < comicPages.length) currentPage += 2;
        }
        renderPages();
      });
    }
  }

  // Load chapter based on chapterId
  function loadChapter(chapterId) {
    comicPages = [];
    currentPage = 1;
    // Example: chapter1 -> [page1.jpg, page2.jpg, etc.]
    for (let i = 1; i <= 100; i++) {  // This assumes chapters can have up to 100 pages.
      comicPages.push(`https://treeoflifex.s3.us-east-2.amazonaws.com/${chapterId}/page${i}.png`);
    }
    renderPages();
    loadDisqus(chapterId);
  }

  // Adjust rendering mode on resize
  window.addEventListener("resize", () => {
    const newMode = window.innerWidth < 768 ? "portrait" : "landscape";
    if (newMode !== mode) {
      mode = newMode;
      renderPages();
    }
  });

  // Load Disqus comments
  function loadDisqus(identifier) {
    const disqusThread = document.getElementById("disqus_thread");
    if (!disqusThread) return;

    if (window.DISQUS) {
      DISQUS.reset({
        reload: true,
        config: function () {
          this.page.identifier = identifier;
          this.page.url = window.location.href;
        }
      });
    } else {
      const disqusScript = document.createElement("script");
      disqusScript.src = "https://YOUR_DISQUS_SHORTNAME.disqus.com/embed.js";
      disqusScript.setAttribute("data-timestamp", +new Date());
      document.body.appendChild(disqusScript);
    }
  }

  // Trigger chapter links to load specific chapters
  document.querySelectorAll(".chapter-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const chapterId = link.getAttribute("data-chapter-id");
      if (chapterId) {
        loadChapter(chapterId);
        showPage("chapter-page");
      }
    });
  });

  // Example: Load the default chapter on the homepage
  loadChapter("chapter1");

  // === Search Feature ===
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const searchFilter = document.getElementById("search-filter");

  searchButton.addEventListener("click", () => {
    const query = searchInput.value.toLowerCase();
    const filter = searchFilter.value;

    if (!query) return;

    if (filter === "all" || filter === "chapters") {
      document.querySelectorAll(".chapters-grid .chapter-item").forEach(item => {
        const title = item.querySelector(".chapter-title").textContent.toLowerCase();
        item.style.display = title.includes(query) ? "block" : "none";
      });
    }

    if (filter === "all" || filter === "blog") {
      document.querySelectorAll("#blog-posts .blog-post").forEach(post => {
        const content = post.textContent.toLowerCase();
        post.style.display = content.includes(query) ? "block" : "none";
      });
    }
  });
});
