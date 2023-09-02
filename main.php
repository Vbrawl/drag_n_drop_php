<?php


namespace DRAG_N_DROP {
    require_once('relocation.php');

    function load_stylesheet($path) {
        $root_directory = $_SERVER['DOCUMENT_ROOT'];
        $root_directory_length = strlen($root_directory);

        if(strncmp($root_directory, $path, $root_directory_length) === 0) {
            $final_path = substr($path, $root_directory_length);
            echo '<link rel="stylesheet" href="'.$final_path.'">';
        }
        else {
            echo '<style>';
            readfile($path);
            echo '</style>';
        }
    }

    function load_script($path) {
        $root_directory = $_SERVER['DOCUMENT_ROOT'];
        $root_directory_length = strlen($root_directory);

        if(strncmp($root_directory, $path, $root_directory_length) === 0) {
            $final_path = substr($path, $root_directory_length);
            echo '<script src="'.$final_path.'">';
        }
        else {
            echo '<script>';
            readfile($path);
            echo '</script>';
        }
    }

    function load_draggable() {
        load_stylesheet(DRAG_N_DROP_PATH.'/src/draggable.css');
        load_script(DRAG_N_DROP_PATH.'/src/draggable.js');
    }
}