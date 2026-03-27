import './style.css';
import { WebDataSetup } from './web-data-setup';
import { WardLookupService } from '@/utils/ward-lookup';
import { initLookupWidget } from './lookup-widget';

// --- Theme toggle ---

type Theme = 'light' | 'dark' | 'auto';
const THEME_STORAGE_KEY = 'vw_website_theme';

const THEME_ICONS: Record<Theme, string> = {
  light: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  dark: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  auto: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>`,
};

const THEME_LABELS: Record<Theme, string> = {
  auto: 'Giao diện: Tự động — nhấn để chuyển sang Sáng',
  light: 'Giao diện: Sáng — nhấn để chuyển sang Tối',
  dark: 'Giao diện: Tối — nhấn để chuyển sang Tự động',
};

const THEME_CYCLE: Record<Theme, Theme> = {
  auto: 'light',
  light: 'dark',
  dark: 'auto',
};

function applyThemeAttr(theme: Theme): void {
  if (theme === 'auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function initThemeToggle(): void {
  const btn = document.getElementById('theme-toggle') as HTMLButtonElement | null;
  if (!btn) return;

  const stored = (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? 'auto';
  let current: Theme = stored;

  applyThemeAttr(current);
  btn.innerHTML = THEME_ICONS[current];
  btn.setAttribute('aria-label', THEME_LABELS[current]);

  btn.addEventListener('click', () => {
    current = THEME_CYCLE[current];
    applyThemeAttr(current);
    btn.innerHTML = THEME_ICONS[current];
    btn.setAttribute('aria-label', THEME_LABELS[current]);
    localStorage.setItem(THEME_STORAGE_KEY, current);
  });
}

initThemeToggle();

async function main(): Promise<void> {
  const loadingEl = document.getElementById('loading-state')!;
  const contentEl = document.getElementById('widget-content')!;

  try {
    const dataSetup = new WebDataSetup();
    await dataSetup.checkAndUpdateData();
    dataSetup.close();

    const lookup = new WardLookupService();
    await lookup.init();

    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';

    await initLookupWidget(lookup);
  } catch (error) {
    loadingEl.innerHTML = `<p style="color: var(--text-secondary);">Lỗi tải dữ liệu. Vui lòng tải lại trang.</p>`;
    console.error('Failed to initialize:', error);
  }
}

main();

function initAnnotationDemo() {
  const tooltip = document.createElement('div');
  tooltip.id = 'vw-tooltip';
  document.body.appendChild(tooltip);

  document.addEventListener('mouseover', (e) => {
    const target = (e.target as Element).closest('.vw-annotation');
    if (!target) return;
    const text = target.getAttribute('data-tooltip');
    if (!text) return;
    tooltip.textContent = text;
    tooltip.style.display = 'block';
    positionTooltip(tooltip, e);
  });

  document.addEventListener('mousemove', (e) => {
    if (tooltip.style.display === 'block') positionTooltip(tooltip, e);
  });

  document.addEventListener('mouseout', (e) => {
    if ((e.target as Element).closest('.vw-annotation')) tooltip.style.display = 'none';
  });
}

function positionTooltip(tooltip: HTMLElement, e: MouseEvent) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = tooltip.getBoundingClientRect();
  const tw = rect.width || 240;
  const th = rect.height || 60;
  let left = e.clientX + 14;
  let top = e.clientY - th - 10;
  if (left + tw > vw - 8) left = e.clientX - tw - 14;
  if (left < 8) left = 8;
  if (top < 8) top = e.clientY + 22;
  if (top + th > vh - 8) top = vh - th - 8;
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

initAnnotationDemo();
