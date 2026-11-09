import { animate, createTimeline, stagger } from 'animejs';
import Swiper from 'swiper';
import { A11y, Keyboard, Pagination } from 'swiper/modules';
import * as basicLightbox from 'basiclightbox';
import MoveTo from 'moveto';
import mailtoui from 'mailtoui/dist/mailtoui-min.js';

// Loaded exclusively by PortfolioLayout. Full page navigation keeps these
// listeners and plugins out of the independent Fieldnotes document.
const html = document.documentElement;
const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches;
html.classList.replace('no-js', 'js');
html.classList.toggle('reduced-motion', reducedMotion);
mailtoui.run();
const emailModal = document.querySelector<HTMLElement>('#mailtoui-modal');
emailModal?.setAttribute('role', 'dialog');
emailModal?.setAttribute('aria-modal', 'true');
emailModal?.setAttribute('aria-labelledby', 'mailtoui-modal-title');
document
  .querySelector('#mailtoui-modal-close')
  ?.setAttribute('aria-label', 'Close email chooser');

function revealPage() {
  html.classList.remove('ss-preload');
  html.classList.add('ss-loaded');
  if (reducedMotion) {
    document
      .querySelector<HTMLElement>('#preloader')
      ?.setAttribute('hidden', '');
    html.dataset.portfolioReady = 'true';
    return;
  }
  const timeline = createTimeline({
    defaults: { ease: 'inOutCubic', duration: 800 },
    onComplete: () => {
      html.dataset.portfolioReady = 'true';
    },
  });
  timeline.add('#loader', { opacity: 0, duration: 1000 });
  timeline.add('#preloader', {
    opacity: 0,
    onComplete: () => {
      document
        .querySelector<HTMLElement>('#preloader')
        ?.setAttribute('hidden', '');
    },
  });
  timeline.add(
    '.s-header',
    { translateY: [-100, 0], opacity: [0, 1] },
    '-=200',
  );
  if (document.querySelector('.s-intro')) {
    timeline.add('.s-intro .text-pretitle, .s-intro .text-huge-title', {
      translateX: [100, 0],
      opacity: [0, 1],
      delay: stagger(400),
    });
  }
  timeline.add('.circles span', {
    keyframes: [
      { opacity: [0, 0.3] },
      { opacity: [0.3, 0.1], delay: stagger(100, { from: 'last' }) },
    ],
    delay: stagger(100, { from: 'last' }),
  });
  if (document.querySelector('.intro-social')) {
    timeline.add('.intro-social li', {
      translateX: [-50, 0],
      opacity: [0, 1],
      delay: stagger(100, { from: 'last' }),
    });
    timeline.add(
      '.intro-scrolldown',
      { translateY: [100, 0], opacity: [0, 1] },
      '-=800',
    );
  }
}

if (!reducedMotion) html.classList.add('ss-preload');
if (document.readyState === 'complete') revealPage();
else window.addEventListener('load', revealPage, { once: true });

const menuButton = document.querySelector<HTMLButtonElement>(
  '.mobile-menu-toggle',
);
const navigation = document.querySelector<HTMLElement>('.main-nav-wrap');
function closeMenu() {
  document.body.classList.remove('menu-is-open');
  menuButton?.classList.remove('is-clicked');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open navigation');
}
function updateMenuAccessibility() {
  if (navigation)
    navigation.inert =
      window.innerWidth <= 800 &&
      !document.body.classList.contains('menu-is-open');
}
menuButton?.addEventListener('click', () => {
  const opening = !document.body.classList.contains('menu-is-open');
  document.body.classList.toggle('menu-is-open', opening);
  menuButton.classList.toggle('is-clicked', opening);
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.setAttribute(
    'aria-label',
    opening ? 'Close navigation' : 'Open navigation',
  );
  updateMenuAccessibility();
});
navigation?.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => {
    if (window.innerWidth <= 800) {
      closeMenu();
      updateMenuAccessibility();
    }
  }),
);
document.addEventListener('keydown', (event) => {
  if (
    event.key === 'Escape' &&
    document.body.classList.contains('menu-is-open')
  ) {
    closeMenu();
    updateMenuAccessibility();
    menuButton?.focus();
  }
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 800) closeMenu();
  updateMenuAccessibility();
});
updateMenuAccessibility();

