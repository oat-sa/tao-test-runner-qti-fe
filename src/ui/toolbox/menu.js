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
 * Copyright (c) 2017-2020 (original work) Open Assessment Technologies SA;
 */
/**
 * This factory creates a component that allows to create a toolbox menu.
 * It contains both the menu button and the menu itself.
 * Entries have to be added manually by the addItem() method.
 *
 * Do not instanciate directly, but use the relevant toolbox method:
 * toolbox.createMenu({
 *      control: 'menu-id',
 *      title: __('Html title'),
 *      icon: 'icon',
 *      text: __('Displayed label')
 * });
 * Optional setting: navType - navigation type
 * navType: 'fromLast' (default behavior) - focus on button (if no active item) and then using UP go to last item, when press DOWN at last item (or UP at the first) menu will be closed,
 * navType: 'fromFirst' - focus on button (if no active item) and then using DOWN go to first item. When press the DOWN key at the first item (or UP at the first) menu will be closed
 * toolbox.createMenu({
 *      control: 'menu-id',
 *      title: __('Html title'),
 *      icon: 'icon',
 *      text: __('Displayed label'),
 *      navType: 'fromFirst'
 * });
 *
 * @author Christophe Noël <christophe@taotesting.com>
 */
import $ from 'jquery';
import _ from 'lodash';
import componentFactory from 'ui/component';
import hider from 'ui/hider';
import stackerFactory from 'ui/stacker';
import menuTpl from 'taoQtiTest/runner/ui/toolbox/templates/menu';
import menuItemTpl from 'taoQtiTest/runner/ui/toolbox/templates/menu-item';

var keyCodes = {
    TAB: 9,
    ESC: 27,
    ENTER: 13,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40
};

var stacker = stackerFactory('test-runner');

