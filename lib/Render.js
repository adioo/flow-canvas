'use strict';

// Dependencies
const Button = require('./Button');

const DEFAULT_ICON_FONT = 'Material Icons';
const DEFAULT_MIN_RADIUS = 90;
const DEFAULT_BUTTON_RADIUS = 20;
const DEFAULT_BUTTON_DISTANCE = 15;

module.exports = function () {

    if (!this.network) {
        return;
    }

    // force icon fonts to load
    let fonts = [DEFAULT_ICON_FONT];
    Object.keys(this.config.contexts).forEach(ctx => {
        this.config.contexts[ctx].buttons.forEach(btn => {

            if (btn.icon && typeof btn.icon === 'string') {
                if (btn.icon.family && fonts.indexOf(btn.icon.family) < 0) {
                    fonts.push(btn.icon.family);
                }
            }
        });
    });
    fonts.forEach(font => {
        if (document.fonts) {
            document.fonts.load('12px ' + font);
        }
    });

    // render controls on canvas change
    this.network.on('afterDrawing', (ctx) => {

        if (!this.menu) {
            return;
        }

        // determine center positions if menu is node
        if (this.menu.type === 'node') {
            let box = this.network.getBoundingBox(this.menu.node);
            this.menu.center = {
                x: (box.left + box.right) / 2,
                y: (box.top + box.bottom) / 2
            }
        }

        createButtons(this.menu, {
            minRadius: this.config.minRadius || DEFAULT_MIN_RADIUS,
            buttonRadius: this.config.buttonRadius || DEFAULT_BUTTON_RADIUS,
            buttonDistance: this.config.buttonDistance || DEFAULT_BUTTON_DISTANCE,
            colors: this.config.colors || {}
        });

        this.menu.buttons.forEach(btn => {

            if (btn.ref) {
                btn.ref.draw(ctx);
            }
        });

        // draw a center point for type "point"
        if (this.menu.type === 'point') {
            ctx.beginPath();
            ctx.arc(this.menu.center.x, this.menu.center.y, 2, 0 , 2 * Math.PI);
            ctx.fillStyle = '#6D9EEB';
            ctx.fill();
        }

        ctx.save();
    });
};

function createButtons (menu, config) {
    config = config || {};

    // step 1. Compute the radius of the button circle
    let potentialCircumference = menu.buttons.length * (2 * config.buttonRadius + config.buttonDistance);
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
    menu.buttons.forEach(btn => {
        let x = radius * Math.cos(cAngle) + menu.center.x;
        let y = radius * Math.sin(cAngle) + menu.center.y;

        if (!btn.ref) {
            btn.ref = new Button(x, y, config.buttonRadius, {
                color: (btn.color && config.colors[btn.color]) ? config.colors[btn.color] : {},
                icon: btn.icon
            });
        } else {
            btn.ref.x = x;
            btn.ref.y = y;
        }

        cAngle += angle;
    });
}

/* private functions */