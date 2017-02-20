'use strict';

// Dependencies
const Events = require('events');
const Button = require('./lib/button');

function Canvas (vis, config) {
    let self = new Events();
    self.network = vis.network;
    self.config = config

    // methods
    self.toggle = toggle;

    let canvas = self.network.canvas.frame.canvas;
    let buttonsConfig = self.config.buttons;

    // draw buttons
    self.network.on('afterDrawing', (ctx) => {

        if (!self.contextMenu || !self.config.nodes.types[self.contextMenu.type]) {
            return;
        }

        if (!self.config.nodes.types[self.contextMenu.type].buttons) {
            return;
        }

        // get node
        const node = self.contextMenu;
        const nodeId = node.id;

        // compute the button positions
        let boundingBox = self.network.getBoundingBox([nodeId]);
        if (!boundingBox) {
            return;
        }
        let menuY = boundingBox.bottom + 10;
        let menuX = self.network.getPositions([nodeId])[nodeId].x;
        let buttonsWidth = 0;

        // create the necessary buttons and place them
        if (!self.buttons) {

            let buttonsToAdd = [];
            let posibleButtons = self.config.nodes.types[node.type].buttons;
            posibleButtons.forEach(item => {
                if (!item.type) {
                    return;
                }

                let buttonConfig = buttonsConfig[item.type];

                if (!buttonConfig) {
                    return;
                }

                let button = new Button(ctx, item.label, {
                    color: self.config.colors[buttonConfig.color]
                });

                // append graph info to the button
                button.node = node;
                button.emit = buttonConfig.emit;
                button.type = node.type;

                // append generic button data
                if (item.data) {
                    button.data = item.data;
                }

                buttonsWidth += buttonsWidth === 0 ? button.width : button.width + 10;
                buttonsToAdd.push(button);
            });

            self.buttons = buttonsToAdd;
        } else {
            self.buttons.forEach(button => {
                buttonsWidth += buttonsWidth === 0 ? button.width : button.width + 10;
            });
        }

        // start placing the buttons
        let currentX = menuX - buttonsWidth / 2;
        self.buttons.forEach(button => {
            button.draw(currentX, menuY);
            currentX += button.width + 10;
        });

        ctx.save();
    });

    // button mouseover and mouseaway selfs
    let canvasOffset = canvas.getBoundingClientRect();
    canvas.addEventListener('mousemove', event => {

        if (!self.buttons) {
            return;
        }

        let mouse = self.network.DOMtoCanvas({
            x: event.clientX - canvasOffset.left,
            y: event.clientY - canvasOffset.top
        });

        self.buttons.forEach(button => {
            if (mouse.x >= button.x && mouse.x <= button.x + button.width && mouse.y >= button.y && mouse.y <= button.y + button.height) {
                button.mouseOver();
            } else {
                button.mouseAway();
            }
        });
    }, false);

    // listen for click events on the buttons
    self.network.on('click', event => {

        if (!self.buttons) {
            return;
        }

        let chunk;
        let mouse = {
            x: event.pointer.canvas.x,
            y: event.pointer.canvas.y
        };

        self.buttons.forEach(button => {
            if (mouse.x >= button.x && mouse.x <= button.x + button.width && mouse.y >= button.y && mouse.y <= button.y + button.height) {
                button.mouseDown();
                chunk = {node: button.node, type: button.type};
                if (button.data) {
                    chunk.data =button.data;
                }

                console.log('click', chunk);
            }
        });
    });

    return self;
};

function toggle (node) {

    if (!node || !this.config.nodes.types[node.type]) {
        return;
    }

    // hide context menu
    if (
        (!this.config.nodes.types[node.type].buttons || !this.config.nodes.types[node.type].buttons.length) ||
        (this.contextMenu && node.id === this.contextMenu.id)
    ) {
        this.contextMenu = undefined;
        self.buttons = undefined;

    // show context menu
    } else {
        this.contextMenu = node;
    }
}

exports.init = (scope, state, args, data, next) => {

    if (state.VIS && state.VIS.visualization) {
        state.canvas = Canvas(state.VIS.visualization, state.VIS.options.config);
    }

    return next(null, data);
};

exports.context = function (scope, state, args, data, next) {

    if (!data.node) {
        //return next(new Error('Flow-visualizer.context: No node provided.'));
        return next(null, data);
    }

    if (!state.canvas) {
        return next(null, data);
    }

    state.canvas.toggle(data.node);

    next(null, data);
};