import './style.css';
import 'choices.js/public/assets/styles/choices.min.css';
import Choices from 'choices.js';
import { WardLookupService } from '@/utils/ward-lookup';
import { getSettings, setSetting } from '@/utils/settings';
import type { OldWard, NewWard } from '@/utils/indexeddb';

const lookup = new WardLookupService();

// --- Tab switching ---

const tabs = document.querySelectorAll<HTMLButtonElement>('.tab');
const tabContents = document.querySelectorAll<HTMLDivElement>('.tab-content');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tabContents.forEach((tc) => tc.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab!;
    document.getElementById(`tab-${target}`)!.classList.add('active');
  });
});

// --- Helpers ---

function formatOldAddress(ward: OldWard): string {
  return `${ward.ward_name}, ${ward.district_name}, ${ward.province_name}`;
}

function formatNewAddress(ward: NewWard): string {
  return `${ward.ward_name}, ${ward.province_name}`;
}

function copyToClipboard(text: string, btn: HTMLButtonElement): void {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Đã sao chép!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, 1500);
  });
}

function renderResultCard(
  label: string,
  address: string,
  wardCode: string
): string {
  return `
    <div class="result-card">
      <div class="result-label">${label}</div>
      <div class="result-address">${address}</div>
      <div class="result-code">Mã: ${wardCode}</div>
      <button class="copy-btn" data-copy="${address.replace(/"/g, '&quot;')}">Sao chép</button>
    </div>
  `;
}

function attachCopyHandlers(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      copyToClipboard(btn.dataset.copy!, btn);
    });
  });
}

function setChoicesOptions(
  instance: Choices,
  options: { value: string; label: string }[],
  placeholder: string
): void {
  instance.clearStore();
  instance.setChoices(
    [{ value: '', label: placeholder, placeholder: true }, ...options],
    'value',
    'label',
    true
  );
}

// --- Help popovers ---

const HELP_CONTENT: Record<string, string> = {
  new: `<p>Nhập <strong>tên phường/xã</strong>, có thể thêm dấu phẩy rồi <strong>tên tỉnh/thành</strong>.</p>
<p>Có thể bỏ dấu tiếng Việt và bỏ tiền tố (Phường, Xã, Tỉnh, Thành phố).</p>
<p>VD: <code>An Hoi Tay, Ho Chi Minh</code></p>`,
  old: `<p>Nhập <strong>tên phường/xã</strong>, có thể thêm <strong>quận/huyện</strong> và <strong>tỉnh/thành</strong>, cách nhau bằng dấu phẩy, đúng thứ tự.</p>
<p>Có thể bỏ dấu tiếng Việt và bỏ tiền tố (Phường, Xã, Quận, Huyện, Tỉnh, Thành phố).</p>
<p>VD: <code>Phuong 12, Go Vap, Ho Chi Minh</code></p>`,
};

function initHelpPopovers(): void {
  document.querySelectorAll<HTMLButtonElement>('.help-btn').forEach((btn) => {
    const key = btn.dataset.help!;
    const popover = document.createElement('div');
    popover.className = 'help-popover';
    popover.innerHTML = HELP_CONTENT[key];
    btn.parentElement!.appendChild(popover);

    // Append to the .quick-search-group so it's not inside the <label>
    const group = btn.closest('.quick-search-group')!;
    group.style.position = 'relative';
    group.appendChild(popover);

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Close other popovers
      document.querySelectorAll('.help-popover.open').forEach((p) => {
        if (p !== popover) p.classList.remove('open');
      });
      popover.classList.toggle('open');
    });

    popover.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.help-popover.open').forEach((p) => p.classList.remove('open'));
  });
}

// --- New to Old tab ---

