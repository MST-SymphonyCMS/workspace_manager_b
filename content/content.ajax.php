<?php

class contentExtensionWorkspace_manager_bAjax
{
    private $_context;
    private $_output;
    public $_errors;
    private $error_occurred;

    public function __construct()
    {
        $this->_output = array();
        $this->error_occurred = false;
    }

    public function build(array $context = array())
    {
        $this->_context = $context;
        $function = '__ajax' . ucfirst($context[0]);
        if (method_exists($this, $function)) {
            $this->$function();
        }
    }

    public function __ajaxIndex()
    {
        $context = $this->_context;
        $path_abs = WORKSPACE;
        if (isset($context[1])){
            $path_abs .= '/' . $context[1];
        }
        if (isset($_FILES['uploaded_file'])) {
            move_uploaded_file($_FILES['uploaded_file']['tmp_name'], 'workspace/' . $context[1] . '/' . $_FILES['uploaded_file']['name']);
        } elseif (isset($_POST['action'])) {
            $fields = $_POST['fields'];
            switch ($_POST['action']) {
                case 'create-dir':
                    foreach ($fields['names'] as $name) {
                        if ($name != '') @mkdir($path_abs . '/' . $name);
                    }
                    break;
            }
        } elseif (isset($_POST['with-selected'])) {
            $checked = (is_array($_POST['items'])) ? array_keys($_POST['items']) : null;
            if (is_array($checked) && !empty($checked)) {
                switch ($_POST['with-selected']) {
                    case 'delete':
                        //$canProceed = true;
                        foreach ($checked as $name) {
                            $file = $path_abs . '/' . $name;
                            if (is_dir($file)) @rmdir($file);
                            if (is_file($file)) @unlink($file);
/*							if(preg_match('/\/$/', $name) == 1){
                                $name = trim($name, '/');
                                try {
                                    rmdir($dir_abs . '/' . $name);
                                }
                                catch(Exception $ex) {
                                    $this->pageAlert(
                                        __('Failed to delete %s.', array('<code>' . $name . '</code>'))
                                        . ' ' . __('Directory %s not empty or permissions are wrong.', array('<code>' . $name . '</code>'))
                                        , Alert::ERROR
                                    );
                                    $canProceed = false;
                                }
                            }
                            elseif(!General::deleteFile($dir_abs . '/'. $name)) {
                                $this->pageAlert(
                                    __('Failed to delete %s.', array('<code>' . $name . '</code>'))
                                    . ' ' . __('Please check permissions on %s.', array('<code>/workspace/' . $this->_context['target_d'] . '/' . $name . '</code>'))
                                    , Alert::ERROR
                                );
                                $canProceed = false;
                            }*/
                        }

                        //if ($canProceed) redirect(Administration::instance()->getCurrentPageURL());
                        break;
                }
            }
        }
        $format = Symphony::Configuration()->get('date_format', 'region') . ' ' . Symphony::Configuration()->get('time_format', 'region');
        $directories = array();
        $files = array();

        foreach (new DirectoryIterator($path_abs) as $file) {
            if ($file->isDot()) continue;
            if ($file->isDir()) {
                $directories[] = array('name' => $file->getFilename());
            } else {
                $files[] = array(
                    'name' => $file->getFilename(),
                    'size' => $file->getSize(),
                    'modified' => date($format, $file->getMTime())
                );
            }
        }

        $this->_output['directories'] = $directories;
        $this->_output['files'] = $files;
    }

