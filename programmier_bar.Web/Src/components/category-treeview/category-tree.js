import bootstrap from 'bootstrap/dist/js/bootstrap.bundle';

import HTML from './category-tree.html';

export default class categoryTree {
  // private vars
  //===================================================================================================================================
  #args = null;
  #categoryList = null;
  #selCats = null;

  constructor(args) {
    this.#args = args;
    this.#args.target.innerHTML = HTML;

    const containerCategory = this.#args.target.querySelector('#containerCategory');
    const offcanvasBody = this.#args.target.querySelector('.offcanvas-body');
    const offcanvasCategory = new bootstrap.Offcanvas('#offcanvasCategory');

    // Events
    //===================================================================================================================================
    args.target.addEventListener('hidden.bs.collapse', (e) => {
      const btn = args.target.querySelector('button[data-bs-target="#' + e.target.id + '"]');
      if (btn) {
        const icon = btn.querySelector('i');
        icon.classList.remove('bi-chevron-up', 'bi-chevron-down');
        icon.classList.add('bi-chevron-down');
      }
    });
    args.target.addEventListener('shown.bs.collapse', (e) => {
      const btn = args.target.querySelector('button[data-bs-target="#' + e.target.id + '"]');
      if (btn) {
        const icon = btn.querySelector('i');
        icon.classList.remove('bi-chevron-up', 'bi-chevron-down');
        icon.classList.add('bi-chevron-up');
      }
    });

    args.target.addEventListener( 'click', (e) => {
      if (e.target.nodeName == 'SPAN' && e.target.dataset.categoryId) {
        this.#selCats = this.#categoryList.filter( c => c.categoryId == parseInt(e.target.dataset.categoryId));
        offcanvasCategory.hide();
        if (this.#args.click && typeof this.#args.click === 'function') 
          this.#args.click(this.#selCats[0]);
      }
    });

    containerCategory.addEventListener( 'click', (e) => {
      if (e.target.nodeName == 'INPUT' && e.target.type == 'checkbox') {
        const cb = offcanvasBody.querySelector('#' + e.target.id);
        cb.checked = e.target.checked;
      }
    });

    offcanvasBody.addEventListener( 'click', (e) => {
      if (e.target.nodeName == 'INPUT' && e.target.type == 'checkbox') {
        const cb = containerCategory.querySelector('#' + e.target.id);
        cb.checked = e.target.checked;
      }
    });
  } // constructor

  // properties
  //===================================================================================================================================
  get categoryList() {
    return this.#categoryList;
  }
  set categoryList(v) {
    this.#categoryList = v;
    this.#treeviewShow();
  }

  get selCats() {

    if (this.#args.multiSelect) {
      const containerCategory = this.#args.target.querySelector('#containerCategory');
      this.#selCats = [];
      containerCategory.querySelectorAll('input[type="checkbox"]:checked').forEach( (item) => {
        const cs = this.#categoryList.filter(c => c.categoryId == parseInt(item.dataset.categoryId));
        this.#selCats.push(...cs);
      });
    }
    return this.#selCats;
  }
  set selCats(v) {
    this.#selCats = v;

    const containerCategory = this.#args.target.querySelector('#containerCategory');
    const offcanvasBody = this.#args.target.querySelector('.offcanvas-body');

    if (this.#args.multiSelect) {
      let checkBox = null;
      for (const selCat of this.#selCats) {
        const ids = selCat.idPath.split('|');
        for (const id of ids) {
          if (id) {
            checkBox = containerCategory.querySelector('#checkboxCategory_' + id);
            checkBox.checked = true;
            checkBox = offcanvasBody.querySelector('#checkboxCategory_' + id);
            checkBox.checked = true;
          }
        }
      }
    }
  }

  // private methods
  //===================================================================================================================================
  #treeviewShow() {
    const containerCategory = this.#args.target.querySelector('#containerCategory');
    const offcanvasBody = this.#args.target.querySelector('.offcanvas-body');
    containerCategory.innerHTML = offcanvasBody.innerHTML = this.#treeviewBuild(null, 0);
  }

  #treeviewBuild(pCat) {
    let html = '';
    let cl = null;
    if (pCat) cl = this.#categoryList.filter( o => o.categoryRefId == pCat.categoryId);
    else cl = this.#categoryList.filter( o => !o.categoryRefId);

    for (const c of cl){
      html += `
        <div class="mt-2 d-flex align-items-center">
          <button type="button" class="btn btn-secondary${(this.#categoryList.filter( o =>  o.categoryRefId == c.categoryId).length == 0 ? ' invisible' : '')}" data-bs-toggle="collapse" data-bs-target="#collapse${c.categoryId}" aria-expanded="false" aria-controls="collapseExample">
            <i class="bi-chevron-down"></i>
          </button>
          ${(this.#args.multiSelect 
            ? `<div class="form-check ms-2">
                <input class="form-check-input" type="checkbox" value="" id="checkboxCategory_${c.categoryId}" data-category-id="${c.categoryId}">
                <label class="form-check-label" for="checkboxCategory_${c.categoryId}">${c.name}</label>
              </div>`
            : `<span class="ms-2 element-clickable" data-category-id="${c.categoryId}">${c.name}</span>`
          )}
        </div>
        <div class="collapse ps-3" id="collapse${c.categoryId}">
          ${this.#treeviewBuild(c)}
        </div>`;
    }
    return html;
  }
} // class