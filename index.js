'use strict';

// Dependencies
const Button = require('./lib/button');

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

    // get canvas context
    self.network.on('afterDrawing', (ctx) => {

        if (self.menu) {
            if (self.menu.context.type === 'point') {
                ctx.beginPath();
                ctx.arc(self.menu.center.x, self.menu.center.y, 2, 0 , 2 * Math.PI);
                ctx.fillStyle = '#000000';
                ctx.fill();
            }

            self.menu.buttons.forEach(btn => {
                btn.draw(ctx);
            });
        }
        ctx.save();
    });

    // button mouseover and mouseaway selfs
    let canvas = self.network.canvas.frame.canvas;
    let canvasOffset = canvas.getBoundingClientRect();
    canvas.addEventListener('mousemove', event => {

        if (!self.menu) {
            return;
        }

        let mouse = self.network.DOMtoCanvas({
            x: event.offsetX - canvasOffset.left,
            y: event.offsetY - canvasOffset.top
        });

        self.menu.buttons.forEach(button => {
            let distance = Math.sqrt((mouse.x - button.x)*(mouse.x - button.x) + (mouse.y - button.y)*(mouse.y - button.y));
            if (distance < button.radius) {
                if (!button.isHover) {
                    button.hover();
                }
            } else {
                if (button.isHover) {
                    button.blur();
                }
            }
        });
    }, false);

    // listen for click events on the buttons
    self.network.on('click', event => {

        if (!self.menu) {
            return;
        }

        let mouse = {
            x: event.pointer.canvas.x,
            y: event.pointer.canvas.y
        };

        self.menu.buttons.forEach(button => {
            let distance = Math.sqrt((mouse.x - button.x)*(mouse.x - button.x) + (mouse.y - button.y)*(mouse.y - button.y));
            if (distance < button.radius) {
                console.log('click', button);
            }
        });
    });

    // export methods
    self.toggle = (data, args) => {
        args = args || {};

        if (!args.context || !self.contexts[args.context] || !data.event) {
            return;
        }

        let context = self.contexts[args.context];
        if (!context.buttons || !context.buttons.length) {
            return;
        }

        // for point context only
        if (context.type === 'point' && self.menu && self.menu.context.type === 'point') {
            self.menu = null;
            self.network.redraw();
            return;
        }

        // TODO CONFIGURE
        // const circle constants
        const minRadius = 90;
        const buttonRadius = 20;
        const buttonDistance = 15;

        let center;
        if (context.type === 'point') {
            center = {
                x: data.event.pointer.canvas.x,
                y: data.event.pointer.canvas.y
            };
        } else if (context.type === 'node') {
            let pos = self.network.getPositions(data.event.nodes[0]);
            center = pos[data.event.nodes[0]];
        }

        // init menu
        let menu = {
            context: context,
            center: center,
            buttons: []
        };

        /* COMPUTE BUTTON POSITIONS */

        // step 1. Compute the radius of the button circle
        let potentialCircumference = context.buttons.length * (2 * buttonRadius + buttonDistance);
        let potentialRadius = potentialCircumference / (Math.PI * 2);

        let radius = (minRadius > potentialRadius) ? minRadius : potentialRadius;

        // step 2. Compute the angle that contains a single button
        let a = buttonRadius + buttonDistance / 2;
        let b = radius;
        let c = radius;
        let cosA = (b*b + c*c - a*a) / (2*b*c);
        let angle = Math.acos(cosA) * 2;

        // step 3. compute positions of buttons
        let cAngle = -1.5;
        context.buttons.forEach(btn => {
            let x = radius * Math.cos(cAngle) + menu.center.x;
            let y = radius * Math.sin(cAngle) + menu.center.y;

            menu.buttons.push(new Button(x, y, buttonRadius, {
                color: (btn.color && self.config.colors[btn.color]) ? self.config.colors[btn.color] : {},
                icon: btn.icon
            }));

            cAngle += angle;
        });

        self.menu = menu;
        self.network.redraw();
    };

    return self;
}