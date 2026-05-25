import PageHTML from './categories.html';
import dCategory from '@features/category-edit/category-edit';

export default class pCategories {
  //#region private vars
  #args = null;
  #categoryList = [];
  #roots = [];
  #childrenByCat = new Map();
  #expanded = new Set();
  #filter = '';
  #dialog = null;
  //#endregion

  //#region constructor
  constructor(args) {
    this.#args = args;
    args.target.innerHTML = PageHTML;

    const buttonNew = args.target.querySelector('#buttonNew');
    const inputFilter = args.target.querySelector('#inputFilter');
    const tree = args.target.querySelector('#categoriesTree');

    this.#dialog = new dCategory({
      target: args.target,
      app: args.app,
      saveClick: (saved) => {
        // Auto-expand the parent of a newly-added sub-category so the new child is visible.
        if (saved?.categoryRefId) this.#expanded.add(saved.categoryRefId);
        this.#dataRead();
        window.dispatchEvent(new CustomEvent('category:changed'));
      }
    });

    buttonNew.addEventListener('click', () => this.#dialog.show());

    inputFilter.addEventListener('input', () => {
      this.#filter = inputFilter.value.trim().toLowerCase();
      this.#render();
    });

    tree.addEventListener('click', (e) => {
      const toggle = e.target.closest('.chevron-toggle');
      if (toggle) {
        const id = parseInt(toggle.dataset.toggleId);
        if (this.#expanded.has(id)) this.#expanded.delete(id);
        else this.#expanded.add(id);
        this.#render();
        return;
      }

      const btn = e.target.closest('button[data-action]');
      if (btn) {
        const cat = this.#categoryList.find(c => c.categoryId == parseInt(btn.dataset.id));
        if (!cat) return;
        if (btn.dataset.action === 'add') {
          this.#dialog.show({ pCategory: cat });
        } else if (btn.dataset.action === 'del') {
          if (confirm(`Are you sure you want to delete "${cat.name}" ?`)) {
            args.app.apiDelete((r) => {
              if (r.success) {
                this.#dataRead();
                window.dispatchEvent(new CustomEvent('category:changed'));
              } else alert(r.message);
            }, (ex) => alert(ex),
            '/category/' + cat.categoryId);
          }
        }
        return;
      }

      const node = e.target.closest('.category-node');
      if (!node) return;
      const cat = this.#categoryList.find(c => c.categoryId == parseInt(node.dataset.id));
      if (cat) this.#dialog.show({ category: cat });
    });

    this.#dataRead();
  }
  //#endregion

  //#region private methods
  #dataRead() {
    this.#args.app.apiGet((r) => {
      this.#categoryList = r || [];
      this.#buildTree();
      this.#render();
    }, (ex) => alert(ex),
    '/category');
  }

  #buildTree() {
    const nodeByCat = new Map();
    for (const c of this.#categoryList) nodeByCat.set(c.categoryId, { category: c, children: [] });

    this.#roots = [];
    this.#childrenByCat = new Map();
    for (const c of this.#categoryList) {
      const n = nodeByCat.get(c.categoryId);
      if (c.categoryRefId && nodeByCat.has(c.categoryRefId)) {
        nodeByCat.get(c.categoryRefId).children.push(n);
        if (!this.#childrenByCat.has(c.categoryRefId)) this.#childrenByCat.set(c.categoryRefId, []);
        this.#childrenByCat.get(c.categoryRefId).push(c);
      } else {
        this.#roots.push(n);
      }
    }

    const byRanking = (a, b) => (a.category.ranking ?? 0) - (b.category.ranking ?? 0);
    this.#roots.sort(byRanking);
    for (const n of nodeByCat.values()) n.children.sort(byRanking);
  }

  #render() {
    const container = this.#args.target.querySelector('#categoriesTree');
    if (this.#roots.length === 0) {
      container.innerHTML = `<div class="empty-state">No categories yet. Click "New main category" to add one.</div>`;
      return;
    }
    let html = '';
    for (const root of this.#roots) html += this.#renderNode(root, 0);
    container.innerHTML = html || `<div class="empty-state">No categories match "${this.#escape(this.#filter)}".</div>`;
  }

  #renderNode(node, depth) {
    const cat = node.category;
    const hasChildren = node.children.length > 0;
    const isExpanded = this.#expanded.has(cat.categoryId) || !!this.#filter;
    const nameLower = (cat.name ?? '').toLowerCase();
    const selfMatches = !this.#filter || nameLower.includes(this.#filter);
    const childMatches = this.#filter && node.children.some(c => this.#anyDescendantMatches(c));
    if (this.#filter && !selfMatches && !childMatches) return '';

    const pad = depth * 1.25 + 0.5;
    let html = `
      <div class="category-node" data-id="${cat.categoryId}" style="padding-left: ${pad}rem;">
        ${hasChildren
          ? `<i class="bi-chevron-${isExpanded ? 'down' : 'right'} chevron-toggle" data-toggle-id="${cat.categoryId}"></i>`
          : '<span class="chevron-spacer"></span>'}
        <span class="name">${this.#escape(cat.name ?? '')}</span>
        <span class="rank-badge" title="Ranking">#${cat.ranking ?? 0}</span>
        <span class="row-actions">
          <button type="button"
                  class="btn btn-sm btn-outline-secondary border-0"
                  data-action="add"
                  data-id="${cat.categoryId}"
                  title="Add sub-category"><i class="bi-plus-lg"></i></button>
          <button type="button"
                  class="btn btn-sm btn-outline-danger border-0"
                  data-action="del"
                  data-id="${cat.categoryId}"
                  title="Delete"><i class="bi-trash3"></i></button>
        </span>
      </div>
    `;
    if (hasChildren && isExpanded) {
      for (const child of node.children) html += this.#renderNode(child, depth + 1);
    }
    return html;
  }

  #anyDescendantMatches(node) {
    if ((node.category.name ?? '').toLowerCase().includes(this.#filter)) return true;
    return node.children.some(c => this.#anyDescendantMatches(c));
  }

  #escape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  //#endregion
}