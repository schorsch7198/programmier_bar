import './../../../node_modules/bootstrap/dist/js/bootstrap.bundle';
import ComponentHTML from './nav-bar.html';

export default class NavBar {
	constructor(args) {
		args.target.innerHTML = ComponentHTML;

		// ─── ELEMENT REFERENCES ────────────────────────────────────────────
		// grab all DOM (document object model) elements 
		const productsLink			= args.target.querySelector('ul.navbar-nav a.nav-link[href="#productlist"]');
		const liProduct         = productsLink?.closest('li');
		const ul                = args.target.querySelector('ul.navbar-nav');
		const toggleLink        = args.target.querySelector('a.dropdown-toggle');
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

		let flipped = false;
		navbarToggleBtn.addEventListener('click', () => {
			flipped = !flipped;
			// measure the gold bar’s height right now
			const goldHeight = firstNav.getBoundingClientRect().height;
			// flip the gold bar
			firstNav .classList.toggle('bottom', flipped);
			// for the second bar, flip AND dynamically pin it above the gold bar
			secondNav.classList.toggle('bottom', flipped);
			if (flipped) {
				secondNav.style.bottom = `${goldHeight}px`;
				secondNav.style.top    = 'auto';
			} else {
				secondNav.style.top    = `${goldHeight}px`;
				secondNav.style.bottom = 'auto';
			}
			// swap the chevron
			navbarToggleIcon.className = flipped
				? 'bi bi-chevron-down fs-4'
				: 'bi bi-chevron-up   fs-4';
		});

		// ─── LOGGED-OUT STATE ───────────────────────────────────────────────
		// when logged out: turn icon into a simple "#login" link
		if (!args.app.user) {
			toggleLink.removeAttribute('data-bs-toggle');
			toggleLink.removeAttribute('aria-expanded');
			toggleLink.setAttribute('href', '#login');
			productsLink?.remove();
			liProduct?.remove();
			dropdownMenu.remove();
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
}