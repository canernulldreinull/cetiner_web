if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("load", () => {
  window.scrollTo(0, 0);
});
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

    formStatus.textContent = "Talebiniz gönderiliyor...";

    const formData = new FormData(contactForm);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (result.success) {

        const whatsappText = encodeURIComponent(
          "Merhaba, web sitesi için form üzerinden talep gönderdim. Detayları WhatsApp üzerinden de paylaşmak istiyorum."
        );

        formStatus.innerHTML = `
          Talebiniz başarıyla gönderildi. En kısa sürede dönüş yapacağım.<br>
          <a href="https://wa.me/905467129239?text=${whatsappText}" target="_blank" class="form-whatsapp-link">
            WhatsApp üzerinden devam et
          </a>
        `;

        contactForm.reset();

      } else {
        formStatus.textContent = "Bir hata oluştu. Lütfen tekrar deneyin.";
      }

    } catch (error) {
      formStatus.textContent = "Bağlantı hatası. Lütfen tekrar deneyin.";
    }
  });
}