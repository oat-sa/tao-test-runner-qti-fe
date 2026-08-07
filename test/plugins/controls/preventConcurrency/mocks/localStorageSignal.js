define(function () {
    'use strict';

    return {
        emitStorageSignal() {},
        createStorageSignalWatcher() {
            return function unregisterStorageSignalWatcher() {};
        }
    };
});
