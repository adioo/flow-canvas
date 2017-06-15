'use strict';

// Dependencies
const Render = require('./lib/Render');
const Events = require('./lib/Events');

module.exports = (network, config) => {
    let self = {};
    self.network = network;
    self.config = config;

    if (!config.contexts) {
        return;
    }
    self.contexts = config.contexts;
    self.menu = null;

    // init modules
    Render.call(self);
    Events.call(self);

    // export methods
    self.toggle = toggle;

    return self;
};

function toggle (data, args) {
    args = args || [];

    if (!args.context || !this.contexts[args.context]) {
        return;
    }

    let context = this.contexts[args.context];

    if (!this.menu) {
        this.menu = createMenu(data.event, context);
    } else {
        let newMenu = createMenu(data.event, context);

        if (this.menu.type !== newMenu.type || (newMenu.type === 'node' && this.menu.node !== newMenu.node)) {
            this.menu = newMenu;
        } else {
            this.menu = null;
        }
    }

    // force canvas redraw
    this.network.redraw();
}

/* private functions */
function createMenu (event, context) {

    let menu = {
        type: context.type,
        buttons: context.buttons || []
    };

    if (context.type === 'node') {
        menu.node = event.nodes[0];
    } else {
        menu.center = event.pointer.canvas;
    }

    return menu;
}