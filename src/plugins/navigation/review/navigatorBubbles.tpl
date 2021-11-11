<ul class="qti-navigator-parts plain">
    {{#each parts}}
    <li class="qti-navigator-part active" data-id="{{id}}">
        <ul aria-label="{{label}}" class="qti-navigator-sections plain">
            {{#each sections}}
            <li class="qti-navigator-section active" data-id="{{id}}">
                <span class="qti-navigator-label" title="{{label}}">
                    <span class="qti-navigator-text">{{label}}</span>
                </span>
                <ul aria-label="{{label}}" class="qti-navigator-items plain">
                    {{#each items}}
                        <li class="qti-navigator-item {{cls}}" data-id="{{id}}" data-position="{{position}}">
                            <button
                                    class="qti-navigator-label step"
                                    {{#if active}}class="current"{{/if}}
                                    aria-disabled="{{#if viewed}}false{{else}}true{{/if}}"
                                    {{#if active}}aria-current='location'{{/if}}
                                    role="link"
                                    aria-label="{{numberTest}} of {{../../../total}} {{icon}}">
                                {{#if active}}<span class="{{#if active}}icon-indicator {{/if}}indicator" aria-hidden="true"></span>{{/if}}
                                <span class="qti-navigator-icon icon-{{icon}}" aria-hidden="true"></span>
                                <span class="step-label" aria-hidden="true">{{numberTest}}</span>
                            </button>
                        </li>
                    {{/each}}
                </ul>
            </li>
            {{/each}}
        </ul>
    </li>
    {{/each}}
</ul>
