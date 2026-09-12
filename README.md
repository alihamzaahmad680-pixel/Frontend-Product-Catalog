# Northstar Market

A responsive, dependency-free product discovery interface built with semantic HTML5, modern CSS, and vanilla JavaScript. The visual language is intentionally editorial: calm surfaces, a strong typographic hierarchy, and product imagery that keeps the collection at the center.

## Architecture

- `index.html` owns the accessible document structure, control labels, loading/error/empty states, and the product-grid mount point.
- `styles.css` contains the design tokens, responsive Grid/Flexbox layouts, subtle elevation, motion, reduced-motion support, and mobile breakpoints.
- `app.js` contains a small single-source-of-truth state object and pure-ish rendering/filtering functions. The UI is updated through explicit DOM references rather than framework-like global queries.

## Data and async flow

`fetchProducts()` requests `https://dummyjson.com/products` with `async/await`. It validates both the HTTP status and the expected `products` array. The loading state is shown before the request, and failures move the UI into an accessible error state with a Retry action. A successful response is normalized into `state.products`, then passed through the filter and render pipeline.

## Search and filtering

Search is title-based and case-insensitive. The input handler is wrapped in a 300ms debounce so fast typing produces one filtering pass after the user pauses. Favorites-only filtering and price sorting are applied in the same `applyFilters()` pipeline, which keeps all controls consistent and makes the result count live.

## Favorites persistence

Favorite product IDs are loaded once from `localStorage` under `northstar-market-favorites`. Every toggle updates state, persists the new ID list, and rerenders immediately. JSON parsing and storage writes are guarded so restricted browser storage does not break the rest of the experience.

## Run locally

Because this is a static application, no build step is required. Serve the folder from any static server and open the resulting URL:

```bash
npx serve .
```

Opening `index.html` directly also renders the shell, but a local server is recommended for consistent browser security behavior around network requests.

## Deploy

Deploy the four files to any static host such as GitHub Pages, Netlify, Vercel, Cloudflare Pages, or an object-storage website endpoint. No environment variables or server runtime are required. The remote DummyJSON endpoint must be reachable from the deployed origin.
