const createScene = () => {
    const scene = new BABYLON.Scene(engine);

    var camera1 = new BABYLON.UniversalCamera("camera1", new BABYLON.Vector3(0, 6, 0), scene);
    camera1.setTarget(new BABYLON.Vector3(0, 0, 0));
    // camera2.attachControl(canvas, true);
    camera1.mode = 1;

    var len = 1.2;
    camera1.orthoTop = len;  // 顶部边界
    camera1.orthoBottom = -len;  // 底部边界
    camera1.orthoLeft = -len;  // 左边界
    camera1.orthoRight = len;  // 右边界

    var camera2 = new BABYLON.UniversalCamera("camera2", new BABYLON.Vector3(-6, 0.0, 0.0), scene);
    camera2.setTarget(new BABYLON.Vector3(-1.0313, 0.6036, -0.1115));
    // camera2.attachControl(canvas, true);
    camera2.mode = 1;

    var len1 = 0.15;
    camera2.orthoTop = len1;  // 顶部边界
    camera2.orthoBottom = -len1;  // 底部边界
    camera2.orthoLeft = -len1;  // 左边界
    camera2.orthoRight = len1;  // 右边界

    // const RRT_WIDTH = 1600;
    // const RRT_HEIGHT = 800;

    const RRT_WIDTH = 200;
    const RRT_HEIGHT = 100;

    const deltaX = (2 * len) / RRT_WIDTH;
    const deltaY = (2 * len) / RRT_HEIGHT;

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0));

    // const box1 = BABYLON.MeshBuilder.CreateBox("box1", {size : deltaX}, scene);
    // box1.position = new BABYLON.Vector3(-1.07175, 0.6738324860634748, -0.2074999999525038);

    // const box2 = BABYLON.MeshBuilder.CreateBox("box2", {size : deltaX}, scene);
    // box2.position = new BABYLON.Vector3(-1.07175, 0.6730479252582882, -0.20449999995250378);

    // const box3 = BABYLON.MeshBuilder.CreateBox("box3", {size : deltaX}, scene);  
    // box3.position = new BABYLON.Vector3(-1.07175, 0.6796183309925254, -0.20149999995250378);

    // const box4 = BABYLON.MeshBuilder.CreateBox("box4", {size : deltaX}, scene);
    // box4.position = new BABYLON.Vector3(-1.07175, 0.6785523642902263, -0.19849999995250378);

    // const box5 = BABYLON.MeshBuilder.CreateBox("box5", {size : deltaX}, scene);
    // box5.position = new BABYLON.Vector3(-1.07175, 0.6850607850647066, -0.19549999995250378);

    // const box6 = BABYLON.MeshBuilder.CreateBox("box6", {size : deltaX}, scene);
    // box6.position = new BABYLON.Vector3(-1.07175, 0.6837780165078584, -0.19249999995250378);

    // const box7 = BABYLON.MeshBuilder.CreateBox("box7", {size : deltaX}, scene);
    // box7.position = new BABYLON.Vector3(-1.07175, 0.6902727598499041, -0.18949999995250377);

    // const box8 = BABYLON.MeshBuilder.CreateBox("box8", {size : deltaX}, scene);
    // box8.position = new BABYLON.Vector3(-1.07175, 0.6887603850336745, -0.18649999995250377);

    // const box9 = BABYLON.MeshBuilder.CreateBox("box9", {size : deltaX}, scene);
    // box9.position = new BABYLON.Vector3(-1.07175, 0.6251172548509203, -0.23299999995250384);

    // const box10 = BABYLON.MeshBuilder.CreateBox("box10", {size : deltaX}, scene);
    // box10.position = new BABYLON.Vector3(-1.07175, 0.65429878, -0.22099999995250377);

    // const box11 = BABYLON.MeshBuilder.CreateBox("box11", {size : deltaX}, scene);
    // box11.position = new BABYLON.Vector3(-1.07175, 0.6668930806627031, -0.20899999995250377);

    // const box12 = BABYLON.MeshBuilder.CreateBox("box12", {size : deltaX}, scene);
    // box12.position = new BABYLON.Vector3(-1.07175, 0.6780279657104984, -0.19699999995250377);

    // const box13 = BABYLON.MeshBuilder.CreateBox("box13", {size : deltaX}, scene);
    // box13.position = new BABYLON.Vector3(-1.07175, 0.6880156924889889, -0.18499999995250377);

    // const box = BABYLON.MeshBuilder.CreateBox("box", {size : deltaX}, scene);
    // box.position = new BABYLON.Vector3(-1.07175, 0.7050071885366924, -0.24849999995250377);

    const origin = new BABYLON.Vector3(-1.07175, 0.7050071885366924, -0.24849999995250377);
    const dir = new BABYLON.Vector3(0, -0.0381141079, 0.0395).normalize();

    const Ro = BABYLON.Vector3.TransformCoordinates(origin, camera1.getViewMatrix(true)); 
    const Rd = BABYLON.Vector3.TransformNormal(dir,   camera1.getViewMatrix(true));  

    const line = BABYLON.MeshBuilder.CreateLines(
  "myLine",
  { points: [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()], updatable: true },
  scene
);
line.isVisible = false;     // 等有参数再显示


    const root = "https://1zsasher.github.io/Babylon/";
    const file = "lathe.babylon"; 
    BABYLON.SceneLoader.Append(root, file, scene, () => {});



    const viewInv = BABYLON.Matrix.Invert(camera1.getViewMatrix());

    var depthRender = new BABYLON.DepthRenderer(scene, BABYLON.Constants.TEXTURETYPE_FLOAT, camera1);
    scene.customRenderTargets.push(depthRender.getDepthMap());
    depthRender.getDepthMap().name = "深度图";

    var depthRTT = depthRender.getDepthMap();
    depthRTT.resize({width : RRT_WIDTH, height : RRT_HEIGHT});

    let obs = null;

    scene.onAfterRenderTargetsRenderObservable.add(() => {
    
        // 创建一个用于存储深度数据的Float32Array 
        const depthData = new Float32Array(RRT_WIDTH * RRT_HEIGHT);
        
        // CPU端读取深度图数据
        depthRTT.readPixels(0, 0, undefined, true).then((readPixelsBuffer) => {
            if (readPixelsBuffer) {
                // 将读取的数据转换为Float32Array
                const pixelData = new Float32Array(readPixelsBuffer.buffer);
                
                // 复制数据到数组
                for (let i = 0; i < pixelData.length && i < depthData.length; i++) {
                    depthData[i] = pixelData[i];
                }
                // const centerX1 = 378;
                // for (var centerY1 = 80; centerY1 < 85; centerY1++) {
                //     const centerIndex1 = ((RRT_HEIGHT - centerY1 - 1) * RRT_WIDTH + centerX1);
                //     const centerDepth1 = depthData[centerIndex1];
                //     console.log(`(${centerX1}, ${centerY1})的深度值: ${centerDepth1}`);    

                //     const world = orthoPixelDepthToWorld(centerX1, centerY1, centerDepth1, camera1, len, len, RRT_WIDTH, RRT_HEIGHT, viewInv);
                //     console.log(world);
                // }

                var flag = 0;

                var stepSize = deltaX;
                const steps = 50;  

                let i = 0;

                // // 原求交方式 flag结果：1表示命中，2表示规定步数未达到期望像素点，3表示超过了期望像素点
                // for (i=0; i<steps; i++){
                //     var pixel = new BABYLON.Vector2(0,0);
                //     pixel = RayAtPixel(Ro, Rd, i*stepSize, deltaX, deltaY);
                //     var index = (RRT_HEIGHT - pixel.y - 1) * RRT_WIDTH + pixel.x;
                //     var depthOfPixel = depthData[index];
                //     var depthOfRay = (Ro.add(Rd.scale(i*stepSize)).z - camera1.minZ)/ (camera1.maxZ - camera1.minZ);
                //     console.log(`第${i}次求交，像素点(${pixel.x}, ${pixel.y})的深度值为${depthOfPixel}`);
                //     console.log(`第${i}次求交，光线深度为${depthOfRay}`);
                //     if (depthOfRay > depthOfPixel && (depthOfRay - depthOfPixel) < 1e-6) {
                //         flag = 1;
                //         break;
                //     }
                // }
                // if (i == steps && flag == 0){
                //     var depthOfRay = (Ro.add(Rd.scale(i*stepSize)).z - camera1.minZ)/ (camera1.maxZ - camera1.minZ);
                //     if (depthOfRay < depthOfPixel && depthOfPixel != 1.0) {
                //         flag = 2;
                //     }
                //     else flag = 3;
                // }
                // console.log(`原求交方式结果为${flag}`);


                const newthreshold = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * Math.tan(Math.acos(1/Math.sqrt(3))) / (camera1.maxZ - camera1.minZ);

                // 新求交方式，flag结果为1表示命中，2表示规定不输未达到期望像素点，3表示超过了期望像素点
                for (i = 0; i<steps; i++){
                    var pixel = new BABYLON.Vector2(0,0);
                    pixel = RayAtPixel(Ro, Rd, i*stepSize, deltaX, deltaY);
                    var index = (RRT_HEIGHT - pixel.y - 1) * RRT_WIDTH + pixel.x;
                    var depthOfPixel = depthData[index];

                    var depthOfRay = DepthOfRay(pixel.x, pixel.y, Ro, Rd, deltaX, deltaY);
                    console.log(`第${i}次求交，像素点(${pixel.x}, ${pixel.y})的深度值为${depthOfPixel}`);
                    console.log(`第${i}次求交，光线深度为${depthOfRay.d_min}到${depthOfRay.d_max}`);
                    if (depthOfRay.d_min <= depthOfPixel && depthOfPixel <= depthOfRay.d_max) {
                        flag = 1;
                        break;
                    }
                    else if (depthOfRay.d_min > depthOfPixel && (depthOfRay.d_min - depthOfPixel) < newthreshold) {
                        flag = 1;
                        break;
                    }
                }
                if (i == steps && flag == 0){
                    var depthOfRay = DepthOfRay(pixel.x, pixel.y, Ro, Rd, deltaX, deltaY);
                    if (depthOfRay.d_max < depthOfPixel) {
                        flag = 2;
                    }
                    else flag = 3;
                }
                console.log(`新求交方式结果为${flag}`);

                // if (flag == 1){
                //     const dest = orthoPixelDepthToWorld(pixel.x, pixel.y, depthOfPixel, camera1, len, len, RRT_WIDTH, RRT_HEIGHT, viewInv);
                //     BABYLON.MeshBuilder.CreateLines(null,{ points: [origin, dest], instance: line }, scene);
                //     line.isVisible = true; 
                // }
                // else if (flag == 3){
                    const dest = Ro.add(Rd.scale(i*stepSize));
                    const pWorld = BABYLON.Vector3.TransformCoordinates(dest, viewInv);
                    BABYLON.MeshBuilder.CreateLines(null,{ points: [origin, pWorld], instance: line }, scene);
                    line.isVisible = true; 

                // }


            }
        }).catch((error) => {
            console.error("读取深度图数据时出错:", error);
        });
    });



    function orthoPixelDepthToWorld(i, j, depth, camera, halfW, halfH, width, height,viewInv){
        const deltaX = (2 * halfW) / width;
        const deltaY = (2 * halfH) / height;

        const x_view = -halfW + (i + 0.5) * deltaX;
        const y_view =  halfH - (j + 0.5) * deltaY;

        const z_view = depth * (camera.maxZ - camera.minZ) + camera.minZ;

        const p_view = new BABYLON.Vector3(x_view, y_view, z_view);
        const p_world = BABYLON.Vector3.TransformCoordinates(p_view, viewInv);
        return p_world;
    }

    function RayAtPixel(origin, dir, t, deltaX, deltaY) {
        // 视图空间
        const viewPosition = origin.add(dir.scale(t));
        const i = Math.floor((viewPosition.x - (-len)) / deltaX);
        const j = RRT_HEIGHT - Math.floor((viewPosition.y - (-len)) / deltaY);
        return new BABYLON.Vector2(i, j);
    }

    function DepthOfRay(i, j, vo, vd, deltaX, deltaY){
        // 视图空间下像素块的区间
        const L = -len + i * deltaX;
        const R = L + deltaX;
        const T = len - j * deltaY;
        const B = T - deltaY;

        // 计算光线与像素块的交点
        const t1 = (L - vo.x) / vd.x;
        const t2 = (R - vo.x) / vd.x;
        const t3 = (T - vo.y) / vd.y;
        const t4 = (B - vo.y) / vd.y;

        const t_enter = Math.max(t2, t3);
        const t_exit = Math.min(t1, t4);

        // 相交位置（view space）
        const p_enter = vo.add(vd.scale(t_enter));
        const p_exit = vo.add(vd.scale(t_exit));

        // 计算深度
        const depth_enter = (p_enter.z - camera1.minZ) / (camera1.maxZ - camera1.minZ);
        const depth_exit = (p_exit.z - camera1.minZ) / (camera1.maxZ - camera1.minZ);
        
        return depth_enter <= depth_exit ? { d_min: depth_enter, d_max: depth_exit } : { d_min: depth_exit, d_max: depth_enter };
    }
            
    return scene;
}
