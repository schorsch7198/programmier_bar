import 'bootstrap/dist/js/bootstrap.bundle';


import pNavBar      from "./components/navigation-bar/nav-bar";  // Import navigation bar component

import pLogin                from "./p-login";                          // Import login page
import pMain                 from "./p-main";                           // Import main (home) page
import pProductList          from "./p-product-list";                   // Import article list page
import pProductDetail        from "./p-product-detail";                 // Import article detail page
import pCategories           from "./p-categories";                     // Import category management page
import pPersonDetail         from "./p-person-detail";                  // Import person detail page
import pPersonList           from "./p-person-list";                    // Import person list page

export default class Application {
  #header = null;                             // Reference to <header> element
  #main = null;                               // Reference to <main> element
  #footer = null;                             // Reference to <footer> element
  #apiUrl = 'http://localhost:5181';          // Base URL for API requests
  #user = null;                               // Currently authenticated user

  constructor() {
    this.#header = document.querySelector('header');       // Grab header from DOM
    this.#main = document.querySelector('main');           // Grab main from DOM
    this.#footer = document.querySelector('footer');       // Grab footer from DOM

    window.addEventListener('hashchange', () => {          // Re-run navigation on URL hash change
      this.#navigate(location.hash);
    });

    if (document.cookie && document.cookie.startsWith('logintoken=')) {   // If login token cookie exists
      this.apiGet((r) => {
        this.#user = r;                                    // Set user on successful init
        this.#navigate(location.hash);                     // Navigate after successful init
      }, (ex) => {
        console.error(ex);
        this.#navigate('#login');                          // Redirect to login if init fails
      }, '/page/init');
    } else {
      this.#navigate(location.hash);                       // Navigate immediately if no token
    }
  } // constructor

  get user() { return this.#user; }               // Getter for user
  set user(v) { this.#user = v; }                 // Setter for user
  get apiUrl() { return this.#apiUrl; }            // Getter for API URL

  #navigate(completeHash) {
    this.#main.innerHTML = '';                     // Clear main content
    if (!this.#user) this.#header.innerHTML = '';   // Hide header if not logged in
    else {
      new pNavBar({ target: this.#header, app: this });   // Render navigation bar if user exists
    }

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
        new pLogin(args);                         // Show login page
        break;
      case '#productlist':
        if (this.user) new pProductList(args);    // Show article list if logged in
        else window.open('#login', '_self');         // Otherwise redirect to login
        break;
      case '#categories':
        if (this.user) new pCategories(args);  // Show category management if logged in
        else window.open('#login', '_self');                 // Otherwise redirect
        break;
      case '#productdetail':
        if (this.user) new pProductDetail(args);  // Show article detail if logged in
        else window.open('#login', '_self');         // Otherwise redirect
        break;
      case '#persondetail':
        if (this.user) new pPersonDetail(args);   // Show person detail if logged in
        else window.open('#login', '_self');         // Otherwise redirect
        break;
      case '#personlist':
        if (this.user) new pPersonList(args);     // Show person list if logged in
        else window.open('#login', '_self');         // Otherwise redirect
        break;
      default:
        new pMain(args);                          // Default: show main (home) page
        break;
    }
  }

  //============================================================================================================================
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
