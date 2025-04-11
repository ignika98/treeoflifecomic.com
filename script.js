// === script.js ===

// Wait for DOM
document.addEventListener("DOMContentLoaded", async () => {
  const navLinks = document.querySelectorAll(".navbar a");
  const pages = document.querySelectorAll(".page");

  function showPage(pageId) {
    pages.forEach(page => page.classList.add("hidden"));
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.remove("hidden");
  }

  function handleNavigation(event) {
    event.preventDefault();
    const pageId = event.target.getAttribute("data-page");
    if (pageId) {
      showPage(pageId);
      history.pushState(null, null, `#${pageId}`);
    }
  }

  navLinks.forEach(link => link.addEventListener("click", handleNavigation));

  const initialPage = window.location.hash.replace("#", "") || "home";
  showPage(initialPage);

  // === Chapter Viewer Logic ===
  const chapterViewer = document.getElementById("latest-chapter");
  let comicPages = [];
  let currentPage = 0;
  let mode = window.innerWidth < 768 ? "portrait" : "landscape";
  let chaptersData = [];

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

      container.addEventListener("click", event => {
        const rect = container.getBoundingClientRect();
        if (event.clientX < rect.width / 2) {
          if (currentPage > 1) currentPage -= 2;
        } else {
          if (currentPage + 2 < comicPages.length) currentPage += 2;
        }
        renderPages();
      });
    } else {
      for (let i = currentPage; i < comicPages.length; i++) {
        const page = document.createElement("img");
        page.src = comicPages[i];
        container.appendChild(page);
      }
    }

    chapterViewer.appendChild(container);
  }

  async function loadChapter(chapterId) {
    comicPages = [];
    currentPage = 0;

    const response = await fetch("chapters.json");
    const data = await response.json();
    const chapter = data.chapters.find(ch => ch.id === chapterId);
    const totalPages = chapter?.pages || 10;

    for (let i = 1; i <= totalPages; i++) {
      comicPages.push(`https://treeoflifex.s3.us-east-2.amazonaws.com/${chapterId}/page${i}.png`);
    }

    renderPages();
    loadDisqus(chapterId);
  }

  window.addEventListener("resize", () => {
    const newMode = window.innerWidth < 768 ? "portrait" : "landscape";
    if (newMode !== mode) {
      mode = newMode;
      renderPages();
    }
  });

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

  document.querySelectorAll(".chapter-link").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const chapterId = link.getAttribute("data-chapter-id");
      if (chapterId) {
        loadChapter(chapterId);
        showPage("home");
      }
    });
  });

  // Load most recent chapter from chapters.json
  try {
    const response = await fetch("chapters.json");
    const data = await response.json();
    chaptersData = data.chapters;
    const latestChapter = chaptersData[chaptersData.length - 1];
    if (latestChapter) {
      loadChapter(latestChapter.id);
    }
  } catch (err) {
    console.error("Error loading chapters.json:", err);
  }

  // === Search Feature ===
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const searchFilter = document.getElementById("search-filter");

  if (searchButton && searchInput && searchFilter) {
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
  }
});
