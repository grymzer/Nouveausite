// ===============================
// Mademoiselle Nina — JS refondu
// Compatible avec le HTML/CSS futuristes
// ===============================

// --- État global ---
const state = {
  products: [],
  selected: [], // {name, price}
  search: "",
  filter: "all",
  currentModalImages: [],
  currentModalIndex: 0,
};

// --- Utilitaires ---
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const formatEuro = (n) => `${n.toFixed(2)} €`;

function updateSelectedCount() {
  const el = document.getElementById("selected-count");
  if (el) el.textContent = String(state.selected.length);
}

function isSelected(name) {
  return state.selected.some((x) => x.name === name);
}

function toggleSelect(product) {
  const idx = state.selected.findIndex((x) => x.name === product.name);
  if (idx > -1) state.selected.splice(idx, 1);
  else state.selected.push({ name: product.name, price: product.price });
  updateSelectedCount();
}

// --- Rendu produits ---
function renderProducts() {
  const grid = document.getElementById("product-grid");
  const tpl = document.getElementById("product-card-template");
  if (!grid || !tpl) return;

  grid.innerHTML = "";

  const matches = (p) => {
    const bySearch = state.search
      ? (p.name?.toLowerCase().includes(state.search) || p.description?.toLowerCase().includes(state.search))
      : true;
    const byFilter = (() => {
      if (state.filter === "all") return true;
      if (state.filter === "nouveautes") return !!p.isNew;
      if (p.category) return p.category === state.filter;
      return true; // si pas de catégorie dans le JSON
    })();
    return bySearch && byFilter;
  };

  state.products.filter(matches).forEach((p) => {
    const node = tpl.content.cloneNode(true);
    const article = node.querySelector(".product-card");
    const img = node.querySelector("img");
    const title = node.querySelector(".title");
    const desc = node.querySelector(".desc");
    const price = node.querySelector(".price");
    const addBtn = node.querySelector(".btn.add");
    const media = node.querySelector(".media");

    // Image principale
    const firstImage = Array.isArray(p.images) && p.images.length ? p.images[0] : p.image || p.cover || "";
    if (img) {
      img.src = firstImage || "";
      img.alt = p.name || "Produit";
      img.decoding = "async";
      img.loading = "lazy";
      img.addEventListener("click", () => openImageModal(p));
    }

    // Métadonnées
    if (title) title.textContent = p.name || "Article";
    if (desc) desc.textContent = p.description || "";
    if (price) price.textContent = formatEuro(Number(p.price || 0));

    // État stock visuel
    if (typeof p.stock === "number" && p.stock <= 0) {
      article.classList.add("out-of-stock");
    }

    // Sélection
    if (addBtn) {
      const pressed = isSelected(p.name);
      addBtn.setAttribute("data-action", "toggle-select");
      addBtn.setAttribute("aria-pressed", String(pressed));
      addBtn.textContent = pressed ? "Sélectionné" : "Sélectionner";
      addBtn.addEventListener("click", () => {
        if (typeof p.stock === "number" && p.stock <= 0) return;
        toggleSelect(p);
        const nowPressed = isSelected(p.name);
        addBtn.setAttribute("aria-pressed", String(nowPressed));
        addBtn.textContent = nowPressed ? "Sélectionné" : "Sélectionner";
      });
    }

    grid.appendChild(node);
  });
}

// --- Recherche & filtres ---
function initSearchAndFilters() {
  const search = document.getElementById("search");
  if (search) {
    search.addEventListener("input", (e) => {
      state.search = String(e.target.value || "").toLowerCase().trim();
      renderProducts();
    });
  }

  $$(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$(".chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
      chip.setAttribute("aria-pressed", "true");
      state.filter = chip.getAttribute("data-filter") || "all";
      renderProducts();
    });
  });
}

