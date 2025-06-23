// import 'bootstrap/dist/js/bootstrap.bundle';
// import 'bootstrap/dist/js/bootstrap.bundle';
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle';

// import './../bootstrap/dist/js/bootstrap.bundle';
// import 'bootstrap/dist/js/bootstrap';
// import './../node_modules/bootstrap/dist/js/bootstrap.bundle';


import dStock from './components/dialogues/d-stock';
import PageHTML from './p-product-detail.html';
import categoryTree from './components/category-treeview/category-tree';

export default class pProductDetail {
  //================================================================================================
  #args = null;
  #categoryTree = null;
  // #networkDataReceived = false;
  #product = null;


  //================================================================================================
  constructor(args) {
    this.#args = args;
    args.target.innerHTML = PageHTML;
    //-----------------------------------------
    const textCharcode = args.target.querySelector('#textCharcode');
    const textName = args.target.querySelector('#textName');
    const buttonSave = args.target.querySelector('#buttonSave');
    const alertMessage = args.target.querySelector('#alertMessage');
    const accordionItem2 = args.target.querySelector('#accordionItem2');
    const accordionItem3 = args.target.querySelector('#accordionItem3');
    //----------
    // Stock
    const collapseTwo = args.target.querySelector('#collapseTwo');
    const buttonStockPlus = args.target.querySelector('#buttonStockPlus');
    const buttonStockMinus = args.target.querySelector('#buttonStockMinus');
    //----------
    // Filedata
    const collapseThree = args.target.querySelector('#collapseThree');
    const rowFiledata = args.target.querySelector('#rowFiledata');
    const fileFiledata = args.target.querySelector('#fileFiledata');
    // const containerFiledata = args.target.querySelector('#containerFiledata');
    
    // if (!this.#product.stockList) {
      this.#product = { stockList: [] };
    // }

    // const dialogueStock = new dStock({
    //   target: args.target,
    //   app: args.app,
    //   saveClick: () => {
    //     this.#stockListRead(product.productUid);
    //   }
    // });
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

    //-----------------------------------------
    // events
    //-----------------------------------------
    // buttonSave.addEventListener( 'click', () => {

    //   alertMessage.classList.remove('alert-success', 'alert-danger');
    //   alertMessage.classList.add('d-none');

    //   if (!this.#product) {
    //     this.#product = {
    //       productId: null,
    //       productUid: null,
    //       charcode: 'P-' + Date.now()
    //     };
    //   }

    //   // Set the name afterward
    //   this.#product.name = textName.value ? textName.value : null;
    //   // product.charcode = textCharcode.value ? textCharcode.value : null;

    //   if (this.#categoryTree.selCats?.length > 0) {
    //     this.#product.productCategoryList = this.#categoryTree.selCats.map(c => ({
    //       categoryId: c.categoryId
    //     }));
    //   }
    //   // product.productUid = Date.now().toString();
    //   if (this.#product.stockList && this.#product.stockList.length > 0) {
    //     this.#product.stockList.forEach(entry => delete entry.personNameFull); // optional cleanup
    //   }

    //   args.app.apiSet((r) => {
    //     alertMessage.innerText = r.message;
    //     if (r.success) {
    //       this.#product = r.product;
    //       alert(r.message);
    //       window.open('#productdetail?id=' + r.product.productUid, '_self');
    //       setTimeout(() => alertMessage.classList.add('d-none'), 3000);
    //        } else {
    //       alertMessage.classList.add('alert-danger');
    //       alertMessage.classList.remove('d-none');
    //     }
    //   }, (ex) => {
    //       // if('serviceWorker' in navigator && 'SyncManager' in window) {
    //       //   navigator.serviceWorker.ready
    //       //     .then(sw => {
    //       //       if (product.artikelId == null) 
    //       //       {
    //       //         writeData('product-create', product)
    //       //           .then(() => {
    //       //             return sw.sync.register('sync-new-product');
    //       //           })
    //       //           .then(() => {
    //       //             writeData('product-cache', product);
    //       //           })
    //       //           .catch(function(err) {
    //       //             console.log(err);
    //       //           }).finally(()=> {
    //       //         });
    //       //       }
    //       //     else {
    //       //         writeData('product-update', product)
    //       //           .then(() => {
    //       //             return sw.sync.register('sync-updated-product');
    //       //           })
    //       //           .then(() => {
    //       //             deleteItemFromData('product-cache', product.productId);
    //       //             writeData('product-cache', product);
    //       //           })
    //       //           .catch(function(err) {
    //       //             console.log(err);
    //       //           }).finally(()=> {
    //       //         });
    //       //       }
    //       //     });
    //       //   }
        
    //     alertMessage.classList.add('alert-danger');
    //     alertMessage.classList.remove('d-none');
    //     alertMessage.innerText = ex;
    //   }, '/product', this.#product.productId, this.#product);
    // });
    buttonSave.addEventListener('click', () => {
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

      // // ✅ REMOVE frontend-only field to avoid backend validation error
      // if (this.#product.stockList?.length > 0) {
      //   this.#product.stockList.forEach(entry => {
      //     if ('personNameFull' in entry) {
      //       delete entry.personNameFull;
      //     }
      //   });
      // }

      if (Array.isArray(this.#product.stockList)) {
        this.#product.stockList = this.#product.stockList
          .filter(entry => entry && typeof entry.amount !== 'undefined') // filter out bad entries
          .map(({ stockId, productId, amount, note, dateTime }) => ({
            stockId,
            productId,
            amount,
            note,
            dateTime
          }));
      }
      // ✅ Send cleaned object
      args.app.apiSet((r) => {
        alertMessage.innerText = r.message;
        if (r.success) {
          this.#product = r.product;
          // sessionStorage.setItem('refreshProductList', 'true');
          alert(r.message);
          window.open('#productdetail?id=' + r.product.productUid, '_self');
          setTimeout(() => alertMessage.classList.add('d-none'), 3000);
        } else {
          alertMessage.classList.add('alert-danger');
          alertMessage.classList.remove('d-none');
        }
      }, (ex) => {
        alertMessage.classList.add('alert-danger');
        alertMessage.classList.remove('d-none');
        alertMessage.innerText = ex;
      }, '/product', this.#product.productId, this.#product);
    });


    //-----------------------------------------
    // stock
    //-----------------------------------------

    buttonStockPlus.addEventListener('click', () => {
      // debugger;
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

    //-----------------------------------------
    // filedata
    rowFiledata.addEventListener( 'click', () => {
      fileFiledata.click();
    });

    rowFiledata.addEventListener( 'dragover', (e) => {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });  

    rowFiledata.addEventListener( 'drop', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        args.app.apiFiledata((r) => {
          console.log(r);
        }, (ex) => {  
          alert(ex);
        }, product, e.dataTransfer.files);
      }
    });

    fileFiledata.addEventListener( 'change', (e) => {
      const imgPic = args.target.querySelector('#imgPic');
      const reader = new FileReader();
      reader.onload = (r) => {
        imgPic.src = r.target.result;
      };
      reader.readAsDataURL(fileFiledata.files[0]);

      args.app.apiFiledata((r) => {
        console.log(r);
      }, (ex) => {  
        alert(ex);
      }, this.#product, fileFiledata.files);
    });

    collapseTwo.addEventListener('shown.bs.collapse', (e) => {
      e.stopPropagation();
      // debugger;
      // this.#stockListRead(this.#product.productUid);
      if (this.#product && this.#product.productUid) {
        this.#stockListRead(this.#product.productUid);
      }
    });

    collapseThree.addEventListener( 'shown.bs.collapse', (e) => {
      e.stopPropagation();
      
      args.app.apiGet((r) => {

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
                <div class="card-body">
                  <h5 class="card-title">${fd.name}</h5>
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
    });



    //-----------------------------------------
    // init
    //-----------------------------------------
    
    // let networkDataReceived = false;

    // if ('indexedDB' in window) {
    //   readItemFromData('product-cache', args.id)
    //     .then(data => {
    //       if (!networkDataReceived) { // If network data hasn't already updated the display
    //         console.log('selected article From cache', data);
    //         product = data;
    //         textCharcode.value = product.charcode;
    //         textName.value = product.name;
    //       }
    //     });
    // }

    args.app.apiGet((cl) => {
      // this.#networkDataReveived = false;
      this.#categoryTree.categoryList = cl;
      if (args.id) {
        args.app.apiGet((r) => {
          // networkDataReceived = true;
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

    //-----------------------------------------
    //-----------------------------------------
  } // constructor

  //================================================================================================
  // private
  //================================================================================================
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
  //================================================================================================
  //================================================================================================
} // class