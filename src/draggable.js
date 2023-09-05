
(function(drag_n_drop, undefined) {

    /**
     * drag-n-drop = "false|draggable|dropzone|container" =>
     *      false(DEFAULT): disabled.
     *      draggable: Object can be dragged by the user. (When this option is used, the object can also receive dropzone events such as drag-n-drop__drop).
     *      dropzone: Object only receives dropzone events (such as drag-n-drop__drop).
     *      container: Object doesn't allow any items inside it to move out of it's boundaries.
     */

    // drag-n-drop-lock-axis = "|x|y" => ""(DEFAULT): disabled, x: lock X axis, y: lock Y axis.
    // drag-n-drop-x-padding = "<num>" => A number representing a padding (in pixels) before detecting a collision. (Default: 0)
    // drag-n-drop-y-padding = "<num>" => A number representing a padding (in pixels) before detecting a collision. (Default: 0)
    // drag-n-drop-placeholder = "false" => "false": disable placeholder, "<any other value>"(DEFAULT): Enable placeholder

    var placeholder = null;
    var being_dragged = null;
    var container = null;
    var dragged_over = [];
    var placeholder_id = 0;
    var touch_timer = null;
    const return_transition_length = 200; // ms
    const long_touch_length = 750; // ms

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





    function get_pointer_coordinates(evt) {
        return (evt.type.startsWith("touch") ? {pageX: evt.changedTouches[0].pageX, pageY: evt.changedTouches[0].pageY} : {pageX: evt.pageX, pageY: evt.pageY});
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

    function get_container_object(obj) {
        if(obj) {
            while(obj.getAttribute('drag-n-drop') !== 'container' && obj !== document.documentElement) {
                obj = obj.parentElement;
            }

            if(obj !== document.documentElement) return {width: obj.offsetWidth, height: obj.offsetHeight, x: obj.offsetLeft, y: obj.offsetTop};
        }
        return {
            width: Math.max(window.innerWidth, document.documentElement.innerWidth),
            height: Math.max(window.innerHeight, document.documentElement.innerHeight),
            x: 0,
            y: 0
        };
    }

    async function get_collisions(objXStart, objXEnd, objYStart, objYEnd) {
        var collision_enabled_objects = document.querySelectorAll('*[drag-n-drop]:not([drag-n-drop="false"])');
        var collisions = [];

        for (let i = 0; i < collision_enabled_objects.length; i++) {
            const colenobj = collision_enabled_objects[i];
            if(colenobj.parentElement.classList.contains('drag-n-drop__draggable_pseudo'))
                continue;
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

    async function on_touch_start(evt) {
        touch_timer = setTimeout(() => {on_start(evt);}, long_touch_length);
    }

    async function on_start(evt) {
        const draggable_object = get_draggable_element(evt.target);
        if(draggable_object) {
            evt.preventDefault();

            const drag_start_event = create_on_drag_start_event();
            draggable_object.dispatchEvent(drag_start_event);

            if(!drag_start_event.defaultPrevented) {
                const parent = draggable_object.parentElement;
                const coords = get_pointer_coordinates(evt);

                if(parent.classList.contains('drag-n-drop__draggable_pseudo')) {
                    parent.setAttribute('offset-x', parent.offsetLeft - coords.pageX);
                    parent.setAttribute('offset-y', parent.offsetTop - coords.pageY);
                    being_dragged = parent;
                    container = get_container_object(being_dragged);
                    placeholder = document.querySelector('div.drag-n-drop__placeholder[placeholder-id="'+parent.getAttribute('placeholder-id')+'"]');
                } else {
                    const objX = draggable_object.offsetLeft;
                    const objY = draggable_object.offsetTop;

                    container = get_container_object(draggable_object);
                    placeholder = await create_placeholder(draggable_object, draggable_object.getAttribute('drag-n-drop-placeholder') !== 'false');
                    being_dragged = await create_draggable_pseudo(draggable_object, objX, objY, coords.pageX, coords.pageY, placeholder_id-1);
                }
            }
        }
    }

    async function on_drag(evt) {
        if(being_dragged) {
            evt.preventDefault();
            const locked_axis = being_dragged.children[0].getAttribute('drag-n-drop-lock-axis');

            const objXStart = await on_drag_calculate_axis(evt, 'x', locked_axis === 'x');
            const objYStart = await on_drag_calculate_axis(evt, 'y', locked_axis === 'y');
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

    async function on_drag_calculate_axis(evt, axis, locked) {
        if(locked) return (axis === 'x' ? being_dragged.offsetLeft : being_dragged.offsetTop);

        const offset = parseInt(being_dragged.getAttribute('offset-' + axis));
        const document_start = (axis === 'x') ? container.x : container.y;
        const document_length = (axis === 'x') ? container.x + container.width - being_dragged.offsetWidth : container.y + container.height - being_dragged.offsetHeight;
        const coords = get_pointer_coordinates(evt);
        var position = offset + (axis === 'x' ? coords.pageX : coords.pageY);

        if(position < document_start) {
            position = document_start;
        } else if (position > document_length) {
            position = document_length;
        }

        return position;
    }

    async function on_end(evt) {
        if(touch_timer) {
            clearTimeout(touch_timer);
            touch_timer = null;
        }

        const draggable_pseudo = being_dragged;
        const placeholder_obj = placeholder;
        being_dragged = null;
        placeholder = null;
        container = null;
        dragged_over = [];

        if(draggable_pseudo) {
            const drag_end_event = create_on_drag_end_event(draggable_pseudo, placeholder_obj);
            const drop_event = create_on_drop_event(draggable_pseudo, placeholder_obj);
            draggable_pseudo.dispatchEvent(drag_end_event);
            
            var collisions = await get_collisions(draggable_pseudo.offsetLeft, draggable_pseudo.offsetLeft + draggable_pseudo.offsetWidth, draggable_pseudo.offsetTop, draggable_pseudo.offsetTop + draggable_pseudo.offsetHeight);
            for (let i = 0; i < collisions.length; i++) {
                collisions[i].dispatchEvent(drop_event);
            }

            if(!drag_end_event.defaultPrevented && !drop_event.defaultPrevented) {
                const placeholder_display = placeholder_obj.getAttribute('drag-n-drop-placeholder') !== 'false';

                draggable_pseudo.classList.add('returning');
                draggable_pseudo.style.top = (placeholder_display) ? placeholder_obj.offsetTop + 'px' : placeholder_obj.style.top;
                draggable_pseudo.style.left = (placeholder_display) ? placeholder_obj.offsetLeft + 'px' : placeholder_obj.style.left;
                setTimeout(() => {
                    var parent = placeholder_obj.parentElement;
                    parent.insertBefore(draggable_pseudo.children[0], placeholder_obj);
                    placeholder_obj.remove();
                    draggable_pseudo.remove();
                }, return_transition_length);
            }
        }
    }

    async function create_placeholder(obj, display) {
        var placeholder = document.createElement('div');
        placeholder.classList.add('drag-n-drop__placeholder');
        placeholder.setAttribute('placeholder-id', placeholder_id++);
        placeholder.setAttribute('drag-n-drop-placeholder', display);
        placeholder.style.width = obj.offsetWidth + 'px';
        placeholder.style.height = obj.offsetHeight + 'px';
        placeholder.style.left = obj.offsetLeft + 'px';
        placeholder.style.top = obj.offsetTop + 'px';

        obj.parentElement.insertBefore(placeholder, obj);
        return placeholder;
    }

    async function create_draggable_pseudo(obj, objX, objY, clickX, clickY, link_placeholder_id) {
        var draggable_pseudo = document.createElement('div');
        draggable_pseudo.classList.add("drag-n-drop__draggable_pseudo");
        draggable_pseudo.appendChild(obj);
        draggable_pseudo.setAttribute('offset-x', objX - clickX);
        draggable_pseudo.setAttribute('offset-y', objY - clickY);
        draggable_pseudo.setAttribute('placeholder-id', link_placeholder_id);
        draggable_pseudo.style.left = objX + 'px';
        draggable_pseudo.style.top = objY + 'px';

        document.body.appendChild(draggable_pseudo);
        return draggable_pseudo;
    }

    document.addEventListener('touchstart', on_touch_start, {passive: false});
    document.addEventListener('touchmove', on_drag, {passive: false});
    document.addEventListener('touchend', on_end);
    document.addEventListener('mousedown', on_start);
    document.addEventListener('mousemove', on_drag);
    document.addEventListener('mouseup', on_end);

}(window.drag_n_drop = window.drag_n_drop || {}));