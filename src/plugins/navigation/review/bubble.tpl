<li class="qti-navigator-item {{cls}}" data-id="{{id}}" data-position="{{position}}">
    {{debug}}
    <button
        class="qti-navigator-label step {{cls}} icon-{{icon}}"
        {{#if active}}class="current"{{/if}}
        aria-disabled="{{#if viewed}}false{{else}}true{{/if}}"
        {{#if active}}aria-current='location'{{/if}}
        role="link"
        aria-label="{{index}} of {{../stats.total}} {{icon}}">
        {{#if active}}<span class="{{#if active}}icon-indicator {{/if}}indicator" aria-hidden="true"></span>{{/if}}
        <span class="qti-navigator-icon icon-{{icon}}"></span>
        {{#unless flagged}}<span class="step-label" aria-hidden="true">{{position}}</span>{{/unless}}
    </button>
</li>
