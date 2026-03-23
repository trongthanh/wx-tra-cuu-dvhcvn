import './style.css';
import { WebDataSetup } from './web-data-setup';
import { WardLookupService } from '@/utils/ward-lookup';
import { initLookupWidget } from './lookup-widget';

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
