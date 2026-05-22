import PageHTML from './login.html';

export default class pLogin {
  #args = null;

  constructor(args) {
    this.#args = args;
    args.target.innerHTML = PageHTML;

    const textUsername = this.#args.target.querySelector('#textUsername');
    const textPassword = args.target.querySelector('#textPassword');
    const buttonSubmit = args.target.querySelector('#buttonSubmit');

    textPassword.addEventListener('keyup', (e) => {
      if (e.key == 'Enter') this.#login();
    });
    buttonSubmit.addEventListener('click', () => this.#login());

    const loginData = localStorage.getItem('programmier_bar-logindata');
    if (loginData) {
      const ld = JSON.parse(loginData);
      textUsername.value = ld.loginName;
    }
  }

  #login() {
    const textUsername     = this.#args.target.querySelector('#textUsername');
    const textPassword     = this.#args.target.querySelector('#textPassword');
    const checkboxRemember = this.#args.target.querySelector('#checkboxRemember');
    const alertMessage     = this.#args.target.querySelector('#alertMessage');

    alertMessage.classList.add('d-none');

    if (checkboxRemember.checked) {
      const p = {
        loginName: textUsername.value,
        date: new Date().toISOString()
      };
      localStorage.setItem('programmier_bar-logindata', JSON.stringify(p));
    }

    if (textUsername.value && textPassword.value) {
      const loginData = new FormData();
      loginData.append('username', textUsername.value);
      loginData.append('password', textPassword.value);

      this.#args.app.apiLogin((r) => {
        if (r.success) {
          this.#args.app.user = r.person;
          // Merge any anonymous (localStorage) cart items into the now-authenticated server cart.
          this.#args.app.syncLocalCart();
          if (r.person.roleNumber === 0) {
            window.open('#main', '_self');
          } else {
            window.open('#productlist', '_self');
          }
        } else {
          alertMessage.innerText = r.message;
          alertMessage.classList.remove('d-none');
        }
      }, (ex) => {
        alert(ex);
      }, loginData);
    }
  }
}