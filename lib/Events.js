'use strict';

module.exports = function () {

    // button mouseover and mouseaway selfs
    let canvas = this.network.canvas.frame.canvas;
    let canvasOffset = canvas.getBoundingClientRect();
    canvas.addEventListener('mousemove', event => {

        if (!this.menu) {
            return;
        }

        let mouse = this.network.DOMtoCanvas({
            x: event.offsetX - canvasOffset.left,
            y: event.offsetY - canvasOffset.top
        });

        this.menu.buttons.forEach(button => {

            if (!button.ref) {
                return
            }

            let distance = Math.sqrt((mouse.x - button.ref.x)*(mouse.x - button.ref.x) + (mouse.y - button.ref.y)*(mouse.y - button.ref.y));
            if (distance < button.ref.radius) {
                if (!button.ref.isHover) {
                    button.ref.hover();
                }
            } else {
                if (button.ref.isHover) {
                    button.ref.blur();
                }
            }
        });
    }, false);

    // listen for click events on the buttons
    this.network.on('click', event => {

        if (!this.menu) {
            return;
        }

        let mouse = {
            x: event.pointer.canvas.x,
            y: event.pointer.canvas.y
        };

        this.menu.buttons.forEach(button => {

            if (!button.ref) {
                return
            }

            let distance = Math.sqrt((mouse.x - button.ref.x)*(mouse.x - button.ref.x) + (mouse.y - button.ref.y)*(mouse.y - button.ref.y));
            if (distance < button.ref.radius) {
                console.log('click', button);
            }
        });
    });
};