// fetchProducts();

const API_URL = "https://dummyjson.com/products";
const FAVORITES_KEY = "northstar-market-favorites";

// Application State

const state = {
  products: [],
  filteredProducts: [],
  favorites: loadFavorites(),
  loadingState: "idle",
  searchTerm: "",
  favoritesOnly: false,
  sortOrder: "default",
};

// DOM Elements Cache
const elements = {
  grid: document.querySelector("#productGrid"),
  loading: document.querySelector("#loadingState"),
  error: document.querySelector("#errorState"),
  errorMessage: document.querySelector("#errorMessage"),
  empty: document.querySelector("#emptyState"),
  count: document.querySelector("#resultCount"),
  search: document.querySelector("#searchInput"),
  sort: document.querySelector("#sortSelect"),
  favoritesFilter: document.querySelector("#favoritesFilter"),
  favoritesSummary: document.querySelector("#favoritesSummary"),
  favoritesCount: document.querySelector("#favoritesCount"),
  retry: document.querySelector("#retryButton"),
};

// LocalStorage & Helper Utilities

function loadFavorites() {
  try {
    const storedFavorites = JSON.parse(localStorage.getItem(FAVORITES_KEY));
    return Array.isArray(storedFavorites)
      ? storedFavorites.map(Number).filter(Number.isFinite)
      : [];
  } catch (error) {
    return [];
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(state.favorites));
  } catch (error) {
    console.error("Failed to save favorites to localStorage:", error);
  }
}

function debounce(callback, delay) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), delay);
  };
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character],
  );
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

// API & Data Handling

async function fetchProducts() {
  setLoadingState("loading");
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}.`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload.products)) {
      throw new Error("The response did not contain a product collection.");
    }

    state.products = payload.products;
    state.loadingState = "success";
    applyFilters();
  } catch (error) {
    state.loadingState = "error";
    elements.errorMessage.textContent =
      error instanceof Error
        ? error.message
        : "The collection could not be loaded.";
    setLoadingState("error");
  }
}

// State Updates & Filter Operations

function setLoadingState(status) {
  elements.loading.hidden = status !== "loading";
  elements.error.hidden = status !== "error";
  elements.grid.hidden = status === "loading" || status === "error";

  if (status === "loading") elements.empty.hidden = true;
  if (status === "error") elements.count.textContent = "Collection unavailable";
}

function applyFilters() {
  const normalizedSearch = state.searchTerm.trim().toLowerCase();

  const matchingProducts = state.products.filter((product) => {
    const matchesSearch = product.title
      .toLowerCase()
      .includes(normalizedSearch);
    const matchesFavorites =
      !state.favoritesOnly || state.favorites.includes(product.id);
    return matchesSearch && matchesFavorites;
  });

  if (state.sortOrder === "price-asc") {
    matchingProducts.sort((a, b) => a.price - b.price);
  }
  if (state.sortOrder === "price-desc") {
    matchingProducts.sort((a, b) => b.price - a.price);
  }

  state.filteredProducts = matchingProducts;
  render();
}

function toggleFavorite(productId) {
  const favoriteIndex = state.favorites.indexOf(productId);
  if (favoriteIndex >= 0) {
    state.favorites.splice(favoriteIndex, 1);
  } else {
    state.favorites.push(productId);
  }

  saveFavorites();
  applyFilters();
}

// Component Rendering

function createProductCard(product, index) {
  const isFavorite = state.favorites.includes(product.id);
  const category = product.category.replaceAll("-", " ");

  return `
    <article class="product-card" style="animation-delay: ${Math.min(index * 45, 360)}ms">
      <div class="product-image-wrap">
        <img class="product-image" src="${escapeAttribute(product.thumbnail)}" alt="${escapeAttribute(product.title)}" loading="lazy" />
        <button class="favorite-toggle" type="button" data-favorite-id="${product.id}" aria-label="${isFavorite ? "Remove" : "Add"} ${escapeAttribute(product.title)} ${isFavorite ? "from" : "to"} favorites" aria-pressed="${isFavorite}">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="${isFavorite ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8">
            <path d="M20.8 8.9c0 5.2-8.8 10.1-8.8 10.1S3.2 14.1 3.2 8.9A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.4Z" />
          </svg>
        </button>
      </div>
      <div class="product-info">
        <div>
          <p class="product-category">${escapeHtml(category)}</p>
          <h3 class="product-title">${escapeHtml(product.title)}</h3>
          <p class="product-rating"><span>★</span> ${Number(product.rating).toFixed(1)} / 5</p>
        </div>
        <p class="product-price">$${Number(product.price).toFixed(2)}</p>
      </div>
    </article>
  `;
}

function render() {
  elements.favoritesCount.textContent = state.favorites.length;
  elements.favoritesFilter.setAttribute(
    "aria-pressed",
    String(state.favoritesOnly),
  );
  elements.favoritesSummary.setAttribute(
    "aria-label",
    `${state.favorites.length} favorites. Show favorites only`,
  );

  if (state.loadingState !== "success") return;

  setLoadingState("success");
  elements.count.textContent = `${state.filteredProducts.length} ${state.filteredProducts.length === 1 ? "piece" : "pieces"} found`;
  elements.empty.hidden = state.filteredProducts.length !== 0;
  elements.grid.hidden = state.filteredProducts.length === 0;

  elements.grid.innerHTML = state.filteredProducts
    .map(createProductCard)
    .join("");
}

// Event Listeners & Keyboard Shortcuts

const handleSearch = debounce((event) => {
  state.searchTerm = event.target.value;
  applyFilters();
}, 300);

elements.search.addEventListener("input", handleSearch);

elements.sort.addEventListener("change", (event) => {
  state.sortOrder = event.target.value;
  applyFilters();
});

elements.favoritesFilter.addEventListener("click", () => {
  state.favoritesOnly = !state.favoritesOnly;
  applyFilters();
});

elements.favoritesSummary.addEventListener("click", () => {
  state.favoritesOnly = !state.favoritesOnly;
  elements.favoritesFilter.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
  applyFilters();
});

elements.grid.addEventListener("click", (event) => {
  const favoriteButton = event.target.closest("[data-favorite-id]");
  if (favoriteButton) {
    toggleFavorite(Number(favoriteButton.dataset.favoriteId));
  }
});

elements.retry.addEventListener("click", fetchProducts);

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && document.activeElement !== elements.search) {
    event.preventDefault();
    elements.search.focus();
  }
});

// Initialization

fetchProducts();
