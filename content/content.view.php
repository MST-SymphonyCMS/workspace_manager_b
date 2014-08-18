<?php

require_once TOOLKIT . '/class.administrationpage.php';
require_once EXTENSIONS . '/workspace_manager_b/lib/class.path_object.php';

class contentExtensionWorkspace_manager_bView extends AdministrationPage
{
    static $assets_base_url;
    public $content_base_url;
    public $extension_base_url;
    public $_errors = array();
    public $_existing_file;

    public function __construct()
    {
        self::$assets_base_url = URL . '/extensions/workspace_manager_b/assets/';
        parent::__construct();
    }
    
    public function view()
    {
        $this->addScriptToHead(self::$assets_base_url . 'jquery.tmpl.js');
        parent::view();
    }

    public function __viewIndex()
    {
        $path = $this->_context[1];
        if ($path) {
            $path_abs = WORKSPACE . '/' . $path;
            $path_obj = new PathObject($path);
        } else {
            $path_abs = WORKSPACE;
        }
        //if(!file_exists($path_abs)) Administration::instance()->errorPageNotFound();
        if (!is_dir($path_abs)) Administration::instance()->errorPageNotFound();
        self::$assets_base_url = URL . '/extensions/workspace_manager_b/assets/';
        $this->addStylesheetToHead(self::$assets_base_url . 'workspace.css');
        $this->addScriptToHead(self::$assets_base_url . 'workspace.js');
        $this->setTitle(__('%1$s &ndash; %2$s', array(__('Workspace'), __('Symphony'))));
        $this->setPageType('table');
        $workspace_url = SYMPHONY_URL . '/workspace/manager/';
        $editor_url = SYMPHONY_URL . '/workspace/editor/';

        if (isset($path_obj)) {
            $path_encoded = $path_obj->getPathEncoded();
            $workspace_url .= $path_encoded . '/';
            $editor_url .= $path_encoded . '/';
            $path_parts = $path_obj->getPathParts();
            $subheading = Helpers::capitalizeWords(array_pop($path_parts));
            $path_string = SYMPHONY_URL . '/workspace/manager/';
            $breadcrumbs = array(Widget::Anchor(__('Workspace'), $path_string));
            $parts_encoded = $path_obj->getPathPartsEncoded();
            foreach ($path_parts as $path_part) {
                $path_string .= current($parts_encoded) . '/';
                array_push($breadcrumbs, Widget::Anchor(__(Helpers::capitalizeWords($path_part)), $path_string));
                next($parts_encoded);
            }
        } else {
            $subheading = 'Workspace';
        }

        $this->appendSubheading(__($subheading));
        $this->insertAction(
            new XMLElement('button', __('Show Create/Upload'), array('type' => 'button', 'name' => 'show.create_upload'))
        );
        $this->insertAction(
            Widget::Anchor(__('Create New File'), $editor_url, __('Create a new text file'), 'create button')
        );
        if ($breadcrumbs) $this->insertBreadcrumbs($breadcrumbs);

        $create_upload = new XMLElement('div', NULL, array('id' => 'create-upload'));
        $fieldset = new XMLElement('fieldset', NULL, array('class' => 'create-dirs'));
        $fieldset->appendChild(new XMLElement('legend', __('Create Directories'), array()));
        $div = new XMLElement('div');
        $div->appendChild(new XMLElement('label', __('Enter directory names on separate lines')));
        $div->appendChild(
            new XMLElement('textarea', null, array('name' => 'directory_names'))
        );
        $div->appendChild(
            new XMLElement('button', __('Create'), array('type' => 'button', 'name' => 'create.directories', 'disabled' => 'disabled'))
        );
        $div->appendChild(
            new XMLElement('button', __('Clear'), array('type' => 'button', 'name' => 'clear.directories', 'disabled' => 'disabled'))
        );
        $fieldset->appendChild($div);
        $create_upload->appendChild($fieldset);

        // File uploads fieldset.

        $fieldset = new XMLElement('fieldset', NULL, array('class' => 'table upload-queue'));
        $fieldset->appendChild(new XMLElement('legend', __('Upload Files')));
        $fieldset->appendChild(
            Widget::Table(
                Widget::TableHead(
                    array(
                        array(__('Name'), 'col'),
                        array(__('Size (Bytes)'), 'col'),
                        array(__('Status'), 'col')
                    )
                ),
                NULL,
                new XMLElement(
                    'tbody',
                    NULL,
                    array('data-tmpl' => 'tmpl-uploads', 'data-data' => 'uploads')
                ),
                'selectable',
                NULL,
                array('data-interactive' => 'data-interactive')
            )
        );
        $buttons = new XMLElement('div', NULL, array('class' => 'upload-queue-buttons'));
        $buttons->appendChild(
            new XMLElement('button', __('Add Files'), array('type' => 'button', 'name' => 'add_files.uploads'))
        );
        $shim = new XMLElement('div', NULL, array('id' => 'aftb'));
        $shim->appendChild(
            Widget::Input('add-files-true-button', '', 'file', array('multiple' => 'multiple'))
        );
        $buttons->appendChild($shim);

        $buttons->appendChild(
            new XMLElement('button', __('Upload'), array('type' => 'button', 'name' => 'upload.uploads', 'disabled' => 'disabled'))
        );
        $buttons->appendChild(
            new XMLElement('button', __('Cancel'), array('type' => 'button', 'name' => 'cancel.uploads', 'disabled' => 'disabled'))
        );
        $fieldset->appendChild($buttons);
        $create_upload->appendChild($fieldset);
        $this->Form->appendChild($create_upload);

        // Directories fieldset.
        $fieldset = new XMLElement('fieldset', NULL, array('class' => 'table'));
        $fieldset->appendChild(new XMLElement('legend', __('Directories')));
        $fieldset->appendChild(
            Widget::Table(
                Widget::TableHead(
                    array(
                        array(__('Name'), 'col')
                    )
                ),
                NULL,
                new XMLElement(
                    'tbody',
                    NULL,
                    array('data-tmpl' => 'tmpl-directories', 'data-data' => 'directories')
                ),
                'selectable',
                NULL,
                array('data-interactive' => 'data-interactive')
            )
        );
        $this->Form->appendChild($fieldset);

        // Files fieldset.

        $fieldset = new XMLElement('fieldset', NULL, array('class' => 'table'));
        $fieldset->appendChild(
            new XMLElement('legend', __('Files'))
        );
        
        $fieldset->appendChild(
            Widget::Table(
                Widget::TableHead(
                    array(
                        array(__('Name'), 'col'),
                        array(__('Size (Bytes)'), 'col'),
                        array(__('Last Updated'), 'col')
                    )
                ),
                NULL,
                new XMLElement(
                    'tbody',
                    NULL,
                    array('data-tmpl' => 'tmpl-files', 'data-data' => 'files')
                ),
                'selectable',
                NULL,
                array('data-interactive' => 'data-interactive')
            )
        );
        $this->Form->appendChild($fieldset);

        $this->Form->appendChild(
            new XMLElement(
                'div',
                Widget::Apply(
                    array(
                        array(NULL, false, __('With Selected...')),
                        array('delete', false, __('Delete'), 'confirm', NULL, array('data-message' => "Are you sure you want to delete the selected files?")),
                        array('download', false, __('Download'))
                    )
                ),
                array('class' => 'actions')
            )
        );

        // jQuery templates.

        ob_start();
        include EXTENSIONS . '/workspace_manager_b/content/tmpl.indexview.directories.php';
        $this->Contents->appendChild(
            new XMLElement(
                'script',
                __(PHP_EOL . ob_get_contents() . PHP_EOL),
                array('id' => 'tmpl-directories', 'type' => 'text/x-jquery-tmpl')
            )
        );
        ob_clean();
        include EXTENSIONS . '/workspace_manager_b/content/tmpl.indexview.files.php';
        $this->Contents->appendChild(
            new XMLElement(
                'script',
                __(PHP_EOL . ob_get_contents() . PHP_EOL),
                array('id' => 'tmpl-files', 'type' => 'text/x-jquery-tmpl')
            )
        );
        ob_clean();
        include EXTENSIONS . '/workspace_manager_b/content/tmpl.indexview.uploads.php';
        $this->Contents->appendChild(
            new XMLElement(
                'script',
                __(PHP_EOL . ob_get_contents() . PHP_EOL),
                array('id' => 'tmpl-uploads', 'type' => 'text/x-jquery-tmpl')
            )
        );
        ob_end_clean();
    }

