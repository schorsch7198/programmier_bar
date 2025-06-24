import CategoryTree from './components/category-treeview/category-tree';
import PageHTML from './p-product-list.html';

export default class pProductList {
  //================================================================================================
  // private vars
  #args = null;
  #productList = null;
  #categoryTree = null;
  #networkDataReceived = false;

  //================================================================================================
  constructor(args) {
    this.#args = args;
    args.target.innerHTML = PageHTML;
    //-----------------------------------------

    // // ✅ Refresh after returning from product detail
    // if (sessionStorage.getItem('refreshProductList') === 'true') {
    //   sessionStorage.removeItem('refreshProductList');
    //   this.#dataRead(); // re-fetch product list with updated stock
    // }

    // handle event thrown by service worker, when db is complete 
    navigator.serviceWorker.ready.then(() => {
      navigator.serviceWorker.addEventListener('message', function(event) {
        if (event.data.action === 'sync-complete') {
          // Repaint the page here
          console.error('Data from network in event:', event.data.data);
        }
      }.bind(this));
    });

    const tableProduct = args.target.querySelector('#tableProduct>tbody');
    const colCategoryTreeview = args.target.querySelector('#colCategoryTreeview');

    this.#categoryTree = new CategoryTree({
      target: colCategoryTreeview,
      app: args.app,
      multiSelect: false,
      click: (c) => {
        this.#dataRead(c);
      }
    });

    //-----------------------------------------
    // events
    //-----------------------------------------
    tableProduct.addEventListener( 'click', (e) => {
      let btn = null;

      if (e.target.nodeName == 'BUTTON') btn = e.target;
      else if (e.target.nodeName == 'I' && e.target.parentElement.nodeName == 'BUTTON') btn = e.target.parentElement;

      if (btn) {

        if (btn.dataset.action == 'del') {
          const prod = this.#productList.filter( o => o.productUid == btn.dataset.id)[0];
          if (confirm('Are you sure u want to delete ' + prod.name + ' ?')) {
            
            // if('serviceWorker' in navigator && 'SyncManager' in window) {
            //   navigator.serviceWorker.ready
            //     .then(sw => {
            //       writeData('product-delete', prod)
            //         .then(() => {
            //           return sw.sync.register('sync-deleted-product');
            //         })
            //         .then(() => {
            //           deleteItemFromData('product-cache', prodcut.productUid);
            //         })
            //         .catch(function(err) {
            //           console.log(err);
            //         }).finally(()=> {
            //         });
            //     });
            // };          

            args.app.apiDelete((r) => {
              if (r.success) {
                this.#dataRead(this.#categoryTree.selCats?.length > 0 ? this.#categoryTree.selCats[0] : null);
              } else {
                alert(r.message);
              }
            }, (ex) => {
              alert(ex);
            }, '/product/' + prod.productUid);



          }
        }

      } else {
        window.open('#productdetail?id=' + e.target.parentElement.dataset.productId, '_self');
      }


    });

    //-----------------------------------------
    // init
    //-----------------------------------------
    this.#dataRead();
    //-----------------------------------------
    //-----------------------------------------
  } // constructor

  //================================================================================================
  #dataRead(category) {
    const tableProduct = this.#args.target.querySelector('#tableProduct>tbody');
    this.#networkDataReceived = false;
    if (category) {
      this.#args.app.apiGet(r => {
        this.#productList = r;
        tableProduct.innerHTML = this.#htmlBuild();
  
      }, (ex) => {
        alert(ex);
      }, '/product?cid=' + category.categoryId);
  
    } else {
      // if ('indexedDB' in window) {
      //   readAllData('product-cache')
      //     .then(data => {
      //       if (!networkDataReceived) { // If network data hasn't already updated the display
      //         console.log('From cache', data);
      //         this.#productList = data;
      //         tableProduct.innerHTML = this.#htmlBuild();
      //       }
      //     });
      // }

      this.#args.app.apiGet((r) => {
        // networkDataReceived = true;
        this.#productList = r.productList;
        this.#categoryTree.categoryList = r.categoryList;
        tableProduct.innerHTML = this.#htmlBuild();
      }, (ex) => {
        alert(ex);
      }, '/page/productlist');
    }
  }

  #htmlBuild() {
    let html = '';
    for (const product of this.#productList) {
      html += `
        <tr data-product-id="${product.productUid}">
          <td class="text-center align-middle">
            <button type="button" 
                    class="btn btn-outline-secondary" 
                    data-action="del" 
                    data-id="${product.productUid}">
                    <i class="bi-trash"></i></button>
          </td>
          <td class="element-clickable align-middle">${product.charcode}</td>
          <td class="element-clickable align-middle">${product.name}</td>
          <td class="element-clickable align-middle">${product.stock}</td>
        </tr>
      `;
    }
    return html;
  }
} // class