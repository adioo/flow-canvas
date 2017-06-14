'use strict';

module.exports = (network, config) => {
    let self = {};
    self.network = network;
    self.config = config;
    self.config.colors = self.config.colors || {}

    if (!config.contexts) {
        return;
    }
    self.contexts = config.contexts;
    self.menu = null;

    // export methods
    self.toggle = toggle;
    self.show = show;
    self.hide = hide;

    // change cursor when hovering buttons
    self.network.on('hoverNode', e => {
        let node = self.network.body.data.nodes.get(e.node);

        if (node.type === 'button') {
            self.network.canvas.body.container.style.cursor = 'pointer';
            self.network.body.data.nodes.update({id: e.node, font: { bold: true }});
        }
    });

    self.network.on('blurNode', e => {
        let node = self.network.body.data.nodes.get(e.node);

        if (node.type === 'button') {
            self.network.canvas.body.container.style.cursor = 'default';
            self.network.body.data.nodes.update({id: e.node, font: { bold: false }});
        }
    });

    // listen for click events
    self.network.on('click', e => {
        if (!e.nodes || !e.nodes.length) {
            return;
        }

        let node = self.network.body.data.nodes.get(e.nodes[0]);
        if (!node.type || node.type !== 'button' || !node.event) {
            return;
        }

        console.log(node.event);

        self.network.unselectAll();
    });

    return self;
}

function toggle (data, args) {
    args = args || {};

    if (!args.context || !this.contexts[args.context] || !data.event) {
        return;
    }

    let context = this.contexts[args.context];
    if (!context.buttons || !context.buttons.length) {
        return;
    }

    if (this.menu) {
        // if a menu already exists close it or create another one
        if (context.type !== this.menu.context.type || (context.type === 'node' && this.menu.nodeId !== data.event.nodes[0])) {
            this.hide(data.event, context);
            this.show(data.event, context);
        } else {
            this.hide(data.event, context);
        }
    } else {
        this.show(data.event, context);
    }
}

// show context menu
function show (event, context) {

    if (this.menu) {
        return;
    }

    // init menu
    let center;
    if (context.type === 'point') {
        center = {
            x: event.pointer.canvas.x,
            y: event.pointer.canvas.y
        };
    } else if (context.type === 'node') {
        let pos = this.network.getPositions(event.nodes[0]);
        center = pos[event.nodes[0]];
    }

    // create the menu
    let menu = {
        context: context,
        center: center,
        buttons: createButtons.call(this, center, {
            buttons: context.buttons,
            minRadius: 100,
            buttonRadius: 15,
            buttonDistance: 45
        })
    };

    // freeze the node if it is the center
    if (context.type === 'node') {
        this.network.body.data.nodes.update({id: event.nodes[0], fixed: true});
        menu.nodeId = event.nodes[0]

        // create some edges
        menu.edges = [];
        menu.buttons.forEach(btn => {

            let edge = {
                id: 'edge_' + generateButtonId(),
                from: event.nodes[0],
                to: btn.id,
                fixed: true,
                physics: false,
                arrows: {
                    to: false
                },
                width: 0.1,
                hoverWidth: 0.1,
                selectionWidth: 0.1,
                color: {
                    color: '#D4DFF4',
                    highlight: '#D4DFF4',
                    hover: '#D4DFF4'
                }
            };
            menu.edges.push(edge);
        });
    } else {
        // add a node at the center
        menu.centerNode = {
            id: 'center_' + generateButtonId(),
            fixed: true,
            physics: false,
            size: 1,
            x: center.x,
            y: center.y
        };

        // create some edges
        menu.edges = [];
        menu.buttons.forEach(btn => {

            let edge = {
                id: 'edge_' + generateButtonId(),
                from: menu.centerNode.id,
                to: btn.id,
                fixed: true,
                physics: false,
                arrows: {
                    to: false
                },
                width: 0.1,
                hoverWidth: 0.1,
                selectionWidth: 0.1,
                color: {
                    color: '#D4DFF4',
                    highlight: '#D4DFF4',
                    hover: '#D4DFF4'
                }
            };
            menu.edges.push(edge);
        });

    }

    // add buttons to canvas
    this.menu = menu;
    this.network.body.data.nodes.add(menu.buttons);
    if (menu.centerNode) {
        this.network.body.data.nodes.add([menu.centerNode]);
    }
    if (menu.edges) {
        this.network.body.data.edges.add(menu.edges);
    }

}

// hide context menu
function hide (event, context) {

    if (!this.menu) {
        return;
    }

    // remove the buttons from the graph
    this.network.body.data.nodes.remove(this.menu.buttons);

    if (this.menu.edges) {
        this.network.body.data.edges.remove(this.menu.edges);
    }

    if (this.menu.centerNode) {
        this.network.body.data.nodes.remove([this.menu.centerNode]);
    }

    // unfreeze the center node
    if (this.menu.context.type === 'node') {
        this.network.body.data.nodes.update({id: this.menu.nodeId, fixed: false});
    }

    this.menu = null;
}

/* Private functions */

function createButtons (center, config) {
    config = config || {};
    config.buttons = config.buttons || 0;
    config.minRadius = config.minRadius || 90;
    config.buttonRadius = config.buttonRadius || 20;
    config.buttonDistance = config.buttonDistance || 30;

    // step 1. Compute the radius of the button circle
    let potentialCircumference = config.buttons.length * (2 * config.buttonRadius + config.buttonDistance);
    let potentialRadius = potentialCircumference / (Math.PI * 2);

    let radius = (config.minRadius > potentialRadius) ? config.minRadius : potentialRadius;

    // step 2. Compute the angle that contains a single button
    let a = config.buttonRadius + config.buttonDistance / 2;
    let b = radius;
    let c = radius;
    let cosA = (b * b + c * c - a * a) / (2 * b * c);
    let angle = Math.acos(cosA) * 2;

    // step 3. compute positions of buttons
    let cAngle = -1.5;
    let buttons = [];
    config.buttons.forEach(btnConfig => {

        let button = {
            id: 'button_' + generateButtonId(),
            type: 'button',
            x: radius * Math.cos(cAngle) + center.x,
            y: radius * Math.sin(cAngle) + center.y,
            physics: false,
            fixed: true,
            size: config.buttonRadius,
            label: btnConfig.label,
            font: btnConfig.font,
            event: btnConfig.event
        };

        // add colors
        if (typeof btnConfig.color === 'string') {
            button.color = this.config.colors[btnConfig.color];
        }

        // add icons

        buttons.push(button);
        cAngle += angle;
    });

    return buttons;
}

function generateButtonId () {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 10; i++ ) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}