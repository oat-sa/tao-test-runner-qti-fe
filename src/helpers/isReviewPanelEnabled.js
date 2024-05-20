import mapHelper from 'taoQtiTest/runner/helpers/map';

/**
 * Tells if the review panel is enabled
 * @returns {Boolean}
 */
function isReviewPanelEnabled(runner) {
    const reviewEnabled = mapHelper.hasItemCategory(
        runner.getTestMap(),
        runner.getTestContext().itemIdentifier,
        'reviewScreen',
        true
    );
    //const itemReviewEnabled = runner.getOptions().review.enabled;
    const itemReviewEnabled = false;
    return reviewEnabled && itemReviewEnabled;
}

export default isReviewPanelEnabled;