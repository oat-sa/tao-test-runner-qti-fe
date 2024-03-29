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
import $ from 'jquery';
import _ from 'lodash';
import component from 'ui/component';
import magnifierPanelTpl from 'taoQtiTest/runner/plugins/tools/magnifier/magnifierPanel.tpl';
import dynamicComponent from 'ui/dynamicComponent';

/**
 * The screen pixel ratio
 * @type {Number}
 */
var screenRatio = window.screen.width / window.screen.height;

/**
 * Standard debounce delay for heavy process
 * @type {Number}
 */
var debounceDelay = 50;

/**
 * Standard scrolling throttling for the scrolling
 * It can be lower than the debounce delay as it is lighter in process and it improves the user experience
 * @type {Number}
 */
var scrollingDelay = 20;

/**
 * The default base size
 * @type {Number}
 */
var defaultBaseSize = 116;

/**
 * The minimum zoom level
 * @type {Number}
 */
var defaultLevelMin = 2;

/**
 * The maximum zoom level
 * @type {Number}
 */
var defaultLevelMax = 8;

/**
 * The default zoom level
 * @type {Number}
 */
var defaultLevel = defaultLevelMin;

/**
 * Some default values
 * @type {Object}
 */
var defaultConfig = {
    level: defaultLevel,
    levelMin: defaultLevelMin,
    levelMax: defaultLevelMax,
    levelStep: 0.5,
    baseSize: defaultBaseSize,
    maxRatio: 0.5
};

var dynamicComponentDefaultConfig = {
    draggable: true,
    resizable: true,
    preserveAspectRatio: false,
    width: defaultBaseSize * defaultLevel,
    height: (defaultBaseSize * defaultLevel) / screenRatio,
    minWidth: defaultBaseSize * defaultLevelMin,
    minHeight: (defaultBaseSize * defaultLevelMin) / screenRatio,
    stackingScope: 'test-runner',
    top: 50,
    left: 10
};

/**
 * Creates a magnifier panel component
 * @param {Object} config
 * @param {Number} [config.level] - The default zoom level
 * @param {Number} [config.levelMin] - The minimum allowed zoom level
 * @param {Number} [config.levelMax] - The maximum allowed zoom level
 * @param {Number} [config.levelStep] - The level increment applied when using the controls + and -
 * @param {Number} [config.baseSize] - The base size used to assign the width and the height according to the zoom level
 * @param {Number} [config.maxRatio] - The ratio for the maximum size regarding the size of the window
 * @returns {magnifierPanel} the component (initialized)
 */
