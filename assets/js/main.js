(function () {
  "use strict";

  var HEADER_SELECTOR = ".header";
  var SECTION_SELECTOR = "section[id]";
  var HEADER_OFFSET = 96;
  var MOBILE_MAX = 899;

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function isMobileNav() {
    return window.innerWidth <= MOBILE_MAX;
  }

  var yearEl = qs("#year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* ----- Mobile nav + backdrop + focus trap ----- */
  var navToggle = qs("#nav-toggle");
  var navMenu = qs("#nav-menu");
  var navBackdrop = qs("#nav-backdrop");
  var navLinks = qsa(".nav__link");
  var lastMenuFocus = null;

  function getMenuFocusables() {
    if (!navMenu) return [];
    return qsa('a[href^="#"]', navMenu).filter(function (el) {
      return el.offsetParent !== null || el.getClientRects().length > 0;
    });
  }

  function setMenuOpen(open) {
    if (!navMenu || !navToggle) return;
    navMenu.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
    if (navBackdrop) {
      if (open && isMobileNav()) {
        navBackdrop.classList.add("is-visible");
        navBackdrop.setAttribute("aria-hidden", "false");
      } else {
        navBackdrop.classList.remove("is-visible");
        navBackdrop.setAttribute("aria-hidden", "true");
      }
    }
    if (open && isMobileNav()) {
      lastMenuFocus = document.activeElement;
      var items = getMenuFocusables();
      if (items.length) {
        setTimeout(function () {
          items[0].focus();
        }, 0);
      }
    } else if (!open && lastMenuFocus && lastMenuFocus.focus) {
      lastMenuFocus.focus();
      lastMenuFocus = null;
    }
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var open = !navMenu.classList.contains("is-open");
      setMenuOpen(open);
    });
  }

  if (navBackdrop) {
    navBackdrop.addEventListener("click", function () {
      setMenuOpen(false);
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      setMenuOpen(false);
    });
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > MOBILE_MAX) {
      setMenuOpen(false);
      if (navBackdrop) {
        navBackdrop.classList.remove("is-visible");
        navBackdrop.setAttribute("aria-hidden", "true");
      }
      document.body.style.overflow = "";
    } else if (navMenu && !navMenu.classList.contains("is-open") && navBackdrop) {
      navBackdrop.classList.remove("is-visible");
      navBackdrop.setAttribute("aria-hidden", "true");
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (navMenu && navMenu.classList.contains("is-open")) {
      setMenuOpen(false);
      if (navToggle) navToggle.focus();
    }
  });

  if (navMenu) {
    navMenu.addEventListener("keydown", function (e) {
      if (!navMenu.classList.contains("is-open") || !isMobileNav()) return;
      if (e.key !== "Tab") return;
      var items = getMenuFocusables();
      if (items.length === 0) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ----- Smooth scroll ----- */
  var sections = qsa(SECTION_SELECTOR);
  var headerEl = qs(HEADER_SELECTOR);

  function scrollToHash(hash) {
    if (!hash || hash === "#") return;
    var target = qs(hash);
    if (!target) return;
    var top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top: top, behavior: "smooth" });
  }

  qsa('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var href = anchor.getAttribute("href");
      if (!href || href === "#" || href.length < 2) return;
      if (!qs(href)) return;
      e.preventDefault();
      scrollToHash(href);
      if (history.pushState) {
        history.pushState(null, "", href);
      }
    });
  });

  function setActiveLink() {
    var scrollY = window.scrollY;
    var current =
      sections.length && sections[0].getAttribute("id")
        ? sections[0].getAttribute("id")
        : "";
    sections.forEach(function (section) {
      var id = section.getAttribute("id");
      if (!id) return;
      var top = section.offsetTop - HEADER_OFFSET - 24;
      var h = section.offsetHeight;
      if (scrollY >= top && scrollY < top + h) {
        current = id;
      }
    });
    var doc = document.documentElement;
    var atBottom = window.innerHeight + scrollY >= doc.scrollHeight - 8;
    if (atBottom && sections.length) {
      var last = sections[sections.length - 1].getAttribute("id");
      if (last) current = last;
    }
    navLinks.forEach(function (link) {
      var href = link.getAttribute("href") || "";
      link.classList.toggle("active", href === "#" + current);
    });
  }

  function onScrollHeader() {
    if (headerEl) {
      headerEl.classList.toggle("is-scrolled", window.scrollY > 40);
    }
    setActiveLink();
  }

  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  if (window.location.hash && qs(window.location.hash)) {
    window.requestAnimationFrame(function () {
      scrollToHash(window.location.hash);
    });
  }

  /* ----- Typing effect (visual only; screen readers use #hero-role-static) ----- */
  var typingEl = qs("#typing-text");
  var roles = [
    "Software developer",
    "Java & Spring Boot engineer",
    "Full stack developer",
    "React · Node · REST APIs",
  ];
  var roleIndex = 0;
  var charIndex = 0;
  var deleting = false;
  var typeDelay = 100;
  var deleteDelay = 55;
  var pauseEnd = 2200;
  var pauseStart = 600;

  function tickTyping() {
    if (!typingEl) return;
    var full = roles[roleIndex];
    if (!deleting) {
      typingEl.textContent = full.slice(0, charIndex + 1);
      charIndex++;
      if (charIndex === full.length) {
        deleting = true;
        setTimeout(tickTyping, pauseEnd);
        return;
      }
      setTimeout(tickTyping, typeDelay);
    } else {
      typingEl.textContent = full.slice(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        setTimeout(tickTyping, pauseStart);
        return;
      }
      setTimeout(tickTyping, deleteDelay);
    }
  }

  if (typingEl) {
    setTimeout(tickTyping, 600);
  }

  /* ----- Scroll reveal ----- */
  var revealEls = qsa(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ----- Copy email ----- */
  var copyBtn = qs("#copy-email");
  var toast = qs("#toast");

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    toast.classList.add("is-show");
    setTimeout(function () {
      toast.classList.remove("is-show");
      setTimeout(function () {
        toast.hidden = true;
      }, 300);
    }, 2200);
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email") || "";
      if (!email) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(
          function () {
            showToast("Email copied to clipboard");
          },
          function () {
            showToast("Could not copy — select manually");
          }
        );
      } else {
        showToast(email);
      }
    });
  }

  /* ----- Contact form (Formspree AJAX) ----- */
  var contactForm = qs("#contact-form");
  var formStatus = qs("#form-status");
  var submitBtn = qs("#contact-submit");
  var btnLabel = submitBtn ? submitBtn.querySelector(".btn__label") : null;
  var btnLoading = submitBtn ? submitBtn.querySelector(".btn__loading") : null;

  function setFormLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    if (btnLabel) {
      if (loading) {
        btnLabel.setAttribute("hidden", "");
      } else {
        btnLabel.removeAttribute("hidden");
      }
    }
    if (btnLoading) {
      if (loading) {
        btnLoading.removeAttribute("hidden");
      } else {
        btnLoading.setAttribute("hidden", "");
      }
    }
  }

  function showFormStatus(message, isError) {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.removeAttribute("hidden");
    formStatus.classList.remove("form-status--success", "form-status--error");
    formStatus.classList.add(isError ? "form-status--error" : "form-status--success");
  }

  function clearFormStatus() {
    if (!formStatus) return;
    formStatus.setAttribute("hidden", "");
    formStatus.textContent = "";
    formStatus.classList.remove("form-status--success", "form-status--error");
  }

  if (contactForm && submitBtn) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearFormStatus();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      var action = contactForm.getAttribute("action");
      if (!action) return;
      setFormLoading(true);
      var formData = new FormData(contactForm);
      var controller = new AbortController();
      var formTimeoutMs = 30000;
      var timeoutId = setTimeout(function () {
        controller.abort();
      }, formTimeoutMs);

      fetch(action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
        signal: controller.signal,
      })
        .then(function (res) {
          return res
            .json()
            .catch(function () {
              return {};
            })
            .then(function (data) {
              return { ok: res.ok, data: data };
            });
        })
        .then(function (result) {
          if (result.ok) {
            showFormStatus("Thank you — your message was sent. I'll get back to you soon.", false);
            contactForm.reset();
          } else {
            var err =
              (result.data && result.data.error) ||
              (result.data && result.data.errors && result.data.errors[0] && result.data.errors[0].message) ||
              "Something went wrong. Please try email instead.";
            showFormStatus(String(err), true);
          }
        })
        .catch(function (err) {
          if (err && err.name === "AbortError") {
            showFormStatus("Request timed out. Please try again or email me directly.", true);
          } else {
            showFormStatus("Network error. Please try again or email me directly.", true);
          }
        })
        .finally(function () {
          clearTimeout(timeoutId);
          setFormLoading(false);
        });
    });
  }
})();
