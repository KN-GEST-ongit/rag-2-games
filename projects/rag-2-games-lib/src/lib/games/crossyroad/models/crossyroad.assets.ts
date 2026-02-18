import { 
  Mesh, 
  MeshBuilder, 
  StandardMaterial, 
  Color3, 
  Scene, 
  ShadowGenerator 
} from '@babylonjs/core';

export class CrossyRoadAssets {

  public static createVoxelPlayer(scene: Scene, shadowGenerator: ShadowGenerator): Mesh {
    const root = new Mesh("player_root", scene);

    const orangeMat = new StandardMaterial("orange", scene);
    orangeMat.diffuseColor = new Color3(1, 0.5, 0);

    const legL = MeshBuilder.CreateBox("legL", { width: 0.1, height: 0.2, depth: 0.1 }, scene);
    legL.position.set(-0.15, 0.1, 0);
    legL.material = orangeMat;
    legL.parent = root;

    const legR = legL.clone("legR");
    legR.position.set(0.15, 0.1, 0);
    legR.parent = root;

    const body = MeshBuilder.CreateBox("body", { width: 0.6, height: 0.6, depth: 0.6 }, scene);
    body.position.y = 0.5;
    const whiteMat = new StandardMaterial("white", scene);
    whiteMat.diffuseColor = Color3.White();
    body.material = whiteMat;
    body.parent = root;

    const comb = MeshBuilder.CreateBox("comb", { width: 0.2, height: 0.15, depth: 0.3 }, scene);
    comb.position.y = 0.85;
    comb.position.z = 0.1;
    const redMat = new StandardMaterial("red", scene);
    redMat.diffuseColor = Color3.Red();
    comb.material = redMat;
    comb.parent = root;

    const beak = MeshBuilder.CreateBox("beak", { width: 0.2, height: 0.1, depth: 0.1 }, scene);
    beak.position.y = 0.65;
    beak.position.z = 0.35;
    beak.material = orangeMat;
    beak.parent = root;

    const eyeL = MeshBuilder.CreateBox("eyeL", { width: 0.05, height: 0.05, depth: 0.05 }, scene);
    eyeL.position.set(-0.15, 0.7, 0.31);
    const blackMat = new StandardMaterial("black", scene);
    blackMat.diffuseColor = Color3.Black();
    eyeL.material = blackMat;
    eyeL.parent = root;

    const eyeR = eyeL.clone("eyeR");
    eyeR.position.set(0.15, 0.7, 0.31);
    eyeR.parent = root;

    const wingL = MeshBuilder.CreateBox("wingL", { width: 0.1, height: 0.3, depth: 0.4 }, scene);
    wingL.position.set(-0.35, 0.5, 0);
    wingL.material = whiteMat;
    wingL.parent = root;

    const wingR = wingL.clone("wingR");
    wingR.position.set(0.35, 0.5, 0);
    wingR.parent = root;

    root.getChildMeshes().forEach(m => shadowGenerator.addShadowCaster(m as Mesh));

    return root;
  }

  public static createVoxelCar(scene: Scene, shadowGenerator: ShadowGenerator, type: 'car_slow' | 'car_fast', width: number): Mesh {
    const root = new Mesh("car_root", scene);
    
    const carMat = new StandardMaterial("carMat", scene);
    if (type === 'car_fast') {
      carMat.diffuseColor = Color3.Red();
    } else {
      const rand = Math.random();
      if (rand < 0.33) carMat.diffuseColor = new Color3(0.2, 0.2, 0.8);
      else if (rand < 0.66) carMat.diffuseColor = new Color3(0.2, 0.8, 0.2);
      else carMat.diffuseColor = new Color3(0.9, 0.9, 0.2);
    }

    const chassis = MeshBuilder.CreateBox("chassis", { width: width, height: 0.5, depth: 0.8 }, scene);
    chassis.position.y = 0.4;
    chassis.material = carMat;
    chassis.parent = root;

    const cabin = MeshBuilder.CreateBox("cabin", { width: width * 0.6, height: 0.4, depth: 0.5 }, scene);
    cabin.position.y = 0.8;
    cabin.position.x = -0.1 * width;
    const glassMat = new StandardMaterial("glass", scene);
    glassMat.diffuseColor = new Color3(0.7, 0.9, 1);
    cabin.material = glassMat;
    cabin.parent = root;

    const wheelMat = new StandardMaterial("wheel", scene);
    wheelMat.diffuseColor = new Color3(0.1, 0.1, 0.1);

    const positions = [
      { x: width/2 - 0.3, z: 0.4 }, { x: -width/2 + 0.3, z: 0.4 },
      { x: width/2 - 0.3, z: -0.4 }, { x: -width/2 + 0.3, z: -0.4 }
    ];

    positions.forEach(pos => {
      const wheel = MeshBuilder.CreateCylinder("wheel", { height: 0.1, diameter: 0.35 }, scene);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(pos.x, 0.17, pos.z);
      wheel.material = wheelMat;
      wheel.parent = root;
    });

    root.getChildMeshes().forEach(m => shadowGenerator.addShadowCaster(m as Mesh));
    return root;
  }