function magnifierPanelFactory(config) {
    var initConfig = _.defaults(config || {}, defaultConfig);
    var zoomLevelMin = parseFloat(initConfig.levelMin);
    var zoomLevelMax = parseFloat(initConfig.levelMax);
    var zoomLevelStep = parseFloat(initConfig.levelStep);
    var zoomLevel = adjustZoomLevel(initConfig.level);
    var maxRatio = parseFloat(initConfig.maxRatio);
    var $initTarget = null;
    var controls = null;
    var observer = null;
    var targetWidth, targetHeight, dx, dy;
    var scrolling = [];
    var dynamicComponentInstance;

    var dynamicComponentConfig = _.defaults(config ? config.component || {} : {}, dynamicComponentDefaultConfig);

    /**
     * @typedef {Object} magnifierPanel
     */
    var magnifierPanel = component(
        {
            /**
             * Gets the current zoom level
             * @returns {Number}
             */
            getZoomLevel: function getZoomLevel() {
                return zoomLevel;
            },

            /**
             * Gets the targeted content the magnifier will zoom
             * @returns {jQuery}
             */
            getTarget: function getTarget() {
                return controls && controls.$target;
            },

            /**
             * Sets the targeted content the magnifier will zoom
             * @param {jQuery} $newTarget
             * @returns {magnifierPanel}
             * @fires targetchange
             * @fires update
             */
            setTarget: function setTarget($newTarget) {
                if (controls) {
                    controls.$target = $newTarget;
                    controls.$viewTarget = null;

                    setScrollingListener();

                    /**
                     * @event magnifierPanel#targetchange
                     * @param {jQuery} $target
                     */
                    this.trigger('targetchange', controls.$target);

                    this.update();
                } else {
                    $initTarget = $newTarget;
                }

                return this;
            },

            /**
             * Sets the zoom level of the magnifier
             * @param {Number} level
             * @returns {magnifierPanel}
             * @fires zoom
             */
            zoomTo: function zoomTo(level) {
                if (level && _.isFinite(level)) {
                    zoomLevel = adjustZoomLevel(level);
                }

                applyZoomLevel();
                showZoomLevel();
                updateMaxSize();
                updateZoom();

                /**
                 * @event magnifierPanel#zoom
                 * @param {Number} zoomLevel
                 */
                this.trigger('zoom', zoomLevel);

                return this;
            },

            /**
             * Increments the zoom level of the magnifier
             * @param {Number} step
             * @returns {magnifierPanel}
             * @fires zoom
             */
            zoomBy: function zoomBy(step) {
                if (step && _.isFinite(step)) {
                    this.zoomTo(zoomLevel + parseFloat(step));
                }
                return this;
            },

            /**
             * Zoom-in using the configured level step
             * @returns {magnifierPanel}
             * @fires zoom
             */
            zoomIn: function zoomIn() {
                return this.zoomBy(zoomLevelStep);
            },

            /**
             * Zoom-out using the configured level step
             * @returns {magnifierPanel}
             * @fires zoom
             */
            zoomOut: function zoomOut() {
                return this.zoomBy(-zoomLevelStep);
            },

            /**
             * Places the magnifier sight at a particular position on the target content
             * @param {Number} x
             * @param {Number} y
             * @returns {magnifierPanel}
             */
            zoomAt: function zoomAt(x, y) {
                var position;
                if (controls) {
                    position = this.translate(x, y);
                    controls.$inner.css({
                        top: -position.top,
                        left: -position.left
                    });
                }
            },

            /**
             * Translates screen coordinates to zoom coordinates
             * @param {Number} x
             * @param {Number} y
             * @returns {Object}
             */
            translate: function translate(x, y) {
                return {
                    top: translateMagnifier(y, targetHeight, dynamicComponentInstance.position.height),
                    left: translateMagnifier(x, targetWidth, dynamicComponentInstance.position.width)
                };
            },

            /**
             * Updates the magnifier with the target content
             * @returns {magnifierPanel}
             * @fires update
             */
            update: function update() {
                if (controls && controls.$target) {
                    controls.$clone = controls.$target.clone().removeAttr('id');
                    controls.$clone.find('iframe').remove();
                    controls.$clone.find('[name],[id],[data-serial]').removeAttr('name id data-serial');
                    controls.$inner.empty().append(controls.$clone);
                    controls.$clone.find('audio').prop('muted', true);

                    applySize();
                    applyZoomLevel();
                    updateZoom();
                    updateMaxSize();
                    applyScrolling();

                    /**
                     * @event magnifierPanel#update
                     */
                    this.trigger('update');
                }

                return this;
            }
        },
        defaultConfig
    );

    /**
     * Will update the magnifier content with the actual content
     * @type {Function}
     */
    var updateMagnifier = _.debounce(_.bind(magnifierPanel.update, magnifierPanel), debounceDelay);

    /**
     * Will update the magnifier content with the scrolling position
     * @type {Function}
     */
    var scrollingListenerCallback = _.throttle(function(event) {
        var $target = $(event.target);
        var scrollingTop = event.target.scrollTop;
        var scrollLeft = event.target.scrollLeft;
        var scrollId, scrollData;

        //check if the element is already known as a scrollable element
        if (controls && controls.$clone && $target.data('magnifier-scroll')) {
            scrollId = $target.data('magnifier-scroll');
            scrollData = _.find(scrolling, { id: scrollId });
            scrollData.scrollTop = scrollingTop;
            scrollData.scrollLeft = scrollLeft;

            //if in clone, scroll it
            scrollInClone(scrollData);
        } else {
            //if the element is not yet identified as a scrollable element, tag it and register its id
            scrollId = _.uniqueId('scrolling_');
            $target.attr('data-magnifier-scroll', scrollId);
            scrolling.push({
                id: scrollId,
                scrollTop: scrollingTop,
                scrollLeft: scrollLeft
            });

            //update all
            magnifierPanel.update();
        }
    }, scrollingDelay);

    /**
     * Scroll an element in the clone
     *
     * @param {Object} scrollData
     * @param {String} scrollData.id
     * @param {Number} [scrollData.scrollTop]
     * @param {Number} [scrollData.scrollLeft]
     */
    function scrollInClone(scrollData) {
        var $clonedTarget;
        if (controls && controls.$clone && scrollData && scrollData.id) {
            $clonedTarget = controls.$clone.find(`[data-magnifier-scroll=${scrollData.id}]`);
            if ($clonedTarget.length) {
                if (_.isNumber(scrollData.scrollTop)) {
                    $clonedTarget[0].scrollTop = scrollData.scrollTop;
                }
                if (_.isNumber(scrollData.scrollLeft)) {
                    $clonedTarget[0].scrollLeft = scrollData.scrollLeft;
                }
            }
        }
    }

    /**
     * Capture all scroll positions of elements inside current target
     */
    function updateScrollPositions() {
        if (!controls || !controls.$target) {
            return;
        }

        const elements = [controls.$target];
        let scrollOffsetsChanged = false;

        while (elements.length) {
            const $currentElement = $(elements.shift());
            const scrollLeft = $currentElement.scrollLeft();
            const scrollTop = $currentElement.scrollTop();
            let scrollId = $currentElement.data('magnifier-scroll');

            elements.push(...Array.from($currentElement.children()));

            if (scrollLeft > 0 || scrollTop > 0 || scrollId) {
                scrollOffsetsChanged = true;

                if (scrollId) {
                    const scrollData = _.find(scrolling, { id: scrollId });
                    scrollData.scrollTop = scrollTop;
                    scrollData.scrollLeft = scrollLeft;
                } else {
                    scrollId = _.uniqueId('scrolling_');
                    $currentElement.attr('data-magnifier-scroll', scrollId);
                    scrolling.push({
                        id: scrollId,
                        scrollTop,
                        scrollLeft,
                    });
                }
            }
        }

        // If there is any changes to scroll offset inside the target the magnifier should be updated
        if (scrollOffsetsChanged) {
            magnifierPanel.update();
        }
    }

    /**
     * Initializes the listener for scrolling event and transfer the scrolling
     */
    function setScrollingListener() {
        updateScrollPositions();
        window.addEventListener('scroll', scrollingListenerCallback, true);
    }

    /**
     * Stops the listener for scrolling event
     */
    function removeScrollingListener() {
        window.removeEventListener('scroll', scrollingListenerCallback, true);
    }

    /**
     * Applies scrolling programmatically from the recorded list of elements to be scrolled
     */
    function applyScrolling() {
        _.forEach(scrolling, scrollInClone);
    }

    /**
     * Adjusts a provided zoom level to fit the constraints
     * @param {Number|String} level
     * @returns {Number}
     */
    function adjustZoomLevel(level) {
        return Math.max(zoomLevelMin, Math.min(parseFloat(level), zoomLevelMax));
    }

    /**
     * Applies the zoom level to the content
     */
    function applyZoomLevel() {
        if (controls) {
            controls.$inner.css({
                transform: `scale(${zoomLevel})`
            });
        }
    }

    /**
     * Shows the zoom level using a CSS animation
     */
    function showZoomLevel() {
        var $newZoomLevel;
        if (controls) {
            $newZoomLevel = controls.$zoomLevel.clone(true).html(zoomLevel);
            controls.$zoomLevel.before($newZoomLevel).remove();
            controls.$zoomLevel = $newZoomLevel;
        }
    }

    /**
     * Updates the max size according to the window's size
     */
    function updateMaxSize() {
        if (!dynamicComponentInstance) {
            return;
        }

        const $window = $(window);
        dynamicComponentInstance.config.maxWidth = $window.width() * maxRatio;
        dynamicComponentInstance.config.maxHeight = $window.height() * maxRatio;
    }

    /**
     * Forwards the size of the target to the cloned content
     */
    function applySize() {
        if (controls && controls.$clone) {
            targetWidth = controls.$target.width();
            targetHeight = controls.$target.height();

            controls.$clone.width(targetWidth).height(targetHeight);
        }
    }

    /**
     * Place the zoom sight at the right place inside the magnifier
     */
    function updateZoom() {
        var position;
        if (controls && controls.$target) {
            position = dynamicComponentInstance.position;

            position.x += dx + controls.$target.scrollLeft();
            position.y += dy + controls.$target.scrollTop();

            magnifierPanel.zoomAt(position.x, position.y);
        }
    }

    /**
     * Creates the observer that will react to DOM changes to update the magnifier
     */
    function createObserver() {
        observer = new window.MutationObserver(updateMagnifier);
    }

    /**
     * Starts to observe the DOM of the magnifier target
     */
    function startObserver() {
        if (controls && controls.$target) {
            observer.observe(controls.$target.get(0), {
                childList: true, // Set to true if additions and removals of the target node's child elements (including text nodes) are to be observed.
                attributes: true, // Set to true if mutations to target's attributes are to be observed.
                characterData: true, // Set to true if mutations to target's data are to be observed.
                subtree: true // Set to true if mutations to target and target's descendants are to be observed.
            });
        }
        setScrollingListener();
    }

    /**
     * Stops to observe the DOM of the magnifier target
     */
    function stopObserver() {
        observer.disconnect();
        removeScrollingListener();
    }

    /**
     * Translates a screen coordinate into the magnifier
     * @param {Number} coordinate
     * @param {Number} actualSize
     * @param {Number} magnifierSize
     * @returns {Number}
     */
    function translateMagnifier(coordinate, actualSize, magnifierSize) {
        var delta = 0;
        var ratio = zoomLevel;

        if (actualSize) {
            delta = (actualSize * (zoomLevel - 1)) / 2;
            ratio = (actualSize * zoomLevel - magnifierSize) / (actualSize - magnifierSize);
        }

        return coordinate * ratio - delta;
    }

    /**
     * Gets the top element from a particular absolute point.
     * @param {Number} x - the page X-coordinate of the point
     * @param {Number} y - the page Y-coordinate of the point
     * @returns {HTMLElement}
     */
    function getElementFromPoint(x, y) {
        var el;

        // this is done to prevent working with undefined coordinates
        x = x || 0;
        y = y || 0;

        if (controls) {
            controls.$overlay.addClass('hidden');
        }

        el = document.elementFromPoint(x, y);

        if (controls) {
            controls.$overlay.removeClass('hidden');
        }

        return el;
    }

    /**
     * Find the related node in the target. The both trees must have the same content.
     * @param {jQuery|HTMLElement} node - the node for which find a relation
     * @param {jQuery|HTMLElement} root - the root of the tree that contains the actual node
     * @param {jQuery|HTMLElement} target - the root of the tree that could contains the related node
     * @returns {jQuery}
     */
    function findSourceNode(node, root, target) {
        var $node = $(node);
        var $root = $(root);
        var $target = $(target);
        var indexes = [$node.index()];

        // compute map of node's parents indexes
        $node.parents().each(function() {
            var $this = $(this);
            if (!$this.is($root)) {
                indexes.push($this.index());
            } else {
                return false;
            }
        });

        // the last index is related to the root, so ignore it
        indexes.pop();

        // now try to find the same node using the path provided by the indexes map
        if (indexes.length) {
            $node = $target;
            _.forEachRight(indexes, function(index) {
                $node = $node.children().eq(index);
                if (!$node.length) {
                    return false;
                }
            });
        } else {
            // nothing to search for...
            $node = $();
        }
        return $node;
    }

    dynamicComponentInstance = dynamicComponent({})
        .on('rendercontent', function($content) {
            // eslint-disable-next-line consistent-this
            var dynamicComponentContext = this;
            var $element = this.getElement();

            $element.addClass('magnifier-container');

            magnifierPanel
                .setTemplate(magnifierPanelTpl)
                .on('render', function() {
                    var self = this;
                    var $component = this.getElement();

                    this.setState('hidden', true);

                    // compute the padding of the magnifier content
                    dx = ($component.outerWidth() - $component.width()) / 2;
                    dy = ($component.outerHeight() - $component.height()) / 2;

                    controls = {
                        $target: $initTarget,
                        $inner: $('.inner', $component),
                        $zoomLevel: $('.level', $component),
                        $overlay: $('.overlay', $component)
                    };
                    $initTarget = null;

                    // click on zoom-out control
                    $component.on('click touchstart', '.control[data-control="zoomOut"]', function(event) {
                        event.preventDefault();

                        self.zoomOut();
                    });

                    // click on zoom-in control
                    $component.on('click touchstart', '.control[data-control="zoomIn"]', function(event) {
                        event.preventDefault();

                        self.zoomIn();
                    });

                    // click on close controls
                    $component.on('click touchstart', '.closeMagnifier', function(event) {
                        event.preventDefault();
                        self.hide();
                        self.trigger('close');
                    });

                    // interact through the magnifier glass with the zoomed content
                    $component.on('click touchstart', '.overlay', function(event) {
                        findSourceNode(getElementFromPoint(event.pageX, event.pageY), controls.$inner, controls.$target)
                            .click()
                            .focus();
                    });

                    createObserver();
                    updateMaxSize();
                    applyZoomLevel();
                })
                .on('show', function() {
                    updateMagnifier();
                    startObserver();

                    dynamicComponentContext.show();
                })
                .on('hide', function() {
                    stopObserver();

                    dynamicComponentContext.hide();
                })
                .on('destroy', function() {
                    stopObserver();
                    $initTarget = null;
                    controls = null;
                    observer = null;

                    dynamicComponentContext.destroy();
                })
                .init(initConfig)
                .render($content);
        })
        .on('down move resize', function() {
            updateZoom();
        })
        .on('resize', function() {
            updateMaxSize();
        })
        .init(dynamicComponentConfig);

    return magnifierPanel;
}

export default magnifierPanelFactory;
