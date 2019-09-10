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
 * Copyright (c) 2017-2019 (original work) Open Assessment Technologies SA
 */
/**
 * @author Dieter Raber <dieter@taotesting.com>
 */
define([
    'taoTests/runner/runner',
    'taoQtiTest/test/runner/mocks/providerMock',
    'taoQtiTest/runner/plugins/tools/answerElimination/eliminator'
], function(runnerFactory, providerMock, eliminatorFactory) {
    'use strict';

    var providerName = 'mock';
    runnerFactory.registerProvider(providerName, providerMock());

    const sampleTestContext = {
        itemIdentifier : 'item-1'
    };
    const sampleTestMap = {
        parts: {
            p1 : {
                sections : {
                    s1 : {
                        items : {
                            'item-1' : {
                                categories: ['x-tao-option-eliminator']
                            }
                        }
                    }
                }
            }
        },
        jumps : [{
            identifier: 'item-1',
            section: 's1',
            part: 'p1',
            position: 0
        }]
    };

    QUnit.module('eliminatorFactory');

    QUnit.test('module', function(assert) {
        assert.ok(typeof eliminatorFactory === 'function', 'Module exposes a function');
    });

    QUnit.module('Eliminator Mode');

    QUnit.test('Toggle eliminator mode on/off', function(assert) {
        var ready = assert.async();
        var runner = runnerFactory(providerName);
        var areaBroker = runner.getAreaBroker();
        var eliminator = eliminatorFactory(runner, areaBroker);
        var interaction = document.querySelector('.qti-choiceInteraction');

        runner.setTestContext(sampleTestContext);
        runner.setTestMap(sampleTestMap);

        areaBroker.getContentArea().append(interaction);
        eliminator.init().then(function() {
            runner.trigger('renderitem');
            runner.trigger('tool-eliminator-toggle');
            assert.ok(interaction.classList.contains('eliminable'), 'Class "eliminable" has been added');
            runner.trigger('tool-eliminator-toggle');
            assert.ok(!interaction.classList.contains('eliminable'), 'Class "eliminable" has been removed');
            ready();
        });
    });
});
