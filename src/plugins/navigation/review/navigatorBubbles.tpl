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
                        {{>bubbleButton}}
                    {{/each}}
                </ul>
            </li>
            {{/each}}
        </ul>
    </li>
    {{/each}}
</ul>
