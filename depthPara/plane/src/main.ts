import * as BABYLON from "@babylonjs/core";


// 使用全局BABYLON对象，不需要import语句
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement; // Get the canvas element 
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine


// Add your code here matching the playground format
var createScene = function () {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);


    // 相机1
    var camera1 = new BABYLON.ArcRotateCamera("camera1", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
    camera1.position = new BABYLON.Vector3(0,0,-10);
    // camera1.attachControl(canvas, true);
    camera1.setTarget(BABYLON.Vector3.Zero());

    const W = engine.getRenderWidth();
    const H = engine.getRenderHeight();

    const proportion = W / H;

    const halfW = 3.0 * proportion;
    const halfH = 3.0;

    // 正交
    camera1.mode = 1;
    camera1.orthoLeft   = -halfW;
    camera1.orthoRight  =  halfW;
    camera1.orthoBottom = -halfH;
    camera1.orthoTop    =  halfH;

    //俯视角相机，投影视角
    var camera2 = new BABYLON.ArcRotateCamera("camera2", 0, 1, 10, BABYLON.Vector3.Zero(), scene);
    // camera2.attachControl(canvas, true);
    camera2.position = new BABYLON.Vector3(0, 10.0, 0);
    camera1.setTarget(BABYLON.Vector3.Zero());
    camera2.alpha += Math.PI;
    

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    var box = BABYLON.MeshBuilder.CreateBox("box", {width: 4, height: 2, depth: 0.1,}, scene);
    box.position.y = 0.0;
    box.rotate(BABYLON.Axis.Y, -BABYLON.Tools.ToRadians(-54), BABYLON.Space.LOCAL);



    scene.enableGeometryBufferRenderer();
    const gbuffer = scene.geometryBufferRenderer;

    const RRT_WIDTH = 1024;
    const RRT_HEIGHT = 512;

    // // 此分辨率下原求交方式会失败
    // const RRT_WIDTH = 256;
    // const RRT_HEIGHT = 128;

    // 单独生成深度图，需要指定相机
    var depthRender = new BABYLON.DepthRenderer(scene, BABYLON.Constants.TEXTURETYPE_FLOAT, camera1);
    scene.customRenderTargets.push(depthRender.getDepthMap());
    depthRender.getDepthMap().name = "深度图";
    depthRender.getDepthMap().renderList = [];
    // 需要手动添加需要获取深度的物体
    for (let mesh of scene.meshes) {
        depthRender.getDepthMap().renderList.push(mesh);
        // 如果要自定义深度获取的方式，还能为每个物体单独指定材质，一般为定义的Shader材质，自定义深度获取规则
        // depthRender.getDepthMap().setMaterialForRendering(mesh, custom_shader);
    }

    var depthRTT = depthRender.getDepthMap();
    depthRTT.resize({width : RRT_WIDTH, height : RRT_HEIGHT});


    // 世界空间下光线起点和方向
    const origin = new BABYLON.Vector3(-2.0, 0.0, 0.0);;
    const dir = new BABYLON.Vector3(1, 0.2, 0);

    // 转换到视图空间
    const Ro = BABYLON.Vector3.TransformCoordinates(origin, camera1.getViewMatrix(true)); 
    const Rd = BABYLON.Vector3.TransformNormal(dir,   camera1.getViewMatrix(true));        


    
    scene.onAfterRenderTargetsRenderObservable.add(() => {
        

        // 世界空间像素间隔
        const deltaX = 2.0 * halfW / RRT_WIDTH;
        const deltaY = 2.0 * halfH / RRT_HEIGHT;


        depthRTT.render(true);
  
        // 创建一个用于存储深度数据的Float32Array (RGBA格式，每个像素4个值)
        const depthData = new Float32Array(RRT_WIDTH * RRT_HEIGHT * 4);
        
        // CPU端读取深度图数据
        depthRTT.readPixels(0, 0, undefined, true).then((readPixelsBuffer) => {
            if (readPixelsBuffer) {
                // 将读取的数据转换为Float32Array
                const pixelData = new Float32Array(readPixelsBuffer.buffer);
                
                // 复制数据到数组
                for (let i = 0; i < pixelData.length && i < depthData.length; i++) {
                    depthData[i] = pixelData[i];
                }

                console.log(pixelData.length);
                console.log(1024*512*4);
                
                // // 比较深度值
                // 中心点
                const centerX1 = Math.floor(RRT_WIDTH / 2);
                const centerY1 = Math.floor(RRT_HEIGHT / 2);
                const centerIndex1 = (centerY1 * RRT_WIDTH + centerX1);
                const centerDepth1 = depthData[centerIndex1 * 4]; // RGBA格式，所以乘以4获取R通道
                console.log(`中心点(${centerX1}, ${centerY1})的深度值: ${centerDepth1}`);

                // // 计算阈值，比较新阈值和原阈值
                const newthreshold = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * Math.tan(Math.acos(1/Math.sqrt(3))) / (camera1.maxZ - camera1.minZ);
                // console.log(`阈值为${newthreshold}`);

                // const threshold = 1e-6;
                // console.log(`原阈值为${threshold}`);

                var flag1 = 0;
                var flag2 = 0;

                
                var stepSize = deltaX;
                const steps = 250;  


                // // 原求交方式 flag1结果：1表示命中，2表示规定步数未达到期望像素点，3表示超过了期望像素点
                // for (var i=0; i<steps; i++){
                //     var pixel = new BABYLON.Vector2(0,0);
                //     pixel = RayAtPixel(Ro, Rd, i*stepSize, deltaX, deltaY);
                //     var index = pixel.y * RRT_WIDTH + pixel.x;
                //     var depthOfPixel = depthData[index * 4];
                //     var depthOfRay = (Ro.add(Rd.scale(i*stepSize)).z - camera1.minZ)/ (camera1.maxZ - camera1.minZ);
                //     console.log(`第${i}次求交，像素点(${pixel.x}, ${pixel.y})的深度值为${depthOfPixel}`);
                //     if (depthOfRay > depthOfPixel && (depthOfRay - depthOfPixel) < 1e-6) {
                //         flag1 = 1;
                //         break;
                //     }
                // }
                // if (i == steps && flag1 == 0){
                //     var depthOfRay = (Ro.add(Rd.scale(i*stepSize)).z - camera1.minZ)/ (camera1.maxZ - camera1.minZ);
                //     if (depthOfRay < depthOfPixel && depthOfPixel != 1.0) {
                //         flag1 = 2;
                //     }
                //     else flag1 = 3;
                // }
                // console.log(`原求交方式结果为${flag1}`);


                // // 新求交方式，flag2结果为1表示命中，2表示规定不输未达到期望像素点，3表示超过了期望像素点
                for (var i = 0; i<steps; i++){
                    var pixel = new BABYLON.Vector2(0,0);
                    pixel = RayAtPixel(Ro, Rd, i*stepSize, deltaX, deltaY);
                    var index = pixel.y * RRT_WIDTH + pixel.x;
                    var depthOfPixel = depthData[index * 4];

                    var depthOfRay = DepthOfRay(pixel.x, pixel.y, Ro, Rd, deltaX, deltaY);
                    console.log(`第${i}次求交，像素点(${pixel.x}, ${pixel.y})的深度值为${depthOfPixel}`);
                    console.log(`第${i}次求交，光线深度为${depthOfRay.d_min}到${depthOfRay.d_max}`);
                    if (depthOfRay.d_min <= depthOfPixel && depthOfPixel <= depthOfRay.d_max) {
                        flag2 = 1;
                        break;
                    }
                    else if (depthOfRay.d_min > depthOfPixel && (depthOfRay.d_min - depthOfPixel) < newthreshold) {
                        flag2 = 1;
                        break;
                    }
                }
                if (i == steps && flag2 == 0){
                    var depthOfRay = DepthOfRay(pixel.x, pixel.y, Ro, Rd, deltaX, deltaY);
                    if (depthOfRay.d_max < depthOfPixel) {
                        flag2 = 2;
                    }
                    else flag2 = 3;
                }
                console.log(`新求交方式结果为${flag2}`);
            }
        }).catch((error) => {
            console.error("读取深度图数据时出错:", error);
        });


        // // 测试RayAtPixel
        // var result = new BABYLON.Vector2(0, 0);
        // result = RayAtPixel(new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(1,0,0), 0);
        // console.log(`屏幕中心位于像素${result}`);

        // // 测试DepthOfRay
        // var result = DepthOfRay(Math.floor(width / 2), Math.floor(height / 2), new BABYLON.Vector3(-2,0,0), new BABYLON.Vector3(1,0,0));
        // console.log(`深度带为${result.d_min}到${result.d_max}`);


    });


    function DepthOfRay(i: number, j: number, vo: BABYLON.Vector3, vd: BABYLON.Vector3, deltaX: number, deltaY: number){
        // 视图空间下像素块的区间
        const L = -halfW + i * deltaX;
        const R = L + deltaX;
        const T = halfH - j * deltaY;
        const B = T - deltaY;

        // 计算光线与像素块的交点
        const t1 = (L - vo.x) / vd.x;
        const t2 = (R - vo.x) / vd.x;
        const t3 = (T - vo.y) / vd.y;
        const t4 = (B - vo.y) / vd.y;

        const t_enter = Math.max(t1, t3);
        const t_exit = Math.min(t2, t4);

        // 相交位置（view space）
        const p_enter = vo.add(vd.scale(t_enter));
        const p_exit = vo.add(vd.scale(t_exit));

        // 计算深度
        const depth_enter = (p_enter.z - camera1.minZ) / (camera1.maxZ - camera1.minZ);
        const depth_exit = (p_exit.z - camera1.minZ) / (camera1.maxZ - camera1.minZ);
        
        return depth_enter <= depth_exit ? { d_min: depth_enter, d_max: depth_exit } : { d_min: depth_exit, d_max: depth_enter };
    }

    function RayAtPixel(origin: BABYLON.Vector3, dir: BABYLON.Vector3, t: number, deltaX: number, deltaY: number) {
        // 视图空间
        const viewPosition = origin.add(dir.scale(t));
        const i = Math.floor((viewPosition.x - (-halfW)) / deltaX);
        const j = Math.floor((viewPosition.y - (-halfH)) / deltaY);
        return new BABYLON.Vector2(i, j);
    }



    return scene;
};

const scene = createScene(); //Call the createScene function

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
    scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize();
});