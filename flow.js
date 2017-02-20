'use strict';

const Canvas = require('./index');

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