import 'bootstrap/dist/js/bootstrap.bundle';
import ComponentHTML from './nav-bar.html';
import { readLocalCart, totalItemCount } from '@entities/cart/model';
import SearchBox from '@widgets/search-box/search-box';

export default class NavBar {
	#refreshBadge = null;
	#refreshCategories = null;
	#resizeObserver = null;
	#searchBox = null;

	constructor(args) {
		args.target.innerHTML = ComponentHTML;

		// ─── ELEMENT REFERENCES ────────────────────────────────────────────
		// grab all DOM (document object model) elements 
		const productsLink			= args.target.querySelector('ul.navbar-nav a.nav-link[href="#productlist"]');
		const liProduct         = productsLink?.closest('li');
		const ul                = args.target.querySelector('ul.navbar-nav');
		const dropdownMenu      = args.target.querySelector('#dropdownMenuPerson');
		const buttonSignIn      = args.target.querySelector('#buttonSignIn');
		const buttonSignOff     = args.target.querySelector('#buttonSignOff');
		const infoTextUserName  = args.target.querySelector('#infoTextUserName');
		const imgPic            = args.target.querySelector('#imgPic');
		const navbarToggleBtn  	= args.target.querySelector('#navbarToggle');
		const navbarToggleIcon 	= args.target.querySelector('#navbarToggleIcon');
		const firstNav  = document.getElementById('firstNavbar');
		const secondNav = document.getElementById('secondNavbar');

		// conditional <li> elements
		const liCategories      = document.createElement('li');
		liCategories.className  = 'nav-item align-self-center';
		liCategories.innerHTML  = `
			<a 	class="nav-link" 
					style="font-size: 1.5rem;" 
					href="#categories">
				<i 	class="bi-tags-fill fs-4"></i>
				 		Categories
			</a>`;
		if (args.app.user?.roleNumber >= 1) ul.appendChild(liCategories);

		const liUsers           = document.createElement('li');
		liUsers.className       = 'nav-item align-self-center';
		liUsers.innerHTML       = `
			<a 	class="nav-link"
					style="font-size: 1.5rem;"
					href="#personlist">
				<i 	class="bi-person-fill fs-3"></i>
				 		Users
			</a>`;
		if (args.app.user?.roleNumber >= 2) ul.appendChild(liUsers);

		// ─── SHOP LINK (visible to all) ─────────────────────────────────────
		const liShop            = document.createElement('li');
		liShop.className        = 'nav-item align-self-center';
		liShop.innerHTML        = `
			<a 	class="nav-link"
					style="font-size: 1.5rem;"
					href="#shop"
					title="Shop">
				<i 	class="bi-shop fs-3"></i>
				 		Shop
			</a>`;
		ul.appendChild(liShop);

		// ─── CART LINK (visible to all; badge shows item count) ────────────
		const liCart            = document.createElement('li');
		liCart.className        = 'nav-item align-self-center';
		liCart.innerHTML        = `
			<a 	class="nav-link"
					style="font-size: 1.5rem;"
					href="#cart"
					title="Cart">
				<i 	class="bi-cart3 fs-3"></i>
				 		Cart
				<span id="cartBadge" class="badge bg-primary rounded-pill ms-1 d-none">0</span>
			</a>`;
		ul.appendChild(liCart);

		const cartBadge = liCart.querySelector('#cartBadge');
		const updateBadge = (count) => {
			if (count > 0) {
				cartBadge.textContent = count;
				cartBadge.classList.remove('d-none');
			} else {
				cartBadge.classList.add('d-none');
			}
		};
		this.#refreshBadge = () => {
			if (args.app.user) {
				args.app.apiGet(
					(cart) => updateBadge(totalItemCount(cart?.itemList || [])),
					() => updateBadge(0),
					'/cart'
				);
			} else {
				updateBadge(totalItemCount(readLocalCart()));
			}
		};
		this.#refreshBadge();
		window.addEventListener('cart:changed', this.#refreshBadge);

		// ─── DYNAMIC CATEGORY DROPDOWNS (second nav-bar) ────────────────────
		this.#renderCategoryDropdowns(args);
		this.#refreshCategories = () => this.#renderCategoryDropdowns(args);
		window.addEventListener('category:changed', this.#refreshCategories);

		// ─── SEARCH BOX (second nav-bar) ────────────────────────────────────
		const searchMount = args.target.querySelector('#navbarSearchMount');
		if (searchMount) {
			this.#searchBox = new SearchBox({ target: searchMount, app: args.app });
		}


		// ─── THEME TOGGLE SETUP ─────────────────────────────────────────────
		const themeToggleBtn  = args.target.querySelector('#themeToggle');
		const themeToggleIcon = args.target.querySelector('#themeToggleIcon');
		// the <nav> itself, so we can swap .navbar-light / .navbar-dark
		const navEl           = args.target.querySelector('nav.navbar');
		// helper to apply a theme name ("dark" or "light")
		function applyTheme(theme) {
			// 1) set the Bootstrap theme attribute
			document.body.setAttribute('data-bs-theme', theme);
			// 2) swap navbar text/icon style
			if (theme === 'dark') {
				navEl.classList.remove('navbar-light');
				navEl.classList.add('navbar-dark');
				themeToggleIcon.className = 'bi bi-moon-stars-fill fs-4';
			} else {
				navEl.classList.remove('navbar-dark');
				navEl.classList.add('navbar-light');
				themeToggleIcon.className = 'bi bi-sun-fill fs-4';
			}
		}
		// 3) initialize from localStorage or fallback to body’s current
		let currentTheme = localStorage.getItem('theme')
										|| document.body.getAttribute('data-bs-theme')
										|| 'dark';
		applyTheme(currentTheme);
		// 4) wire up the toggle button
		themeToggleBtn.addEventListener('click', () => {
			currentTheme = (currentTheme === 'dark' ? 'light' : 'dark');
			applyTheme(currentTheme);
			localStorage.setItem('theme', currentTheme);
		});

		// Apply the flipped/unflipped layout. Extracted so we can both restore
		// the persisted state on mount and use it from the click handler.
		const applyFlipped = (flipped) => {
			const goldHeight   = firstNav .getBoundingClientRect().height;
			const secondHeight = secondNav.getBoundingClientRect().height;
			firstNav .classList.toggle('bottom', flipped);
			secondNav.classList.toggle('bottom', flipped);
			if (flipped) {
				secondNav.style.bottom = `${goldHeight}px`;
				secondNav.style.top    = 'auto';
				// Push page content away from the bottom navbars (add breathing room).
				document.body.style.paddingTop    = '0';
				document.body.style.paddingBottom = `${goldHeight + secondHeight + 24}px`;
			} else {
				secondNav.style.top    = `${goldHeight}px`;
				secondNav.style.bottom = 'auto';
				// Restore the defaults from index.html.
				document.body.style.paddingTop    = '7rem';
				document.body.style.paddingBottom = '4.5rem';
			}
			navbarToggleIcon.className = flipped
				? 'bi bi-chevron-down fs-4'
				: 'bi bi-chevron-up   fs-4';
		};

		// Restore previously chosen position (only apply when actually flipped,
		// so the default HTML/CSS top stays untouched in the normal case).
		let flipped = localStorage.getItem('navbarFlipped') === 'true';
		if (flipped) applyFlipped(true);

		// Category dropdowns load asynchronously, so the second navbar's height
		// grows after mount. Re-apply on any size change so body padding stays
		// in sync. Also handles window resize.
		if ('ResizeObserver' in window) {
			this.#resizeObserver = new ResizeObserver(() => {
				if (flipped) applyFlipped(true);
			});
			this.#resizeObserver.observe(firstNav);
			this.#resizeObserver.observe(secondNav);
		}

