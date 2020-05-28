<div class="shortcuts-list-wrapper">
    <div class="shortcuts-list" role="dialog" aria-modal="true" aria-labelledby="jumplinks/shortcuts-heading"
        aria-describedby="jumplinks/shortcuts-description">
        <h3 class="shortcuts-list-title" id="jumplinks/shortcuts-heading">
            {{__ "Keyboard Navigation"}}
        </h3>
        <div id="jumplinks/shortcuts-description">
            <p class="shortcuts-list-description">
                {{__ "Keyboard shortcuts for the Accessibility Tools are available to the Test-taker."}}
            </p>
            <p class="shortcuts-list-description">
                {{__ "You can magnify the content by op to 200%. Check your browser settings to find out how to do it."}}
            </p>
        </div>
        {{#each shortcutsGroups}}
            <div class="shortcuts-group-wrapper">
                <h4 class="shortcuts-group">{{label}}</h4>
                <ul class="shortcuts-group-list">
                    {{#each shortcuts}}
                        <li
                            class="shortcut-item"
                        >
                            <span><kbd>{{shortcut}}</kbd></span>
                            <span>{{label}}</span>
                        </li>
                    {{/each}}
                    <!-- Other terms and descriptions -->
                </ul>
            </div>
        {{/each}}
        {{#each shortcutsGroups}}
            <div class="shortcuts-group-wrapper">
                <h4 class="shortcuts-group">{{label}}</h4>
                <ul class="shortcuts-group-list">
                    {{#each shortcuts}}
                        <li
                            class="shortcut-item"
                        >
                            <span
                                aria-label="{{__ "Shortcut"}}: {{shortcut}}. {{__ "Action"}}: {{label}}."
                            >
                                <kbd aria-hidden="true">{{shortcut}}</kbd>
                            </span>
                            <span aria-hidden="true">{{label}}</span>
                        </li>
                    {{/each}}
                    <!-- Other terms and descriptions -->
                </ul>
            </div>
        {{/each}}
        {{#each shortcutsGroups}}
            <div class="shortcuts-group-wrapper">
                <h4 class="shortcuts-group">{{label}}</h4>
                <dl class="shortcuts-group-list">
                    {{#each shortcuts}}
                        <div
                            aria-labelledby="{{id}}-term {{id}}-definition"
                            class="shortcut-item"
                        >
                            <dt id="{{id}}-term"><kbd>{{shortcut}}</kbd></dt>
                            <dd id="{{id}}-definition">{{label}}</dd>
                        </div>
                    {{/each}}
                    <!-- Other terms and descriptions -->
                </dl>
            </div>
        {{/each}}
        {{#each shortcutsGroups}}
            <div class="shortcuts-table-wrapper">
                <h4 class="shortcuts-table-title">{{label}}</h4>
                <table class="shortcuts-table">
                    <thead>
                        <tr>
                            <th class="shortcuts-table-head-cell" scope="col">{{__ "Shortcut"}}</th>
                            <th class="shortcuts-table-head-cell" scope="col">{{__ "Action"}}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each shortcuts}}
                            <tr
                                class="shortcuts-table-row"
                            >
                                <td
                                    class="shortcuts-table-cell"
                                >
                                    <kbd>
                                        {{shortcut}}
                                    </kbd>
                                </td>
                                <td
                                    class="shortcuts-table-cell"
                                >
                                    {{label}}
                                </td>
                            </tr>
                        {{/each}}
                    </tbody>
                </table>
            </div>
        {{/each}}
        <button aria-label="Close dialog" class="btn-close small" data-control="close-btn" type="button">
            <span class="icon-close"></span>
        </button>
    </div>
</div>
