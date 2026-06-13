if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("load", () => {
  window.scrollTo(0, 0);
});

// NAV scroll effect
const navbar = document.getElementById("navbar");

if (navbar) {
  window.addEventListener("scroll", () => {
    navbar.classList.toggle("scrolled", window.scrollY > 50);
  });
}

// Mobile menu
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

// FAQ accordion
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

// Scroll reveal
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, index * 60);

        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el) => {
  revealObserver.observe(el);
});

// Contact form
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");

function formatName(value) {
  return value
    .replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ\s]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, 23)
    .toLocaleLowerCase("tr-TR")
    .replace(/(^|\s)([a-zA-ZğüşöçıİĞÜŞÖÇ])/g, (match) =>
      match.toLocaleUpperCase("tr-TR")
    );
}

function formatPhone(value) {
  let digits = value.replace(/\D/g, "");

  if (digits.startsWith("90")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);

  let formatted = "(+90)";

  if (digits.length > 0) formatted += " " + digits.slice(0, 3);
  if (digits.length > 3) formatted += " " + digits.slice(3, 6);
  if (digits.length > 6) formatted += " " + digits.slice(6, 8);
  if (digits.length > 8) formatted += " " + digits.slice(8, 10);

  return formatted;
}

if (nameInput) {
  nameInput.setAttribute("maxlength", "23");

  nameInput.addEventListener("input", () => {
    nameInput.value = formatName(nameInput.value);
  });
}

if (phoneInput) {
  phoneInput.setAttribute("maxlength", "17");
  phoneInput.setAttribute("inputmode", "numeric");

  phoneInput.addEventListener("input", () => {
    phoneInput.value = formatPhone(phoneInput.value);
  });
}

if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitCount = Number(localStorage.getItem("contactFormCount") || 0);

    if (submitCount >= 3) {
      formStatus.textContent =
        "Çok fazla talep gönderdiniz. Lütfen daha sonra tekrar deneyin.";
      return;
    }

    const nameValue = nameInput ? nameInput.value.trim() : "";
    const phoneValue = phoneInput ? phoneInput.value : "";
    const phoneDigits = phoneValue.replace(/\D/g, "");
    const messageInput = document.getElementById("message");
    const messageValue = messageInput ? messageInput.value.trim() : "";

    if (
      nameValue.length < 2 ||
      phoneDigits.length !== 12 ||
      messageValue.length < 10
    ) {
      formStatus.textContent = "Lütfen tüm alanları doğru şekilde doldurun.";
      return;
    }

    formStatus.textContent = "Talebiniz gönderiliyor...";

    const formData = new FormData(contactForm);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        localStorage.setItem("contactFormCount", submitCount + 1);

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
        formStatus.textContent =
          result.message || "Bir hata oluştu. Lütfen tekrar deneyin.";
      }
    } catch (error) {
      formStatus.textContent = "Bağlantı hatası. Lütfen tekrar deneyin.";
    }
  });
}