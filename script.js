const SUPABASE_URL = "https://dmchwveutgwrloornfyw.supabase.co";
const SUPABASE_KEY = "sb_publishable_uGsRyyWZ-xGcNASvEqAUKQ_k_3hH3eV";
const PRODUCTS_ENDPOINT = `${SUPABASE_URL}/rest/v1/produtos`;

const grid = document.getElementById("lista");
const counter = document.getElementById("contagem");
const searchInput = document.getElementById("busca");
const sortSelect = document.getElementById("ordenacao");
const productForm = document.getElementById("form-produto");
const message = document.getElementById("mensagem");
const saveButton = document.getElementById("salvar");

let products = [];

document.getElementById("ano").textContent = new Date().getFullYear();

function apiHeaders(extra = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    ...extra,
  };
}

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

function placeholderImage() {
  const placeholder = document.createElement("div");
  placeholder.className = "image-placeholder";
  placeholder.setAttribute("aria-label", "Imagem do produto não cadastrada");

  const mark = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  mark.setAttribute("viewBox", "0 0 24 24");
  mark.setAttribute("fill", "none");
  mark.setAttribute("stroke", "currentColor");
  mark.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z M4 16l4.2-4.2a1.2 1.2 0 0 1 1.7 0L15 17l2.2-2.2a1.2 1.2 0 0 1 1.7 0L20 16 M8.5 8.5h.01");
  mark.appendChild(path);

  const label = document.createElement("span");
  label.textContent = "Imagem em breve";
  placeholder.append(mark, label);
  return placeholder;
}

function safeImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function createProductCard(product) {
  const card = document.createElement("article");
  card.className = "product-card";

  const media = document.createElement("div");
  media.className = "product-media";

  const imageUrl = safeImageUrl(product.imagem_url);
  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = product.nome ? `Imagem de ${product.nome}` : "Imagem do produto";
    img.loading = "lazy";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", () => {
      media.replaceChildren(placeholderImage());
    }, { once: true });
    media.appendChild(img);
  } else {
    media.appendChild(placeholderImage());
  }

  const info = document.createElement("div");
  info.className = "product-info";

  const title = document.createElement("h3");
  title.textContent = product.nome || "Produto sem nome";

  const description = document.createElement("p");
  description.className = "product-description";
  description.textContent = (product.descricao || "").trim() || "Descrição ainda não cadastrada.";

  const bottom = document.createElement("div");
  bottom.className = "product-bottom";

  const price = document.createElement("span");
  price.className = "product-price";
  const formattedPrice = formatPrice(product.preco);
  if (formattedPrice) {
    price.textContent = formattedPrice;
  } else {
    price.classList.add("price-missing");
    price.textContent = "Preço a definir";
  }

  const number = document.createElement("span");
  number.className = "product-number";
  number.textContent = product.id ? `#${product.id}` : "";

  bottom.append(price, number);
  info.append(title, description, bottom);
  card.append(media, info);
  return card;
}

function filteredProducts() {
  const term = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const result = products.filter((product) => {
    const searchable = `${product.nome || ""} ${product.descricao || ""}`.toLocaleLowerCase("pt-BR");
    return searchable.includes(term);
  });

  switch (sortSelect.value) {
    case "nome":
      result.sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
      break;
    case "menor-preco":
      result.sort((a, b) => Number(a.preco || 0) - Number(b.preco || 0));
      break;
    case "maior-preco":
      result.sort((a, b) => Number(b.preco || 0) - Number(a.preco || 0));
      break;
    default:
      result.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }
  return result;
}

function renderProducts() {
  const shown = filteredProducts();
  grid.replaceChildren();
  counter.textContent = `${shown.length} ${shown.length === 1 ? "produto" : "produtos"}`;

  if (shown.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    const title = document.createElement("strong");
    const details = document.createElement("span");
    if (products.length === 0) {
      title.textContent = "Sua coleção começa aqui.";
      details.textContent = "Cadastre o primeiro produto abaixo para ele aparecer nesta vitrine.";
    } else {
      title.textContent = "Nenhum produto encontrado.";
      details.textContent = "Tente buscar por outro nome ou descrição.";
    }
    empty.append(title, details);
    grid.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  shown.forEach((product) => fragment.appendChild(createProductCard(product)));
  grid.appendChild(fragment);
}

async function listarProdutos() {
  grid.replaceChildren();
  const loading = document.createElement("div");
  loading.className = "loading-state";
  loading.textContent = "Carregando a coleção…";
  grid.appendChild(loading);

  try {
    const response = await fetch(`${PRODUCTS_ENDPOINT}?select=id,nome,preco,imagem_url,descricao&order=id.desc`, {
      headers: apiHeaders(),
    });
    if (!response.ok) {
      throw new Error("Não foi possível carregar os produtos. Verifique as permissões da tabela no Supabase.");
    }

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("O catálogo retornou uma resposta inesperada.");
    products = data;
    renderProducts();
  } catch (error) {
    grid.replaceChildren();
    const state = document.createElement("div");
    state.className = "error-state";
    state.textContent = error instanceof Error ? error.message : "Ocorreu um erro inesperado ao carregar a coleção.";
    grid.appendChild(state);
    counter.textContent = "Não foi possível carregar os produtos";
  }
}

searchInput.addEventListener("input", renderProducts);
sortSelect.addEventListener("change", renderProducts);

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  message.className = "form-message";

  const formData = new FormData(productForm);
  const nome = String(formData.get("nome") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();
  const preco = Number(formData.get("preco"));
  const rawImage = String(formData.get("imagem_url") || "").trim();
  const imagem_url = rawImage ? safeImageUrl(rawImage) : null;

  if (!nome || !descricao || !Number.isFinite(preco) || preco <= 0) {
    message.textContent = "Preencha nome, preço válido e descrição.";
    message.classList.add("is-error");
    return;
  }
  if (rawImage && !imagem_url) {
    message.textContent = "Use um link de imagem válido iniciado por http:// ou https://.";
    message.classList.add("is-error");
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "Salvando…";

  try {
    const response = await fetch(PRODUCTS_ENDPOINT, {
      method: "POST",
      headers: apiHeaders({
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      }),
      body: JSON.stringify({ nome, preco, imagem_url, descricao }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail.includes("permission") || detail.includes("row-level security")
        ? "O Supabase bloqueou o cadastro. Revise as políticas de acesso da tabela produtos."
        : "Não foi possível salvar o produto. Confira a conexão e a estrutura da tabela.");
    }

    productForm.reset();
    message.textContent = "Produto cadastrado. A vitrine foi atualizada.";
    message.classList.add("is-success");
    await listarProdutos();
    document.getElementById("colecao").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    message.textContent = error instanceof Error ? error.message : "Ocorreu um erro ao salvar o produto.";
    message.classList.add("is-error");
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Salvar produto →";
  }
});

listarProdutos();