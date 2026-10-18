/* Brigade Blocks Addons documentation — navigation, search, theme and live examples. */
( function () {
	'use strict';

	const root = ( function () {
		const s = document.querySelector( 'script[src$="assets/docs.js"]' );
		return s
			? s.getAttribute( 'src' ).replace( /assets\/docs\.js$/, '' )
			: '';
	} )();

	/* ---------------------------------------------------------- Menu (phones) */
	const toggle = document.querySelector( '.menu-toggle' );
	const sidebar = document.getElementById( 'sidebar' );
	function setMenu( open ) {
		document.body.classList.toggle( 'nav-open', open );
		toggle.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		if ( open ) {
			const current =
				sidebar.querySelector( '[aria-current="page"]' ) ||
				sidebar.querySelector( 'a' );
			if ( current ) {
				current.focus();
			}
		}
	}
	if ( toggle && sidebar ) {
		toggle.addEventListener( 'click', function () {
			setMenu( ! document.body.classList.contains( 'nav-open' ) );
		} );
		document.addEventListener( 'keydown', function ( e ) {
			if (
				e.key === 'Escape' &&
				document.body.classList.contains( 'nav-open' )
			) {
				setMenu( false );
				toggle.focus();
			}
		} );
		document.addEventListener( 'click', function ( e ) {
			if (
				document.body.classList.contains( 'nav-open' ) &&
				! sidebar.contains( e.target ) &&
				! toggle.contains( e.target )
			) {
				setMenu( false );
			}
		} );
	}

	/* ---------------------------------------------------------- Theme */
	const themeBtn = document.querySelector( '.theme-toggle' );
	if ( themeBtn ) {
		themeBtn.addEventListener( 'click', function () {
			const current =
				document.documentElement.dataset.theme ||
				( window.matchMedia( '(prefers-color-scheme: dark)' ).matches
					? 'dark'
					: 'light' );
			const next = current === 'dark' ? 'light' : 'dark';
			document.documentElement.dataset.theme = next;
			try {
				localStorage.setItem( 'wpbb-docs-theme', next );
			} catch ( e ) {}
		} );
	}

	/* ---------------------------------------------------------- Search */
	const input = document.getElementById( 'docs-search' );
	const list = document.getElementById( 'docs-search-results' );
	const status = document.getElementById( 'docs-search-status' );
	const index = window.WPBB_DOCS_INDEX || [];
	let active = -1;

	function norm( s ) {
		return String( s || '' ).toLowerCase();
	}
	function search( q ) {
		const words = norm( q ).split( /\s+/ ).filter( Boolean );
		if ( ! words.length ) {
			return [];
		}
		const results = [];
		index.forEach( function ( p ) {
			const title = norm( p.t );
			const hay = title + ' ' + norm( p.k ) + ' ' + norm( p.d );
			let score = 0;
			const ok = words.every( function ( w ) {
				let hit = false;
				if ( title.indexOf( w ) !== -1 ) {
					score += title.indexOf( w ) === 0 ? 12 : 8;
					hit = true;
				}
				if ( hay.indexOf( w ) !== -1 ) {
					score += 3;
					hit = true;
				}
				p.h.forEach( function ( h ) {
					if ( norm( h[ 0 ] ).indexOf( w ) !== -1 ) {
						score += 1;
						hit = true;
					}
				} );
				return hit;
			} );
			if ( ok ) {
				results.push( {
					p,
					score,
					url: p.u,
					label: p.t,
					sub: p.d,
				} );
			}
			// Section matches.
			p.h.forEach( function ( h ) {
				const text = norm( h[ 0 ] );
				if (
					words.every( function ( w ) {
						return text.indexOf( w ) !== -1;
					} )
				) {
					results.push( {
						score: 5,
						url: p.u + '#' + h[ 1 ],
						label: h[ 0 ],
						sub: p.t,
					} );
				}
			} );
		} );
		results.sort( function ( a, b ) {
			return b.score - a.score;
		} );
		return results.slice( 0, 10 );
	}
	function render( items, q ) {
		list.innerHTML = '';
		active = -1;
		if ( ! q ) {
			list.hidden = true;
			input.setAttribute( 'aria-expanded', 'false' );
			status.textContent = '';
			return;
		}
		if ( ! items.length ) {
			const li = document.createElement( 'li' );
			li.className = 'empty';
			li.textContent =
				'No results. Try another word, such as “columns” or “hover”.';
			list.appendChild( li );
		}
		items.forEach( function ( r, i ) {
			const li = document.createElement( 'li' );
			li.id = 'search-result-' + i;
			li.setAttribute( 'role', 'option' );
			li.setAttribute( 'aria-selected', 'false' );
			const a = document.createElement( 'a' );
			a.href = root + r.url;
			a.tabIndex = -1;
			const strong = document.createElement( 'strong' );
			strong.textContent = r.label;
			const span = document.createElement( 'span' );
			span.textContent = r.sub;
			a.appendChild( strong );
			a.appendChild( span );
			li.appendChild( a );
			list.appendChild( li );
		} );
		list.hidden = false;
		input.setAttribute( 'aria-expanded', 'true' );
		status.textContent =
			items.length + ( items.length === 1 ? ' result' : ' results' );
	}
	function highlight( i ) {
		const options = list.querySelectorAll( '[role="option"]' );
		if ( ! options.length ) {
			return;
		}
		active = ( i + options.length ) % options.length;
		options.forEach( function ( o, n ) {
			o.setAttribute( 'aria-selected', n === active ? 'true' : 'false' );
		} );
		input.setAttribute( 'aria-activedescendant', options[ active ].id );
		options[ active ].scrollIntoView( { block: 'nearest' } );
	}
	if ( input && list ) {
		input.addEventListener( 'input', function () {
			render( search( input.value ), input.value.trim() );
		} );
		input.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'ArrowDown' || e.key === 'ArrowUp' ) {
				e.preventDefault();
				highlight( active + ( e.key === 'ArrowDown' ? 1 : -1 ) );
			} else if ( e.key === 'Enter' ) {
				const options = list.querySelectorAll( '[role="option"] a' );
				const target = options[ active >= 0 ? active : 0 ];
				if ( target ) {
					e.preventDefault();
					window.location.href = target.href;
				}
			} else if ( e.key === 'Escape' ) {
				input.value = '';
				render( [], '' );
			}
		} );
		document.addEventListener( 'click', function ( e ) {
			if ( ! e.target.closest( '.search' ) ) {
				list.hidden = true;
				input.setAttribute( 'aria-expanded', 'false' );
			}
		} );
		document.addEventListener( 'keydown', function ( e ) {
			if ( e.key === '/' && document.activeElement === document.body ) {
				e.preventDefault();
				input.focus();
			}
		} );
	}

	/* ---------------------------------------------------------- Contents highlight */
	const tocLinks = document.querySelectorAll( '.toc a' );
	if ( tocLinks.length && 'IntersectionObserver' in window ) {
		const map = {};
		tocLinks.forEach( function ( a ) {
			map[ a.getAttribute( 'href' ).slice( 1 ) ] = a;
		} );
		const observer = new IntersectionObserver(
			function ( entries ) {
				entries.forEach( function ( entry ) {
					if ( entry.isIntersecting && map[ entry.target.id ] ) {
						tocLinks.forEach( function ( a ) {
							a.classList.remove( 'is-active' );
						} );
						map[ entry.target.id ].classList.add( 'is-active' );
					}
				} );
			},
			{ rootMargin: '-10% 0px -75% 0px' }
		);
		Object.keys( map ).forEach( function ( id ) {
			const el = document.getElementById( id );
			if ( el ) {
				observer.observe( el );
			}
		} );
	}

	/* ---------------------------------------------------------- Live examples */
	document.querySelectorAll( '[data-example]' ).forEach( function ( fig ) {
		const frame = fig.querySelector( 'iframe' );
		fig.querySelectorAll( '.example-bar button' ).forEach(
			function ( btn ) {
				btn.addEventListener( 'click', function () {
					const w = btn.getAttribute( 'data-width' );
					frame.style.width = w === '100%' ? '100%' : w + 'px';
					fig.querySelectorAll( '.example-bar button' ).forEach(
						function ( b ) {
							b.setAttribute(
								'aria-pressed',
								b === btn ? 'true' : 'false'
							);
						}
					);
				} );
			}
		);
	} );
	// Examples report their height so the frame fits without inner scrolling.
	window.addEventListener( 'message', function ( e ) {
		if ( ! e.data || typeof e.data.wpbbDocsHeight !== 'number' ) {
			return;
		}
		document
			.querySelectorAll( '[data-example] iframe' )
			.forEach( function ( f ) {
				if ( f.contentWindow === e.source ) {
					f.style.height = Math.ceil( e.data.wpbbDocsHeight ) + 'px';
				}
			} );
	} );
} )();
