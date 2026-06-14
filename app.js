const navbar = document.getElementById("navbar");

if (navbar) {
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  });
}

const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");
const mobileClose = document.getElementById("mobileClose");

if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", () => {
    mobileMenu.classList.add("open");
  });
}

if (mobileClose && mobileMenu) {
  mobileClose.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
  });
}

document.querySelectorAll(".mob-link").forEach((link) => {
  link.addEventListener("click", () => {
    if (mobileMenu) {
      mobileMenu.classList.remove("open");
    }
  });
});

document.querySelectorAll(".faq-q").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    if (!item) return;

    const isOpen = item.classList.contains("open");

    document.querySelectorAll(".faq-item").forEach((faq) => {
      faq.classList.remove("open");
    });

    if (!isOpen) {
      item.classList.add("open");
    }
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => {
  revealObserver.observe(el);
});
const phoneInput = document.getElementById("phone");

if (phoneInput) {
  phoneInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");

    value = value.substring(0, 10);

    if (value.length > 6) {
      value = value.replace(
        /(\d{3})(\d{3})(\d{0,2})(\d{0,2})/,
        "$1 $2 $3 $4"
      );
    } else if (value.length > 3) {
      value = value.replace(
        /(\d{3})(\d{0,3})/,
        "$1 $2"
      );
    }

    e.target.value = value.trim();
  });
}