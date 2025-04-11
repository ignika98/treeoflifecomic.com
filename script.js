
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".navbar a");
  const pages = document.querySelectorAll(".page");

  function showPage(pageId) {
    pages.forEach(page => page.classList.add("hidden"));
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
      targetPage.classList.remove("hidden");
    }
  }

  function handleNavigation(event) {
    event.preventDefault(); // Stop scrolling
    const pageId = event.currentTarget.getAttribute("data-page");
    if (pageId) {
      history.pushState(null, "", `#${pageId}`);
      showPage(pageId);
    }
  }

  navLinks.forEach(link => {
    link.addEventListener("click", handleNavigation);
  });

  function initPageFromHash() {
    const pageId = window.location.hash.replace("#", "") || "home";
    showPage(pageId);
  }

  window.addEventListener("popstate", initPageFromHash);
  initPageFromHash();

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

  function loadChapter(chapterId) {
    comicPages = [];
    currentPage = 0;
    for (let i = 1; i <= 10; i++) {
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

  // Dynamically detect most recent chapter (example assumes chapters named chapter1, chapter2, ...)
  const mostRecentChapter = "chapter" + Math.max(...Array.from(document.querySelectorAll(".chapter-link"))
    .map(link => parseInt(link.getAttribute("data-chapter-id").replace("chapter", "")))
    .filter(num => !isNaN(num)));

  loadChapter(mostRecentChapter);

  // === Search Feature ===
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const searchFilter = document.getElementById("search-filter");

  if (searchButton) {
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
