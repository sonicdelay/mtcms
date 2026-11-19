(() => {
  const lightbox = document.getElementById("lb");
  if (!lightbox) return;

  const lightboxImg = lightbox.querySelector("img");
  const counter = document.getElementById("lb-count");
  let images = [];
  let index = 0;

  function show(next) {
    if (!images.length) return;
    index = (next + images.length) % images.length;
    lightboxImg.src = images[index].src;
    lightboxImg.alt = images[index].alt;
    counter.textContent = `${index + 1} / ${images.length}`;
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    lightbox.classList.remove("open");
    lightboxImg.removeAttribute("src");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", (event) => {
    const frame = event.target.closest(".card a.frame");
    if (frame) {
      event.preventDefault();
      images = [...document.querySelectorAll(".card img")];
      show(images.indexOf(frame.querySelector("img")));
      return;
    }
    const nav = event.target.closest("[data-nav]");
    if (nav) {
      show(index + Number(nav.dataset.nav));
      return;
    }
    if (event.target.closest("[data-close]") || event.target === lightbox)
      close();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("open")) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(index - 1);
    if (event.key === "ArrowRight") show(index + 1);
  });
})();

