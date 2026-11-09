const filters = document.querySelector<HTMLFormElement>(".gallery-filters");
const cards = [...document.querySelectorAll<HTMLElement>(".gallery-card")];
const dialog = document.querySelector<HTMLDialogElement>("#gallery-lightbox");

if (filters && dialog) {
  const checkboxes = [...filters.querySelectorAll<HTMLInputElement>("[name=category]")];
  const clear = filters.querySelector<HTMLButtonElement>("#clear-gallery")!;
  const count = document.querySelector<HTMLElement>("#gallery-count")!;
  const empty = document.querySelector<HTMLElement>("#gallery-empty")!;
  const image = dialog.querySelector<HTMLImageElement>("#lightbox-image")!;
  const title = dialog.querySelector<HTMLElement>("#lightbox-title")!;
  const description = dialog.querySelector<HTMLElement>("#lightbox-description")!;
  const related = dialog.querySelector<HTMLAnchorElement>("#lightbox-related")!;
  const original = dialog.querySelector<HTMLAnchorElement>("#lightbox-original")!;
  const status = dialog.querySelector<HTMLElement>("#lightbox-status")!;
  const previous = dialog.querySelector<HTMLButtonElement>("[data-lightbox-previous]")!;
  const next = dialog.querySelector<HTMLButtonElement>("[data-lightbox-next]")!;
  let current: HTMLElement | undefined;
  let opener: HTMLAnchorElement | undefined;
  const visible = () => cards.filter((card) => !card.hidden);

  filters.hidden = false;
  filters.addEventListener("submit", (event) => event.preventDefault());
  const filter = () => {
    const selected = checkboxes.filter((checkbox) => checkbox.checked).map((checkbox) => checkbox.value);
    cards.forEach((card) => {
      const categories = JSON.parse(card.dataset.categories!) as string[];
      card.hidden = selected.length > 0 && !categories.some((category) => selected.includes(category));
    });
    const total = visible().length;
    count.textContent = `${total} ${total === 1 ? "photo" : "photos"}`;
    empty.hidden = total > 0;
    clear.hidden = selected.length === 0;
  };
  filters.addEventListener("change", filter);
  clear.addEventListener("click", () => {
    checkboxes.forEach((checkbox) => { checkbox.checked = false; });
    filter();
    checkboxes[0]?.focus();
  });

  const show = (card: HTMLElement) => {
    current = card;
    const link = card.querySelector<HTMLAnchorElement>("[data-lightbox]")!;
    const thumbnail = link.querySelector<HTMLImageElement>("img")!;
    image.src = link.dataset.full!;
    image.alt = thumbnail.alt;
    title.textContent = card.querySelector("h2")!.textContent;
    description.textContent = card.querySelector(".photo-description")!.textContent;
    const post = card.querySelector<HTMLAnchorElement>(".photo-related");
    related.hidden = !post;
    if (post) { related.href = post.href; related.textContent = post.textContent; }
    else related.removeAttribute("href");
    original.href = link.href;
    const photos = visible();
    status.textContent = `${photos.indexOf(card) + 1} / ${photos.length}`;
    previous.hidden = next.hidden = photos.length < 2;
  };
  const step = (direction: number) => {
    const photos = visible();
    if (!current || photos.length < 2) return;
    show(photos[(photos.indexOf(current) + direction + photos.length) % photos.length]);
  };
  cards.forEach((card) => {
    const link = card.querySelector<HTMLAnchorElement>("[data-lightbox]")!;
    link.addEventListener("click", (event) => {
      // Keep modified clicks and the no-JS original-image link working normally.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (typeof dialog.showModal !== "function") return;
      event.preventDefault();
      opener = link;
      show(card);
      dialog.showModal();
    });
  });
  dialog.querySelector(".lightbox-close")!.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => { opener?.focus(); image.removeAttribute("src"); });
  dialog.addEventListener("click", (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  previous.addEventListener("click", () => step(-1));
  next.addEventListener("click", () => step(1));
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      step(event.key === "ArrowLeft" ? -1 : 1);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      dialog.close();
    }
    // The native modal dialog traps keyboard focus.
  });
}
