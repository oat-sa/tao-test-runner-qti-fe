import __ from 'i18n';

/**
 * Returns timer information string
 * @returns {Boolean}
 */
function getTimerMessage (hours, minutes, seconds, unansweredQuestions) {
    let timerMessage;

    const timeArr = [hours, minutes, seconds];
    const timeArgArr = [];
    [__('hours'), __('minutes'), __('seconds')].forEach((unit, idx) => {
        if (timeArr[idx] > 0) {
            timeArgArr.push(`${timeArr[idx]} ${unit}`);
        }
    });

    let answeredMessage;
    if (typeof unansweredQuestions !== 'number') {
        answeredMessage = __('the current question');
    } else {
        let questionsMessage = __('questions');
        if (unansweredQuestions === 1) {
            questionsMessage = __('question');
        }
        answeredMessage = __('remaining %s %s', unansweredQuestions, questionsMessage);
    }

    if (timeArgArr.length === 0) {
        timerMessage = __('%s to answer %s', 'no time left', answeredMessage);
    } else {
        timerMessage = __('%s to answer %s', timeArgArr.join(', '), answeredMessage);
    }

    return timerMessage;
}

export default getTimerMessage;