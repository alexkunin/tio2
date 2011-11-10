var TiO2 = (function (global) {
	function merge() {
		var result = {};
		
		for (var i = 0; i < arguments.length; i++) {
			if (arguments[i]) {
				for (var prop in arguments[i]) {
					if (arguments[i].hasOwnProperty(prop)) {
						result[prop] = arguments[i][prop];
					}
				}
			}
		}
		
		return result;
	}

	function mixin(object) {
		if (object) {
			for (var i = 1; i < arguments.length; i++) {
				if (arguments[i]) {
					for (var prop in arguments[i]) {
						if (arguments[i].hasOwnProperty(prop)) {
							object[prop] = arguments[i][prop];
						}
					}
				}
			}
		}
		
		return object;
	}

	function extend(baseConstructor, newPrototype) {
		var tmp = function () {};
		tmp.prototype = baseConstructor.prototype;
		var constructor = newPrototype.hasOwnProperty('constructor') ? newPrototype.constructor : function () { baseConstructor.apply(this, arguments); };
		constructor.prototype = new tmp();
		constructor.prototype.constructor = constructor;
		constructor.baseConstructor = baseConstructor;
		constructor.extend = function (newPrototype) { return extend(this, newPrototype); };
		mixin(constructor.prototype, newPrototype)
		return constructor;
	}

	var contexts = [];

	function wrap(constructor, defaultOptions) {
		var factory = function (extendedOptions) {
			var options = merge(defaultOptions, extendedOptions),
				items = [],
				listeners = {},
				instance,
				context = contexts.length && contexts[contexts.length - 1],
				refAs = null;

			if (options.hasOwnProperty('items')) {
				items = options.items;
				delete options.items;
			}

			if (options.hasOwnProperty('items')) {
				items = options.items;
				delete options.items;
			}

			if (options.hasOwnProperty('listeners')) {
				listeners = options.listeners;
				delete options.listeners;
			}

			if (options.hasOwnProperty('refAs')) {
				refAs = options.refAs;
				delete options.refAs;
			}

			instance = constructor(options);
			
			for (var i = 0; i < items.length; i++) {
				instance.add(items[i]); 
			}
			
			for (var i in listeners) {
				if (listeners.hasOwnProperty(i)) {
					instance.addEventListener(i, context && context.wrapListener ? context.wrapListener(listeners[i]) : listeners[i]);
				}
			}

			if (context && context.registerReference) {
				context.registerReference(refAs, instance);
			}
			
			return instance;
		};
		
		factory.extend = function (extendedOptions) {
			return wrap(constructor, merge(defaultOptions, extendedOptions));
		};
		
		return factory;
	}

	(function () {
		var defaults = {
			'2DMatrix':{},
			'3DMatrix':{},
			'ActivityIndicator':{},
			'AlertDialog':{},
			'Animation':{},
			'Button':{},
			'ButtonBar':{},
			'CoverFlowView':{},
			'DashboardItem':{},
			'DashboardView':{},
			'EmailDialog':{},
			'ImageView':{},
			'Label':{},
			'OptionDialog':{},
			'Picker':{},
			'PickerColumn':{},
			'PickerRow':{},
			'ProgressBar':{},
			'ScrollView':{},
			'ScrollableView':{},
			'SearchBar':{},
			'Slider':{},
			'Switch':{},
			'Tab':{},
			'TabGroup':{},
			'TabbedBar':{},
			'TableView':{},
			'TableViewRow':{},
			'TableViewSection':{},
			'TextArea':{},
			'TextField':{},
			'Toolbar':{},
			'View':{},
			'WebView':{},
			'Window':{}
		};
		
		for (var i in defaults) {
			if (defaults.hasOwnProperty(i)) {
				this[i] = wrap(Ti.UI['create' + i], defaults[i]);
			}
		}
	}());

	var signalMarker = {};

	function signal(context, setUp, tearDown) {
		var connections = mixin([], {
			find:function (object, method) {
				for (var i = 0; i < this.length; i++) {
					if (this[i].object === object && this[i].method === method) {
						return i;
					}
				}

				return -1;
			},
			add:function (object, method) {
				if (this.find(object, method) !== -1) {
					throw new Exception('Duplicate object/method pair.');
				}

				if (setUp && !this.length) {
					setUp();
				}

				this.push({ object:object, method:method });
			},
			notify:function () {
				for (var i = 0; i < this.length; i++) {
					this[i].method.apply(this[i].object, arguments);
				}
			},
			remove:function (object, method) {
				var index = this.find(object, method);

				if (index === -1) {
					throw new Exception('Object/method pair is not found.');
				}

				this.splice(index, 1);

				if (tearDown && !this.length) {
					tearDown();
				}
			}
		});

		return mixin(
			function () {
				if (typeof arguments[0] === 'function' || typeof arguments[1] === 'function') {
					arguments.callee.connect.apply(this, arguments)
				} else {
					connections.notify(arguments[0]);
				}
			},
			{
				$signalMarker:signalMarker,

				getName:function () {
					for (var i in context) {
						if (context[i] === this) {
							return i;
						}
					}

					return 'unknown';
				},
				toString:function () {
					return context.toString() + '.' + this.getName();
				},
				getContext:function () {
					return context;
				},
				connect:function () {
					switch (arguments.length) {
					case 1:
						connections.add(context, arguments[0]);
						break;

					case 2:
						connections.add(arguments[0], arguments[1]);
						break;
					}
				},
				disconnect:function () {
					switch (arguments.length) {
					case 1:
						connections.remove(context, arguments[0]);
						break;

					case 2:
						connections.remove(arguments[0], arguments[1]);
						break;
					}
				}
			}
		);
	};

	function isSignal(ref) {
		return ref && ref.$signalMarker === signalMarker;
	}

	var Base = extend(Object, {
		isA:function (constructor) {
			var p = this.constructor;

			do {
				if (p === constructor) {
					return true;
				}

				p = p.baseConstructor;
			} while (p);

			return false;
		}
	});

	function isA(object, constructor) {
		return object ? (object.isA ? object.isA(constructor) : object.constructor === constructor) : false;
	}

	var Component = Base.extend({
		signals:[],

		constructor:function (options) {
			var p = this, created = {};

			while (p !== Component.prototype) {
				for (var i = 0; i < p.signals.length; i++) {
					if (!created[p.signals[i]]) {
						created[p.signals[i]] = true;
						this[p.signals[i]] = signal(this);
					}
				}

				p = p.constructor.baseConstructor.prototype;
			}

			for (var i in options) {
				if (options.hasOwnProperty(i) && isSignal(this[i])) {
					this[i].connect(options[i]);
				}
			}
		},

		handle:function (handler) {
			var self = this;
			return function (data) {
				handler.call(self, data, this);
			};
		}
	});

	var Widget = Component.extend({
		constructor:function (options) {
			var self = this;
			Component.call(this, options);
			this.rootView = this.forceContext(this, this.createRootView, []);
		},

		forceContext:function (object, method, args) {
			var self = this;

			contexts.push({
				wrapListener:function (handler) {
					return function (data) {
						handler.call(self, data, this);
					};
				},

				registerReference:function (name, ref) {
					self[name] = ref;
				}
			});

			var result = method.apply(object, args)

			contexts.pop();

			return result;
		},

		createRootView:function () {
			return View({});
		}
	});

	var Associations = Base.extend({
		list:null,

		constructor:function () {
			Base.call(this);
			this.list = [];
		},

		add:function (first, second) {
			this.list.push([ first, second ]);
		},

		getFirst:function (second) {
			for (var i = 0; i < this.list.length; i++) {
				if (this.list[i][1] === second) {
					return this.list[i][0];
				}
			}

			return null;
		},

		getSecond:function (first) {
			for (var i = 0; i < this.list.length; i++) {
				if (this.list[i][0] === first) {
					return this.list[i][1];
				}
			}

			return null;
		}
	});

	var Navigator = Component.extend({
		windowToTab:null,
		tabToTabGroup:null,
		windowToStacked:null,
		currentTabGroup:null,

		constructor:function (options) {
			this.windowToTab = new Associations();
			this.tabToTabGroup = new Associations();
			this.windowToStacked = new Associations();
			Component.call(this, options);

			function parse(item, tabGroup) {
				if (item.tabs) {
					if (!tabGroup) {
						tabGroup = TabGroup({});
					}

					for (var i = 0; i < item.tabs.length; i++) {
						if (item.tabs[i].stack) {
							for (var j = 0; j < item.tabs[i].stack.length; j++) {
								var tab;

								(function (item, tabGroup) {
									var nativeWindow = isA(item.window, Widget)
														? item.window.rootView
														: item.window;

									if (!tab) {
										tab = Tab(
											merge(
												item,
												{
													window:nativeWindow
												}
											)
										);

										tabGroup.addTab(tab);
										this.tabToTabGroup.add(tab, tabGroup);
									} else {
										this.windowToStacked.add(item.window, true);
									}

									this.windowToTab.add(item.window, tab);

									this.applyOptions(nativeWindow, item);
								}.call(this, item.tabs[i].stack[j], tabGroup));
							}
						} else if (item.tabs[i].tabs) {
							var newTabGroup = TabGroup({});
							var options = merge(
								item.tabs[i],
								{
									window:Window({ title:'<Hidden Window>' })
								}
							);
							delete options.tabs;
							var tab = Tab(
								options
							);
							tabGroup.addTab(tab);
							tabGroup.addEventListener('focus', this.handle(function (e) {
								if (e.tab === tab) {
									tabGroup.setActiveTab(e.previousTab);
									tabGroup.close();
									this.currentTabGroup = newTabGroup;
									newTabGroup.open();
								}
							}));
							this.tabToTabGroup.add(tab, tabGroup);
							parse.call(this, item.tabs[i], newTabGroup);
						} else {
							(function (item) {
								var nativeWindow = isA(item.window, Widget)
													? item.window.rootView
													: item.window;

								var tab = Tab(
									merge(
										item,
										{
											window:nativeWindow
										}
									)
								);
								tabGroup.addTab(tab);
								this.windowToTab.add(item.window, tab);
								this.tabToTabGroup.add(tab, tabGroup);

								this.applyOptions(nativeWindow, item);
							}.call(this, item.tabs[i], tabGroup));
						}
					}
				}
			}

			parse.call(this, options.structure);
		},

		applyOptions:function (window, options) {
			if (window && options) {
				var nativeWindow = isA(window, Widget)
									? window.rootView
									: window;

				for (var i in options) {
					if (options.hasOwnProperty(i)) {
						nativeWindow[i] = options[i];
					}
				}
			}
		},

		open:function (window, options) {
			var tab = this.windowToTab.getSecond(window);
			if (tab) {
				var tabGroup = this.tabToTabGroup.getSecond(tab);
				if (tabGroup) {
					if (tabGroup !== this.currentTabGroup) {
						if (this.currentTabGroup) {
							this.currentTabGroup.close();
							this.currentTabGroup = tabGroup;
						}
						tabGroup.open();
					}
					tabGroup.setActiveTab(tab);
					if (this.windowToStacked.getSecond(window)) {
						tab.open(isA(window, Widget)
										? window.rootView
										: window, { animated:true });
					}
				}
				this.applyOptions(window, options);
			}
		},

		openLevel:function (window, options) {
			var tab = this.windowToTab.getSecond(window);
			if (tab) {
				var tabGroup = this.tabToTabGroup.getSecond(tab);
				if (tabGroup) {
					if (tabGroup !== this.currentTabGroup) {
						if (this.currentTabGroup) {
							this.currentTabGroup.close();
							this.currentTabGroup = tabGroup;
						}
						tabGroup.open();
					}
				}
				this.applyOptions(window, options);
			}
		}
	});

	var Application = Component.extend({
		constructor:function (options) {
			Component.call(this, options);
			this.windows = {};
		},

		run:function () {
		}
	});

	return {
		merge:merge,
		mixin:mixin,
		extend:extend,
		signal:signal,
		isSignal:isSignal,
		Base:Base,
		isA:isA,
		Component:Component,
		Widget:Widget,
		Navigator:Navigator,
		Application:Application
	};
}(this));