		navbarToggleBtn.addEventListener('click', () => {
			flipped = !flipped;
			applyFlipped(flipped);
			localStorage.setItem('navbarFlipped', String(flipped));
		});

		// ─── LOGGED-OUT STATE ───────────────────────────────────────────────
		// Hide the user-menu icon entirely; only the "Sign in" button is shown.
		if (!args.app.user) {
			dropdownMenu.closest('.dropdown')?.classList.add('d-none');
			productsLink?.remove();
			liProduct?.remove();
			return;
		}

		if (args.app.user.roleNumber === 0) {
			// 1) remove Products
			liProduct?.remove();
		}
		

		// ─── EVENTS (when LOGGED IN) ────────────────────────────────────────────────────────
		// when logged in: wire up dropdown & sign-off button
		dropdownMenu.addEventListener('click', e => {
			e.stopPropagation();  // prevent dropdown from closing
			location.hash = '';
			
			window.open('#persondetail?id=' + args.app.user.personId, '_self');
		});

		// SIGN OFF
		buttonSignOff.addEventListener('click', e => {
			e.stopPropagation();
			if (!confirm('Are you sure you want to sign off?')) return;
			args.app.apiGet(
				r => {
					if (r.success) {
						args.app.user = null;
						location.hash = '';
						location.hash = '#main';
						// window.location.reload();
						// window.open('#main', '_self');  // same like line 48
					}
				},
				err => alert(err),
				'/page/logout'
			);
		});

