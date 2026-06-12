// NAV scroll effect
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// Mobile menu
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');

hamburger.addEventListener('click', () => {
  mobileMenu.classList.add('open');
});

mobileClose.addEventListener('click', () => {
  mobileMenu.classList.remove('open');
});

document.querySelectorAll('.mob-link').forEach((link) => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
  });
});

// FAQ accordion
document.querySelectorAll('.faq-q').forEach((btn) => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item').forEach((faq) => {
      faq.classList.remove('open');
    });

    if (!isOpen) {
      item.classList.add('open');
    }
  });
});

// Scroll reveal
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 60);

        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach((el) => {
  revealObserver.observe(el);
});
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    formStatus.textContent = "Gönderiliyor...";

    const data = {
      name: document.getElementById("name").value,
      phone: document.getElementById("phone").value,
      brand: document.getElementById("brand").value,
      message: document.getElementById("message").value,
    };

    try {
      const response = await fetch("http://localhost:5000/send-mail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        formStatus.textContent = "Talebiniz başarıyla gönderildi. En kısa sürede dönüş yapacağım.";
        contactForm.reset();
      } else {
        formStatus.textContent = "Bir hata oluştu. Lütfen WhatsApp üzerinden iletişime geçin.";
      }
    } catch (error) {
      formStatus.textContent = "Bağlantı hatası. Lütfen backend'in çalıştığından emin olun.";
    }
  });
}