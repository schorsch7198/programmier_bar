import PageHTML from './p-login.html';

export default class pLogin {

  #args = null;
  constructor(args) {
    this.#args = args;
    args.target.innerHTML = PageHTML;

    //--------------------------------------------------
    const textUsername      = this.#args.target.querySelector('#textUsername');
    const textPassword      = args.target.querySelector('#textPassword');
    // const checkboxRemember  = args.target.querySelector('#checkboxRemember');
    const buttonSubmit      = args.target.querySelector('#buttonSubmit');

    //--------------------------------------------------
    // events
    //--------------------------------------------------
    // Enter key on password to trigger login
    textPassword.addEventListener( 'keyup', (e) => {
      if (e.key == 'Enter') {
        this.#login();
      }
    });
    // Click on button to trigger login
    buttonSubmit.addEventListener( 'click', () => {
      this.#login();
    });

    //--------------------------------------------------
    // init
    //--------------------------------------------------
    const loginData = localStorage.getItem('programmier_bar-logindata');
    if (loginData) {
      const ld = JSON.parse(loginData);
      textUsername.value = ld.loginName;
    }
  } // constructor

  #login() {
    const textUsername      = this.#args.target.querySelector('#textUsername');
    const textPassword      = this.#args.target.querySelector('#textPassword');
    const checkboxRemember  = this.#args.target.querySelector('#checkboxRemember');
    const alertMessage      = this.#args.target.querySelector('#alertMessage');

    alertMessage.classList.add('d-none');

    // let d = new Date();
    // let o = d.getTimezoneOffset() * 60000;
    // let x = new Date(d.getTime() - o);
    // let i = x.toISOString();

    if (checkboxRemember.checked) {
      const p = {
        loginName: textUsername.value,
        date: new Date().toISOString()
      };
      localStorage.setItem('programmier_bar-logindata', JSON.stringify(p));
    }

    //   // log out the pairs so you can see them in DevTools - for seeing username/password in browser console
    //   for (const [key, val] of loginData.entries()) {
    //     console.log(key, val);
    //   }


    if (textUsername.value && textPassword.value) {
      const loginData = new FormData();
      loginData.append('username', textUsername.value);
      loginData.append('password', textPassword.value);

      this.#args.app.apiLogin((r) => {
        if (r.success) {
//       localStorage.setItem('programmier_bar-token', r.loginToken);
          this.#args.app.user = r.person;
          if (r.person.roleNumber === 0) {
            window.open("#main", '_self');
          } else {
            window.open('#productlist', '_self');
          // location.hash = '#main';
          }
        } else {
          alertMessage.innerText = r.message;
          alertMessage.classList.remove('d-none');
        }
      }, (ex) => {
        alert(ex);
      }, loginData);
    }


    // // build URL-encoded body:
    // const loginData = new URLSearchParams();
    // loginData.append('username', textUsername.value);
    // loginData.append('password', textPassword.value);

    // // fetch will automatically send as application/x-www-form-urlencoded
    // this.#args.app.apiLogin((r) => {
    //   if (r.success) {
    //     this.#args.app.user = r.person;
    //     location.hash = 'productlist';
    //   } else {
    //     alertMessage.innerText = r.message;
    //     alertMessage.classList.remove('d-none');
    //   }
    // }, (ex) => {
    //   alert(ex);
    // }, loginData);
  }
} // class
//