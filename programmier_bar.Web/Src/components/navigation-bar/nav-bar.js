//import 'bootstrap';
import './../../../node_modules/bootstrap/dist/js/bootstrap.bundle';
// import 'bootstrap/dist/js/bootstrap.bundle';

import ComponentHTML from './nav-bar.html';

export default class NavigationBar {

  constructor(args) {
    args.target.innerHTML = ComponentHTML;
    //--------------------------------------------------------------------------------------
    const ul = args.target.querySelector('ul');
    const infoTextUserName = args.target.querySelector('#infoTextUserName');
    const dropdownMenuPerson = args.target.querySelector('#dropdownMenuPerson');
    const imgpic = args.target.querySelector('#imgBild');
    const buttonSignOff = args.target.querySelector('#buttonSignOff');

    //--------------------------------------------------------------------------------------
    // events
    //--------------------------------------------------------------------------------------
    dropdownMenuPerson.addEventListener( 'click', () => {
      window.open('#persondetail?id=' + args.app.user.personId, '_self');
    });

    buttonSignOff.addEventListener( 'click', (e) => {
      e.stopPropagation();
      if (confirm("Are you sure u want to sign off?")) {
        args.app.apiGet((r) => {
          if (r.success) {
            args.app.user = null;
            window.open('#main', '_self');
          }
        }, (ex) => {
          alert(ex);
        }, '/page/logout');
      }
    });

    //--------------------------------------------------------------------------------------
    // init
    //--------------------------------------------------------------------------------------

    infoTextUserName.innerText = (args.app.user.titlePre ? args.app.user.titlePre + ' ' : '') + args.app.user.forename + ' ' + args.app.user.surname + (args.app.user.titlePost ? ' ' + args.app.user.titlePost : '');
    if (args.app.user.picStr) imgpic.src = args.app.user.picStr;

    if (args.app.user.roleNumber >= 1) {
      const li = document.createElement('LI');
      li.classList.add('nav-item');
      li.style.paddingTop = '0.2rem';
      li.innerHTML = '<a class="nav-link" style="font-size: 1.5rem;" href="#categories"><i class="bi-tags-fill"></i>Categories</a>';
      ul.appendChild(li);
    }

    if (args.app.user.roleNumber >= 2) {
      const li = document.createElement('LI');
      li.classList.add('nav-item');
      li.style.paddingTop = '0.2rem';
      li.innerHTML = '<a class="nav-link" style="font-size: 1.5rem;" href="#personlist"><i class="bi-person-fill"></i>Users</a>';
      ul.appendChild(li);
    }
  }
}