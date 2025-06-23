import bootstrap from './../../../node_modules/bootstrap/dist/js/bootstrap.bundle';
import ComponentHTML from './d-category.html';

export default class dCategory {
  //==========================================================================================================
  // private vars
  #args = null;
  #modal = null;
  #category = null;
  #pCategory = null;

  constructor(args) {
    this.#args = args;
    args.target.insertAdjacentHTML('beforeend', ComponentHTML);
    const numberRanking = this.#args.target.querySelector('#numberRankingModalCategory');
    const textName = this.#args.target.querySelector('#textNameModalCategory');
    const buttonSave = this.#args.target.querySelector('#buttonSaveModalCategory');
    const modalCategory = args.target.querySelector('#modalCategory');
    this.#modal = new bootstrap.Modal(modalCategory);

    buttonSave.addEventListener( 'click', () => {
      if (!this.#category) {
        this.#category = {
          categoryId: null
        };
      }
      if (this.#pCategory) {
        this.#category.categoryRefId = this.#pCategory.categoryId;
      }
       
      this.#category.name = textName.value ? textName.value : null;
      this.#category.ranking = numberRanking.value ? parseInt(numberRanking.value) : null;

      args.app.apiSet((r) => {
        if (r.success) {
          if (args.saveClick && typeof args.saveClick === 'function') args.saveClick();
          // buttonSave.blur();
          setTimeout(() => this.#modal.hide(), 50);
        }
      }, (ex) => {
        alert(ex);
      }, '/category', this.#category.categoryId, this.#category);
    });
  }

  //==========================================================================================================
  show(args) {
    const numberRanking = this.#args.target.querySelector('#numberRankingModalCategory');
    const textName = this.#args.target.querySelector('#textNameModalCategory');
    const modalTitle = this.#args.target.querySelector('#modalTitleModalCategory');

    this.#category = null;
    this.#pCategory = null;
    textName.value = '';
    numberRanking.value = '';
    modalTitle.innerText = 'add Category';

    if (args) {
      if (args.category) {
        modalTitle.innerText = 'change Category';
        this.#category = args.category;
        textName.value = this.#category.name;
        numberRanking.value = this.#category.ranking;
      }
      if (args.pCategory) {
        modalTitle.innerText = 'Under ' + args.pCategory.name + ' add Category';
        this.#pCategory = args.pCategory;
      }
    }
    this.#modal.show();
  }
} // class