<main class="test-runner-scope">
    <div class="action-bar content-action-bar horizontal-action-bar top-action-bar">
        <nav class="jump-links-box" aria-label="{{__ "Jump Menu"}}">
            <ul>
                <li data-control="jump-link-question">
                    <a role="button" class="jump-link-question"" href="#">{{__ "Jump to:"}} <b>{{__ "Question"}}</b></a>
                </li>
                <li data-control="jump-link-navigation">
                    <a role="button" class="jump-link-navigation" href="#">{{__ "Jump to:"}} <b>{{__ "Navigation"}}</b></a>
                </li>
                <li data-control="jump-link-toolbox">
                    <a role="button" class="jump-link-toolbox" href="#">{{__ "Jump to:"}} <b>{{__ "Toolbox"}}</b></a>
                </li>
                <li data-control="jump-link-teststatus">
                    <a role="button" class="jump-link-teststatus" href="#">{{__ "Jump to:"}} <b>{{__ "Test Status and Structure"}}</b></a>
                </li>
                <li data-control="jump-link-shortcuts">
                    <a role="button" class="jump-link-shortcuts" href="#">{{__ "Open Keyboard Shortcuts"}}</a>
                </li>
            </ul>
        </nav>
        <div class="control-box size-wrapper"></div>
    </div>

    <div class="test-runner-sections">

        <aside class="test-sidebar test-sidebar-left" aria-labelledby="test-sidebar-left-header">
            <h2 id="test-sidebar-left-header" class="landmark-title--hidden">{{__ 'Test status and review structure'}}</h2>
        </aside>

        <section class="content-wrapper">
            <div id="qti-content"></div>
        </section>
    </div>

    <div class="action-bar content-action-bar horizontal-action-bar bottom-action-bar">
        <div class="control-box size-wrapper">
            <aside class="lft tools-box" aria-labelledby="toolboxheader">
              <h2 id="toolboxheader" class="landmark-title--hidden">{{__ "Tool box and flagging for review"}}</h2>
            </aside>
            <nav class="rgt navi-box" aria-labelledby="navheader">
                <h2 id="navheader" class="landmark-title--hidden">{{__ "Main navigation"}}</h2>
                <ul class="plain navi-box-list"></ul>
            </div>
        </div>
    </div>

</main>
