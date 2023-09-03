<?php


namespace DRAG_N_DROP {
    require_once('relocation.php');

    function load_draggable() {
        load_file(DRAG_N_DROP_PATH.'/src/draggable.css');
        load_file(DRAG_N_DROP_PATH.'/src/draggable.js');
    }
}