const sections = document.querySelectorAll<HTMLElement>('.target-section');
function highlightNavigation() {
  sections.forEach((section) => {
    const link = document.querySelector<HTMLAnchorElement>(
      `.main-nav a[href="#${section.id}"]`,
    );
    if (!link) return;
    const active =
      window.scrollY > section.offsetTop - 50 &&
      window.scrollY <= section.offsetTop + section.offsetHeight - 50;
    link.parentElement?.classList.toggle('current', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', highlightNavigation, { passive: true });

// Retain the original entry threshold and staggered reveal timings. The upper
// bound includes partially visible blocks reached by anchor jumps.
const blocks = document.querySelectorAll<HTMLElement>('[data-animate-block]');
function revealBlocks() {
  if (reducedMotion) return;
  blocks.forEach((block) => {
    const triggerTop =
      block.offsetTop + window.innerHeight * 0.2 - window.innerHeight;
    if (
      window.scrollY >= triggerTop &&
      window.scrollY <= block.offsetTop + block.offsetHeight &&
      !block.classList.contains('ss-animated')
    ) {
      block.classList.add('ss-animated');
      animate(block.querySelectorAll<HTMLElement>('[data-animate-el]'), {
        opacity: [0, 1],
        translateY: [100, 0],
        delay: stagger(400, { start: 200 }),
        duration: 800,
        ease: 'inOutCubic',
      });
    }
  });
}
window.addEventListener('scroll', revealBlocks, { passive: true });
window.addEventListener('resize', revealBlocks);
revealBlocks();

const slider = document.querySelector<HTMLElement>('.testimonial-slider');
if (slider)
  new Swiper(slider, {
    modules: [Pagination, Keyboard, A11y],
    slidesPerView: 1,
    keyboard: { enabled: true, onlyInViewport: true },
    a11y: {
      enabled: true,
      containerRoleDescriptionMessage: 'Testimonials carousel',
    },
    pagination: { el: '.swiper-pagination', clickable: true },
    breakpoints: {
      401: { slidesPerView: 1, spaceBetween: 20 },
      801: { slidesPerView: 2, spaceBetween: 32 },
      1201: { slidesPerView: 2, spaceBetween: 80 },
    },
  });

const focusableSelector =
  'a[href],button:not([disabled]),input,select,textarea,[tabindex="0"]';
document
  .querySelectorAll<HTMLAnchorElement>('.folio-list__item-link')
  .forEach((link) => {
    const template = document.querySelector<HTMLElement>(link.hash);
    const content = template?.querySelector<HTMLElement>('.modal-popup');
    if (!content) return;
    const instance = basicLightbox.create(content.outerHTML, {
      onShow: (modal) => {
        const element = modal.element() as HTMLElement;
        element
          .querySelector('.basicLightbox__placeholder')
          ?.removeAttribute('role');
        const title = element.querySelector('h2')!;
        title.id = `${template!.id}-title`;
        element.setAttribute('role', 'dialog');
        element.setAttribute('aria-modal', 'true');
        element.setAttribute('aria-labelledby', title.id);
        const close = document.createElement('button');
        element.querySelector('.portfolio-modal-close')?.remove();
        close.className = 'portfolio-modal-close';
        close.type = 'button';
        close.setAttribute('aria-label', 'Close project');
        close.textContent = '×';
        close.addEventListener('click', () => modal.close());
        element.prepend(close);
        const background = document.querySelector<HTMLElement>('.s-pagewrap');
        if (background) background.inert = true;
        document.body.style.overflow = 'hidden';
        element.onkeydown = (event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            modal.close();
          }
          if (event.key !== 'Tab') return;
          const focusable = [
            ...element.querySelectorAll<HTMLElement>(focusableSelector),
          ];
          const first = focusable[0],
            last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          }
          if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        };
        window.requestAnimationFrame(() => close.focus());
        return true;
      },
      onClose: () => {
        const background = document.querySelector<HTMLElement>('.s-pagewrap');
        if (background) background.inert = false;
        document.body.style.overflow = '';
        link.focus();
        return true;
      },
    });
    link.addEventListener('click', (event) => {
      event.preventDefault();
      instance.show();
    });
  });

const scroll = new MoveTo(
  { tolerance: 0, duration: 1200, easing: 'easeInOutCubic' },
  {
    easeInOutCubic: (time, start, change, duration) => {
      const progress = time / (duration / 2);
      if (progress < 1) return (change / 2) * progress ** 3 + start;
      return (change / 2) * ((progress - 2) ** 3 + 2) + start;
    },
  },
);
document
  .querySelectorAll<HTMLAnchorElement>('.smoothscroll')
  .forEach((link) => {
    const target = document.querySelector<HTMLElement>(link.hash || '#top');
    if (!target) return;
    if (reducedMotion)
      link.addEventListener('click', (event) => {
        event.preventDefault();
        target.scrollIntoView();
      });
    else scroll.registerTrigger(link);
  });
