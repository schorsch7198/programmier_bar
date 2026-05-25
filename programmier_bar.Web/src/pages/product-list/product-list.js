import PageHTML from './product-list.html';

export default class pProductList {
  //#region private vars
  #args = null;
  // Raw rows from /page/productlist — the product_info view emits one row per
  // (product, category) pair, so a product in N categories appears N times.
  // Kept for category-membership lookups and rollup counts.
  #allProductsRaw = [];
  // Deduped, category-filtered list rendered in the table.
  #productList = [];
  #categoryList = [];
  #categoryRoots = [];
  #childrenByCat = new Map();
  #categoryCount = new Map();
  #allCount = 0;
  #selectedCategoryId = null;
  #expandedCats = new Set();
  #categoryFilter = '';
  #sort = { key: null, dir: 'asc' };
  #search = '';
  //#endregion

  //#region constructor
  constructor(args) {
    this.#args = args;
    args.target.innerHTML = PageHTML;

    navigator.serviceWorker.ready.then(() => {
      navigator.serviceWorker.addEventListener('message', function(event) {
        if (event.data.action === 'sync-complete') {
          console.error('Data from network in event:', event.data.data);
        }
      }.bind(this));
    });

    const tableProduct = args.target.querySelector('#tableProduct>tbody');
    const tableProductHead = args.target.querySelector('#tableProduct>thead');
    const inputSearch = args.target.querySelector('#inputSearch');
    const inputCategoryFilter = args.target.querySelector('#inputCategoryFilter');
    const categoryTreeRoot = args.target.querySelector('#categoryTreeRoot');

    inputSearch.addEventListener('input', () => {
      this.#search = inputSearch.value.trim().toLowerCase();
      this.#renderTable();
    });

    inputCategoryFilter.addEventListener('input', () => {
      this.#categoryFilter = inputCategoryFilter.value.trim().toLowerCase();
      this.#renderSidebar();
    });

    tableProductHead.addEventListener('click', (e) => {
      const th = e.target.closest('[data-sort-key]');
      if (!th) return;
      const key = th.dataset.sortKey;
      if (this.#sort.key === key) {
        this.#sort.dir = this.#sort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        this.#sort.key = key;
        this.#sort.dir = 'asc';
      }
      this.#renderTable();
    });

    categoryTreeRoot.addEventListener('click', (e) => {
      const toggle = e.target.closest('.chevron-toggle');
      if (toggle) {
        const id = parseInt(toggle.dataset.toggleId);
        if (this.#expandedCats.has(id)) this.#expandedCats.delete(id);
        else this.#expandedCats.add(id);
        this.#renderSidebar();
        return;
      }
      const node = e.target.closest('.category-node');
      if (!node) return;
      const idStr = node.dataset.categoryId;
      this.#selectedCategoryId = idStr ? parseInt(idStr) : null;
      this.#renderSidebar();
      this.#renderTable();
    });

    tableProduct.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action], a[data-edit]');
      if (btn) {
        if (btn.dataset.action === 'del') {
          const prod = this.#productList.filter(o => o.productUid == btn.dataset.id)[0];
          if (confirm('Are you sure u want to delete ' + prod.name + ' ?')) {
            args.app.apiDelete((r) => {
              if (r.success) this.#fetchAll();
              else alert(r.message);
            }, (ex) => {
              alert(ex);
            }, '/product/' + prod.productUid);
          }
        }
        return;
      }
      if (e.target.closest('.row-actions')) return;
      const tr = e.target.closest('tr');
      if (tr?.dataset.productId) {
        window.open('#productdetail?id=' + tr.dataset.productId, '_self');
      }
    });

    this.#fetchAll();
  }
  //#endregion

  //#region private methods
  #fetchAll() {
    this.#args.app.apiGet((r) => {
      this.#allProductsRaw = r.productList || [];
      this.#categoryList = r.categoryList || [];
      this.#buildCategoryStructures();
      this.#renderSidebar();
      this.#renderTable();
    }, (ex) => {
      alert(ex);
    }, '/page/productlist');
  }

  #buildCategoryStructures() {
    const nodeByCat = new Map();
    for (const c of this.#categoryList) nodeByCat.set(c.categoryId, { category: c, children: [] });

    this.#categoryRoots = [];
    this.#childrenByCat = new Map();
    for (const c of this.#categoryList) {
      const node = nodeByCat.get(c.categoryId);
      if (c.categoryRefId && nodeByCat.has(c.categoryRefId)) {
        nodeByCat.get(c.categoryRefId).children.push(node);
        if (!this.#childrenByCat.has(c.categoryRefId)) this.#childrenByCat.set(c.categoryRefId, []);
        this.#childrenByCat.get(c.categoryRefId).push(c);
      } else {
        this.#categoryRoots.push(node);
      }
    }

    // Direct membership: which productUids are tagged directly with each category.
    const directUids = new Map();
    for (const row of this.#allProductsRaw) {
      if (row.categoryId == null) continue;
      if (!directUids.has(row.categoryId)) directUids.set(row.categoryId, new Set());
      directUids.get(row.categoryId).add(row.productUid);
    }

    // Roll up: each category's total includes all descendants. Use a Set so a
    // product tagged with multiple subcategories is only counted once.
    const totalUids = new Map();
    const computeTotal = (node) => {
      if (totalUids.has(node.category.categoryId)) return totalUids.get(node.category.categoryId);
      const set = new Set(directUids.get(node.category.categoryId) || []);
      for (const child of node.children) {
        for (const u of computeTotal(child)) set.add(u);
      }
      totalUids.set(node.category.categoryId, set);
      return set;
    };
    for (const root of this.#categoryRoots) computeTotal(root);

    this.#categoryCount = new Map();
    for (const [catId, set] of totalUids) this.#categoryCount.set(catId, set.size);
    this.#allCount = new Set(this.#allProductsRaw.map(r => r.productUid)).size;
  }

  #getCategorySubtreeIds(rootId) {
    const ids = new Set([rootId]);
    const walk = (id) => {
      for (const c of this.#childrenByCat.get(id) || []) {
        ids.add(c.categoryId);
        walk(c.categoryId);
      }
    };
    walk(rootId);
    return ids;
  }

  #renderSidebar() {
    const container = this.#args.target.querySelector('#categoryTreeRoot');
    const filter = this.#categoryFilter;
    let html = `
      <div class="category-node ${this.#selectedCategoryId == null ? 'active' : ''}" data-category-id="">
        <span class="chevron-spacer"></span>
        <span class="name">All</span>
        <span class="count">${this.#allCount}</span>
      </div>
    `;
    for (const root of this.#categoryRoots) {
      html += this.#renderTreeNode(root, 0, filter);
    }
    container.innerHTML = html;
  }

  #renderTreeNode(node, depth, filter) {
    const cat = node.category;
    const hasChildren = node.children.length > 0;
    // While a filter is active, auto-expand so matching descendants are reachable.
    const isExpanded = this.#expandedCats.has(cat.categoryId) || !!filter;
    const nameLower = (cat.name ?? '').toLowerCase();
    const selfMatches = !filter || nameLower.includes(filter);
    const childMatches = filter && node.children.some(c => this.#anyDescendantMatches(c, filter));
    if (filter && !selfMatches && !childMatches) return '';

    const count = this.#categoryCount.get(cat.categoryId) ?? 0;
    const isActive = this.#selectedCategoryId === cat.categoryId;
    const pad = depth * 1.25 + 0.5;

    let html = `
      <div class="category-node ${isActive ? 'active' : ''}"
           data-category-id="${cat.categoryId}"
           style="padding-left: ${pad}rem">
        ${hasChildren
          ? `<i class="bi-chevron-${isExpanded ? 'down' : 'right'} chevron-toggle" data-toggle-id="${cat.categoryId}"></i>`
          : '<span class="chevron-spacer"></span>'}
        <span class="name">${cat.name ?? ''}</span>
        <span class="count">${count}</span>
      </div>
    `;
    if (hasChildren && isExpanded) {
      for (const child of node.children) {
        html += this.#renderTreeNode(child, depth + 1, filter);
      }
    }
    return html;
  }

  #anyDescendantMatches(node, filter) {
    if ((node.category.name ?? '').toLowerCase().includes(filter)) return true;
    return node.children.some(c => this.#anyDescendantMatches(c, filter));
  }

  #renderTable() {
    const tableProduct = this.#args.target.querySelector('#tableProduct>tbody');
    let working = this.#allProductsRaw;
    if (this.#selectedCategoryId != null) {
      const subtree = this.#getCategorySubtreeIds(this.#selectedCategoryId);
      working = working.filter(p => subtree.has(p.categoryId));
    }
    this.#productList = this.#dedupeByUid(working);
    tableProduct.innerHTML = this.#htmlBuild();
    this.#updateSortIcons();
    this.#loadThumbnails();
  }

  #dedupeByUid(list) {
    const seen = new Set();
    return (list || []).filter(p => {
      if (seen.has(p.productUid)) return false;
      seen.add(p.productUid);
      return true;
    });
  }

  #htmlBuild() {
    let html = '';
    for (const product of this.#filteredSortedList()) {
      const thumbCell = product._thumbUrl
        ? `<img src="${product._thumbUrl}" class="product-thumb rounded" alt="">`
        : `<div data-thumb-uid="${product.productUid}" class="product-thumb-placeholder"></div>`;
      const stock = product.stock ?? 0;
      const pillClass = stock <= 5 ? 'text-bg-danger' : (stock <= 20 ? 'text-bg-warning' : 'text-bg-success');
      html += `
        <tr data-product-id="${product.productUid}">
          <td class="element-clickable">
            <div class="d-flex align-items-center gap-3">
              ${thumbCell}
              <span>${product.name ?? ''}</span>
            </div>
          </td>
          <td class="element-clickable">${product.charcode ?? ''}</td>
          <td><span class="badge ${pillClass}">${stock}</span></td>
          <td class="text-end">
            <span class="row-actions">
              <a href="#productdetail?id=${product.productUid}"
                 class="btn btn-sm border-0"
                 title="Edit"
                 data-edit><i class="bi-pencil"></i></a>
              <button type="button"
                      class="btn btn-sm border-0 text-danger"
                      data-action="del"
                      data-id="${product.productUid}"
                      title="Delete"><i class="bi-trash"></i></button>
            </span>
          </td>
        </tr>
      `;
    }
    return html;
  }

  #filteredSortedList() {
    let list = this.#productList || [];
    if (this.#search) {
      const q = this.#search;
      list = list.filter(p =>
        (p.name ?? '').toLowerCase().includes(q) ||
        (p.charcode ?? '').toLowerCase().includes(q)
      );
    }
    if (!this.#sort.key) return list;
    const { key, dir } = this.#sort;
    const factor = dir === 'asc' ? 1 : -1;
    // numeric: true keeps "P-2" before "P-10"; sensitivity 'base' makes it case-insensitive.
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    return [...list].sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (key === 'stock') return ((va ?? 0) - (vb ?? 0)) * factor;
      return collator.compare(String(va ?? ''), String(vb ?? '')) * factor;
    });
  }

  #loadThumbnails() {
    const placeholders = this.#args.target.querySelectorAll('[data-thumb-uid]');
    for (const ph of placeholders) {
      const uid = ph.dataset.thumbUid;
      const product = this.#productList?.find(p => p.productUid === uid);
      if (!product || product._thumbLoading || product._thumbUrl || product._noImage) continue;
      product._thumbLoading = true;
      this.#args.app.apiGet((files) => {
        product._thumbLoading = false;
        const img = (files || []).find(f => (f.mediaType || '').startsWith('image/'));
        if (!img) {
          product._noImage = true;
          return;
        }
        product._thumbUrl = img.contentUrl;
        const node = this.#args.target.querySelector(`[data-thumb-uid="${CSS.escape(uid)}"]`);
        if (node) {
          node.outerHTML = `<img src="${img.contentUrl}" class="product-thumb rounded" alt="">`;
        }
      }, () => {
        product._thumbLoading = false;
      }, `/product/${encodeURIComponent(uid)}/filedata`);
    }
  }

  #updateSortIcons() {
    const icons = this.#args.target.querySelectorAll('[data-sort-icon]');
    for (const icon of icons) {
      const active = icon.dataset.sortIcon === this.#sort.key;
      icon.classList.toggle('bi-chevron-expand', !active);
      icon.classList.toggle('text-secondary', !active);
      icon.classList.toggle('bi-caret-up-fill', active && this.#sort.dir === 'asc');
      icon.classList.toggle('bi-caret-down-fill', active && this.#sort.dir === 'desc');
    }
  }
  //#endregion
}