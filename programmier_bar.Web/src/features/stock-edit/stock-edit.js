import bootstrap from 'bootstrap/dist/js/bootstrap.bundle';
import ComponentHTML from './stock-edit.html';

export default class dStock {
  //#region private vars
  #args = null;
  #modal = null;
  #stock = null;
  #product = null;
  #modus = null;
  #numberAmount = null;
  #textNote = null;
  //#endregion

  //#region constructor
  constructor(args) {
    this.#args = args;
    args.target.insertAdjacentHTML('beforeend', ComponentHTML);

    const modalStock = args.target.querySelector('#modalStock');
    this.#modal = new bootstrap.Modal(modalStock);

    this.#numberAmount = this.#args.target.querySelector('#numberAmountModalStock');
    this.#textNote = this.#args.target.querySelector('#textNoteModalStock');
    const buttonSave = this.#args.target.querySelector('#buttonSaveModalStock');

    buttonSave.addEventListener('click', () => {
      this.#stock = {
        stockId: null,
        productId: this.#product.productId
      };

      const rawAmount = parseInt(this.#numberAmount.value);
      this.#stock.amount = isNaN(rawAmount) ? 0 : (this.#modus === 'p' ? Math.abs(rawAmount) : -1 * Math.abs(rawAmount));
      this.#stock.note = this.#textNote.value || null;

      if (!this.#stock.dateTime) {
        this.#stock.dateTime = new Date().toISOString();
      }
      if (args.addStockToProduct && typeof args.addStockToProduct === 'function') {
        const stockClone = JSON.parse(JSON.stringify(this.#stock));
        args.addStockToProduct(stockClone);
        this.#stock = null;
      }
      document.activeElement?.blur();
      setTimeout(() => this.#modal.hide(), 50);
    });
  }
  //#endregion

  //#region public methods
  show(args) {
    if (args) {
      if (args.product) this.#product = args.product;
      if (args.modus) this.#modus = args.modus;
    }
    this.#numberAmount.value = '';
    this.#textNote.value = '';
    this.#modal.show();
  }
  //#endregion
}