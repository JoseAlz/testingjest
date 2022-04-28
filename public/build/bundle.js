
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
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
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
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
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
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
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function capFirstString(str) {
        return str.substring(0, 1).toUpperCase().concat(str.slice(1));
    }

    function reverseString(str) {
        return str.split('').reverse().join('');
    }

    let calculator = {
        add: (a, b) => a + b,
        subtract: (a, b) => a - b,
        divide: (a, b) => a / b,
        multiply: (a, b) => a * b,
        addA: 1,
        addB: 1,
        subtractA: 10,
        subtractB: 5,
        divideA: 100,
        divideB: 4,
        multiplyA: 5,
        multiplyB: 5,
    };

    /* caesar helper function */
    function isUpperCase(str) {
        return str === str.toUpperCase();
    }

    function isSpaceOrPunctuation(str) {
        return /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g.test(str) || /\s/.test(str);
    }

    /* main caesar function */
    function caesar(str, key) {
        let cipher = '';
        for(let i = 0; i < str.length; i++) {
            if (isSpaceOrPunctuation(str[i])) {
                cipher += String.fromCharCode(str.charCodeAt(i));
            } else if(isUpperCase(str[i])) {
                cipher += String.fromCharCode((str.charCodeAt(i) + key - 65) % 26 + 65);
            } else {
                cipher += String.fromCharCode((str.charCodeAt(i) + key - 97) % 26 + 97);
            }
        }
        return cipher;
    }

    /* array analysis helper functions */
    function findAverage(arr) {
        const addedUp = arr.reduce((acc, cur) => acc + cur);
        const average = addedUp / arr.length;
        return average;
    }

    function findMin(arr) {
        const min = arr.reduce((acc, cur) => (acc > cur) ? cur : acc);
        return min;
    }
    function findMax(arr) {
        const max = arr.reduce((acc, cur) => (acc > cur) ? acc : cur);
        return max;
    }
    /* Array analysis function */
    function analyzeArray(arr) {
        let analysis = {};
        if (arr.length > 0) {
            analysis = {
                average: findAverage(arr),
                min: findMin(arr),
                max: findMax(arr),
                length: arr.length
            };
        }
        return analysis;
    }

    /* src\components\CappedString.svelte generated by Svelte v3.47.0 */
    const file$5 = "src\\components\\CappedString.svelte";

    function create_fragment$5(ctx) {
    	let div1;
    	let div0;
    	let label;
    	let t1;
    	let input;
    	let t2;
    	let p;
    	let t3;
    	let t4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			label = element("label");
    			label.textContent = "Tome una cadena y devuelva esa cadena con el primer carácter en mayúscula:";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			p = element("p");
    			t3 = text("Salida: ");
    			t4 = text(/*firstLetter*/ ctx[1]);
    			attr_dev(label, "for", "cappingFirstLetter");
    			add_location(label, file$5, 8, 8, 202);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "cappingFirstLetter");
    			add_location(input, file$5, 9, 8, 327);
    			attr_dev(div0, "class", "svelte-1kcb3ie");
    			add_location(div0, file$5, 7, 4, 187);
    			add_location(p, file$5, 11, 4, 414);
    			attr_dev(div1, "id", "capString");
    			attr_dev(div1, "class", "svelte-1kcb3ie");
    			add_location(div1, file$5, 6, 0, 161);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, label);
    			append_dev(div0, t1);
    			append_dev(div0, input);
    			set_input_value(input, /*capitalize*/ ctx[0]);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    			append_dev(p, t3);
    			append_dev(p, t4);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*capitalize*/ 1 && input.value !== /*capitalize*/ ctx[0]) {
    				set_input_value(input, /*capitalize*/ ctx[0]);
    			}

    			if (dirty & /*firstLetter*/ 2) set_data_dev(t4, /*firstLetter*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
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
    	let firstLetter;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CappedString', slots, []);
    	let capitalize = '';
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CappedString> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		capitalize = this.value;
    		$$invalidate(0, capitalize);
    	}

    	$$self.$capture_state = () => ({ capFirstString, capitalize, firstLetter });

    	$$self.$inject_state = $$props => {
    		if ('capitalize' in $$props) $$invalidate(0, capitalize = $$props.capitalize);
    		if ('firstLetter' in $$props) $$invalidate(1, firstLetter = $$props.firstLetter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*capitalize*/ 1) {
    			$$invalidate(1, firstLetter = capFirstString(capitalize));
    		}
    	};

    	return [capitalize, firstLetter, input_input_handler];
    }

    class CappedString extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CappedString",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\Reversed.svelte generated by Svelte v3.47.0 */
    const file$4 = "src\\components\\Reversed.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let label;
    	let t1;
    	let input;
    	let t2;
    	let p;
    	let t3;
    	let t4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			label = element("label");
    			label.textContent = "Toma una cadena de texto  y la devuélve al revés:";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			p = element("p");
    			t3 = text("Salida: ");
    			t4 = text(/*reversed*/ ctx[1]);
    			attr_dev(label, "for", "reversingInput");
    			add_location(label, file$4, 8, 8, 196);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "name", "reversingInput");
    			add_location(input, file$4, 9, 8, 292);
    			attr_dev(div0, "class", "svelte-nkca14");
    			add_location(div0, file$4, 7, 4, 181);
    			add_location(p, file$4, 11, 4, 377);
    			attr_dev(div1, "id", "reverse");
    			attr_dev(div1, "class", "svelte-nkca14");
    			add_location(div1, file$4, 6, 0, 157);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, label);
    			append_dev(div0, t1);
    			append_dev(div0, input);
    			set_input_value(input, /*reverseInput*/ ctx[0]);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    			append_dev(p, t3);
    			append_dev(p, t4);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[2]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*reverseInput*/ 1 && input.value !== /*reverseInput*/ ctx[0]) {
    				set_input_value(input, /*reverseInput*/ ctx[0]);
    			}

    			if (dirty & /*reversed*/ 2) set_data_dev(t4, /*reversed*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
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
    	let reversed;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Reversed', slots, []);
    	let reverseInput = '';
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Reversed> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		reverseInput = this.value;
    		$$invalidate(0, reverseInput);
    	}

    	$$self.$capture_state = () => ({ reverseString, reverseInput, reversed });

    	$$self.$inject_state = $$props => {
    		if ('reverseInput' in $$props) $$invalidate(0, reverseInput = $$props.reverseInput);
    		if ('reversed' in $$props) $$invalidate(1, reversed = $$props.reversed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*reverseInput*/ 1) {
    			$$invalidate(1, reversed = reverseString(reverseInput));
    		}
    	};

    	return [reverseInput, reversed, input_input_handler];
    }

    class Reversed extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Reversed",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\Calculator.svelte generated by Svelte v3.47.0 */
    const file$3 = "src\\components\\Calculator.svelte";

    function create_fragment$3(ctx) {
    	let h3;
    	let t1;
    	let div4;
    	let div0;
    	let input0;
    	let t2;
    	let input1;
    	let t3;
    	let p0;
    	let t4_value = /*calculator*/ ctx[0].addA + "";
    	let t4;
    	let t5;
    	let t6_value = /*calculator*/ ctx[0].addB + "";
    	let t6;
    	let t7;
    	let t8;
    	let t9;
    	let div1;
    	let input2;
    	let t10;
    	let input3;
    	let t11;
    	let p1;
    	let t12_value = /*calculator*/ ctx[0].subtractA + "";
    	let t12;
    	let t13;
    	let t14_value = /*calculator*/ ctx[0].subtractB + "";
    	let t14;
    	let t15;
    	let t16;
    	let t17;
    	let div2;
    	let input4;
    	let t18;
    	let input5;
    	let t19;
    	let p2;
    	let t20_value = /*calculator*/ ctx[0].divideA + "";
    	let t20;
    	let t21;
    	let t22_value = /*calculator*/ ctx[0].divideB + "";
    	let t22;
    	let t23;
    	let t24;
    	let t25;
    	let div3;
    	let input6;
    	let t26;
    	let input7;
    	let t27;
    	let p3;
    	let t28_value = /*calculator*/ ctx[0].multiplyA + "";
    	let t28;
    	let t29;
    	let t30_value = /*calculator*/ ctx[0].multiplyB + "";
    	let t30;
    	let t31;
    	let t32;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "My Pocket Calculator";
    			t1 = space();
    			div4 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			p0 = element("p");
    			t4 = text(t4_value);
    			t5 = text(" + ");
    			t6 = text(t6_value);
    			t7 = text(" = ");
    			t8 = text(/*addition*/ ctx[4]);
    			t9 = space();
    			div1 = element("div");
    			input2 = element("input");
    			t10 = space();
    			input3 = element("input");
    			t11 = space();
    			p1 = element("p");
    			t12 = text(t12_value);
    			t13 = text(" - ");
    			t14 = text(t14_value);
    			t15 = text(" = ");
    			t16 = text(/*subtraction*/ ctx[3]);
    			t17 = space();
    			div2 = element("div");
    			input4 = element("input");
    			t18 = space();
    			input5 = element("input");
    			t19 = space();
    			p2 = element("p");
    			t20 = text(t20_value);
    			t21 = text(" / ");
    			t22 = text(t22_value);
    			t23 = text(" = ");
    			t24 = text(/*division*/ ctx[2]);
    			t25 = space();
    			div3 = element("div");
    			input6 = element("input");
    			t26 = space();
    			input7 = element("input");
    			t27 = space();
    			p3 = element("p");
    			t28 = text(t28_value);
    			t29 = text(" * ");
    			t30 = text(t30_value);
    			t31 = text(" = ");
    			t32 = text(/*multiplication*/ ctx[1]);
    			add_location(h3, file$3, 8, 0, 396);
    			attr_dev(input0, "type", "number");
    			add_location(input0, file$3, 11, 8, 471);
    			attr_dev(input1, "type", "number");
    			add_location(input1, file$3, 12, 8, 531);
    			add_location(p0, file$3, 13, 8, 591);
    			add_location(div0, file$3, 10, 4, 456);
    			attr_dev(input2, "type", "number");
    			add_location(input2, file$3, 16, 8, 681);
    			attr_dev(input3, "type", "number");
    			add_location(input3, file$3, 17, 8, 746);
    			add_location(p1, file$3, 18, 8, 811);
    			add_location(div1, file$3, 15, 4, 666);
    			attr_dev(input4, "type", "number");
    			add_location(input4, file$3, 21, 8, 914);
    			attr_dev(input5, "type", "number");
    			add_location(input5, file$3, 22, 8, 977);
    			add_location(p2, file$3, 23, 8, 1040);
    			add_location(div2, file$3, 20, 4, 899);
    			attr_dev(input6, "type", "number");
    			add_location(input6, file$3, 26, 8, 1136);
    			attr_dev(input7, "type", "number");
    			add_location(input7, file$3, 27, 8, 1201);
    			add_location(p3, file$3, 28, 8, 1266);
    			add_location(div3, file$3, 25, 4, 1121);
    			attr_dev(div4, "id", "calculations");
    			attr_dev(div4, "class", "svelte-tfz61n");
    			add_location(div4, file$3, 9, 0, 427);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, input0);
    			set_input_value(input0, /*calculator*/ ctx[0].addA);
    			append_dev(div0, t2);
    			append_dev(div0, input1);
    			set_input_value(input1, /*calculator*/ ctx[0].addB);
    			append_dev(div0, t3);
    			append_dev(div0, p0);
    			append_dev(p0, t4);
    			append_dev(p0, t5);
    			append_dev(p0, t6);
    			append_dev(p0, t7);
    			append_dev(p0, t8);
    			append_dev(div4, t9);
    			append_dev(div4, div1);
    			append_dev(div1, input2);
    			set_input_value(input2, /*calculator*/ ctx[0].subtractA);
    			append_dev(div1, t10);
    			append_dev(div1, input3);
    			set_input_value(input3, /*calculator*/ ctx[0].subtractB);
    			append_dev(div1, t11);
    			append_dev(div1, p1);
    			append_dev(p1, t12);
    			append_dev(p1, t13);
    			append_dev(p1, t14);
    			append_dev(p1, t15);
    			append_dev(p1, t16);
    			append_dev(div4, t17);
    			append_dev(div4, div2);
    			append_dev(div2, input4);
    			set_input_value(input4, /*calculator*/ ctx[0].divideA);
    			append_dev(div2, t18);
    			append_dev(div2, input5);
    			set_input_value(input5, /*calculator*/ ctx[0].divideB);
    			append_dev(div2, t19);
    			append_dev(div2, p2);
    			append_dev(p2, t20);
    			append_dev(p2, t21);
    			append_dev(p2, t22);
    			append_dev(p2, t23);
    			append_dev(p2, t24);
    			append_dev(div4, t25);
    			append_dev(div4, div3);
    			append_dev(div3, input6);
    			set_input_value(input6, /*calculator*/ ctx[0].multiplyA);
    			append_dev(div3, t26);
    			append_dev(div3, input7);
    			set_input_value(input7, /*calculator*/ ctx[0].multiplyB);
    			append_dev(div3, t27);
    			append_dev(div3, p3);
    			append_dev(p3, t28);
    			append_dev(p3, t29);
    			append_dev(p3, t30);
    			append_dev(p3, t31);
    			append_dev(p3, t32);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[7]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[8]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[9]),
    					listen_dev(input5, "input", /*input5_input_handler*/ ctx[10]),
    					listen_dev(input6, "input", /*input6_input_handler*/ ctx[11]),
    					listen_dev(input7, "input", /*input7_input_handler*/ ctx[12])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*calculator*/ 1 && to_number(input0.value) !== /*calculator*/ ctx[0].addA) {
    				set_input_value(input0, /*calculator*/ ctx[0].addA);
    			}

    			if (dirty & /*calculator*/ 1 && to_number(input1.value) !== /*calculator*/ ctx[0].addB) {
    				set_input_value(input1, /*calculator*/ ctx[0].addB);
    			}

    			if (dirty & /*calculator*/ 1 && t4_value !== (t4_value = /*calculator*/ ctx[0].addA + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*calculator*/ 1 && t6_value !== (t6_value = /*calculator*/ ctx[0].addB + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*addition*/ 16) set_data_dev(t8, /*addition*/ ctx[4]);

    			if (dirty & /*calculator*/ 1 && to_number(input2.value) !== /*calculator*/ ctx[0].subtractA) {
    				set_input_value(input2, /*calculator*/ ctx[0].subtractA);
    			}

    			if (dirty & /*calculator*/ 1 && to_number(input3.value) !== /*calculator*/ ctx[0].subtractB) {
    				set_input_value(input3, /*calculator*/ ctx[0].subtractB);
    			}

    			if (dirty & /*calculator*/ 1 && t12_value !== (t12_value = /*calculator*/ ctx[0].subtractA + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*calculator*/ 1 && t14_value !== (t14_value = /*calculator*/ ctx[0].subtractB + "")) set_data_dev(t14, t14_value);
    			if (dirty & /*subtraction*/ 8) set_data_dev(t16, /*subtraction*/ ctx[3]);

    			if (dirty & /*calculator*/ 1 && to_number(input4.value) !== /*calculator*/ ctx[0].divideA) {
    				set_input_value(input4, /*calculator*/ ctx[0].divideA);
    			}

    			if (dirty & /*calculator*/ 1 && to_number(input5.value) !== /*calculator*/ ctx[0].divideB) {
    				set_input_value(input5, /*calculator*/ ctx[0].divideB);
    			}

    			if (dirty & /*calculator*/ 1 && t20_value !== (t20_value = /*calculator*/ ctx[0].divideA + "")) set_data_dev(t20, t20_value);
    			if (dirty & /*calculator*/ 1 && t22_value !== (t22_value = /*calculator*/ ctx[0].divideB + "")) set_data_dev(t22, t22_value);
    			if (dirty & /*division*/ 4) set_data_dev(t24, /*division*/ ctx[2]);

    			if (dirty & /*calculator*/ 1 && to_number(input6.value) !== /*calculator*/ ctx[0].multiplyA) {
    				set_input_value(input6, /*calculator*/ ctx[0].multiplyA);
    			}

    			if (dirty & /*calculator*/ 1 && to_number(input7.value) !== /*calculator*/ ctx[0].multiplyB) {
    				set_input_value(input7, /*calculator*/ ctx[0].multiplyB);
    			}

    			if (dirty & /*calculator*/ 1 && t28_value !== (t28_value = /*calculator*/ ctx[0].multiplyA + "")) set_data_dev(t28, t28_value);
    			if (dirty & /*calculator*/ 1 && t30_value !== (t30_value = /*calculator*/ ctx[0].multiplyB + "")) set_data_dev(t30, t30_value);
    			if (dirty & /*multiplication*/ 2) set_data_dev(t32, /*multiplication*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div4);
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
    	let addition;
    	let subtraction;
    	let division;
    	let multiplication;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Calculator', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Calculator> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		calculator.addA = to_number(this.value);
    		$$invalidate(0, calculator);
    	}

    	function input1_input_handler() {
    		calculator.addB = to_number(this.value);
    		$$invalidate(0, calculator);
    	}

    	function input2_input_handler() {
    		calculator.subtractA = to_number(this.value);
    		$$invalidate(0, calculator);
    	}

    	function input3_input_handler() {
    		calculator.subtractB = to_number(this.value);
    		$$invalidate(0, calculator);
    	}

    	function input4_input_handler() {
    		calculator.divideA = to_number(this.value);
    		$$invalidate(0, calculator);
    	}

    	function input5_input_handler() {
    		calculator.divideB = to_number(this.value);
    		$$invalidate(0, calculator);
    	}

    	function input6_input_handler() {
    		calculator.multiplyA = to_number(this.value);
    		$$invalidate(0, calculator);
    	}

    	function input7_input_handler() {
    		calculator.multiplyB = to_number(this.value);
    		$$invalidate(0, calculator);
    	}

    	$$self.$capture_state = () => ({
    		calculator,
    		multiplication,
    		division,
    		subtraction,
    		addition
    	});

    	$$self.$inject_state = $$props => {
    		if ('multiplication' in $$props) $$invalidate(1, multiplication = $$props.multiplication);
    		if ('division' in $$props) $$invalidate(2, division = $$props.division);
    		if ('subtraction' in $$props) $$invalidate(3, subtraction = $$props.subtraction);
    		if ('addition' in $$props) $$invalidate(4, addition = $$props.addition);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*calculator*/ 1) {
    			$$invalidate(4, addition = calculator.add(calculator.addA, calculator.addB));
    		}

    		if ($$self.$$.dirty & /*calculator*/ 1) {
    			$$invalidate(3, subtraction = calculator.subtract(calculator.subtractA, calculator.subtractB));
    		}

    		if ($$self.$$.dirty & /*calculator*/ 1) {
    			$$invalidate(2, division = calculator.divide(calculator.divideA, calculator.divideB));
    		}

    		if ($$self.$$.dirty & /*calculator*/ 1) {
    			$$invalidate(1, multiplication = calculator.multiply(calculator.multiplyA, calculator.multiplyB));
    		}
    	};

    	return [
    		calculator,
    		multiplication,
    		division,
    		subtraction,
    		addition,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input7_input_handler
    	];
    }

    class Calculator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Calculator",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\Caesar.svelte generated by Svelte v3.47.0 */
    const file$2 = "src\\components\\Caesar.svelte";

    function create_fragment$2(ctx) {
    	let h3;
    	let t1;
    	let div2;
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
    	let p;
    	let t8;
    	let t9;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Caesar Cipher Encyrption";
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Clave para cambiar el cifrado:";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Cadena para cifrar:";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			p = element("p");
    			t8 = text("Salidas: ");
    			t9 = text(/*caesarCiphered*/ ctx[2]);
    			add_location(h3, file$2, 7, 0, 218);
    			attr_dev(label0, "for", "key");
    			add_location(label0, file$2, 10, 8, 291);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "name", "key");
    			add_location(input0, file$2, 11, 8, 357);
    			add_location(div0, file$2, 9, 4, 276);
    			attr_dev(label1, "for", "messageToEncrypt");
    			add_location(label1, file$2, 14, 8, 445);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "name", "messageToEncrypt");
    			add_location(input1, file$2, 15, 8, 513);
    			add_location(div1, file$2, 13, 4, 430);
    			add_location(p, file$2, 17, 4, 601);
    			attr_dev(div2, "id", "caesar");
    			attr_dev(div2, "class", "svelte-14gkcax");
    			add_location(div2, file$2, 8, 0, 253);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, /*caesarKey*/ ctx[1]);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t6);
    			append_dev(div1, input1);
    			set_input_value(input1, /*caesarMessage*/ ctx[0]);
    			append_dev(div2, t7);
    			append_dev(div2, p);
    			append_dev(p, t8);
    			append_dev(p, t9);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*caesarKey*/ 2 && to_number(input0.value) !== /*caesarKey*/ ctx[1]) {
    				set_input_value(input0, /*caesarKey*/ ctx[1]);
    			}

    			if (dirty & /*caesarMessage*/ 1 && input1.value !== /*caesarMessage*/ ctx[0]) {
    				set_input_value(input1, /*caesarMessage*/ ctx[0]);
    			}

    			if (dirty & /*caesarCiphered*/ 4) set_data_dev(t9, /*caesarCiphered*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
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
    	let caesarCiphered;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Caesar', slots, []);
    	let caesarMessage = '¡Me encanta programar! un poco...';
    	let caesarKey = 13;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Caesar> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		caesarKey = to_number(this.value);
    		$$invalidate(1, caesarKey);
    	}

    	function input1_input_handler() {
    		caesarMessage = this.value;
    		$$invalidate(0, caesarMessage);
    	}

    	$$self.$capture_state = () => ({
    		caesar,
    		caesarMessage,
    		caesarKey,
    		caesarCiphered
    	});

    	$$self.$inject_state = $$props => {
    		if ('caesarMessage' in $$props) $$invalidate(0, caesarMessage = $$props.caesarMessage);
    		if ('caesarKey' in $$props) $$invalidate(1, caesarKey = $$props.caesarKey);
    		if ('caesarCiphered' in $$props) $$invalidate(2, caesarCiphered = $$props.caesarCiphered);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*caesarMessage, caesarKey*/ 3) {
    			$$invalidate(2, caesarCiphered = caesar(caesarMessage, caesarKey));
    		}
    	};

    	return [
    		caesarMessage,
    		caesarKey,
    		caesarCiphered,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Caesar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Caesar",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\Analyze.svelte generated by Svelte v3.47.0 */
    const file$1 = "src\\components\\Analyze.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[7] = list;
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (22:12) {#each arrayToAnalyze as i}
    function create_each_block(ctx) {
    	let div;
    	let input;
    	let t;
    	let mounted;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[5].call(input, /*each_value*/ ctx[7], /*i_index*/ ctx[8]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t = space();
    			attr_dev(input, "type", "number");
    			attr_dev(input, "class", "svelte-1otfukn");
    			add_location(input, file$1, 23, 20, 852);
    			add_location(div, file$1, 22, 16, 825);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*i*/ ctx[6]);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", input_input_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*arrayToAnalyze*/ 1 && to_number(input.value) !== /*i*/ ctx[6]) {
    				set_input_value(input, /*i*/ ctx[6]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(22:12) {#each arrayToAnalyze as i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let h3;
    	let t1;
    	let p;
    	let t3;
    	let div3;
    	let div0;
    	let button0;
    	let t5;
    	let button1;
    	let t7;
    	let div1;
    	let t8;
    	let div2;
    	let pre;
    	let t9;
    	let code;
    	let t10;
    	let t11_value = /*analyzedObject*/ ctx[1].average + "";
    	let t11;
    	let t12;
    	let t13_value = /*analyzedObject*/ ctx[1].min + "";
    	let t13;
    	let t14;
    	let t15_value = /*analyzedObject*/ ctx[1].max + "";
    	let t15;
    	let t16;
    	let t17_value = /*analyzedObject*/ ctx[1].length + "";
    	let t17;
    	let t18;
    	let t19;
    	let mounted;
    	let dispose;
    	let each_value = /*arrayToAnalyze*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Array Analysis";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Cada entrada de número se agregará a una matriz para ser analizada y los resultados se devolverán a un objeto";
    			t3 = space();
    			div3 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Add a number";
    			t5 = space();
    			button1 = element("button");
    			button1.textContent = "Remove a number";
    			t7 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			div2 = element("div");
    			pre = element("pre");
    			t9 = text("\r\n            ");
    			code = element("code");
    			t10 = text("\r\n                let returnedObject = { \r\n                    average: ");
    			t11 = text(t11_value);
    			t12 = text(",\r\n                    min: ");
    			t13 = text(t13_value);
    			t14 = text(",\r\n                    max: ");
    			t15 = text(t15_value);
    			t16 = text(",\r\n                    length: ");
    			t17 = text(t17_value);
    			t18 = text("\r\n                };\r\n            ");
    			t19 = text("\r\n        ");
    			add_location(h3, file$1, 13, 0, 420);
    			add_location(p, file$1, 14, 0, 445);
    			attr_dev(button0, "class", "svelte-1otfukn");
    			add_location(button0, file$1, 17, 8, 615);
    			attr_dev(button1, "class", "svelte-1otfukn");
    			add_location(button1, file$1, 18, 8, 675);
    			attr_dev(div0, "id", "buttons");
    			attr_dev(div0, "class", "svelte-1otfukn");
    			add_location(div0, file$1, 16, 4, 587);
    			attr_dev(div1, "id", "inputs");
    			attr_dev(div1, "class", "svelte-1otfukn");
    			add_location(div1, file$1, 20, 4, 749);
    			attr_dev(code, "class", "svelte-1otfukn");
    			add_location(code, file$1, 29, 12, 995);
    			attr_dev(pre, "class", "svelte-1otfukn");
    			add_location(pre, file$1, 28, 8, 976);
    			attr_dev(div2, "id", "code");
    			attr_dev(div2, "class", "svelte-1otfukn");
    			add_location(div2, file$1, 27, 4, 951);
    			attr_dev(div3, "id", "analyze");
    			attr_dev(div3, "class", "svelte-1otfukn");
    			add_location(div3, file$1, 15, 0, 563);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t5);
    			append_dev(div0, button1);
    			append_dev(div3, t7);
    			append_dev(div3, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div3, t8);
    			append_dev(div3, div2);
    			append_dev(div2, pre);
    			append_dev(pre, t9);
    			append_dev(pre, code);
    			append_dev(code, t10);
    			append_dev(code, t11);
    			append_dev(code, t12);
    			append_dev(code, t13);
    			append_dev(code, t14);
    			append_dev(code, t15);
    			append_dev(code, t16);
    			append_dev(code, t17);
    			append_dev(code, t18);
    			append_dev(pre, t19);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*handleAdd*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*handleRemove*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*arrayToAnalyze*/ 1) {
    				each_value = /*arrayToAnalyze*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*analyzedObject*/ 2 && t11_value !== (t11_value = /*analyzedObject*/ ctx[1].average + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*analyzedObject*/ 2 && t13_value !== (t13_value = /*analyzedObject*/ ctx[1].min + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*analyzedObject*/ 2 && t15_value !== (t15_value = /*analyzedObject*/ ctx[1].max + "")) set_data_dev(t15, t15_value);
    			if (dirty & /*analyzedObject*/ 2 && t17_value !== (t17_value = /*analyzedObject*/ ctx[1].length + "")) set_data_dev(t17, t17_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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
    	let newArray;
    	let analyzedObject;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Analyze', slots, []);
    	let arrayToAnalyze = [1, 8, 3, 4, 2, 6];

    	function handleAdd() {
    		$$invalidate(0, arrayToAnalyze = [...arrayToAnalyze, 1]);
    	}

    	function handleRemove() {
    		arrayToAnalyze.splice(-1, 1);
    		$$invalidate(0, arrayToAnalyze = [...arrayToAnalyze]);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Analyze> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler(each_value, i_index) {
    		each_value[i_index] = to_number(this.value);
    		$$invalidate(0, arrayToAnalyze);
    	}

    	$$self.$capture_state = () => ({
    		analyzeArray,
    		arrayToAnalyze,
    		handleAdd,
    		handleRemove,
    		newArray,
    		analyzedObject
    	});

    	$$self.$inject_state = $$props => {
    		if ('arrayToAnalyze' in $$props) $$invalidate(0, arrayToAnalyze = $$props.arrayToAnalyze);
    		if ('newArray' in $$props) $$invalidate(4, newArray = $$props.newArray);
    		if ('analyzedObject' in $$props) $$invalidate(1, analyzedObject = $$props.analyzedObject);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*arrayToAnalyze*/ 1) {
    			$$invalidate(4, newArray = [...arrayToAnalyze]);
    		}

    		if ($$self.$$.dirty & /*newArray*/ 16) {
    			$$invalidate(1, analyzedObject = analyzeArray(newArray));
    		}
    	};

    	return [
    		arrayToAnalyze,
    		analyzedObject,
    		handleAdd,
    		handleRemove,
    		newArray,
    		input_input_handler
    	];
    }

    class Analyze extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Analyze",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.47.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let h3;
    	let t3;
    	let cappedstring;
    	let t4;
    	let reversed;
    	let t5;
    	let calculator;
    	let t6;
    	let caesar;
    	let t7;
    	let analyze;
    	let current;
    	cappedstring = new CappedString({ $$inline: true });
    	reversed = new Reversed({ $$inline: true });
    	calculator = new Calculator({ $$inline: true });
    	caesar = new Caesar({ $$inline: true });
    	analyze = new Analyze({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Jest Svelte Testing";
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = "String manipulation";
    			t3 = space();
    			create_component(cappedstring.$$.fragment);
    			t4 = space();
    			create_component(reversed.$$.fragment);
    			t5 = space();
    			create_component(calculator.$$.fragment);
    			t6 = space();
    			create_component(caesar.$$.fragment);
    			t7 = space();
    			create_component(analyze.$$.fragment);
    			add_location(h1, file, 9, 1, 304);
    			add_location(h3, file, 10, 1, 334);
    			add_location(main, file, 8, 0, 296);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h3);
    			append_dev(main, t3);
    			mount_component(cappedstring, main, null);
    			append_dev(main, t4);
    			mount_component(reversed, main, null);
    			append_dev(main, t5);
    			mount_component(calculator, main, null);
    			append_dev(main, t6);
    			mount_component(caesar, main, null);
    			append_dev(main, t7);
    			mount_component(analyze, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cappedstring.$$.fragment, local);
    			transition_in(reversed.$$.fragment, local);
    			transition_in(calculator.$$.fragment, local);
    			transition_in(caesar.$$.fragment, local);
    			transition_in(analyze.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cappedstring.$$.fragment, local);
    			transition_out(reversed.$$.fragment, local);
    			transition_out(calculator.$$.fragment, local);
    			transition_out(caesar.$$.fragment, local);
    			transition_out(analyze.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(cappedstring);
    			destroy_component(reversed);
    			destroy_component(calculator);
    			destroy_component(caesar);
    			destroy_component(analyze);
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
    		CappedString,
    		Reversed,
    		Calculator,
    		Caesar,
    		Analyze
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
