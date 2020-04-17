<main class="test-runner-scope">
    <div class="action-bar content-action-bar horizontal-action-bar top-action-bar">
        <nav class="jump-links-box" aria-label="{{__ "Jump Menu"}}">
            <ul>
                <li data-control="jump-link-question">
                    <a role="button" class="jump-link-question" href="#">{{__ "Jump to:"}} <b>{{__ "Question"}}</b></a>
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
            <div class="shortcuts-list-wrapper hidden">
                <div class="shortcuts-list">
                    <h1 id="keyboard-navigation">Keyboard Navigation</h1>
                    <blockquote>
                        <p>Keyboard shortcuts for the Accessibility Tools are available to the Test-taker.</p>
                    </blockquote>
                    <p>The set of keyboard shortcuts provided is as follows:</p>
                    <table>
                        <thead>
                        <tr>
                            <th><strong>Tool</strong></th>
                            <th>Action</th>
                            <th style="text-align: right;">Shortcut</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td><strong>Next Item</strong></td>
                            <td></td>
                            <td style="text-align: right;">J</td>
                        </tr>
                        <tr>
                            <td><strong>Previous Item</strong></td>
                            <td></td>
                            <td style="text-align: right;">K</td>
                        </tr>
                        <tr>
                            <td><strong>Answer Masking</strong></td>
                            <td>Toggle</td>
                            <td style="text-align: right;">D</td>
                        </tr>
                        <tr>
                            <td><strong>Area Masking</strong></td>
                            <td>Toggle</td>
                            <td style="text-align: right;">Y</td>
                        </tr>
                        <tr>
                            <td><strong>Calculator</strong></td>
                            <td>Toggle</td>
                            <td style="text-align: right;">C</td>
                        </tr>
                        <tr>
                            <td><strong>Highlighter</strong></td>
                            <td>Toggle</td>
                            <td style="text-align: right;">Shift + U</td>
                        </tr>
                        <tr>
                            <td><strong>Line Reader</strong></td>
                            <td>Toggle</td>
                            <td style="text-align: right;">G</td>
                        </tr>
                        <tr>
                            <td><strong>Magnifier</strong></td>
                            <td>Toggle</td>
                            <td style="text-align: right;">L</td>
                        </tr>
                        <tr>
                            <td><strong>Magnifier</strong></td>
                            <td>In</td>
                            <td style="text-align: right;">Shift + I</td>
                        </tr>
                        <tr>
                            <td><strong>Magnifier</strong></td>
                            <td>Out</td>
                            <td style="text-align: right;">Shift + O</td>
                        </tr>
                        <tr>
                            <td><strong>Magnifier</strong></td>
                            <td>Close</td>
                            <td style="text-align: right;">Esc</td>
                        </tr>
                        <tr>
                            <td><strong>Zoom</strong></td>
                            <td>In</td>
                            <td style="text-align: right;">I</td>
                        </tr>
                        <tr>
                            <td><strong>Zoom</strong></td>
                            <td>Out</td>
                            <td style="text-align: right;">O</td>
                        </tr>
                        </tbody>
                    </table>
                </div>
            </div>
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
