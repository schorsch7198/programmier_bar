import PageHTML from './shop.html';
import CartAddItem from '@features/cart-add-item/cart-add-item';

export default class pShop {
  #args = null;
  #catId = null;

  constructor(args) {
    this.#args = args;
    args.target.innerHTML = PageHTML;
    this.#catId = args.cat ? Number(args.cat) : null;

    this.#loadCategoryLabel();
    this.#loadProducts();
  }

  // ---------------------------------------------------------
  // private
  // ---------------------------------------------------------
  #loadCategoryLabel() {
    if (!this.#catId) return;
    this.#args.app.apiGet(
      (categories) => {
        const cat = categories.find((c) => c.categoryId === this.#catId);
        if (!cat) return;
        this.#args.target.querySelector('#shopBreadcrumb').classList.remove('d-none');
        this.#args.target.querySelector('#shopBreadcrumbCategory').textContent = cat.name;
        this.#args.target.querySelector('#shopTitle').textContent = cat.name;
      },
      () => {},
      '/category'
    );
  }

  #loadProducts() {
    const url = this.#catId ? `/product?cid=${this.#catId}` : '/product';
    this.#args.app.apiGet(
      (products) => this.#render(products || []),
      (ex) => this.#showError(ex),
      url
    );
  }

  #render(products) {
    const grid = this.#args.target.querySelector('#shopGrid');
    this.#args.target.querySelector('#shopLoading').classList.add('d-none');

    if (products.length === 0) {
      this.#args.target.querySelector('#shopEmpty').classList.remove('d-none');
      return;
    }

    grid.classList.remove('d-none');
    grid.innerHTML = '';

    // Dedupe: GET /product?cid=X returns ProductInfo which can repeat rows when a product has multiple categories
    const seen = new Set();
    const unique = products.filter((p) => {
      if (seen.has(p.productId)) return false;
      seen.add(p.productId);
      return true;
    });

    for (const p of unique) {
      const col = document.createElement('div');
      col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
      col.innerHTML = `
        <div class="card h-100 shadow-sm">
          <a href="#shop-item?id=${encodeURIComponent(p.productUid || '')}"
             class="text-decoration-none text-reset">
            <div class="card-img-top bg-light d-flex align-items-center justify-content-center"
                 style="height: 180px;">
              <i class="bi bi-image fs-1 text-secondary"></i>
            </div>
            <div class="card-body pb-2">
              <h5 class="card-title mb-1">${this.#escape(p.name || '')}</h5>
              <p class="card-text text-muted small mb-0">${this.#escape(p.charcode || '')}</p>
            </div>
          </a>
          <div class="card-footer bg-white border-0 pt-0 pb-3">
            <div class="cart-add-mount"></div>
          </div>
        </div>
      `;
      grid.appendChild(col);

      new CartAddItem({
        target: col.querySelector('.cart-add-mount'),
        app: this.#args.app,
        product: p,
      });
    }
  }

  #escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  #showError(ex) {
    console.error(ex);
    this.#args.target.querySelector('#shopLoading').classList.add('d-none');
    this.#args.target.querySelector('#shopEmpty').textContent = 'Could not load products.';
    this.#args.target.querySelector('#shopEmpty').classList.remove('d-none');
  }
}
