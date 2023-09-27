
(function(drag_n_drop, undefined) {

    /**
     * drag-n-drop = "false|draggable|dropzone|container" =>
     *      false(DEFAULT): disabled.
     *      draggable: Object can be dragged by the user. (When this option is used, the object can also receive dropzone events such as drag-n-drop__drop).
     *      dropzone: Object only receives dropzone events (such as drag-n-drop__drop).
     *      container: Object doesn't allow any items inside it to move out of it's boundaries.
     *      undraggable-area: Object cannot be dragged from an element with drag-n-drop set to undraggable-area (It's the safe area to click without moving the object).
     */

    // drag-n-drop-lock-axis = "|x|y" => ""(DEFAULT): disabled, x: lock X axis, y: lock Y axis.
    // drag-n-drop-x-padding = "<num>" => A number representing a padding (in pixels) before detecting a collision. (Default: 0)
    // drag-n-drop-y-padding = "<num>" => A number representing a padding (in pixels) before detecting a collision. (Default: 0)
    // drag-n-drop-placeholder = "false" => "false": disable placeholder, "<any other value>"(DEFAULT): Enable placeholder
    // drag-n-drop-returnAnimationId = "<num>" => A number representing the ID of the timeout for the transition when object is returning.

    var placeholder_id = 0;
    const return_transition_length = 200; // ms

    /* Drag action starts */
    function create_on_drag_start_event() {
        return new CustomEvent('drag-n-drop__drag-start', {cancelable: true, bubbles: true});
    }

    /* Drag action continues */
    function create_on_drag_event(object, original_position, newX, newY) {
        return new CustomEvent('drag-n-drop__drag', {detail: {object: object, original_position: original_position, newX: newX, newY: newY}, cancelable: true, bubbles: true});
    }
    
    /* Drag action stops */
    function create_on_drag_end_event(object, original_position) {
        return new CustomEvent('drag-n-drop__drag-end', {detail: {object: object, original_position: original_position}, cancelable: true, bubbles: true});
    }
    
    /* Drag enters a dropzone-event-receiving object */
    function create_on_drag_enter_event(object, original_position, newX, newY) {
        return new CustomEvent('drag-n-drop__drag-enter', {detail: {object: object, original_position: original_position, newX: newX, newY: newY}, cancelable: true, bubbles: true});
    }
    
    /* Drag happens above a dropzone-event-receiving object */
    function create_on_drag_over_event(object, original_position, newX, newY) {
        return new CustomEvent('drag-n-drop__drag-over', {detail: {object: object, original_position: original_position, newX: newX, newY: newY}, cancelable: true, bubbles: true});
    }

    /* Drag leaves a dropzone-event-receiving object */
    function create_on_drag_exit_event(object, original_position, newX, newY) {
        return new CustomEvent('drag-n-drop__drag-exit', {detail: {object: object, original_position: original_position, newX: newX, newY: newY}, cancelable: true, bubbles: true});
    }

    /* Drag action stops over a dropzone-event-receiving object */
    function create_on_drop_event(object, original_position) {
        return new CustomEvent('drag-n-drop__drop', {detail: {object: object, original_position: original_position}, cancelable: true, bubbles: true});
    }



    function get_draggable_element(obj) {
        if(obj) {
            var attribute = obj.getAttribute('drag-n-drop');
            while(attribute !== 'draggable' && attribute !== 'undraggable-area' && obj !== document.documentElement) {
                obj = obj.parentElement;
                attribute = obj.getAttribute('drag-n-drop');
            }

            console.log(obj);

            if(obj !== document.documentElement && attribute !== 'undraggable-area') return obj;
        }
        return null;
    }

    function get_container_object(obj) {
        if(obj) {
            var attribute = obj.getAttribute('drag-n-drop');
            while(attribute !== 'container' && attribute !== 'undraggable-area' && obj !== document.documentElement) {
                obj = obj.parentElement;
                attribute = obj.getAttribute('drag-n-drop');
            }

            if(obj !== document.documentElement && attribute !== 'undraggable-area') return obj.getBoundingClientRect();
        }

        const width = Math.max(window.innerWidth, document.documentElement.offsetWidth);
        const height = Math.max(window.innerHeight, document.documentElement.offsetHeight);
        return {
            width: width,
            height: height,
            x: 0,
            y: 0,
            left: 0,
            top: 0,
            right: width,
            bottom: height
        };
    }

    async function get_collisions(objXStart, objXEnd, objYStart, objYEnd) {
        var collision_enabled_objects = document.querySelectorAll('*[drag-n-drop]:not([drag-n-drop="false"]):not([drag-n-drop="undraggable-area"])');
        var collisions = [];

        for (let i = 0; i < collision_enabled_objects.length; i++) {
            const colenobj = collision_enabled_objects[i];
            if(colenobj.parentElement.classList.contains('drag-n-drop__draggable_pseudo'))
                continue;
            const colXPadding = parseInt(colenobj.getAttribute('drag-n-drop-x-padding')) || 0;
            const colYPadding = parseInt(colenobj.getAttribute('drag-n-drop-y-padding')) || 0;

            const rect = colenobj.getBoundingClientRect();
            if((objXStart < (rect.right - colXPadding + window.scrollX) && objXEnd > (rect.left + colXPadding + window.scrollX)) && (objYStart < (rect.bottom - colYPadding + window.scrollY) && objYEnd > (rect.top + colYPadding + window.scrollY))) {
                collisions.push(colenobj);
            }
        }

        return collisions;
    }

    async function on_start(evt) {
        const pointer = evt.detail.pointer;
        const draggable_object = get_draggable_element(pointer.object.target);
        if(draggable_object) {
            evt.preventDefault();
            const drag_start_event = create_on_drag_start_event();
            draggable_object.dispatchEvent(drag_start_event);

            if(!drag_start_event.defaultPrevented) {
                const parent = draggable_object.parentElement;
                const pointerobj = pointer.object;
                var rect = null;

                pointer.storage.drag_n_drop = {};
                if(parent.classList.contains('drag-n-drop__draggable_pseudo')) {
                    const animationId = parent.getAttribute('drag-n-drop-returnAnimationId');
                    if(animationId) {
                        clearTimeout(animationId);
                        parent.classList.remove('returning');
                    }
                    rect = parent.getBoundingClientRect();
                    pointer.storage.drag_n_drop.being_dragged = parent;
                    pointer.storage.drag_n_drop.container = get_container_object(pointer.storage.being_dragged);
                    pointer.storage.drag_n_drop.placeholder = document.querySelector('div.drag-n-drop__placeholder[placeholder-id="'+parent.getAttribute('placeholder-id')+'"]');
                } else {
                    rect = draggable_object.getBoundingClientRect();
                    pointer.storage.drag_n_drop.container = get_container_object(draggable_object);
                    pointer.storage.drag_n_drop.placeholder = await create_placeholder(draggable_object, draggable_object.getAttribute('drag-n-drop-placeholder') !== 'false');
                    pointer.storage.drag_n_drop.being_dragged = await create_draggable_pseudo(draggable_object, rect.left + window.scrollX, rect.top + window.scrollY, placeholder_id-1);
                }
                pointer.storage.drag_n_drop.offset = {x: rect.left - pointerobj.pageX - window.scrollX, y: rect.top - pointerobj.pageY - window.scrollY};
                pointer.storage.drag_n_drop.locked_axis = draggable_object.getAttribute('drag-n-drop-lock-axis');
                pointer.storage.drag_n_drop.dragged_over = [];

                // Animation
                pointer.storage.drag_n_drop.being_dragged.getBoundingClientRect(); // Force update of the object. Basically force enable the animation of moving class.
                pointer.storage.drag_n_drop.being_dragged.classList.add('moving');
            }
        }
    }

    async function on_drag(evt) {
        const pointer = evt.detail.pointer;
        if(pointer.storage.drag_n_drop) {
            evt.preventDefault();
            const being_dragged = pointer.storage.drag_n_drop.being_dragged;
            const placeholder = pointer.storage.drag_n_drop.placeholder;
            const locked_axis = pointer.storage.drag_n_drop.locked_axis;

            const objXStart = await on_drag_calculate_axis(pointer, 'x', locked_axis === 'x');
            const objYStart = await on_drag_calculate_axis(pointer, 'y', locked_axis === 'y');
            const objXEnd = objXStart + being_dragged.offsetWidth;
            const objYEnd = objYStart + being_dragged.offsetHeight;


            const drag_event = create_on_drag_event(being_dragged, placeholder, objXStart, objYStart);
            const drag_over_event = create_on_drag_over_event(being_dragged, placeholder, objXStart, objYStart);
            const drag_enter_event = create_on_drag_enter_event(being_dragged, placeholder, objXStart, objYStart);
            const drag_exit_event = create_on_drag_exit_event(being_dragged, placeholder, objXStart, objYStart);


            var collisions = await get_collisions(objXStart, objXEnd, objYStart, objYEnd);
            for (let i = 0; i < pointer.storage.drag_n_drop.dragged_over.length; i++) {
                if(!collisions.includes(pointer.storage.drag_n_drop.dragged_over[i])) {
                    pointer.storage.drag_n_drop.dragged_over[i].dispatchEvent(drag_exit_event);
                    pointer.storage.drag_n_drop.dragged_over.splice(i--, 1);
                }
            }
            for (let i = 0; i < collisions.length; i++) {
                if(!pointer.storage.drag_n_drop.dragged_over.includes(collisions[i])) {
                    collisions[i].dispatchEvent(drag_enter_event);
                    pointer.storage.drag_n_drop.dragged_over.push(collisions[i]);
                }
                collisions[i].dispatchEvent(drag_over_event);
            }

            if(!drag_event.defaultPrevented && !drag_over_event.defaultPrevented && !drag_enter_event.defaultPrevented && !drag_exit_event.defaultPrevented) {
                being_dragged.style.left = objXStart + 'px';
                being_dragged.style.top = objYStart + 'px';
            }
        }
    }

    async function on_drag_calculate_axis(pointer, axis, locked) {
        const axisX = axis === 'x';

        const being_dragged = pointer.storage.drag_n_drop.being_dragged;
        if(locked) return (axisX ? being_dragged.offsetLeft : being_dragged.offsetTop);
        const container = pointer.storage.drag_n_drop.container;
        const pointerobj = pointer.object;

        const offset = pointer.storage.drag_n_drop.offset[axis];
        const boundary_start = (axisX ? container.left : container.top);
        const boundary_end = (axisX ? container.right - being_dragged.offsetWidth + window.scrollX: container.bottom - being_dragged.offsetHeight + window.scrollY);
        const position = offset + (axisX ? pointerobj.pageX + window.scrollX : pointerobj.pageY + window.scrollY);

        if(position < boundary_start) return boundary_start;
        if (position > boundary_end) return boundary_end;
        return position;
    }

    async function on_end(evt) {
        const pointer = evt.detail.pointer;
        
        if(pointer.storage.drag_n_drop) {
            const draggable_pseudo = pointer.storage.drag_n_drop.being_dragged;
            const placeholder_obj = pointer.storage.drag_n_drop.placeholder;
            draggable_pseudo.classList.remove('moving');
            
            const drag_end_event = create_on_drag_end_event(draggable_pseudo, placeholder_obj);
            const drop_event = create_on_drop_event(draggable_pseudo, placeholder_obj);
            draggable_pseudo.dispatchEvent(drag_end_event);

            var collisions = await get_collisions(draggable_pseudo.offsetLeft, draggable_pseudo.offsetLeft + draggable_pseudo.offsetWidth, draggable_pseudo.offsetTop, draggable_pseudo.offsetTop + draggable_pseudo.offsetHeight);
            for (let i = 0; i < collisions.length; i++) {
                collisions[i].dispatchEvent(drop_event);
            }

            if(!drag_end_event.defaultPrevented && !drop_event.defaultPrevented) {
                const placeholder_display = placeholder_obj.getAttribute('drag-n-drop-placeholder') !== 'false';
                const placeholder_rect = placeholder_obj.getBoundingClientRect();

                draggable_pseudo.classList.add('returning');
                draggable_pseudo.style.top = (placeholder_display) ? placeholder_rect.top + 'px' : placeholder_obj.style.top;
                draggable_pseudo.style.left = (placeholder_display) ? placeholder_rect.left + 'px' : placeholder_obj.style.left;
                const animationId = setTimeout(() => {
                    const parent = placeholder_obj.parentElement;
                    if(parent !== null) {
                        parent.insertBefore(draggable_pseudo.children[0], placeholder_obj);
                    }
                    placeholder_obj.remove();
                    draggable_pseudo.remove();
                }, return_transition_length);

                draggable_pseudo.setAttribute('drag-n-drop-returnAnimationId', animationId);
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

    async function create_draggable_pseudo(obj, objX, objY, link_placeholder_id) {
        var draggable_pseudo = document.createElement('div');
        draggable_pseudo.classList.add("drag-n-drop__draggable_pseudo");
        draggable_pseudo.appendChild(obj);
        draggable_pseudo.setAttribute('placeholder-id', link_placeholder_id);
        draggable_pseudo.style.left = objX + 'px';
        draggable_pseudo.style.top = objY + 'px';

        document.body.appendChild(draggable_pseudo);
        return draggable_pseudo;
    }

    document.addEventListener('nds-longtouchstart', on_start);
    document.addEventListener('nds-clickstart', on_start);
    document.addEventListener('nds-pointmove', on_drag);
    document.addEventListener('nds-longtouchend', on_end);
    document.addEventListener('nds-clickend', on_end);

    drag_n_drop.end = async function(evt) {
        return await on_end(evt);
    }

}(window.drag_n_drop = window.drag_n_drop || {}));