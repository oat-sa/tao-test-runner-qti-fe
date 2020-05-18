<nav class="jump-links-box" aria-label="{{__ "Jump Menu"}}">
    <ul>
        <li class="jump-link-item">
            <button data-jump="question" class="jump-link" >{{__ "Jump to:"}} <b>{{__ "Question"}} - {{__ questionStatus}}</b></button>
        </li>
        <li class="jump-link-item">
            <button data-jump="navigation" class="jump-link" >{{__ "Jump to:"}} <b>{{__ "Navigation"}}</b></button>
        </li>
        <li class="jump-link-item">
            <button data-jump="toolbox" class="jump-link" >{{__ "Jump to:"}} <b>{{__ "Toolbox"}}</b></button>
        </li>
        {{#if isReviewPanelEnabled}}
        <li class="jump-link-item">
            <button data-jump="teststatus" class="jump-link" >{{__ "Jump to:"}} <b>{{__ "Test Status and Structure"}}</b></button>
        </li>
        {{/if}}
        <li class="jump-link-item">
            <button data-jump="shortcuts" class="jump-link" >{{__ "Open Keyboard Shortcuts"}}</button>
        </li>
    </ul>
</nav>