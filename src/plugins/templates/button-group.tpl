<li data-control="{{control}}" class="small btn-info btn-group action">
	{{#each buttons}}
	<span class="li-inner" title="{{title}}" data-key="{{@key}}">
		{{#if icon}}<span class="icon icon-{{icon}}{{#unless text}} no-label{{/unless}}"></span>{{/if}}
		{{#if text}}<span class="text">{{text}}</span>{{/if}}
	</span>
	{{/each}}
</li>
