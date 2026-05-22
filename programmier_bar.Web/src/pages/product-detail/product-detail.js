import bootstrap from 'bootstrap/dist/js/bootstrap.bundle';
import dStock from '@features/stock-edit/stock-edit';
import PageHTML from './product-detail.html';
import categoryTree from '@widgets/category-tree/category-tree';
import CartAddItem from '@features/cart-add-item/cart-add-item';

export default class pProductDetail {
  //#region private vars
  #args = null;
  #categoryTree = null;
  #product = null;
  //#endregion

  //#region constructor
  constructor(args) {
    this.#args = args;
    args.target.innerHTML = PageHTML;

    const textCharcode     = args.target.querySelector('#textCharcode');
    const textName         = args.target.querySelector('#textName');
    const buttonSave       = args.target.querySelector('#buttonSave');
    const alertMessage     = args.target.querySelector('#alertMessage');
    const accordionItem2   = args.target.querySelector('#accordionItem2');
    const accordionItem3   = args.target.querySelector('#accordionItem3');
    // Stock
    const collapseTwo      = args.target.querySelector('#collapseTwo');
    const buttonStockPlus  = args.target.querySelector('#buttonStockPlus');
    const buttonStockMinus = args.target.querySelector('#buttonStockMinus');
    // Filedata
    const collapseThree    = args.target.querySelector('#collapseThree');
    const rowFiledata      = args.target.querySelector('#rowFiledata');
    const fileFiledata     = args.target.querySelector('#fileFiledata');
    const containerFiledata = args.target.querySelector('#containerFiledata');

    containerFiledata.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filedata-id]');
      if (!btn) return;
      const id = btn.dataset.filedataId;
      if (!confirm('Delete this file?')) return;
      args.app.apiDelete(() => {
        this.#refreshFiledataDisplay();
      }, (ex) => alert(ex), '/filedata/' + id);
    });

    this.#product = { stockList: [] };

    const dialogueStock = new dStock({
      target: args.target,
      app: args.app,
      addStockToProduct: (stockEntry) => {
        if (!this.#product.stockList) this.#product.stockList = [];
        this.#product.stockList.push({
          stockId: stockEntry.stockId,
          productId: stockEntry.productId,
          amount: stockEntry.amount,
          note: stockEntry.note,
          dateTime: stockEntry.dateTime,
          personId: this.#args.app.user?.userId,
          personNameFull: `${this.#args.app.user?.forename ?? ''} ${this.#args.app.user?.surname ?? ''}`.trim() || '-'        });
        this.#refreshStockTable();
      }
    });

    const colCategoryTreeview = args.target.querySelector('#colCategoryTreeview');

    this.#categoryTree = new categoryTree({
      target: colCategoryTreeview,
      app: args.app,
      multiSelect: true,
    });

    // Shared by the Save button and the filedata upload path, which needs a
    // saved product (real productUid) before POSTing to /product/{uid}/filedata.
    const saveProduct = (onSaved, onFailed) => {
      alertMessage.classList.remove('alert-success', 'alert-danger');
      alertMessage.classList.add('d-none');

      if (!this.#product) {
        this.#product = {
          productId: null,
          stockList: []
        };
      }

      this.#product.charcode = textCharcode.value || 'P-' + Date.now();
      this.#product.productUid = this.#product.productUid || Date.now().toString();
      this.#product.name = textName.value || null;

      if (this.#categoryTree.selCats?.length > 0) {
        this.#product.productCategoryList = this.#categoryTree.selCats.map(c => ({
          categoryId: c.categoryId
        }));
      }

      if (Array.isArray(this.#product.stockList)) {
        this.#product.stockList = this.#product.stockList
          .filter(entry => entry && typeof entry.amount !== 'undefined')
          .map(({ stockId, productId, amount, note, dateTime }) => ({
            stockId,
            productId,
            amount,
            note,
            dateTime
          }));
      }

      args.app.apiSet((r) => {
        if (r.success) {
          this.#product = r.product;
          onSaved?.(r);
        } else {
          alertMessage.innerText = r.message;
          alertMessage.classList.add('alert-danger');
          alertMessage.classList.remove('d-none');
          onFailed?.(r.message);
        }
      }, (ex) => {
        alertMessage.classList.add('alert-danger');
        alertMessage.classList.remove('d-none');
        alertMessage.innerText = ex;
        onFailed?.(ex);
      }, '/product', this.#product.productId, this.#product);
    };

    buttonSave.addEventListener('click', () => {
      saveProduct((r) => {
        alertMessage.innerText = r.message;
        alert(r.message);
        window.open('#productdetail?id=' + r.product.productUid, '_self');
        setTimeout(() => alertMessage.classList.add('d-none'), 3000);
      });
    });

    const uploadFiledata = (files) => {
      if (!files || files.length === 0) return;
      const needsSave = !this.#product?.productUid || !this.#product?.productId;
      if (needsSave && !textName.value) {
        alertMessage.innerText = 'Product Name has to be set first';
        alertMessage.classList.remove('alert-success', 'd-none');
        alertMessage.classList.add('alert-danger');
        return;
      }
      const doUpload = () => {
        args.app.apiFiledata((r) => {
          console.log(r);
          this.#refreshFiledataDisplay();
        }, (ex) => {
          alert(ex);
        }, this.#product, files);
      };
      if (needsSave) {
        saveProduct(() => {
          // replaceState, not navigate — a full reload would tear down this page and drop in-flight files.
          history.replaceState(null, '', '#productdetail?id=' + this.#product.productUid);
          doUpload();
        });
      } else {
        doUpload();
      }
    };

    // stock
    buttonStockPlus.addEventListener('click', () => {
      if (!this.#product) {
        this.#product = {
          productId: null,
          productUid: Date.now().toString(),
          charcode: textCharcode.value,
          name: textName.value,
          productCategoryList: this.#categoryTree.selCats.map(c => ({
            categoryId: c.categoryId
          })),
          stockList: []
        };
      }
      dialogueStock.show({ product: this.#product, modus: 'p' });
    });

    buttonStockMinus.addEventListener('click', () => {
      if (!this.#product) {
        this.#product = {
          productId: null,
          productUid: Date.now().toString(),
          charcode: textCharcode.value,
          name: textName.value,
          productCategoryList: this.#categoryTree.selCats.map(c => ({
            categoryId: c.categoryId
          })),
          stockList: []
        };
      }
      dialogueStock.show({ product: this.#product, modus: 'n' });
    });

    // filedata
    rowFiledata.addEventListener('click', () => {
      fileFiledata.click();
    });

    rowFiledata.addEventListener('dragover', (e) => {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    rowFiledata.addEventListener('drop', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        uploadFiledata(e.dataTransfer.files);
      }
    });

    fileFiledata.addEventListener('change', () => {
      const files = fileFiledata.files;
      fileFiledata.value = '';
      uploadFiledata(files);
    });

    collapseTwo.addEventListener('shown.bs.collapse', (e) => {
      e.stopPropagation();
      if (this.#product && this.#product.productUid) {
        this.#stockListRead(this.#product.productUid);
      }
    });

    collapseThree.addEventListener('shown.bs.collapse', (e) => {
      e.stopPropagation();
      this.#refreshFiledataDisplay();
    });

    args.app.apiGet((cl) => {
      this.#categoryTree.categoryList = cl;
      if (args.id) {
        args.app.apiGet((r) => {
          this.#product = r;
          textCharcode.value = this.#product.charcode;
          textName.value = this.#product.name;

          if (this.#product.productCategoryList?.length > 0) {
            const sc = [];
            for (const prodc of this.#product.productCategoryList) {
              const match = cl.find(c => c.categoryId === prodc.categoryId);
              if (match) sc.push(match);
            }
            this.#categoryTree.selCats = sc;
          }

          const cartTarget = args.target.querySelector('#cartAddTarget');
          if (cartTarget) {
            new CartAddItem({
              target: cartTarget,
              app: args.app,
              product: this.#product,
            });
          }
        }, (ex) => {
          alert(ex);
        }, '/product/' + args.id);
      } else {
        const co = new bootstrap.Collapse('#collapseOne');
        co.show();
        accordionItem2.classList.remove('d-none');
        accordionItem3.classList.remove('d-none');
      }
    }, (ex) => {
      alert(ex);
    }, '/category');
  }
  //#endregion

  //#region private methods
  #stockListRead(id)  {
    const tableStock = this.#args.target.querySelector('#tableStock>tbody');
    const infoTextSum = this.#args.target.querySelector('#infoSum');

    this.#args.app.apiGet((r) => {

      let html = '';
      const dateFormat = new Intl.DateTimeFormat(navigator.language, {
        dateStyle: "medium",
        timeStyle: "short",
        hour12: false
      });

      let ga = 0;

      for (const b of r) {
        ga += b.amount;
        html += `
          <tr>
            <td>${dateFormat.format(new Date(b.dateTime))}</td>
            <td>${b.amount}</td>
            <td>${b.note}</td>
            <td>${b.personNameFull}</td>
          </tr>
        `;
      }
      tableStock.innerHTML = html;
      infoTextSum.innerText = ga;
    }, (ex) => {
      alert(ex);
    }, '/product/' + id + '/stock');
  }

  #refreshStockTable() {
  const tableStock = this.#args.target.querySelector('#tableStock>tbody');
  const infoTextSum = this.#args.target.querySelector('#infoSum');

  let html = '';
  let ga = 0;

    const dateFormat = new Intl.DateTimeFormat(navigator.language, {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: false
    });

  for (const s of this.#product?.stockList || []) {
    ga += s.amount;
    html += `
      <tr>
        <td>${dateFormat.format(new Date(s.dateTime))}</td>
        <td>${s.amount}</td>
        <td>${s.note}</td>
        <td>${this.#args.app.user?.forename || '-'}</td>
      </tr>
    `;
  }
  tableStock.innerHTML = html;
  infoTextSum.innerText = ga;
}

  #refreshFiledataDisplay() {
    if (!this.#product?.productUid) return;
    const containerFiledata = this.#args.target.querySelector('#containerFiledata');

    this.#args.app.apiGet((r) => {
      let html = '<div class="row">';
      let idx = 0;
      for (const fd of r) {
        if (idx > 0 && idx % 3 == 0) {
          html += '</div><div class="row mt-3">';
        }
        html += `
          <div class="col-12 col-lg-4 mt-3 mt-lg-0">
            <div class="card w-100">
              <img src="${fd.contentUrl}" class="card-img-top" alt="Foto" />
              <div class="card-body d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0">${fd.name}</h5>
                <i class="bi-trash text-danger element-clickable ms-2" role="button" data-filedata-id="${fd.filedataId}" title="Delete"></i>
              </div>
            </div>
          </div>
        `;
        idx++;
      }
      html += '</div>';
      containerFiledata.innerHTML = html;
    }, (ex) => {
      alert(ex);
    }, '/product/' + this.#product.productUid + '/filedata');
  }
  //#endregion
}