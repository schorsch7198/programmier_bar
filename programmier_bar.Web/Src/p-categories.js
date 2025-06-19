import PageHTML from './p-categories.html';
import dCategory from './components/dialogues/d-category';

export default class pCategories {
  //============================================================================================================================
  #args = null;
  #categoryList = null;
  //============================================================================================================================
  constructor(args) {
    this.#args = args;
    args.target.innerHTML = PageHTML;

    //---------------------------------------------------
    const buttonNew = this.#args.target.querySelector('#buttonNew');
    const tableList = this.#args.target.querySelector('#tableList>tbody');

    const dialog = new dCategory({
      target: args.target,
      app: args.app,
      saveClick: () => {
        this.#dataRead();
      }
    });

    //---------------------------------------------------
    // events
    //---------------------------------------------------
    buttonNew.addEventListener( 'click', () => {
      dialog.show();
    });

    tableList.addEventListener( 'click', (e) => {

      let btn = null;
      let cat = null;
      if (e.target.nodeName == 'I' && e.target.parentElement.nodeName == 'BUTTON') btn = e.target.parentElement;
      else if (e.target.nodeName == 'BUTTON') btn = e.target;

      if (btn && btn.dataset.action) {
        cat = this.#categoryList.filter(c => c.categoryId == parseInt(btn.dataset.id))[0];
        switch(btn.dataset.action) {
          case 'add':
            dialog.show({
              pCategory: cat
            });
            break;
          case 'del':
            if (confirm('Are you sure u want to delete ' + cat.name + ' ?')) {
              args.app.apiDelete( (r) => {
                if (r.success) this.#dataRead();
                else alert(r.message);
              }, (ex) => {
                alert(ex);
              }, '/category/' + cat.categoryId);
            }
            break;
        }
      } else if (e.target.nodeName == 'TD' && e.target.dataset.id) {
        cat = this.#categoryList.filter(c => c.categoryId == parseInt(e.target.dataset.id))[0];
        dialog.show({
          category: cat
        });
      }
    });

    //---------------------------------------------------
    // init
    //---------------------------------------------------
    this.#dataRead();
  } // constructor

  //============================================================================================================================
  // private methods
  //============================================================================================================================
  #dataRead() {

    const tableList = this.#args.target.querySelector('#tableList>tbody');

    this.#args.app.apiGet((r) => {
      this.#categoryList = r;
      tableList.innerHTML = this.#treeviewCreate();
    }, (ex) => {
      alert(ex);
    }, '/category');
  }

  #treeviewCreate(pc, level) {
    let cl = null;
    let html = '';

    if (!level) level = 0;
    if (pc) cl = this.#categoryList.filter(c => c.categoryRefId == pc.categoryId);
    else cl = this.#categoryList.filter(c => !c.categoryRefId);

    for (const c of cl) {
      html += `
        <tr>
          <td>
            <button type="button" class="btn btn-secondary" data-action="add" data-id="${c.categoryId}"><i class="bi-plus"></i></button>
            <button type="button" class="btn btn-danger" data-action="del" data-id="${c.categoryId}"><i class="bi-trash3-fill"></i></button>
          </td>
          <td class="element-clickable pt-3" style="padding-left:${level * 2}rem;" data-id="${c.categoryId}">${c.name}</td>
          <td class="element-clickable text-end" data-id="${c.categoryId}">${c.ranking}</td>
        </tr>
        ${this.#treeviewCreate(c, level + 1)}
      `;
    }
    return html;
  }




} // class