var menuComponentApi = {
    /**
     * Initialise the menu
     */
    initMenu: function initMenu() {
        this.id = this.config.control;
        this.navType = this.config.navType ? this.config.navType : 'fromLast';
        this.menuItems = [];
    },

    /**
     * Get the type of the component
     */
    getType: function getType() {
        return 'menu';
    },

    /**
     * Get the menu Id
     * @returns {String}
     */
    getId: function getId() {
        return this.id;
    },

    /**
     * Set the menu as active, essentially meaning that the menu panel is opened
     */
    turnOn: function turnOn() {
        this.setState('active', true);
    },

    /**
     * Set the menu as inactive
     */
    turnOff: function turnOff() {
        this.setState('active', false);
    },

    /**
     * =====================
     * Actions on menu panel
     * =====================
     */

    /**
     * open/close the menu
     */
    toggleMenu: function showMenu() {
        if (!this.is('disabled')) {
            if (this.is('opened')) {
                this.closeMenu();
            } else {
                this.openMenu();
            }
        }
    },

    /**
     * It needs to find closest visible item.
     *
     * @param {Number} last - index to stop.
     * @param {-1|1} inc - incrementor. -1 - navigate to the top,  1 - to the bottom.
     *
     * @returns {Number} returns index > 0 if a visible item was found and -1 otherwise.
     */
    indexOfClosestVisibleItem(inc, last) {
        if (!this.menuItems.length) {
            return -1;
        }

        let elem;
        let position = this.hoverIndex;
        do {
            position += inc;
            if (position === last) {
                return -1;
            }
            elem = this.menuItems[position].getElement();
        } while (elem && elem.hasClass('hidden'));

        return position;
    },

    /**
     * Changes hoverIndex and hover item.
     *
     * @param {Number} index - item index to hover.
     *
     * @returns the menu item.
     */
    hoverByIndex(index) {
        const elem = this.menuItems[index];
        this.hoverIndex = index;
        if (elem) {
            this.hoverItem(elem.id);
        }

        return elem;
    },

    hoverNextVisibleItem() {
        const index = this.indexOfClosestVisibleItem(1, this.menuItems.length);
        const elem = this.hoverByIndex(index);

        return elem;
    },

    hoverPreviousVisibleItem() {
        const index = this.indexOfClosestVisibleItem(-1, -1);
        const elem = this.hoverByIndex(index);

        return elem;
    },

    /**
     * open the menu
     */
    openMenu: function openMenu() {
        // show the DOM element
        hider.show(this.$menuContainer);
        stacker.bringToFront(this.$menuContent);

        // change the menu button icon
        this.$menuStateIcon.removeClass('icon-up');
        this.$menuStateIcon.addClass('icon-down');

        // turn on the menu button
        this.turnOn();

        // setup keyboard navigation & highlighting
        this.enableShortcuts();
        this.hoverOffAll();
        if (document.activeElement) {
            document.activeElement.blur();
        }
        const activeItemIndex = _.findIndex(this.menuItems, item => item.is('active'));
        if (activeItemIndex >= 0) {
            this.hoverIndex = activeItemIndex;
            this.$menuItems[this.hoverIndex].focus();
            this.hoverItem(this.menuItems[activeItemIndex].id);
        }
        else if (this.navType === 'fromLast') {
            // fromLast (default) navigation: focus on button and then using UP go to last item
            this.hoverIndex = this.menuItems.length; // we start on the button, not at the max array index
            // which would be menuItems.length-1
            this.hoverPreviousVisibleItem();
        }
        else if (this.navType === 'fromFirst') {
            // fromFirst navigation: focus on button and then using DOWN go to first item
            this.hoverIndex = -1; // we start on the button, not the first element
            // which would be 0
            this.hoverNextVisibleItem();
        }

        // component inner state
        this.setState('opened', true);
        this.trigger('openmenu', this);
    },

    /**
     * close the menu
     */
    closeMenu() {
        // hide the DOM element
        hider.hide(this.$menuContainer);

        // change the menu button icon
        this.$menuStateIcon.removeClass('icon-down');
        this.$menuStateIcon.addClass('icon-up');

        // turn off the button
        this.turnOff();

        // disable keyboard navigation & highlighting
        this.disableShortcuts();
        this.hoverOffAll();

        // component inner state
        this.setState('opened', false);
        this.trigger('closemenu', this);

        // Move focus if the menu wasn't disabled before the close action was launched.
        if (!this.is('disabled') && !this.$component.prop('disabled')) {
            this.$menuButton.parent().focus();  // It needs for screenreaders to correctly read menu button after submenu was closed
        }
    },

    /**
     * =====================
     * Actions on menu items
     * =====================
     */

    /**
     * Look for a item in the internal item registry
     * @param {String} itemId
     * @returns {Object|undefined}
     */
    getItemById: function getItemById(itemId) {
        return _.find(this.menuItems, function(item) {
            return item.getId() === itemId;
        });
    },

    /**
     * Adds an item to the menu
     * @param {Component} item
     */
    addItem: function addItem(item) {
        if (item) {
            this.menuItems.push(item);
        }
    },

    /**
     * Render menu items into the menu panel
     */
    renderItems: function renderItems() {
        var self = this;
        this.menuItems.forEach(function(item) {
            item.setTemplate(menuItemTpl); // the item has been created as generic. Let's give him now the menu entry template
            item.render(self.$menuContent);
            item.enable();
        });

        // bind mouse behavior on menu items
        this.$menuItems = this.$menuContent.find('.menu-item');

        this.$menuItems.on('mouseenter', function highlightHoveredEntry(e) {
            var itemId = e.currentTarget.getAttribute('data-control');
            self.mouseOverItem(itemId);
        });
    },

    /**
     * Highlight the currently hovered item
     * @param {String} itemId
     */
    mouseOverItem: function mouseOverItem(itemId) {
        var self = this;

        // look for item index
        this.menuItems.forEach(function(item, index) {
            if (item.id === itemId) {
                self.hoverIndex = index;
            }
        });
        this.hoverItem(itemId);
    },

    /**
     * Check that the menu has at least one of its entries displayed
     * @returns {boolean}
     */
    hasDisplayedItems: function hasDisplayedItems() {
        return this.menuItems.some(function(item) {
            return !item.is('disabled') && !item.is('hidden');
        });
    },

    /**
     * Set all entries in the menu to inactive
     */
    turnOffAll: function turnOffAll() {
        this.menuItems.forEach(function(current) {
            current.turnOff();
        });
    },

    /**
     * =====================
     * Menu items navigation
     * =====================
     */

    /**
     * register the event handlers for keyboard navigation
     */
    enableShortcuts: function enableShortcuts() {
        var self = this;

        this.$menuContainer.on('keydown.menuNavigation', function(e) {
            var currentKeyCode = e.keyCode ? e.keyCode : e.charCode;

            e.preventDefault();

            switch (currentKeyCode) {
                case keyCodes.ESC:
                case keyCodes.TAB:
                    self.closeMenu();
                    break;
                case keyCodes.SPACE:
                case keyCodes.ENTER:
                    self.triggerHighlightedItem();
                    e.stopPropagation();
                    break;
                case keyCodes.LEFT:
                case keyCodes.UP:
                    self.moveUp();
                    e.stopPropagation();
                    break;
                case keyCodes.RIGHT:
                case keyCodes.DOWN:
                    self.moveDown();
                    e.stopPropagation();
                    break;
            }
        });

        this.$menuButton.on('keydown.menuNavigation', function(e) {
            var currentKeyCode = e.keyCode ? e.keyCode : e.charCode;

            function setFocusToItem(index) {
                self.hoverIndex = index;
                self.$menuContainer.focus();
                self.hoverItem(self.menuItems[self.hoverIndex].id);
            }

            if (currentKeyCode === keyCodes.UP && self.navType === 'fromLast') {
                e.stopPropagation();
                setFocusToItem(self.menuItems.length - 1);
            }

            if (currentKeyCode === keyCodes.DOWN && self.navType === 'fromFirst') {
                e.stopPropagation();
                setFocusToItem(0);
            }
        });
    },

    /**
     * remove the event handlers for keyboard navigation
     */
    disableShortcuts: function disableShortcuts() {
        this.$menuContainer.off('.menuNavigation');
        this.$menuButton.off('.menuNavigation');
    },

    /**
     * Move the highlight to the previous not hidden item
     */
    moveUp: function moveUp() {
        if (this.hoverIndex > 0) {
            const elem = this.hoverPreviousVisibleItem();
            if (!elem) {
                this.closeMenu();
            }
            // move to the menu button
        } else if (this.hoverIndex === 0) {
            this.hoverIndex--;
            this.closeMenu();
        }
    },

    /**
     * Move the highlight to the next not hidden item, or to the menu button if we are on the last item
     */
    moveDown: function moveDown() {
        // move to the next item
        if (this.hoverIndex < this.menuItems.length - 1) {
            const elem = this.hoverNextVisibleItem();
            if (!elem) {
                this.closeMenu();
            }
            // move to the menu button
        } else if (this.hoverIndex === this.menuItems.length - 1) {
            this.hoverIndex++;
            this.closeMenu();
        }
    },

    /**
     * Highlight the given item
     * @param {String} itemId
     */
    hoverItem: function hoverItem(itemId) {
        var itemToHover = this.getItemById(itemId);
        this.hoverOffAll();

        if (itemToHover) {
            itemToHover.hoverOn();
            itemToHover
                .getElement()
                .focus();
        }
    },

    /**
     * Remove highlight from all items
     */
    hoverOffAll: function hoverOffAll() {
        this.menuItems.forEach(function(current) {
            if (current) {
                current.hoverOff();
            }
        });
    },

    /**
     * Run a click event on the DOM element of the currently highlighted item
     */
    triggerHighlightedItem: function triggerHighlightedItem() {
        var activeItem;
        if (this.menuItems[this.hoverIndex]) {
            activeItem = this.menuItems[this.hoverIndex];
            activeItem.getElement().trigger('click');
            this.closeMenu();

            // give back the focus
            this.$component.focus();
        }
    },

    /**
     * Set navigation type
     * @param {String} type - 'fromLast', 'fromFirst'
     */
    setNavigationType: function setNavigationType(type) {
        if (['fromLast', 'fromFirst'].includes(type)) {
            this.navType = type;
        }
    }
};