    /*
    * Editor Page.
    */
    public function __ajaxEdit()
    {
        $context = $this->_context;

        if (isset($_POST['action']['save']) and isset($_POST['fields'])){
            $fields = $_POST['fields'];
            $existing_file = $fields['existing_file'];
            $specified_file = $fields['name'];
            $dir_abs = WORKSPACE . '/' . $fields['dir_path'];
            $create_file = ($specified_file !== $existing_file);

            if ($create_file) {
                if (is_file($dir_abs . $specified_file)) {
                    $this->_output['alert_type'] = 'error';
                    $this->_output['alert_msg'] = __('A file with that name already exists. Please choose another.');
                    $this->error_occurred = true;
                }
            }

            if( !($this->error_occurred)){
                if ($create_file){
                    /**
                    * Just before the file has been created
                    *
                    * @delegate UtilityPreCreate
                    * @since Symphony 2.2
                    * @param string $context
                    * '/blueprints/css/'
                    * @param string $file
                    *  The path to the Utility file
                    * @param string $contents
                    *  The contents of the `$fields['body']`, passed by reference
                    */
                    //Symphony::ExtensionManager()->notifyMembers('FilePreCreate', '/assets/' . $this->category . '/', array('file' => $file, 'contents' => &$fields['body']));
                } else {
                    /**
                    * Just before the file has been updated
                    *
                    * @delegate UtilityPreEdit
                    * @since Symphony 2.2
                    * @param string $context
                    * '/blueprints/css/'
                    * @param string $file
                    *  The path to the Utility file
                    * @param string $contents
                    *  The contents of the `$fields['body']`, passed by reference
                    */
                    //Symphony::ExtensionManager()->notifyMembers('FilePreEdit', '/assets/' . $this->category . '/', array('file' => $file, 'contents' => &$fields['body']));
                }

                // Write the file
                if (!$write = General::writeFile($dir_abs . $specified_file, $fields['body'], Symphony::Configuration()->get('write_mode', 'file'))) {
                    $this->_output['alert_type'] = 'error';
                    $this->_output['alert_msg'] = __('File could not be written to disk. Please check permissions.');
                    /*$this->_output['alert_msg'] = __('File could not be written to disk.')
                        . ' ' . __('Please check permissions on %s.', array('<code>/workspace/' . '' . '</code>'));*/
                } else {
                // Write Successful
                    $path_encoded = $fields['dir_path_encoded'];
                    $this->_output['alert_type'] = 'success';
                    $workspace_url = SYMPHONY_URL . '/workspace/manager/' . $path_encoded;
                    $editor_url = SYMPHONY_URL . '/workspace/editor/' . $path_encoded;
                    $time = Widget::Time();
                    // Remove any existing file if the filename has changed
                    if ($create_file) {
                        if ($existing_file) {
                            General::deleteFile($dir_abs . $existing_file);
                        }

                        $this->_output['new_filename'] = $specified_file;
                        $this->_output['new_filename_encoded'] = rawurlencode($specified_file);

                        $this->_output['alert_msg'] =
                            __('File created at %s.', array($time->generate()))
                            . ' <a href="' . $editor_url . '" accesskey="c">'
                            . __('Create another?')
                            . '</a> <a href="' . $workspace_url . '" accesskey="a">'
                            . __('View current directory')
                            . '</a>';
                    } else {
                        $this->_output['alert_msg'] =
                            __('File updated at %s.', array($time->generate()))
                            . ' <a href="' . $editor_url . '" accesskey="c">'
                            . __('Create another?')
                            . '</a> <a href="' . $workspace_url . '" accesskey="a">'
                            . __('View current directory')
                            . '</a>';
                    }
                }
            }
        }
    }

    public function __ajaxTemplate()
    {
        $fields = $_POST['fields'];
        if (!$write = General::writeFile(WORKSPACE . '/pages/' . $fields['name'], $fields['body'], Symphony::Configuration()->get('write_mode', 'file'))){
            $this->_output['alert_type'] = 'error';
            $this->_output['alert_msg'] = __('File could not be written to disk. Please check permissions.');
        } else {
            $time = Widget::Time();
            $this->_output['alert_type'] = 'success';
            $this->_output['alert_msg'] =
                __('Page updated at %s.', array($time->generate()))
                . ' <a href="' . SYMPHONY_URL . '/blueprints/pages/new/" accesskey="c">'
                . __('Create another?')
                . '</a><a href="' . SYMPHONY_URL . '/blueprints/pages/" accesskey="a">'
                . __('View all Pages')
                . '</a>';
        }

    }

    public function generate($page = NULL)
    {
        header('Content-Type: text/javascript');
        echo json_encode($this->_output);
        exit();
    }
}