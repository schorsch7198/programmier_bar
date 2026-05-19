import PageHTML from './cart.html';
import {
  totalItemCount,
  readLocalCart,
  removeFromLocalCart,
  updateLocalCartQuantity,
} from '@entities/cart/model';

export default class pCart {
  #args = null;
  #productsById = new Map();
  #cart = null;
  #isLocal = false;

  constructor(args) {
    this.#args = args;
    args.target.innerHTML = PageHTML;
    this.#isLocal = !args.app.user;

    this.#loadData();

    args.target.querySelector('#buttonCheckout').addEventListener('click', () => this.#checkout());
  }

  // ---------------------------------------------------------
  // private
  // ---------------------------------------------------------
  #loadData() {
    // Both flows need the product list for name lookup
    this.#args.app.apiGet((products) => {
      for (const p of products) this.#productsById.set(p.productId, p);

      if (this.#isLocal) {
        const items = readLocalCart();
        if (items.length === 0) { this.#showEmpty(); return; }
        // Synthesize cart-item-like rows so the renderer treats them uniformly
        this.#cart = {
          itemList: items.map((it) => ({
            cartItemId: null,
            productId: it.productId,
            quantity: it.quantity,
          })),
        };
        this.#render();
      } else {
        this.#args.app.apiGet((cart) => {
          this.#cart = cart;
          this.#render();
        }, (ex) => this.#showError(ex), '/cart');
      }
    }, (ex) => this.#showError(ex), '/product');
  }

  #render() {
    const items = this.#cart?.itemList || [];
    const tbody = this.#args.target.querySelector('#cartTableBody');
    const loading = this.#args.target.querySelector('#cartLoading');

    loading.classList.add('d-none');

    if (items.length === 0) {
      this.#showEmpty();
      return;
    }

    this.#args.target.querySelector('#cartContent').classList.remove('d-none');
    tbody.innerHTML = '';

    for (const item of items) {
      const product = this.#productsById.get(item.productId);
      const name = product ? `${product.name} (${product.charcode})` : `Product #${item.productId}`;
      const tr = document.createElement('tr');
      if (item.cartItemId != null) tr.dataset.itemId = item.cartItemId;
      tr.dataset.productId = item.productId;
      tr.innerHTML = `
        <td>${name}</td>
        <td>
          <input type="number" class="form-control form-control-sm cart-qty"
                 min="1" value="${item.quantity}" />
        </td>
        <td class="text-end">
          <button type="button" class="btn btn-sm btn-outline-danger cart-remove"
                  aria-label="Remove">&times;</button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    this.#args.target.querySelector('#cartTotalCount').textContent = totalItemCount(items);

    // Anonymous: swap the checkout button for a "Sign in to checkout" CTA
    const checkoutBtn = this.#args.target.querySelector('#buttonCheckout');
    if (this.#isLocal) {
      checkoutBtn.textContent = 'Sign in to checkout';
      checkoutBtn.classList.remove('btn-primary');
      checkoutBtn.classList.add('btn-outline-primary');
    }

    // Wire row-level events (delegation would also work; explicit per-row is fine for small carts)
    tbody.querySelectorAll('.cart-qty').forEach((input) => {
      input.addEventListener('change', (e) => this.#onQuantityChange(e));
    });
    tbody.querySelectorAll('.cart-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => this.#onRemove(e));
    });
  }

  #onQuantityChange(e) {
    const tr = e.target.closest('tr');
    const newQty = Math.max(1, parseInt(e.target.value, 10) || 1);
    e.target.value = newQty;

    const updateTotal = () => {
      const inputs = this.#args.target.querySelectorAll('.cart-qty');
      let total = 0;
      inputs.forEach((i) => { total += parseInt(i.value, 10) || 0; });
      this.#args.target.querySelector('#cartTotalCount').textContent = total;
      window.dispatchEvent(new CustomEvent('cart:changed'));
    };

    if (this.#isLocal) {
      updateLocalCartQuantity(Number(tr.dataset.productId), newQty);
      updateTotal();
    } else {
      const itemId = Number(tr.dataset.itemId);
      this.#args.app.apiSet(
        updateTotal,
        (ex) => this.#showError(ex),
        '/cart/items', itemId, { quantity: newQty }
      );
    }
  }

  #onRemove(e) {
    const tr = e.target.closest('tr');

    const afterRemove = () => {
      tr.remove();
      const remaining = this.#args.target.querySelectorAll('#cartTableBody tr');
      if (remaining.length === 0) {
        this.#showEmpty();
      } else {
        let total = 0;
        remaining.forEach((row) => {
          total += parseInt(row.querySelector('.cart-qty').value, 10) || 0;
        });
        this.#args.target.querySelector('#cartTotalCount').textContent = total;
      }
      window.dispatchEvent(new CustomEvent('cart:changed'));
    };

    if (this.#isLocal) {
      removeFromLocalCart(Number(tr.dataset.productId));
      afterRemove();
    } else {
      const itemId = Number(tr.dataset.itemId);
      this.#args.app.apiDelete(
        afterRemove,
        (ex) => this.#showError(ex),
        '/cart/items/' + itemId
      );
    }
  }

  #checkout() {
    if (this.#isLocal) {
      // Anonymous: navigate to login; localStorage items will be merged on successful auth
      window.open('#login', '_self');
      return;
    }
    this.#args.app.apiSet(
      (r) => {
        if (r.success) {
          this.#showAlert('success', r.message || 'Checkout complete.');
          // Reload to reflect emptied cart
          setTimeout(() => this.#loadData(), 600);
          window.dispatchEvent(new CustomEvent('cart:changed'));
        } else {
          this.#showAlert('warning', r.message || 'Checkout failed.');
        }
      },
      (ex) => this.#showError(ex),
      '/cart/checkout', null, {}
    );
  }

  // ---------------------------------------------------------
  // ui helpers
  // ---------------------------------------------------------
  #showEmpty() {
    this.#args.target.querySelector('#cartLoading').classList.add('d-none');
    this.#args.target.querySelector('#cartContent').classList.add('d-none');
    this.#args.target.querySelector('#cartEmpty').classList.remove('d-none');
  }

  #showError(ex) {
    console.error(ex);
    this.#showAlert('danger', String(ex));
  }

  #showAlert(kind, message) {
    const el = this.#args.target.querySelector('#cartAlert');
    el.className = 'alert mt-3 alert-' + kind;
    el.textContent = message;
    el.classList.remove('d-none');
  }
}
