/**
 * Created by 40637 on 2017/3/21.
 */

// 调试输出中最多显示记录的条数
var DEBUG_TEXT_MAX_NUMBER = 3;

// 是否开启调试模式，true开启，false关闭
var DEBUG_ON_OFF = true;
// var DEBUG_ON_OFF = false;

// 更规范的方式，定义全局变量，然后通过全局变量访问其他库中定义的函数和变量
var THREE = window.THREE;
var dat = window.dat;

// 用于调试输出，控制div标签的id="debug_text"
var debug_text_number = 0;
var debug_text_content = [];

// 参数text是调试输出的文本，在控制台日志和屏幕右下角的调试输出中会输出相同的内容
// printTrace指定是否打印调用栈
// stopRunning指定是否在打印输出结束之后终止函数的运行（抛出异常）
function errout(text, printTrace, stopRunning) {
    "use strict";
    if (!DEBUG_ON_OFF) {
        return;
    }
    window.console.log(text);
    debug_text_number++;
    // 数组方法push()和shift()分别是队列的enqueue()与dequeue()方法
    debug_text_content.push(text);
    if (debug_text_number > DEBUG_TEXT_MAX_NUMBER) {
        debug_text_content.shift();
    }
    var debug_text = document.getElementById('debug_text');
    debug_text.height = canvHeight;
    // join也是一种数组方法，用于合成为一个字符串，并插入指定的分隔符
    debug_text.innerHTML = debug_text_content.join('<br/>');
    // 打印调用栈
    if (printTrace === true) {
        try {
            if (stopRunning === true) {
                throw new Error();
            } else {
                throw new Error('一般错误：' + text);
            }
        }
        catch (e) {
            if (stopRunning === true) {
                throw new Error('严重错误：' + text + '\n' + e.stack);
            } else {
                window.console.error(e.stack);
            }
        }
    }
}

// 弧度转角度
function radians2degrees(radians) {
    "use strict";
    return (radians / Math.PI * 180);
}
// 角度转弧度
function degrees2radians(degrees) {
    "use strict";
    return (degrees / 180 * Math.PI);
}
// 一角度对应的弧度
var ONE_DEGREE_IN_RADIANS = degrees2radians(1);

// getRandColor() 从给定列表中随机选取一种颜色
var colors = [
    0xFF62B0,
    0x9A03FE,
    0x62D0FF,
    0x48FB0D,
    0xDFA800,
    0xC27E3A,
    0x990099,
    0x9669FE,
    0x23819C,
    0x01F33E,
    0xB6BA18,
    0xFF800D,
    0xB96F6F,
    0x4A9586
];
function getRandColor() {
    "use strict";
    return colors[Math.floor(Math.random() * colors.length)];
}

// 显示帧速率
var lastFrameCount = 0;
var frameCount = 0;
var FPSHandle = null;
function FPS() {
    "use strict";
    if (!DEBUG_ON_OFF) {
        return;
    }
    var curDate = new Date();
    errout(curDate.getHours() + ":" + curDate.getMinutes() + ":" + curDate.getSeconds()
        + " : " + (frameCount - lastFrameCount) + 'FPS');
    lastFrameCount = frameCount;
    if (FPSHandle !== null) {
        window.clearInterval(FPSHandle);
    }
    FPSHandle = window.setTimeout(FPS, 1000);
}

// 画布的宽和高，涉及到绘制区域的大小，统一使用这两个变量。
// 这两个变量在文档加载，窗口大小改变，显示左侧面板等改变画布大小的区域等情况下，都会更新。
var canvHeight;
var canvWidth;

function canvasResize() {
    "use strict";
    /* 获取画布的宽和高
     * 用jQuery.width()、jQuery.outerWidth()、document.getElementById(div_id).width获取宽高都会出问题。
     * 但是用window.innerWidth可以取得很好的效果。
     */
    canvHeight = window.innerHeight;
    canvWidth = window.innerWidth;
    if (camera) {
        camera.aspect = canvWidth / canvHeight;
        camera.updateProjectionMatrix();
    }
    if (renderer) {
        renderer.setSize(canvWidth, canvHeight);
    }
}

// 重绘整个画布。除非必要，应避免对整个场景的重绘（调用这个函数）。
function redraw() {
    "use strict";
    canvasResize();
    var i;
    // scene.children.forEach(function(item) {
    //     scene.remove(item);
    // });
    var listLength = scene.children.length;
    for (i=0;i<listLength;i++) {
        scene.remove(scene.children[0]);
    }
    // 可能涉及到更复杂的问题
    // 避免多个requestAnimationFrame()循环同时绘制图像，造成帧速率太高（远高于60FPS）
    // 停止已有的绘制刷新循环
    stop();
    // 初始化新的图形绘制，绘制整个场景
    initGraphics();
}

// 禁止用户选择文本，优化UI体验
// 浏览器限制：仅在IE和Chrome中有效，在Firefox中无效。
document.body.onselectstart = function () {
    "use strict";
    return false;
};


// 避免多个requestAnimationFrame()循环同时绘制图像。
/* 对整个场景进行重绘（重新建立一个绘制，scene也重新创建）时，如果不停止已有的动画循环，即不使用下面这段代码，会造成帧速率升高
 * 的问题。这是由JavaScript的内部机制决定的。
 */
var requestId;
function stop() {
    "use strict";
    if (requestId) {
        window.cancelAnimationFrame(requestId);
        requestId = undefined;
    }
}

function printMatrix4(mat4) {
    "use strict";
    if (mat4 !== undefined && mat4 instanceof THREE.Matrix4) {
        var i, j;
        var str = "";
        for (i = 0; i < 4; i++) {
            str = (i == 0) ? " [ " : "   ";
            for (j = 0; j < 4; j++) {
                // 这里需要注意，Three.js的矩阵元素在一维数组中是列主顺序存储的。
                str += mat4.elements[i + 4 * j] + ( (i == 3 && j == 3) ? "  " : ", " );
            }
            str += (i == 3) ? " ] " : "   ";
            errout(str);
        }
    }
}