async function initNewToOld(): Promise<void> {
  const provinceEl = document.getElementById('new-province') as HTMLSelectElement;
  const wardEl = document.getElementById('new-ward') as HTMLSelectElement;
  const resultEl = document.getElementById('new-to-old-result')!;
  const searchInput = document.getElementById('quick-search') as HTMLInputElement;
  const searchDropdown = document.getElementById('quick-search-results')!;

  const provinceChoices = new Choices(provinceEl, {
    searchEnabled: true,
    searchPlaceholderValue: 'Tìm tỉnh/thành...',
    itemSelectText: '',
    shouldSort: false,
    placeholderValue: '-- Chọn tỉnh/thành --',
  });

  const wardChoices = new Choices(wardEl, {
    searchEnabled: true,
    searchPlaceholderValue: 'Tìm phường/xã...',
    itemSelectText: '',
    shouldSort: false,
    placeholderValue: '-- Chọn phường/xã --',
  });

  wardChoices.disable();

  // Load provinces
  const provinces = await lookup.getAllNewProvinces();
  setChoicesOptions(
    provinceChoices,
    provinces.map((p) => ({ value: p.name, label: p.name })),
    '-- Chọn tỉnh/thành --'
  );

  // --- Quick search ---

  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  let activeIndex = -1;

  function closeDropdown(): void {
    searchDropdown.classList.remove('open');
    searchDropdown.innerHTML = '';
    activeIndex = -1;
  }

  function highlightItem(index: number): void {
    const items = searchDropdown.querySelectorAll<HTMLDivElement>('.quick-search-item');
    items.forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });
    activeIndex = index;
    items[index]?.scrollIntoView({ block: 'nearest' });
  }

  async function selectCandidate(wardCode: string, provinceName: string): Promise<void> {
    closeDropdown();
    searchInput.value = '';

    // Set province
    provinceChoices.setChoiceByValue(provinceName);
    // Trigger province change to load wards
    const wards = await lookup.findNewWardsByProvince(provinceName);
    wards.sort((a, b) => a.ward_name.localeCompare(b.ward_name, 'vi'));
    setChoicesOptions(
      wardChoices,
      wards.map((w) => ({ value: w.ward_code, label: w.ward_name })),
      '-- Chọn phường/xã --'
    );
    wardChoices.enable();

    // Set ward
    wardChoices.setChoiceByValue(wardCode);
    // Trigger ward change to show results
    wardEl.dispatchEvent(new Event('change'));
  }

  searchInput.addEventListener('input', () => {
    if (searchTimeout) clearTimeout(searchTimeout);

    const raw = searchInput.value.trim();
    if (!raw) {
      closeDropdown();
      return;
    }

    searchTimeout = setTimeout(async () => {
      const parts = raw.split(',').map((s) => s.trim());
      const wardQuery = parts[0];
      const provinceQuery = parts[1] || undefined;

      if (!wardQuery) {
        closeDropdown();
        return;
      }

      const results = await lookup.searchNewWards(wardQuery, provinceQuery);
      results.sort((a, b) => {
        const cmp = a.ward_name.localeCompare(b.ward_name, 'vi');
        if (cmp !== 0) return cmp;
        return a.province_name.localeCompare(b.province_name, 'vi');
      });

      // Limit displayed results
      const shown = results.slice(0, 50);

      if (shown.length === 0) {
        searchDropdown.innerHTML =
          '<div class="quick-search-no-result">Không tìm thấy kết quả</div>';
        searchDropdown.classList.add('open');
        activeIndex = -1;
        return;
      }

      searchDropdown.innerHTML = shown
        .map(
          (w) =>
            `<div class="quick-search-item" data-ward-code="${w.ward_code}" data-province="${w.province_name.replace(/"/g, '&quot;')}">
              <span class="qs-ward">${w.ward_name}</span>
              <span class="qs-province"> &mdash; ${w.province_name}</span>
            </div>`
        )
        .join('');

      searchDropdown.classList.add('open');
      activeIndex = -1;

      // Attach click handlers
      searchDropdown.querySelectorAll<HTMLDivElement>('.quick-search-item').forEach((el) => {
        el.addEventListener('click', () => {
          selectCandidate(el.dataset.wardCode!, el.dataset.province!);
        });
      });
    }, 200);
  });

  searchInput.addEventListener('keydown', (e) => {
    const items = searchDropdown.querySelectorAll<HTMLDivElement>('.quick-search-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightItem(Math.min(activeIndex + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightItem(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const el = items[activeIndex];
      selectCandidate(el.dataset.wardCode!, el.dataset.province!);
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target as Node) && !searchDropdown.contains(e.target as Node)) {
      closeDropdown();
    }
  });

  // Province change -> load wards
  provinceEl.addEventListener('change', async () => {
    const provinceName = provinceChoices.getValue(true) as string;
    resultEl.innerHTML = '';

    if (!provinceName) {
      wardChoices.disable();
      setChoicesOptions(wardChoices, [], '-- Chọn phường/xã --');
      return;
    }

    const wards = await lookup.findNewWardsByProvince(provinceName);
    wards.sort((a, b) => a.ward_name.localeCompare(b.ward_name, 'vi'));
    setChoicesOptions(
      wardChoices,
      wards.map((w) => ({ value: w.ward_code, label: w.ward_name })),
      '-- Chọn phường/xã --'
    );
    wardChoices.enable();
  });

  // Ward change -> show result
  wardEl.addEventListener('change', async () => {
    const wardCode = wardChoices.getValue(true) as string;
    resultEl.innerHTML = '';

    if (!wardCode) return;

    const newWard = await lookup.findNewWard(wardCode);
    if (!newWard) return;

    const oldWards = await lookup.getOldWardsFromNew(wardCode);

    let html = renderResultCard(
      'Địa chỉ mới',
      formatNewAddress(newWard),
      newWard.ward_code
    );

    html += '<div class="result-arrow">&darr;</div>';

    if (oldWards.length > 0) {
      html += `<div class="result-group-title">Địa chỉ cũ tương ứng (${oldWards.length})</div>`;
      for (const ow of oldWards) {
        html += renderResultCard(
          'Địa chỉ cũ',
          formatOldAddress(ow),
          ow.ward_code
        );
      }
    } else {
      html += '<div class="no-result">Không tìm thấy địa chỉ cũ tương ứng.</div>';
    }

    resultEl.innerHTML = html;
    attachCopyHandlers(resultEl);
  });
}