		// ─── INITIALIZATION (when LOGGED IN) ──────────────────────────────────────────────		
		infoTextUserName.innerText = [
			args.app.user?.titlePre,
			args.app.user?.forename,
			args.app.user?.surname,
			args.app.user?.titlePost
		].filter(Boolean).join(' ');
		
		if (args.app.user?.picString)
			imgPic.src = args.app.user.picString;
			buttonSignIn.classList.add('d-none');  // hide sign-in button
	}

	// Detach window listeners so Application can recreate the navbar without leaking.
	destroy() {
		if (this.#refreshBadge) {
			window.removeEventListener('cart:changed', this.#refreshBadge);
			this.#refreshBadge = null;
		}
		if (this.#refreshCategories) {
			window.removeEventListener('category:changed', this.#refreshCategories);
			this.#refreshCategories = null;
		}
		if (this.#resizeObserver) {
			this.#resizeObserver.disconnect();
			this.#resizeObserver = null;
		}
		if (this.#searchBox) {
			this.#searchBox.destroy();
			this.#searchBox = null;
		}
	}

	// Populate #navbarCategories from the category table. Top-level → dropdown buttons,
	// their direct children → dropdown items. Top-level click navigates to the listing
	// (per the design choice); CSS makes the dropdown open on hover (desktop) / show
	// inline (mobile).
	#renderCategoryDropdowns(args) {
		args.app.apiGet((categories) => {
			const list = Array.isArray(categories) ? categories : [];
			const top = list
				.filter((c) => c.categoryRefId == null)
				.sort((a, b) => (a.ranking ?? 0) - (b.ranking ?? 0));

			const ul = args.target.querySelector('#navbarCategories');
			if (!ul || top.length === 0) return;
			ul.innerHTML = '';

			for (const t of top) {
				const children = list
					.filter((c) => c.categoryRefId === t.categoryId)
					.sort((a, b) => (a.ranking ?? 0) - (b.ranking ?? 0));

				const itemsHtml = children.length > 0
					? children
						.map((ch) =>
							`<li><a class="dropdown-item" href="#shop?cat=${ch.categoryId}">` +
							`${this.#escape(ch.name)}</a></li>`)
						.join('')
					: '<li><span class="dropdown-item text-muted small">No subcategories</span></li>';

				const li = document.createElement('li');
				li.className = 'nav-item dropdown';
				li.innerHTML = `
					<a class="nav-link dropdown-toggle" href="#shop?cat=${t.categoryId}">
						${this.#escape(t.name)}
					</a>
					<ul class="dropdown-menu">
						${itemsHtml}
					</ul>
				`;
				ul.appendChild(li);
			}
		}, () => { /* silently leave empty on error */ }, '/category');
	}

	#escape(str) {
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}
}