    public function __actionIndex()
    {
        $path = $this->_context[1];
        if ($path) {
            $path_abs = WORKSPACE . '/' . $path;
        } else {
            $path_abs = WORKSPACE;
        }
        //if(!is_dir($path_abs)) Administration::instance()->errorPageNotFound();

        $checked = (is_array($_POST['items'])) ? array_keys($_POST['items']) : null;
        if (is_array($checked) && !empty($checked)) {
            if ($_POST['with-selected'] == 'download') {
                $name = $checked[0];
                $file = $path_abs . '/' . $name;
                if (is_file($file)) {
                    header('Content-Description: File Transfer');
                    header('Content-Type: application/octet-stream');
                    header('Content-Disposition: attachment; filename=' . $name);
                    header('Content-Transfer-Encoding: binary');
                    header('Expires: 0');
                    header('Cache-Control: must-revalidate');
                    header('Pragma: public');
                    header('Content-Length: ' . filesize($file));
                    ob_clean();
                    flush();
                    readfile($file);
                    exit;
                }
            }
        }
    }

    /*
    * File page view.
    */
    public function __viewEdit()
    {
        $this->_context[2] = 'single';
        $this->addStylesheetToHead(self::$assets_base_url . 'editor.css');
        $this->addScriptToHead(self::$assets_base_url . 'editor.js');
        $filepath = EXTENSIONS . '/workspace_manager_b/assets/highlighters/';
        $entries = scandir($filepath);
        foreach ($entries as $entry) {
            if (is_file($filepath . $entry)) {
                $info = pathinfo($filepath . $entry);
                if ($info['extension'] == 'css' and $info['filename'] != '') {
                    $this->addStylesheetToHead(self::$assets_base_url . 'highlighters/' . $info['basename'], 'screen');
                } elseif ($info['extension'] == 'js' and $info['filename'] != '') {
                    Administration::instance()->Page->addScriptToHead(self::$assets_base_url . 'highlighters/' . $info['basename']);
                }
            }		
        }

        $path = $this->_context[1];
        if ($path) {
            $path_abs = WORKSPACE . '/' . $path;
            if (is_file($path_abs)) {
                $filename = basename($path);
                $this->_existing_file = $filename;
                $title = $filename;
                if (dirname($path_abs) !== WORKSPACE) {
                    $path_obj = new PathObject(dirname($path));
                }
            } else {
                $path_obj = new PathObject($path);
            }		
        } else {
            $path_abs = WORKSPACE;
        }

        if (!$filename) {
            $title = 'Untitled';
        }

        $this->setTitle(__(('%1$s &ndash; %2$s &ndash; %3$s'), array($title, __('Workspace'), __('Symphony'))));

        //$this->setPageType('table');
        $this->Body->setAttribute('spellcheck', 'false');
        $this->appendSubheading($title);

        $workspace_url = SYMPHONY_URL . '/workspace/manager/';
        $editor_url = SYMPHONY_URL . '/workspace/editor/';

        $path_string = SYMPHONY_URL . '/workspace/manager/';
        $breadcrumbs = array(Widget::Anchor(__('Workspace'), $path_string));
        if (isset($path_obj)) {
            $dir_path = $path_obj->getPath() . '/';
            $dir_path_encoded = $path_obj->getPathEncoded() . '/';
            $workspace_url .= $dir_path_encoded;
            $editor_url .= $dir_path_encoded;
            $path_parts = $path_obj->getPathParts();
            $parts_encoded = $path_obj->getPathPartsEncoded();
            foreach ($path_parts as $path_part) {
                $path_string .= current($parts_encoded) . '/';
                array_push($breadcrumbs, Widget::Anchor(__(Helpers::capitalizeWords($path_part)), $path_string));
                next($parts_encoded);
            }
        }
        $this->insertBreadcrumbs($breadcrumbs);

        $this->Form->setAttribute('class', 'two columns');
        $this->Form->setAttribute('action', $editor_url . $path_encoded . (isset($filename) ? rawurlencode($filename) . '/' : ''));

        $fieldset = new XMLElement('fieldset');
        //$fieldset->setAttribute('class', 'primary column');
        $fieldset->appendChild(
            Widget::Input('fields[existing_file]', $filename, 'hidden', array('id' => 'existing_file'))
        );
        $fieldset->appendChild(
            Widget::Input('fields[dir_path]', $dir_path, 'hidden', array('id' => 'dir_path'))
        );
        $fieldset->appendChild(
            Widget::Input('fields[dir_path_encoded]', $dir_path_encoded, 'hidden', array('id' => 'dir_path_encoded'))
        );

        $label = Widget::Label(__('Name'));
        $label->appendChild(Widget::Input('fields[name]', $filename));
        $fieldset->appendChild($label);
        //$fieldset->appendChild((isset($this->_errors['name']) ? Widget::Error($label, $this->_errors['name']) : $label));

        $label = Widget::Label(__('Body'));
        $label->appendChild(
            Widget::Textarea(
                'fields[body]',
                30,
                100,
                //$this->_existing_file ? @file_get_contents($path_abs, ENT_COMPAT, 'UTF-8') : '',
                $filename ? htmlentities(file_get_contents($path_abs), ENT_COMPAT, 'UTF-8') : '',
                array('id' => 'text-area', 'class' => 'code hidden')
            )
        );
        //$label->appendChild();
        //$fieldset->appendChild((isset($this->_errors['body']) ? Widget::Error($label, $this->_errors['body']) : $label));

        $fieldset->appendChild($label);
        $this->Form->appendChild($fieldset);

        if (!$this->_existing_file) {
            $actions = new XMLElement('div', NULL, array('class' => 'actions'));
            // Add 'create' button
            $actions->appendChild(
                Widget::Input(
                    'action[save]',
                    __('Create File'),
                    'submit',
                    array('class' =>'button', 'accesskey' => 's')
                )
            );
            $this->Form->appendChild($actions);
        }

        $actions = new XMLElement('div', NULL, array('class' => 'actions'));
        if (!$this->_existing_file) {
            $actions->setAttribute('data-replacement-actions', '1');
        }

        $actions->appendChild(
            Widget::Input(
                'action[save]',
                __('Save Changes'),
                'submit',
                array('class' => 'button', 'accesskey' => 's')
            )
        );
        $actions->appendChild(
            new XMLELement(
                'button',
                __('Delete'),
                array(
                    'name' => 'action[delete]',
                    'type' => 'submit',
                    'class' => 'button confirm delete',
                    'title' => 'Delete this file',
                    'accesskey' => 'd',
                    'data-message' => 'Are you sure you want to delete this file?'
                )
            )
        );

        $this->Form->appendChild($actions);

        $text = new XMLElement('p', __('Saving'));
        $this->Form->appendChild(new XMLElement('div', $text, array('id' => 'saving-popup')));
    }

