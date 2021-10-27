<script>
    // Licensed under Gnu Public Licence version 2
    // Copyright (c) 2020 (original work) Open Assessment Technologies SA ;

    /**
     * Component is used to control navigation through test, show test taker progress and overview
     * @property {String} serviceCallId - id of test session
     * @property {Boolean} [liteMode=false] - simplified mode of progress display
     * @property {Boolean} [disabled=false] - disable all buttons
     * @property {Boolean} [bookmarkDisabled=false] - disable bookmark button
     * @fires 'move' navigation event
     * @fires 'overview' event (to show progress overview)
     * @fires 'bookmark' event
     */
    import { createEventDispatcher } from 'svelte';
    import { StepProgress } from "@oat-sa-private/ui-components";

    const dispatch = createEventDispatcher();

    export let serviceCallId;
    export let liteMode = false;
    export let disabled = false;
    export let bookmarkDisabled = false;

    let item;
    let testPart;
    const scope = 'item';

    /**
     * Loads the testPart data and calculates navigation state
     * @returns {Object} navigation options
     */
    function loadNavigationState() {
        // Each key represents a button
        const allowedNavigation = {
            previous: false,
            next: true,
            finishTestPart: false,
            finishTest: false,
            skip: false,
            attempt: false,
            attemptsDone: false,
            overview: false
        };

        let isLast = false;
        let canNavigateFreely = false;
        let remainingAttempts = -1;

        const testMap = testStateStore.getTestMap();
        const testTotal = testMap && testMap.stats.total;

        item = testStateStore.getCurrentItem();
        testPart = testStateStore.getCurrentTestPart();

        if (item && testPart) {
            canNavigateFreely = !testPart.isLinear;
            remainingAttempts = Number.isInteger(item.remainingAttempts) ? item.remainingAttempts : -1;

            // Properties only used in attempts mode
            if (remainingAttempts > -1) {
                allowedNavigation.attempt = true;

                //TODO: read allowSkipping from current item
                const testContext = testStateStore.getTestContext();
                if (testContext.allowSkipping !== false) {
                    allowedNavigation.skip = true;
                }
                if (remainingAttempts === 0) {
                    allowedNavigation.attempt = false;
                    allowedNavigation.attemptsDone = true;
                }
                canNavigateFreely = !testPart.isLinear && (allowedNavigation.skip || allowedNavigation.attemptsDone);
            }

            // Properties for any mode
            if (!testPart.isLinear) {
                if (item.position - testPart.position > 0) {
                    allowedNavigation.previous = true;
                }
            }

            // Properties for last item in part
            if (item.position - testPart.position + 1 >= testPart.stats.total) {
                isLast = true;
                if (testPart.isLinear || liteMode || remainingAttempts === 0) {
                    allowedNavigation.next = false;
                    allowedNavigation.finishTestPart = true;
                    if (item.position + 1 >= testTotal) {
                        allowedNavigation.finishTest = true;
                    }
                }
            }

            allowedNavigation.overview = !testPart.isLinear && !liteMode;

            return {
                allowed: allowedNavigation,
                isLinear: testPart.isLinear,
                isLast,
                remainingAttempts,
                canNavigateFreely,
                bookmark: {
                    shown: !liteMode && !testPart.isLinear && item && !item.informational,
                    toggled: item && item.flagged
                }
            };
        } else {
            return null;
        }
    }

    /**
     * @fires 'move' navigation event with directions set to 'previous'
     */
    function previous() {
        if (disabled) {
            return;
        }
        dispatch('move', { direction: 'previous', scope });
    }

    /**
     * @fires 'move' navigation event with directions set to 'next'
     * @fires 'review' navigation event in case of non-linear testPart and non-lite mode
     */
    function next() {
        if (disabled) {
            return;
        }
        if (
            item &&
            item.position - testPart.position + 1 >= testPart.stats.total &&
            navigationState.allowed.finishTestPart === false
        ) {
            //non-linear and non-lite mode
            dispatch('review');
        } else {
            dispatch('move', { direction: 'next', scope });
        }
    }

    /**
     * @fires 'move' navigation event with directions set to 'previous'
     * @fires 'overview' component event
     */
    function submitTestPart() {
        if (disabled) {
            return;
        }
        if (testPart.isLinear || liteMode) {
            dispatch('move', { direction: 'next', scope });
        } else {
            dispatch('overview');
        }
    }

    /**
     * @fires 'bookmark' event
     */
    function bookmark() {
        if (!disabled && !bookmarkDisabled) {
            dispatch('bookmark');
        }
    }

    //calculating navigation state on every testStateStore change
    const navigationState = null;
    // $: navigationState = $testStateStore ? loadNavigationState() : null;

    const navButtonSize = 'medium';
</script>

<style>

</style>

<StepProgress
        on:move
        steps={[{ key: '1', label: '!'}, {key: '2', icon: 'bookmark-12', label: 'bookmark'}, {key: '3', state: 'visited'}, {key: '4', state: 'completed'}, {key: '5', disabled: true}, {key: '6'}]}
        current={0}
        space='large'
        wrap={true}>
</StepProgress>
