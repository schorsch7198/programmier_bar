import HTML from './search-box.html';

const MAX_HITS_PER_SECTION = 5;
const DEBOUNCE_MS = 200;

export default class SearchBox {
  //#region private vars
  #args = null;
  #input = null;
  #dropdown = null;
  #products = [];
  #categories = [];
  #dataLoaded = false;
  #debounceTimer = null;
  #flatRows = [];
  #highlightIdx = -1;
  #outsideClick = null;
  //#endregion

  //#region constructor
  constructor(args) {
    this.#args = args;
    args.target.innerHTML = HTML;

    this.#input = args.target.querySelector('#searchBoxInput');
    this.#dropdown = args.target.querySelector('#searchBoxDropdown');

    this.#input.addEventListener('input', () => {
      clearTimeout(this.#debounceTimer);
      this.#debounceTimer = setTimeout(() => this.#render(), DEBOUNCE_MS);
    });
    this.#input.addEventListener('focus', () => {
      this.#ensureData();
      if (this.#input.value.trim()) this.#render();
    });
    this.#input.addEventListener('keydown', (e) => this.#onKeyDown(e));

    // Anchors inside the dropdown navigate natively; we just close the menu first.
    this.#dropdown.addEventListener('click', (e) => {
      if (e.target.closest('[data-row]')) this.#hide();
    });

    this.#outsideClick = (e) => {
      if (!args.target.contains(e.target)) this.#hide();
    };
    document.addEventListener('click', this.#outsideClick);
  }
  //#endregion

  //#region public methods
  destroy() {
    if (this.#outsideClick) document.removeEventListener('click', this.#outsideClick);
    clearTimeout(this.#debounceTimer);
  }
  //#endregion

  //#region private methods
  #ensureData() {
    if (this.#dataLoaded) return;
    this.#args.app.apiGet((r) => {
      const seen = new Set();
      this.#products = (r.productList || []).filter(p => {
        if (seen.has(p.productUid)) return false;
        seen.add(p.productUid);
        return true;
      });
      this.#categories = r.categoryList || [];
      this.#dataLoaded = true;
      if (this.#input.value.trim()) this.#render();
    }, () => {}, '/page/productlist');
  }

  #render() {
    const q = this.#input.value.trim().toLowerCase();
    if (!q) {
      this.#hide();
      return;
    }
    if (!this.#dataLoaded) {
      this.#dropdown.innerHTML = '<div class="p-3 text-muted small">Loading…</div>';
      this.#show();
      return;
    }

    const productHits = this.#products
      .filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.charcode || '').toLowerCase().includes(q)
      )
      .slice(0, MAX_HITS_PER_SECTION);

    const categoryHits = this.#categories
      .filter(c => (c.name || '').toLowerCase().includes(q))
      .slice(0, MAX_HITS_PER_SECTION);

    let html = '';
    if (productHits.length === 0 && categoryHits.length === 0) {
      html = `<div class="p-3 text-muted">No matches for "${this.#escape(q)}"</div>`;
    } else {
      if (productHits.length > 0) {
        html += this.#sectionHeader('Products', productHits.length);
        for (const p of productHits) {
          html += `
            <a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
               href="#shop-item?id=${encodeURIComponent(p.productUid || '')}"
               data-row>
              <span class="text-truncate">${this.#escape(p.name || '')}</span>
              <small class="text-muted ms-2">${this.#escape(p.charcode || '')}</small>
            </a>
          `;
        }
      }
      if (categoryHits.length > 0) {
        html += this.#sectionHeader('Categories', categoryHits.length);
        for (const c of categoryHits) {
          html += `
            <a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
               href="#shop?cat=${encodeURIComponent(c.categoryId)}"
               data-row>
              <span class="text-truncate">${this.#escape(c.name || '')}</span>
              <i class="bi-folder text-muted ms-2"></i>
            </a>
          `;
        }
      }
      html = `<div class="list-group list-group-flush">${html}</div>`;
    }

    this.#dropdown.innerHTML = html;
    this.#highlightIdx = -1;
    this.#flatRows = Array.from(this.#dropdown.querySelectorAll('[data-row]'));
    this.#show();
  }

  #sectionHeader(label, count) {
    return `
      <div class="list-group-item bg-body-tertiary small text-uppercase fw-semibold d-flex justify-content-between">
        <span>${label}</span><span class="text-muted">${count}</span>
      </div>
    `;
  }

  #show() {
    this.#dropdown.classList.remove('d-none');
  }

  #hide() {
    this.#dropdown.classList.add('d-none');
    this.#highlightIdx = -1;
  }

  #onKeyDown(e) {
    if (e.key === 'Escape') {
      this.#hide();
      this.#input.blur();
      return;
    }
    if (this.#flatRows.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.#highlightIdx = Math.min(this.#highlightIdx + 1, this.#flatRows.length - 1);
      this.#updateHighlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.#highlightIdx = Math.max(this.#highlightIdx - 1, 0);
      this.#updateHighlight();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = this.#highlightIdx >= 0 ? this.#highlightIdx : 0;
      this.#flatRows[idx].click();
    }
  }

  #updateHighlight() {
    for (let i = 0; i < this.#flatRows.length; i++) {
      this.#flatRows[i].classList.toggle('active', i === this.#highlightIdx);
    }
    if (this.#highlightIdx >= 0) {
      this.#flatRows[this.#highlightIdx].scrollIntoView({ block: 'nearest' });
    }
  }

  #escape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  //#endregion
}