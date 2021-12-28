/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2016 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien.conan@vesperiagroup.com>
 */
import _ from 'lodash';
import pluginFactory from 'taoTests/runner/plugin';

/**
 * Creates the testState plugin.
 * Handle particular states of the assessment test
 */
export default pluginFactory({
    name: 'testState',

    /**
     * Installs the plugin (called when the runner bind the plugin)
     */
    install: function install() {
        var testRunner = this.getTestRunner();

        // middleware invoked on every requests
        testRunner.getProxy().use(function qtiFilter(req, res, next) {
            var data = res && res.data;

            // test has been closed/suspended => redirect to the index page after message acknowledge
            if (data && data.type && data.type === 'TestState' && !testRunner.getState('closedOrSuspended')) {
                // spread the world about the reason of the leave
                testRunner.setState('closedOrSuspended', true);

                if (!testRunner.getState('ready')) {
                    // if we open an inconsistent test just leave
                    // should happen if we refresh an auto paused test
                    testRunner.trigger('destroy');
                } else if (_.isEmpty(data.messages) || !_.find(data.messages, { channel: 'teststate' })) {
                    testRunner.trigger('leave', data);
                }
                // break the chain to avoid uncaught exception in promise...
                // this will lead to unresolved promise, but the browser will be redirected soon!
                return;
            }
            next();
        });
    },

    /**
     * Initializes the plugin (called during runner's init)
     */
    init: function init() {
        const testRunner = this.getTestRunner();
        const testRunnerOptions = testRunner.getOptions();
        var isLeaving = false;

        // immediate handling of proctor's actions
        testRunner.getProxy().channel('teststate', function(data) {
            const testStateType = data && data.type;
            const hasValidType = 'close' === testStateType || 'pause' === testStateType;
            const canTriggerTestState = !isLeaving && hasValidType && !testRunner.getState('closedOrSuspended');

            if (!canTriggerTestState) {
                return;
            }

            isLeaving = true;
            let triggerData = data;
            if (testRunnerOptions.skipPausedAssesmentDialog && data) {
                triggerData = Object.assign({}, data, { skipPausedAssesmentDialog: testRunnerOptions.skipPausedAssesmentDialog });
            }

            if ('pause' === testStateType) {
                testRunner.trigger('pause', triggerData);
                return;
            }

            testRunner.setState('closedOrSuspended', true);
            testRunner.trigger('leave', triggerData);
        });
    }
});
