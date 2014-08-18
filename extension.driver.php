<?php

require EXTENSIONS . '/workspace_manager_b/lib/class.helpers.php';

Class extension_Workspace_manager_b extends Extension
{
    public function getSubscribedDelegates()
    {
        return array(
            array(
                'page' => '/backend/',
                'delegate' => 'AdminPagePostCallback',
                'callback' => 'postCallback'
            ),
            array(
                'page' => '/backend/',
                'delegate' => 'AdminPagePreGenerate',
                'callback' => 'adminPagePreGenerate'
            )
        );
    }

    public function postCallback(&$context)
    {
        $driver = $context['callback']['driver'];
        $callback_context = $context['callback']['context'];

        if ($driver == 'workspacemanager') {
            $callback = $this->getNewCallback();
            $callback['context'][0] = 'index';
            $callback['context'][1] = $context['parts'][2];
        } elseif ($driver == 'workspaceeditor') {
            $callback = $this->getNewCallback();
            $callback['context'][0] = 'edit';
            $callback['context'][1] = $context['parts'][2];
        } elseif ($driver == 'blueprintspages' and $callback_context[0] == 'template') {
            $callback = $this->getNewCallback();
            $callback['context'] = $callback_context;
            $callback['context'][0] = 'template';
        } else return;

        $context['callback'] = $callback;
    }

    private function getNewCallback()
    {
        if (array_key_exists('ajax', $_GET) or array_key_exists('ajax', $_POST)) {
            return array(
                'driver' => 'ajax',
                'driver_location' => EXTENSIONS . '/workspace_manager_b/content/content.ajax.php',
                'pageroot' => '/extensions/workspace_manager_b/content/',
                'classname' => 'contentExtensionWorkspace_manager_bAjax',
                'context' => array()
            );
        } else {
            return array(
                'driver' => 'view',
                'driver_location' => EXTENSIONS . '/workspace_manager_b/content/content.view.php',
                'pageroot' => '/extensions/workspace_manager_b/content/',
                'classname' => 'contentExtensionWorkspace_manager_bView',
                'context' => array()
            );
        }
    }

    /*
    * Set naviagtion
    */
    public function fetchNavigation()
    {
        $children = array(
            array(
                'relative' => false,
                'link' => 'workspace/manager/',
                'name' => 'Home',
                'visible' => 'yes'
            )
        );
        $entries = scandir(WORKSPACE);
        foreach($entries as $entry){
            if($entry == '.' or $entry == '..') continue;
            if(is_dir(WORKSPACE . '/' . $entry)){
                array_push($children,
                    array(
                        'relative' => false,
                        'link' => '/workspace/manager/' . $entry . '/',
                        'name' => Helpers::capitalizeWords($entry),
                        'visible' => 'yes'
                    )
                );
            }
        }
        return array(
            array(
                'name' => 'Workspace',
                'type' => 'structure',
                'index' => '250',
                'children' => $children
            )
        );
    }

    /**
    * Modify admin pages.
    */
    public function adminPagePreGenerate(&$context)
    {
        $page = $context['oPage'];
        $callback = Symphony::Engine()->getPageCallback();
        $driver = $callback['driver'];
        if ($driver == "blueprintspages") {
            if ($callback['context'][0] == 'edit') {
                $fieldset = $page->Form->getChildByName('fieldset', 0);
                $div = $fieldset->getChildByName('div', 0);
                $div = $div->getChildByName('div', 0);
                $label = $div->getChildByName('label', 0);
                $input = $label->getChildByName('input', 0);
                $template_name = $input->getAttribute('value');
                
                $ul = $page->Context->getChildByName('ul', 0);
                $ul->prependChild(
                    new XMLElement(
                        'li',
                        Widget::Anchor(
                            __('Edit Page Template'),
                            SYMPHONY_URL . '/blueprints/pages/template/' . $template_name . '/',
                            'Edit Page Template',
                            'button'
                        )
                    )
                );			
            } elseif ($table = $page->Form->getChildByName('table', 0)) {
                $tbody = $table->getChildByName('tbody', 0);
                foreach ($tbody->getChildren() as $tr) {
                    $td = $tr->getChild(1);
                    $value = $td->getValue();
                    $td->replaceValue(
                        Widget::Anchor(
                            __($value),
                            SYMPHONY_URL . '/blueprints/pages/template/' . pathinfo($value, PATHINFO_FILENAME) . '/'
                        )
                    );
                }
            }
        }
    }
}
?>