/**
 * The menu component factory
 */
export default function menuComponentFactory(specs, defaults) {
    var _defaults, menuComponent;

    _defaults = {
        $component: $(),
        $menuButton: $(),
        $menuContainer: $(),
        $menuContent: $(),
        $menuItems: $(),
        $menuStateIcon: $(),
        hoverIndex: null,
        id: null,
        menuItems: []
    };

    specs = _.defaults(specs || {}, menuComponentApi);

    menuComponent = componentFactory(specs, defaults)
        .setTemplate(menuTpl)
        .on('enable', function enable() {
            if (this.is('rendered')) {
                this.$component.removeProp('disabled');
            }
        })
        .on('disable', function disable() {
            if (this.is('rendered')) {
                this.$component.prop('disabled', true);
                this.closeMenu();
                this.turnOff();
            }
        })
        .on('hide', function disable() {
            if (this.is('rendered')) {
                this.closeMenu();
            }
        })
        .on('init', function init() {
            this.initMenu();
        })
        .on('render', function render() {
            var self = this;

            // get access to DOM elements
            this.$menuButton = this.$component.find(`[data-control="${this.config.control}-button"]`);
            this.$menuContainer = this.$component.find(`[data-control="${this.config.control}-menu"]`);
            this.$menuContent = this.$component.find(`[data-control="${this.config.control}-list"]`);
            this.$menuStateIcon = this.$menuButton.find('.icon-up');

            this.disable(); // always render disabled by default

            // add behavior
            this.$component.on('click', function toggleMenu(e) {
                e.preventDefault();

                if (!self.is('opened')) {
                    e.stopPropagation(); // prevent higher handler to auto-close the menu on click
                }
                self.toggleMenu();
            });

            this.$menuContainer.on('click', function closeMenuOnItemClick(e) {
                e.preventDefault();
                e.stopPropagation(); // so the menu doesn't get toggled again when the event bubble to the component
                self.closeMenu();
            });

            this.$menuContent.on('mouseleave', this.hoverOffAll);
        })
        .on('destroy', function() {
            if (this.is('rendered')) {
                this.$menuContainer.off('.menuNavigation');
                this.$menuButton.off('.menuNavigation');
            }
        });

    // Apply default properties to the menuComponent
    _.defaults(menuComponent, _defaults);

    return menuComponent;
}
