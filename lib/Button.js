'use strict';

function Button (x, y, radius, config) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = config.color;
    this.icon = config.icon;
    this.isHover = false;
    this.isPressed = false;

    // default values
    this.color.border = this.color.border || '#455E6B';
    this.color.background = this.color.background || '#4D6977';
    this.color.hover = this.color.hover || {};
    this.color.hover.border = this.color.hover.border || '#46B52E';
    this.color.hover.background = this.color.hover.background || '#84CD73';

    // Button methods
    this.draw = context => {

        if (!context && !this.context) {
            return;
        }
        if (context) {
            this.context = context;
        }

        this.context.beginPath();
        this.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        this.context.fillStyle = this.isHover ? this.color.hover.background : this.color.background;
        this.context.fill();

        this.context.lineWidth = 1;
        this.context.strokeStyle = this.isHover ? this.color.hover.border : this.color.border;
        this.context.stroke();

        // add icon
        if (this.icon) {
            let iconSize = 30;
            this.context.fillStyle = 'white';
            this.context.font = iconSize +'px Material Icons';
            var width = this.context.measureText(this.icon).width;
            this.context.textBaseline = "top";
            this.context.fillText(this.icon, this.x - width / 2, this.y - iconSize / 2);
        }
    };

    this.hover = () => {
        this.isHover = true;
        document.body.style.cursor = 'pointer';
        this.draw();
    }

    this.blur = () => {
        this.isHover = false;
        document.body.style.cursor = '';
        this.draw();
    }

    this.mouseDown = () => {
        this.isPressed = true;
        this.draw();
    }

    this.mouseUp = () => {
        this.isPressed = false;
        this.draw();
    }
}

module.exports = Button;