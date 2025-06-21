import './../../../node_modules/bootstrap/dist/js/bootstrap.bundle';
import ComponentHTML from './nav-bar.html';

export default class NavBar {
	constructor(args) {
		args.target.innerHTML = ComponentHTML;

		// ─── ELEMENT REFERENCES ────────────────────────────────────────────
		// grab all DOM (document object model) elements 
		const productsLink			= args.target.querySelector('ul.navbar-nav a.nav-link[href="#productlist"]');
		const ul                = args.target.querySelector('ul.navbar-nav');
		const toggleLink        = args.target.querySelector('a.dropdown-toggle');
		const dropdownMenu      = args.target.querySelector('#dropdownMenuPerson');
		const buttonSignIn      = args.target.querySelector('#buttonSignIn');
		const buttonSignOff     = args.target.querySelector('#buttonSignOff');
		const infoTextUserName  = args.target.querySelector('#infoTextUserName');
		const imgPic            = args.target.querySelector('#imgPic');

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


		// ─── LOGGED-OUT STATE ───────────────────────────────────────────────
		// when logged out: turn icon into a simple "#login" link
		if (!args.app.user) {
			toggleLink.removeAttribute('data-bs-toggle');
			toggleLink.removeAttribute('aria-expanded');
			toggleLink.setAttribute('href', '#login');
			productsLink?.remove();
			dropdownMenu.remove();
			return;
		}


		// ─── EVENTS (when LOGGED IN) ────────────────────────────────────────────────────────
		// when logged in: wire up dropdown & sign-off button
		dropdownMenu.addEventListener('click', e => {
			e.stopPropagation();  // prevent dropdown from closing
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
						location.hash = '#main';
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