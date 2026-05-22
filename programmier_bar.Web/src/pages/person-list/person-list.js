import HTML from './person-list.html';

export default class pPersonList {
  constructor(args) {
    args.target.innerHTML = HTML;

    const tablePerson = args.target.querySelector('#tablePerson>tbody');
    let personList = null;

    tablePerson.addEventListener('click', (e) => {
      let btn = null;
      let tr = e.target;

      while (tr.nodeName != 'TR' && tr.parentElement) tr = tr.parentElement;
      if (e.target.nodeName == 'I' && e.target.parentElement.nodeName == 'BUTTON') btn = e.target.parentElement;
      else if (e.target.nodeName == 'BUTTON') btn = e.target;

      if (btn) {
        const person = personList.filter(p => p.personId == btn.dataset.id)[0];
        if (confirm('Are you sure you want to delete ' + person.surname + ' ' + person.forename + ' ?')) {
          args.app.apiDelete((r) => {
            if (r.success) tr.remove();
          }, (ex) => {
            alert(ex);
          }, '/person/' + person.personId);
        }
      } else {
        if (tr && tr.dataset.id) {
          window.open('#persondetail?id=' + tr.dataset.id, '_self');
        }
      }
    });

    args.app.apiGet((pl) => {
      personList = pl;
      let html = '';
      for (const p of pl) {
        html += `
          <tr data-id="${p.personId}">
            <td>
              <button type="button"
                      class="btn btn-secondary align-middle"
                      data-aktion="del"
                      data-id="${p.personId}">
                      <i class="bi-trash3"></i></button>
            </td>
            <td class="element-clickable">
              ${(p.picString
              ? `
                <div class="d-flex flex-row align-items-center">
                  <div>
                    <img src="${p.picString}"
                         style="max-width: 6rem;
                         max-height:5rem;"
                         title="profilepic" />
                  </div>
                  <div class="p-2 align-middle">
                    ${p.titlePre} ${p.surname} ${p.forename} ${p.titlePost}
                  </div>
                </div>
              `
              : `${p.titlePre} ${p.surname} ${p.forename} ${p.titlePost}`)}
            </td>
            <td class="element-clickable">${p.roleText}</td>
            <td class="element-clickable">${p.loginName}</td>
            <td class="element-clickable">${(p.loginLast ? args.app.formatDate(p.loginLast) : '')}</td>
          </tr>
        `;
      }
      tablePerson.innerHTML = html;
    }, (ex) => {
      alert(ex);
    }, '/person');
  }
}