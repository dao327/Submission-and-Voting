const STORAGE_KEY = "worksVotingDemo.en.v1";
const VOTED_KEY = "worksVotingDemo.en.votedIds.v1";

const defaultWorks = [
  {
    id: crypto.randomUUID(),
    title: "Urban Light Photography",
    author: "Mia",
    category: "Photography",
    description: "A night street photography work that shows the rhythm of the city through light and shadow.",
    image: "",
    votes: 18,
    createdAt: Date.now() - 3600 * 1000 * 8
  },
  {
    id: crypto.randomUUID(),
    title: "Milk Tea Brand Poster",
    author: "Ken",
    category: "Graphic Design",
    description: "A visual poster designed for young consumers, with a fresh and social-sharing style.",
    image: "",
    votes: 26,
    createdAt: Date.now() - 3600 * 1000 * 5
  },
  {
    id: crypto.randomUUID(),
    title: "Panda Character Illustration",
    author: "Linya",
    category: "Illustration",
    description: "A brand character design that gives the panda expression, personality, and interaction value.",
    image: "",
    votes: 31,
    createdAt: Date.now() - 3600 * 1000 * 2
  }
];

let works = loadWorks();
let votedIds = loadVotedIds();

const gallery = document.getElementById("gallery");
const form = document.getElementById("workForm");
const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");
const sortBy = document.getElementById("sortBy");
const rankingList = document.getElementById("rankingList");
const template = document.getElementById("workCardTemplate");

function loadWorks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return defaultWorks;
    }
  }
  return defaultWorks;
}

function loadVotedIds() {
  const saved = localStorage.getItem(VOTED_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
}

function saveWorks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(works));
}

function saveVotedIds() {
  localStorage.setItem(VOTED_KEY, JSON.stringify(votedIds));
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(timestamp);
}

function getPlaceholderSvg(category) {
  const iconMap = {
    "Graphic Design": "Poster",
    "Photography": "Photo",
    "Illustration": "Art",
    "Video Concept": "Video",
    "Other": "Work"
  };

  const label = iconMap[category] || "Work";
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#dceadf"/>
          <stop offset="100%" stop-color="#fffaf2"/>
        </linearGradient>
      </defs>
      <rect width="900" height="600" fill="url(#g)"/>
      <circle cx="175" cy="140" r="86" fill="#ffffff" opacity=".62"/>
      <circle cx="720" cy="430" r="130" fill="#264f3a" opacity=".10"/>
      <rect x="220" y="170" width="460" height="260" rx="34" fill="#ffffff" opacity=".80"/>
      <text x="450" y="292" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#18233a">${label}</text>
      <text x="450" y="352" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="24" fill="#6d7280">Creative Submission</text>
    </svg>
  `)}`;
}

function getVisibleWorks() {
  const keyword = searchInput.value.trim().toLowerCase();
  const category = filterCategory.value;
  const sortMode = sortBy.value;

  let visible = works.filter(work => {
    const matchCategory = category === "All" || work.category === category;
    const text = `${work.title} ${work.author} ${work.description}`.toLowerCase();
    const matchKeyword = !keyword || text.includes(keyword);
    return matchCategory && matchKeyword;
  });

  if (sortMode === "votes") {
    visible.sort((a, b) => b.votes - a.votes);
  } else {
    visible.sort((a, b) => b.createdAt - a.createdAt);
  }

  return visible;
}

function renderGallery() {
  gallery.innerHTML = "";
  const visibleWorks = getVisibleWorks();

  if (visibleWorks.length === 0) {
    gallery.innerHTML = `
      <div class="empty-state">
        <h3>No matching works found</h3>
        <p>Try changing the search filters or submit a new work.</p>
      </div>
    `;
    return;
  }

  visibleWorks.forEach(work => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".work-card");
    const img = node.querySelector("img");
    const badge = node.querySelector(".category-badge");
    const date = node.querySelector(".date-text");
    const title = node.querySelector("h3");
    const author = node.querySelector(".author");
    const desc = node.querySelector(".desc");
    const voteCount = node.querySelector(".vote-count");
    const voteBtn = node.querySelector(".vote-btn");

    img.src = work.image || getPlaceholderSvg(work.category);
    img.alt = work.title;
    badge.textContent = work.category;
    date.textContent = formatDate(work.createdAt);
    title.textContent = work.title;
    author.textContent = `Creator: ${work.author}`;
    desc.textContent = work.description;
    voteCount.textContent = `${work.votes} votes`;

    if (votedIds.includes(work.id)) {
      voteBtn.textContent = "Voted";
      voteBtn.classList.add("voted");
      voteBtn.disabled = true;
    }

    voteBtn.addEventListener("click", () => voteForWork(work.id));

    gallery.appendChild(card);
  });
}

function renderRanking() {
  rankingList.innerHTML = "";

  const sorted = [...works].sort((a, b) => b.votes - a.votes).slice(0, 5);

  sorted.forEach((work, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="rank-num">${index + 1}</span>
      <span>
        <span class="rank-title">${escapeHtml(work.title)}</span>
        <span class="rank-author">Creator: ${escapeHtml(work.author)} · ${escapeHtml(work.category)}</span>
      </span>
      <span class="rank-votes">${work.votes} votes</span>
    `;
    rankingList.appendChild(li);
  });
}

function renderStats() {
  const totalWorks = works.length;
  const totalVotes = works.reduce((sum, work) => sum + work.votes, 0);
  const top = [...works].sort((a, b) => b.votes - a.votes)[0];

  document.getElementById("totalWorks").textContent = totalWorks;
  document.getElementById("totalVotes").textContent = totalVotes;
  document.getElementById("topWork").textContent = top ? top.title : "None";
}

function renderAll() {
  renderStats();
  renderGallery();
  renderRanking();
}

function voteForWork(id) {
  if (votedIds.includes(id)) return;

  works = works.map(work => {
    if (work.id === id) {
      return { ...work, votes: work.votes + 1 };
    }
    return work;
  });

  votedIds.push(id);
  saveWorks();
  saveVotedIds();
  renderAll();
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      reject(new Error("Please upload an image file."));
      return;
    }

    if (file.size > 1024 * 1024 * 2.5) {
      reject(new Error("The image must be smaller than 2.5MB."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Image reading failed."));
    reader.readAsDataURL(file);
  });
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value.trim();
  const imageFile = document.getElementById("image").files[0];

  if (!title || !author || !description) {
    alert("Please complete all required fields.");
    return;
  }

  try {
    const image = await fileToDataUrl(imageFile);
    const newWork = {
      id: crypto.randomUUID(),
      title,
      author,
      category,
      description,
      image,
      votes: 0,
      createdAt: Date.now()
    };

    works.unshift(newWork);
    saveWorks();
    form.reset();
    renderAll();
    document.querySelector(".toolbar").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    alert(error.message);
  }
});

document.getElementById("resetDemo").addEventListener("click", () => {
  const confirmed = confirm("Are you sure you want to reset the demo data? This will clear saved works and votes in this browser.");
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(VOTED_KEY);
  works = defaultWorks;
  votedIds = [];
  renderAll();
});

[searchInput, filterCategory, sortBy].forEach(element => {
  element.addEventListener("input", renderGallery);
  element.addEventListener("change", renderGallery);
});

renderAll();
