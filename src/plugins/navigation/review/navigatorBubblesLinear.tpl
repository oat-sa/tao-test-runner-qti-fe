<ul class="qti-navigator-parts plain">
    <li class="qti-navigator-part active">
        <ul class="qti-navigator-sections plain">
            <li class="qti-navigator-section active">
                <ul class="qti-navigator-items plain">
                    {{#each parts}}
                        {{#each sections}}
                            {{#each items}}
                                <li class="qti-navigator-item {{cls}}" data-id="{{id}}" data-position="{{position}}">
                                    <button
                                            class="qti-navigator-label step"
                                            {{#if active}}class="current"{{/if}}
                                            aria-disabled="{{#if viewed}}false{{else}}true{{/if}}"
                                            {{#if active}}aria-current='location'{{/if}}
                                            role="link"
                                            aria-label="{{#if numberTest}}Question {{numberTest}}, {{/if}} {{icon}}">
                                        {{#if active}}<span class="{{#if active}}icon-indicator {{/if}}indicator" aria-hidden="true"></span>{{/if}}
                                        <span class="qti-navigator-icon icon-{{icon}}" aria-hidden="true"></span>
                                        <span class="step-label" aria-hidden="true">{{numberTest}}</span>
                                    </button>
                                </li>
                            {{/each}}
                        {{/each}}
                    {{/each}}
                </ul>
            </li>
        </ul>
    </li>
</ul>
