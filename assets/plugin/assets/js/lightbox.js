/**
 * Brigade Blocks — shared lightbox (Gallery, Video Gallery).
 *
 * Progressive enhancement: every item is a normal link to the full image or video, so
 * it works without JavaScript. With it, links open in a native <dialog> (focus stays
 * inside, Esc closes, focus returns to the link), with previous/next, arrow keys,
 * swipe and a counter. Videos are only loaded when opened and removed when the viewer
 * moves on or closes, which stops playback. No dependencies.
 *
 * Markup: a group [data-wpbb-lightbox-group] containing links
 *   <a href="full.jpg" data-wpbb-lightbox data-type="image|youtube|vimeo|video"
 *      data-src="video id or file URL" data-caption="…">
 * Items inside an element with the `hidden` attribute (e.g. filtered out) are skipped.
 */
( function () {
	'use strict';

	const l10n = window.wpbbLightboxL10n || {};
	const t = function ( key, fallback ) {
		return l10n[ key ] || fallback;
	};

	let dialog, stage, caption, counter, prevBtn, nextBtn;
	let items = [];
	let index = 0;
	let opener = null;

	function button( className, label, symbol ) {
		const b = document.createElement( 'button' );
		b.type = 'button';
		b.className = 'wpbb-lightbox__btn ' + className;
		b.setAttribute( 'aria-label', label );
		b.innerHTML = symbol;
		return b;
	}

	function build() {
		dialog = document.createElement( 'dialog' );
		dialog.className = 'wpbb-lightbox';
		dialog.setAttribute( 'aria-label', t( 'dialog', 'Media viewer' ) );

		const figure = document.createElement( 'figure' );
		figure.className = 'wpbb-lightbox__figure';
		stage = document.createElement( 'div' );
		stage.className = 'wpbb-lightbox__stage';
		caption = document.createElement( 'figcaption' );
		caption.className = 'wpbb-lightbox__caption';
		figure.appendChild( stage );
		figure.appendChild( caption );

		counter = document.createElement( 'p' );
		counter.className = 'wpbb-lightbox__counter';
		counter.setAttribute( 'aria-live', 'polite' );

		const close = button(
			'is-close',
			t( 'close', 'Close' ),
			'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>'
		);
		prevBtn = button(
			'is-prev',
			t( 'prev', 'Previous' ),
			'<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="m15 6-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
		);
		nextBtn = button(
			'is-next',
			t( 'next', 'Next' ),
			'<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="m9 6 6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
		);

		close.addEventListener( 'click', function () {
			dialog.close();
		} );
		prevBtn.addEventListener( 'click', function () {
			show( index - 1 );
		} );
		nextBtn.addEventListener( 'click', function () {
			show( index + 1 );
		} );

		dialog.appendChild( close );
		dialog.appendChild( figure );
		dialog.appendChild( counter );
		dialog.appendChild( prevBtn );
		dialog.appendChild( nextBtn );

		// A click on the backdrop (the dialog itself, outside the content) closes it.
		dialog.addEventListener( 'click', function ( e ) {
			if ( e.target === dialog || e.target === stage ) {
				dialog.close();
			}
		} );
		dialog.addEventListener( 'keydown', function ( e ) {
			if ( e.key === 'ArrowRight' ) {
				e.preventDefault();
				show( index + 1 );
			} else if ( e.key === 'ArrowLeft' ) {
				e.preventDefault();
				show( index - 1 );
			}
		} );
		dialog.addEventListener( 'close', function () {
			stage.innerHTML = ''; // Stops any playing video.
			document.documentElement.classList.remove( 'wpbb-lightbox-open' );
			if ( opener && opener.isConnected ) {
				opener.focus();
			}
		} );

		// Swipe left/right on touch screens.
		let startX = null;
		stage.addEventListener( 'pointerdown', function ( e ) {
			startX = e.pointerType === 'mouse' ? null : e.clientX;
		} );
		stage.addEventListener( 'pointerup', function ( e ) {
			if ( startX === null ) {
				return;
			}
			const dx = e.clientX - startX;
			startX = null;
			if ( Math.abs( dx ) > 50 ) {
				show( index + ( dx < 0 ? 1 : -1 ) );
			}
		} );

		document.body.appendChild( dialog );
	}

	function media( item ) {
		const type = item.getAttribute( 'data-type' ) || 'image';
		const src = item.getAttribute( 'data-src' ) || '';
		const title =
			item.getAttribute( 'data-caption' ) ||
			item.getAttribute( 'aria-label' ) ||
			'';
		let el;
		if ( type === 'youtube' || type === 'vimeo' ) {
			el = document.createElement( 'iframe' );
			el.src =
				type === 'youtube'
					? 'https://www.youtube-nocookie.com/embed/' +
					  encodeURIComponent( src ) +
					  '?autoplay=1&rel=0&modestbranding=1'
					: 'https://player.vimeo.com/video/' +
					  encodeURIComponent( src ) +
					  '?autoplay=1&dnt=1';
			el.allow =
				'autoplay; fullscreen; picture-in-picture; encrypted-media';
			el.allowFullscreen = true;
			el.title = title;
			el.className = 'wpbb-lightbox__video';
		} else if ( type === 'video' ) {
			el = document.createElement( 'video' );
			el.src = src || item.href;
			el.controls = true;
			el.autoplay = true;
			el.playsInline = true;
			el.className = 'wpbb-lightbox__video';
		} else {
			el = document.createElement( 'img' );
			const thumb = item.querySelector( 'img' );
			el.src = item.href;
			el.alt = thumb ? thumb.alt : title;
			el.decoding = 'async';
			el.className = 'wpbb-lightbox__img';
		}
		return el;
	}

	function show( i ) {
		if ( ! items.length ) {
			return;
		}
		index = ( i + items.length ) % items.length;
		const item = items[ index ];
		stage.innerHTML = '';
		stage.appendChild( media( item ) );
		const text = item.getAttribute( 'data-caption' ) || '';
		caption.textContent = text;
		caption.hidden = ! text;
		const single = items.length < 2;
		prevBtn.hidden = single;
		nextBtn.hidden = single;
		counter.hidden = single;
		counter.textContent = t( 'counter', '%1$d / %2$d' )
			.replace( '%1$d', index + 1 )
			.replace( '%2$d', items.length );

		// Warm the cache for the neighbours (images only).
		[ index + 1, index - 1 ].forEach( function ( n ) {
			const near = items[ ( n + items.length ) % items.length ];
			if (
				near &&
				( near.getAttribute( 'data-type' ) || 'image' ) === 'image'
			) {
				new window.Image().src = near.href;
			}
		} );
	}

	function open( link ) {
		const group = link.closest( '[data-wpbb-lightbox-group]' ) || document;
		items = Array.prototype.slice
			.call( group.querySelectorAll( 'a[data-wpbb-lightbox]' ) )
			.filter( function ( a ) {
				return ! a.closest( '[hidden]' );
			} );
		if ( ! dialog ) {
			build();
		}
		opener = link;
		show( items.indexOf( link ) );
		document.documentElement.classList.add( 'wpbb-lightbox-open' );
		dialog.showModal();
	}

	document.addEventListener( 'click', function ( e ) {
		const link =
			e.target.closest && e.target.closest( 'a[data-wpbb-lightbox]' );
		if (
			! link ||
			e.defaultPrevented ||
			e.button !== 0 ||
			e.metaKey ||
			e.ctrlKey ||
			e.shiftKey ||
			e.altKey
		) {
			return;
		}
		if ( typeof HTMLDialogElement === 'undefined' ) {
			return; // Very old browser: follow the link.
		}
		e.preventDefault();
		open( link );
	} );
} )();
