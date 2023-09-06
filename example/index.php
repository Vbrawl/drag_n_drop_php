<?php
chdir('..');
require_once('main.php');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Drag-N-Drop</title>
    <?php DRAG_N_DROP\load_draggable(); ?>
    <!-- <script src="/src/draggable.js" defer></script>
    <link rel="stylesheet" href="/src/draggable.css"> -->
</head>
<body>
    <div id="drag1" style="background: red; width: 50px; height: 50px" drag-n-drop="draggable" drag-n-drop-lock-axis="x" drag-n-drop-placeholder="false">Hi</div>
    <div style="background: blue; width: 50px; height: 50px" drag-n-drop="draggable" drag-n-drop-lock-axis="x">Hello</div>
    <div style="background: green; width: 50px; height: 50px" drag-n-drop="draggable" drag-n-drop-lock-axis="x">No</div>


    <div id="dropzone" style="background: yellow; width: 50px; height: 50px" drag-n-drop="dropzone"></div>

    <div id="container" style="background: black; width: 100px; height: 100px" drag-n-drop="container">
        <div style="background: red; width: 50px; height: 50px" drag-n-drop="draggable">Hi</div>
        <div style="background: blue; width: 50px; height: 50px" drag-n-drop="draggable" drag-n-drop-placeholder="false">Hello</div>
        <div style="background: green; width: 50px; height: 50px" drag-n-drop="draggable">No</div>
    </div>


    <script>
        var dz = document.getElementById("dropzone");
        var drag1 = document.getElementById("drag1");

        dz.addEventListener('drag-n-drop__drag-enter', (evt) => {
            evt.target.style.background = "purple";
            console.log("Hello");
        });

        drag1.addEventListener('drag-n-drop__drag-enter', (evt) => {
            console.log(evt);
        })

        dz.addEventListener('drag-n-drop__drag-exit', (evt) => {
            evt.target.style.background = "yellow";
        })

        dz.addEventListener('drag-n-drop__drop', (evt) => {
            console.log("Hello2")
            evt.currentTarget.innerText = evt.detail.object.innerText;
            evt.target.style.background = "yellow";
            evt.preventDefault();
        });
    </script>
</body>
</html>