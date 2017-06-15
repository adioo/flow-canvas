'use strict';

// Dependencies
const Button = require('./Button');

module.exports = function () {

    if (!this.network) {
        return;
    }

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
            minRadius: 90,
            buttonRadius: 20,
            buttonDistance: 15,
            colors: this.config.colors || {}
        });

        this.menu.buttons.forEach(btn => {

            if (btn.ref) {
                btn.ref.draw(ctx);
            }
        });

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