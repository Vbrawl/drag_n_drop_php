<?php

// Added "src" as resource folder to avoid manually loading the scripts
// via PHP
namespace DRAG_N_DROP {
    require_once('relocation.php');

    require_once(MULTI_DEVICE_SUPPORT_PATH.'/main.php');

    function load_draggable() {
        \MULTI_DEVICE_SUPPORT\enable_all();
        load_file(DRAG_N_DROP_RESOURCES_PATH.'/src/draggable.css');
        load_file(DRAG_N_DROP_RESOURCES_PATH.'/src/draggable.js', 'defer');
    }
}