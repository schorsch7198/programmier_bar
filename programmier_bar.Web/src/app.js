import 'bootstrap/dist/js/bootstrap.bundle';


import NavBar         from "@widgets/nav-bar/nav-bar";

import pLogin          from "@pages/login/login";
import pMain           from "@pages/home/home";
import pProductList    from "@pages/product-list/product-list";
import pProductDetail  from "@pages/product-detail/product-detail";
import pCategories     from "@pages/categories/categories";
import pPersonDetail   from "@pages/person-detail/person-detail";
import pPersonList     from "@pages/person-list/person-list";
import pCart           from "@pages/cart/cart";
import pShop           from "@pages/shop/shop";
import pShopItem       from "@pages/shop-item/shop-item";

import * as api       from "@shared/api/client";
import { formatDate } from "@shared/lib/format";
import { readLocalCart, clearLocalCart } from "@entities/cart/model";

export default class Application {
  //#region private vars
  #header = null;
  #main = null;
  #footer = null;
  #apiUrl = `${location.protocol}//${location.hostname}:5181`;  // Same hostname as the page → same-site cookie flow
  #user = null;
  #currentNavBar = null;
  //#endregion

  //#region constructor
  constructor() {
    this.#header = document.querySelector('header');
    this.#main = document.querySelector('main');
    this.#footer = document.querySelector('footer');

    window.addEventListener('hashchange', () => {
      this.#navigate(location.hash);
    });

    if (document.cookie && document.cookie.startsWith('logintoken=')) {
      this.apiGet((r) => {
        this.#user = r;
        this.#navigate(location.hash);
      }, (ex) => {
        console.error(ex);
        // Stale/invalid logintoken: clear it so subsequent loads skip the failing /page/init call.
        document.cookie = 'logintoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        this.#navigate(location.hash);
      }, '/page/init');
    } else {
      this.#navigate(location.hash);
    }
  }
  //#endregion

  //#region properties
  get user() { return this.#user; }
  set user(v) { this.#user = v; }
  get apiUrl() { return this.#apiUrl; }
  //#endregion

  //#region private methods
  #navigate(completeHash) {
    this.#main.innerHTML = '';

    // Tear the previous navbar down first so its window listeners (cart:changed, category:changed) don't accumulate.
    this.#currentNavBar?.destroy?.();
    this.#header.innerHTML = '';
    this.#currentNavBar = new NavBar({ target: this.#header, app: this });

    const args = { target: this.#main, app: this };
    const hashParts = completeHash.split('?');
    let hash = completeHash;
    if (hashParts.length > 1) {
      hash = hashParts[0];
      const usp = new URLSearchParams(hashParts[1]);
      for (const [key, value] of usp) args[key] = value;
    }

    switch(hash) {
      case '#login':
        new pLogin(args);
        break;
      case '#productlist':
        // Admin/disponent edit-oriented list. Customers go to the storefront instead.
        if (this.user?.roleNumber > 0) {
          new pProductList(args);
        } else {
          window.open('#shop', '_self');
        }
        break;
      case '#shop':
        new pShop(args);
        break;
      case '#shop-item':
        new pShopItem(args);
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
      case '#cart':
        // Anonymous users allowed; the page handles the auth-aware UX.
        new pCart(args);
        break;
      default:
        new pMain(args);
        break;
    }
  }
  //#endregion

  //#region public methods
  apiLogin(successCallback, errorCallback, loginData) {
    api.apiLogin(this.#apiUrl, successCallback, errorCallback, loginData);
  }

  apiGet(successCallback, errorCallback, url) {
    api.apiGet(this.#apiUrl, successCallback, errorCallback, url);
  }

  apiSet(successCallback, errorCallback, url, id, dataObject) {
    api.apiSet(this.#apiUrl, successCallback, errorCallback, url, id, dataObject);
  }

  apiDelete(successCallback, errorCallback, url) {
    api.apiDelete(this.#apiUrl, successCallback, errorCallback, url);
  }

  apiFiledata(successCallback, errorCallback, product, fileList) {
    api.apiFiledata(this.#apiUrl, successCallback, errorCallback, product, fileList);
  }

  formatDate(d) {
    return formatDate(d);
  }

  // Called by the login page after authentication: merges any anonymous (localStorage) cart into the user's server cart.
  syncLocalCart() {
    const items = readLocalCart();
    if (items.length === 0) return;
    api.apiSet(
      this.#apiUrl,
      () => {
        clearLocalCart();
        window.dispatchEvent(new CustomEvent('cart:changed'));
      },
      (ex) => console.error('cart sync failed', ex),
      '/cart/sync', null, items
    );
  }
  //#endregion
}