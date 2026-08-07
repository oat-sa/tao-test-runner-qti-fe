define(function () {
    ('use strict');

    let sequenceNumber = '';

    return {
        getSequenceStore() {
            return Promise.resolve({
                setSequenceNumber(seq) {
                    sequenceNumber = seq;
                    return Promise.resolve();
                },

                getSequenceNumber() {
                    return Promise.resolve(sequenceNumber);
                },

                clearSequenceNumber() {
                    sequenceNumber = null;
                    return Promise.resolve();
                }
            });
        },

        getSequenceNumber(testRunner) {
            return Promise.resolve(testRunner.sequenceNumber);
        },

        setSequenceNumber(seq) {
            sequenceNumber = seq;
        }
    };
});
