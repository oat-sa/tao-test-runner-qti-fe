<div class="connectivity-box {{state}}{{#if message}} with-message{{/if}}">
    <span class="message-connect">{{#if message}}{{__ 'Online'}}{{/if}}</span><span data-control="connectivity-connected" class="qti-controls icon-connect" title="{{__ 'Connected to server'}}"></span>
    <span class="message-disconnected">{{#if message}}{{__ 'Offline'}}{{/if}}</span><span data-control="connectivity-disconnected" class="qti-controls icon-disconnect" title="{{__ 'Disconnected from server'}}"></span>
</div>
