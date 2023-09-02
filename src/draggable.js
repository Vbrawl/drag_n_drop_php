
(function(drag_n_drop, undefined) {

    // drag-n-drop = "false|draggable" => false: disabled, draggable: Object can be dragged by the user. (When this option is used, the object can also receive dropzone events such as drag-n-drop__drop)
    // drag-n-drop-lock-axis = "|x|y" => "": disabled, x: lock X axis, y: lock Y axis.
    // drag-n-drop-x-padding = "<num>" => A number representing a padding (in pixels) before detecting a collision;
    // drag-n-drop-y-padding = "<num>" => A number representing a padding (in pixels) before detecting a collision;

    var placeholder = null;
    var being_dragged = null;
    var dragged_over = [];
    const return_transition_length = 200; // ms

    /* Drag action starts */
    function create_on_drag_start_event() {
        return new CustomEvent('drag-n-drop__drag-start', {cancelable: true});
    }

    /* Drag action continues */
    function create_on_drag_event(object, original_position, newX, newY) {
        return new CustomEvent('drag-n-drop__drag', {detail: {object: object, original_position: original_position, newX: newX, newY: newY}, cancelable: true});
    }
    
    /* Drag action stops */
    function create_on_drag_end_event(object, original_position) {
        return new CustomEvent('drag-n-drop__drag-end', {detail: {object: object, original_position: original_position}, cancelable: true});
    }
    
    /* Drag enters a dropzone-event-receiving object */
    function create_on_drag_enter_event(object, original_position, newX, newY) {
        return new CustomEvent('drag-n-drop__drag-enter', {detail: {object: object, original_position: original_position, newX: newX, newY: newY}, cancelable: true});
    }
    
    /* Drag happens above a dropzone-event-receiving object */
    function create_on_drag_over_event(object, original_position, newX, newY) {
        return new CustomEvent('drag-n-drop__drag-over', {detail: {object: object, original_position: original_position, newX: newX, newY: newY}, cancelable: true});
    }

    /* Drag leaves a dropzone-event-receiving object */
    function create_on_drag_exit_event(object, original_position, newX, newY) {
        return new CustomEvent('drag-n-drop__drag-exit', {detail: {object: object, original_position: original_position, newX: newX, newY: newY}, cancelable: true});
    }

    /* Drag action stops over a dropzone-event-receiving object */
    function create_on_drop_event(object, original_position) {
        return new CustomEvent('drag-n-drop__drop', {detail: {object: object, original_position: original_position}, cancelable: true});
    }







    function get_draggable_element(obj) {
        if(obj) {
            while(obj.getAttribute('drag-n-drop') !== 'draggable' && obj !== document.documentElement) {
                obj = obj.parentElement;
            }

            if(obj !== document.documentElement) return obj;
        }
        return null;
    }

    async function get_collisions(objXStart, objXEnd, objYStart, objYEnd) {
        var collision_enabled_objects = document.querySelectorAll('*[drag-n-drop]:not([drag-n-drop="false"])');
        var collisions = [];

        for (let i = 0; i < collision_enabled_objects.length; i++) {
            const colenobj = collision_enabled_objects[i];
            const colXPadding = parseInt(colenobj.getAttribute('drag-n-drop-x-padding')) || 0;
            const colYPadding = parseInt(colenobj.getAttribute('drag-n-drop-y-padding')) || 0;

            const colXStart = colenobj.offsetLeft + colXPadding;
            const colXEnd = colenobj.offsetLeft + colenobj.offsetWidth - colXPadding;
            const colYStart = colenobj.offsetTop + colYPadding;
            const colYEnd = colenobj.offsetTop + colenobj.offsetHeight - colYPadding;

            if((objXStart < colXEnd && objXEnd > colXStart) && (objYStart < colYEnd && objYEnd > colYStart)) {
                collisions.push(colenobj);
            }
        }

        return collisions;
    }


    async function on_click_start(evt) {
        var draggable_object = get_draggable_element(evt.target);
        if(draggable_object) {
            evt.preventDefault();

            var drag_start_event = create_on_drag_start_event();
            draggable_object.dispatchEvent(drag_start_event);

            if(!drag_start_event.defaultPrevented) {
                var parent = draggable_object.parentElement;
                var parentIsDraggablePseudo = parent.classList.contains('drag-n-drop__draggable_pseudo');

                if(parentIsDraggablePseudo) {
                    var objX = parent.offsetLeft;
                    var objY = parent.offsetTop;
                } else {
                    var objX = draggable_object.offsetLeft;
                    var objY = draggable_object.offsetTop;
                }

                var clickX = evt.pageX;
                var clickY = evt.pageY;

                if(parentIsDraggablePseudo) {
                    parent.setAttribute('offset-x', objX - clickX);
                    parent.setAttribute('offset-y', objY - clickY);
                    being_dragged = parent;
                } else {
                    placeholder = await create_placeholder(draggable_object);
                    being_dragged = await create_draggable_pseudo(draggable_object, objX, objY, clickX, clickY);
                }
            }
        }
    }

    async function on_click_drag(evt) {
        if(being_dragged) {
            const locked_axis = being_dragged.children[0].getAttribute('drag-n-drop-lock-axis');

            const objXStart = await on_click_drag_calculate_axis(evt, 'x', locked_axis === 'x');
            const objYStart = await on_click_drag_calculate_axis(evt, 'y', locked_axis === 'y');
            const objXEnd = objXStart + being_dragged.offsetWidth;
            const objYEnd = objYStart + being_dragged.offsetHeight;


            const drag_event = create_on_drag_event(being_dragged, placeholder, objXStart, objYStart);
            const drag_over_event = create_on_drag_over_event(being_dragged, placeholder, objXStart, objYStart);
            const drag_enter_event = create_on_drag_enter_event(being_dragged, placeholder, objXStart, objYStart);
            const drag_exit_event = create_on_drag_exit_event(being_dragged, placeholder, objXStart, objYStart);


            var collisions = await get_collisions(objXStart, objXEnd, objYStart, objYEnd);
            for (let i = 0; i < dragged_over.length; i++) {
                if(!collisions.includes(dragged_over[i])) {
                    dragged_over[i].dispatchEvent(drag_exit_event);
                    dragged_over.splice(i--, 1);
                }
            }
            for (let i = 0; i < collisions.length; i++) {
                if(!dragged_over.includes(collisions[i])) {
                    collisions[i].dispatchEvent(drag_enter_event);
                    dragged_over.push(collisions[i]);
                }
                collisions[i].dispatchEvent(drag_over_event);
            }


            if(!drag_event.defaultPrevented && !drag_over_event.defaultPrevented && !drag_enter_event.defaultPrevented && !drag_exit_event.defaultPrevented) {
                being_dragged.style.left = objXStart + 'px';
                being_dragged.style.top = objYStart + 'px';
            }
        }
    }

    async function on_click_drag_calculate_axis(evt, axis, locked) {
        if(locked) return (axis === 'x' ? being_dragged.offsetLeft : being_dragged.offsetTop);

        var offset = parseInt(being_dragged.getAttribute('offset-' + axis));
        var document_length = (axis === 'x') ? Math.max(window.innerWidth, document.documentElement.offsetWidth) - being_dragged.offsetWidth : Math.max(window.innerHeight, document.documentElement.offsetHeight) - being_dragged.offsetHeight;
        var position = (axis === 'x' ? evt.pageX : evt.pageY) + offset;

        if(position < 0) {
            position = 0;
        } else if (position > document_length) {
            position = document_length;
        }

        return position;
    }

    async function on_click_end(evt) {
        const draggable_pseudo = being_dragged;
        const placeholder_obj = placeholder;
        being_dragged = null;
        placeholder = null;
        dragged_over = [];

        console.log(draggable_pseudo);

        if(draggable_pseudo) {
            const drag_end_event = create_on_drag_end_event(draggable_pseudo, placeholder_obj);
            const drop_event = create_on_drop_event(draggable_pseudo, placeholder_obj);
            draggable_pseudo.dispatchEvent(drag_end_event);
            
            var collisions = await get_collisions(draggable_pseudo.offsetLeft, draggable_pseudo.offsetLeft + draggable_pseudo.offsetWidth, draggable_pseudo.offsetTop, draggable_pseudo.offsetTop + draggable_pseudo.offsetHeight);
            for (let i = 0; i < collisions.length; i++) {
                collisions[i].dispatchEvent(drop_event);
            }

            if(!drag_end_event.defaultPrevented && !drop_event.defaultPrevented) {
                draggable_pseudo.classList.add('returning');
                draggable_pseudo.style.top = placeholder_obj.offsetTop + 'px';
                draggable_pseudo.style.left = placeholder_obj.offsetLeft + 'px';
                setTimeout(() => {
                    var parent = placeholder_obj.parentElement;
                    parent.insertBefore(draggable_pseudo.children[0], placeholder_obj);
                    placeholder_obj.remove();
                    draggable_pseudo.remove();
                }, return_transition_length);
            }
        }
    }

    async function create_placeholder(obj) {
        var placeholder = document.createElement('div');
        placeholder.style.width = obj.offsetWidth + 'px';
        placeholder.style.height = obj.offsetHeight + 'px';
        placeholder.style.left = obj.offsetLeft + 'px';
        placeholder.style.top = obj.offsetTop + 'px';

        obj.parentElement.insertBefore(placeholder, obj);
        return placeholder;
    }

    async function create_draggable_pseudo(obj, objX, objY, clickX, clickY) {
        var draggable_pseudo = document.createElement('div');
        draggable_pseudo.classList.add("drag-n-drop__draggable_pseudo");
        draggable_pseudo.appendChild(obj);
        draggable_pseudo.setAttribute('offset-x', objX - clickX);
        draggable_pseudo.setAttribute('offset-y', objY - clickY);
        draggable_pseudo.style.left = objX + 'px';
        draggable_pseudo.style.top = objY + 'px';

        document.body.appendChild(draggable_pseudo);
        return draggable_pseudo;
    }

    document.addEventListener('mousedown', on_click_start);
    document.addEventListener('mousemove', on_click_drag);
    document.addEventListener('mouseup', on_click_end);

    drag_n_drop.get_draggable_element = get_draggable_element;

}(window.drag_n_drop = window.drag_n_drop || {}));