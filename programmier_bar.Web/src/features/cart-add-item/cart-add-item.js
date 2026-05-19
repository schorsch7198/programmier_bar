import HTML from './cart-add-item.html';
import { addToLocalCart } from '@entities/cart/model';

// Reusable "Add to cart" button + quantity input.
// args: { target: HTMLElement, app: Application, product: { productId, ... } }
//
// Fires a window-level 'cart:changed' CustomEvent after a successful add,
// so widgets/nav-bar can refresh its badge.
export default class CartAddItem {
  #args = null;
  #product = null;
  #quantityInput = null;
  #button = null;
  #successMsg = null;

  constructor(args) {
    this.#args = args;
    this.#product = args.product;

    args.target.insertAdjacentHTML('beforeend', HTML);
    this.#quantityInput = args.target.querySelector('#cartAddQuantity');
    this.#button = args.target.querySelector('#cartAddButton');
    this.#successMsg = args.target.querySelector('#cartAddSuccess');

    this.#button.addEventListener('click', () => this.#add());
  }

  #add() {
    if (!this.#product?.productId) {
      console.error('CartAddItem: missing product.productId');
      return;
    }
    const qty = Math.max(1, parseInt(this.#quantityInput.value, 10) || 1);

    if (this.#args.app.user) {
      this.#args.app.apiSet(
        (r) => {
          if (r.success) this.#flashSuccess();
          else console.warn('cart-add-item:', r.message);
        },
        (ex) => console.error(ex),
        '/cart/items', null,
        { productId: this.#product.productId, quantity: qty }
      );
    } else {
      addToLocalCart(this.#product.productId, qty);
      this.#flashSuccess();
    }
  }

  #flashSuccess() {
    this.#successMsg.classList.remove('d-none');
    setTimeout(() => this.#successMsg.classList.add('d-none'), 1500);
    window.dispatchEvent(new CustomEvent('cart:changed'));
  }
}
