<li
    data-control="{{control}}"
    class="small btn-info action{{#if className}} {{className}}{{/if}}"
    title="{{title}}"
    role="button"
    {{#each aria}}
        aria-{{@key}}="{{this}}"
    {{/each}}
>
    <a class="li-inner" href="#" onclick="return false" aria-hidden="true" >
        {{#if icon}}<span class="icon icon-{{icon}}{{#unless text}} no-label{{/unless}}"></span>{{/if}}
        {{!-- text must be trusted HTML only (e.g. i18n __() ruby annotations). Do not pass user-controlled strings. --}}
        {{#if text}}<span class="text">{{{text}}}</span>{{/if}}
    </a>
</li>
