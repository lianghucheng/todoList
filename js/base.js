;(function () {
    'use strict';
    console.log('jQuery', jQuery);
    var user = store.get('user');
    console.log('user', user);
    var $form_add_task = $('.add-task')
        , $window = $(window)
        , $body = $('body')
        , task_list = []
        , $task_delete_trigger
        , $task_detail_trigger
        , $task_detail = $('.task-detail')
        , current_index
        , $update_form
        , $task_detail_content
        , $task_detail_content_input
        , $checkbox_complete
        , $msg = $('.msg')
        , $msg_content = $msg.find('.msg-content')
        , $msg_confirm = $msg.find('.confirmed')
        , $alerter = $('.alerter')
        , $task_detail_mask = $('.task-detail-mask');
    ;

    init();

    $form_add_task.on('submit', on_add_task_form_submit);

    $task_detail_mask.on('click', hide_task_detail);

    function pop(arg) {
        if (!arg) {
            console.error('pop title is required');
        }
        var conf = {}
            , $box
            , $mask
            , $title
            , $content
            , $confirm
            , $cancel
            , dfd
            , confirmed
            , timer;

        dfd = $.Deferred();

        if (typeof arg == 'string') {
            conf.title = arg;
        } else {
            conf = $.extend(conf, arg);
        }

        $box = $('<div>' +
            '<div class="pop-title">' + conf.title + '</div>' +
            '<div class="pop-content">' +
            '<div><button style="margin-right: 5px" class="primary confirm">确定</button><button class="cancel">取消</button></div>' +
            '</div>' +
            '</div>')
            .css({
                color: '#444',
                width: 300,
                height: 'auto',
                padding: '15px 10px',
                background: '#fff',
                position: 'fixed',
                'border-radius': '3px 3px 3px 3px',
                'box-shadow': '0 1px 2px rgba(0,0,0,.5)'
            });

        $title = $box.find('.pop-title').css({
            padding: '5px 10px',
            'font-weight': 900,
            'font-size': 20,
            'text-align': 'center'
        });

        $content = $box.find('.pop-content').css({
            padding: '5px 10px',
            'text-align': 'center'
        });

        $confirm = $content.find('button.confirm');
        $cancel = $content.find('button.cancel');

        $mask = $('<div></div>')
            .css({
                position: 'fixed',
                background: 'rgba(0,0,0,.5)',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            });

        timer = setInterval(function () {
            if (confirmed !== undefined) {
                dfd.resolve(confirmed);
                clearInterval(timer);
                dismiss_pop();
            }
        }, 50)

        $confirm.on('click', on_confirm);

        $cancel.on('click', on_cancel);

        $mask.on('click', on_cancel);

        function on_confirm() {
            confirmed = true;
        }

        function on_cancel() {
            confirmed = false;
        }

        function dismiss_pop() {
            $mask.remove();
            $box.remove();
        }

        function adjust_box_position() {
            console.log('$window.width()', $window.width());
            console.log('$window.height()', $window.height());
            var window_width = $window.width()
                , window_height = $window.height()
                , box_width = $box.width()
                , box_height = $box.height()
                , move_x
                , move_y;
            console.log('window_width, window_height, box_width, box_height', window_width, window_height, box_width, box_height);
            move_x = (window_width - box_width) / 2;
            move_y = (window_height - box_height) / 2 - 20;
            $box.css({
                left: move_x,
                top: move_y,
            });
        }

        $window.on('resize', adjust_box_position);

        $mask.appendTo($body);
        $box.appendTo($body);
        $window.resize();
        return dfd.promise();
    }

    function listen_msg_event() {
        $msg_confirm.on('click', function () {
            hide_msg();
        })
    }

    function on_add_task_form_submit(e) {
        var new_task = {};
        /*禁用默认行为*/
        e.preventDefault();
        /*获取新task的值*/
        var $input = $(this).find('input[name=content]');
        new_task.content = $input.val();
        /*如果新task的值为空 则直接返回 否则继续执行*/
        if (!new_task.content) return;
        console.log('new_task', new_task);
        /*存入新task*/
        if (add_task(new_task)) {
            $input.val('');
        }
    }

    function listen_task_detail() {
        var index
        $('.task-item').on('dblclick', function () {
            index = $(this).data('index');
            show_task_detail(index);
        });

        $task_detail_trigger.on('click', function () {
            var $this = $(this);
            var $item = $this.parent().parent();
            index = $item.data('index');
            console.log('index', index);
            show_task_detail(index);
        })
    }

    /*查看task详情*/
    function show_task_detail(index) {
        //$task_detail.css({display:'block'});
        render_task_detail(index);
        current_index = index;
        $task_detail.show();
        $task_detail_mask.show();
    }

    function update_task(index, data) {
        if (!index || !task_list[index]) return;
        task_list[index] = $.extend({}, task_list[index], data);
        console.log('data', data);
        console.log('task_list', task_list);
        refresh_task_list();
    }

    function hide_task_detail() {
        //$task_detail.css({display:'block'});
        $task_detail.hide();
        $task_detail_mask.hide();
    }

    /*渲染指定task的详情*/
    function render_task_detail(index) {
        if (index === undefined || !task_list[index]) return;
        var item = task_list[index];
        var tpl = '<form>\n' +
            '            <div class="content"><!--任务标题开始-->\n' +
            (item.content || '') +
            '            </div><!--任务标题结束-->\n' +
            '<div class="input-item"><input style="display: none;" type="text" name="content" value="' + (item.content || '') + '" autofocus autocomplete="off"></div>' +
            '            <div>\n' +
            '                <div class="desc input-item"><!--任务描述开始-->\n' +
            '                    <textarea name="desc">' + (item.desc || '') + '</textarea>\n' +
            '                </div><!--任务描述结束-->\n' +
            '            </div>\n' +
            '            <div class="remind input-item"><!--任务定时提醒开始-->\n' +
            '<label>提醒时间</label>' +
            '                <input class="datetime" name="remind_date" type="text" value="' + (item.remind_date || '') + '" autofocus autocomplete="off">\n' +
            '                <!--button type="submit">submit</button-->\n' +
            '            </div><!--任务定时提醒结束-->\n' +
            '<div class="input-item"><button type="submit">更新</button></div>' +
            '        </form>';
        //$task_detail.html(null);
        $task_detail.html(tpl);
        $('.datetime').datetimepicker();
        $update_form = $task_detail.find('form');
        $task_detail_content = $task_detail.find('.content');
        $task_detail_content_input = $task_detail.find('[name=content]');
        $task_detail_content.on('dblclick', function () {
            $task_detail_content.hide();
            $task_detail_content_input.show();
        });
        console.log('$update_form', $update_form);
        $update_form.on('submit', function (e) {
            e.preventDefault();
            var data = {};
            data.content = $(this).find('[name=content]').val();
            data.desc = $(this).find('[name=desc]').val();
            data.remind_date = $(this).find('[name=remind_date]').val();
            console.log('data', data);
            update_task(index, data);
            hide_task_detail();
        });
    }

    /*查找并监听所有按钮的点击事件*/
    function listen_task_delete() {
        $task_delete_trigger.on('click', function () {
            var $this = $(this);
            /*找到删除按钮所在的task元素*/
            var $item = $this.parent().parent();
            console.log('$item.data(index)', $item.data('index'));
            /*确认删除*/
            var index = $item.data('index');
            pop('确定删除？')
                .then(function (r) {
                    r ? delete_task(index) : null;
                });
        })
    }

    function listen_checkbox_complete() {
        $checkbox_complete.on('click', function () {
            var $this = $(this);
            var is_complete = $this.is(':checked');
            console.log('is_complete', is_complete);
            var index = $this.parent().parent().data('index');
            var item = get(index);
            console.log('task_item', item);
            if (item && item.complete) {
                update_task(index, {complete: false});
                //$this.prop('checked',true);
            } else {
                update_task(index, {complete: true});
                //$this.prop('checked',false);
            }
        })
    }

    function get(index) {
        return store.get('task_list')[index];
    }

    function add_task(new_task) {
        /*将新task值推入task_list*/
        task_list.push(new_task);
        /*更新localStorage*/
        refresh_task_list();
        return true;
    }

    /*
    刷新localStorage数据并渲染模板
     */
    function refresh_task_list() {
        store.set('task_list', task_list);
        render_task_list();
    }

    /*删除一条task*/
    function delete_task(index) {
        /*如果没有index或者index不存在则直接返回*/
        if (!index || !task_list[index]) {
            console.log('task_list', task_list);
            console.log('如果没有index或者index不存在则直接返回');
            return;
        }

        delete task_list[index];

        console.log('task_list', task_list);
        refresh_task_list();
    }

    function init() {
        listen_msg_event();
        task_list = store.get('task_list') || [];
        if (task_list.length) render_task_list();
        task_remind_check();
    }

    function task_remind_check() {
        var current_timestamp;
        var itl = setInterval(function () {
            for (var i = 0; i < task_list.length; i++) {
                var item = get(i), task_timestamp;
                //console.log('item',item);
                if (!item || !item.remind_date || item.informed) continue;
                current_timestamp = (new Date()).getTime();
                task_timestamp = (new Date(item.remind_date)).getTime();
                if (current_timestamp - task_timestamp >= 1) {
                    update_task(i, {informed: true});
                    show_msg(item.content);
                }
            }
        }, 300);
    }

    function show_msg(msg) {
        if (!msg) return;
        $msg_content.html(msg);
        $alerter.get(0).play();
        $msg.show();
    }

    function hide_msg() {
        $msg.hide();
    }

    /*
    渲染全部的task模板
     */
    function render_task_list() {
        var $task_list = $('.task-list');
        $task_list.html('');
        var complete_items = [];
        var l = [];
        for (var i = 0; i < task_list.length; i++) {
            var item = task_list[i];
            if (item && item.complete) {
                complete_items.push(item);
                l.push(i);
            } else {
                var $task = render_task_item(task_list[i], i);
                $task_list.prepend($task);
            }
        }
        for (var i = 0; i < complete_items.length; i++) {
            var item = complete_items[i];
            var $task = render_task_item(item, l[i]);
            if (!$task) continue;
            $task.addClass('completed');
            $task_list.append($task);
        }
        $task_delete_trigger = $('.action.delete');
        $task_detail_trigger = $('.action.detail');
        $checkbox_complete = $('.task-list .complete');
        listen_task_delete();
        listen_task_detail();
        listen_checkbox_complete();
    }

    /*
    渲染单条task模板
     */
    function render_task_item(data, index) {
        if (!data || !index) return;
        var list_item_tpl =
            '<div class="task-item" data-index="' + index + '"><!--任务开始-->' +
            '<span><input class="complete" type="checkbox" ' + (data.complete ? 'checked' : '') + '></span>' +
            '<span class="task-content">' + data.content + '</span>' +
            '<span class="fr">' +
            '<span class="action delete"> 删除</span>' +
            '<span class="action detail"> 详情</span>' +
            '</span>' +
            '</div><!--任务结束-->';
        return $(list_item_tpl);
    }
})();