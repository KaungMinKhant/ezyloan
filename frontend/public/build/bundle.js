
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
	'use strict';

	/** @returns {void} */
	function noop() {}

	const identity = (x) => x;

	/**
	 * @template T
	 * @template S
	 * @param {T} tar
	 * @param {S} src
	 * @returns {T & S}
	 */
	function assign(tar, src) {
		// @ts-ignore
		for (const k in src) tar[k] = src[k];
		return /** @type {T & S} */ (tar);
	}

	// Adapted from https://github.com/then/is-promise/blob/master/index.js
	// Distributed under MIT License https://github.com/then/is-promise/blob/master/LICENSE
	/**
	 * @param {any} value
	 * @returns {value is PromiseLike<any>}
	 */
	function is_promise(value) {
		return (
			!!value &&
			(typeof value === 'object' || typeof value === 'function') &&
			typeof (/** @type {any} */ (value).then) === 'function'
		);
	}

	/** @returns {void} */
	function add_location(element, file, line, column, char) {
		element.__svelte_meta = {
			loc: { file, line, column, char }
		};
	}

	function run(fn) {
		return fn();
	}

	function blank_object() {
		return Object.create(null);
	}

	/**
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function run_all(fns) {
		fns.forEach(run);
	}

	/**
	 * @param {any} thing
	 * @returns {thing is Function}
	 */
	function is_function(thing) {
		return typeof thing === 'function';
	}

	/** @returns {boolean} */
	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
	}

	/** @returns {boolean} */
	function is_empty(obj) {
		return Object.keys(obj).length === 0;
	}

	/** @returns {void} */
	function validate_store(store, name) {
		if (store != null && typeof store.subscribe !== 'function') {
			throw new Error(`'${name}' is not a store with a 'subscribe' method`);
		}
	}

	function subscribe(store, ...callbacks) {
		if (store == null) {
			for (const callback of callbacks) {
				callback(undefined);
			}
			return noop;
		}
		const unsub = store.subscribe(...callbacks);
		return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
	}

	/** @returns {void} */
	function component_subscribe(component, store, callback) {
		component.$$.on_destroy.push(subscribe(store, callback));
	}

	function create_slot(definition, ctx, $$scope, fn) {
		if (definition) {
			const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
			return definition[0](slot_ctx);
		}
	}

	function get_slot_context(definition, ctx, $$scope, fn) {
		return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
	}

	function get_slot_changes(definition, $$scope, dirty, fn) {
		if (definition[2] && fn) {
			const lets = definition[2](fn(dirty));
			if ($$scope.dirty === undefined) {
				return lets;
			}
			if (typeof lets === 'object') {
				const merged = [];
				const len = Math.max($$scope.dirty.length, lets.length);
				for (let i = 0; i < len; i += 1) {
					merged[i] = $$scope.dirty[i] | lets[i];
				}
				return merged;
			}
			return $$scope.dirty | lets;
		}
		return $$scope.dirty;
	}

	/** @returns {void} */
	function update_slot_base(
		slot,
		slot_definition,
		ctx,
		$$scope,
		slot_changes,
		get_slot_context_fn
	) {
		if (slot_changes) {
			const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
			slot.p(slot_context, slot_changes);
		}
	}

	/** @returns {any[] | -1} */
	function get_all_dirty_from_scope($$scope) {
		if ($$scope.ctx.length > 32) {
			const dirty = [];
			const length = $$scope.ctx.length / 32;
			for (let i = 0; i < length; i++) {
				dirty[i] = -1;
			}
			return dirty;
		}
		return -1;
	}

	/** @returns {{}} */
	function exclude_internal_props(props) {
		const result = {};
		for (const k in props) if (k[0] !== '$') result[k] = props[k];
		return result;
	}

	const is_client = typeof window !== 'undefined';

	/** @type {() => number} */
	let now = is_client ? () => window.performance.now() : () => Date.now();

	let raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;

	const tasks = new Set();

	/**
	 * @param {number} now
	 * @returns {void}
	 */
	function run_tasks(now) {
		tasks.forEach((task) => {
			if (!task.c(now)) {
				tasks.delete(task);
				task.f();
			}
		});
		if (tasks.size !== 0) raf(run_tasks);
	}

	/**
	 * Creates a new task that runs on each raf frame
	 * until it returns a falsy value or is aborted
	 * @param {import('./private.js').TaskCallback} callback
	 * @returns {import('./private.js').Task}
	 */
	function loop(callback) {
		/** @type {import('./private.js').TaskEntry} */
		let task;
		if (tasks.size === 0) raf(run_tasks);
		return {
			promise: new Promise((fulfill) => {
				tasks.add((task = { c: callback, f: fulfill }));
			}),
			abort() {
				tasks.delete(task);
			}
		};
	}

	/** @type {typeof globalThis} */
	const globals =
		typeof window !== 'undefined'
			? window
			: typeof globalThis !== 'undefined'
			? globalThis
			: // @ts-ignore Node typings have this
			  global;

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append(target, node) {
		target.appendChild(node);
	}

	/**
	 * @param {Node} node
	 * @returns {ShadowRoot | Document}
	 */
	function get_root_for_style(node) {
		if (!node) return document;
		const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
		if (root && /** @type {ShadowRoot} */ (root).host) {
			return /** @type {ShadowRoot} */ (root);
		}
		return node.ownerDocument;
	}

	/**
	 * @param {Node} node
	 * @returns {CSSStyleSheet}
	 */
	function append_empty_stylesheet(node) {
		const style_element = element('style');
		// For transitions to work without 'style-src: unsafe-inline' Content Security Policy,
		// these empty tags need to be allowed with a hash as a workaround until we move to the Web Animations API.
		// Using the hash for the empty string (for an empty tag) works in all browsers except Safari.
		// So as a workaround for the workaround, when we append empty style tags we set their content to /* empty */.
		// The hash 'sha256-9OlNO0DNEeaVzHL4RZwCLsBHA8WBQ8toBp/4F5XV2nc=' will then work even in Safari.
		style_element.textContent = '/* empty */';
		append_stylesheet(get_root_for_style(node), style_element);
		return style_element.sheet;
	}

	/**
	 * @param {ShadowRoot | Document} node
	 * @param {HTMLStyleElement} style
	 * @returns {CSSStyleSheet}
	 */
	function append_stylesheet(node, style) {
		append(/** @type {Document} */ (node).head || node, style);
		return style.sheet;
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * @returns {void} */
	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	/**
	 * @template {keyof HTMLElementTagNameMap} K
	 * @param {K} name
	 * @returns {HTMLElementTagNameMap[K]}
	 */
	function element(name) {
		return document.createElement(name);
	}

	/**
	 * @param {string} data
	 * @returns {Text}
	 */
	function text(data) {
		return document.createTextNode(data);
	}

	/**
	 * @returns {Text} */
	function space() {
		return text(' ');
	}

	/**
	 * @returns {Text} */
	function empty() {
		return text('');
	}

	/**
	 * @param {EventTarget} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @returns {() => void}
	 */
	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	/**
	 * @returns {(event: any) => any} */
	function prevent_default(fn) {
		return function (event) {
			event.preventDefault();
			// @ts-ignore
			return fn.call(this, event);
		};
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
	}

	/** @returns {number} */
	function to_number(value) {
		return value === '' ? null : +value;
	}

	/**
	 * @param {Element} element
	 * @returns {ChildNode[]}
	 */
	function children(element) {
		return Array.from(element.childNodes);
	}

	/**
	 * @returns {void} */
	function set_input_value(input, value) {
		input.value = value == null ? '' : value;
	}

	/**
	 * @returns {void} */
	function set_style(node, key, value, important) {
		if (value == null) {
			node.style.removeProperty(key);
		} else {
			node.style.setProperty(key, value, '');
		}
	}

	/**
	 * @returns {void} */
	function select_option(select, value, mounting) {
		for (let i = 0; i < select.options.length; i += 1) {
			const option = select.options[i];
			if (option.__value === value) {
				option.selected = true;
				return;
			}
		}
		if (!mounting || value !== undefined) {
			select.selectedIndex = -1; // no option should be selected
		}
	}

	function select_value(select) {
		const selected_option = select.querySelector(':checked');
		return selected_option && selected_option.__value;
	}

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
	 * @returns {CustomEvent<T>}
	 */
	function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
		return new CustomEvent(type, { detail, bubbles, cancelable });
	}

	/**
	 * @typedef {Node & {
	 * 	claim_order?: number;
	 * 	hydrate_init?: true;
	 * 	actual_end_child?: NodeEx;
	 * 	childNodes: NodeListOf<NodeEx>;
	 * }} NodeEx
	 */

	/** @typedef {ChildNode & NodeEx} ChildNodeEx */

	/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

	/**
	 * @typedef {ChildNodeEx[] & {
	 * 	claim_info?: {
	 * 		last_index: number;
	 * 		total_claimed: number;
	 * 	};
	 * }} ChildNodeArray
	 */

	// we need to store the information for multiple documents because a Svelte application could also contain iframes
	// https://github.com/sveltejs/svelte/issues/3624
	/** @type {Map<Document | ShadowRoot, import('./private.d.ts').StyleInformation>} */
	const managed_styles = new Map();

	let active = 0;

	// https://github.com/darkskyapp/string-hash/blob/master/index.js
	/**
	 * @param {string} str
	 * @returns {number}
	 */
	function hash(str) {
		let hash = 5381;
		let i = str.length;
		while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
		return hash >>> 0;
	}

	/**
	 * @param {Document | ShadowRoot} doc
	 * @param {Element & ElementCSSInlineStyle} node
	 * @returns {{ stylesheet: any; rules: {}; }}
	 */
	function create_style_information(doc, node) {
		const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
		managed_styles.set(doc, info);
		return info;
	}

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {number} a
	 * @param {number} b
	 * @param {number} duration
	 * @param {number} delay
	 * @param {(t: number) => number} ease
	 * @param {(t: number, u: number) => string} fn
	 * @param {number} uid
	 * @returns {string}
	 */
	function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
		const step = 16.666 / duration;
		let keyframes = '{\n';
		for (let p = 0; p <= 1; p += step) {
			const t = a + (b - a) * ease(p);
			keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
		}
		const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
		const name = `__svelte_${hash(rule)}_${uid}`;
		const doc = get_root_for_style(node);
		const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
		if (!rules[name]) {
			rules[name] = true;
			stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
		}
		const animation = node.style.animation || '';
		node.style.animation = `${
		animation ? `${animation}, ` : ''
	}${name} ${duration}ms linear ${delay}ms 1 both`;
		active += 1;
		return name;
	}

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {string} [name]
	 * @returns {void}
	 */
	function delete_rule(node, name) {
		const previous = (node.style.animation || '').split(', ');
		const next = previous.filter(
			name
				? (anim) => anim.indexOf(name) < 0 // remove specific animation
				: (anim) => anim.indexOf('__svelte') === -1 // remove all Svelte animations
		);
		const deleted = previous.length - next.length;
		if (deleted) {
			node.style.animation = next.join(', ');
			active -= deleted;
			if (!active) clear_rules();
		}
	}

	/** @returns {void} */
	function clear_rules() {
		raf(() => {
			if (active) return;
			managed_styles.forEach((info) => {
				const { ownerNode } = info.stylesheet;
				// there is no ownerNode if it runs on jsdom.
				if (ownerNode) detach(ownerNode);
			});
			managed_styles.clear();
		});
	}

	let current_component;

	/** @returns {void} */
	function set_current_component(component) {
		current_component = component;
	}

	function get_current_component() {
		if (!current_component) throw new Error('Function called outside component initialization');
		return current_component;
	}

	/**
	 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
	 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
	 * it can be called from an external module).
	 *
	 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
	 *
	 * `onMount` does not run inside a [server-side component](https://svelte.dev/docs#run-time-server-side-component-api).
	 *
	 * https://svelte.dev/docs/svelte#onmount
	 * @template T
	 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
	 * @returns {void}
	 */
	function onMount(fn) {
		get_current_component().$$.on_mount.push(fn);
	}

	/**
	 * Schedules a callback to run immediately before the component is unmounted.
	 *
	 * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
	 * only one that runs inside a server-side component.
	 *
	 * https://svelte.dev/docs/svelte#ondestroy
	 * @param {() => any} fn
	 * @returns {void}
	 */
	function onDestroy(fn) {
		get_current_component().$$.on_destroy.push(fn);
	}

	/**
	 * Creates an event dispatcher that can be used to dispatch [component events](https://svelte.dev/docs#template-syntax-component-directives-on-eventname).
	 * Event dispatchers are functions that can take two arguments: `name` and `detail`.
	 *
	 * Component events created with `createEventDispatcher` create a
	 * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
	 * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
	 * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
	 * property and can contain any type of data.
	 *
	 * The event dispatcher can be typed to narrow the allowed event names and the type of the `detail` argument:
	 * ```ts
	 * const dispatch = createEventDispatcher<{
	 *  loaded: never; // does not take a detail argument
	 *  change: string; // takes a detail argument of type string, which is required
	 *  optional: number | null; // takes an optional detail argument of type number
	 * }>();
	 * ```
	 *
	 * https://svelte.dev/docs/svelte#createeventdispatcher
	 * @template {Record<string, any>} [EventMap=any]
	 * @returns {import('./public.js').EventDispatcher<EventMap>}
	 */
	function createEventDispatcher() {
		const component = get_current_component();
		return (type, detail, { cancelable = false } = {}) => {
			const callbacks = component.$$.callbacks[type];
			if (callbacks) {
				// TODO are there situations where events could be dispatched
				// in a server (non-DOM) environment?
				const event = custom_event(/** @type {string} */ (type), detail, { cancelable });
				callbacks.slice().forEach((fn) => {
					fn.call(component, event);
				});
				return !event.defaultPrevented;
			}
			return true;
		};
	}

	/**
	 * Associates an arbitrary `context` object with the current component and the specified `key`
	 * and returns that object. The context is then available to children of the component
	 * (including slotted content) with `getContext`.
	 *
	 * Like lifecycle functions, this must be called during component initialisation.
	 *
	 * https://svelte.dev/docs/svelte#setcontext
	 * @template T
	 * @param {any} key
	 * @param {T} context
	 * @returns {T}
	 */
	function setContext(key, context) {
		get_current_component().$$.context.set(key, context);
		return context;
	}

	/**
	 * Retrieves the context that belongs to the closest parent component with the specified `key`.
	 * Must be called during component initialisation.
	 *
	 * https://svelte.dev/docs/svelte#getcontext
	 * @template T
	 * @param {any} key
	 * @returns {T}
	 */
	function getContext(key) {
		return get_current_component().$$.context.get(key);
	}

	const dirty_components = [];
	const binding_callbacks = [];

	let render_callbacks = [];

	const flush_callbacks = [];

	const resolved_promise = /* @__PURE__ */ Promise.resolve();

	let update_scheduled = false;

	/** @returns {void} */
	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	/** @returns {void} */
	function add_render_callback(fn) {
		render_callbacks.push(fn);
	}

	// flush() calls callbacks in this order:
	// 1. All beforeUpdate callbacks, in order: parents before children
	// 2. All bind:this callbacks, in reverse order: children before parents.
	// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
	//    for afterUpdates called during the initial onMount, which are called in
	//    reverse order: children before parents.
	// Since callbacks might update component values, which could trigger another
	// call to flush(), the following steps guard against this:
	// 1. During beforeUpdate, any updated components will be added to the
	//    dirty_components array and will cause a reentrant call to flush(). Because
	//    the flush index is kept outside the function, the reentrant call will pick
	//    up where the earlier call left off and go through all dirty components. The
	//    current_component value is saved and restored so that the reentrant call will
	//    not interfere with the "parent" flush() call.
	// 2. bind:this callbacks cannot trigger new flush() calls.
	// 3. During afterUpdate, any updated components will NOT have their afterUpdate
	//    callback called a second time; the seen_callbacks set, outside the flush()
	//    function, guarantees this behavior.
	const seen_callbacks = new Set();

	let flushidx = 0; // Do *not* move this inside the flush() function

	/** @returns {void} */
	function flush() {
		// Do not reenter flush while dirty components are updated, as this can
		// result in an infinite loop. Instead, let the inner flush handle it.
		// Reentrancy is ok afterwards for bindings etc.
		if (flushidx !== 0) {
			return;
		}
		const saved_component = current_component;
		do {
			// first, call beforeUpdate functions
			// and update components
			try {
				while (flushidx < dirty_components.length) {
					const component = dirty_components[flushidx];
					flushidx++;
					set_current_component(component);
					update(component.$$);
				}
			} catch (e) {
				// reset dirty state to not end up in a deadlocked state and then rethrow
				dirty_components.length = 0;
				flushidx = 0;
				throw e;
			}
			set_current_component(null);
			dirty_components.length = 0;
			flushidx = 0;
			while (binding_callbacks.length) binding_callbacks.pop()();
			// then, once components are updated, call
			// afterUpdate functions. This may cause
			// subsequent updates...
			for (let i = 0; i < render_callbacks.length; i += 1) {
				const callback = render_callbacks[i];
				if (!seen_callbacks.has(callback)) {
					// ...so guard against infinite loops
					seen_callbacks.add(callback);
					callback();
				}
			}
			render_callbacks.length = 0;
		} while (dirty_components.length);
		while (flush_callbacks.length) {
			flush_callbacks.pop()();
		}
		update_scheduled = false;
		seen_callbacks.clear();
		set_current_component(saved_component);
	}

	/** @returns {void} */
	function update($$) {
		if ($$.fragment !== null) {
			$$.update();
			run_all($$.before_update);
			const dirty = $$.dirty;
			$$.dirty = [-1];
			$$.fragment && $$.fragment.p($$.ctx, dirty);
			$$.after_update.forEach(add_render_callback);
		}
	}

	/**
	 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function flush_render_callbacks(fns) {
		const filtered = [];
		const targets = [];
		render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
		targets.forEach((c) => c());
		render_callbacks = filtered;
	}

	/**
	 * @type {Promise<void> | null}
	 */
	let promise;

	/**
	 * @returns {Promise<void>}
	 */
	function wait() {
		if (!promise) {
			promise = Promise.resolve();
			promise.then(() => {
				promise = null;
			});
		}
		return promise;
	}

	/**
	 * @param {Element} node
	 * @param {INTRO | OUTRO | boolean} direction
	 * @param {'start' | 'end'} kind
	 * @returns {void}
	 */
	function dispatch(node, direction, kind) {
		node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
	}

	const outroing = new Set();

	/**
	 * @type {Outro}
	 */
	let outros;

	/**
	 * @returns {void} */
	function group_outros() {
		outros = {
			r: 0,
			c: [],
			p: outros // parent group
		};
	}

	/**
	 * @returns {void} */
	function check_outros() {
		if (!outros.r) {
			run_all(outros.c);
		}
		outros = outros.p;
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} [local]
	 * @returns {void}
	 */
	function transition_in(block, local) {
		if (block && block.i) {
			outroing.delete(block);
			block.i(local);
		}
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} local
	 * @param {0 | 1} [detach]
	 * @param {() => void} [callback]
	 * @returns {void}
	 */
	function transition_out(block, local, detach, callback) {
		if (block && block.o) {
			if (outroing.has(block)) return;
			outroing.add(block);
			outros.c.push(() => {
				outroing.delete(block);
				if (callback) {
					if (detach) block.d(1);
					callback();
				}
			});
			block.o(local);
		} else if (callback) {
			callback();
		}
	}

	/**
	 * @type {import('../transition/public.js').TransitionConfig}
	 */
	const null_transition = { duration: 0 };

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {TransitionFn} fn
	 * @param {any} params
	 * @returns {{ start(): void; invalidate(): void; end(): void; }}
	 */
	function create_in_transition(node, fn, params) {
		/**
		 * @type {TransitionOptions} */
		const options = { direction: 'in' };
		let config = fn(node, params, options);
		let running = false;
		let animation_name;
		let task;
		let uid = 0;

		/**
		 * @returns {void} */
		function cleanup() {
			if (animation_name) delete_rule(node, animation_name);
		}

		/**
		 * @returns {void} */
		function go() {
			const {
				delay = 0,
				duration = 300,
				easing = identity,
				tick = noop,
				css
			} = config || null_transition;
			if (css) animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
			tick(0, 1);
			const start_time = now() + delay;
			const end_time = start_time + duration;
			if (task) task.abort();
			running = true;
			add_render_callback(() => dispatch(node, true, 'start'));
			task = loop((now) => {
				if (running) {
					if (now >= end_time) {
						tick(1, 0);
						dispatch(node, true, 'end');
						cleanup();
						return (running = false);
					}
					if (now >= start_time) {
						const t = easing((now - start_time) / duration);
						tick(t, 1 - t);
					}
				}
				return running;
			});
		}
		let started = false;
		return {
			start() {
				if (started) return;
				started = true;
				delete_rule(node);
				if (is_function(config)) {
					config = config(options);
					wait().then(go);
				} else {
					go();
				}
			},
			invalidate() {
				started = false;
			},
			end() {
				if (running) {
					cleanup();
					running = false;
				}
			}
		};
	}

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {TransitionFn} fn
	 * @param {any} params
	 * @returns {{ end(reset: any): void; }}
	 */
	function create_out_transition(node, fn, params) {
		/** @type {TransitionOptions} */
		const options = { direction: 'out' };
		let config = fn(node, params, options);
		let running = true;
		let animation_name;
		const group = outros;
		group.r += 1;
		/** @type {boolean} */
		let original_inert_value;

		/**
		 * @returns {void} */
		function go() {
			const {
				delay = 0,
				duration = 300,
				easing = identity,
				tick = noop,
				css
			} = config || null_transition;

			if (css) animation_name = create_rule(node, 1, 0, duration, delay, easing, css);

			const start_time = now() + delay;
			const end_time = start_time + duration;
			add_render_callback(() => dispatch(node, false, 'start'));

			if ('inert' in node) {
				original_inert_value = /** @type {HTMLElement} */ (node).inert;
				node.inert = true;
			}

			loop((now) => {
				if (running) {
					if (now >= end_time) {
						tick(0, 1);
						dispatch(node, false, 'end');
						if (!--group.r) {
							// this will result in `end()` being called,
							// so we don't need to clean up here
							run_all(group.c);
						}
						return false;
					}
					if (now >= start_time) {
						const t = easing((now - start_time) / duration);
						tick(1 - t, t);
					}
				}
				return running;
			});
		}

		if (is_function(config)) {
			wait().then(() => {
				// @ts-ignore
				config = config(options);
				go();
			});
		} else {
			go();
		}

		return {
			end(reset) {
				if (reset && 'inert' in node) {
					node.inert = original_inert_value;
				}
				if (reset && config.tick) {
					config.tick(1, 0);
				}
				if (running) {
					if (animation_name) delete_rule(node, animation_name);
					running = false;
				}
			}
		};
	}

	/** @typedef {1} INTRO */
	/** @typedef {0} OUTRO */
	/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
	/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

	/**
	 * @typedef {Object} Outro
	 * @property {number} r
	 * @property {Function[]} c
	 * @property {Object} p
	 */

	/**
	 * @typedef {Object} PendingProgram
	 * @property {number} start
	 * @property {INTRO|OUTRO} b
	 * @property {Outro} [group]
	 */

	/**
	 * @typedef {Object} Program
	 * @property {number} a
	 * @property {INTRO|OUTRO} b
	 * @property {1|-1} d
	 * @property {number} duration
	 * @property {number} start
	 * @property {number} end
	 * @property {Outro} [group]
	 */

	/**
	 * @template T
	 * @param {Promise<T>} promise
	 * @param {import('./private.js').PromiseInfo<T>} info
	 * @returns {boolean}
	 */
	function handle_promise(promise, info) {
		const token = (info.token = {});
		/**
		 * @param {import('./private.js').FragmentFactory} type
		 * @param {0 | 1 | 2} index
		 * @param {number} [key]
		 * @param {any} [value]
		 * @returns {void}
		 */
		function update(type, index, key, value) {
			if (info.token !== token) return;
			info.resolved = value;
			let child_ctx = info.ctx;
			if (key !== undefined) {
				child_ctx = child_ctx.slice();
				child_ctx[key] = value;
			}
			const block = type && (info.current = type)(child_ctx);
			let needs_flush = false;
			if (info.block) {
				if (info.blocks) {
					info.blocks.forEach((block, i) => {
						if (i !== index && block) {
							group_outros();
							transition_out(block, 1, 1, () => {
								if (info.blocks[i] === block) {
									info.blocks[i] = null;
								}
							});
							check_outros();
						}
					});
				} else {
					info.block.d(1);
				}
				block.c();
				transition_in(block, 1);
				block.m(info.mount(), info.anchor);
				needs_flush = true;
			}
			info.block = block;
			if (info.blocks) info.blocks[index] = block;
			if (needs_flush) {
				flush();
			}
		}
		if (is_promise(promise)) {
			const current_component = get_current_component();
			promise.then(
				(value) => {
					set_current_component(current_component);
					update(info.then, 1, info.value, value);
					set_current_component(null);
				},
				(error) => {
					set_current_component(current_component);
					update(info.catch, 2, info.error, error);
					set_current_component(null);
					if (!info.hasCatch) {
						throw error;
					}
				}
			);
			// if we previously had a then/catch block, destroy it
			if (info.current !== info.pending) {
				update(info.pending, 0);
				return true;
			}
		} else {
			if (info.current !== info.then) {
				update(info.then, 1, info.value, promise);
				return true;
			}
			info.resolved = /** @type {T} */ (promise);
		}
	}

	/** @returns {void} */
	function update_await_block_branch(info, ctx, dirty) {
		const child_ctx = ctx.slice();
		const { resolved } = info;
		if (info.current === info.then) {
			child_ctx[info.value] = resolved;
		}
		if (info.current === info.catch) {
			child_ctx[info.error] = resolved;
		}
		info.block.p(child_ctx, dirty);
	}

	// general each functions:

	function ensure_array_like(array_like_or_iterator) {
		return array_like_or_iterator?.length !== undefined
			? array_like_or_iterator
			: Array.from(array_like_or_iterator);
	}

	/** @returns {{}} */
	function get_spread_update(levels, updates) {
		const update = {};
		const to_null_out = {};
		const accounted_for = { $$scope: 1 };
		let i = levels.length;
		while (i--) {
			const o = levels[i];
			const n = updates[i];
			if (n) {
				for (const key in o) {
					if (!(key in n)) to_null_out[key] = 1;
				}
				for (const key in n) {
					if (!accounted_for[key]) {
						update[key] = n[key];
						accounted_for[key] = 1;
					}
				}
				levels[i] = n;
			} else {
				for (const key in o) {
					accounted_for[key] = 1;
				}
			}
		}
		for (const key in to_null_out) {
			if (!(key in update)) update[key] = undefined;
		}
		return update;
	}

	function get_spread_object(spread_props) {
		return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
	}

	/** @returns {void} */
	function create_component(block) {
		block && block.c();
	}

	/** @returns {void} */
	function mount_component(component, target, anchor) {
		const { fragment, after_update } = component.$$;
		fragment && fragment.m(target, anchor);
		// onMount happens before the initial afterUpdate
		add_render_callback(() => {
			const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
			// if the component was destroyed immediately
			// it will update the `$$.on_destroy` reference to `null`.
			// the destructured on_destroy may still reference to the old array
			if (component.$$.on_destroy) {
				component.$$.on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});
		after_update.forEach(add_render_callback);
	}

	/** @returns {void} */
	function destroy_component(component, detaching) {
		const $$ = component.$$;
		if ($$.fragment !== null) {
			flush_render_callbacks($$.after_update);
			run_all($$.on_destroy);
			$$.fragment && $$.fragment.d(detaching);
			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			$$.on_destroy = $$.fragment = null;
			$$.ctx = [];
		}
	}

	/** @returns {void} */
	function make_dirty(component, i) {
		if (component.$$.dirty[0] === -1) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty.fill(0);
		}
		component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
	}

	// TODO: Document the other params
	/**
	 * @param {SvelteComponent} component
	 * @param {import('./public.js').ComponentConstructorOptions} options
	 *
	 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
	 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
	 * This will be the `add_css` function from the compiled component.
	 *
	 * @returns {void}
	 */
	function init(
		component,
		options,
		instance,
		create_fragment,
		not_equal,
		props,
		append_styles = null,
		dirty = [-1]
	) {
		const parent_component = current_component;
		set_current_component(component);
		/** @type {import('./private.js').T$$} */
		const $$ = (component.$$ = {
			fragment: null,
			ctx: [],
			// state
			props,
			update: noop,
			not_equal,
			bound: blank_object(),
			// lifecycle
			on_mount: [],
			on_destroy: [],
			on_disconnect: [],
			before_update: [],
			after_update: [],
			context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
			// everything else
			callbacks: blank_object(),
			dirty,
			skip_bound: false,
			root: options.target || parent_component.$$.root
		});
		append_styles && append_styles($$.root);
		let ready = false;
		$$.ctx = instance
			? instance(component, options.props || {}, (i, ret, ...rest) => {
					const value = rest.length ? rest[0] : ret;
					if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
						if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
						if (ready) make_dirty(component, i);
					}
					return ret;
			  })
			: [];
		$$.update();
		ready = true;
		run_all($$.before_update);
		// `false` as a special case of no DOM component
		$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
		if (options.target) {
			if (options.hydrate) {
				// TODO: what is the correct type here?
				// @ts-expect-error
				const nodes = children(options.target);
				$$.fragment && $$.fragment.l(nodes);
				nodes.forEach(detach);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.c();
			}
			if (options.intro) transition_in(component.$$.fragment);
			mount_component(component, options.target, options.anchor);
			flush();
		}
		set_current_component(parent_component);
	}

	/**
	 * Base class for Svelte components. Used when dev=false.
	 *
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 */
	class SvelteComponent {
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$ = undefined;
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$set = undefined;

		/** @returns {void} */
		$destroy() {
			destroy_component(this, 1);
			this.$destroy = noop;
		}

		/**
		 * @template {Extract<keyof Events, string>} K
		 * @param {K} type
		 * @param {((e: Events[K]) => void) | null | undefined} callback
		 * @returns {() => void}
		 */
		$on(type, callback) {
			if (!is_function(callback)) {
				return noop;
			}
			const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		/**
		 * @param {Partial<Props>} props
		 * @returns {void}
		 */
		$set(props) {
			if (this.$$set && !is_empty(props)) {
				this.$$.skip_bound = true;
				this.$$set(props);
				this.$$.skip_bound = false;
			}
		}
	}

	/**
	 * @typedef {Object} CustomElementPropDefinition
	 * @property {string} [attribute]
	 * @property {boolean} [reflect]
	 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
	 */

	// generated during release, do not modify

	/**
	 * The current version, as set in package.json.
	 *
	 * https://svelte.dev/docs/svelte-compiler#svelte-version
	 * @type {string}
	 */
	const VERSION = '4.2.19';
	const PUBLIC_VERSION = '4';

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @returns {void}
	 */
	function dispatch_dev(type, detail) {
		document.dispatchEvent(custom_event(type, { version: VERSION, ...detail }, { bubbles: true }));
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append_dev(target, node) {
		dispatch_dev('SvelteDOMInsert', { target, node });
		append(target, node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert_dev(target, node, anchor) {
		dispatch_dev('SvelteDOMInsert', { target, node, anchor });
		insert(target, node, anchor);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach_dev(node) {
		dispatch_dev('SvelteDOMRemove', { node });
		detach(node);
	}

	/**
	 * @param {Node} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @param {boolean} [has_prevent_default]
	 * @param {boolean} [has_stop_propagation]
	 * @param {boolean} [has_stop_immediate_propagation]
	 * @returns {() => void}
	 */
	function listen_dev(
		node,
		event,
		handler,
		options,
		has_prevent_default,
		has_stop_propagation,
		has_stop_immediate_propagation
	) {
		const modifiers =
			options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
		if (has_prevent_default) modifiers.push('preventDefault');
		if (has_stop_propagation) modifiers.push('stopPropagation');
		if (has_stop_immediate_propagation) modifiers.push('stopImmediatePropagation');
		dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
		const dispose = listen(node, event, handler, options);
		return () => {
			dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
			dispose();
		};
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr_dev(node, attribute, value) {
		attr(node, attribute, value);
		if (value == null) dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
		else dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
	}

	/**
	 * @param {Element} node
	 * @param {string} property
	 * @param {any} [value]
	 * @returns {void}
	 */
	function prop_dev(node, property, value) {
		node[property] = value;
		dispatch_dev('SvelteDOMSetProperty', { node, property, value });
	}

	/**
	 * @param {Text} text
	 * @param {unknown} data
	 * @returns {void}
	 */
	function set_data_dev(text, data) {
		data = '' + data;
		if (text.data === data) return;
		dispatch_dev('SvelteDOMSetData', { node: text, data });
		text.data = /** @type {string} */ (data);
	}

	function ensure_array_like_dev(arg) {
		if (
			typeof arg !== 'string' &&
			!(arg && typeof arg === 'object' && 'length' in arg) &&
			!(typeof Symbol === 'function' && arg && Symbol.iterator in arg)
		) {
			throw new Error('{#each} only works with iterable values.');
		}
		return ensure_array_like(arg);
	}

	/**
	 * @returns {void} */
	function validate_slots(name, slot, keys) {
		for (const slot_key of Object.keys(slot)) {
			if (!~keys.indexOf(slot_key)) {
				console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
			}
		}
	}

	function construct_svelte_component_dev(component, props) {
		const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
		try {
			const instance = new component(props);
			if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
				throw new Error(error_message);
			}
			return instance;
		} catch (err) {
			const { message } = err;
			if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
				throw new Error(error_message);
			} else {
				throw err;
			}
		}
	}

	/**
	 * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
	 *
	 * Can be used to create strongly typed Svelte components.
	 *
	 * #### Example:
	 *
	 * You have component library on npm called `component-library`, from which
	 * you export a component called `MyComponent`. For Svelte+TypeScript users,
	 * you want to provide typings. Therefore you create a `index.d.ts`:
	 * ```ts
	 * import { SvelteComponent } from "svelte";
	 * export class MyComponent extends SvelteComponent<{foo: string}> {}
	 * ```
	 * Typing this makes it possible for IDEs like VS Code with the Svelte extension
	 * to provide intellisense and to use the component like this in a Svelte file
	 * with TypeScript:
	 * ```svelte
	 * <script lang="ts">
	 * 	import { MyComponent } from "component-library";
	 * </script>
	 * <MyComponent foo={'bar'} />
	 * ```
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 * @template {Record<string, any>} [Slots=any]
	 * @extends {SvelteComponent<Props, Events>}
	 */
	class SvelteComponentDev extends SvelteComponent {
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Props}
		 */
		$$prop_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Events}
		 */
		$$events_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Slots}
		 */
		$$slot_def;

		/** @param {import('./public.js').ComponentConstructorOptions<Props>} options */
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error("'target' is a required option");
			}
			super();
		}

		/** @returns {void} */
		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn('Component was already destroyed'); // eslint-disable-line no-console
			};
		}

		/** @returns {void} */
		$capture_state() {}

		/** @returns {void} */
		$inject_state() {}
	}

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	/* src/routes/index.svelte generated by Svelte v4.2.19 */
	const file$c = "src/routes/index.svelte";

	function create_fragment$d(ctx) {
		let section;
		let h1;
		let t2;
		let p;
		let t4;
		let div;
		let a0;
		let t6;
		let a1;
		let t8;
		let a2;
		let t10;
		let a3;

		const block = {
			c: function create() {
				section = element("section");
				h1 = element("h1");
				h1.textContent = `Welcome to ${/*appName*/ ctx[0]}`;
				t2 = space();
				p = element("p");
				p.textContent = "Your one-stop solution for decentralized loans and wallet management.";
				t4 = space();
				div = element("div");
				a0 = element("a");
				a0.textContent = "View Wallets";
				t6 = space();
				a1 = element("a");
				a1.textContent = "Create a Wallet";
				t8 = space();
				a2 = element("a");
				a2.textContent = "Request a Loan";
				t10 = space();
				a3 = element("a");
				a3.textContent = "Invest & Lend";
				add_location(h1, file$c, 6, 4, 124);
				add_location(p, file$c, 7, 4, 158);
				attr_dev(a0, "href", "/wallet");
				attr_dev(a0, "class", "btn btn-tertiary svelte-7ub2ti");
				add_location(a0, file$c, 10, 8, 270);
				attr_dev(a1, "href", "/wallet/create");
				attr_dev(a1, "class", "btn btn-secondary svelte-7ub2ti");
				add_location(a1, file$c, 11, 8, 338);
				attr_dev(a2, "href", "/loan/request");
				attr_dev(a2, "class", "btn btn-tertiary svelte-7ub2ti");
				add_location(a2, file$c, 12, 8, 417);
				attr_dev(a3, "href", "/lend");
				attr_dev(a3, "class", "btn btn-secondary svelte-7ub2ti");
				add_location(a3, file$c, 13, 8, 493);
				attr_dev(div, "class", "actions svelte-7ub2ti");
				add_location(div, file$c, 9, 4, 240);
				attr_dev(section, "class", "home-container svelte-7ub2ti");
				add_location(section, file$c, 5, 0, 87);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, section, anchor);
				append_dev(section, h1);
				append_dev(section, t2);
				append_dev(section, p);
				append_dev(section, t4);
				append_dev(section, div);
				append_dev(div, a0);
				append_dev(div, t6);
				append_dev(div, a1);
				append_dev(div, t8);
				append_dev(div, a2);
				append_dev(div, t10);
				append_dev(div, a3);
			},
			p: noop,
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(section);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$d.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$d($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Routes', slots, []);
		let appName = "EzyLoan";
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Routes> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({ onMount, appName });

		$$self.$inject_state = $$props => {
			if ('appName' in $$props) $$invalidate(0, appName = $$props.appName);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [appName];
	}

	class Routes extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Routes",
				options,
				id: create_fragment$d.name
			});
		}
	}

	const subscriber_queue = [];

	/**
	 * Creates a `Readable` store that allows reading by subscription.
	 *
	 * https://svelte.dev/docs/svelte-store#readable
	 * @template T
	 * @param {T} [value] initial value
	 * @param {import('./public.js').StartStopNotifier<T>} [start]
	 * @returns {import('./public.js').Readable<T>}
	 */
	function readable(value, start) {
		return {
			subscribe: writable(value, start).subscribe
		};
	}

	/**
	 * Create a `Writable` store that allows both updating and reading by subscription.
	 *
	 * https://svelte.dev/docs/svelte-store#writable
	 * @template T
	 * @param {T} [value] initial value
	 * @param {import('./public.js').StartStopNotifier<T>} [start]
	 * @returns {import('./public.js').Writable<T>}
	 */
	function writable(value, start = noop) {
		/** @type {import('./public.js').Unsubscriber} */
		let stop;
		/** @type {Set<import('./private.js').SubscribeInvalidateTuple<T>>} */
		const subscribers = new Set();
		/** @param {T} new_value
		 * @returns {void}
		 */
		function set(new_value) {
			if (safe_not_equal(value, new_value)) {
				value = new_value;
				if (stop) {
					// store is ready
					const run_queue = !subscriber_queue.length;
					for (const subscriber of subscribers) {
						subscriber[1]();
						subscriber_queue.push(subscriber, value);
					}
					if (run_queue) {
						for (let i = 0; i < subscriber_queue.length; i += 2) {
							subscriber_queue[i][0](subscriber_queue[i + 1]);
						}
						subscriber_queue.length = 0;
					}
				}
			}
		}

		/**
		 * @param {import('./public.js').Updater<T>} fn
		 * @returns {void}
		 */
		function update(fn) {
			set(fn(value));
		}

		/**
		 * @param {import('./public.js').Subscriber<T>} run
		 * @param {import('./private.js').Invalidator<T>} [invalidate]
		 * @returns {import('./public.js').Unsubscriber}
		 */
		function subscribe(run, invalidate = noop) {
			/** @type {import('./private.js').SubscribeInvalidateTuple<T>} */
			const subscriber = [run, invalidate];
			subscribers.add(subscriber);
			if (subscribers.size === 1) {
				stop = start(set, update) || noop;
			}
			run(value);
			return () => {
				subscribers.delete(subscriber);
				if (subscribers.size === 0 && stop) {
					stop();
					stop = null;
				}
			};
		}
		return { set, update, subscribe };
	}

	/**
	 * Derived value store by synchronizing one or more readable stores and
	 * applying an aggregation function over its input values.
	 *
	 * https://svelte.dev/docs/svelte-store#derived
	 * @template {import('./private.js').Stores} S
	 * @template T
	 * @overload
	 * @param {S} stores - input stores
	 * @param {(values: import('./private.js').StoresValues<S>, set: (value: T) => void, update: (fn: import('./public.js').Updater<T>) => void) => import('./public.js').Unsubscriber | void} fn - function callback that aggregates the values
	 * @param {T} [initial_value] - initial value
	 * @returns {import('./public.js').Readable<T>}
	 */

	/**
	 * Derived value store by synchronizing one or more readable stores and
	 * applying an aggregation function over its input values.
	 *
	 * https://svelte.dev/docs/svelte-store#derived
	 * @template {import('./private.js').Stores} S
	 * @template T
	 * @overload
	 * @param {S} stores - input stores
	 * @param {(values: import('./private.js').StoresValues<S>) => T} fn - function callback that aggregates the values
	 * @param {T} [initial_value] - initial value
	 * @returns {import('./public.js').Readable<T>}
	 */

	/**
	 * @template {import('./private.js').Stores} S
	 * @template T
	 * @param {S} stores
	 * @param {Function} fn
	 * @param {T} [initial_value]
	 * @returns {import('./public.js').Readable<T>}
	 */
	function derived(stores, fn, initial_value) {
		const single = !Array.isArray(stores);
		/** @type {Array<import('./public.js').Readable<any>>} */
		const stores_array = single ? [stores] : stores;
		if (!stores_array.every(Boolean)) {
			throw new Error('derived() expects stores as input, got a falsy value');
		}
		const auto = fn.length < 2;
		return readable(initial_value, (set, update) => {
			let started = false;
			const values = [];
			let pending = 0;
			let cleanup = noop;
			const sync = () => {
				if (pending) {
					return;
				}
				cleanup();
				const result = fn(single ? values[0] : values, set, update);
				if (auto) {
					set(result);
				} else {
					cleanup = is_function(result) ? result : noop;
				}
			};
			const unsubscribers = stores_array.map((store, i) =>
				subscribe(
					store,
					(value) => {
						values[i] = value;
						pending &= ~(1 << i);
						if (started) {
							sync();
						}
					},
					() => {
						pending |= 1 << i;
					}
				)
			);
			started = true;
			sync();
			return function stop() {
				run_all(unsubscribers);
				cleanup();
				// We need to set this to false because callbacks can still happen despite having unsubscribed:
				// Callbacks might already be placed in the queue which doesn't know it should no longer
				// invoke this derived store.
				started = false;
			};
		});
	}

	// Create writable stores for mainPhoneNumber and mainEmail
	const urlRoot = 'http://localhost:8000';

	/* src/components/LoanRepayForm.svelte generated by Svelte v4.2.19 */

	const { console: console_1$5 } = globals;
	const file$b = "src/components/LoanRepayForm.svelte";

	function get_each_context$4(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[17] = list[i];
		return child_ctx;
	}

	// (119:8) {#if repaymentType === "partial"}
	function create_if_block_2$3(ctx) {
		let label;
		let t;
		let input;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				label = element("label");
				t = text("Partial Amount:\n                ");
				input = element("input");
				attr_dev(input, "type", "number");
				attr_dev(input, "placeholder", "Enter partial amount");
				attr_dev(input, "min", "0.0001");
				attr_dev(input, "step", "0.0001");
				input.required = true;
				attr_dev(input, "class", "svelte-wk584e");
				add_location(input, file$b, 121, 16, 4770);
				attr_dev(label, "class", "svelte-wk584e");
				add_location(label, file$b, 119, 12, 4714);
			},
			m: function mount(target, anchor) {
				insert_dev(target, label, anchor);
				append_dev(label, t);
				append_dev(label, input);
				set_input_value(input, /*repaymentAmount*/ ctx[4]);

				if (!mounted) {
					dispose = [
						listen_dev(input, "input", /*input_input_handler*/ ctx[13]),
						listen_dev(input, "input", /*calculateRepayment*/ ctx[10], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*repaymentAmount*/ 16 && to_number(input.value) !== /*repaymentAmount*/ ctx[4]) {
					set_input_value(input, /*repaymentAmount*/ ctx[4]);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(label);
				}

				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2$3.name,
			type: "if",
			source: "(119:8) {#if repaymentType === \\\"partial\\\"}",
			ctx
		});

		return block;
	}

	// (137:16) {#each tokens as token}
	function create_each_block$4(ctx) {
		let option;
		let t_value = /*token*/ ctx[17] + "";
		let t;

		const block = {
			c: function create() {
				option = element("option");
				t = text(t_value);
				option.__value = /*token*/ ctx[17];
				set_input_value(option, option.__value);
				add_location(option, file$b, 137, 20, 5300);
			},
			m: function mount(target, anchor) {
				insert_dev(target, option, anchor);
				append_dev(option, t);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(option);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$4.name,
			type: "each",
			source: "(137:16) {#each tokens as token}",
			ctx
		});

		return block;
	}

	// (148:12) {:else}
	function create_else_block$7(ctx) {
		let strong;

		let t0_value = (/*repaymentType*/ ctx[2] === "full"
		? `Amount to repay in ${/*selectedToken*/ ctx[3]}:`
		: `Equivalent repayment in ${/*loan_details*/ ctx[1].approved_loan_token}:`) + "";

		let t0;
		let t1;
		let t2_value = " " + "";
		let t2;
		let t3;
		let t4_value = /*calculatedAmount*/ ctx[5].toFixed(6) + "";
		let t4;

		const block = {
			c: function create() {
				strong = element("strong");
				t0 = text(t0_value);
				t1 = space();
				t2 = text(t2_value);
				t3 = space();
				t4 = text(t4_value);
				add_location(strong, file$b, 148, 16, 5640);
			},
			m: function mount(target, anchor) {
				insert_dev(target, strong, anchor);
				append_dev(strong, t0);
				append_dev(strong, t1);
				insert_dev(target, t2, anchor);
				insert_dev(target, t3, anchor);
				insert_dev(target, t4, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*repaymentType, selectedToken, loan_details*/ 14 && t0_value !== (t0_value = (/*repaymentType*/ ctx[2] === "full"
				? `Amount to repay in ${/*selectedToken*/ ctx[3]}:`
				: `Equivalent repayment in ${/*loan_details*/ ctx[1].approved_loan_token}:`) + "")) set_data_dev(t0, t0_value);

				if (dirty & /*calculatedAmount*/ 32 && t4_value !== (t4_value = /*calculatedAmount*/ ctx[5].toFixed(6) + "")) set_data_dev(t4, t4_value);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(strong);
					detach_dev(t2);
					detach_dev(t3);
					detach_dev(t4);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$7.name,
			type: "else",
			source: "(148:12) {:else}",
			ctx
		});

		return block;
	}

	// (146:35) 
	function create_if_block_1$5(ctx) {
		let strong;
		let t;

		const block = {
			c: function create() {
				strong = element("strong");
				t = text(/*errorMessage*/ ctx[8]);
				attr_dev(strong, "class", "error svelte-wk584e");
				add_location(strong, file$b, 146, 16, 5558);
			},
			m: function mount(target, anchor) {
				insert_dev(target, strong, anchor);
				append_dev(strong, t);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*errorMessage*/ 256) set_data_dev(t, /*errorMessage*/ ctx[8]);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(strong);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$5.name,
			type: "if",
			source: "(146:35) ",
			ctx
		});

		return block;
	}

	// (144:12) {#if isLoadingRate}
	function create_if_block$7(ctx) {
		let strong;

		const block = {
			c: function create() {
				strong = element("strong");
				strong.textContent = "Fetching exchange rate...";
				add_location(strong, file$b, 144, 16, 5463);
			},
			m: function mount(target, anchor) {
				insert_dev(target, strong, anchor);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(strong);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$7.name,
			type: "if",
			source: "(144:12) {#if isLoadingRate}",
			ctx
		});

		return block;
	}

	function create_fragment$c(ctx) {
		let section;
		let h2;
		let t1;
		let p0;
		let strong0;
		let t3;
		let t4_value = /*loan_details*/ ctx[1].approved_loan_amount + "";
		let t4;
		let t5;
		let t6_value = /*loan_details*/ ctx[1].approved_loan_token + "";
		let t6;
		let t7;
		let p1;
		let strong1;
		let t9;
		let t10;
		let t11;
		let form;
		let label0;
		let t12;
		let select0;
		let option0;
		let option1;
		let t15;
		let t16;
		let label1;
		let t17;
		let select1;
		let t18;
		let p2;
		let t19;
		let button;
		let t20;
		let button_disabled_value;
		let mounted;
		let dispose;
		let if_block0 = /*repaymentType*/ ctx[2] === "partial" && create_if_block_2$3(ctx);
		let each_value = ensure_array_like_dev(/*tokens*/ ctx[9]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
		}

		function select_block_type(ctx, dirty) {
			if (/*isLoadingRate*/ ctx[6]) return create_if_block$7;
			if (/*errorMessage*/ ctx[8]) return create_if_block_1$5;
			return create_else_block$7;
		}

		let current_block_type = select_block_type(ctx);
		let if_block1 = current_block_type(ctx);

		const block = {
			c: function create() {
				section = element("section");
				h2 = element("h2");
				h2.textContent = "Repay Loan";
				t1 = space();
				p0 = element("p");
				strong0 = element("strong");
				strong0.textContent = "Loan Amount:";
				t3 = space();
				t4 = text(t4_value);
				t5 = space();
				t6 = text(t6_value);
				t7 = space();
				p1 = element("p");
				strong1 = element("strong");
				strong1.textContent = "Borrower's Wallet:";
				t9 = space();
				t10 = text(/*wallet_address*/ ctx[0]);
				t11 = space();
				form = element("form");
				label0 = element("label");
				t12 = text("Repayment Type:\n            ");
				select0 = element("select");
				option0 = element("option");
				option0.textContent = "Full";
				option1 = element("option");
				option1.textContent = "Partial";
				t15 = space();
				if (if_block0) if_block0.c();
				t16 = space();
				label1 = element("label");
				t17 = text("Repayment Token:\n            ");
				select1 = element("select");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t18 = space();
				p2 = element("p");
				if_block1.c();
				t19 = space();
				button = element("button");
				t20 = text("Submit Repayment");
				add_location(h2, file$b, 105, 4, 4141);
				add_location(strong0, file$b, 106, 7, 4168);
				add_location(p0, file$b, 106, 4, 4165);
				add_location(strong1, file$b, 107, 7, 4280);
				add_location(p1, file$b, 107, 4, 4277);
				option0.__value = "full";
				set_input_value(option0, option0.__value);
				add_location(option0, file$b, 113, 16, 4528);
				option1.__value = "partial";
				set_input_value(option1, option1.__value);
				add_location(option1, file$b, 114, 16, 4579);
				attr_dev(select0, "class", "svelte-wk584e");
				if (/*repaymentType*/ ctx[2] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[12].call(select0));
				add_location(select0, file$b, 112, 12, 4445);
				attr_dev(label0, "class", "svelte-wk584e");
				add_location(label0, file$b, 110, 8, 4397);
				attr_dev(select1, "class", "svelte-wk584e");
				if (/*selectedToken*/ ctx[3] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[14].call(select1));
				add_location(select1, file$b, 135, 12, 5173);
				attr_dev(label1, "class", "svelte-wk584e");
				add_location(label1, file$b, 133, 8, 5124);
				add_location(p2, file$b, 142, 8, 5411);
				attr_dev(button, "type", "submit");
				attr_dev(button, "class", "btn btn-primary svelte-wk584e");
				button.disabled = button_disabled_value = /*isSubmitDisabled*/ ctx[7] || /*isLoadingRate*/ ctx[6];
				add_location(button, file$b, 157, 8, 5967);
				attr_dev(form, "class", "svelte-wk584e");
				add_location(form, file$b, 109, 4, 4342);
				attr_dev(section, "class", "repay-form svelte-wk584e");
				add_location(section, file$b, 104, 0, 4108);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, section, anchor);
				append_dev(section, h2);
				append_dev(section, t1);
				append_dev(section, p0);
				append_dev(p0, strong0);
				append_dev(p0, t3);
				append_dev(p0, t4);
				append_dev(p0, t5);
				append_dev(p0, t6);
				append_dev(section, t7);
				append_dev(section, p1);
				append_dev(p1, strong1);
				append_dev(p1, t9);
				append_dev(p1, t10);
				append_dev(section, t11);
				append_dev(section, form);
				append_dev(form, label0);
				append_dev(label0, t12);
				append_dev(label0, select0);
				append_dev(select0, option0);
				append_dev(select0, option1);
				select_option(select0, /*repaymentType*/ ctx[2], true);
				append_dev(form, t15);
				if (if_block0) if_block0.m(form, null);
				append_dev(form, t16);
				append_dev(form, label1);
				append_dev(label1, t17);
				append_dev(label1, select1);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(select1, null);
					}
				}

				select_option(select1, /*selectedToken*/ ctx[3], true);
				append_dev(form, t18);
				append_dev(form, p2);
				if_block1.m(p2, null);
				append_dev(form, t19);
				append_dev(form, button);
				append_dev(button, t20);

				if (!mounted) {
					dispose = [
						listen_dev(select0, "change", /*select0_change_handler*/ ctx[12]),
						listen_dev(select0, "change", /*calculateRepayment*/ ctx[10], false, false, false, false),
						listen_dev(select1, "change", /*select1_change_handler*/ ctx[14]),
						listen_dev(select1, "change", /*calculateRepayment*/ ctx[10], false, false, false, false),
						listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[11]), false, true, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*loan_details*/ 2 && t4_value !== (t4_value = /*loan_details*/ ctx[1].approved_loan_amount + "")) set_data_dev(t4, t4_value);
				if (dirty & /*loan_details*/ 2 && t6_value !== (t6_value = /*loan_details*/ ctx[1].approved_loan_token + "")) set_data_dev(t6, t6_value);
				if (dirty & /*wallet_address*/ 1) set_data_dev(t10, /*wallet_address*/ ctx[0]);

				if (dirty & /*repaymentType*/ 4) {
					select_option(select0, /*repaymentType*/ ctx[2]);
				}

				if (/*repaymentType*/ ctx[2] === "partial") {
					if (if_block0) {
						if_block0.p(ctx, dirty);
					} else {
						if_block0 = create_if_block_2$3(ctx);
						if_block0.c();
						if_block0.m(form, t16);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (dirty & /*tokens*/ 512) {
					each_value = ensure_array_like_dev(/*tokens*/ ctx[9]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$4(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block$4(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select1, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}

				if (dirty & /*selectedToken, tokens*/ 520) {
					select_option(select1, /*selectedToken*/ ctx[3]);
				}

				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1.d(1);
					if_block1 = current_block_type(ctx);

					if (if_block1) {
						if_block1.c();
						if_block1.m(p2, null);
					}
				}

				if (dirty & /*isSubmitDisabled, isLoadingRate*/ 192 && button_disabled_value !== (button_disabled_value = /*isSubmitDisabled*/ ctx[7] || /*isLoadingRate*/ ctx[6])) {
					prop_dev(button, "disabled", button_disabled_value);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(section);
				}

				if (if_block0) if_block0.d();
				destroy_each(each_blocks, detaching);
				if_block1.d();
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$c.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$c($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('LoanRepayForm', slots, []);
		let { wallet_address = "" } = $$props;
		let { loan_details = {} } = $$props;
		let repaymentType = "full"; // Default to full repayment
		let selectedToken = loan_details.approved_loan_token; // Default token is the loan token
		let repaymentAmount = 0; // For partial repayments
		let exchangeRate = 1; // Default exchange rate is 1 (same token)
		let calculatedAmount = 0; // The equivalent repayment amount in the selected token
		let tokens = ["ETH", "USDC", "DAI"]; // Available tokens for repayment
		let isLoadingRate = false; // To indicate if exchange rate is being fetched
		let isSubmitDisabled = false; // Disable submission while fetching exchange rate
		let errorMessage = ""; // Error message for invalid input

		onMount(() => {
			// Initialize with the approved loan token
			if (!tokens.includes(selectedToken)) {
				tokens.push(selectedToken);
			}

			calculateRepayment();
		});

		async function fetchExchangeRate(fromToken, toToken) {
			try {
				$$invalidate(6, isLoadingRate = true);
				$$invalidate(7, isSubmitDisabled = true);
				const response = await fetch(`${urlRoot}/api/v1/exchange-rate/${fromToken}/${toToken}`);

				if (response.ok) {
					const data = await response.json();
					return data.rate; // Assume the API returns { rate: <exchange rate> }
				} else {
					console.error("Failed to fetch exchange rate");
					return 1; // Default to 1 if the API fails
				}
			} catch(error) {
				console.error("Error fetching exchange rate:", error);
				return 1; // Default to 1 in case of an error
			} finally {
				$$invalidate(6, isLoadingRate = false);
				$$invalidate(7, isSubmitDisabled = false);
			}
		}

		async function calculateRepayment() {
			$$invalidate(8, errorMessage = ""); // Reset error message

			if (selectedToken !== loan_details.approved_loan_token) {
				exchangeRate = await fetchExchangeRate(selectedToken, loan_details.approved_loan_token);
			} else {
				exchangeRate = 1;
			}

			if (repaymentType === "full") {
				$$invalidate(5, calculatedAmount = loan_details.approved_loan_amount / exchangeRate);
			} else {
				$$invalidate(5, calculatedAmount = repaymentAmount * exchangeRate);

				// Check if the inputted amount exceeds the approved loan amount
				if (calculatedAmount > loan_details.approved_loan_amount) {
					$$invalidate(8, errorMessage = `The repayment amount exceeds the approved loan amount of ${loan_details.approved_loan_amount} ${loan_details.approved_loan_token}.`);
					$$invalidate(7, isSubmitDisabled = true);
				} else {
					$$invalidate(7, isSubmitDisabled = false);
				}
			}
		}

		async function handleSubmit() {
			if (!wallet_address || !selectedToken) {
				alert("Please provide all required details.");
				return;
			}

			const confirmation = confirm(`You are about to repay ${repaymentType === "full"
		? `${loan_details.approved_loan_amount} ${loan_details.approved_loan_token}`
		: `${repaymentAmount} ${selectedToken}`}. Proceed?`);

			if (!confirmation) return;

			try {
				const response = await fetch(`${urlRoot}/api/v1/loan/repay`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						loan_details,
						repayment_amount: repaymentAmount,
						repayment_token: selectedToken
					})
				});

				// check if updated_loan_details is returned
				alert("Repayment successful! Please reload the page to view the updated loan details.");
			} catch(error) {
				console.error("Error during repayment:", error);
				alert("An error occurred during repayment.");
			}
		}

		const writable_props = ['wallet_address', 'loan_details'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$5.warn(`<LoanRepayForm> was created with unknown prop '${key}'`);
		});

		function select0_change_handler() {
			repaymentType = select_value(this);
			$$invalidate(2, repaymentType);
		}

		function input_input_handler() {
			repaymentAmount = to_number(this.value);
			$$invalidate(4, repaymentAmount);
		}

		function select1_change_handler() {
			selectedToken = select_value(this);
			$$invalidate(3, selectedToken);
			$$invalidate(9, tokens);
		}

		$$self.$$set = $$props => {
			if ('wallet_address' in $$props) $$invalidate(0, wallet_address = $$props.wallet_address);
			if ('loan_details' in $$props) $$invalidate(1, loan_details = $$props.loan_details);
		};

		$$self.$capture_state = () => ({
			onMount,
			urlRoot,
			wallet_address,
			loan_details,
			repaymentType,
			selectedToken,
			repaymentAmount,
			exchangeRate,
			calculatedAmount,
			tokens,
			isLoadingRate,
			isSubmitDisabled,
			errorMessage,
			fetchExchangeRate,
			calculateRepayment,
			handleSubmit
		});

		$$self.$inject_state = $$props => {
			if ('wallet_address' in $$props) $$invalidate(0, wallet_address = $$props.wallet_address);
			if ('loan_details' in $$props) $$invalidate(1, loan_details = $$props.loan_details);
			if ('repaymentType' in $$props) $$invalidate(2, repaymentType = $$props.repaymentType);
			if ('selectedToken' in $$props) $$invalidate(3, selectedToken = $$props.selectedToken);
			if ('repaymentAmount' in $$props) $$invalidate(4, repaymentAmount = $$props.repaymentAmount);
			if ('exchangeRate' in $$props) exchangeRate = $$props.exchangeRate;
			if ('calculatedAmount' in $$props) $$invalidate(5, calculatedAmount = $$props.calculatedAmount);
			if ('tokens' in $$props) $$invalidate(9, tokens = $$props.tokens);
			if ('isLoadingRate' in $$props) $$invalidate(6, isLoadingRate = $$props.isLoadingRate);
			if ('isSubmitDisabled' in $$props) $$invalidate(7, isSubmitDisabled = $$props.isSubmitDisabled);
			if ('errorMessage' in $$props) $$invalidate(8, errorMessage = $$props.errorMessage);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			wallet_address,
			loan_details,
			repaymentType,
			selectedToken,
			repaymentAmount,
			calculatedAmount,
			isLoadingRate,
			isSubmitDisabled,
			errorMessage,
			tokens,
			calculateRepayment,
			handleSubmit,
			select0_change_handler,
			input_input_handler,
			select1_change_handler
		];
	}

	class LoanRepayForm extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$c, create_fragment$c, safe_not_equal, { wallet_address: 0, loan_details: 1 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "LoanRepayForm",
				options,
				id: create_fragment$c.name
			});
		}

		get wallet_address() {
			throw new Error("<LoanRepayForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set wallet_address(value) {
			throw new Error("<LoanRepayForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get loan_details() {
			throw new Error("<LoanRepayForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set loan_details(value) {
			throw new Error("<LoanRepayForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/components/WalletCard.svelte generated by Svelte v4.2.19 */
	const file$a = "src/components/WalletCard.svelte";

	function get_each_context$3(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[4] = list[i];
		return child_ctx;
	}

	// (20:60) {:else}
	function create_else_block$6(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("N/A");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$6.name,
			type: "else",
			source: "(20:60) {:else}",
			ctx
		});

		return block;
	}

	// (20:12) {#if wallet.balance.eth}
	function create_if_block_2$2(ctx) {
		let t0_value = /*wallet*/ ctx[0].balance.eth + "";
		let t0;
		let t1;

		const block = {
			c: function create() {
				t0 = text(t0_value);
				t1 = text(" ETH");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t0, anchor);
				insert_dev(target, t1, anchor);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*wallet*/ 1 && t0_value !== (t0_value = /*wallet*/ ctx[0].balance.eth + "")) set_data_dev(t0, t0_value);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(t1);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2$2.name,
			type: "if",
			source: "(20:12) {#if wallet.balance.eth}",
			ctx
		});

		return block;
	}

	// (26:4) {#if wallet.loan_details && wallet.loan_details.length > 0}
	function create_if_block$6(ctx) {
		let section;
		let h4;
		let t1;
		let current;
		let each_value = ensure_array_like_dev(/*wallet*/ ctx[0].loan_details);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		const block = {
			c: function create() {
				section = element("section");
				h4 = element("h4");
				h4.textContent = "Loan Details";
				t1 = space();

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr_dev(h4, "class", "svelte-rezdn3");
				add_location(h4, file$a, 27, 12, 886);
				attr_dev(section, "class", "loan-details svelte-rezdn3");
				add_location(section, file$a, 26, 8, 843);
			},
			m: function mount(target, anchor) {
				insert_dev(target, section, anchor);
				append_dev(section, h4);
				append_dev(section, t1);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(section, null);
					}
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*wallet, showRepayForms, toggleRepayForm, Date*/ 7) {
					each_value = ensure_array_like_dev(/*wallet*/ ctx[0].loan_details);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$3(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block$3(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(section, null);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(section);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$6.name,
			type: "if",
			source: "(26:4) {#if wallet.loan_details && wallet.loan_details.length > 0}",
			ctx
		});

		return block;
	}

	// (48:20) {#if showRepayForms[loan.smart_contract_address]}
	function create_if_block_1$4(ctx) {
		let loanrepayform;
		let current;

		loanrepayform = new LoanRepayForm({
				props: {
					wallet_address: /*wallet*/ ctx[0].default_address.address_id,
					loan_details: /*loan*/ ctx[4]
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(loanrepayform.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(loanrepayform, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const loanrepayform_changes = {};
				if (dirty & /*wallet*/ 1) loanrepayform_changes.wallet_address = /*wallet*/ ctx[0].default_address.address_id;
				if (dirty & /*wallet*/ 1) loanrepayform_changes.loan_details = /*loan*/ ctx[4];
				loanrepayform.$set(loanrepayform_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(loanrepayform.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(loanrepayform.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(loanrepayform, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$4.name,
			type: "if",
			source: "(48:20) {#if showRepayForms[loan.smart_contract_address]}",
			ctx
		});

		return block;
	}

	// (29:12) {#each wallet.loan_details as loan}
	function create_each_block$3(ctx) {
		let div;
		let p0;
		let strong0;
		let t1;
		let t2_value = /*loan*/ ctx[4].status + "";
		let t2;
		let t3;
		let p1;
		let strong1;
		let t5;
		let t6_value = /*loan*/ ctx[4].approved_loan_amount + "";
		let t6;
		let t7;
		let t8_value = /*loan*/ ctx[4].approved_loan_token + "";
		let t8;
		let t9;
		let p2;
		let strong2;
		let t11;
		let t12_value = /*loan*/ ctx[4].collateral_value_in_usd.toFixed(2) + "";
		let t12;
		let t13;
		let p3;
		let strong3;
		let t15;
		let t16_value = /*loan*/ ctx[4].max_loan_amount_in_usd.toFixed(2) + "";
		let t16;
		let t17;
		let p4;
		let strong4;
		let t19;
		let t20_value = /*loan*/ ctx[4].lender_wallet_id + "";
		let t20;
		let t21;
		let p5;
		let strong5;
		let t23;
		let t24_value = /*loan*/ ctx[4].smart_contract_address + "";
		let t24;
		let t25;
		let p6;
		let strong6;
		let t27;
		let a;
		let t28;
		let a_href_value;
		let t29;
		let p7;
		let strong7;
		let t31;
		let t32_value = new Date(/*loan*/ ctx[4].timestamp).toLocaleString() + "";
		let t32;
		let t33;
		let button;

		let t34_value = (/*showRepayForms*/ ctx[1][/*loan*/ ctx[4].smart_contract_address]
		? "Cancel Repayment"
		: "Repay Loan") + "";

		let t34;
		let t35;
		let t36;
		let current;
		let mounted;
		let dispose;

		function click_handler() {
			return /*click_handler*/ ctx[3](/*loan*/ ctx[4]);
		}

		let if_block = /*showRepayForms*/ ctx[1][/*loan*/ ctx[4].smart_contract_address] && create_if_block_1$4(ctx);

		const block = {
			c: function create() {
				div = element("div");
				p0 = element("p");
				strong0 = element("strong");
				strong0.textContent = "Status:";
				t1 = space();
				t2 = text(t2_value);
				t3 = space();
				p1 = element("p");
				strong1 = element("strong");
				strong1.textContent = "Loan Amount:";
				t5 = space();
				t6 = text(t6_value);
				t7 = space();
				t8 = text(t8_value);
				t9 = space();
				p2 = element("p");
				strong2 = element("strong");
				strong2.textContent = "Collateral Value (USD):";
				t11 = text(" $");
				t12 = text(t12_value);
				t13 = space();
				p3 = element("p");
				strong3 = element("strong");
				strong3.textContent = "Max Loan Amount (USD):";
				t15 = text(" $");
				t16 = text(t16_value);
				t17 = space();
				p4 = element("p");
				strong4 = element("strong");
				strong4.textContent = "Lender Wallet ID:";
				t19 = space();
				t20 = text(t20_value);
				t21 = space();
				p5 = element("p");
				strong5 = element("strong");
				strong5.textContent = "Smart Contract Address:";
				t23 = space();
				t24 = text(t24_value);
				t25 = space();
				p6 = element("p");
				strong6 = element("strong");
				strong6.textContent = "Transaction:";
				t27 = space();
				a = element("a");
				t28 = text("View on Explorer");
				t29 = space();
				p7 = element("p");
				strong7 = element("strong");
				strong7.textContent = "Timestamp:";
				t31 = space();
				t32 = text(t32_value);
				t33 = space();
				button = element("button");
				t34 = text(t34_value);
				t35 = space();
				if (if_block) if_block.c();
				t36 = space();
				add_location(strong0, file$a, 30, 23, 1019);
				attr_dev(p0, "class", "svelte-rezdn3");
				add_location(p0, file$a, 30, 20, 1016);
				add_location(strong1, file$a, 31, 23, 1085);
				attr_dev(p1, "class", "svelte-rezdn3");
				add_location(p1, file$a, 31, 20, 1082);
				add_location(strong2, file$a, 32, 23, 1197);
				attr_dev(p2, "class", "svelte-rezdn3");
				add_location(p2, file$a, 32, 20, 1194);
				add_location(strong3, file$a, 33, 23, 1308);
				attr_dev(p3, "class", "svelte-rezdn3");
				add_location(p3, file$a, 33, 20, 1305);
				add_location(strong4, file$a, 34, 23, 1417);
				attr_dev(p4, "class", "svelte-rezdn3");
				add_location(p4, file$a, 34, 20, 1414);
				add_location(strong5, file$a, 35, 23, 1503);
				attr_dev(p5, "class", "svelte-rezdn3");
				add_location(p5, file$a, 35, 20, 1500);
				add_location(strong6, file$a, 37, 24, 1626);
				attr_dev(a, "href", a_href_value = /*loan*/ ctx[4].transaction_link);
				attr_dev(a, "target", "_blank");
				attr_dev(a, "rel", "noopener noreferrer");
				attr_dev(a, "class", "svelte-rezdn3");
				add_location(a, file$a, 38, 24, 1681);
				attr_dev(p6, "class", "svelte-rezdn3");
				add_location(p6, file$a, 36, 20, 1598);
				add_location(strong7, file$a, 42, 23, 1880);
				attr_dev(p7, "class", "svelte-rezdn3");
				add_location(p7, file$a, 42, 20, 1877);
				attr_dev(button, "class", "btn btn-repay svelte-rezdn3");
				add_location(button, file$a, 43, 20, 1976);
				attr_dev(div, "class", "loan-item svelte-rezdn3");
				add_location(div, file$a, 29, 16, 972);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, p0);
				append_dev(p0, strong0);
				append_dev(p0, t1);
				append_dev(p0, t2);
				append_dev(div, t3);
				append_dev(div, p1);
				append_dev(p1, strong1);
				append_dev(p1, t5);
				append_dev(p1, t6);
				append_dev(p1, t7);
				append_dev(p1, t8);
				append_dev(div, t9);
				append_dev(div, p2);
				append_dev(p2, strong2);
				append_dev(p2, t11);
				append_dev(p2, t12);
				append_dev(div, t13);
				append_dev(div, p3);
				append_dev(p3, strong3);
				append_dev(p3, t15);
				append_dev(p3, t16);
				append_dev(div, t17);
				append_dev(div, p4);
				append_dev(p4, strong4);
				append_dev(p4, t19);
				append_dev(p4, t20);
				append_dev(div, t21);
				append_dev(div, p5);
				append_dev(p5, strong5);
				append_dev(p5, t23);
				append_dev(p5, t24);
				append_dev(div, t25);
				append_dev(div, p6);
				append_dev(p6, strong6);
				append_dev(p6, t27);
				append_dev(p6, a);
				append_dev(a, t28);
				append_dev(div, t29);
				append_dev(div, p7);
				append_dev(p7, strong7);
				append_dev(p7, t31);
				append_dev(p7, t32);
				append_dev(div, t33);
				append_dev(div, button);
				append_dev(button, t34);
				append_dev(div, t35);
				if (if_block) if_block.m(div, null);
				append_dev(div, t36);
				current = true;

				if (!mounted) {
					dispose = listen_dev(button, "click", click_handler, false, false, false, false);
					mounted = true;
				}
			},
			p: function update(new_ctx, dirty) {
				ctx = new_ctx;
				if ((!current || dirty & /*wallet*/ 1) && t2_value !== (t2_value = /*loan*/ ctx[4].status + "")) set_data_dev(t2, t2_value);
				if ((!current || dirty & /*wallet*/ 1) && t6_value !== (t6_value = /*loan*/ ctx[4].approved_loan_amount + "")) set_data_dev(t6, t6_value);
				if ((!current || dirty & /*wallet*/ 1) && t8_value !== (t8_value = /*loan*/ ctx[4].approved_loan_token + "")) set_data_dev(t8, t8_value);
				if ((!current || dirty & /*wallet*/ 1) && t12_value !== (t12_value = /*loan*/ ctx[4].collateral_value_in_usd.toFixed(2) + "")) set_data_dev(t12, t12_value);
				if ((!current || dirty & /*wallet*/ 1) && t16_value !== (t16_value = /*loan*/ ctx[4].max_loan_amount_in_usd.toFixed(2) + "")) set_data_dev(t16, t16_value);
				if ((!current || dirty & /*wallet*/ 1) && t20_value !== (t20_value = /*loan*/ ctx[4].lender_wallet_id + "")) set_data_dev(t20, t20_value);
				if ((!current || dirty & /*wallet*/ 1) && t24_value !== (t24_value = /*loan*/ ctx[4].smart_contract_address + "")) set_data_dev(t24, t24_value);

				if (!current || dirty & /*wallet*/ 1 && a_href_value !== (a_href_value = /*loan*/ ctx[4].transaction_link)) {
					attr_dev(a, "href", a_href_value);
				}

				if ((!current || dirty & /*wallet*/ 1) && t32_value !== (t32_value = new Date(/*loan*/ ctx[4].timestamp).toLocaleString() + "")) set_data_dev(t32, t32_value);

				if ((!current || dirty & /*showRepayForms, wallet*/ 3) && t34_value !== (t34_value = (/*showRepayForms*/ ctx[1][/*loan*/ ctx[4].smart_contract_address]
				? "Cancel Repayment"
				: "Repay Loan") + "")) set_data_dev(t34, t34_value);

				if (/*showRepayForms*/ ctx[1][/*loan*/ ctx[4].smart_contract_address]) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty & /*showRepayForms, wallet*/ 3) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block_1$4(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(div, t36);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (if_block) if_block.d();
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$3.name,
			type: "each",
			source: "(29:12) {#each wallet.loan_details as loan}",
			ctx
		});

		return block;
	}

	function create_fragment$b(ctx) {
		let div;
		let header;
		let h3;
		let t1;
		let section;
		let p0;
		let strong0;
		let t3;
		let t4_value = /*wallet*/ ctx[0].id + "";
		let t4;
		let t5;
		let p1;
		let strong1;
		let t7;
		let t8;
		let p2;
		let strong2;
		let t10;
		let t11_value = /*wallet*/ ctx[0].network_id + "";
		let t11;
		let t12;
		let p3;
		let strong3;
		let t14;
		let t15_value = /*wallet*/ ctx[0].default_address.address_id + "";
		let t15;
		let t16;
		let current;

		function select_block_type(ctx, dirty) {
			if (/*wallet*/ ctx[0].balance.eth) return create_if_block_2$2;
			return create_else_block$6;
		}

		let current_block_type = select_block_type(ctx);
		let if_block0 = current_block_type(ctx);
		let if_block1 = /*wallet*/ ctx[0].loan_details && /*wallet*/ ctx[0].loan_details.length > 0 && create_if_block$6(ctx);

		const block = {
			c: function create() {
				div = element("div");
				header = element("header");
				h3 = element("h3");
				h3.textContent = "Wallet Details";
				t1 = space();
				section = element("section");
				p0 = element("p");
				strong0 = element("strong");
				strong0.textContent = "Wallet ID:";
				t3 = space();
				t4 = text(t4_value);
				t5 = space();
				p1 = element("p");
				strong1 = element("strong");
				strong1.textContent = "Balance:";
				t7 = space();
				if_block0.c();
				t8 = space();
				p2 = element("p");
				strong2 = element("strong");
				strong2.textContent = "Network:";
				t10 = space();
				t11 = text(t11_value);
				t12 = space();
				p3 = element("p");
				strong3 = element("strong");
				strong3.textContent = "Address:";
				t14 = space();
				t15 = text(t15_value);
				t16 = space();
				if (if_block1) if_block1.c();
				add_location(h3, file$a, 13, 8, 353);
				attr_dev(header, "class", "card-header svelte-rezdn3");
				add_location(header, file$a, 12, 4, 316);
				add_location(strong0, file$a, 16, 11, 434);
				attr_dev(p0, "class", "svelte-rezdn3");
				add_location(p0, file$a, 16, 8, 431);
				add_location(strong1, file$a, 18, 12, 502);
				attr_dev(p1, "class", "svelte-rezdn3");
				add_location(p1, file$a, 17, 8, 486);
				add_location(strong2, file$a, 21, 11, 628);
				attr_dev(p2, "class", "svelte-rezdn3");
				add_location(p2, file$a, 21, 8, 625);
				add_location(strong3, file$a, 22, 11, 689);
				attr_dev(p3, "class", "svelte-rezdn3");
				add_location(p3, file$a, 22, 8, 686);
				attr_dev(section, "class", "card-body svelte-rezdn3");
				add_location(section, file$a, 15, 4, 395);
				attr_dev(div, "class", "card svelte-rezdn3");
				add_location(div, file$a, 11, 0, 293);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, header);
				append_dev(header, h3);
				append_dev(div, t1);
				append_dev(div, section);
				append_dev(section, p0);
				append_dev(p0, strong0);
				append_dev(p0, t3);
				append_dev(p0, t4);
				append_dev(section, t5);
				append_dev(section, p1);
				append_dev(p1, strong1);
				append_dev(p1, t7);
				if_block0.m(p1, null);
				append_dev(section, t8);
				append_dev(section, p2);
				append_dev(p2, strong2);
				append_dev(p2, t10);
				append_dev(p2, t11);
				append_dev(section, t12);
				append_dev(section, p3);
				append_dev(p3, strong3);
				append_dev(p3, t14);
				append_dev(p3, t15);
				append_dev(div, t16);
				if (if_block1) if_block1.m(div, null);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				if ((!current || dirty & /*wallet*/ 1) && t4_value !== (t4_value = /*wallet*/ ctx[0].id + "")) set_data_dev(t4, t4_value);

				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0.d(1);
					if_block0 = current_block_type(ctx);

					if (if_block0) {
						if_block0.c();
						if_block0.m(p1, null);
					}
				}

				if ((!current || dirty & /*wallet*/ 1) && t11_value !== (t11_value = /*wallet*/ ctx[0].network_id + "")) set_data_dev(t11, t11_value);
				if ((!current || dirty & /*wallet*/ 1) && t15_value !== (t15_value = /*wallet*/ ctx[0].default_address.address_id + "")) set_data_dev(t15, t15_value);

				if (/*wallet*/ ctx[0].loan_details && /*wallet*/ ctx[0].loan_details.length > 0) {
					if (if_block1) {
						if_block1.p(ctx, dirty);

						if (dirty & /*wallet*/ 1) {
							transition_in(if_block1, 1);
						}
					} else {
						if_block1 = create_if_block$6(ctx);
						if_block1.c();
						transition_in(if_block1, 1);
						if_block1.m(div, null);
					}
				} else if (if_block1) {
					group_outros();

					transition_out(if_block1, 1, 1, () => {
						if_block1 = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block1);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block1);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if_block0.d();
				if (if_block1) if_block1.d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$b.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$b($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('WalletCard', slots, []);
		let { wallet = {} } = $$props;
		let showRepayForms = {}; // Track which loans have their repayment form visible

		function toggleRepayForm(loanId) {
			$$invalidate(1, showRepayForms[loanId] = !showRepayForms[loanId], showRepayForms);
		}

		const writable_props = ['wallet'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WalletCard> was created with unknown prop '${key}'`);
		});

		const click_handler = loan => toggleRepayForm(loan.smart_contract_address);

		$$self.$$set = $$props => {
			if ('wallet' in $$props) $$invalidate(0, wallet = $$props.wallet);
		};

		$$self.$capture_state = () => ({
			LoanRepayForm,
			wallet,
			showRepayForms,
			toggleRepayForm
		});

		$$self.$inject_state = $$props => {
			if ('wallet' in $$props) $$invalidate(0, wallet = $$props.wallet);
			if ('showRepayForms' in $$props) $$invalidate(1, showRepayForms = $$props.showRepayForms);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [wallet, showRepayForms, toggleRepayForm, click_handler];
	}

	class WalletCard extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$b, create_fragment$b, safe_not_equal, { wallet: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "WalletCard",
				options,
				id: create_fragment$b.name
			});
		}

		get wallet() {
			throw new Error("<WalletCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set wallet(value) {
			throw new Error("<WalletCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/routes/wallet/index.svelte generated by Svelte v4.2.19 */

	const { console: console_1$4 } = globals;
	const file$9 = "src/routes/wallet/index.svelte";

	function get_each_context$2(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[4] = list[i];
		return child_ctx;
	}

	// (42:4) {:else}
	function create_else_block$5(ctx) {
		let div;
		let current;
		let each_value = ensure_array_like_dev(/*wallets*/ ctx[0]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
		}

		const out = i => transition_out(each_blocks[i], 1, 1, () => {
			each_blocks[i] = null;
		});

		const block = {
			c: function create() {
				div = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr_dev(div, "class", "wallets svelte-7ptmsr");
				add_location(div, file$9, 42, 8, 1275);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div, null);
					}
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*wallets*/ 1) {
					each_value = ensure_array_like_dev(/*wallets*/ ctx[0]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$2(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
							transition_in(each_blocks[i], 1);
						} else {
							each_blocks[i] = create_each_block$2(child_ctx);
							each_blocks[i].c();
							transition_in(each_blocks[i], 1);
							each_blocks[i].m(div, null);
						}
					}

					group_outros();

					for (i = each_value.length; i < each_blocks.length; i += 1) {
						out(i);
					}

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;

				for (let i = 0; i < each_value.length; i += 1) {
					transition_in(each_blocks[i]);
				}

				current = true;
			},
			o: function outro(local) {
				each_blocks = each_blocks.filter(Boolean);

				for (let i = 0; i < each_blocks.length; i += 1) {
					transition_out(each_blocks[i]);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				destroy_each(each_blocks, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$5.name,
			type: "else",
			source: "(42:4) {:else}",
			ctx
		});

		return block;
	}

	// (40:27) 
	function create_if_block_1$3(ctx) {
		let p;
		let t;

		const block = {
			c: function create() {
				p = element("p");
				t = text(/*errorMessage*/ ctx[2]);
				attr_dev(p, "class", "error-text svelte-7ptmsr");
				add_location(p, file$9, 40, 8, 1214);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);
				append_dev(p, t);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*errorMessage*/ 4) set_data_dev(t, /*errorMessage*/ ctx[2]);
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(p);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$3.name,
			type: "if",
			source: "(40:27) ",
			ctx
		});

		return block;
	}

	// (38:4) {#if isLoading}
	function create_if_block$5(ctx) {
		let p;

		const block = {
			c: function create() {
				p = element("p");
				p.textContent = "Loading wallets...";
				add_location(p, file$9, 38, 8, 1152);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);
			},
			p: noop,
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(p);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$5.name,
			type: "if",
			source: "(38:4) {#if isLoading}",
			ctx
		});

		return block;
	}

	// (44:12) {#each wallets as wallet}
	function create_each_block$2(ctx) {
		let walletcard;
		let current;

		walletcard = new WalletCard({
				props: { wallet: /*wallet*/ ctx[4] },
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(walletcard.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(walletcard, target, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				const walletcard_changes = {};
				if (dirty & /*wallets*/ 1) walletcard_changes.wallet = /*wallet*/ ctx[4];
				walletcard.$set(walletcard_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(walletcard.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(walletcard.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				destroy_component(walletcard, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$2.name,
			type: "each",
			source: "(44:12) {#each wallets as wallet}",
			ctx
		});

		return block;
	}

	function create_fragment$a(ctx) {
		let section;
		let h1;
		let t1;
		let p;
		let t3;
		let current_block_type_index;
		let if_block;
		let current;
		const if_block_creators = [create_if_block$5, create_if_block_1$3, create_else_block$5];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*isLoading*/ ctx[1]) return 0;
			if (/*errorMessage*/ ctx[2]) return 1;
			return 2;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				section = element("section");
				h1 = element("h1");
				h1.textContent = "Wallet Dashboard";
				t1 = space();
				p = element("p");
				p.textContent = "Here you can view all your wallets and their details.";
				t3 = space();
				if_block.c();
				add_location(h1, file$9, 34, 4, 1028);
				add_location(p, file$9, 35, 4, 1058);
				attr_dev(section, "class", "dashboard svelte-7ptmsr");
				add_location(section, file$9, 33, 0, 996);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, section, anchor);
				append_dev(section, h1);
				append_dev(section, t1);
				append_dev(section, p);
				append_dev(section, t3);
				if_blocks[current_block_type_index].m(section, null);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(section, null);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(section);
				}

				if_blocks[current_block_type_index].d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$a.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$a($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Wallet', slots, []);
		let wallets = [];
		let isLoading = true;
		let errorMessage = "";

		// Fetch wallets from the API
		async function fetchWallets() {
			try {
				const response = await fetch(`${urlRoot}/api/v1/wallets`);

				if (response.ok) {
					$$invalidate(0, wallets = await response.json());
					$$invalidate(2, errorMessage = wallets.length ? "" : "No wallets found.");
				} else {
					$$invalidate(2, errorMessage = "Failed to fetch wallets.");
				}
			} catch(error) {
				console.error("Error fetching wallets:", error);
				$$invalidate(2, errorMessage = "Error fetching wallets. Please check your connection.");
			} finally {
				$$invalidate(1, isLoading = false);
			}
		}

		// Call fetchWallets when the component is mounted
		onMount(() => {
			fetchWallets();
		});

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$4.warn(`<Wallet> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({
			WalletCard,
			onMount,
			urlRoot,
			wallets,
			isLoading,
			errorMessage,
			fetchWallets
		});

		$$self.$inject_state = $$props => {
			if ('wallets' in $$props) $$invalidate(0, wallets = $$props.wallets);
			if ('isLoading' in $$props) $$invalidate(1, isLoading = $$props.isLoading);
			if ('errorMessage' in $$props) $$invalidate(2, errorMessage = $$props.errorMessage);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [wallets, isLoading, errorMessage];
	}

	class Wallet extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Wallet",
				options,
				id: create_fragment$a.name
			});
		}
	}

	/* src/components/WalletForm.svelte generated by Svelte v4.2.19 */
	const file$8 = "src/components/WalletForm.svelte";

	function create_fragment$9(ctx) {
		let div;
		let button;

		let t_value = (/*loading*/ ctx[0]
		? "Creating Wallet..."
		: "Create Wallet") + "";

		let t;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				div = element("div");
				button = element("button");
				t = text(t_value);
				attr_dev(button, "class", "btn svelte-htre7s");
				button.disabled = /*loading*/ ctx[0];
				add_location(button, file$8, 12, 4, 236);
				attr_dev(div, "class", "wallet-form svelte-htre7s");
				add_location(div, file$8, 11, 0, 206);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, button);
				append_dev(button, t);

				if (!mounted) {
					dispose = listen_dev(button, "click", /*handleCreateWallet*/ ctx[1], false, false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*loading*/ 1 && t_value !== (t_value = (/*loading*/ ctx[0]
				? "Creating Wallet..."
				: "Create Wallet") + "")) set_data_dev(t, t_value);

				if (dirty & /*loading*/ 1) {
					prop_dev(button, "disabled", /*loading*/ ctx[0]);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$9.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$9($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('WalletForm', slots, []);
		let { onCreateWallet } = $$props;
		let loading = false;

		async function handleCreateWallet() {
			$$invalidate(0, loading = true);
			await onCreateWallet();
			$$invalidate(0, loading = false);
		}

		$$self.$$.on_mount.push(function () {
			if (onCreateWallet === undefined && !('onCreateWallet' in $$props || $$self.$$.bound[$$self.$$.props['onCreateWallet']])) {
				console.warn("<WalletForm> was created without expected prop 'onCreateWallet'");
			}
		});

		const writable_props = ['onCreateWallet'];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WalletForm> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('onCreateWallet' in $$props) $$invalidate(2, onCreateWallet = $$props.onCreateWallet);
		};

		$$self.$capture_state = () => ({
			onCreateWallet,
			loading,
			handleCreateWallet
		});

		$$self.$inject_state = $$props => {
			if ('onCreateWallet' in $$props) $$invalidate(2, onCreateWallet = $$props.onCreateWallet);
			if ('loading' in $$props) $$invalidate(0, loading = $$props.loading);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [loading, handleCreateWallet, onCreateWallet];
	}

	class WalletForm extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$9, create_fragment$9, safe_not_equal, { onCreateWallet: 2 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "WalletForm",
				options,
				id: create_fragment$9.name
			});
		}

		get onCreateWallet() {
			throw new Error("<WalletForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set onCreateWallet(value) {
			throw new Error("<WalletForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/routes/wallet/create.svelte generated by Svelte v4.2.19 */

	const { Error: Error_1$1, console: console_1$3 } = globals;
	const file$7 = "src/routes/wallet/create.svelte";

	// (36:4) {:else}
	function create_else_block$4(ctx) {
		let div;
		let walletform;
		let current;

		walletform = new WalletForm({
				props: { onCreateWallet: /*createWallet*/ ctx[1] },
				$$inline: true
			});

		const block = {
			c: function create() {
				div = element("div");
				create_component(walletform.$$.fragment);
				attr_dev(div, "class", "wallet-form svelte-v4c3pd");
				add_location(div, file$7, 36, 8, 1031);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				mount_component(walletform, div, null);
				current = true;
			},
			p: noop,
			i: function intro(local) {
				if (current) return;
				transition_in(walletform.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(walletform.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				destroy_component(walletform);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$4.name,
			type: "else",
			source: "(36:4) {:else}",
			ctx
		});

		return block;
	}

	// (32:4) {#if wallet}
	function create_if_block$4(ctx) {
		let div;
		let walletcard;
		let current;

		walletcard = new WalletCard({
				props: { wallet: /*wallet*/ ctx[0] },
				$$inline: true
			});

		const block = {
			c: function create() {
				div = element("div");
				create_component(walletcard.$$.fragment);
				attr_dev(div, "class", "wallet-display svelte-v4c3pd");
				add_location(div, file$7, 32, 8, 931);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				mount_component(walletcard, div, null);
				current = true;
			},
			p: function update(ctx, dirty) {
				const walletcard_changes = {};
				if (dirty & /*wallet*/ 1) walletcard_changes.wallet = /*wallet*/ ctx[0];
				walletcard.$set(walletcard_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(walletcard.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(walletcard.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				destroy_component(walletcard);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$4.name,
			type: "if",
			source: "(32:4) {#if wallet}",
			ctx
		});

		return block;
	}

	function create_fragment$8(ctx) {
		let section;
		let h1;
		let t1;
		let p;
		let t3;
		let current_block_type_index;
		let if_block;
		let current;
		const if_block_creators = [create_if_block$4, create_else_block$4];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*wallet*/ ctx[0]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				section = element("section");
				h1 = element("h1");
				h1.textContent = "Create a Wallet";
				t1 = space();
				p = element("p");
				p.textContent = "Securely create a new wallet to manage your decentralized assets.";
				t3 = space();
				if_block.c();
				attr_dev(h1, "class", "svelte-v4c3pd");
				add_location(h1, file$7, 28, 4, 803);
				attr_dev(p, "class", "svelte-v4c3pd");
				add_location(p, file$7, 29, 4, 832);
				attr_dev(section, "class", "create-wallet-container svelte-v4c3pd");
				add_location(section, file$7, 27, 0, 757);
			},
			l: function claim(nodes) {
				throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, section, anchor);
				append_dev(section, h1);
				append_dev(section, t1);
				append_dev(section, p);
				append_dev(section, t3);
				if_blocks[current_block_type_index].m(section, null);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(section, null);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(section);
				}

				if_blocks[current_block_type_index].d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$8.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$8($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Create', slots, []);
		let wallet = null;

		async function createWallet() {
			try {
				const response = await fetch(`${urlRoot}/api/v1/wallet/create`, {
					method: "POST",
					headers: { "Content-Type": "application/json" }
				});

				if (!response.ok) {
					throw new Error("Failed to create wallet");
				}

				$$invalidate(0, wallet = await response.json());
			} catch(error) {
				console.error("Error creating wallet:", error);
			}
		}

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<Create> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({
			WalletCard,
			WalletForm,
			urlRoot,
			wallet,
			createWallet
		});

		$$self.$inject_state = $$props => {
			if ('wallet' in $$props) $$invalidate(0, wallet = $$props.wallet);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [wallet, createWallet];
	}

	class Create extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Create",
				options,
				id: create_fragment$8.name
			});
		}
	}

	/* src/components/LoanRequestForm.svelte generated by Svelte v4.2.19 */

	const { Error: Error_1, console: console_1$2 } = globals;
	const file$6 = "src/components/LoanRequestForm.svelte";

	function get_each_context$1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[28] = list[i];
		return child_ctx;
	}

	function get_each_context_1$1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[31] = list[i];
		return child_ctx;
	}

	function get_each_context_2(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[34] = list[i];
		return child_ctx;
	}

	function get_each_context_3(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[37] = list[i];
		return child_ctx;
	}

	function get_each_context_4(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[40] = list[i];
		return child_ctx;
	}

	function get_each_context_5(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[40] = list[i];
		return child_ctx;
	}

	function get_each_context_6(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[37] = list[i];
		return child_ctx;
	}

	// (161:8) {#if step === 1}
	function create_if_block_6(ctx) {
		let div;
		let h2;
		let t1;
		let label0;
		let t2;
		let input0;
		let t3;
		let label1;
		let t4;
		let select;
		let option_1;
		let t6;
		let label2;
		let t7;
		let input1;
		let t8;
		let label3;
		let t9;
		let input2;
		let mounted;
		let dispose;
		let each_value_6 = ensure_array_like_dev(/*tokens*/ ctx[4]);
		let each_blocks = [];

		for (let i = 0; i < each_value_6.length; i += 1) {
			each_blocks[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
		}

		const block = {
			c: function create() {
				div = element("div");
				h2 = element("h2");
				h2.textContent = "Step 1: Loan and Personal Details";
				t1 = space();
				label0 = element("label");
				t2 = text("Loan Amount:\n                ");
				input0 = element("input");
				t3 = space();
				label1 = element("label");
				t4 = text("Select Token:\n                ");
				select = element("select");
				option_1 = element("option");
				option_1.textContent = "Select a token";

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t6 = space();
				label2 = element("label");
				t7 = text("Age:\n                ");
				input1 = element("input");
				t8 = space();
				label3 = element("label");
				t9 = text("Occupation:\n                ");
				input2 = element("input");
				attr_dev(h2, "class", "svelte-1djcpp2");
				add_location(h2, file$6, 162, 12, 5715);
				attr_dev(input0, "type", "number");
				attr_dev(input0, "placeholder", "Enter loan amount");
				input0.required = true;
				attr_dev(input0, "class", "svelte-1djcpp2");
				add_location(input0, file$6, 165, 16, 5823);
				attr_dev(label0, "class", "svelte-1djcpp2");
				add_location(label0, file$6, 163, 12, 5770);
				option_1.__value = "";
				set_input_value(option_1, option_1.__value);
				option_1.disabled = true;
				add_location(option_1, file$6, 176, 20, 6173);
				select.required = true;
				attr_dev(select, "class", "svelte-1djcpp2");
				if (/*loanDetails*/ ctx[3].token === void 0) add_render_callback(() => /*select_change_handler*/ ctx[13].call(select));
				add_location(select, file$6, 175, 16, 6104);
				attr_dev(label1, "class", "svelte-1djcpp2");
				add_location(label1, file$6, 173, 12, 6050);
				attr_dev(input1, "type", "number");
				attr_dev(input1, "placeholder", "Enter your age");
				input1.required = true;
				attr_dev(input1, "class", "svelte-1djcpp2");
				add_location(input1, file$6, 185, 16, 6463);
				attr_dev(label2, "class", "svelte-1djcpp2");
				add_location(label2, file$6, 183, 12, 6418);
				attr_dev(input2, "type", "text");
				attr_dev(input2, "placeholder", "Enter your occupation");
				input2.required = true;
				attr_dev(input2, "class", "svelte-1djcpp2");
				add_location(input2, file$6, 195, 16, 6736);
				attr_dev(label3, "class", "svelte-1djcpp2");
				add_location(label3, file$6, 193, 12, 6684);
				attr_dev(div, "class", "form-step");
				add_location(div, file$6, 161, 8, 5679);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, h2);
				append_dev(div, t1);
				append_dev(div, label0);
				append_dev(label0, t2);
				append_dev(label0, input0);
				set_input_value(input0, /*loanDetails*/ ctx[3].amount);
				append_dev(div, t3);
				append_dev(div, label1);
				append_dev(label1, t4);
				append_dev(label1, select);
				append_dev(select, option_1);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(select, null);
					}
				}

				select_option(select, /*loanDetails*/ ctx[3].token, true);
				append_dev(div, t6);
				append_dev(div, label2);
				append_dev(label2, t7);
				append_dev(label2, input1);
				set_input_value(input1, /*loanDetails*/ ctx[3].age);
				append_dev(div, t8);
				append_dev(div, label3);
				append_dev(label3, t9);
				append_dev(label3, input2);
				set_input_value(input2, /*loanDetails*/ ctx[3].occupation);

				if (!mounted) {
					dispose = [
						listen_dev(input0, "input", /*input0_input_handler*/ ctx[12]),
						listen_dev(select, "change", /*select_change_handler*/ ctx[13]),
						listen_dev(input1, "input", /*input1_input_handler*/ ctx[14]),
						listen_dev(input2, "input", /*input2_input_handler*/ ctx[15])
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*loanDetails, tokens*/ 24 && to_number(input0.value) !== /*loanDetails*/ ctx[3].amount) {
					set_input_value(input0, /*loanDetails*/ ctx[3].amount);
				}

				if (dirty[0] & /*tokens*/ 16) {
					each_value_6 = ensure_array_like_dev(/*tokens*/ ctx[4]);
					let i;

					for (i = 0; i < each_value_6.length; i += 1) {
						const child_ctx = get_each_context_6(ctx, each_value_6, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block_6(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value_6.length;
				}

				if (dirty[0] & /*loanDetails, tokens*/ 24) {
					select_option(select, /*loanDetails*/ ctx[3].token);
				}

				if (dirty[0] & /*loanDetails, tokens*/ 24 && to_number(input1.value) !== /*loanDetails*/ ctx[3].age) {
					set_input_value(input1, /*loanDetails*/ ctx[3].age);
				}

				if (dirty[0] & /*loanDetails, tokens*/ 24 && input2.value !== /*loanDetails*/ ctx[3].occupation) {
					set_input_value(input2, /*loanDetails*/ ctx[3].occupation);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				destroy_each(each_blocks, detaching);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_6.name,
			type: "if",
			source: "(161:8) {#if step === 1}",
			ctx
		});

		return block;
	}

	// (178:20) {#each tokens as token}
	function create_each_block_6(ctx) {
		let option_1;
		let t_value = /*token*/ ctx[37] + "";
		let t;

		const block = {
			c: function create() {
				option_1 = element("option");
				t = text(t_value);
				option_1.__value = /*token*/ ctx[37];
				set_input_value(option_1, option_1.__value);
				add_location(option_1, file$6, 178, 24, 6291);
			},
			m: function mount(target, anchor) {
				insert_dev(target, option_1, anchor);
				append_dev(option_1, t);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(option_1);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_6.name,
			type: "each",
			source: "(178:20) {#each tokens as token}",
			ctx
		});

		return block;
	}

	// (206:8) {#if step === 2}
	function create_if_block_5(ctx) {
		let div;
		let h2;
		let t1;
		let label0;
		let t2;
		let input0;
		let t3;
		let label1;
		let t4;
		let select0;
		let option0;
		let t6;
		let label2;
		let t7;
		let input1;
		let t8;
		let label3;
		let t9;
		let select1;
		let option1;
		let t11;
		let label4;
		let t12;
		let textarea;
		let mounted;
		let dispose;
		let each_value_5 = ensure_array_like_dev(/*fiatCurrencies*/ ctx[5]);
		let each_blocks_1 = [];

		for (let i = 0; i < each_value_5.length; i += 1) {
			each_blocks_1[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
		}

		let each_value_4 = ensure_array_like_dev(/*fiatCurrencies*/ ctx[5]);
		let each_blocks = [];

		for (let i = 0; i < each_value_4.length; i += 1) {
			each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
		}

		const block = {
			c: function create() {
				div = element("div");
				h2 = element("h2");
				h2.textContent = "Step 2: Financial Details";
				t1 = space();
				label0 = element("label");
				t2 = text("Monthly Income:\n                ");
				input0 = element("input");
				t3 = space();
				label1 = element("label");
				t4 = text("Income Currency:\n                ");
				select0 = element("select");
				option0 = element("option");
				option0.textContent = "Select a currency";

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].c();
				}

				t6 = space();
				label2 = element("label");
				t7 = text("Monthly Expense:\n                ");
				input1 = element("input");
				t8 = space();
				label3 = element("label");
				t9 = text("Expense Currency:\n                ");
				select1 = element("select");
				option1 = element("option");
				option1.textContent = "Select a currency";

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t11 = space();
				label4 = element("label");
				t12 = text("Purpose of Loan:\n                ");
				textarea = element("textarea");
				attr_dev(h2, "class", "svelte-1djcpp2");
				add_location(h2, file$6, 207, 12, 7055);
				attr_dev(input0, "type", "number");
				attr_dev(input0, "placeholder", "Enter your income");
				input0.required = true;
				attr_dev(input0, "class", "svelte-1djcpp2");
				add_location(input0, file$6, 210, 16, 7158);
				attr_dev(label0, "class", "svelte-1djcpp2");
				add_location(label0, file$6, 208, 12, 7102);
				option0.__value = "";
				set_input_value(option0, option0.__value);
				option0.disabled = true;
				add_location(option0, file$6, 221, 20, 7520);
				select0.required = true;
				attr_dev(select0, "class", "svelte-1djcpp2");
				if (/*loanDetails*/ ctx[3].incomeCurrency === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[17].call(select0));
				add_location(select0, file$6, 220, 16, 7442);
				attr_dev(label1, "class", "svelte-1djcpp2");
				add_location(label1, file$6, 218, 12, 7385);
				attr_dev(input1, "type", "number");
				attr_dev(input1, "placeholder", "Enter your expense");
				input1.required = true;
				attr_dev(input1, "class", "svelte-1djcpp2");
				add_location(input1, file$6, 230, 16, 7842);
				attr_dev(label2, "class", "svelte-1djcpp2");
				add_location(label2, file$6, 228, 12, 7785);
				option1.__value = "";
				set_input_value(option1, option1.__value);
				option1.disabled = true;
				add_location(option1, file$6, 241, 20, 8208);
				select1.required = true;
				attr_dev(select1, "class", "svelte-1djcpp2");
				if (/*loanDetails*/ ctx[3].expenseCurrency === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[19].call(select1));
				add_location(select1, file$6, 240, 16, 8129);
				attr_dev(label3, "class", "svelte-1djcpp2");
				add_location(label3, file$6, 238, 12, 8071);
				attr_dev(textarea, "placeholder", "Why do you need this loan?");
				textarea.required = true;
				attr_dev(textarea, "class", "svelte-1djcpp2");
				add_location(textarea, file$6, 250, 16, 8530);
				attr_dev(label4, "class", "svelte-1djcpp2");
				add_location(label4, file$6, 248, 12, 8473);
				attr_dev(div, "class", "form-step");
				add_location(div, file$6, 206, 8, 7019);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, h2);
				append_dev(div, t1);
				append_dev(div, label0);
				append_dev(label0, t2);
				append_dev(label0, input0);
				set_input_value(input0, /*loanDetails*/ ctx[3].income);
				append_dev(div, t3);
				append_dev(div, label1);
				append_dev(label1, t4);
				append_dev(label1, select0);
				append_dev(select0, option0);

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					if (each_blocks_1[i]) {
						each_blocks_1[i].m(select0, null);
					}
				}

				select_option(select0, /*loanDetails*/ ctx[3].incomeCurrency, true);
				append_dev(div, t6);
				append_dev(div, label2);
				append_dev(label2, t7);
				append_dev(label2, input1);
				set_input_value(input1, /*loanDetails*/ ctx[3].expense);
				append_dev(div, t8);
				append_dev(div, label3);
				append_dev(label3, t9);
				append_dev(label3, select1);
				append_dev(select1, option1);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(select1, null);
					}
				}

				select_option(select1, /*loanDetails*/ ctx[3].expenseCurrency, true);
				append_dev(div, t11);
				append_dev(div, label4);
				append_dev(label4, t12);
				append_dev(label4, textarea);
				set_input_value(textarea, /*loanDetails*/ ctx[3].purpose);

				if (!mounted) {
					dispose = [
						listen_dev(input0, "input", /*input0_input_handler_1*/ ctx[16]),
						listen_dev(select0, "change", /*select0_change_handler*/ ctx[17]),
						listen_dev(input1, "input", /*input1_input_handler_1*/ ctx[18]),
						listen_dev(select1, "change", /*select1_change_handler*/ ctx[19]),
						listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[20])
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*loanDetails, tokens*/ 24 && to_number(input0.value) !== /*loanDetails*/ ctx[3].income) {
					set_input_value(input0, /*loanDetails*/ ctx[3].income);
				}

				if (dirty[0] & /*fiatCurrencies*/ 32) {
					each_value_5 = ensure_array_like_dev(/*fiatCurrencies*/ ctx[5]);
					let i;

					for (i = 0; i < each_value_5.length; i += 1) {
						const child_ctx = get_each_context_5(ctx, each_value_5, i);

						if (each_blocks_1[i]) {
							each_blocks_1[i].p(child_ctx, dirty);
						} else {
							each_blocks_1[i] = create_each_block_5(child_ctx);
							each_blocks_1[i].c();
							each_blocks_1[i].m(select0, null);
						}
					}

					for (; i < each_blocks_1.length; i += 1) {
						each_blocks_1[i].d(1);
					}

					each_blocks_1.length = each_value_5.length;
				}

				if (dirty[0] & /*loanDetails, tokens*/ 24) {
					select_option(select0, /*loanDetails*/ ctx[3].incomeCurrency);
				}

				if (dirty[0] & /*loanDetails, tokens*/ 24 && to_number(input1.value) !== /*loanDetails*/ ctx[3].expense) {
					set_input_value(input1, /*loanDetails*/ ctx[3].expense);
				}

				if (dirty[0] & /*fiatCurrencies*/ 32) {
					each_value_4 = ensure_array_like_dev(/*fiatCurrencies*/ ctx[5]);
					let i;

					for (i = 0; i < each_value_4.length; i += 1) {
						const child_ctx = get_each_context_4(ctx, each_value_4, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block_4(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select1, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value_4.length;
				}

				if (dirty[0] & /*loanDetails, tokens*/ 24) {
					select_option(select1, /*loanDetails*/ ctx[3].expenseCurrency);
				}

				if (dirty[0] & /*loanDetails, tokens*/ 24) {
					set_input_value(textarea, /*loanDetails*/ ctx[3].purpose);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				destroy_each(each_blocks_1, detaching);
				destroy_each(each_blocks, detaching);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_5.name,
			type: "if",
			source: "(206:8) {#if step === 2}",
			ctx
		});

		return block;
	}

	// (223:20) {#each fiatCurrencies as currency}
	function create_each_block_5(ctx) {
		let option_1;
		let t_value = /*currency*/ ctx[40] + "";
		let t;

		const block = {
			c: function create() {
				option_1 = element("option");
				t = text(t_value);
				option_1.__value = /*currency*/ ctx[40];
				set_input_value(option_1, option_1.__value);
				add_location(option_1, file$6, 223, 24, 7652);
			},
			m: function mount(target, anchor) {
				insert_dev(target, option_1, anchor);
				append_dev(option_1, t);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(option_1);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_5.name,
			type: "each",
			source: "(223:20) {#each fiatCurrencies as currency}",
			ctx
		});

		return block;
	}

	// (243:20) {#each fiatCurrencies as currency}
	function create_each_block_4(ctx) {
		let option_1;
		let t_value = /*currency*/ ctx[40] + "";
		let t;

		const block = {
			c: function create() {
				option_1 = element("option");
				t = text(t_value);
				option_1.__value = /*currency*/ ctx[40];
				set_input_value(option_1, option_1.__value);
				add_location(option_1, file$6, 243, 24, 8340);
			},
			m: function mount(target, anchor) {
				insert_dev(target, option_1, anchor);
				append_dev(option_1, t);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(option_1);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_4.name,
			type: "each",
			source: "(243:20) {#each fiatCurrencies as currency}",
			ctx
		});

		return block;
	}

	// (260:8) {#if step === 3}
	function create_if_block_2$1(ctx) {
		let div;
		let h2;
		let t1;
		let label0;
		let t2;
		let select0;
		let option0;
		let option1;
		let option2;
		let t6;
		let t7;
		let t8;
		let label1;
		let t9;
		let select1;
		let option3;
		let t11;
		let label2;
		let t12;
		let select2;
		let option4;
		let mounted;
		let dispose;
		let if_block0 = /*loanDetails*/ ctx[3].collateralType === "crypto" && create_if_block_4(ctx);
		let if_block1 = /*loanDetails*/ ctx[3].collateralType === "real-world" && create_if_block_3(ctx);
		let each_value_1 = ensure_array_like_dev(/*durations*/ ctx[6]);
		let each_blocks_1 = [];

		for (let i = 0; i < each_value_1.length; i += 1) {
			each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
		}

		let each_value = ensure_array_like_dev(/*wallets*/ ctx[1]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
		}

		const block = {
			c: function create() {
				div = element("div");
				h2 = element("h2");
				h2.textContent = "Step 3: Collateral Details";
				t1 = space();
				label0 = element("label");
				t2 = text("Collateral Type:\n                ");
				select0 = element("select");
				option0 = element("option");
				option0.textContent = "Select a type";
				option1 = element("option");
				option1.textContent = "Crypto";
				option2 = element("option");
				option2.textContent = "Real-World Asset";
				t6 = space();
				if (if_block0) if_block0.c();
				t7 = space();
				if (if_block1) if_block1.c();
				t8 = space();
				label1 = element("label");
				t9 = text("Loan Duration:\n                ");
				select1 = element("select");
				option3 = element("option");
				option3.textContent = "Select duration";

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].c();
				}

				t11 = space();
				label2 = element("label");
				t12 = text("Select Wallet:\n                ");
				select2 = element("select");
				option4 = element("option");
				option4.textContent = "Select a wallet";

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				attr_dev(h2, "class", "svelte-1djcpp2");
				add_location(h2, file$6, 261, 12, 8832);
				option0.__value = "";
				set_input_value(option0, option0.__value);
				option0.disabled = true;
				add_location(option0, file$6, 265, 20, 9015);
				option1.__value = "crypto";
				set_input_value(option1, option1.__value);
				add_location(option1, file$6, 266, 20, 9084);
				option2.__value = "real-world";
				set_input_value(option2, option2.__value);
				add_location(option2, file$6, 267, 20, 9143);
				select0.required = true;
				attr_dev(select0, "class", "svelte-1djcpp2");
				if (/*loanDetails*/ ctx[3].collateralType === void 0) add_render_callback(() => /*select0_change_handler_1*/ ctx[21].call(select0));
				add_location(select0, file$6, 264, 16, 8937);
				attr_dev(label0, "class", "svelte-1djcpp2");
				add_location(label0, file$6, 262, 12, 8880);
				option3.__value = "";
				set_input_value(option3, option3.__value);
				option3.disabled = true;
				add_location(option3, file$6, 318, 20, 10919);
				select1.required = true;
				attr_dev(select1, "class", "svelte-1djcpp2");
				if (/*loanDetails*/ ctx[3].duration === void 0) add_render_callback(() => /*select1_change_handler_1*/ ctx[25].call(select1));
				add_location(select1, file$6, 317, 16, 10847);
				attr_dev(label1, "class", "svelte-1djcpp2");
				add_location(label1, file$6, 315, 12, 10792);
				option4.__value = "";
				set_input_value(option4, option4.__value);
				option4.disabled = true;
				add_location(option4, file$6, 328, 20, 11298);
				select2.required = true;
				attr_dev(select2, "class", "svelte-1djcpp2");
				if (/*selectedWallet*/ ctx[2] === void 0) add_render_callback(() => /*select2_change_handler*/ ctx[26].call(select2));
				add_location(select2, file$6, 327, 16, 11232);
				attr_dev(label2, "class", "svelte-1djcpp2");
				add_location(label2, file$6, 325, 12, 11177);
				attr_dev(div, "class", "form-step");
				add_location(div, file$6, 260, 8, 8796);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);
				append_dev(div, h2);
				append_dev(div, t1);
				append_dev(div, label0);
				append_dev(label0, t2);
				append_dev(label0, select0);
				append_dev(select0, option0);
				append_dev(select0, option1);
				append_dev(select0, option2);
				select_option(select0, /*loanDetails*/ ctx[3].collateralType, true);
				append_dev(div, t6);
				if (if_block0) if_block0.m(div, null);
				append_dev(div, t7);
				if (if_block1) if_block1.m(div, null);
				append_dev(div, t8);
				append_dev(div, label1);
				append_dev(label1, t9);
				append_dev(label1, select1);
				append_dev(select1, option3);

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					if (each_blocks_1[i]) {
						each_blocks_1[i].m(select1, null);
					}
				}

				select_option(select1, /*loanDetails*/ ctx[3].duration, true);
				append_dev(div, t11);
				append_dev(div, label2);
				append_dev(label2, t12);
				append_dev(label2, select2);
				append_dev(select2, option4);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(select2, null);
					}
				}

				select_option(select2, /*selectedWallet*/ ctx[2], true);

				if (!mounted) {
					dispose = [
						listen_dev(select0, "change", /*select0_change_handler_1*/ ctx[21]),
						listen_dev(select1, "change", /*select1_change_handler_1*/ ctx[25]),
						listen_dev(select2, "change", /*select2_change_handler*/ ctx[26])
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*loanDetails, tokens*/ 24) {
					select_option(select0, /*loanDetails*/ ctx[3].collateralType);
				}

				if (/*loanDetails*/ ctx[3].collateralType === "crypto") {
					if (if_block0) {
						if_block0.p(ctx, dirty);
					} else {
						if_block0 = create_if_block_4(ctx);
						if_block0.c();
						if_block0.m(div, t7);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (/*loanDetails*/ ctx[3].collateralType === "real-world") {
					if (if_block1) {
						if_block1.p(ctx, dirty);
					} else {
						if_block1 = create_if_block_3(ctx);
						if_block1.c();
						if_block1.m(div, t8);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if (dirty[0] & /*durations*/ 64) {
					each_value_1 = ensure_array_like_dev(/*durations*/ ctx[6]);
					let i;

					for (i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

						if (each_blocks_1[i]) {
							each_blocks_1[i].p(child_ctx, dirty);
						} else {
							each_blocks_1[i] = create_each_block_1$1(child_ctx);
							each_blocks_1[i].c();
							each_blocks_1[i].m(select1, null);
						}
					}

					for (; i < each_blocks_1.length; i += 1) {
						each_blocks_1[i].d(1);
					}

					each_blocks_1.length = each_value_1.length;
				}

				if (dirty[0] & /*loanDetails, tokens*/ 24) {
					select_option(select1, /*loanDetails*/ ctx[3].duration);
				}

				if (dirty[0] & /*wallets*/ 2) {
					each_value = ensure_array_like_dev(/*wallets*/ ctx[1]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context$1(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block$1(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select2, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}

				if (dirty[0] & /*selectedWallet, wallets*/ 6) {
					select_option(select2, /*selectedWallet*/ ctx[2]);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (if_block0) if_block0.d();
				if (if_block1) if_block1.d();
				destroy_each(each_blocks_1, detaching);
				destroy_each(each_blocks, detaching);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2$1.name,
			type: "if",
			source: "(260:8) {#if step === 3}",
			ctx
		});

		return block;
	}

	// (272:12) {#if loanDetails.collateralType === "crypto"}
	function create_if_block_4(ctx) {
		let label0;
		let t0;
		let select;
		let option_1;
		let t2;
		let label1;
		let t3;
		let input;
		let mounted;
		let dispose;
		let each_value_3 = ensure_array_like_dev(/*tokens*/ ctx[4]);
		let each_blocks = [];

		for (let i = 0; i < each_value_3.length; i += 1) {
			each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
		}

		const block = {
			c: function create() {
				label0 = element("label");
				t0 = text("Select Token for Collateral:\n                ");
				select = element("select");
				option_1 = element("option");
				option_1.textContent = "Select a token";

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t2 = space();
				label1 = element("label");
				t3 = text("Collateral Amount:\n                ");
				input = element("input");
				option_1.__value = "";
				set_input_value(option_1, option_1.__value);
				option_1.disabled = true;
				add_location(option_1, file$6, 275, 20, 9468);
				select.required = true;
				attr_dev(select, "class", "svelte-1djcpp2");
				if (/*loanDetails*/ ctx[3].cryptoCollateralToken === void 0) add_render_callback(() => /*select_change_handler_1*/ ctx[22].call(select));
				add_location(select, file$6, 274, 16, 9383);
				attr_dev(label0, "class", "svelte-1djcpp2");
				add_location(label0, file$6, 272, 12, 9314);
				attr_dev(input, "type", "number");
				attr_dev(input, "placeholder", "Enter amount to pledge");
				input.required = true;
				attr_dev(input, "class", "svelte-1djcpp2");
				add_location(input, file$6, 284, 16, 9772);
				attr_dev(label1, "class", "svelte-1djcpp2");
				add_location(label1, file$6, 282, 12, 9713);
			},
			m: function mount(target, anchor) {
				insert_dev(target, label0, anchor);
				append_dev(label0, t0);
				append_dev(label0, select);
				append_dev(select, option_1);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(select, null);
					}
				}

				select_option(select, /*loanDetails*/ ctx[3].cryptoCollateralToken, true);
				insert_dev(target, t2, anchor);
				insert_dev(target, label1, anchor);
				append_dev(label1, t3);
				append_dev(label1, input);
				set_input_value(input, /*loanDetails*/ ctx[3].cryptoCollateralAmount);

				if (!mounted) {
					dispose = [
						listen_dev(select, "change", /*select_change_handler_1*/ ctx[22]),
						listen_dev(input, "input", /*input_input_handler*/ ctx[23])
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*tokens*/ 16) {
					each_value_3 = ensure_array_like_dev(/*tokens*/ ctx[4]);
					let i;

					for (i = 0; i < each_value_3.length; i += 1) {
						const child_ctx = get_each_context_3(ctx, each_value_3, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block_3(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value_3.length;
				}

				if (dirty[0] & /*loanDetails, tokens*/ 24) {
					select_option(select, /*loanDetails*/ ctx[3].cryptoCollateralToken);
				}

				if (dirty[0] & /*loanDetails, tokens*/ 24 && to_number(input.value) !== /*loanDetails*/ ctx[3].cryptoCollateralAmount) {
					set_input_value(input, /*loanDetails*/ ctx[3].cryptoCollateralAmount);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(label0);
					detach_dev(t2);
					detach_dev(label1);
				}

				destroy_each(each_blocks, detaching);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_4.name,
			type: "if",
			source: "(272:12) {#if loanDetails.collateralType === \\\"crypto\\\"}",
			ctx
		});

		return block;
	}

	// (277:20) {#each tokens as token}
	function create_each_block_3(ctx) {
		let option_1;
		let t_value = /*token*/ ctx[37] + "";
		let t;

		const block = {
			c: function create() {
				option_1 = element("option");
				t = text(t_value);
				option_1.__value = /*token*/ ctx[37];
				set_input_value(option_1, option_1.__value);
				add_location(option_1, file$6, 277, 24, 9586);
			},
			m: function mount(target, anchor) {
				insert_dev(target, option_1, anchor);
				append_dev(option_1, t);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(option_1);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_3.name,
			type: "each",
			source: "(277:20) {#each tokens as token}",
			ctx
		});

		return block;
	}

	// (294:12) {#if loanDetails.collateralType === "real-world"}
	function create_if_block_3(ctx) {
		let label0;
		let t0;
		let select;
		let option_1;
		let t2;
		let label1;
		let t3;
		let input;
		let mounted;
		let dispose;
		let each_value_2 = ensure_array_like_dev(/*realWorldCollateralOptions*/ ctx[7]);
		let each_blocks = [];

		for (let i = 0; i < each_value_2.length; i += 1) {
			each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
		}

		const block = {
			c: function create() {
				label0 = element("label");
				t0 = text("Select Asset Type:\n                ");
				select = element("select");
				option_1 = element("option");
				option_1.textContent = "Select an asset";

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t2 = space();
				label1 = element("label");
				t3 = text("Upload Photo:\n                ");
				input = element("input");
				option_1.__value = "";
				set_input_value(option_1, option_1.__value);
				option_1.disabled = true;
				add_location(option_1, file$6, 297, 20, 10243);
				select.required = true;
				attr_dev(select, "class", "svelte-1djcpp2");
				if (/*loanDetails*/ ctx[3].realWorldDescription === void 0) add_render_callback(() => /*select_change_handler_2*/ ctx[24].call(select));
				add_location(select, file$6, 296, 16, 10159);
				attr_dev(label0, "class", "svelte-1djcpp2");
				add_location(label0, file$6, 294, 12, 10100);
				attr_dev(input, "type", "file");
				attr_dev(input, "accept", "image/*");
				input.required = true;
				attr_dev(input, "class", "svelte-1djcpp2");
				add_location(input, file$6, 306, 16, 10566);
				attr_dev(label1, "class", "svelte-1djcpp2");
				add_location(label1, file$6, 304, 12, 10512);
			},
			m: function mount(target, anchor) {
				insert_dev(target, label0, anchor);
				append_dev(label0, t0);
				append_dev(label0, select);
				append_dev(select, option_1);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(select, null);
					}
				}

				select_option(select, /*loanDetails*/ ctx[3].realWorldDescription, true);
				insert_dev(target, t2, anchor);
				insert_dev(target, label1, anchor);
				append_dev(label1, t3);
				append_dev(label1, input);

				if (!mounted) {
					dispose = [
						listen_dev(select, "change", /*select_change_handler_2*/ ctx[24]),
						listen_dev(input, "change", /*handlePhotoUpload*/ ctx[10], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*realWorldCollateralOptions*/ 128) {
					each_value_2 = ensure_array_like_dev(/*realWorldCollateralOptions*/ ctx[7]);
					let i;

					for (i = 0; i < each_value_2.length; i += 1) {
						const child_ctx = get_each_context_2(ctx, each_value_2, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block_2(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value_2.length;
				}

				if (dirty[0] & /*loanDetails, tokens*/ 24) {
					select_option(select, /*loanDetails*/ ctx[3].realWorldDescription);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(label0);
					detach_dev(t2);
					detach_dev(label1);
				}

				destroy_each(each_blocks, detaching);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_3.name,
			type: "if",
			source: "(294:12) {#if loanDetails.collateralType === \\\"real-world\\\"}",
			ctx
		});

		return block;
	}

	// (299:20) {#each realWorldCollateralOptions as option}
	function create_each_block_2(ctx) {
		let option_1;
		let t_value = /*option*/ ctx[34] + "";
		let t;

		const block = {
			c: function create() {
				option_1 = element("option");
				t = text(t_value);
				option_1.__value = /*option*/ ctx[34];
				set_input_value(option_1, option_1.__value);
				add_location(option_1, file$6, 299, 24, 10383);
			},
			m: function mount(target, anchor) {
				insert_dev(target, option_1, anchor);
				append_dev(option_1, t);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(option_1);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_2.name,
			type: "each",
			source: "(299:20) {#each realWorldCollateralOptions as option}",
			ctx
		});

		return block;
	}

	// (320:20) {#each durations as duration}
	function create_each_block_1$1(ctx) {
		let option_1;
		let t_value = /*duration*/ ctx[31] + "";
		let t;

		const block = {
			c: function create() {
				option_1 = element("option");
				t = text(t_value);
				option_1.__value = /*duration*/ ctx[31];
				set_input_value(option_1, option_1.__value);
				add_location(option_1, file$6, 320, 24, 11044);
			},
			m: function mount(target, anchor) {
				insert_dev(target, option_1, anchor);
				append_dev(option_1, t);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(option_1);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_1$1.name,
			type: "each",
			source: "(320:20) {#each durations as duration}",
			ctx
		});

		return block;
	}

	// (330:20) {#each wallets as wallet}
	function create_each_block$1(ctx) {
		let option_1;
		let t_value = /*wallet*/ ctx[28].id + "";
		let t;
		let option_1_value_value;

		const block = {
			c: function create() {
				option_1 = element("option");
				t = text(t_value);
				option_1.__value = option_1_value_value = /*wallet*/ ctx[28].id;
				set_input_value(option_1, option_1.__value);
				add_location(option_1, file$6, 330, 24, 11419);
			},
			m: function mount(target, anchor) {
				insert_dev(target, option_1, anchor);
				append_dev(option_1, t);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*wallets*/ 2 && t_value !== (t_value = /*wallet*/ ctx[28].id + "")) set_data_dev(t, t_value);

				if (dirty[0] & /*wallets*/ 2 && option_1_value_value !== (option_1_value_value = /*wallet*/ ctx[28].id)) {
					prop_dev(option_1, "__value", option_1_value_value);
					set_input_value(option_1, option_1.__value);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(option_1);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block$1.name,
			type: "each",
			source: "(330:20) {#each wallets as wallet}",
			ctx
		});

		return block;
	}

	// (339:12) {#if step > 1}
	function create_if_block_1$2(ctx) {
		let button;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				button = element("button");
				button.textContent = "Back";
				attr_dev(button, "type", "button");
				attr_dev(button, "class", "btn btn-secondary svelte-1djcpp2");
				add_location(button, file$6, 339, 16, 11652);
			},
			m: function mount(target, anchor) {
				insert_dev(target, button, anchor);

				if (!mounted) {
					dispose = listen_dev(button, "click", /*handlePreviousStep*/ ctx[9], false, false, false, false);
					mounted = true;
				}
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(button);
				}

				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$2.name,
			type: "if",
			source: "(339:12) {#if step > 1}",
			ctx
		});

		return block;
	}

	// (345:12) {:else}
	function create_else_block$3(ctx) {
		let button;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				button = element("button");
				button.textContent = "Submit";
				attr_dev(button, "type", "button");
				attr_dev(button, "class", "btn btn-primary svelte-1djcpp2");
				add_location(button, file$6, 345, 16, 11937);
			},
			m: function mount(target, anchor) {
				insert_dev(target, button, anchor);

				if (!mounted) {
					dispose = listen_dev(button, "click", /*handleSubmit*/ ctx[11], false, false, false, false);
					mounted = true;
				}
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(button);
				}

				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$3.name,
			type: "else",
			source: "(345:12) {:else}",
			ctx
		});

		return block;
	}

	// (343:12) {#if step < totalSteps}
	function create_if_block$3(ctx) {
		let button;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				button = element("button");
				button.textContent = "Next";
				attr_dev(button, "type", "button");
				attr_dev(button, "class", "btn btn-primary svelte-1djcpp2");
				add_location(button, file$6, 343, 16, 11815);
			},
			m: function mount(target, anchor) {
				insert_dev(target, button, anchor);

				if (!mounted) {
					dispose = listen_dev(button, "click", /*handleNextStep*/ ctx[8], false, false, false, false);
					mounted = true;
				}
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(button);
				}

				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$3.name,
			type: "if",
			source: "(343:12) {#if step < totalSteps}",
			ctx
		});

		return block;
	}

	function create_fragment$7(ctx) {
		let section;
		let div1;
		let div0;
		let t0;
		let h1;
		let t2;
		let form;
		let t3;
		let t4;
		let t5;
		let div2;
		let t6;
		let if_block0 = /*step*/ ctx[0] === 1 && create_if_block_6(ctx);
		let if_block1 = /*step*/ ctx[0] === 2 && create_if_block_5(ctx);
		let if_block2 = /*step*/ ctx[0] === 3 && create_if_block_2$1(ctx);
		let if_block3 = /*step*/ ctx[0] > 1 && create_if_block_1$2(ctx);

		function select_block_type(ctx, dirty) {
			if (/*step*/ ctx[0] < totalSteps) return create_if_block$3;
			return create_else_block$3;
		}

		let current_block_type = select_block_type(ctx);
		let if_block4 = current_block_type(ctx);

		const block = {
			c: function create() {
				section = element("section");
				div1 = element("div");
				div0 = element("div");
				t0 = space();
				h1 = element("h1");
				h1.textContent = "Loan Request Form";
				t2 = space();
				form = element("form");
				if (if_block0) if_block0.c();
				t3 = space();
				if (if_block1) if_block1.c();
				t4 = space();
				if (if_block2) if_block2.c();
				t5 = space();
				div2 = element("div");
				if (if_block3) if_block3.c();
				t6 = space();
				if_block4.c();
				attr_dev(div0, "class", "progress-bar-fill svelte-1djcpp2");
				set_style(div0, "width", /*step*/ ctx[0] / totalSteps * 100 + "%");
				add_location(div0, file$6, 152, 8, 5479);
				attr_dev(div1, "class", "progress-bar svelte-1djcpp2");
				add_location(div1, file$6, 151, 4, 5444);
				attr_dev(h1, "class", "svelte-1djcpp2");
				add_location(h1, file$6, 158, 4, 5608);
				attr_dev(div2, "class", "form-navigation svelte-1djcpp2");
				add_location(div2, file$6, 337, 8, 11579);
				add_location(form, file$6, 159, 4, 5639);
				attr_dev(section, "class", "loan-form-container svelte-1djcpp2");
				add_location(section, file$6, 149, 0, 5376);
			},
			l: function claim(nodes) {
				throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, section, anchor);
				append_dev(section, div1);
				append_dev(div1, div0);
				append_dev(section, t0);
				append_dev(section, h1);
				append_dev(section, t2);
				append_dev(section, form);
				if (if_block0) if_block0.m(form, null);
				append_dev(form, t3);
				if (if_block1) if_block1.m(form, null);
				append_dev(form, t4);
				if (if_block2) if_block2.m(form, null);
				append_dev(form, t5);
				append_dev(form, div2);
				if (if_block3) if_block3.m(div2, null);
				append_dev(div2, t6);
				if_block4.m(div2, null);
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*step*/ 1) {
					set_style(div0, "width", /*step*/ ctx[0] / totalSteps * 100 + "%");
				}

				if (/*step*/ ctx[0] === 1) {
					if (if_block0) {
						if_block0.p(ctx, dirty);
					} else {
						if_block0 = create_if_block_6(ctx);
						if_block0.c();
						if_block0.m(form, t3);
					}
				} else if (if_block0) {
					if_block0.d(1);
					if_block0 = null;
				}

				if (/*step*/ ctx[0] === 2) {
					if (if_block1) {
						if_block1.p(ctx, dirty);
					} else {
						if_block1 = create_if_block_5(ctx);
						if_block1.c();
						if_block1.m(form, t4);
					}
				} else if (if_block1) {
					if_block1.d(1);
					if_block1 = null;
				}

				if (/*step*/ ctx[0] === 3) {
					if (if_block2) {
						if_block2.p(ctx, dirty);
					} else {
						if_block2 = create_if_block_2$1(ctx);
						if_block2.c();
						if_block2.m(form, t5);
					}
				} else if (if_block2) {
					if_block2.d(1);
					if_block2 = null;
				}

				if (/*step*/ ctx[0] > 1) {
					if (if_block3) {
						if_block3.p(ctx, dirty);
					} else {
						if_block3 = create_if_block_1$2(ctx);
						if_block3.c();
						if_block3.m(div2, t6);
					}
				} else if (if_block3) {
					if_block3.d(1);
					if_block3 = null;
				}

				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block4) {
					if_block4.p(ctx, dirty);
				} else {
					if_block4.d(1);
					if_block4 = current_block_type(ctx);

					if (if_block4) {
						if_block4.c();
						if_block4.m(div2, null);
					}
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(section);
				}

				if (if_block0) if_block0.d();
				if (if_block1) if_block1.d();
				if (if_block2) if_block2.d();
				if (if_block3) if_block3.d();
				if_block4.d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$7.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	const totalSteps = 3;

	function instance$7($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('LoanRequestForm', slots, []);
		let step = 1;
		let wallets = [];
		let selectedWallet = "";

		let loanDetails = {
			amount: "",
			token: "",
			age: "",
			occupation: "",
			income: "",
			expense: "",
			incomeCurrency: "",
			expenseCurrency: "",
			purpose: "",
			collateralType: "",
			duration: "",
			realWorldDescription: "",
			realWorldPhoto: null,
			cryptoCollateralToken: "",
			cryptoCollateralAmount: ""
		};

		const tokens = ["ETH", "USDC", "DAI"];
		const fiatCurrencies = ["USD", "EUR", "THB"];
		const durations = ["3 months", "6 months", "12 months"];
		const realWorldCollateralOptions = ["house", "car", "laptop", "phone"];

		function handleNextStep() {
			if (step < totalSteps) $$invalidate(0, step++, step);
		}

		function handlePreviousStep() {
			if (step > 1) $$invalidate(0, step--, step);
		}

		function handlePhotoUpload(event) {
			$$invalidate(3, loanDetails.realWorldPhoto = event.target.files[0], loanDetails);
		}

		async function handleSubmit() {
			if (loanDetails.collateralType === "crypto") {
				try {
					const response = await fetch(`${urlRoot}/api/v1/loan/crypto/approve-reject`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							wallet_id: selectedWallet,
							collateral_token: loanDetails.cryptoCollateralToken,
							collateral_amount: loanDetails.cryptoCollateralAmount,
							requested_loan_amount: loanDetails.amount,
							requested_loan_token: loanDetails.token
						})
					});

					// check if updated_loan_details is returned
					alert("Loan Has been approved. Funding has been deposited into your account. Please see in dashboard.");
				} catch(error) {
					console.error("Error during repayment:", error);
					alert("An error occurred during repayment.");
				}
			} else if (loanDetails.collateralType === "real-world") {
				try {
					const response = await fetch(`${urlRoot}/api/v1/wallet/${selectedWallet}/nft-approve-reject-loan`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							name: loanDetails.realWorldDescription,
							symbol: loanDetails.realWorldDescription + "NFT",
							base_uri: "https://ipfs.io/ipfs/",
							wallet_id: selectedWallet,
							requested_loan_amount: loanDetails.amount,
							requested_loan_token: loanDetails.token
						})
					});

					// check if updated_loan_details is returned
					alert("Loan Has been approved. Funding has been deposited into your account. Please see in dashboard.");
				} catch(error) {
					console.error("Error during repayment:", error);
					alert("An error occurred during repayment.");
				}
			}

			// TODO: Submit `loanDetails` to the backend API for NFT deployment or loan processing.
			const { age, amount, duration, occupation, token, income, expense, incomeCurrency, expenseCurrency, purpose, collateralType } = loanDetails;

			const payload = {
				amount,
				token,
				age,
				occupation,
				monthly_income: income,
				income_currency: incomeCurrency,
				monthly_expense: expense,
				expene_currency: expenseCurrency,
				purpose_of_loan: purpose,
				collateral_type: collateralType,
				loan_duration: duration
			};

			console.log('paylo', payload);

			try {
				const response = await fetch(`${urlRoot}/api/v1/loans/`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.detail || "Failed to create loan.");
				}

				const data = await response.json();
				alert("Loan created successfully!");
			} catch(err) {
				
			} //fetchLoans(); // Refresh the loans list
			//error = err.message;
		}

		async function fetchWallets() {
			try {
				const response = await fetch(`${urlRoot}/api/v1/wallets`);

				if (response.ok) {
					$$invalidate(1, wallets = await response.json());

					errorMessage = wallets.length
					? ""
					: "No wallets found. Please create a wallet first.";
				} else {
					errorMessage = "Failed to fetch wallets. Please try again.";
				}
			} catch(error) {
				errorMessage = "Error fetching wallets. Check your connection.";
				console.error("Error fetching wallets:", error);
			}
		}

		onMount(() => {
			fetchWallets();
		});

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<LoanRequestForm> was created with unknown prop '${key}'`);
		});

		function input0_input_handler() {
			loanDetails.amount = to_number(this.value);
			$$invalidate(3, loanDetails);
			$$invalidate(4, tokens);
		}

		function select_change_handler() {
			loanDetails.token = select_value(this);
			$$invalidate(3, loanDetails);
			$$invalidate(4, tokens);
		}

		function input1_input_handler() {
			loanDetails.age = to_number(this.value);
			$$invalidate(3, loanDetails);
			$$invalidate(4, tokens);
		}

		function input2_input_handler() {
			loanDetails.occupation = this.value;
			$$invalidate(3, loanDetails);
			$$invalidate(4, tokens);
		}

		function input0_input_handler_1() {
			loanDetails.income = to_number(this.value);
			$$invalidate(3, loanDetails);
			$$invalidate(4, tokens);
		}

		function select0_change_handler() {
			loanDetails.incomeCurrency = select_value(this);
			$$invalidate(3, loanDetails);
			$$invalidate(4, tokens);
		}

		function input1_input_handler_1() {
			loanDetails.expense = to_number(this.value);
			$$invalidate(3, loanDetails);
			$$invalidate(4, tokens);
		}

		function select1_change_handler() {
			loanDetails.expenseCurrency = select_value(this);
			$$invalidate(3, loanDetails);
			$$invalidate(4, tokens);
		}

		function textarea_input_handler() {
			loanDetails.purpose = this.value;
			$$invalidate(3, loanDetails);
			$$invalidate(4, tokens);
		}

		function select0_change_handler_1() {
			loanDetails.collateralType = select_value(this);
			$$invalidate(3, loanDetails);
			$$invalidate(4, tokens);
		}

		function select_change_handler_1() {
			loanDetails.cryptoCollateralToken = select_value(this);
			$$invalidate(3, loanDetails);
			$$invalidate(4, tokens);
		}

		function input_input_handler() {
			loanDetails.cryptoCollateralAmount = to_number(this.value);
			$$invalidate(3, loanDetails);
			$$invalidate(4, tokens);
		}

		function select_change_handler_2() {
			loanDetails.realWorldDescription = select_value(this);
			$$invalidate(3, loanDetails);
			$$invalidate(4, tokens);
		}

		function select1_change_handler_1() {
			loanDetails.duration = select_value(this);
			$$invalidate(3, loanDetails);
			$$invalidate(4, tokens);
		}

		function select2_change_handler() {
			selectedWallet = select_value(this);
			$$invalidate(2, selectedWallet);
			$$invalidate(1, wallets);
		}

		$$self.$capture_state = () => ({
			onMount,
			urlRoot,
			step,
			totalSteps,
			wallets,
			selectedWallet,
			loanDetails,
			tokens,
			fiatCurrencies,
			durations,
			realWorldCollateralOptions,
			handleNextStep,
			handlePreviousStep,
			handlePhotoUpload,
			handleSubmit,
			fetchWallets
		});

		$$self.$inject_state = $$props => {
			if ('step' in $$props) $$invalidate(0, step = $$props.step);
			if ('wallets' in $$props) $$invalidate(1, wallets = $$props.wallets);
			if ('selectedWallet' in $$props) $$invalidate(2, selectedWallet = $$props.selectedWallet);
			if ('loanDetails' in $$props) $$invalidate(3, loanDetails = $$props.loanDetails);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			step,
			wallets,
			selectedWallet,
			loanDetails,
			tokens,
			fiatCurrencies,
			durations,
			realWorldCollateralOptions,
			handleNextStep,
			handlePreviousStep,
			handlePhotoUpload,
			handleSubmit,
			input0_input_handler,
			select_change_handler,
			input1_input_handler,
			input2_input_handler,
			input0_input_handler_1,
			select0_change_handler,
			input1_input_handler_1,
			select1_change_handler,
			textarea_input_handler,
			select0_change_handler_1,
			select_change_handler_1,
			input_input_handler,
			select_change_handler_2,
			select1_change_handler_1,
			select2_change_handler
		];
	}

	class LoanRequestForm extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$7, create_fragment$7, safe_not_equal, {}, null, [-1, -1]);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "LoanRequestForm",
				options,
				id: create_fragment$7.name
			});
		}
	}

	/* src/routes/loan/request.svelte generated by Svelte v4.2.19 */
	const file$5 = "src/routes/loan/request.svelte";

	function create_fragment$6(ctx) {
		let section;
		let h1;
		let t1;
		let loanrequestform;
		let current;
		loanrequestform = new LoanRequestForm({ $$inline: true });

		const block = {
			c: function create() {
				section = element("section");
				h1 = element("h1");
				h1.textContent = "Request a Loan";
				t1 = space();
				create_component(loanrequestform.$$.fragment);
				attr_dev(h1, "class", "svelte-131hq4d");
				add_location(h1, file$5, 5, 4, 140);
				attr_dev(section, "class", "loan-request-container svelte-131hq4d");
				add_location(section, file$5, 4, 0, 95);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, section, anchor);
				append_dev(section, h1);
				append_dev(section, t1);
				mount_component(loanrequestform, section, null);
				current = true;
			},
			p: noop,
			i: function intro(local) {
				if (current) return;
				transition_in(loanrequestform.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(loanrequestform.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(section);
				}

				destroy_component(loanrequestform);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$6.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$6($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Request', slots, []);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Request> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({ LoanRequestForm });
		return [];
	}

	class Request extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Request",
				options,
				id: create_fragment$6.name
			});
		}
	}

	const LOCATION = {};
	const ROUTER = {};
	const HISTORY = {};

	/**
	 * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/utils.js
	 * https://github.com/reach/router/blob/master/LICENSE
	 */

	const PARAM = /^:(.+)/;
	const SEGMENT_POINTS = 4;
	const STATIC_POINTS = 3;
	const DYNAMIC_POINTS = 2;
	const SPLAT_PENALTY = 1;
	const ROOT_POINTS = 1;

	/**
	 * Split up the URI into segments delimited by `/`
	 * Strip starting/ending `/`
	 * @param {string} uri
	 * @return {string[]}
	 */
	const segmentize = (uri) => uri.replace(/(^\/+|\/+$)/g, "").split("/");
	/**
	 * Strip `str` of potential start and end `/`
	 * @param {string} string
	 * @return {string}
	 */
	const stripSlashes = (string) => string.replace(/(^\/+|\/+$)/g, "");
	/**
	 * Score a route depending on how its individual segments look
	 * @param {object} route
	 * @param {number} index
	 * @return {object}
	 */
	const rankRoute = (route, index) => {
	    const score = route.default
	        ? 0
	        : segmentize(route.path).reduce((score, segment) => {
	              score += SEGMENT_POINTS;

	              if (segment === "") {
	                  score += ROOT_POINTS;
	              } else if (PARAM.test(segment)) {
	                  score += DYNAMIC_POINTS;
	              } else if (segment[0] === "*") {
	                  score -= SEGMENT_POINTS + SPLAT_PENALTY;
	              } else {
	                  score += STATIC_POINTS;
	              }

	              return score;
	          }, 0);

	    return { route, score, index };
	};
	/**
	 * Give a score to all routes and sort them on that
	 * If two routes have the exact same score, we go by index instead
	 * @param {object[]} routes
	 * @return {object[]}
	 */
	const rankRoutes = (routes) =>
	    routes
	        .map(rankRoute)
	        .sort((a, b) =>
	            a.score < b.score ? 1 : a.score > b.score ? -1 : a.index - b.index
	        );
	/**
	 * Ranks and picks the best route to match. Each segment gets the highest
	 * amount of points, then the type of segment gets an additional amount of
	 * points where
	 *
	 *  static > dynamic > splat > root
	 *
	 * This way we don't have to worry about the order of our routes, let the
	 * computers do it.
	 *
	 * A route looks like this
	 *
	 *  { path, default, value }
	 *
	 * And a returned match looks like:
	 *
	 *  { route, params, uri }
	 *
	 * @param {object[]} routes
	 * @param {string} uri
	 * @return {?object}
	 */
	const pick = (routes, uri) => {
	    let match;
	    let default_;

	    const [uriPathname] = uri.split("?");
	    const uriSegments = segmentize(uriPathname);
	    const isRootUri = uriSegments[0] === "";
	    const ranked = rankRoutes(routes);

	    for (let i = 0, l = ranked.length; i < l; i++) {
	        const route = ranked[i].route;
	        let missed = false;

	        if (route.default) {
	            default_ = {
	                route,
	                params: {},
	                uri,
	            };
	            continue;
	        }

	        const routeSegments = segmentize(route.path);
	        const params = {};
	        const max = Math.max(uriSegments.length, routeSegments.length);
	        let index = 0;

	        for (; index < max; index++) {
	            const routeSegment = routeSegments[index];
	            const uriSegment = uriSegments[index];

	            if (routeSegment && routeSegment[0] === "*") {
	                // Hit a splat, just grab the rest, and return a match
	                // uri:   /files/documents/work
	                // route: /files/* or /files/*splatname
	                const splatName =
	                    routeSegment === "*" ? "*" : routeSegment.slice(1);

	                params[splatName] = uriSegments
	                    .slice(index)
	                    .map(decodeURIComponent)
	                    .join("/");
	                break;
	            }

	            if (typeof uriSegment === "undefined") {
	                // URI is shorter than the route, no match
	                // uri:   /users
	                // route: /users/:userId
	                missed = true;
	                break;
	            }

	            const dynamicMatch = PARAM.exec(routeSegment);

	            if (dynamicMatch && !isRootUri) {
	                const value = decodeURIComponent(uriSegment);
	                params[dynamicMatch[1]] = value;
	            } else if (routeSegment !== uriSegment) {
	                // Current segments don't match, not dynamic, not splat, so no match
	                // uri:   /users/123/settings
	                // route: /users/:id/profile
	                missed = true;
	                break;
	            }
	        }

	        if (!missed) {
	            match = {
	                route,
	                params,
	                uri: "/" + uriSegments.slice(0, index).join("/"),
	            };
	            break;
	        }
	    }

	    return match || default_ || null;
	};
	/**
	 * Combines the `basepath` and the `path` into one path.
	 * @param {string} basepath
	 * @param {string} path
	 */
	const combinePaths = (basepath, path) =>
	    `${stripSlashes(
        path === "/"
            ? basepath
            : `${stripSlashes(basepath)}/${stripSlashes(path)}`
    )}/`;

	const canUseDOM = () =>
	    typeof window !== "undefined" &&
	    "document" in window &&
	    "location" in window;

	/* node_modules/svelte-routing/src/Route.svelte generated by Svelte v4.2.19 */
	const get_default_slot_changes$1 = dirty => ({ params: dirty & /*routeParams*/ 4 });
	const get_default_slot_context$1 = ctx => ({ params: /*routeParams*/ ctx[2] });

	// (42:0) {#if $activeRoute && $activeRoute.route === route}
	function create_if_block$2(ctx) {
		let current_block_type_index;
		let if_block;
		let if_block_anchor;
		let current;
		const if_block_creators = [create_if_block_1$1, create_else_block$2];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*component*/ ctx[0]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			m: function mount(target, anchor) {
				if_blocks[current_block_type_index].m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if_blocks[current_block_type_index].d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$2.name,
			type: "if",
			source: "(42:0) {#if $activeRoute && $activeRoute.route === route}",
			ctx
		});

		return block;
	}

	// (51:4) {:else}
	function create_else_block$2(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[8].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], get_default_slot_context$1);

		const block = {
			c: function create() {
				if (default_slot) default_slot.c();
			},
			m: function mount(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope, routeParams*/ 132)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[7],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[7])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, get_default_slot_changes$1),
							get_default_slot_context$1
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$2.name,
			type: "else",
			source: "(51:4) {:else}",
			ctx
		});

		return block;
	}

	// (43:4) {#if component}
	function create_if_block_1$1(ctx) {
		let await_block_anchor;
		let promise;
		let current;

		let info = {
			ctx,
			current: null,
			token: null,
			hasCatch: false,
			pending: create_pending_block,
			then: create_then_block,
			catch: create_catch_block,
			value: 12,
			blocks: [,,,]
		};

		handle_promise(promise = /*component*/ ctx[0], info);

		const block = {
			c: function create() {
				await_block_anchor = empty();
				info.block.c();
			},
			m: function mount(target, anchor) {
				insert_dev(target, await_block_anchor, anchor);
				info.block.m(target, info.anchor = anchor);
				info.mount = () => await_block_anchor.parentNode;
				info.anchor = await_block_anchor;
				current = true;
			},
			p: function update(new_ctx, dirty) {
				ctx = new_ctx;
				info.ctx = ctx;

				if (dirty & /*component*/ 1 && promise !== (promise = /*component*/ ctx[0]) && handle_promise(promise, info)) ; else {
					update_await_block_branch(info, ctx, dirty);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(info.block);
				current = true;
			},
			o: function outro(local) {
				for (let i = 0; i < 3; i += 1) {
					const block = info.blocks[i];
					transition_out(block);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(await_block_anchor);
				}

				info.block.d(detaching);
				info.token = null;
				info = null;
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1$1.name,
			type: "if",
			source: "(43:4) {#if component}",
			ctx
		});

		return block;
	}

	// (1:0) <script>     import { getContext, onDestroy }
	function create_catch_block(ctx) {
		const block = {
			c: noop,
			m: noop,
			p: noop,
			i: noop,
			o: noop,
			d: noop
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_catch_block.name,
			type: "catch",
			source: "(1:0) <script>     import { getContext, onDestroy }",
			ctx
		});

		return block;
	}

	// (44:49)              <svelte:component                 this={resolvedComponent?.default || resolvedComponent}
	function create_then_block(ctx) {
		let switch_instance;
		let switch_instance_anchor;
		let current;
		const switch_instance_spread_levels = [/*routeParams*/ ctx[2], /*routeProps*/ ctx[3]];
		var switch_value = /*resolvedComponent*/ ctx[12]?.default || /*resolvedComponent*/ ctx[12];

		function switch_props(ctx, dirty) {
			let switch_instance_props = {};

			for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
				switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
			}

			if (dirty !== undefined && dirty & /*routeParams, routeProps*/ 12) {
				switch_instance_props = assign(switch_instance_props, get_spread_update(switch_instance_spread_levels, [
					dirty & /*routeParams*/ 4 && get_spread_object(/*routeParams*/ ctx[2]),
					dirty & /*routeProps*/ 8 && get_spread_object(/*routeProps*/ ctx[3])
				]));
			}

			return {
				props: switch_instance_props,
				$$inline: true
			};
		}

		if (switch_value) {
			switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx));
		}

		const block = {
			c: function create() {
				if (switch_instance) create_component(switch_instance.$$.fragment);
				switch_instance_anchor = empty();
			},
			m: function mount(target, anchor) {
				if (switch_instance) mount_component(switch_instance, target, anchor);
				insert_dev(target, switch_instance_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*component*/ 1 && switch_value !== (switch_value = /*resolvedComponent*/ ctx[12]?.default || /*resolvedComponent*/ ctx[12])) {
					if (switch_instance) {
						group_outros();
						const old_component = switch_instance;

						transition_out(old_component.$$.fragment, 1, 0, () => {
							destroy_component(old_component, 1);
						});

						check_outros();
					}

					if (switch_value) {
						switch_instance = construct_svelte_component_dev(switch_value, switch_props(ctx, dirty));
						create_component(switch_instance.$$.fragment);
						transition_in(switch_instance.$$.fragment, 1);
						mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
					} else {
						switch_instance = null;
					}
				} else if (switch_value) {
					const switch_instance_changes = (dirty & /*routeParams, routeProps*/ 12)
					? get_spread_update(switch_instance_spread_levels, [
							dirty & /*routeParams*/ 4 && get_spread_object(/*routeParams*/ ctx[2]),
							dirty & /*routeProps*/ 8 && get_spread_object(/*routeProps*/ ctx[3])
						])
					: {};

					switch_instance.$set(switch_instance_changes);
				}
			},
			i: function intro(local) {
				if (current) return;
				if (switch_instance) transition_in(switch_instance.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				if (switch_instance) transition_out(switch_instance.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(switch_instance_anchor);
				}

				if (switch_instance) destroy_component(switch_instance, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_then_block.name,
			type: "then",
			source: "(44:49)              <svelte:component                 this={resolvedComponent?.default || resolvedComponent}",
			ctx
		});

		return block;
	}

	// (1:0) <script>     import { getContext, onDestroy }
	function create_pending_block(ctx) {
		const block = {
			c: noop,
			m: noop,
			p: noop,
			i: noop,
			o: noop,
			d: noop
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_pending_block.name,
			type: "pending",
			source: "(1:0) <script>     import { getContext, onDestroy }",
			ctx
		});

		return block;
	}

	function create_fragment$5(ctx) {
		let if_block_anchor;
		let current;
		let if_block = /*$activeRoute*/ ctx[1] && /*$activeRoute*/ ctx[1].route === /*route*/ ctx[5] && create_if_block$2(ctx);

		const block = {
			c: function create() {
				if (if_block) if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				if (/*$activeRoute*/ ctx[1] && /*$activeRoute*/ ctx[1].route === /*route*/ ctx[5]) {
					if (if_block) {
						if_block.p(ctx, dirty);

						if (dirty & /*$activeRoute*/ 2) {
							transition_in(if_block, 1);
						}
					} else {
						if_block = create_if_block$2(ctx);
						if_block.c();
						transition_in(if_block, 1);
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					group_outros();

					transition_out(if_block, 1, 1, () => {
						if_block = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if (if_block) if_block.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$5.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$5($$self, $$props, $$invalidate) {
		let $activeRoute;
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Route', slots, ['default']);
		let { path = "" } = $$props;
		let { component = null } = $$props;
		let routeParams = {};
		let routeProps = {};
		const { registerRoute, unregisterRoute, activeRoute } = getContext(ROUTER);
		validate_store(activeRoute, 'activeRoute');
		component_subscribe($$self, activeRoute, value => $$invalidate(1, $activeRoute = value));

		const route = {
			path,
			// If no path prop is given, this Route will act as the default Route
			// that is rendered if no other Route in the Router is a match.
			default: path === ""
		};

		registerRoute(route);

		onDestroy(() => {
			unregisterRoute(route);
		});

		$$self.$$set = $$new_props => {
			$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
			if ('path' in $$new_props) $$invalidate(6, path = $$new_props.path);
			if ('component' in $$new_props) $$invalidate(0, component = $$new_props.component);
			if ('$$scope' in $$new_props) $$invalidate(7, $$scope = $$new_props.$$scope);
		};

		$$self.$capture_state = () => ({
			getContext,
			onDestroy,
			ROUTER,
			canUseDOM,
			path,
			component,
			routeParams,
			routeProps,
			registerRoute,
			unregisterRoute,
			activeRoute,
			route,
			$activeRoute
		});

		$$self.$inject_state = $$new_props => {
			$$invalidate(11, $$props = assign(assign({}, $$props), $$new_props));
			if ('path' in $$props) $$invalidate(6, path = $$new_props.path);
			if ('component' in $$props) $$invalidate(0, component = $$new_props.component);
			if ('routeParams' in $$props) $$invalidate(2, routeParams = $$new_props.routeParams);
			if ('routeProps' in $$props) $$invalidate(3, routeProps = $$new_props.routeProps);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($activeRoute && $activeRoute.route === route) {
				$$invalidate(2, routeParams = $activeRoute.params);
				const { component: c, path, ...rest } = $$props;
				$$invalidate(3, routeProps = rest);

				if (c) {
					if (c.toString().startsWith("class ")) $$invalidate(0, component = c); else $$invalidate(0, component = c());
				}

				canUseDOM() && !$activeRoute.preserveScroll && window?.scrollTo(0, 0);
			}
		};

		$$props = exclude_internal_props($$props);

		return [
			component,
			$activeRoute,
			routeParams,
			routeProps,
			activeRoute,
			route,
			path,
			$$scope,
			slots
		];
	}

	class Route extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$5, create_fragment$5, safe_not_equal, { path: 6, component: 0 });

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Route",
				options,
				id: create_fragment$5.name
			});
		}

		get path() {
			throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set path(value) {
			throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get component() {
			throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set component(value) {
			throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/**
	 * Adapted from https://github.com/reach/router/blob/b60e6dd781d5d3a4bdaaf4de665649c0f6a7e78d/src/lib/history.js
	 * https://github.com/reach/router/blob/master/LICENSE
	 */

	const getLocation = (source) => {
	    return {
	        ...source.location,
	        state: source.history.state,
	        key: (source.history.state && source.history.state.key) || "initial",
	    };
	};
	const createHistory = (source) => {
	    const listeners = [];
	    let location = getLocation(source);

	    return {
	        get location() {
	            return location;
	        },

	        listen(listener) {
	            listeners.push(listener);

	            const popstateListener = () => {
	                location = getLocation(source);
	                listener({ location, action: "POP" });
	            };

	            source.addEventListener("popstate", popstateListener);

	            return () => {
	                source.removeEventListener("popstate", popstateListener);
	                const index = listeners.indexOf(listener);
	                listeners.splice(index, 1);
	            };
	        },

	        navigate(to, { state, replace = false, preserveScroll = false, blurActiveElement = true } = {}) {
	            state = { ...state, key: Date.now() + "" };
	            // try...catch iOS Safari limits to 100 pushState calls
	            try {
	                if (replace) source.history.replaceState(state, "", to);
	                else source.history.pushState(state, "", to);
	            } catch (e) {
	                source.location[replace ? "replace" : "assign"](to);
	            }
	            location = getLocation(source);
	            listeners.forEach((listener) =>
	                listener({ location, action: "PUSH", preserveScroll })
	            );
	            if(blurActiveElement) document.activeElement.blur();
	        },
	    };
	};
	// Stores history entries in memory for testing or other platforms like Native
	const createMemorySource = (initialPathname = "/") => {
	    let index = 0;
	    const stack = [{ pathname: initialPathname, search: "" }];
	    const states = [];

	    return {
	        get location() {
	            return stack[index];
	        },
	        addEventListener(name, fn) {},
	        removeEventListener(name, fn) {},
	        history: {
	            get entries() {
	                return stack;
	            },
	            get index() {
	                return index;
	            },
	            get state() {
	                return states[index];
	            },
	            pushState(state, _, uri) {
	                const [pathname, search = ""] = uri.split("?");
	                index++;
	                stack.push({ pathname, search });
	                states.push(state);
	            },
	            replaceState(state, _, uri) {
	                const [pathname, search = ""] = uri.split("?");
	                stack[index] = { pathname, search };
	                states[index] = state;
	            },
	        },
	    };
	};
	// Global history uses window.history as the source if available,
	// otherwise a memory history
	const globalHistory = createHistory(
	    canUseDOM() ? window : createMemorySource()
	);
	const { navigate } = globalHistory;

	/* node_modules/svelte-routing/src/Router.svelte generated by Svelte v4.2.19 */

	const { Object: Object_1 } = globals;
	const file$4 = "node_modules/svelte-routing/src/Router.svelte";

	const get_default_slot_changes_1 = dirty => ({
		route: dirty & /*$activeRoute*/ 4,
		location: dirty & /*$location*/ 2
	});

	const get_default_slot_context_1 = ctx => ({
		route: /*$activeRoute*/ ctx[2] && /*$activeRoute*/ ctx[2].uri,
		location: /*$location*/ ctx[1]
	});

	const get_default_slot_changes = dirty => ({
		route: dirty & /*$activeRoute*/ 4,
		location: dirty & /*$location*/ 2
	});

	const get_default_slot_context = ctx => ({
		route: /*$activeRoute*/ ctx[2] && /*$activeRoute*/ ctx[2].uri,
		location: /*$location*/ ctx[1]
	});

	// (143:0) {:else}
	function create_else_block$1(ctx) {
		let current;
		const default_slot_template = /*#slots*/ ctx[15].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], get_default_slot_context_1);

		const block = {
			c: function create() {
				if (default_slot) default_slot.c();
			},
			m: function mount(target, anchor) {
				if (default_slot) {
					default_slot.m(target, anchor);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope, $activeRoute, $location*/ 16390)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[14],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[14])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[14], dirty, get_default_slot_changes_1),
							get_default_slot_context_1
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (default_slot) default_slot.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block$1.name,
			type: "else",
			source: "(143:0) {:else}",
			ctx
		});

		return block;
	}

	// (134:0) {#if viewtransition}
	function create_if_block$1(ctx) {
		let previous_key = /*$location*/ ctx[1].pathname;
		let key_block_anchor;
		let current;
		let key_block = create_key_block(ctx);

		const block = {
			c: function create() {
				key_block.c();
				key_block_anchor = empty();
			},
			m: function mount(target, anchor) {
				key_block.m(target, anchor);
				insert_dev(target, key_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, dirty) {
				if (dirty & /*$location*/ 2 && safe_not_equal(previous_key, previous_key = /*$location*/ ctx[1].pathname)) {
					group_outros();
					transition_out(key_block, 1, 1, noop);
					check_outros();
					key_block = create_key_block(ctx);
					key_block.c();
					transition_in(key_block, 1);
					key_block.m(key_block_anchor.parentNode, key_block_anchor);
				} else {
					key_block.p(ctx, dirty);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(key_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(key_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(key_block_anchor);
				}

				key_block.d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block$1.name,
			type: "if",
			source: "(134:0) {#if viewtransition}",
			ctx
		});

		return block;
	}

	// (135:4) {#key $location.pathname}
	function create_key_block(ctx) {
		let div;
		let div_intro;
		let div_outro;
		let current;
		const default_slot_template = /*#slots*/ ctx[15].default;
		const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], get_default_slot_context);

		const block = {
			c: function create() {
				div = element("div");
				if (default_slot) default_slot.c();
				add_location(div, file$4, 135, 8, 4659);
			},
			m: function mount(target, anchor) {
				insert_dev(target, div, anchor);

				if (default_slot) {
					default_slot.m(div, null);
				}

				current = true;
			},
			p: function update(ctx, dirty) {
				if (default_slot) {
					if (default_slot.p && (!current || dirty & /*$$scope, $activeRoute, $location*/ 16390)) {
						update_slot_base(
							default_slot,
							default_slot_template,
							ctx,
							/*$$scope*/ ctx[14],
							!current
							? get_all_dirty_from_scope(/*$$scope*/ ctx[14])
							: get_slot_changes(default_slot_template, /*$$scope*/ ctx[14], dirty, get_default_slot_changes),
							get_default_slot_context
						);
					}
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(default_slot, local);

				if (local) {
					add_render_callback(() => {
						if (!current) return;
						if (div_outro) div_outro.end(1);
						div_intro = create_in_transition(div, /*viewtransitionFn*/ ctx[3], {});
						div_intro.start();
					});
				}

				current = true;
			},
			o: function outro(local) {
				transition_out(default_slot, local);
				if (div_intro) div_intro.invalidate();

				if (local) {
					div_outro = create_out_transition(div, /*viewtransitionFn*/ ctx[3], {});
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div);
				}

				if (default_slot) default_slot.d(detaching);
				if (detaching && div_outro) div_outro.end();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_key_block.name,
			type: "key",
			source: "(135:4) {#key $location.pathname}",
			ctx
		});

		return block;
	}

	function create_fragment$4(ctx) {
		let current_block_type_index;
		let if_block;
		let if_block_anchor;
		let current;
		const if_block_creators = [create_if_block$1, create_else_block$1];
		const if_blocks = [];

		function select_block_type(ctx, dirty) {
			if (/*viewtransition*/ ctx[0]) return 0;
			return 1;
		}

		current_block_type_index = select_block_type(ctx);
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

		const block = {
			c: function create() {
				if_block.c();
				if_block_anchor = empty();
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				if_blocks[current_block_type_index].m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				let previous_block_index = current_block_type_index;
				current_block_type_index = select_block_type(ctx);

				if (current_block_type_index === previous_block_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				} else {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			},
			i: function intro(local) {
				if (current) return;
				transition_in(if_block);
				current = true;
			},
			o: function outro(local) {
				transition_out(if_block);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(if_block_anchor);
				}

				if_blocks[current_block_type_index].d(detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$4.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$4($$self, $$props, $$invalidate) {
		let $location;
		let $routes;
		let $base;
		let $activeRoute;
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Router', slots, ['default']);
		let { basepath = "/" } = $$props;
		let { url = null } = $$props;
		let { viewtransition = null } = $$props;
		let { history = globalHistory } = $$props;

		const viewtransitionFn = (node, _, direction) => {
			const vt = viewtransition(direction);
			if (typeof vt?.fn === "function") return vt.fn(node, vt); else return vt;
		};

		setContext(HISTORY, history);
		const locationContext = getContext(LOCATION);
		const routerContext = getContext(ROUTER);
		const routes = writable([]);
		validate_store(routes, 'routes');
		component_subscribe($$self, routes, value => $$invalidate(12, $routes = value));
		const activeRoute = writable(null);
		validate_store(activeRoute, 'activeRoute');
		component_subscribe($$self, activeRoute, value => $$invalidate(2, $activeRoute = value));
		let hasActiveRoute = false; // Used in SSR to synchronously set that a Route is active.

		// If locationContext is not set, this is the topmost Router in the tree.
		// If the `url` prop is given we force the location to it.
		const location = locationContext || writable(url ? { pathname: url } : history.location);

		validate_store(location, 'location');
		component_subscribe($$self, location, value => $$invalidate(1, $location = value));

		// If routerContext is set, the routerBase of the parent Router
		// will be the base for this Router's descendants.
		// If routerContext is not set, the path and resolved uri will both
		// have the value of the basepath prop.
		const base = routerContext
		? routerContext.routerBase
		: writable({ path: basepath, uri: basepath });

		validate_store(base, 'base');
		component_subscribe($$self, base, value => $$invalidate(13, $base = value));

		const routerBase = derived([base, activeRoute], ([base, activeRoute]) => {
			// If there is no activeRoute, the routerBase will be identical to the base.
			if (!activeRoute) return base;

			const { path: basepath } = base;
			const { route, uri } = activeRoute;

			// Remove the potential /* or /*splatname from
			// the end of the child Routes relative paths.
			const path = route.default
			? basepath
			: route.path.replace(/\*.*$/, "");

			return { path, uri };
		});

		const registerRoute = route => {
			const { path: basepath } = $base;
			let { path } = route;

			// We store the original path in the _path property so we can reuse
			// it when the basepath changes. The only thing that matters is that
			// the route reference is intact, so mutation is fine.
			route._path = path;

			route.path = combinePaths(basepath, path);

			if (typeof window === "undefined") {
				// In SSR we should set the activeRoute immediately if it is a match.
				// If there are more Routes being registered after a match is found,
				// we just skip them.
				if (hasActiveRoute) return;

				const matchingRoute = pick([route], $location.pathname);

				if (matchingRoute) {
					activeRoute.set(matchingRoute);
					hasActiveRoute = true;
				}
			} else {
				routes.update(rs => [...rs, route]);
			}
		};

		const unregisterRoute = route => {
			routes.update(rs => rs.filter(r => r !== route));
		};

		let preserveScroll = false;

		if (!locationContext) {
			// The topmost Router in the tree is responsible for updating
			// the location store and supplying it through context.
			onMount(() => {
				const unlisten = history.listen(event => {
					$$invalidate(11, preserveScroll = event.preserveScroll || false);
					location.set(event.location);
				});

				return unlisten;
			});

			setContext(LOCATION, location);
		}

		setContext(ROUTER, {
			activeRoute,
			base,
			routerBase,
			registerRoute,
			unregisterRoute
		});

		const writable_props = ['basepath', 'url', 'viewtransition', 'history'];

		Object_1.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Router> was created with unknown prop '${key}'`);
		});

		$$self.$$set = $$props => {
			if ('basepath' in $$props) $$invalidate(8, basepath = $$props.basepath);
			if ('url' in $$props) $$invalidate(9, url = $$props.url);
			if ('viewtransition' in $$props) $$invalidate(0, viewtransition = $$props.viewtransition);
			if ('history' in $$props) $$invalidate(10, history = $$props.history);
			if ('$$scope' in $$props) $$invalidate(14, $$scope = $$props.$$scope);
		};

		$$self.$capture_state = () => ({
			getContext,
			onMount,
			setContext,
			derived,
			writable,
			HISTORY,
			LOCATION,
			ROUTER,
			globalHistory,
			combinePaths,
			pick,
			basepath,
			url,
			viewtransition,
			history,
			viewtransitionFn,
			locationContext,
			routerContext,
			routes,
			activeRoute,
			hasActiveRoute,
			location,
			base,
			routerBase,
			registerRoute,
			unregisterRoute,
			preserveScroll,
			$location,
			$routes,
			$base,
			$activeRoute
		});

		$$self.$inject_state = $$props => {
			if ('basepath' in $$props) $$invalidate(8, basepath = $$props.basepath);
			if ('url' in $$props) $$invalidate(9, url = $$props.url);
			if ('viewtransition' in $$props) $$invalidate(0, viewtransition = $$props.viewtransition);
			if ('history' in $$props) $$invalidate(10, history = $$props.history);
			if ('hasActiveRoute' in $$props) hasActiveRoute = $$props.hasActiveRoute;
			if ('preserveScroll' in $$props) $$invalidate(11, preserveScroll = $$props.preserveScroll);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty & /*$base*/ 8192) {
				// This reactive statement will update all the Routes' path when
				// the basepath changes.
				{
					const { path: basepath } = $base;
					routes.update(rs => rs.map(r => Object.assign(r, { path: combinePaths(basepath, r._path) })));
				}
			}

			if ($$self.$$.dirty & /*$routes, $location, preserveScroll*/ 6146) {
				// This reactive statement will be run when the Router is created
				// when there are no Routes and then again the following tick, so it
				// will not find an active Route in SSR and in the browser it will only
				// pick an active Route after all Routes have been registered.
				{
					const bestMatch = pick($routes, $location.pathname);
					activeRoute.set(bestMatch ? { ...bestMatch, preserveScroll } : bestMatch);
				}
			}
		};

		return [
			viewtransition,
			$location,
			$activeRoute,
			viewtransitionFn,
			routes,
			activeRoute,
			location,
			base,
			basepath,
			url,
			history,
			preserveScroll,
			$routes,
			$base,
			$$scope,
			slots
		];
	}

	class Router extends SvelteComponentDev {
		constructor(options) {
			super(options);

			init(this, options, instance$4, create_fragment$4, safe_not_equal, {
				basepath: 8,
				url: 9,
				viewtransition: 0,
				history: 10
			});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Router",
				options,
				id: create_fragment$4.name
			});
		}

		get basepath() {
			throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set basepath(value) {
			throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get url() {
			throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set url(value) {
			throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get viewtransition() {
			throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set viewtransition(value) {
			throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		get history() {
			throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}

		set history(value) {
			throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
		}
	}

	/* src/routes/login/index.svelte generated by Svelte v4.2.19 */

	const { console: console_1$1 } = globals;
	const file$3 = "src/routes/login/index.svelte";

	function create_fragment$3(ctx) {
		let div2;
		let h2;
		let t1;
		let form;
		let div0;
		let label0;
		let t3;
		let input0;
		let t4;
		let div1;
		let label1;
		let t6;
		let input1;
		let t7;
		let button;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				div2 = element("div");
				h2 = element("h2");
				h2.textContent = "Login To EZYLoan";
				t1 = space();
				form = element("form");
				div0 = element("div");
				label0 = element("label");
				label0.textContent = "Username";
				t3 = space();
				input0 = element("input");
				t4 = space();
				div1 = element("div");
				label1 = element("label");
				label1.textContent = "Email";
				t6 = space();
				input1 = element("input");
				t7 = space();
				button = element("button");
				button.textContent = "Login";
				set_style(h2, "color", "white");
				attr_dev(h2, "class", "svelte-1rm62qg");
				add_location(h2, file$3, 31, 4, 788);
				attr_dev(label0, "for", "username");
				set_style(label0, "color", "white");
				attr_dev(label0, "class", "svelte-1rm62qg");
				add_location(label0, file$3, 34, 4, 933);
				attr_dev(input0, "type", "text");
				attr_dev(input0, "id", "username");
				attr_dev(input0, "placeholder", "Username");
				input0.required = true;
				attr_dev(input0, "class", "svelte-1rm62qg");
				add_location(input0, file$3, 35, 4, 998);
				attr_dev(div0, "class", "form-group svelte-1rm62qg");
				add_location(div0, file$3, 33, 4, 904);
				attr_dev(label1, "for", "email");
				set_style(label1, "color", "white");
				attr_dev(label1, "class", "svelte-1rm62qg");
				add_location(label1, file$3, 38, 4, 1128);
				attr_dev(input1, "type", "email");
				attr_dev(input1, "id", "emaild");
				attr_dev(input1, "placeholder", "Email");
				input1.required = true;
				attr_dev(input1, "class", "svelte-1rm62qg");
				add_location(input1, file$3, 39, 4, 1187);
				attr_dev(div1, "class", "form-group svelte-1rm62qg");
				add_location(div1, file$3, 37, 4, 1099);
				attr_dev(button, "type", "submit");
				attr_dev(button, "class", "login-btn svelte-1rm62qg");
				add_location(button, file$3, 41, 4, 1285);
				attr_dev(form, "class", "login-form svelte-1rm62qg");
				add_location(form, file$3, 32, 4, 841);
				attr_dev(div2, "class", "login-container svelte-1rm62qg");
				add_location(div2, file$3, 30, 4, 754);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, div2, anchor);
				append_dev(div2, h2);
				append_dev(div2, t1);
				append_dev(div2, form);
				append_dev(form, div0);
				append_dev(div0, label0);
				append_dev(div0, t3);
				append_dev(div0, input0);
				set_input_value(input0, /*name*/ ctx[0]);
				append_dev(form, t4);
				append_dev(form, div1);
				append_dev(div1, label1);
				append_dev(div1, t6);
				append_dev(div1, input1);
				set_input_value(input1, /*email*/ ctx[1]);
				append_dev(form, t7);
				append_dev(form, button);

				if (!mounted) {
					dispose = [
						listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
						listen_dev(input1, "input", /*input1_input_handler*/ ctx[4]),
						listen_dev(form, "submit", prevent_default(/*login*/ ctx[2]), false, true, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, [dirty]) {
				if (dirty & /*name*/ 1 && input0.value !== /*name*/ ctx[0]) {
					set_input_value(input0, /*name*/ ctx[0]);
				}

				if (dirty & /*email*/ 2 && input1.value !== /*email*/ ctx[1]) {
					set_input_value(input1, /*email*/ ctx[1]);
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(div2);
				}

				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$3.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$3($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Login', slots, []);
		let name = "";
		let email = "";
		const dispatch = createEventDispatcher();

		async function login() {
			console.log("Logging in...");

			const response = await fetch(`${urlRoot}/api/v1/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, email })
			});

			if (response.ok) {
				const data = await response.json();
				localStorage.setItem("token", data.access_token);
				dispatch("login");
				navigate("/");
			} else {
				alert("Invalid credentials");
			}
		}

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Login> was created with unknown prop '${key}'`);
		});

		function input0_input_handler() {
			name = this.value;
			$$invalidate(0, name);
		}

		function input1_input_handler() {
			email = this.value;
			$$invalidate(1, email);
		}

		$$self.$capture_state = () => ({
			createEventDispatcher,
			navigate,
			urlRoot,
			name,
			email,
			dispatch,
			login
		});

		$$self.$inject_state = $$props => {
			if ('name' in $$props) $$invalidate(0, name = $$props.name);
			if ('email' in $$props) $$invalidate(1, email = $$props.email);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [name, email, login, input0_input_handler, input1_input_handler];
	}

	class Login extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Login",
				options,
				id: create_fragment$3.name
			});
		}
	}

	/* src/components/LenderForm.svelte generated by Svelte v4.2.19 */

	const { console: console_1 } = globals;
	const file$2 = "src/components/LenderForm.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[12] = list[i];
		return child_ctx;
	}

	function get_each_context_1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[15] = list[i];
		return child_ctx;
	}

	// (88:4) {:else}
	function create_else_block(ctx) {
		let form;
		let label0;
		let t0;
		let select0;
		let option0;
		let t2;
		let label1;
		let t3;
		let input;
		let t4;
		let label2;
		let t5;
		let select1;
		let option1;
		let t7;
		let button;
		let t9;
		let if_block_anchor;
		let mounted;
		let dispose;
		let each_value_1 = ensure_array_like_dev(/*wallets*/ ctx[0]);
		let each_blocks_1 = [];

		for (let i = 0; i < each_value_1.length; i += 1) {
			each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
		}

		let each_value = ensure_array_like_dev(/*tokens*/ ctx[6]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		let if_block = /*resultMessage*/ ctx[5] && create_if_block_2(ctx);

		const block = {
			c: function create() {
				form = element("form");
				label0 = element("label");
				t0 = text("Select Wallet:\n                ");
				select0 = element("select");
				option0 = element("option");
				option0.textContent = "Select a wallet";

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].c();
				}

				t2 = space();
				label1 = element("label");
				t3 = text("Loan Amount:\n                ");
				input = element("input");
				t4 = space();
				label2 = element("label");
				t5 = text("Token:\n                ");
				select1 = element("select");
				option1 = element("option");
				option1.textContent = "Select a token";

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t7 = space();
				button = element("button");
				button.textContent = "Submit";
				t9 = space();
				if (if_block) if_block.c();
				if_block_anchor = empty();
				option0.__value = "";
				set_input_value(option0, option0.__value);
				option0.disabled = true;
				add_location(option0, file$2, 92, 20, 2944);
				select0.required = true;
				attr_dev(select0, "class", "svelte-xosryq");
				if (/*selectedWallet*/ ctx[1] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[8].call(select0));
				add_location(select0, file$2, 91, 16, 2878);
				attr_dev(label0, "class", "svelte-xosryq");
				add_location(label0, file$2, 89, 12, 2823);
				attr_dev(input, "type", "number");
				attr_dev(input, "placeholder", "Enter loan amount");
				attr_dev(input, "step", "0.000000001");
				input.required = true;
				attr_dev(input, "class", "svelte-xosryq");
				add_location(input, file$2, 101, 16, 3253);
				attr_dev(label1, "class", "svelte-xosryq");
				add_location(label1, file$2, 99, 12, 3200);
				option1.__value = "";
				set_input_value(option1, option1.__value);
				option1.disabled = true;
				add_location(option1, file$2, 113, 20, 3635);
				select1.required = true;
				attr_dev(select1, "class", "svelte-xosryq");
				if (/*loanDetails*/ ctx[2].token === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[10].call(select1));
				add_location(select1, file$2, 112, 16, 3566);
				attr_dev(label2, "class", "svelte-xosryq");
				add_location(label2, file$2, 110, 12, 3519);
				attr_dev(button, "type", "submit");
				attr_dev(button, "class", "btn btn-primary svelte-xosryq");
				add_location(button, file$2, 120, 12, 3880);
				attr_dev(form, "class", "svelte-xosryq");
				add_location(form, file$2, 88, 8, 2764);
			},
			m: function mount(target, anchor) {
				insert_dev(target, form, anchor);
				append_dev(form, label0);
				append_dev(label0, t0);
				append_dev(label0, select0);
				append_dev(select0, option0);

				for (let i = 0; i < each_blocks_1.length; i += 1) {
					if (each_blocks_1[i]) {
						each_blocks_1[i].m(select0, null);
					}
				}

				select_option(select0, /*selectedWallet*/ ctx[1], true);
				append_dev(form, t2);
				append_dev(form, label1);
				append_dev(label1, t3);
				append_dev(label1, input);
				set_input_value(input, /*loanDetails*/ ctx[2].amount);
				append_dev(form, t4);
				append_dev(form, label2);
				append_dev(label2, t5);
				append_dev(label2, select1);
				append_dev(select1, option1);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(select1, null);
					}
				}

				select_option(select1, /*loanDetails*/ ctx[2].token, true);
				append_dev(form, t7);
				append_dev(form, button);
				insert_dev(target, t9, anchor);
				if (if_block) if_block.m(target, anchor);
				insert_dev(target, if_block_anchor, anchor);

				if (!mounted) {
					dispose = [
						listen_dev(select0, "change", /*select0_change_handler*/ ctx[8]),
						listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
						listen_dev(select1, "change", /*select1_change_handler*/ ctx[10]),
						listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[7]), false, true, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty & /*wallets*/ 1) {
					each_value_1 = ensure_array_like_dev(/*wallets*/ ctx[0]);
					let i;

					for (i = 0; i < each_value_1.length; i += 1) {
						const child_ctx = get_each_context_1(ctx, each_value_1, i);

						if (each_blocks_1[i]) {
							each_blocks_1[i].p(child_ctx, dirty);
						} else {
							each_blocks_1[i] = create_each_block_1(child_ctx);
							each_blocks_1[i].c();
							each_blocks_1[i].m(select0, null);
						}
					}

					for (; i < each_blocks_1.length; i += 1) {
						each_blocks_1[i].d(1);
					}

					each_blocks_1.length = each_value_1.length;
				}

				if (dirty & /*selectedWallet, wallets*/ 3) {
					select_option(select0, /*selectedWallet*/ ctx[1]);
				}

				if (dirty & /*loanDetails, tokens*/ 68 && to_number(input.value) !== /*loanDetails*/ ctx[2].amount) {
					set_input_value(input, /*loanDetails*/ ctx[2].amount);
				}

				if (dirty & /*tokens*/ 64) {
					each_value = ensure_array_like_dev(/*tokens*/ ctx[6]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(select1, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}

				if (dirty & /*loanDetails, tokens*/ 68) {
					select_option(select1, /*loanDetails*/ ctx[2].token);
				}

				if (/*resultMessage*/ ctx[5]) {
					if (if_block) {
						if_block.p(ctx, dirty);
					} else {
						if_block = create_if_block_2(ctx);
						if_block.c();
						if_block.m(if_block_anchor.parentNode, if_block_anchor);
					}
				} else if (if_block) {
					if_block.d(1);
					if_block = null;
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(form);
					detach_dev(t9);
					detach_dev(if_block_anchor);
				}

				destroy_each(each_blocks_1, detaching);
				destroy_each(each_blocks, detaching);
				if (if_block) if_block.d(detaching);
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block.name,
			type: "else",
			source: "(88:4) {:else}",
			ctx
		});

		return block;
	}

	// (86:27) 
	function create_if_block_1(ctx) {
		let p;
		let t;

		const block = {
			c: function create() {
				p = element("p");
				t = text(/*errorMessage*/ ctx[4]);
				attr_dev(p, "class", "error-text svelte-xosryq");
				add_location(p, file$2, 86, 8, 2703);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);
				append_dev(p, t);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*errorMessage*/ 16) set_data_dev(t, /*errorMessage*/ ctx[4]);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(p);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1.name,
			type: "if",
			source: "(86:27) ",
			ctx
		});

		return block;
	}

	// (84:4) {#if isLoading}
	function create_if_block(ctx) {
		let p;

		const block = {
			c: function create() {
				p = element("p");
				p.textContent = "Loading wallets...";
				attr_dev(p, "class", "loading-text svelte-xosryq");
				add_location(p, file$2, 84, 8, 2620);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(p);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block.name,
			type: "if",
			source: "(84:4) {#if isLoading}",
			ctx
		});

		return block;
	}

	// (94:20) {#each wallets as wallet}
	function create_each_block_1(ctx) {
		let option;
		let t_value = /*wallet*/ ctx[15].id + "";
		let t;
		let option_value_value;

		const block = {
			c: function create() {
				option = element("option");
				t = text(t_value);
				option.__value = option_value_value = /*wallet*/ ctx[15].id;
				set_input_value(option, option.__value);
				add_location(option, file$2, 94, 24, 3065);
			},
			m: function mount(target, anchor) {
				insert_dev(target, option, anchor);
				append_dev(option, t);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*wallets*/ 1 && t_value !== (t_value = /*wallet*/ ctx[15].id + "")) set_data_dev(t, t_value);

				if (dirty & /*wallets*/ 1 && option_value_value !== (option_value_value = /*wallet*/ ctx[15].id)) {
					prop_dev(option, "__value", option_value_value);
					set_input_value(option, option.__value);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(option);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_1.name,
			type: "each",
			source: "(94:20) {#each wallets as wallet}",
			ctx
		});

		return block;
	}

	// (115:20) {#each tokens as token}
	function create_each_block(ctx) {
		let option;
		let t_value = /*token*/ ctx[12] + "";
		let t;

		const block = {
			c: function create() {
				option = element("option");
				t = text(t_value);
				option.__value = /*token*/ ctx[12];
				set_input_value(option, option.__value);
				add_location(option, file$2, 115, 24, 3753);
			},
			m: function mount(target, anchor) {
				insert_dev(target, option, anchor);
				append_dev(option, t);
			},
			p: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(option);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block.name,
			type: "each",
			source: "(115:20) {#each tokens as token}",
			ctx
		});

		return block;
	}

	// (124:8) {#if resultMessage}
	function create_if_block_2(ctx) {
		let p;
		let t;

		const block = {
			c: function create() {
				p = element("p");
				t = text(/*resultMessage*/ ctx[5]);
				attr_dev(p, "class", "result-text svelte-xosryq");
				add_location(p, file$2, 124, 12, 3999);
			},
			m: function mount(target, anchor) {
				insert_dev(target, p, anchor);
				append_dev(p, t);
			},
			p: function update(ctx, dirty) {
				if (dirty & /*resultMessage*/ 32) set_data_dev(t, /*resultMessage*/ ctx[5]);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(p);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2.name,
			type: "if",
			source: "(124:8) {#if resultMessage}",
			ctx
		});

		return block;
	}

	function create_fragment$2(ctx) {
		let section;
		let h1;
		let t1;
		let p;
		let t3;

		function select_block_type(ctx, dirty) {
			if (/*isLoading*/ ctx[3]) return create_if_block;
			if (/*errorMessage*/ ctx[4]) return create_if_block_1;
			return create_else_block;
		}

		let current_block_type = select_block_type(ctx);
		let if_block = current_block_type(ctx);

		const block = {
			c: function create() {
				section = element("section");
				h1 = element("h1");
				h1.textContent = "Lender Form";
				t1 = space();
				p = element("p");
				p.textContent = "Provide loans to borrowers securely.";
				t3 = space();
				if_block.c();
				attr_dev(h1, "class", "svelte-xosryq");
				add_location(h1, file$2, 80, 4, 2522);
				attr_dev(p, "class", "svelte-xosryq");
				add_location(p, file$2, 81, 4, 2547);
				attr_dev(section, "class", "lender-form-container svelte-xosryq");
				add_location(section, file$2, 79, 0, 2478);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, section, anchor);
				append_dev(section, h1);
				append_dev(section, t1);
				append_dev(section, p);
				append_dev(section, t3);
				if_block.m(section, null);
			},
			p: function update(ctx, [dirty]) {
				if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block.d(1);
					if_block = current_block_type(ctx);

					if (if_block) {
						if_block.c();
						if_block.m(section, null);
					}
				}
			},
			i: noop,
			o: noop,
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(section);
				}

				if_block.d();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$2.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$2($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('LenderForm', slots, []);
		let wallets = [];
		let selectedWallet = "";
		let loanDetails = { amount: "", token: "" };
		let isLoading = true;
		let errorMessage = "";
		let resultMessage = ""; // To display the result from the API
		const tokens = ["ETH", "USDC", "DAI"];

		// Fetch wallets from the backend
		async function fetchWallets() {
			try {
				$$invalidate(3, isLoading = true);
				const response = await fetch(`${urlRoot}/api/v1/wallets`);

				if (response.ok) {
					$$invalidate(0, wallets = await response.json());

					$$invalidate(4, errorMessage = wallets.length
					? ""
					: "No wallets found. Please create a wallet first.");
				} else {
					$$invalidate(4, errorMessage = "Failed to fetch wallets. Please try again.");
				}
			} catch(error) {
				$$invalidate(4, errorMessage = "Error fetching wallets. Check your connection.");
				console.error("Error fetching wallets:", error);
			} finally {
				$$invalidate(3, isLoading = false);
			}
		}

		async function handleSubmit() {
			if (!selectedWallet || !loanDetails.amount || !loanDetails.token) {
				alert("Please fill in all fields.");
				return;
			}

			try {
				$$invalidate(5, resultMessage = "Processing your request...");

				const response = await fetch(`${urlRoot}/api/v1/wallet/${selectedWallet}/accept-reject-lend-request`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						loan_amount: loanDetails.amount,
						loan_token: loanDetails.token
					})
				});

				const result = await response.json();

				if (response.ok) {
					$$invalidate(5, resultMessage = `Status: ${result.status}. ${result.reason || result.message}`);
				} else {
					$$invalidate(5, resultMessage = `Error: ${result.detail || "Something went wrong."}`);
				}
			} catch(error) {
				$$invalidate(5, resultMessage = `Error: ${error.message}`);
				console.error("Error submitting lender data:", error);
			}
		}

		onMount(() => {
			fetchWallets();
		});

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<LenderForm> was created with unknown prop '${key}'`);
		});

		function select0_change_handler() {
			selectedWallet = select_value(this);
			$$invalidate(1, selectedWallet);
			$$invalidate(0, wallets);
		}

		function input_input_handler() {
			loanDetails.amount = to_number(this.value);
			$$invalidate(2, loanDetails);
			$$invalidate(6, tokens);
		}

		function select1_change_handler() {
			loanDetails.token = select_value(this);
			$$invalidate(2, loanDetails);
			$$invalidate(6, tokens);
		}

		$$self.$capture_state = () => ({
			onMount,
			urlRoot,
			wallets,
			selectedWallet,
			loanDetails,
			isLoading,
			errorMessage,
			resultMessage,
			tokens,
			fetchWallets,
			handleSubmit
		});

		$$self.$inject_state = $$props => {
			if ('wallets' in $$props) $$invalidate(0, wallets = $$props.wallets);
			if ('selectedWallet' in $$props) $$invalidate(1, selectedWallet = $$props.selectedWallet);
			if ('loanDetails' in $$props) $$invalidate(2, loanDetails = $$props.loanDetails);
			if ('isLoading' in $$props) $$invalidate(3, isLoading = $$props.isLoading);
			if ('errorMessage' in $$props) $$invalidate(4, errorMessage = $$props.errorMessage);
			if ('resultMessage' in $$props) $$invalidate(5, resultMessage = $$props.resultMessage);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		return [
			wallets,
			selectedWallet,
			loanDetails,
			isLoading,
			errorMessage,
			resultMessage,
			tokens,
			handleSubmit,
			select0_change_handler,
			input_input_handler,
			select1_change_handler
		];
	}

	class LenderForm extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "LenderForm",
				options,
				id: create_fragment$2.name
			});
		}
	}

	/* src/routes/lend/index.svelte generated by Svelte v4.2.19 */
	const file$1 = "src/routes/lend/index.svelte";

	function create_fragment$1(ctx) {
		let section;
		let h1;
		let t1;
		let p;
		let t3;
		let lenderform;
		let current;
		lenderform = new LenderForm({ $$inline: true });

		const block = {
			c: function create() {
				section = element("section");
				h1 = element("h1");
				h1.textContent = "Lender Form";
				t1 = space();
				p = element("p");
				p.textContent = "Provide the details of amount you want to lend and choose your token.";
				t3 = space();
				create_component(lenderform.$$.fragment);
				attr_dev(h1, "class", "svelte-ikey0n");
				add_location(h1, file$1, 5, 4, 125);
				attr_dev(p, "class", "svelte-ikey0n");
				add_location(p, file$1, 6, 4, 150);
				attr_dev(section, "class", "loan-request-page svelte-ikey0n");
				add_location(section, file$1, 4, 0, 85);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, section, anchor);
				append_dev(section, h1);
				append_dev(section, t1);
				append_dev(section, p);
				append_dev(section, t3);
				mount_component(lenderform, section, null);
				current = true;
			},
			p: noop,
			i: function intro(local) {
				if (current) return;
				transition_in(lenderform.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(lenderform.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(section);
				}

				destroy_component(lenderform);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment$1.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance$1($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('Lend', slots, []);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Lend> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({ LenderForm });
		return [];
	}

	class Lend extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "Lend",
				options,
				id: create_fragment$1.name
			});
		}
	}

	/* src/App.svelte generated by Svelte v4.2.19 */
	const file = "src/App.svelte";

	// (16:0) <Router>
	function create_default_slot(ctx) {
		let route0;
		let t0;
		let route1;
		let t1;
		let route2;
		let t2;
		let route3;
		let t3;
		let route4;
		let t4;
		let route5;
		let current;

		route0 = new Route({
				props: { path: "/", component: Routes },
				$$inline: true
			});

		route1 = new Route({
				props: { path: "/wallet", component: Wallet },
				$$inline: true
			});

		route2 = new Route({
				props: {
					path: "/wallet/create",
					component: Create
				},
				$$inline: true
			});

		route3 = new Route({
				props: {
					path: "/loan/request",
					component: Request
				},
				$$inline: true
			});

		route4 = new Route({
				props: { path: "/login", component: Login },
				$$inline: true
			});

		route5 = new Route({
				props: { path: "/lend", component: Lend },
				$$inline: true
			});

		const block = {
			c: function create() {
				create_component(route0.$$.fragment);
				t0 = space();
				create_component(route1.$$.fragment);
				t1 = space();
				create_component(route2.$$.fragment);
				t2 = space();
				create_component(route3.$$.fragment);
				t3 = space();
				create_component(route4.$$.fragment);
				t4 = space();
				create_component(route5.$$.fragment);
			},
			m: function mount(target, anchor) {
				mount_component(route0, target, anchor);
				insert_dev(target, t0, anchor);
				mount_component(route1, target, anchor);
				insert_dev(target, t1, anchor);
				mount_component(route2, target, anchor);
				insert_dev(target, t2, anchor);
				mount_component(route3, target, anchor);
				insert_dev(target, t3, anchor);
				mount_component(route4, target, anchor);
				insert_dev(target, t4, anchor);
				mount_component(route5, target, anchor);
				current = true;
			},
			p: noop,
			i: function intro(local) {
				if (current) return;
				transition_in(route0.$$.fragment, local);
				transition_in(route1.$$.fragment, local);
				transition_in(route2.$$.fragment, local);
				transition_in(route3.$$.fragment, local);
				transition_in(route4.$$.fragment, local);
				transition_in(route5.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(route0.$$.fragment, local);
				transition_out(route1.$$.fragment, local);
				transition_out(route2.$$.fragment, local);
				transition_out(route3.$$.fragment, local);
				transition_out(route4.$$.fragment, local);
				transition_out(route5.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t0);
					detach_dev(t1);
					detach_dev(t2);
					detach_dev(t3);
					detach_dev(t4);
				}

				destroy_component(route0, detaching);
				destroy_component(route1, detaching);
				destroy_component(route2, detaching);
				destroy_component(route3, detaching);
				destroy_component(route4, detaching);
				destroy_component(route5, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_default_slot.name,
			type: "slot",
			source: "(16:0) <Router>",
			ctx
		});

		return block;
	}

	function create_fragment(ctx) {
		let meta;
		let t;
		let router;
		let current;

		router = new Router({
				props: {
					$$slots: { default: [create_default_slot] },
					$$scope: { ctx }
				},
				$$inline: true
			});

		const block = {
			c: function create() {
				meta = element("meta");
				t = space();
				create_component(router.$$.fragment);
				document.title = "Ezy Loan";
				attr_dev(meta, "name", "description");
				attr_dev(meta, "content", "Ezy loan provides loan.");
				add_location(meta, file, 12, 2, 434);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				append_dev(document.head, meta);
				insert_dev(target, t, anchor);
				mount_component(router, target, anchor);
				current = true;
			},
			p: function update(ctx, [dirty]) {
				const router_changes = {};

				if (dirty & /*$$scope*/ 1) {
					router_changes.$$scope = { dirty, ctx };
				}

				router.$set(router_changes);
			},
			i: function intro(local) {
				if (current) return;
				transition_in(router.$$.fragment, local);
				current = true;
			},
			o: function outro(local) {
				transition_out(router.$$.fragment, local);
				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}

				detach_dev(meta);
				destroy_component(router, detaching);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_fragment.name,
			type: "component",
			source: "",
			ctx
		});

		return block;
	}

	function instance($$self, $$props, $$invalidate) {
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('App', slots, []);
		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
		});

		$$self.$capture_state = () => ({
			Home: Routes,
			Wallet,
			WalletCreate: Create,
			LoanRequest: Request,
			Login,
			LendRequest: Lend,
			Router,
			Route
		});

		return [];
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, {});

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "App",
				options,
				id: create_fragment.name
			});
		}
	}

	const app = new App({
	  target: document.body,
	  props: {
	    name: 'world'
	  }
	});

	return app;

})();
//# sourceMappingURL=bundle.js.map
