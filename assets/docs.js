/* Brigade Blocks Addons documentation — navigation, search, theme and live examples. */
( function () {
	'use strict';

	var root = ( function () {
		var s = document.querySelector( 'script[src$="assets/docs.js"]' );
		return s ? s.getAttribute( 'src' ).replace( /assets\/docs\.js$/, '' ) : '';
	} )();

	/* ---------------------------------------------------------- Menu (phones) */
	var toggle = document.querySelector( '.menu-toggle' );
	var sidebar = document.getElementById( 'sidebar' );
	function setMenu( open ) {
		document.body.classList.toggle( 'nav-open', open );
		toggle.setAttribute( 'aria-expanded', open ? 'true' : 'false' );
		if ( open ) {
			var current = sidebar.querySelector( '[aria-current="page"]' ) || sidebar.querySelector( 'a' );
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
			if ( e.key === 'Escape' && document.body.classList.contains( 'nav-open' ) ) {
				setMenu( false );
				toggle.focus();
			}
		} );
		document.addEventListener( 'click', function ( e ) {
			if ( document.body.classList.contains( 'nav-open' ) && ! sidebar.contains( e.target ) && ! toggle.contains( e.target ) ) {
				setMenu( false );
			}
		} );
	}

	/* ---------------------------------------------------------- Theme */
	var themeBtn = document.querySelector( '.theme-toggle' );
	if ( themeBtn ) {
		themeBtn.addEventListener( 'click', function () {
			var current = document.documentElement.dataset.theme || ( window.matchMedia( '(prefers-color-scheme: dark)' ).matches ? 'dark' : 'light' );
			var next = current === 'dark' ? 'light' : 'dark';
			document.documentElement.dataset.theme = next;
			try {
				localStorage.setItem( 'wpbb-docs-theme', next );
			} catch ( e ) {}
		} );
	}

	/* ---------------------------------------------------------- Search */
	var input = document.getElementById( 'docs-search' );
	var list = document.getElementById( 'docs-search-results' );
	var status = document.getElementById( 'docs-search-status' );
	var index = window.WPBB_DOCS_INDEX || [];
	var active = -1;

	function norm( s ) {
		return String( s || '' ).toLowerCase();
	}
	function search( q ) {
		var words = norm( q ).split( /\s+/ ).filter( Boolean );
		if ( ! words.length ) {
			return [];
		}
		var results = [];
		index.forEach( function ( p ) {
			var title = norm( p.t );
			var hay = title + ' ' + norm( p.k ) + ' ' + norm( p.d );
			var score = 0;
			var ok = words.every( function ( w ) {
				var hit = false;
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
				results.push( { p: p, score: score, url: p.u, label: p.t, sub: p.d } );
			}
			// Section matches.
			p.h.forEach( function ( h ) {
				var text = norm( h[ 0 ] );
				if ( words.every( function ( w ) {
					return text.indexOf( w ) !== -1;
				} ) ) {
					results.push( { score: 5, url: p.u + '#' + h[ 1 ], label: h[ 0 ], sub: p.t } );
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
			var li = document.createElement( 'li' );
			li.className = 'empty';
			li.textContent = 'No results. Try another word, such as “columns” or “hover”.';
			list.appendChild( li );
		}
		items.forEach( function ( r, i ) {
			var li = document.createElement( 'li' );
			li.id = 'search-result-' + i;
			li.setAttribute( 'role', 'option' );
			li.setAttribute( 'aria-selected', 'false' );
			var a = document.createElement( 'a' );
			a.href = root + r.url;
			a.tabIndex = -1;
			var strong = document.createElement( 'strong' );
			strong.textContent = r.label;
			var span = document.createElement( 'span' );
			span.textContent = r.sub;
			a.appendChild( strong );
			a.appendChild( span );
			li.appendChild( a );
			list.appendChild( li );
		} );
		list.hidden = false;
		input.setAttribute( 'aria-expanded', 'true' );
		status.textContent = items.length + ( items.length === 1 ? ' result' : ' results' );
	}
	function highlight( i ) {
		var options = list.querySelectorAll( '[role="option"]' );
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
				var options = list.querySelectorAll( '[role="option"] a' );
				var target = options[ active >= 0 ? active : 0 ];
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
	var tocLinks = document.querySelectorAll( '.toc a' );
	if ( tocLinks.length && 'IntersectionObserver' in window ) {
		var map = {};
		tocLinks.forEach( function ( a ) {
			map[ a.getAttribute( 'href' ).slice( 1 ) ] = a;
		} );
		var observer = new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( entry ) {
				if ( entry.isIntersecting && map[ entry.target.id ] ) {
					tocLinks.forEach( function ( a ) {
						a.classList.remove( 'is-active' );
					} );
					map[ entry.target.id ].classList.add( 'is-active' );
				}
			} );
		}, { rootMargin: '-10% 0px -75% 0px' } );
		Object.keys( map ).forEach( function ( id ) {
			var el = document.getElementById( id );
			if ( el ) {
				observer.observe( el );
			}
		} );
	}

	/* ---------------------------------------------------------- Live examples */
	document.querySelectorAll( '[data-example]' ).forEach( function ( fig ) {
		var frame = fig.querySelector( 'iframe' );
		fig.querySelectorAll( '.example-bar button' ).forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				var w = btn.getAttribute( 'data-width' );
				frame.style.width = w === '100%' ? '100%' : w + 'px';
				fig.querySelectorAll( '.example-bar button' ).forEach( function ( b ) {
					b.setAttribute( 'aria-pressed', b === btn ? 'true' : 'false' );
				} );
			} );
		} );
	} );
	// Examples report their height so the frame fits without inner scrolling.
	window.addEventListener( 'message', function ( e ) {
		if ( ! e.data || typeof e.data.wpbbDocsHeight !== 'number' ) {
			return;
		}
		document.querySelectorAll( '[data-example] iframe' ).forEach( function ( f ) {
			if ( f.contentWindow === e.source ) {
				f.style.height = Math.ceil( e.data.wpbbDocsHeight ) + 'px';
			}
		} );
	} );
} )();
