import HTML from './person-list.html';

const ROLES = [
  { id: null, name: 'All',            icon: 'bi-people-fill' },
  { id: 0,    name: 'Standard',       icon: 'bi-person' },
  { id: 1,    name: 'Disponent',      icon: 'bi-person-gear' },
  { id: 2,    name: 'Administration', icon: 'bi-shield-lock' },
];

export default class pPersonList {
  //#region private vars
  #args = null;
  #personList = [];
  #selectedRoleId = null;
  #search = '';
  #sort = { key: null, dir: 'asc' };
  //#endregion

  //#region constructor
  constructor(args) {
    this.#args = args;
    args.target.innerHTML = HTML;

    const tableBody    = args.target.querySelector('#tablePerson>tbody');
    const tableHead    = args.target.querySelector('#tablePerson>thead');
    const inputSearch  = args.target.querySelector('#inputSearch');
    const roleTreeRoot = args.target.querySelector('#roleTreeRoot');

    inputSearch.addEventListener('input', () => {
      this.#search = inputSearch.value.trim().toLowerCase();
      this.#renderTable();
    });

    tableHead.addEventListener('click', (e) => {
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

    roleTreeRoot.addEventListener('click', (e) => {
      const node = e.target.closest('.role-node');
      if (!node) return;
      const v = node.dataset.roleId;
      this.#selectedRoleId = v === '' ? null : parseInt(v);
      this.#renderSidebar();
      this.#renderTable();
    });

    tableBody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action], a[data-edit]');
      if (btn) {
        if (btn.dataset.action === 'del') {
          const person = this.#personList.find(p => p.personId == btn.dataset.id);
          if (!person) return;
          const label = `${person.surname || ''} ${person.forename || ''}`.trim() || person.loginName || '';
          if (confirm(`Are you sure you want to delete ${label} ?`)) {
            args.app.apiDelete((r) => {
              if (r.success) this.#fetchAll();
              else alert(r.message);
            }, (ex) => alert(ex),
            '/person/' + person.personId);
          }
        }
        return;
      }
      if (e.target.closest('.row-actions')) return;
      const tr = e.target.closest('tr');
      if (tr?.dataset.personId) {
        window.open('#persondetail?id=' + tr.dataset.personId, '_self');
      }
    });

    this.#fetchAll();
  }
  //#endregion

  //#region private methods
  #fetchAll() {
    this.#args.app.apiGet((pl) => {
      this.#personList = pl || [];
      this.#renderSidebar();
      this.#renderTable();
    }, (ex) => alert(ex),
    '/person');
  }

  #countByRole() {
    const counts = new Map();
    counts.set(null, this.#personList.length);
    for (const p of this.#personList) {
      const r = p.roleNumber ?? null;
      counts.set(r, (counts.get(r) || 0) + 1);
    }
    return counts;
  }

  #renderSidebar() {
    const container = this.#args.target.querySelector('#roleTreeRoot');
    const counts = this.#countByRole();
    let html = '';
    for (const role of ROLES) {
      const active = this.#selectedRoleId === role.id ? 'active' : '';
      const count = counts.get(role.id) ?? 0;
      const idAttr = role.id === null ? '' : role.id;
      html += `
        <div class="role-node ${active}" data-role-id="${idAttr}">
          <i class="${role.icon} role-icon"></i>
          <span class="name">${role.name}</span>
          <span class="count">${count}</span>
        </div>
      `;
    }
    container.innerHTML = html;
  }

  #renderTable() {
    const tableBody = this.#args.target.querySelector('#tablePerson>tbody');
    let working = this.#personList;
    if (this.#selectedRoleId !== null) {
      working = working.filter(p => (p.roleNumber ?? null) === this.#selectedRoleId);
    }
    if (this.#search) {
      const q = this.#search;
      working = working.filter(p =>
        (p.surname   ?? '').toLowerCase().includes(q) ||
        (p.forename  ?? '').toLowerCase().includes(q) ||
        (p.loginName ?? '').toLowerCase().includes(q)
      );
    }
    const sorted = this.#applySort(working);
    tableBody.innerHTML = this.#buildHtml(sorted);
    this.#updateSortIcons();
  }

  #applySort(list) {
    if (!this.#sort.key) return list;
    const { key, dir } = this.#sort;
    const factor = dir === 'asc' ? 1 : -1;
    // numeric: true keeps "U-2" before "U-10"; sensitivity 'base' makes it case-insensitive.
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    return [...list].sort((a, b) => {
      let va, vb;
      switch (key) {
        case 'name':
          va = `${a.surname ?? ''} ${a.forename ?? ''}`.trim();
          vb = `${b.surname ?? ''} ${b.forename ?? ''}`.trim();
          break;
        case 'role':      va = a.roleText  ?? ''; vb = b.roleText  ?? ''; break;
        case 'loginName': va = a.loginName ?? ''; vb = b.loginName ?? ''; break;
        case 'loginLast':
          va = a.loginLast ? new Date(a.loginLast).getTime() : 0;
          vb = b.loginLast ? new Date(b.loginLast).getTime() : 0;
          return (va - vb) * factor;
        default: return 0;
      }
      return collator.compare(String(va), String(vb)) * factor;
    });
  }

  #buildHtml(list) {
    let html = '';
    for (const p of list) {
      const pic = p.picString
        ? `<img src="${p.picString}" class="person-thumb" alt="">`
        : `<div class="person-thumb-placeholder"><i class="bi-person"></i></div>`;
      const name = [p.titlePre, p.surname, p.forename, p.titlePost].filter(Boolean).join(' ');
      html += `
        <tr data-person-id="${p.personId}">
          <td class="element-clickable">
            <div class="d-flex align-items-center gap-3">
              ${pic}
              <span>${this.#escape(name)}</span>
            </div>
          </td>
          <td class="element-clickable">${this.#escape(p.roleText ?? '')}</td>
          <td class="element-clickable">${this.#escape(p.loginName ?? '')}</td>
          <td class="element-clickable">${p.loginLast ? this.#args.app.formatDate(p.loginLast) : ''}</td>
          <td class="text-end">
            <span class="row-actions">
              <a href="#persondetail?id=${p.personId}"
                 class="btn btn-sm border-0"
                 title="Edit"
                 data-edit><i class="bi-pencil"></i></a>
              <button type="button"
                      class="btn btn-sm border-0 text-danger"
                      data-action="del"
                      data-id="${p.personId}"
                      title="Delete"><i class="bi-trash"></i></button>
            </span>
          </td>
        </tr>
      `;
    }
    return html;
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

  #escape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  //#endregion
}