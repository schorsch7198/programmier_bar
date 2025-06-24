import bootstrap from './../../../node_modules/bootstrap/dist/js/bootstrap.bundle';
// import 'bootstrap/dist/js/bootstrap.bundle';
import ComponentHTML from './d-stock.html';

export default class dStock {
  //==========================================================================================================
  // private vars
  #args = null;
  #modal = null;
  #stock = null;
  #product = null;
  #modus = null;
  #numberAmount = null;
  #textNote = null;

  //==========================================================================================================
  constructor(args) {
    this.#args = args;
    args.target.insertAdjacentHTML('beforeend', ComponentHTML);

    const modalStock = args.target.querySelector('#modalStock');
    this.#modal = new bootstrap.Modal(modalStock);

    this.#numberAmount = this.#args.target.querySelector('#numberAmountModalStock');
    this.#textNote = this.#args.target.querySelector('#textNoteModalStock');
    const buttonSave = this.#args.target.querySelector('#buttonSaveModalStock');

    //   // if (numberAmount.value) {
    //   //   this.#stock.amount = (this.#modus == 'p') 
    //   //     ? parseInt(numberAmount.value) 
    //   //     : -1 * parseInt(numberAmount.value);
    //   // } else {
    //   //   this.#stock.amount = 0;
    //   // }   
    //   // this.#stock.note = textNote.value ? textNote.value : null;

    //   const rawAmount = parseInt(this.#numberAmount.value);
    //   if (isNaN(rawAmount)) {
    //     this.#stock.amount = 0;
    //   } else {
    //     this.#stock.amount = (this.#modus === 'p')
    //       ? Math.abs(rawAmount)
    //       : -1 * Math.abs(rawAmount);
    //   }

    //   this.#stock.note = this.#textNote.value || null;

    //     // Set timestamp if missing
    //   if (!this.#stock.dateTime) {
    //     this.#stock.dateTime = new Date().toISOString();
    //   }
    //   // Add to product in memory only (do not persist to server)
    //   if (args.addStockToProduct && typeof args.addStockToProduct === 'function') {
    //     const stockClone = JSON.parse(JSON.stringify(this.#stock));
    //     args.addStockToProduct(stockClone);
    //     this.#stock = null;
    //   }

    //   if (Array.isArray(this.#product.stockList)) {
    //     for (const entry of this.#product.stockList) {
    //       delete entry.personNameFull;
    //     }
    //   }

    // args.app.apiSet(() => {
    //   // if (r.success) {
    //   //   if (args.saveClick && typeof args.saveClick === 'function') args.saveClick();
    //   //   // buttonSave.blur();
    //   //   setTimeout(() => this.#modal.hide(), 50);
    //   // }
    //   if (!this.#stock.dateTime) {
    //   this.#stock.dateTime = new Date().toISOString();  // mimic backend-generated timestamp
    //   }
    //   if (args.addStockToProduct && typeof args.addStockToProduct === 'function') {
    //       args.addStockToProduct(this.#stock);
    //     }
    //     this.#modal.hide();
    // }, (ex) => {
    //   alert(ex);
    // }, '/stock', this.#stock.stockId, this.#stock);
    // this.#modal.hide();
    buttonSave.addEventListener('click', () => {
      // debugger;
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
  //==========================================================================================================
  show(args) {
    if (args) {
      if (args.product) this.#product = args.product;
      if (args.modus) this.#modus = args.modus;
    }
    this.#numberAmount.value = '';
    this.#textNote.value = '';
    this.#modal.show();
  }
} // class