// --- Old to New tab ---

async function initOldToNew(): Promise<void> {
  const provinceEl = document.getElementById('old-province') as HTMLSelectElement;
  const districtEl = document.getElementById('old-district') as HTMLSelectElement;
  const wardEl = document.getElementById('old-ward') as HTMLSelectElement;
  const resultEl = document.getElementById('old-to-new-result')!;
  const searchInput = document.getElementById('old-quick-search') as HTMLInputElement;
  const searchDropdown = document.getElementById('old-quick-search-results')!;

  const provinceChoices = new Choices(provinceEl, {
    searchEnabled: true,
    searchPlaceholderValue: 'Tìm tỉnh/thành...',
    itemSelectText: '',
    shouldSort: false,
    placeholderValue: '-- Chọn tỉnh/thành --',
  });

  const districtChoices = new Choices(districtEl, {
    searchEnabled: true,
    searchPlaceholderValue: 'Tìm quận/huyện...',
    itemSelectText: '',
    shouldSort: false,
    placeholderValue: '-- Chọn quận/huyện --',
  });

  const wardChoices = new Choices(wardEl, {
    searchEnabled: true,
    searchPlaceholderValue: 'Tìm phường/xã...',
    itemSelectText: '',
    shouldSort: false,
    placeholderValue: '-- Chọn phường/xã --',
  });

  districtChoices.disable();
  wardChoices.disable();

  // Load provinces
  const provinces = await lookup.getAllOldProvinces();
  setChoicesOptions(
    provinceChoices,
    provinces.map((p) => ({ value: p.name, label: p.name })),
    '-- Chọn tỉnh/thành --'
  );

  // --- Quick search ---

  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  let activeIndex = -1;

  function closeDropdown(): void {
    searchDropdown.classList.remove('open');
    searchDropdown.innerHTML = '';
    activeIndex = -1;
  }

  function highlightItem(index: number): void {
    const items = searchDropdown.querySelectorAll<HTMLDivElement>('.quick-search-item');
    items.forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });
    activeIndex = index;
    items[index]?.scrollIntoView({ block: 'nearest' });
  }

  async function selectCandidate(
    wardCode: string,
    provinceName: string,
    districtName: string
  ): Promise<void> {
    closeDropdown();
    searchInput.value = '';

    // Set province
    provinceChoices.setChoiceByValue(provinceName);

    // Load districts for province
    const districts = await lookup.getDistrictsByProvince(provinceName);
    setChoicesOptions(
      districtChoices,
      districts.map((d) => ({ value: d, label: d })),
      '-- Chọn quận/huyện --'
    );
    districtChoices.enable();

    // Set district
    districtChoices.setChoiceByValue(districtName);

    // Load wards for district+province
    const wards = await lookup.getOldWardsByDistrictAndProvince(districtName, provinceName);
    setChoicesOptions(
      wardChoices,
      wards.map((w) => ({ value: w.ward_code, label: w.ward_name })),
      '-- Chọn phường/xã --'
    );
    wardChoices.enable();

    // Set ward and trigger result display
    wardChoices.setChoiceByValue(wardCode);
    wardEl.dispatchEvent(new Event('change'));
  }

  searchInput.addEventListener('input', () => {
    if (searchTimeout) clearTimeout(searchTimeout);

    const raw = searchInput.value.trim();
    if (!raw) {
      closeDropdown();
      return;
    }

    searchTimeout = setTimeout(async () => {
      const parts = raw.split(',').map((s) => s.trim());
      const wardQuery = parts[0];
      const districtQuery = parts[1] || undefined;
      const provinceQuery = parts[2] || undefined;

      if (!wardQuery) {
        closeDropdown();
        return;
      }

      const results = await lookup.searchOldWards(wardQuery, districtQuery, provinceQuery);
      results.sort((a, b) => {
        const cmp = a.ward_name.localeCompare(b.ward_name, 'vi');
        if (cmp !== 0) return cmp;
        const cmp2 = a.district_name.localeCompare(b.district_name, 'vi');
        if (cmp2 !== 0) return cmp2;
        return a.province_name.localeCompare(b.province_name, 'vi');
      });

      const shown = results.slice(0, 50);

      if (shown.length === 0) {
        searchDropdown.innerHTML =
          '<div class="quick-search-no-result">Không tìm thấy kết quả</div>';
        searchDropdown.classList.add('open');
        activeIndex = -1;
        return;
      }

      searchDropdown.innerHTML = shown
        .map(
          (w) =>
            `<div class="quick-search-item" data-ward-code="${w.ward_code}" data-province="${w.province_name.replace(/"/g, '&quot;')}" data-district="${w.district_name.replace(/"/g, '&quot;')}">
              <span class="qs-ward">${w.ward_name}</span>
              <span class="qs-province"> &mdash; ${w.district_name}, ${w.province_name}</span>
            </div>`
        )
        .join('');

      searchDropdown.classList.add('open');
      activeIndex = -1;

      searchDropdown.querySelectorAll<HTMLDivElement>('.quick-search-item').forEach((el) => {
        el.addEventListener('click', () => {
          selectCandidate(el.dataset.wardCode!, el.dataset.province!, el.dataset.district!);
        });
      });
    }, 200);
  });

  searchInput.addEventListener('keydown', (e) => {
    const items = searchDropdown.querySelectorAll<HTMLDivElement>('.quick-search-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightItem(Math.min(activeIndex + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightItem(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const el = items[activeIndex];
      selectCandidate(el.dataset.wardCode!, el.dataset.province!, el.dataset.district!);
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target as Node) && !searchDropdown.contains(e.target as Node)) {
      closeDropdown();
    }
  });

  // Province change -> load districts
  provinceEl.addEventListener('change', async () => {
    const provinceName = provinceChoices.getValue(true) as string;
    resultEl.innerHTML = '';

    if (!provinceName) {
      districtChoices.disable();
      wardChoices.disable();
      setChoicesOptions(districtChoices, [], '-- Chọn quận/huyện --');
      setChoicesOptions(wardChoices, [], '-- Chọn phường/xã --');
      return;
    }

    const districts = await lookup.getDistrictsByProvince(provinceName);
    setChoicesOptions(
      districtChoices,
      districts.map((d) => ({ value: d, label: d })),
      '-- Chọn quận/huyện --'
    );
    districtChoices.enable();

    setChoicesOptions(wardChoices, [], '-- Chọn phường/xã --');
    wardChoices.disable();
  });

  // District change -> load wards
  districtEl.addEventListener('change', async () => {
    const provinceName = provinceChoices.getValue(true) as string;
    const districtName = districtChoices.getValue(true) as string;
    resultEl.innerHTML = '';

    if (!districtName) {
      wardChoices.disable();
      setChoicesOptions(wardChoices, [], '-- Chọn phường/xã --');
      return;
    }

    const wards = await lookup.getOldWardsByDistrictAndProvince(
      districtName,
      provinceName
    );
    setChoicesOptions(
      wardChoices,
      wards.map((w) => ({ value: w.ward_code, label: w.ward_name })),
      '-- Chọn phường/xã --'
    );
    wardChoices.enable();
  });

  // Ward change -> show result
  wardEl.addEventListener('change', async () => {
    const wardCode = wardChoices.getValue(true) as string;
    resultEl.innerHTML = '';

    if (!wardCode) return;

    const oldWard = await lookup.findOldWard(wardCode);
    if (!oldWard) return;

    const newWards = await lookup.getNewWardsFromOld(wardCode);

    let html = renderResultCard(
      'Địa chỉ cũ',
      formatOldAddress(oldWard),
      oldWard.ward_code
    );

    html += '<div class="result-arrow">&darr;</div>';

    if (newWards.length > 0) {
      for (const nw of newWards) {
        html += renderResultCard(
          'Địa chỉ mới',
          formatNewAddress(nw),
          nw.ward_code
        );
      }
    } else {
      html += '<div class="no-result">Không tìm thấy địa chỉ mới tương ứng.</div>';
    }

    resultEl.innerHTML = html;
    attachCopyHandlers(resultEl);
  });
}

// --- Init ---

async function initSettings(): Promise<void> {
  const enableAnnotationCheckbox = document.getElementById('setting-enable-annotation') as HTMLInputElement;
  const settings = await getSettings();

  enableAnnotationCheckbox.checked = settings.enableAnnotation;

  enableAnnotationCheckbox.addEventListener('change', async () => {
    const newValue = enableAnnotationCheckbox.checked;
    await setSetting('enableAnnotation', newValue);

    // Notify all content scripts about the setting change
    const tabs = await browser.tabs.query({});
    const newSettings = { enableAnnotation: newValue };

    for (const tab of tabs) {
      if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:')) {
        browser.tabs.sendMessage(tab.id, { type: 'SETTINGS_CHANGED', settings: newSettings }).catch(() => {});
      }
    }
  });
}

async function main(): Promise<void> {
  await lookup.init();
  initHelpPopovers();
  await Promise.all([initNewToOld(), initOldToNew(), initSettings()]);
}

main();
