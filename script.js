// script.js

let comicPages = [];
let currentPage = 0;
let mode = window.innerWidth < 768 ? "portrait" : "landscape";
let allChapters = [];

function fetchChapters() {
  return fetch("chapters.json")
    .then((response) => response.json())
    .then((data) => data.chapters)
    .catch((error) => {
      console.error("Failed to load chapters:", error);
      return [];
    });
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.add("hidden");
  });
  const activePage = document.getElementById(pageId);
  if (activePage) activePage.classList.remove("hidden");
  window.scrollTo(0, 0);
}

function loadChapter(chapterId, pageCount) {
  comicPages = [];
  currentPage = 0;
  for (let i = 1; i <= pageCount; i++) {
    comicPages.push(`https://treeoflifex.s3.us-east-2.amazonaws.com/${chapterId}/page${i}.png`);
  }
  renderPages();
  loadDisqus(chapterId);
}

function renderPages() {
  const viewer = document.getElementById("latest-chapter");
  if (!viewer || comicPages.length === 0) return;
  viewer.innerHTML = "";

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

    container.addEventListener("click", (event) => {
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
  viewer.appendChild(container);
}

function loadDisqus(identifier) {
  const disqusThread = document.getElementById("disqus_thread");
  if (!disqusThread) return;

  if (window.DISQUS) {
    DISQUS.reset({
      reload: true,
      config: function () {
        this.page.identifier = identifier;
        this.page.url = window.location.href;
      },
    });
  } else {
    const d = document, s = d.createElement('script');
    s.src = 'https://YOUR_DISQUS_SHORTNAME.disqus.com/embed.js';
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  allChapters = await fetchChapters();

  const navLinks = document.querySelectorAll(".navbar a");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const pageId = link.getAttribute("data-page");
      if (pageId) {
        showPage(pageId);
        window.location.hash = pageId;
      }
    });
  });

  const initialPage = window.location.hash.replace("#", "") || "home";
  showPage(initialPage);

  const latestChapter = allChapters[allChapters.length - 1];
  if (latestChapter) {
    loadChapter(latestChapter.id, latestChapter.pages);
  }

  const chapterGrid = document.querySelector(".chapters-grid");
  if (chapterGrid) {
    allChapters.forEach((chapter) => {
      const button = document.createElement("button");
      button.className = "chapter-link chapter-item";
      button.setAttribute("data-chapter-id", chapter.id);
      button.setAttribute("data-pages", chapter.pages);
      button.innerHTML = `
        <img src="${chapter.cover}" alt="${chapter.title}" />
        <div class="chapter-title">${chapter.title}</div>
      `;
      chapterGrid.appendChild(button);
    });
  }

  document.querySelectorAll(".chapter-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const chapterId = link.getAttribute("data-chapter-id");
      const pageCount = parseInt(link.getAttribute("data-pages"), 10);
      if (chapterId && pageCount) {
        loadChapter(chapterId, pageCount);
        showPage("home");
      }
    });
  });

  // === Search ===
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const searchFilter = document.getElementById("search-filter");

  if (searchButton) {
    searchButton.addEventListener("click", () => {
      const query = searchInput.value.toLowerCase();
      const filter = searchFilter.value;

      if (!query) return;

      if (filter === "all" || filter === "chapters") {
        document.querySelectorAll(".chapters-grid .chapter-item").forEach((item) => {
          const title = item.querySelector(".chapter-title").textContent.toLowerCase();
          item.style.display = title.includes(query) ? "block" : "none";
        });
      }

      if (filter === "all" || filter === "blog") {
        document.querySelectorAll("#blog-posts .blog-post").forEach((post) => {
          const content = post.textContent.toLowerCase();
          post.style.display = content.includes(query) ? "block" : "none";
        });
      }
    });
  }
});
