document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll(".menu-card, .gallery img");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  }, {
    threshold: 0.15
  });

  cards.forEach(card => {
    observer.observe(card);
  });

  const goTop = document.getElementById("goTop");

  if (goTop) {
    goTop.addEventListener("click", function (e) {
      e.preventDefault();

      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
      });
    });
  }
});
const goTop = document.getElementById("goTop");

if (goTop) {
  goTop.addEventListener("click", function (e) {
    e.preventDefault();

    const startPosition = window.pageYOffset;
    const duration = 800;
    let startTime = null;

    function smoothScroll(currentTime) {
      if (startTime === null) startTime = currentTime;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      window.scrollTo(0, startPosition * (1 - progress));

      if (progress < 1) {
        requestAnimationFrame(smoothScroll);
      }
    }

    requestAnimationFrame(smoothScroll);
  });
}
const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", function () {
  if (window.scrollY > 120) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});
const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 500) {
    backToTop.classList.add("show");
  } else {
    backToTop.classList.remove("show");
  }
});

backToTop.addEventListener("click", () => {
  const startPosition = window.pageYOffset;
  const duration = 800;
  let startTime = null;

  function smoothScroll(currentTime) {
    if (!startTime) startTime = currentTime;

    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    window.scrollTo(0, startPosition * (1 - progress));

    if (progress < 1) {
      requestAnimationFrame(smoothScroll);
    }
  }

  requestAnimationFrame(smoothScroll);
});
const galleryImages = document.querySelectorAll(".gallery img, .menu-card img");
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const closeLightbox = document.getElementById("closeLightbox");

galleryImages.forEach((img) => {
  img.addEventListener("click", () => {
    lightbox.classList.add("show");
    lightboxImg.src = img.src;
  });
});

closeLightbox.addEventListener("click", () => {
  lightbox.classList.remove("show");
});

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) {
    lightbox.classList.remove("show");
  }
});
const navLinks = document.querySelectorAll('nav a[href^="#"], .hero-buttons a[href^="#"]');

navLinks.forEach(link => {
  link.addEventListener("click", function(e) {
    e.preventDefault();

    const targetId = this.getAttribute("href");
    const target = document.querySelector(targetId);

    if (!target) return;

    const startPosition = window.pageYOffset;
    const targetPosition = target.offsetTop - 90;
    const distance = targetPosition - startPosition;
    const duration = 900;
    let startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      window.scrollTo(0, startPosition + distance * progress);

      if (progress < 1) {
        requestAnimationFrame(animation);
      }
    }

    requestAnimationFrame(animation);
  });
});
