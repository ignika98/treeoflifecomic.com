document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".navbar a");
  const pages = document.querySelectorAll(".page");

  function showPage(pageId) {
    pages.forEach(page => page.classList.add("hidden"));
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.remove("hidden");
  }

  function handleNavigation(event) {
    const pageId = event.target.getAttribute("data-page");
    if (pageId) {
      showPage(pageId);
      window.location.hash = pageId;
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

  // Fetch chapter data from chapters.json
  async function fetchChapters() {
    try {
      const response = await fetch("chapters.json");
      const chapters = await response.json();
      loadChaptersToPage(chapters);
    } catch (error) {
      console.error("Error fetching chapters data:", error);
    }
  }

  // Load chapter details (including cover and page count) into the chapters grid
  function loadChaptersToPage(chapters) {
    const chaptersGrid = document.querySelector(".chapters-grid");
    chapters.forEach(chapter => {
      const chapterLink = document.createElement("a");
      chapterLink.className = "chapter-link";
      chapterLink.setAttribute("data-chapter-id", chapter.id);
      chapterLink.setAttribute("data-page-count", chapter.pageCount);

      const chapterCover = document.createElement("img");
      chapterCover.src = chapter.cover;
      chapterCover.alt = `${chapter.title} Cover`;
      chapterLink.appendChild(chapterCover);

      const chapterTitle = document.createElement("p");
      chapterTitle.textContent = chapter.title;
      chapterLink.appendChild(chapterTitle);

      chapterLink.addEventListener("click", (e) => {
        e.preventDefault();
        loadChapter(chapter.id, chapter.pageCount);
        showPage("chapter-page");
      });

      chaptersGrid.appendChild(chapterLink);
    });
  }

  function loadChapter(chapterId, pageCount) {
    comicPages = [];
    currentPage = 0;
    for (let i = 1; i <= pageCount; i++) {
      comicPages.push(`https://your-s3-bucket.s3.amazonaws.com/${chapterId}/page${i}.jpg`);
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

  // Load homepage default chapter
  loadChapter("chapter1", 10);

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

  // Fetch and display chapters when page loads
  fetchChapters();
});