// --- Modale image ---
function openImageModal(product) {
  const modal = document.getElementById("image-modal");
  const modalImg = document.getElementById("modal-image");
  if (!modal || !modalImg) return;

  state.currentModalImages = Array.isArray(product.images) && product.images.length ? product.images : [product.image || product.cover].filter(Boolean);
  state.currentModalIndex = 0;

  const show = (i) => {
    const src = state.currentModalImages[i];
    if (src) modalImg.src = src;
  };

  show(state.currentModalIndex);

  modal.hidden = false;
  const onKey = (e) => {
    if (e.key === "Escape") closeImageModal();
    if (e.key === "ArrowRight") { state.currentModalIndex = (state.currentModalIndex + 1) % state.currentModalImages.length; show(state.currentModalIndex); }
    if (e.key === "ArrowLeft")  { state.currentModalIndex = (state.currentModalIndex - 1 + state.currentModalImages.length) % state.currentModalImages.length; show(state.currentModalIndex); }
  };
  document.addEventListener("keydown", onKey);
  modal.dataset.keyListener = "true";
  modal._onKey = onKey; // stocke le ref pour retrait

  // fermer en cliquant le bouton ou l'arrière-plan
  modal.addEventListener("click", (ev) => {
    if (ev.target === modal || ev.target.matches("[data-close], .modal-close")) closeImageModal();
  }, { once: true });
}

function closeImageModal() {
  const modal = document.getElementById("image-modal");
  if (!modal) return;
  modal.hidden = true;
  if (modal._onKey) {
    document.removeEventListener("keydown", modal._onKey);
    delete modal._onKey;
  }
}

// --- Envoi de commande ---
function buildOrderMessage() {
  if (!state.selected.length) return "Vous n'avez sélectionné aucun article !";

  const lines = state.selected.map((a) => `- ${a.name} : ${a.price.toFixed(2)} €`).join("\n");
  const total = state.selected.reduce((sum, a) => sum + (a.price || 0), 0);

  return `\nBonjour,\n\nUn grand merci pour ta commande et pour ton soutien à l’association.\n\nVoici le récapitulatif de ta commande :\n${lines}\n\nPour un total de : ${total.toFixed(2)} € (le prix parfait pour une bonne action).\n\nPour régler cette belle commande, tu peux :\n\n1. M'envoyer un chèque à l’ordre de l’Association Aidons Agathe (promis, il sera encaissé avec un grand sourire).\n2. Ou me payer en liquide (mais attention, je n'accepte pas les chocolats en guise de monnaie, sauf exception...).\n\nEncore merci et à bientôt,\nGaëlle\n07 87 48 22 09\n`;
}

function initSendEmail() {
  const btn = document.getElementById("send-email-button");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!state.selected.length) {
      alert("Vous n'avez sélectionné aucun article !");
      return;
    }
    const body = encodeURIComponent(buildOrderMessage());
    const subject = encodeURIComponent("Demande de réservation");
    window.location.href = `mailto:gaelle.dallongeville@gmail.com?subject=${subject}&body=${body}`;
  });
}

// --- Chargement des produits ---
async function loadProducts() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/grymzer/Mademoiselle-NIna-/refs/heads/main/stocks.json', { cache: 'no-cache' });
    const data = await res.json();

    // Normalisation minimale
    state.products = Array.isArray(data) ? data.map(p => ({
      name: p.name || p.titre || "Article",
      price: Number(p.price ?? p.prix ?? 0),
      stock: typeof p.stock === 'number' ? p.stock : (p.stock === false ? 0 : (p.stock ? Number(p.stock) : undefined)),
      images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
      category: p.category || p.categorie || null,
      isNew: Boolean(p.isNew || p.nouveau || p.nouveaute),
      description: p.description || p.desc || "",
    })) : [];

    renderProducts();
  } catch (err) {
    console.error('Erreur lors du chargement des produits :', err);
    const grid = document.getElementById('product-grid');
    if (grid) grid.innerHTML = '<p>Impossible de charger les produits pour le moment.</p>';
  }
}

// --- Thème (si le bouton existe dans le DOM) ---
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const html = document.documentElement;
  btn.addEventListener('click', () => {
    const isLight = html.getAttribute('data-theme') === 'light';
    html.setAttribute('data-theme', isLight ? 'neon' : 'light');
    btn.setAttribute('aria-pressed', String(!isLight));
  });
}

// --- Init ---
window.addEventListener('DOMContentLoaded', () => {
  initSearchAndFilters();
  initSendEmail();
  initThemeToggle();
  loadProducts();
});

