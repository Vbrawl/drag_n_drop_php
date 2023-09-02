<?php require_once('../main.php'); ?>
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
    <div style="background: red; width: 50px; height: 50px" drag-n-drop="draggable" drag-n-drop-lock-axis="x">Hi</div>
    <div style="background: blue; width: 50px; height: 50px" drag-n-drop="draggable" drag-n-drop-lock-axis="x">Hello</div>
    <div style="background: green; width: 50px; height: 50px" drag-n-drop="draggable" drag-n-drop-lock-axis="x">No</div>


    <div id="dropzone" style="background: yellow; width: 50px; height: 50px" drag-n-drop="dropzone"></div>


    <script>
        var dz = document.getElementById("dropzone");

        dz.addEventListener('drag-n-drop__drag-enter', (evt) => {
            evt.target.style.background = "purple";
            console.log("Hello");
        })

        dz.addEventListener('drag-n-drop__drag-exit', (evt) => {
            evt.target.style.background = "yellow";
        })

        dz.addEventListener('drag-n-drop__drop', (evt) => {
            console.log("Hello2")
            evt.currentTarget.innerText = evt.detail.object.innerText;
            evt.target.style.background = "yellow";
        });
    </script>
</body>
</html>