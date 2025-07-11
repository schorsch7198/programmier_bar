import 'bootstrap/dist/js/bootstrap.bundle';


import NavBar         from "./components/navigation-bar/nav-bar";

import pLogin          from "./p-login";
import pMain           from "./p-main";
import pProductList    from "./p-product-list";
import pProductDetail  from "./p-product-detail";
import pCategories     from "./p-categories";
import pPersonDetail   from "./p-person-detail";
import pPersonList     from "./p-person-list";

export default class Application {
  #header = null;
  #main = null;
  #footer = null;
  #apiUrl = 'http://localhost:5181';  // Base URL for API requests
  #user = null;

  constructor() {
    this.#header = document.querySelector('header');
    this.#main = document.querySelector('main');
    this.#footer = document.querySelector('footer');

    window.addEventListener('hashchange', () => {     // Re-run navigation on URL hash change
      this.#navigate(location.hash);
    });

    if (document.cookie && document.cookie.startsWith('logintoken=')) {
      this.apiGet((r) => {
        this.#user = r;
        this.#navigate(location.hash);
      }, (ex) => {
        console.error(ex);
        this.#navigate('#login');
      }, '/page/init');
    } else {
      this.#navigate(location.hash);
    }
  } // constructor

  get user() { return this.#user; }
  set user(v) { this.#user = v; }
  get apiUrl() { return this.#apiUrl; }

  #navigate(completeHash) {
    this.#main.innerHTML = '';        // Clear main content

    // if (!this.#user) {
    //   this.#header.innerHTML = '';   // Hide header if not logged in
    // } else {
    //   new pNavBar({ target: this.#header, app: this });   // Render navigation bar if user exists
    // }

    // Always render navbar (even if args.app.user is null)
    this.#header.innerHTML = '';
    new NavBar({ target: this.#header, app: this });

    const args = { target: this.#main, app: this }; // Prepare args for page components
    const hashParts = completeHash.split('?');      // Separate hash from query parameters
    let hash = completeHash;
    if (hashParts.length > 1) {
      hash = hashParts[0];
      const usp = new URLSearchParams(hashParts[1]);
      for (const [key, value] of usp) args[key] = value;    // Add query params to args
    }

    switch(hash) {
      case '#login':
        new pLogin(args);
        break;
      case '#productlist':
        // if (this.user) new pProductList(args);    // Show article list if logged in
        // else window.open('#login', '_self');         // Otherwise redirect to login
          // only allow elevated users (role ≥1) to see the product list
        if (this.user?.roleNumber > 0) {
          new pProductList(args);
        } else {
          // guests & standard users return to home
          window.open('#main','_self');
        }
        break;
      case '#categories':
        if (this.user) new pCategories(args);
        else window.open('#login', '_self');
        break;
      case '#productdetail':
        if (this.user) new pProductDetail(args);
        else window.open('#login', '_self');
        break;
      case '#persondetail':
        if (this.user) new pPersonDetail(args);
        else window.open('#login', '_self');
        break;
      case '#personlist':
        if (this.user) new pPersonList(args);
        else window.open('#login', '_self');
        break;
      default:
        new pMain(args);     // Default: show main (home) page
        break;
    }
  }

  // public methods
  //============================================================================================================================
  apiLogin(successCallback, errorCallback, loginData) {
    fetch(this.#apiUrl + '/person/login', {
      method: 'POST',
      body: loginData,
      cache: 'no-cache',
      credentials: 'include'
    }).then((r) => {
      if (r.status == 200 || r.status == 401) return r.json();  // Parse JSON on 200 or 401
      throw new Error(r.status + ' ' + r.statusText);
    }).then(successCallback).catch(errorCallback);              // Call callbacks based on result
  }

  apiGet(successCallback, errorCallback, url) {
    const token = localStorage.getItem('programmier_bar-token');
    fetch(this.#apiUrl + url, {
      method: 'GET',
      cache: 'no-cache',
      credentials: 'include',
      headers: {
        ...(token && { 'Authorization': 'Bearer ' + token })
      }
    }).then((r) => {
      if (r.status == 200) return r.json();                     // Parse JSON only on 200
      throw new Error(r.status + ' ' + r.statusText);
    }).then(successCallback).catch(errorCallback);              // Call callbacks based on result
  }

    // POST => insert new resource; PUT => update existing resource
  apiSet(successCallback, errorCallback, url, id, dataObject) {
    const token = localStorage.getItem('programmier_bar-token');
    fetch(this.#apiUrl + url + (id ? '/' + id : ''), {
      method: id ? 'PUT' : 'POST',
      cache: 'no-cache',
      credentials: 'include',
      body: JSON.stringify(dataObject),
      headers: { 'Content-Type': 'application/json',
        ...(token && { 'Authorization': 'Bearer ' + token })
      }
    }).then((r) => {
      if (r.status == 200) return r.json();                     // Parse JSON only on 200
      throw new Error(r.status + ' ' + r.statusText);
    }).then(successCallback).catch(errorCallback);              // Call callbacks based on result
  }

  apiDelete(successCallback, errorCallback, url) {
    const token = localStorage.getItem('programmier_bar-token');
    fetch(this.#apiUrl + url, {
      method: 'DELETE',
      cache: 'no-cache',
      credentials: 'include',
      headers: {
        ...(token && { 'Authorization': 'Bearer ' + token })
      }
    }).then((r) => {
      if (r.status == 200) return r.json();                     // Parse JSON only on 200
      throw new Error(r.status + ' ' + r.statusText);
    }).then(successCallback).catch(errorCallback);              // Call callbacks based on result
  }


  apiFiledata(successCallback, errorCallback, product, dateiListe) {
    const fd = new FormData();                              // Create FormData for files
    let idx = 0;
    for (const d of filedataList) {
      fd.append('filedata' + (idx++), d, d.name);               // Append each file with a unique field name
    }
    fetch(this.#apiUrl + '/product/' + product.productUid + '/filedata', {
      method: 'POST',
      cache: 'no-cache',
      credentials: 'include',
      body: fd
    }).then((r) => {
      if (r.status == 200) return r.json();                   // Parse JSON only on 200
      throw new Error(r.status + ' ' + r.statusText);
    }).then(successCallback).catch(errorCallback);            // Call callbacks based on result
  }

  formatDate(d) {
    const dateFormat = new Intl.DateTimeFormat(navigator.language, {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: false
    });

    try {
      if (!d) return '-';

      const parsed = d instanceof Date ? d : new Date(d);
      return isNaN(parsed.getTime()) ? '-' : dateFormat.format(parsed);
    } catch {
      return '-';
    }
  }
}
