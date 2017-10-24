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

    // export methods
    self.open = open;
    self.close = close;
    self.events = Events;

    return self;
};

function open (event, context) {

    if (!context || !this.contexts[context]) {
        return;
    }

    context = this.contexts[context];

    if (!this.menu) {
        this.menu = createMenu(event, context);

        // force canvas redraw
        this.network.redraw();
    } else {
        return;
    }
}

function close () {

    if (this.menu) {
        this.menu = null;

        // force canvas redraw
        this.network.redraw();
    }
}

/* private functions */
function createMenu (event, context) {

    let menu = {
        type: context.type,
        buttons: context.buttons || []
    };

    if (context.type === 'node') {
        menu.node = event.nodes[0];
    } else if (context.type === 'edge') {
        menu.edge = event.edges[0];
    } else {
        menu.center = event.pointer.canvas;
    }

    return menu;
}