    public function __actionEdit()
    {
        if (isset($_POST['action']['delete']) and isset($_POST['fields'])) {
            $fields = $_POST['fields'];
            @unlink(WORKSPACE . '/' . $fields['dir_path'] . $fields['existing_file']);
            redirect(SYMPHONY_URL . '/workspace/manager/' . $fields['dir_path_encoded']);
        }
    }

    /*
    * View for page template editor.
    */
    public function __viewTemplate()
    {
        $this->_context[2] = 'single';
        $this->addStylesheetToHead(self::$assets_base_url . 'editor.css');
        $this->addStylesheetToHead(self::$assets_base_url . 'highlighters/highlight-xsl.css');
        $this->addScriptToHead(self::$assets_base_url . 'editor.js');
        $this->addScriptToHead(self::$assets_base_url . 'highlighters/highlight-xsl.js');
        $name = $this->_context[1];
        $filename = $name . '.xsl';
        $title = $filename;
        $this->setTitle(__(('%1$s &ndash; %2$s &ndash; %3$s'), array($title, __('Pages'), __('Symphony'))));
        //$this->setPageType('table');
        $this->Body->setAttribute('spellcheck', 'false');
        $this->appendSubheading($title);
        $breadcrumbs = array(
            Widget::Anchor(__('Pages'), SYMPHONY_URL . '/blueprints/pages/'),
            new XMLElement('span', __(Helpers::capitalizeWords($name)))
        );
        $this->insertBreadcrumbs($breadcrumbs);
        
        $this->insertAction(
            Widget::Anchor(
                __('Edit Page'), 
                SYMPHONY_URL . '/blueprints/pages/edit/' . PageManager::fetchIDFromHandle($name) . '/',
                __('Edit Page Configuration'),
                'button'
            )
        );

        $this->Form->setAttribute('class', 'columns');
        $this->Form->setAttribute('action', SYMPHONY_URL . '/blueprints/pages/' . $name . '/');

        $fieldset = new XMLElement('fieldset');
        $fieldset->appendChild(Widget::Input('fields[name]', $filename, 'hidden'));
        $fieldset->appendChild($label);
        //$fieldset->appendChild((isset($this->_errors['name']) ? Widget::Error($label, $this->_errors['name']) : $label));

        $label = Widget::Label(__('Body'));
        $label->appendChild(
            Widget::Textarea(
                'fields[body]',
                30,
                100,
                $filename ? htmlentities(file_get_contents(WORKSPACE . '/pages/' . $filename), ENT_COMPAT, 'UTF-8') : '',
                array('id' => 'text-area', 'class' => 'code hidden')
            )
        );
        //$fieldset->appendChild((isset($this->_errors['body']) ? Widget::Error($label, $this->_errors['body']) : $label));

        $fieldset->appendChild($label);
        $this->Form->appendChild($fieldset);

        $this->Form->appendChild(
            new XMLElement(
                'div',
                new XMLElement('p', __('Saving')),
                array('id' => 'saving-popup')
            )
        );
        //$this->_context = array('edit', 'pages', 'single');
        $this->Form->appendChild(
            new XMLElement(
                'div',
                Widget::Input(
                    'action[save]',
                    __('Save Changes'),
                    'submit',
                    array('class' => 'button', 'accesskey' => 's')
                ),
                array('class' => 'actions')
            )
        );
    }
}
?>