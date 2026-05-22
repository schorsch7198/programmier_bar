import PageHTML from './shop-item.html';
import CartAddItem from '@features/cart-add-item/cart-add-item';

export default class pShopItem {
  #args = null;

  constructor(args) {
    this.#args = args;
    args.target.innerHTML = PageHTML;

    if (!args.id) {
      this.#showNotFound();
      return;
    }

    this.#args.app.apiGet(
      (product) => this.#render(product),
      () => this.#showNotFound(),
      '/product/' + encodeURIComponent(args.id)
    );
  }

  // ---------------------------------------------------------
  // private
  // ---------------------------------------------------------
  #render(product) {
    if (!product) { this.#showNotFound(); return; }

    const target = this.#args.target;
    target.querySelector('#shopItemLoading').classList.add('d-none');
    target.querySelector('#shopItemContent').classList.remove('d-none');

    target.querySelector('#shopItemBreadcrumbName').textContent = product.name || '';
    target.querySelector('#shopItemTitle').textContent = product.name || '';
    target.querySelector('#shopItemCharcode').textContent = product.charcode || '';

    // Primary image from filedataList if present
    if (product.filedataList && product.filedataList.length > 0) {
      const fd = product.filedataList[0];
      const url = `${this.#args.app.apiUrl}/filedata/${fd.filedataId}/download`;
      target.querySelector('#shopItemImage').innerHTML =
        `<img src="${url}" alt="${this.#escape(product.name || '')}"
              class="img-fluid rounded" style="max-height: 100%; max-width: 100%; object-fit: contain;">`;
    }

    // Category badges — resolve names from /category (Product only returns categoryIds)
    if (product.productCategoryList && product.productCategoryList.length > 0) {
      this.#args.app.apiGet(
        (categories) => {
          const names = product.productCategoryList
            .map((pc) => categories.find((c) => c.categoryId === pc.categoryId)?.name)
            .filter(Boolean);
          target.querySelector('#shopItemCategories').innerHTML = names
            .map((n) => `<span class="badge bg-secondary me-1">${this.#escape(n)}</span>`)
            .join('');
        },
        () => {},
        '/category'
      );
    }

    // Add-to-cart
    new CartAddItem({
      target: target.querySelector('#shopItemCartTarget'),
      app: this.#args.app,
      product: product,
    });
  }

  #escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  #showNotFound() {
    this.#args.target.querySelector('#shopItemLoading').classList.add('d-none');
    this.#args.target.querySelector('#shopItemNotFound').classList.remove('d-none');
  }
}