  public static createVoxelTree(scene: Scene, shadowGenerator: ShadowGenerator): Mesh {
    const root = new Mesh("tree_root", scene);

    const trunk = MeshBuilder.CreateBox("trunk", { width: 0.1, height: 0.8, depth: 0.2 }, scene);
    trunk.position.y = 0.4;
    const woodMat = new StandardMaterial("wood", scene);
    woodMat.diffuseColor = new Color3(0.4, 0.2, 0.1);
    trunk.material = woodMat;
    trunk.parent = root;

    const leafMat = new StandardMaterial("leaf", scene);
    leafMat.diffuseColor = new Color3(0.1, 0.6, 0.1);

    const levels = [
      { w: 1.2, y: 0.8 },
      { w: 0.9, y: 1.4 },
      { w: 0.6, y: 1.9 }
    ];

    levels.forEach(lvl => {
      const leaves = MeshBuilder.CreateBox("leaves", { width: lvl.w, height: 0.7, depth: lvl.w }, scene);
      leaves.position.y = lvl.y;
      leaves.material = leafMat;
      leaves.parent = root;
    });

    root.getChildMeshes().forEach(m => shadowGenerator.addShadowCaster(m as Mesh));
    return root;
  }

  public static createVoxelTruck(scene: Scene, shadowGenerator: ShadowGenerator, width: number): Mesh {
    const root = new Mesh("truck_root", scene);

    const trailerWidth = width * 0.7;
    const trailer = MeshBuilder.CreateBox("trailer", { width: trailerWidth, height: 1.2, depth: 0.9 }, scene);
    trailer.position.y = 0.75;
    trailer.position.x = -width * 0.15;
    const trailerMat = new StandardMaterial("trailerMat", scene);
    trailerMat.diffuseColor = new Color3(0.8, 0.8, 0.8); 
    trailer.material = trailerMat;
    trailer.parent = root;

    const cabinWidth = width * 0.25;
    const cabin = MeshBuilder.CreateBox("cabin", { width: cabinWidth, height: 0.8, depth: 0.8 }, scene);
    cabin.position.y = 0.55;
    cabin.position.x = trailerWidth / 2 + cabinWidth / 2 - width * 0.15 + 0.05;
    const cabinMat = new StandardMaterial("cabinMat", scene);
    cabinMat.diffuseColor = new Color3(0.1, 0.4, 0.8); 
    cabin.material = cabinMat;
    cabin.parent = root;

    const wheelMat = new StandardMaterial("wheel", scene);
    wheelMat.diffuseColor = new Color3(0.1, 0.1, 0.1);

    const wheelPositions = [
      { x: cabin.position.x, z: 0.45 }, { x: cabin.position.x, z: -0.45 },
      { x: trailer.position.x + trailerWidth/4, z: 0.45 }, { x: trailer.position.x + trailerWidth/4, z: -0.45 },
      { x: trailer.position.x - trailerWidth/3, z: 0.45 }, { x: trailer.position.x - trailerWidth/3, z: -0.45 }
    ];

    wheelPositions.forEach(pos => {
      const wheel = MeshBuilder.CreateCylinder("wheel", { height: 0.1, diameter: 0.4 }, scene);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(pos.x, 0.2, pos.z);
      wheel.material = wheelMat;
      wheel.parent = root;
    });

    root.getChildMeshes().forEach(m => shadowGenerator.addShadowCaster(m as Mesh));
    return root;
  }
}