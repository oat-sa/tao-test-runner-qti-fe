{{#if displaySectionTitles}}
    <ul class="qti-navigator-parts plain">
        {{#each parts}}
        <li class="qti-navigator-part active">
            <ul aria-label="{{label}}" class="qti-navigator-sections plain">
                {{#each sections}}
                <li class="qti-navigator-section active">
                    <span class="qti-navigator-label" title="{{label}}">
                        <span class="qti-navigator-text">{{label}}</span>
                    </span>
                    <div class="review-panel-items"></div>
                </li>
                {{/each}}
            </ul>
        </li>
        {{/each}}
    </ul>
{{else}}
    <ul class="qti-navigator-parts plain">
        <li class="qti-navigator-part active">
            <ul class="qti-navigator-sections plain">
                <li class="qti-navigator-section active">
                   <div class="review-panel-items"></div>
                </li>
            </ul>
        </li>
    </ul>
{{/if}}
