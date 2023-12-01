define(function () {
    'use strict';

    return function () {
        const store = new Map();
        return Promise.resolve({
            setItem(key, value) {
                store.set(key, value);
                return Promise.resolve();
            },
            getItem(key) {
                return Promise.resolve(store.get(key));
            }
        });
    };
});
