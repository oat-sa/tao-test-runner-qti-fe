define(function () {
    ('use strict');

    let stats = {
        createCalls: 0,
        markActiveCalls: 0,
        markPausedCalls: 0
    };

    return {
        createSharedWorkerClient() {
            stats.createCalls += 1;

            return {
                markActive() {
                    stats.markActiveCalls += 1;
                },
                markPaused() {
                    stats.markPausedCalls += 1;
                }
            };
        },

        getStats() {
            return {
                ...stats
            };
        },

        reset() {
            stats = {
                createCalls: 0,
                markActiveCalls: 0,
                markPausedCalls: 0
            };
        }
    };
});
