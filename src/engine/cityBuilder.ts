import * as THREE from 'three';
import {
  ARENA_HALF_SIZE,
  EnterableBuildingDef,
  MAP_LAYOUTS,
  SharedCollider,
  VehicleSpawnDef,
} from '../shared/mapData';
import { MAPS, MapId } from '../types/game';
import { CityTextures } from './textures';

export interface ExplosiveBarrel {
  id: number;
  mesh: THREE.Group;
  hitMesh: THREE.Mesh;
  position: THREE.Vector3;
  exploded: boolean;
  respawnTimer: number;
}

export interface FlickerLight {
  light: THREE.PointLight;
  bulb: THREE.Mesh;
  baseIntensity: number;
  seed: number;
}

export interface DriveableVehicleMesh {
  def: VehicleSpawnDef;
  root: THREE.Group;
  wheelFL: THREE.Group;
  wheelFR: THREE.Group;
  wheelRL: THREE.Group;
  wheelRR: THREE.Group;
  headlightMat: THREE.MeshStandardMaterial;
  beaconMesh: THREE.Mesh | null;
}

export interface SkyAtmosphere {
  sun: THREE.Mesh;
  moon: THREE.Mesh;
  moonHalo: THREE.Mesh;
  starPoints: THREE.Points;
  starMat: THREE.PointsMaterial;
}

export interface BuiltCity {
  mapId: MapId;
  halfSize: number;
  group: THREE.Group;
  colliders: SharedCollider[];
  worldHitMeshes: THREE.Object3D[];
  barrels: ExplosiveBarrel[];
  flickerLights: FlickerLight[];
  vehicles: DriveableVehicleMesh[];
  skyAtmosphere?: SkyAtmosphere;
  spawnPoints: THREE.Vector3[];
  pickupSpots: THREE.Vector3[];
  helipadChopper?: {
    root: THREE.Group;
    rotorMain: THREE.Object3D;
    rotorTail: THREE.Object3D;
  };
  portalGate: {
    root: THREE.Group;
    ring: THREE.Mesh;
    core: THREE.Mesh;
    pos: THREE.Vector3;
  };
}

export function buildMapEnvironment(mapId: MapId, textures: CityTextures): BuiltCity {
  const layout = MAP_LAYOUTS[mapId];
  const halfSize = layout.halfSize;
  const mapSpec = MAPS[mapId];
  const group = new THREE.Group();
  const colliders = layout.colliders;
  const worldHitMeshes: THREE.Object3D[] = [];
  const barrels: ExplosiveBarrel[] = [];
  const flickerLights: FlickerLight[] = [];
  const vehicles: DriveableVehicleMesh[] = [];
  let skyAtmosphere: SkyAtmosphere | undefined;
  let helipadChopper: BuiltCity['helipadChopper'];

  const groundTint =
    mapId === 'industrial'
      ? 0x252b26
      : mapId === 'military'
        ? 0x232830
        : mapId === 'harbor'
          ? 0x222933
          : mapId === 'subway'
            ? 0x1d1a24
            : mapId === 'hospital'
              ? 0x2a373a
              : mapId === 'forest'
                ? 0x2a3b26
                : mapId === 'desert'
                  ? 0x9c6e44
                  : mapId === 'snowbase'
                    ? 0xb8cde0
                    : 0xffffff;

  const groundMat = new THREE.MeshStandardMaterial({
    map: textures.asphalt,
    bumpMap: textures.asphaltBump,
    bumpScale: 0.05,
    roughnessMap: textures.asphaltRoughness,
    color: groundTint,
    roughness: mapId === 'snowbase' ? 0.72 : 1.0,
    metalness: mapId === 'snowbase' ? 0.08 : 0.16,
  });

  const groundSize =
    mapId === 'harbor'
      ? 92
      : mapId === 'openworld'
        ? 420
        : halfSize > 50
          ? 300
          : 240;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, groundSize), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);
  worldHitMeshes.push(ground);

  const darkMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e2530,
    roughness: 0.45,
    metalness: 0.72,
  });
  const damagedMat = new THREE.MeshStandardMaterial({
    map: textures.buildingDamaged,
    roughness: 0.9,
    metalness: 0.08,
  });
  const facadeMat = new THREE.MeshStandardMaterial({
    map: textures.buildingFacade,
    bumpMap: textures.facadeBump,
    bumpScale: 0.085,
    roughness: 0.8,
    metalness: 0.12,
  });
  const sidewalkMat = new THREE.MeshStandardMaterial({
    map: textures.sidewalk,
    roughness: 0.86,
    metalness: 0.06,
  });

  // Perimeter Barricades (or Natural Barriers on Forest / Desert / Snowbase)
  const barrierMat = new THREE.MeshStandardMaterial({
    color:
      mapId === 'military'
        ? 0x3f4d3b
        : mapId === 'harbor'
          ? 0x334155
          : mapId === 'desert'
            ? 0x7c4a26
            : mapId === 'snowbase'
              ? 0x64748b
              : 0x475569,
    roughness: 0.88,
    metalness: 0.1,
  });
  const stripeHex =
    mapId === 'industrial'
      ? 0x10b981
      : mapId === 'subway'
        ? 0xef4444
        : mapId === 'hospital'
          ? 0x14b8a6
          : mapId === 'forest'
            ? 0x22c55e
            : mapId === 'snowbase'
              ? 0x38bdf8
              : mapId === 'openworld'
                ? 0x22d3ee
                : 0xd97706;
  const stripeMat = new THREE.MeshStandardMaterial({ color: stripeHex, roughness: 0.65 });

  const perimStep = mapId === 'openworld' ? 8 : halfSize > 50 ? 6 : 4;
  const perimLimit = halfSize - 2;
  for (let i = -perimLimit; i <= perimLimit; i += perimStep) {
    const spots: Array<[number, number, number]> = [
      [i, -halfSize - 1, 0],
      [i, halfSize + 1, 0],
      [-halfSize - 1, i, Math.PI / 2],
      [halfSize + 1, i, Math.PI / 2],
    ];
    for (const [bx, bz, rotY] of spots) {
      const bar = new THREE.Group();
      bar.position.set(bx, 0, bz);
      bar.rotation.y = rotY;
      const barLen = mapId === 'openworld' ? 7.2 : halfSize > 50 ? 5.2 : 3.5;
      const base = new THREE.Mesh(new THREE.BoxGeometry(barLen, 1.25, 0.95), barrierMat);
      base.position.y = 0.62;
      base.castShadow = true;
      base.receiveShadow = true;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(barLen + 0.02, 0.2, 0.98), stripeMat);
      stripe.position.y = 1.02;
      bar.add(base, stripe);
      group.add(bar);
      worldHitMeshes.push(base);
    }
  }

  // Helper for streetlamps / hazard beacons
  const addLightPost = (
    x: number,
    z: number,
    rotY: number,
    colorHex: number,
    hasPointLight: boolean,
    intensity = 18,
  ) => {
    const lamp = new THREE.Group();
    lamp.position.set(x, 0, z);
    lamp.rotation.y = rotY;

    const poleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.6, 8), darkMetalMat);
    poleBase.position.y = 0.3;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 6.2, 8), darkMetalMat);
    pole.position.y = 3.4;
    pole.castShadow = true;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.12), darkMetalMat);
    arm.position.set(0.75, 6.45, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.16, 0.35), darkMetalMat);
    head.position.set(1.45, 6.42, 0);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: hasPointLight ? 2.2 : 0.3,
    });
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.26), bulbMat);
    bulb.position.set(1.45, 6.32, 0);

    lamp.add(poleBase, pole, arm, head, bulb);

    if (hasPointLight) {
      const pLight = new THREE.PointLight(colorHex, intensity, 25, 1.6);
      pLight.position.set(1.45, 5.9, 0);
      lamp.add(pLight);

      const coneMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.055,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const lightCone = new THREE.Mesh(
        new THREE.ConeGeometry(3.4, 6.2, 16, 1, true),
        coneMat,
      );
      lightCone.position.set(1.45, 3.15, 0);
      lamp.add(lightCone);

      flickerLights.push({
        light: pLight,
        bulb,
        baseIntensity: intensity,
        seed: Math.random() * 60,
      });
    }
    group.add(lamp);
  };

  // 3D Dynamic Sky (Sun, Moon, Halo & Starfield) on outdoor maps
  if (mapId !== 'subway') {
    const skyGroup = new THREE.Group();
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xfde68a,
      fog: false,
    });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(7.2, 18, 18), sunMat);
    sun.position.set(-70, 88, -145);

    const moonMat = new THREE.MeshBasicMaterial({
      color: mapSpec.moonColor,
      fog: false,
    });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(6.5, 20, 20), moonMat);
    moon.position.set(78, 96, -150);
    const moonHalo = new THREE.Mesh(
      new THREE.SphereGeometry(12, 20, 20),
      new THREE.MeshBasicMaterial({
        color: mapSpec.moonColor,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        fog: false,
      }),
    );
    moonHalo.position.copy(moon.position);
    skyGroup.add(sun, moon, moonHalo);

    const starCount = 260;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.44 + 0.08;
      const r = 190 + Math.random() * 40;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi) + 12;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 0.85,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      fog: false,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    skyGroup.add(starPoints);
    group.add(skyGroup);
    skyAtmosphere = { sun, moon, moonHalo, starPoints, starMat };
  }

  // Helper for composite 3D Dead Twisted Trees (using bark texture)
  const barkMat = new THREE.MeshStandardMaterial({
    map: textures.bark,
    color: 0x5c4b3f,
    roughness: 0.94,
    metalness: 0.02,
  });
  const addDeadTree = (x: number, z: number, rotY: number, scale = 1) => {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.rotation.y = rotY;
    tree.scale.setScalar(scale);

    const rootFlare = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.56, 0.85, 7), barkMat);
    rootFlare.position.y = 0.42;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.34, 4.4, 8), barkMat);
    trunk.position.y = 2.5;
    trunk.rotation.z = 0.04;
    trunk.castShadow = true;
    const branchA = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.14, 2.3, 6), barkMat);
    branchA.position.set(0.65, 4.2, 0.25);
    branchA.rotation.set(0.25, 0, -0.78);
    branchA.castShadow = true;
    const branchB = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.12, 2.1, 6), barkMat);
    branchB.position.set(-0.62, 3.85, -0.2);
    branchB.rotation.set(-0.2, 0, 0.82);
    branchB.castShadow = true;
    const branchC = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 1.65, 6), barkMat);
    branchC.position.set(0.1, 4.9, -0.45);
    branchC.rotation.set(-0.68, 0, 0.22);

    tree.add(rootFlare, trunk, branchA, branchB, branchC);
    group.add(tree);
  };

  // Helper for Curb Traffic Cones & Dumpsters (composite 3D street depth props)
  const coneOrangeMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.55 });
  const coneStripeMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0x334155,
    emissiveIntensity: 0.2,
    roughness: 0.35,
  });
  const addTrafficCone = (x: number, z: number) => {
    const c = new THREE.Group();
    c.position.set(x, 0, z);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.46), darkMetalMat);
    base.position.y = 0.03;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.62, 10), coneOrangeMat);
    cone.position.y = 0.36;
    cone.castShadow = true;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.125, 0.14, 10), coneStripeMat);
    band.position.y = 0.38;
    c.add(base, cone, band);
    group.add(c);
  };

  const dumpsterMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a2f,
    map: textures.carMetal,
    roughness: 0.72,
    metalness: 0.35,
  });
  const addDumpster = (x: number, z: number, rotY: number) => {
    const d = new THREE.Group();
    d.position.set(x, 0, z);
    d.rotation.y = rotY;
    const bin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.15, 1.3), dumpsterMat);
    bin.position.y = 0.62;
    bin.castShadow = true;
    bin.receiveShadow = true;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.12, 1.38), darkMetalMat);
    lid.position.set(0, 1.24, -0.02);
    lid.rotation.x = -0.08;
    const trim = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.14, 1.34), darkMetalMat);
    trim.position.y = 1.05;
    d.add(bin, lid, trim);
    group.add(d);
    worldHitMeshes.push(bin);
  };

  // Helper for Abandoned Cars / Trucks
  const addVehicle = (x: number, z: number, rotY: number, tintHex: number, isTruck = false) => {
    const car = new THREE.Group();
    car.position.set(x, 0, z);
    car.rotation.y = rotY;
    const bodyMat = new THREE.MeshStandardMaterial({
      color: tintHex,
      map: textures.carMetal,
      roughness: 0.55,
      metalness: 0.45,
    });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.14, metalness: 0.88 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.92 });
    const tailLightMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      emissive: 0x991b1b,
      emissiveIntensity: 0.55,
      roughness: 0.3,
    });
    const headLightMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xfde68a,
      emissiveIntensity: 0.65,
      roughness: 0.25,
    });

    const carLen = isTruck ? 5.2 : 4.3;
    const carW = isTruck ? 2.3 : 2.0;
    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(carW, isTruck ? 0.95 : 0.72, carLen),
      bodyMat,
    );
    chassis.position.y = isTruck ? 0.75 : 0.62;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    const bumperF = new THREE.Mesh(new THREE.BoxGeometry(carW + 0.08, 0.22, 0.2), darkMetalMat);
    bumperF.position.set(0, 0.36, carLen / 2 + 0.04);
    const bumperB = bumperF.clone();
    bumperB.position.z = -carLen / 2 - 0.04;
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.06), tailLightMat);
    tailL.position.set(-carW * 0.35, 0.68, -carLen / 2 - 0.01);
    const tailR = tailL.clone();
    tailR.position.x = carW * 0.35;
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.13, 0.06), headLightMat);
    headL.position.set(-carW * 0.35, 0.68, carLen / 2 + 0.01);
    const headR = headL.clone();
    headR.position.x = carW * 0.35;

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(isTruck ? 2.1 : 1.78, 0.68, isTruck ? 2.0 : 2.25),
      bodyMat,
    );
    cabin.position.set(0, isTruck ? 1.52 : 1.24, isTruck ? 1.1 : -0.15);
    cabin.castShadow = true;
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(isTruck ? 2.0 : 1.68, 0.48, isTruck ? 2.05 : 2.32),
      glassMat,
    );
    glass.position.copy(cabin.position);

    car.add(chassis, bumperF, bumperB, tailL, tailR, headL, headR, cabin, glass);

    if (isTruck) {
      const cargo = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 2.8), damagedMat);
      cargo.position.set(0, 1.6, -1.05);
      cargo.castShadow = true;
      car.add(cargo);
      worldHitMeshes.push(cargo);
    }

    const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wPos: Array<[number, number]> = [
      [-1.08, 1.45],
      [1.08, 1.45],
      [-1.08, -1.45],
      [1.08, -1.45],
    ];
    for (const [wx, wz] of wPos) {
      const w = new THREE.Mesh(wheelGeo, tireMat);
      w.position.set(wx, 0.38, wz);
      w.castShadow = true;
      car.add(w);
    }

    group.add(car);
    worldHitMeshes.push(chassis, cabin);
  };

  // =========================================================================
  // ENTERABLE BUILDINGS & DRIVEABLE VEHICLES HELPERS
  // =========================================================================
  const interiorFloorMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.85,
    metalness: 0.12,
  });
  const clinicFloorMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.6,
    metalness: 0.1,
  });
  const deskWoodMat = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    roughness: 0.82,
    metalness: 0.08,
  });
  const bunkerConcreteMat = new THREE.MeshStandardMaterial({
    map: textures.buildingDamaged,
    color: 0x4b5563,
    roughness: 0.9,
  });
  const warehouseRustMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a2a,
    map: textures.carMetal,
    roughness: 0.72,
    metalness: 0.45,
  });

  let interiorPointLightsAdded = 0;

  const addEnterableBuilding3D = (b: EnterableBuildingDef) => {
    const bg = new THREE.Group();
    bg.position.set(b.x, 0, b.z);

    const hw = b.w / 2;
    const hd = b.d / 2;
    const wallT = 0.55;
    const doorH = Math.min(3.5, b.h - 0.9);
    const span = b.doorSide === 'north' || b.doorSide === 'south' ? b.w : b.d;
    const dw = Math.min(b.doorWidth, span - 2.0);
    const halfDoor = dw / 2;

    const wallMat =
      b.style === 'warehouse'
        ? warehouseRustMat
        : b.style === 'bunker'
          ? bunkerConcreteMat
          : b.style === 'clinic'
            ? damagedMat
            : facadeMat;

    const addWallMesh = (wx: number, wy: number, wz: number, ww: number, wh: number, wd: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(ww, wh, wd), wallMat);
      m.position.set(wx, wy, wz);
      m.castShadow = true;
      m.receiveShadow = true;
      bg.add(m);
      worldHitMeshes.push(m);
    };

    const addDoorwayWall = (isZWall: boolean, offsetCoord: number) => {
      const sideSpan = (isZWall ? b.w : b.d) / 2;
      const segLen = Math.max(0.6, sideSpan - halfDoor);
      const centerOffset = halfDoor + segLen / 2;
      if (isZWall) {
        addWallMesh(-centerOffset, b.h / 2, offsetCoord, segLen, b.h, wallT);
        addWallMesh(centerOffset, b.h / 2, offsetCoord, segLen, b.h, wallT);
        if (b.h > doorH) {
          addWallMesh(0, doorH + (b.h - doorH) / 2, offsetCoord, dw, b.h - doorH, wallT);
        }
      } else {
        addWallMesh(offsetCoord, b.h / 2, -centerOffset, wallT, b.h, segLen);
        addWallMesh(offsetCoord, b.h / 2, centerOffset, wallT, b.h, segLen);
        if (b.h > doorH) {
          addWallMesh(offsetCoord, doorH + (b.h - doorH) / 2, 0, wallT, b.h - doorH, dw);
        }
      }

      // Glowing Entrance Sign Strip above doorway
      const signMat = new THREE.MeshBasicMaterial({ color: b.accentHex });
      const signMesh = new THREE.Mesh(
        isZWall ? new THREE.BoxGeometry(dw + 0.4, 0.24, 0.68) : new THREE.BoxGeometry(0.68, 0.24, dw + 0.4),
        signMat,
      );
      signMesh.position.set(isZWall ? 0 : offsetCoord, doorH + 0.14, isZWall ? offsetCoord : 0);
      bg.add(signMesh);
    };

    // North wall
    if (b.doorSide === 'north') addDoorwayWall(true, -hd + wallT / 2);
    else addWallMesh(0, b.h / 2, -hd + wallT / 2, b.w, b.h, wallT);

    // South wall
    if (b.doorSide === 'south') addDoorwayWall(true, hd - wallT / 2);
    else addWallMesh(0, b.h / 2, hd - wallT / 2, b.w, b.h, wallT);

    // West wall
    if (b.doorSide === 'west') addDoorwayWall(false, -hw + wallT / 2);
    else addWallMesh(-hw + wallT / 2, b.h / 2, 0, wallT, b.h, b.d);

    // East wall
    if (b.doorSide === 'east') addDoorwayWall(false, hw - wallT / 2);
    else addWallMesh(hw - wallT / 2, b.h / 2, 0, wallT, b.h, b.d);

    // Interior Floor Slab
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(b.w - 0.6, 0.18, b.d - 0.6),
      b.style === 'clinic' ? clinicFloorMat : interiorFloorMat,
    );
    floor.position.y = 0.11;
    floor.receiveShadow = true;
    bg.add(floor);

    // Interior Ceiling (gives shelter + TPS camera headroom at 4.5m) & Exterior Roof
    const ceilingY = Math.min(4.6, b.h - 0.35);
    const ceiling = new THREE.Mesh(
      new THREE.BoxGeometry(b.w - 0.4, 0.3, b.d - 0.4),
      darkMetalMat,
    );
    ceiling.position.y = ceilingY;
    bg.add(ceiling);
    worldHitMeshes.push(ceiling);

    if (b.h > 6.5) {
      const topRoof = new THREE.Mesh(
        new THREE.BoxGeometry(b.w + 0.4, 0.7, b.d + 0.4),
        damagedMat,
      );
      topRoof.position.y = b.h + 0.35;
      bg.add(topRoof);
      if (b.style === 'office') {
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 3.8, 6), darkMetalMat);
        antenna.position.set(-hw * 0.35, b.h + 2.4, -hd * 0.35);
        bg.add(antenna);
      }
    }

    // Glowing Interior Light Fixture
    const lampPanel = new THREE.Mesh(
      new THREE.BoxGeometry(Math.min(3.2, b.w * 0.4), 0.12, Math.min(1.8, b.d * 0.3)),
      new THREE.MeshBasicMaterial({ color: b.style === 'clinic' ? 0xe0f2fe : b.accentHex }),
    );
    lampPanel.position.y = ceilingY - 0.2;
    bg.add(lampPanel);

    if (
      interiorPointLightsAdded < 6 &&
      (b.id === 'ow_plaza_nw' || b.id === 'ow_mil_b1' || b.id === 'ow_mil_b3' || b.id === 'ow_sub_c1' || b.id === 'ow_ind_w1' || mapId !== 'openworld')
    ) {
      interiorPointLightsAdded++;
      const pLight = new THREE.PointLight(b.style === 'clinic' ? 0xdbeafe : b.accentHex, 14, 16, 1.5);
      pLight.position.set(0, ceilingY - 0.45, 0);
      bg.add(pLight);
    }

    // Interior Furnishings (placed towards rear/corner away from center doorway path)
    const backX = b.doorSide === 'west' ? hw - 1.6 : b.doorSide === 'east' ? -hw + 1.6 : 0;
    const backZ = b.doorSide === 'north' ? hd - 1.6 : b.doorSide === 'south' ? -hd + 1.6 : 0;
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.82, 1.0),
      b.style === 'bunker' ? darkMetalMat : deskWoodMat,
    );
    desk.position.set(backX, 0.52, backZ);
    desk.castShadow = true;
    desk.receiveShadow = true;
    const monitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.48, 0.12),
      new THREE.MeshBasicMaterial({ color: b.accentHex }),
    );
    monitor.position.set(backX, 1.18, backZ);
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.95, 1.1),
      b.style === 'clinic' ? clinicFloorMat : warehouseRustMat,
    );
    crate.position.set(
      b.doorSide === 'north' || b.doorSide === 'south' ? hw - 1.5 : backX,
      0.58,
      b.doorSide === 'east' || b.doorSide === 'west' ? hd - 1.5 : backZ,
    );
    crate.castShadow = true;
    bg.add(desk, monitor, crate);

    group.add(bg);
  };

  const createDriveableVehicle3D = (v: VehicleSpawnDef) => {
    const root = new THREE.Group();
    root.position.set(v.x, 0, v.z);
    root.rotation.y = v.rotY;

    const paintMat = new THREE.MeshStandardMaterial({
      color: v.colorHex,
      map: textures.carMetal,
      roughness: 0.42,
      metalness: 0.52,
    });
    const accentWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.45,
      metalness: 0.3,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.12,
      metalness: 0.88,
    });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.92 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.8 });
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xfde68a,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      emissive: 0xef4444,
      emissiveIntensity: 0.75,
      roughness: 0.3,
    });

    const isTruck = v.kind === 'industrial_truck';
    const isVan = v.kind === 'quarantine_van';
    const isHumvee = v.kind === 'military_humvee';
    const bodyW = isTruck || isHumvee ? 2.28 : 2.04;
    const bodyLen = isTruck ? 5.1 : isVan ? 4.7 : 4.35;

    const chassis = new THREE.Mesh(
      new THREE.BoxGeometry(bodyW, isTruck ? 0.88 : 0.72, bodyLen),
      paintMat,
    );
    chassis.position.y = 0.72;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    root.add(chassis);

    if (v.kind === 'police_suv') {
      const doorWhite = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.03, 0.62, 1.9), accentWhiteMat);
      doorWhite.position.set(0, 0.72, 0.05);
      root.add(doorWhite);
    }

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(bodyW - 0.18, isVan ? 1.05 : 0.76, isTruck ? 1.85 : isVan ? 3.5 : 2.3),
      v.kind === 'police_suv' ? accentWhiteMat : paintMat,
    );
    cabin.position.set(0, isVan ? 1.56 : 1.4, isTruck ? 1.25 : isVan ? -0.35 : -0.2);
    cabin.castShadow = true;
    root.add(cabin);

    if (isTruck) {
      const cargoBed = new THREE.Mesh(new THREE.BoxGeometry(bodyW - 0.08, 1.15, 2.7), damagedMat);
      cargoBed.position.set(0, 1.58, -1.08);
      cargoBed.castShadow = true;
      root.add(cargoBed);
    }

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(bodyW - 0.24, 0.52, isTruck ? 1.92 : isVan ? 3.35 : 2.38),
      glassMat,
    );
    glass.position.copy(cabin.position);
    root.add(glass);

    // Front Bumper (+Z is forward) & Rear Bumper (-Z)
    const bumperF = new THREE.Mesh(new THREE.BoxGeometry(bodyW + 0.14, 0.28, 0.26), darkMetalMat);
    bumperF.position.set(0, 0.44, bodyLen / 2 + 0.06);
    const bumperB = bumperF.clone();
    bumperB.position.z = -bodyLen / 2 - 0.06;
    root.add(bumperF, bumperB);

    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.08), headlightMat);
    headL.position.set(-bodyW * 0.34, 0.76, bodyLen / 2 + 0.02);
    const headR = headL.clone();
    headR.position.x = bodyW * 0.34;
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.08), taillightMat);
    tailL.position.set(-bodyW * 0.34, 0.76, -bodyLen / 2 - 0.02);
    const tailR = tailL.clone();
    tailR.position.x = bodyW * 0.34;
    root.add(headL, headR, tailL, tailR);

    // Roof Lightbar / Strobe Beacon
    const beaconColor =
      v.kind === 'police_suv'
        ? 0x38bdf8
        : v.kind === 'quarantine_van'
          ? 0xf43f5e
          : 0xf59e0b;
    const beaconMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.18, 0.28),
      new THREE.MeshBasicMaterial({ color: beaconColor }),
    );
    beaconMesh.position.set(0, cabin.position.y + (isVan ? 0.62 : 0.48), cabin.position.z + 0.2);
    root.add(beaconMesh);

    // 4 Rotating + Steerable Wheels
    const makeWheel = (wx: number, wz: number): THREE.Group => {
      const wg = new THREE.Group();
      wg.rotation.order = 'YXZ';
      wg.position.set(wx, 0.42, wz);
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 14), tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.34, 10), rimMat);
      rim.rotation.z = Math.PI / 2;
      wg.add(tire, rim);
      root.add(wg);
      return wg;
    };

    const wheelX = bodyW * 0.5 + 0.05;
    const wheelZ = bodyLen * 0.34;
    const wheelFL = makeWheel(-wheelX, wheelZ);
    const wheelFR = makeWheel(wheelX, wheelZ);
    const wheelRL = makeWheel(-wheelX, -wheelZ);
    const wheelRR = makeWheel(wheelX, -wheelZ);

    group.add(root);
    vehicles.push({
      def: v,
      root,
      wheelFL,
      wheelFR,
      wheelRL,
      wheelRR,
      headlightMat,
      beaconMesh,
    });
  };

  // =========================================================================
  // MAP-SPECIFIC 3D GEOMETRY
  // =========================================================================

  // Render all enterable hollow buildings defined in MAP_LAYOUTS
  layout.buildings.forEach(addEnterableBuilding3D);

  if (mapId === 'openworld') {
    // -----------------------------------------------------------------------
    // OPEN WORLD: 5 INTERCONNECTED DISTRICTS ACROSS 260m x 260m
    // -----------------------------------------------------------------------
    const yellowLineMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });

    // Main N-S and E-W Highways + Outer Ring Avenue stripes
    for (let i = -124; i <= 124; i += 8) {
      if (Math.abs(i) < 8) continue;
      const dZ = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 3.6), yellowLineMat);
      dZ.rotation.x = -Math.PI / 2;
      dZ.position.set(0, 0.02, i);
      const dX = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.32), yellowLineMat);
      dX.rotation.x = -Math.PI / 2;
      dX.position.set(i, 0.02, 0);
      group.add(dZ, dX);
    }
    for (const ringCoord of [-70, 70]) {
      for (let i = -114; i <= 114; i += 10) {
        if (Math.abs(i) < 10) continue;
        const rX = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 0.24), yellowLineMat);
        rX.rotation.x = -Math.PI / 2;
        rX.position.set(i, 0.02, ringCoord);
        const rZ = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 4.0), yellowLineMat);
        rZ.rotation.x = -Math.PI / 2;
        rZ.position.set(ringCoord, 0.02, i);
        group.add(rX, rZ);
      }
    }

    // District Sidewalk Pads
    for (const [bx, bz, s] of [
      [-25, -25, 34],
      [25, -25, 34],
      [-25, 25, 34],
      [25, 25, 34],
      [-70, -70, 52],
      [70, -70, 52],
      [-70, 70, 52],
      [76, 76, 56],
    ] as Array<[number, number, number]>) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(s, 0.14, s), sidewalkMat);
      pad.position.set(bx, 0.07, bz);
      pad.receiveShadow = true;
      group.add(pad);
      worldHitMeshes.push(pad);
    }

    // Enterable Central Plaza & Ring Towers are built from layout.buildings above!
    const addBuilding = (x: number, z: number, w: number, d: number, h: number) => {
      const b = new THREE.Group();
      b.position.set(x, 0, z);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 1.2, d + 0.8), damagedMat);
      plinth.position.y = 0.6;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), facadeMat);
      tower.position.y = h / 2 + 0.6;
      tower.castShadow = true;
      tower.receiveShadow = true;
      b.add(plinth, tower);
      group.add(b);
      worldHitMeshes.push(tower, plinth);
    };
    void addBuilding;

    // Central Radio Relay Tower at (0, -31.5)
    const radioGroup = new THREE.Group();
    radioGroup.position.set(0, 0, -31.5);
    const radioBase = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.2, 4.0), damagedMat);
    radioBase.position.y = 1.1;
    radioBase.castShadow = true;
    const radioMast = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.95, 14, 6), darkMetalMat);
    radioMast.position.y = 9.0;
    const radioDish = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 0.35, 0.9, 12),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.7, roughness: 0.25 }),
    );
    radioDish.rotation.x = Math.PI / 3;
    radioDish.position.set(0, 13.5, 0.9);
    const radioBeacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
    );
    radioBeacon.position.y = 16.4;
    radioGroup.add(radioBase, radioMast, radioDish, radioBeacon);
    group.add(radioGroup);
    worldHitMeshes.push(radioBase);

    // 2. NW Industrial Refinery (-70, -70)
    const rustMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a2a,
      map: textures.carMetal,
      roughness: 0.72,
      metalness: 0.45,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.78,
    });
    const toxicGlowMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });
    const addOpenSilo = (x: number, z: number, r: number, h: number) => {
      const silo = new THREE.Group();
      silo.position.set(x, 0, z);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), steelMat);
      body.position.y = h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, 1.1, 16), rustMat);
      cap.position.y = h + 0.55;
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.12, r + 0.12, 0.4, 16), toxicGlowMat);
      ring.position.y = h * 0.65;
      silo.add(body, cap, ring);
      group.add(silo);
      worldHitMeshes.push(body);
    };
    addOpenSilo(-76, -78, 3.9, 14);
    addOpenSilo(-60, -84, 3.2, 12);

    // Enterable Industrial Warehouses (ow_ind_w1, ow_ind_w2) are built from layout.buildings

    const addOpenPipe = (x: number, z: number, w: number, d: number) => {
      const rack = new THREE.Group();
      rack.position.set(x, 0, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(w, 1.4, d), damagedMat);
      base.position.y = 0.7;
      base.castShadow = true;
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, Math.max(w, d), 12), toxicGlowMat);
      pipe.position.y = 1.9;
      if (w > d) pipe.rotation.z = Math.PI / 2;
      else pipe.rotation.x = Math.PI / 2;
      rack.add(base, pipe);
      group.add(rack);
      worldHitMeshes.push(base, pipe);
    };
    addOpenPipe(-70, -56, 4.5, 8.0);
    addOpenPipe(-84, -74, 7.6, 4.0);

    // 3. NE Military Outpost (70, -70) — Enterable Bunkers built from layout.buildings
    const oliveMat = new THREE.MeshStandardMaterial({ color: 0x3f4d3b, roughness: 0.78, metalness: 0.25 });
    const concreteMat = new THREE.MeshStandardMaterial({ map: textures.buildingDamaged, color: 0x4b5563, roughness: 0.9 });
    const milRadar = new THREE.Group();
    milRadar.position.set(72, 0, -92);
    const mrBase = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.2, 5.8), concreteMat);
    mrBase.position.y = 1.6;
    const mrMast = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.2, 13, 6), darkMetalMat);
    mrMast.position.y = 9.5;
    const mrDish = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.2, 12), oliveMat);
    mrDish.rotation.x = Math.PI / 3;
    mrDish.position.set(0, 16.5, 0.8);
    milRadar.add(mrBase, mrMast, mrDish);
    group.add(milRadar);
    worldHitMeshes.push(mrBase);

    for (const [cx, cz] of [[60, -64], [80, -70]]) {
      const cont = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.7, 8.0), oliveMat);
      cont.position.set(cx, 1.35, cz);
      cont.castShadow = true;
      cont.receiveShadow = true;
      group.add(cont);
      worldHitMeshes.push(cont);
    }
    addVehicle(48, -52, 0.45, 0x3f4d3b, true);

    // 4. SW Quarantine Subway Yard (-70, 70)
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.85 });
    for (const rx of [-83.2, -80.8, -63.2, -60.8]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 52), trackMat);
      rail.position.set(rx, 0.07, 74);
      group.add(rail);
    }
    const trainBodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, map: textures.carMetal, roughness: 0.5, metalness: 0.5 });
    const trainStripeMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.5 });
    const trainGlowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    for (const [tx, tz] of [[-62, 60], [-62, 86], [-82, 64], [-82, 90]]) {
      const car = new THREE.Group();
      car.position.set(tx, 0, tz);
      const hull = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.4, 18.4), trainBodyMat);
      hull.position.y = 1.85;
      hull.castShadow = true;
      hull.receiveShadow = true;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.06, 0.42, 18.44), trainStripeMat);
      stripe.position.y = 1.5;
      const win = new THREE.Mesh(new THREE.BoxGeometry(4.05, 0.85, 15.0), trainGlowMat);
      win.position.y = 2.45;
      car.add(hull, stripe, win);
      group.add(car);
      worldHitMeshes.push(hull);
    }
    // Enterable Quarantine Clinics (-96, 74) and (-48, 76) built from layout.buildings

    // 5. SE Dark Harbor & Extraction Helipad (76, 76)
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x061829,
      roughness: 0.14,
      metalness: 0.85,
    });
    const oceanE = new THREE.Mesh(new THREE.PlaneGeometry(160, 420), oceanMat);
    oceanE.rotation.x = -Math.PI / 2;
    oceanE.position.set(212, -0.35, 0);
    const oceanS = new THREE.Mesh(new THREE.PlaneGeometry(420, 160), oceanMat);
    oceanS.rotation.x = -Math.PI / 2;
    oceanS.position.set(0, -0.35, 212);
    group.add(oceanE, oceanS);

    const addHarborCont = (x: number, y: number, z: number, rotY: number, colorHex: number) => {
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        map: textures.carMetal,
        roughness: 0.6,
        metalness: 0.35,
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(8.6, 2.8, 3.6), mat);
      box.position.set(x, y + 1.4, z);
      box.rotation.y = rotY;
      box.castShadow = true;
      box.receiveShadow = true;
      group.add(box);
      worldHitMeshes.push(box);
    };
    addHarborCont(54, 0, 56, 0, 0x991b1b);
    addHarborCont(54, 2.8, 56, 0, 0x1e3a8a);
    addHarborCont(54, 0, 64, 0, 0xb45309);
    addHarborCont(96, 0, 56, Math.PI / 2, 0x0f766e);
    addHarborCont(96, 2.8, 56, Math.PI / 2, 0x475569);
    addHarborCont(54, 0, 92, 0, 0x1e3a8a);
    addHarborCont(54, 2.8, 92, 0, 0x991b1b);

    const craneMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.55 });
    for (const [cx, cz] of [[102, 88], [46, 86]]) {
      const crane = new THREE.Group();
      crane.position.set(cx, 0, cz);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(3.6, 17, 3.6), craneMat);
      leg.position.y = 8.5;
      leg.castShadow = true;
      const boom = new THREE.Mesh(new THREE.BoxGeometry(16, 1.8, 2.6), craneMat);
      boom.position.set(cx > 75 ? -5 : 5, 16.5, 0);
      crane.add(leg, boom);
      group.add(crane);
      worldHitMeshes.push(leg);
    }

    // Extraction Helipad at (78, 78)
    const padGroup = new THREE.Group();
    padGroup.position.set(78, 0.16, 78);
    const padDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(8.5, 8.9, 0.28, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.15 }),
    );
    const padRing = new THREE.Mesh(
      new THREE.RingGeometry(7.1, 7.8, 24),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide }),
    );
    padRing.rotation.x = -Math.PI / 2;
    padRing.position.y = 0.16;
    const hMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const hLeft = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.04, 5.2), hMat);
    hLeft.position.set(-1.8, 0.16, 0);
    const hRight = hLeft.clone();
    hRight.position.x = 1.8;
    const hCross = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.04, 0.75), hMat);
    hCross.position.set(0, 0.16, 0);
    padGroup.add(padDisc, padRing, hLeft, hRight, hCross);

    const padLightMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    for (const [lx, lz] of [[-7.6, -7.6], [7.6, -7.6], [-7.6, 7.6], [7.6, 7.6]]) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.45, 8), padLightMat);
      b.position.set(lx, 0.25, lz);
      padGroup.add(b);
    }
    group.add(padGroup);

    // 3D Rescue Helicopter (composite model hovering above Helipad, descends during Extraction!)
    const chopperRoot = new THREE.Group();
    chopperRoot.position.set(78, 28, 78);
    chopperRoot.rotation.y = -Math.PI * 0.75;
    chopperRoot.visible = false;
    const heliPaint = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.42, metalness: 0.6 });
    const heliAccent = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.45, metalness: 0.35 });
    const heliGlass = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.15, metalness: 0.85, emissive: 0x0369a1, emissiveIntensity: 0.35 });

    const fuselage = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.2, 6.2), heliPaint);
    fuselage.position.y = 1.5;
    fuselage.castShadow = true;
    const nose = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 1.9), heliGlass);
    nose.position.set(0, 1.35, 3.3);
    nose.rotation.x = 0.22;
    const tailBoom = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 5.4), heliPaint);
    tailBoom.position.set(0, 1.85, -5.2);
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.8, 1.1), heliAccent);
    tailFin.position.set(0, 2.55, -7.6);
    const skidL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 5.2), darkMetalMat);
    skidL.position.set(-1.15, 0.15, 0.3);
    const skidR = skidL.clone();
    skidR.position.x = 1.15;
    const beaconHeli = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    beaconHeli.position.set(0, 0.45, 3.0);

    const rotorMain = new THREE.Group();
    rotorMain.position.set(0, 2.95, 0.2);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 8), darkMetalMat);
    const bladeA = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.08, 0.38), darkMetalMat);
    bladeA.position.y = 0.22;
    const bladeB = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.08, 11.6), darkMetalMat);
    bladeB.position.y = 0.22;
    rotorMain.add(mast, bladeA, bladeB);

    const rotorTail = new THREE.Group();
    rotorTail.position.set(0.5, 2.55, -7.6);
    const tBlade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.85, 0.22), heliAccent);
    rotorTail.add(tBlade);

    chopperRoot.add(fuselage, nose, tailBoom, tailFin, skidL, skidR, beaconHeli, rotorMain, rotorTail);
    group.add(chopperRoot);
    helipadChopper = { root: chopperRoot, rotorMain, rotorTail };

    // Vehicles across Highways & Sectors
    addVehicle(-4.5, 13.5, 0.35, 0x64748b);
    addVehicle(5.0, -14.5, -0.5, 0x7f1d1d);
    addVehicle(-32, -3.8, 1.42, 0x334155);
    addVehicle(32, 4.0, 1.75, 0x475569);
    addVehicle(-4.5, -56, 0.2, 0x3f6212);
    addVehicle(5.5, 56, -0.35, 0x52525b);
    addVehicle(-56, 4.5, 1.5, 0x7f1d1d);
    addVehicle(56, -4.5, -1.4, 0x334155);

    // Streetlights across Central & District Hubs (capped PointLights for 60fps)
    addLightPost(-7.6, -12, 0, 0xffb703, true, 18);
    addLightPost(7.6, 12, Math.PI, 0xffb703, true, 18);
    addLightPost(-64, -64, 0, 0x34d399, true, 18);
    addLightPost(64, -64, Math.PI, 0x60a5fa, true, 18);
    addLightPost(-64, 64, Math.PI / 2, 0xf43f5e, true, 18);
    addLightPost(66, 66, -Math.PI / 2, 0xf59e0b, true, 20);
    // Non-light emissive street poles along avenues
    addLightPost(0, -52, 0, 0x38bdf8, false);
    addLightPost(0, 52, Math.PI, 0x38bdf8, false);
    addLightPost(-52, 0, Math.PI / 2, 0x38bdf8, false);
    addLightPost(52, 0, -Math.PI / 2, 0x38bdf8, false);

    // Props & Natural Outer Wilderness Cliffs + Dead-Tree Groves
    addTrafficCone(-7.8, 7.8);
    addTrafficCone(7.8, -7.8);
    addDumpster(-15.8, -22, Math.PI / 2);
    addDumpster(15.2, 22, -Math.PI / 2);

    const cliffMat = new THREE.MeshStandardMaterial({ color: 0x1e242c, roughness: 0.96, metalness: 0.05 });
    for (let i = -120; i <= 120; i += 24) {
      const rockN = new THREE.Mesh(new THREE.DodecahedronGeometry(6.5 + (Math.abs(i) % 5), 0), cliffMat);
      rockN.position.set(i, 2.5, -142);
      rockN.scale.set(1.6, 1.3, 1.2);
      const rockW = new THREE.Mesh(new THREE.DodecahedronGeometry(6.2 + (Math.abs(i) % 4), 0), cliffMat);
      rockW.position.set(-142, 2.5, i);
      rockW.scale.set(1.2, 1.35, 1.6);
      group.add(rockN, rockW);

      addDeadTree(i + 8, -135, i * 0.2, 1.35);
      addDeadTree(-135, i - 6, i * 0.3, 1.3);
      if (i < 40) {
        addDeadTree(i, 135, i * 0.4, 1.25);
        addDeadTree(135, i, i * 0.5, 1.25);
      }
    }
  } else if (mapId === 'metro') {
    const yellowLineMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.85,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    for (let i = -40; i <= 40; i += 6) {
      if (Math.abs(i) < 7) continue;
      const dZ = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 3.0), yellowLineMat);
      dZ.rotation.x = -Math.PI / 2;
      dZ.position.set(0, 0.02, i);
      const dX = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.28), yellowLineMat);
      dX.rotation.x = -Math.PI / 2;
      dX.position.set(i, 0.02, 0);
      group.add(dZ, dX);
    }

    for (const [bx, bz] of [[-25, -25], [25, -25], [-25, 25], [25, 25]]) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(34, 0.14, 34), sidewalkMat);
      pad.position.set(bx, 0.07, bz);
      pad.receiveShadow = true;
      group.add(pad);
      worldHitMeshes.push(pad);
    }

    const addBuilding = (x: number, z: number, w: number, d: number, h: number) => {
      const b = new THREE.Group();
      b.position.set(x, 0, z);
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 1.2, d + 0.8), damagedMat);
      plinth.position.y = 0.6;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), facadeMat);
      tower.position.y = h / 2 + 0.6;
      tower.castShadow = true;
      tower.receiveShadow = true;
      b.add(plinth, tower);
      group.add(b);
      worldHitMeshes.push(tower, plinth);
    };

    // 4 main Metro plaza buildings are enterable via layout.buildings; side blocks & distant skyline stay solid
    addBuilding(-35, -18, 6, 7, 10);
    addBuilding(35, 18, 7, 6, 11);
    addBuilding(-18, 35, 7, 6, 9);
    addBuilding(18, -35, 6, 7, 12);
    // Distant skyline
    addBuilding(-64, -55, 16, 16, 32);
    addBuilding(64, -55, 16, 16, 30);
    addBuilding(-64, 55, 16, 16, 34);
    addBuilding(64, 55, 16, 16, 31);

    addVehicle(-4.2, 13.5, 0.35, 0x64748b);
    addVehicle(5.0, -16.5, -0.5, 0x7f1d1d);
    addVehicle(-15.5, -3.5, 1.42, 0x334155);
    addVehicle(16.0, 4.2, 1.75, 0x475569);
    addVehicle(-29.0, 6.0, 0.2, 0x3f6212);
    addVehicle(29.0, -6.5, -0.35, 0x52525b);

    addLightPost(-7.6, -12, 0, 0xffb703, true);
    addLightPost(7.6, 12, Math.PI, 0xffb703, true);
    addLightPost(-12, 7.6, Math.PI / 2, 0xffb703, true);
    addLightPost(12, -7.6, -Math.PI / 2, 0xffb703, true);

    // Sidewalk depth props & perimeter dead trees
    addTrafficCone(-7.8, 7.8);
    addTrafficCone(7.8, -7.8);
    addTrafficCone(-8.2, -20);
    addTrafficCone(8.2, 20);
    addDumpster(-15.8, -22, Math.PI / 2);
    addDumpster(15.2, 22, -Math.PI / 2);
    addDeadTree(-46, -24, 0.4, 1.25);
    addDeadTree(46, -22, 1.8, 1.3);
    addDeadTree(-46, 26, 2.5, 1.15);
    addDeadTree(46, 24, 0.9, 1.2);
  } else if (mapId === 'industrial') {
    const rustMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a2a,
      map: textures.carMetal,
      roughness: 0.72,
      metalness: 0.45,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.78,
    });
    const toxicGlowMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });

    const addSilo = (x: number, z: number, r: number, h: number) => {
      const silo = new THREE.Group();
      silo.position.set(x, 0, z);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), steelMat);
      body.position.y = h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r, 1.1, 16), rustMat);
      cap.position.y = h + 0.55;
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.12, r + 0.12, 0.4, 16), toxicGlowMat);
      ring.position.y = h * 0.65;
      silo.add(body, cap, ring);
      group.add(silo);
      worldHitMeshes.push(body);
    };

    addSilo(-20, -20, 3.9, 13);
    addSilo(-10, -24, 3.1, 11);
    addSilo(20, 20, 3.9, 13);
    addSilo(10, 24, 3.1, 11);

    // Enterable industrial warehouses (in_ne, in_sw) are built from layout.buildings

    // Chemical pipe racks as cover
    const addPipeRack = (x: number, z: number, w: number, d: number) => {
      const rack = new THREE.Group();
      rack.position.set(x, 0, z);
      const base = new THREE.Mesh(new THREE.BoxGeometry(w, 1.4, d), damagedMat);
      base.position.y = 0.7;
      base.castShadow = true;
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, Math.max(w, d), 12), toxicGlowMat);
      pipe.position.y = 1.9;
      if (w > d) pipe.rotation.z = Math.PI / 2;
      else pipe.rotation.x = Math.PI / 2;
      rack.add(base, pipe);
      group.add(rack);
      worldHitMeshes.push(base, pipe);
    };

    addPipeRack(-14, 0, 4.6, 8.5);
    addPipeRack(14, 0, 4.6, 8.5);
    addPipeRack(0, -14, 7.6, 4.0);
    addPipeRack(0, 14, 7.6, 4.0);

    addLightPost(-8, -8, 0, 0x34d399, true, 19);
    addLightPost(8, 8, Math.PI, 0x34d399, true, 19);
    addLightPost(-8, 8, Math.PI / 2, 0xf59e0b, true, 16);
    addLightPost(8, -8, -Math.PI / 2, 0xf59e0b, true, 16);
  } else if (mapId === 'military') {
    const oliveMat = new THREE.MeshStandardMaterial({ color: 0x3f4d3b, roughness: 0.78, metalness: 0.25 });
    const concreteMat = new THREE.MeshStandardMaterial({ map: textures.buildingDamaged, color: 0x4b5563, roughness: 0.9 });

    // Enterable military bunkers (ml_nw..ml_se) are built from layout.buildings

    // Radar Tower
    const radar = new THREE.Group();
    radar.position.set(0, 0, -28);
    const rBase = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.2, 5.8), concreteMat);
    rBase.position.y = 1.6;
    const rMast = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 1.2, 13, 6), darkMetalMat);
    rMast.position.y = 9.5;
    const rDish = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.2, 12), oliveMat);
    rDish.rotation.x = Math.PI / 3;
    rDish.position.set(0, 16.5, 0.8);
    radar.add(rBase, rMast, rDish);
    group.add(radar);
    worldHitMeshes.push(rBase);

    // Military Cargo Containers & Armored Trucks
    const addMilContainer = (x: number, z: number, rotY: number) => {
      const c = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.7, 8.0), oliveMat);
      c.position.set(x, 1.35, z);
      c.rotation.y = rotY;
      c.castShadow = true;
      c.receiveShadow = true;
      group.add(c);
      worldHitMeshes.push(c);
    };
    addMilContainer(-12, -4, 0);
    addMilContainer(12, 4, 0);
    addMilContainer(0, 15, Math.PI / 2);

    addVehicle(-28, 4, 0.4, 0x3f4d3b, true);
    addVehicle(28, -4, -0.4, 0x3f4d3b, true);

    addLightPost(-10, -10, 0, 0x60a5fa, true, 20);
    addLightPost(10, 10, Math.PI, 0x60a5fa, true, 20);
    addLightPost(-10, 10, Math.PI / 2, 0xe2e8f0, true, 16);
    addLightPost(10, -10, -Math.PI / 2, 0xe2e8f0, true, 16);

    addDeadTree(-47, -34, 0.6, 1.3);
    addDeadTree(47, -34, 2.1, 1.35);
    addDeadTree(-47, 34, 1.2, 1.2);
    addDeadTree(47, 34, 0.2, 1.25);
  } else if (mapId === 'harbor') {
    // Dark Night Ocean surrounding the concrete pier
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x061829,
      roughness: 0.14,
      metalness: 0.85,
    });
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(280, 280), oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -0.45;
    group.add(ocean);

    const addContainer = (x: number, y: number, z: number, rotY: number, colorHex: number) => {
      const mat = new THREE.MeshStandardMaterial({
        color: colorHex,
        map: textures.carMetal,
        roughness: 0.6,
        metalness: 0.35,
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(8.6, 2.8, 3.6), mat);
      box.position.set(x, y + 1.4, z);
      box.rotation.y = rotY;
      box.castShadow = true;
      box.receiveShadow = true;
      group.add(box);
      worldHitMeshes.push(box);
    };

    // Stacked Shipping Containers
    addContainer(-18, 0, -18, 0, 0x991b1b);
    addContainer(-18, 2.8, -18, 0, 0x1e3a8a);
    addContainer(-18, 0, -12, 0, 0xb45309);
    addContainer(18, 0, -18, Math.PI / 2, 0x0f766e);
    addContainer(18, 2.8, -18, Math.PI / 2, 0x475569);
    addContainer(-18, 0, 18, Math.PI / 2, 0x1e3a8a);
    addContainer(-18, 2.8, 18, Math.PI / 2, 0x991b1b);
    addContainer(18, 0, 18, 0, 0xb45309);
    addContainer(18, 2.8, 18, 0, 0x0f766e);
    addContainer(18, 0, 12, 0, 0x334155);
    addContainer(-8, 0, 6, 0, 0x7c2d12);
    addContainer(8, 0, -6, 0, 0x1e40af);

    // Harbor Gantry Cranes
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.55 });
    const addCrane = (x: number, z: number) => {
      const crane = new THREE.Group();
      crane.position.set(x, 0, z);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(3.6, 17, 3.6), craneMat);
      leg.position.y = 8.5;
      leg.castShadow = true;
      const boom = new THREE.Mesh(new THREE.BoxGeometry(16, 1.8, 2.6), craneMat);
      boom.position.set(x > 0 ? -5 : 5, 16.5, 0);
      crane.add(leg, boom);
      group.add(crane);
      worldHitMeshes.push(leg);
    };
    addCrane(-30, -26);
    addCrane(30, 26);

    addLightPost(-12, -12, 0, 0x38bdf8, true, 18);
    addLightPost(12, 12, Math.PI, 0x38bdf8, true, 18);
    addLightPost(-12, 12, Math.PI / 2, 0xf59e0b, true, 18);
    addLightPost(12, -12, -Math.PI / 2, 0xf59e0b, true, 18);
  } else if (mapId === 'subway') {
    // Subway Platform Concrete & Rail Tracks
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.85 });
    for (const rx of [-12.2, -9.8, 9.8, 12.2]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 84), trackMat);
      rail.position.set(rx, 0.07, 0);
      group.add(rail);
    }

    // Overhead Subway Tunnel Vaulted Ceiling & Support Ribs (fully enclosed underground)
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x110e18,
      roughness: 0.94,
      metalness: 0.08,
    });
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(92, 0.9, 92), ceilingMat);
    ceiling.position.set(0, 12.6, 0);
    group.add(ceiling);

    const ribMat = new THREE.MeshStandardMaterial({ color: 0x1c1926, roughness: 0.9 });
    const stripRedMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const stripCyanMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    for (let z = -36; z <= 36; z += 12) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(86, 1.4, 1.6), ribMat);
      beam.position.set(0, 11.5, z);
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(8.5, 0.14, 0.28),
        Math.abs(z) % 24 === 0 ? stripCyanMat : stripRedMat,
      );
      strip.position.set(0, 10.74, z);
      group.add(beam, strip);
    }

    // Stalled Subway Train Cars
    const trainBodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, map: textures.carMetal, roughness: 0.5, metalness: 0.5 });
    const trainStripeMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.5 });
    const trainGlowMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });

    const addTrainCar = (x: number, z: number) => {
      const car = new THREE.Group();
      car.position.set(x, 0, z);
      const hull = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.4, 18.4), trainBodyMat);
      hull.position.y = 1.85;
      hull.castShadow = true;
      hull.receiveShadow = true;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.06, 0.42, 18.44), trainStripeMat);
      stripe.position.y = 1.5;
      const win = new THREE.Mesh(new THREE.BoxGeometry(4.05, 0.85, 15.0), trainGlowMat);
      win.position.y = 2.45;
      car.add(hull, stripe, win);
      group.add(car);
      worldHitMeshes.push(hull);
    };

    addTrainCar(-11, -18);
    addTrainCar(-11, 16);
    addTrainCar(11, -14);
    addTrainCar(11, 20);

    // Concrete Station Pillars
    for (const [px, pz] of [[-25, -25], [25, -25], [-25, 0], [25, 0], [-25, 25], [25, 25]]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(4.0, 11.5, 4.0), sidewalkMat);
      pillar.position.set(px, 5.75, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(pillar);
      worldHitMeshes.push(pillar);
    }

    addLightPost(-5, -18, 0, 0xf43f5e, true, 20);
    addLightPost(5, 18, Math.PI, 0xf43f5e, true, 20);
    addLightPost(-5, 18, 0, 0x22d3ee, true, 17);
    addLightPost(5, -18, Math.PI, 0x22d3ee, true, 17);
  } else if (mapId === 'hospital') {
    // -----------------------------------------------------------------------
    // MAP 7: RUMAH SAKIT KARANTINA (Mercy Quarantine — 116m x 116m)
    // -----------------------------------------------------------------------
    const medFloorMat = new THREE.MeshStandardMaterial({
      color: 0x334e54,
      roughness: 0.78,
      metalness: 0.12,
    });
    const crossRedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const crossWhiteMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.55 });

    // Central Triage Helipad & Medical Cross Courtyard
    const triagePad = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 10.0, 0.22, 20), medFloorMat);
    triagePad.position.set(0, 0.11, 0);
    triagePad.receiveShadow = true;
    const crossA = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 7.6), crossRedMat);
    crossA.position.set(0, 0.24, 0);
    const crossB = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.04, 2.0), crossRedMat);
    crossB.position.set(0, 0.24, 0);
    const padBorder = new THREE.Mesh(
      new THREE.RingGeometry(8.4, 9.0, 24),
      new THREE.MeshBasicMaterial({ color: 0x14b8a6, side: THREE.DoubleSide }),
    );
    padBorder.rotation.x = -Math.PI / 2;
    padBorder.position.y = 0.24;
    group.add(triagePad, crossA, crossB, padBorder);

    // Sidewalk walkways connecting the 5 hospital buildings
    for (const [px, pz, pw, pd] of [
      [-28, -26, 20, 18],
      [28, -26, 20, 18],
      [-32, 22, 18, 18],
      [32, 22, 18, 18],
      [0, 38, 18, 15],
    ] as Array<[number, number, number, number]>) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(pw, 0.14, pd), sidewalkMat);
      pad.position.set(px, 0.07, pz);
      pad.receiveShadow = true;
      group.add(pad);
      worldHitMeshes.push(pad);
    }

    // Biohazard Triage Tents (composite 3-part medical tents)
    const tentMat = new THREE.MeshStandardMaterial({ color: 0xdbeafe, roughness: 0.8, metalness: 0.05 });
    const addTriageTent = (tx: number, tz: number, rotY: number) => {
      const t = new THREE.Group();
      t.position.set(tx, 0, tz);
      t.rotation.y = rotY;
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.1, 5.0), tentMat);
      body.position.y = 1.05;
      body.castShadow = true;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(3.5, 1.3, 4), crossWhiteMat);
      roof.position.y = 2.75;
      roof.rotation.y = Math.PI / 4;
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.26, 0.28, 5.06), crossRedMat);
      stripe.position.y = 1.65;
      t.add(body, roof, stripe);
      group.add(t);
      worldHitMeshes.push(body);
    };
    addTriageTent(-14, 10, 0.15);
    addTriageTent(14, -12, -0.2);

    // Parked Medical Convoys & Generator Station
    addVehicle(-44, -6, Math.PI / 2, 0xe2e8f0, true);
    addVehicle(44, 6, -Math.PI / 2, 0x0f766e, true);
    const genBox = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.2, 4.0), darkMetalMat);
    genBox.position.set(0, 1.6, -40);
    genBox.castShadow = true;
    const genGlow = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.4, 4.1), new THREE.MeshBasicMaterial({ color: 0x14b8a6 }));
    genGlow.position.set(0, 2.6, -40);
    group.add(genBox, genGlow);
    worldHitMeshes.push(genBox);

    addLightPost(-12, -16, 0, 0x14b8a6, true, 19);
    addLightPost(12, 16, Math.PI, 0x14b8a6, true, 19);
    addLightPost(-20, 14, Math.PI / 2, 0xe0f2fe, true, 17);
    addLightPost(20, -14, -Math.PI / 2, 0xe0f2fe, true, 17);
    addTrafficCone(-9, 9);
    addTrafficCone(9, -9);
    addDumpster(-20, -26, 0);
    addDumpster(20, 22, Math.PI);
  } else if (mapId === 'forest') {
    // -----------------------------------------------------------------------
    // MAP 8: HUTAN PINUS TERKUTUK (Cursed Pinewood — 128m x 128m)
    // -----------------------------------------------------------------------
    const dirtRoadMat = new THREE.MeshStandardMaterial({
      color: 0x4a3b2c,
      roughness: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const roadNS = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 126), dirtRoadMat);
    roadNS.rotation.x = -Math.PI / 2;
    roadNS.position.y = 0.03;
    const roadEW = new THREE.Mesh(new THREE.PlaneGeometry(126, 8.5), dirtRoadMat);
    roadEW.rotation.x = -Math.PI / 2;
    roadEW.position.y = 0.03;
    group.add(roadNS, roadEW);

    // Ranger Watchtower at (0, -34)
    const wt = new THREE.Group();
    wt.position.set(0, 0, -34);
    const woodMat = new THREE.MeshStandardMaterial({ map: textures.bark, color: 0x6b4a33, roughness: 0.9 });
    for (const [lx, lz] of [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.65, 13, 0.65), woodMat);
      leg.position.set(lx, 6.5, lz);
      leg.castShadow = true;
      wt.add(leg);
    }
    const wtDeck = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.6, 6.4), woodMat);
    wtDeck.position.y = 12.6;
    const wtCab = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.0, 5.2), damagedMat);
    wtCab.position.y = 14.4;
    const wtRoof = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.1, 4), darkMetalMat);
    wtRoof.position.y = 16.95;
    wtRoof.rotation.y = Math.PI / 4;
    const wtBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    wtBeacon.position.y = 18.2;
    wt.add(wtDeck, wtCab, wtRoof, wtBeacon);
    group.add(wt);
    worldHitMeshes.push(wtDeck, wtCab);

    // Stacked Timber Logs Cover
    for (const [lx, lz] of [[-16, -4], [18, 4]]) {
      const stack = new THREE.Group();
      stack.position.set(lx, 0, lz);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3 - r; c++) {
          const log = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 6.4, 10), woodMat);
          log.rotation.z = Math.PI / 2;
          log.position.set(0, 0.42 + r * 0.72, (c - (2 - r) * 0.5) * 0.9);
          log.castShadow = true;
          stack.add(log);
          worldHitMeshes.push(log);
        }
      }
      group.add(stack);
    }

    // Mossy Forest Boulders
    const boulderMat = new THREE.MeshStandardMaterial({ color: 0x3b443e, roughness: 0.95, metalness: 0.04 });
    for (const [rx, rz, rs] of [
      [-44, -38, 4.2],
      [44, -40, 4.5],
      [-44, 42, 4.0],
      [44, 42, 4.2],
      [0, 36, 3.2],
    ]) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(rs, 1), boulderMat);
      rock.position.set(rx, rs * 0.55, rz);
      rock.scale.set(1.15, 0.85, 1.05);
      rock.castShadow = true;
      rock.receiveShadow = true;
      group.add(rock);
      worldHitMeshes.push(rock);
    }

    // Instanced Multi-Tier 3D Pine Forest Ring + Interior Groves (60fps!)
    const pineCoords: Array<[number, number, number]> = [];
    for (let i = -78; i <= 78; i += 8.5) {
      pineCoords.push([i, -72 - (Math.abs(i * 7) % 10), 1.1 + (Math.abs(i) % 5) * 0.12]);
      pineCoords.push([i, 72 + (Math.abs(i * 5) % 10), 1.1 + (Math.abs(i) % 4) * 0.14]);
      pineCoords.push([-72 - (Math.abs(i * 3) % 10), i, 1.15 + (Math.abs(i) % 5) * 0.1]);
      pineCoords.push([72 + (Math.abs(i * 9) % 10), i, 1.15 + (Math.abs(i) % 4) * 0.12]);
    }
    // Scattered scenic pines inside perimeter (outside roads & buildings)
    for (const [px, pz] of [
      [-52, -14], [-54, 14], [52, -14], [54, 14],
      [-14, -52], [14, -52], [-14, 52], [14, 52],
      [-48, -50], [48, -50], [-48, 50], [48, 50],
      [-38, -8], [38, 8], [-12, 42], [12, -46],
    ]) {
      pineCoords.push([px, pz, 0.95 + (Math.abs(px + pz) % 5) * 0.1]);
    }

    const pCount = pineCoords.length;
    const trunkGeo = new THREE.CylinderGeometry(0.28, 0.44, 3.2, 7);
    const tier1Geo = new THREE.ConeGeometry(2.6, 4.4, 7);
    const tier2Geo = new THREE.ConeGeometry(2.0, 3.8, 7);
    const tier3Geo = new THREE.ConeGeometry(1.3, 3.1, 7);
    const pineFoliageMat = new THREE.MeshStandardMaterial({ color: 0x1e4628, roughness: 0.88, metalness: 0.02 });
    const trunkInst = new THREE.InstancedMesh(trunkGeo, barkMat, pCount);
    const tier1Inst = new THREE.InstancedMesh(tier1Geo, pineFoliageMat, pCount);
    const tier2Inst = new THREE.InstancedMesh(tier2Geo, pineFoliageMat, pCount);
    const tier3Inst = new THREE.InstancedMesh(tier3Geo, pineFoliageMat, pCount);
    const dummy = new THREE.Object3D();
    const tintColor = new THREE.Color();

    pineCoords.forEach(([tx, tz, sc], idx) => {
      dummy.position.set(tx, 1.6 * sc, tz);
      dummy.rotation.set(0, idx * 0.9, 0);
      dummy.scale.setScalar(sc);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(tx, 4.3 * sc, tz);
      dummy.updateMatrix();
      tier1Inst.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(tx, 6.7 * sc, tz);
      dummy.updateMatrix();
      tier2Inst.setMatrixAt(idx, dummy.matrix);

      dummy.position.set(tx, 8.8 * sc, tz);
      dummy.updateMatrix();
      tier3Inst.setMatrixAt(idx, dummy.matrix);

      tintColor.setHSL(0.35 + ((idx % 5) - 2) * 0.012, 0.42, 0.19 + (idx % 3) * 0.03);
      tier1Inst.setColorAt(idx, tintColor);
      tier2Inst.setColorAt(idx, tintColor);
      tier3Inst.setColorAt(idx, tintColor);
    });
    [trunkInst, tier1Inst, tier2Inst, tier3Inst].forEach((inst) => {
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      inst.computeBoundingSphere();
      group.add(inst);
    });

    addLightPost(-9, -16, 0, 0xf59e0b, true, 18);
    addLightPost(9, 16, Math.PI, 0x34d399, true, 18);
    addLightPost(-22, 18, Math.PI / 2, 0xf59e0b, true, 17);
    addLightPost(22, -18, -Math.PI / 2, 0x34d399, true, 17);
  } else if (mapId === 'desert') {
    // -----------------------------------------------------------------------
    // MAP 9: NGARAI GURUN TANDUS (Red Canyon Outpost — 128m x 128m)
    // -----------------------------------------------------------------------
    const sandRoadMat = new THREE.MeshStandardMaterial({
      color: 0x6b4e35,
      roughness: 0.95,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });
    const dRoad1 = new THREE.Mesh(new THREE.PlaneGeometry(9, 126), sandRoadMat);
    dRoad1.rotation.x = -Math.PI / 2;
    dRoad1.position.y = 0.03;
    const dRoad2 = new THREE.Mesh(new THREE.PlaneGeometry(126, 9), sandRoadMat);
    dRoad2.rotation.x = -Math.PI / 2;
    dRoad2.position.y = 0.03;
    group.add(dRoad1, dRoad2);

    const mesaMat = new THREE.MeshStandardMaterial({ color: 0x8c4727, roughness: 0.94, metalness: 0.04 });
    const mesaTopMat = new THREE.MeshStandardMaterial({ color: 0xa85a32, roughness: 0.92, metalness: 0.03 });
    const addMesaSpire = (mx: number, mz: number, r: number, h: number) => {
      const m = new THREE.Group();
      m.position.set(mx, 0, mz);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.78, r, h * 0.65, 8), mesaMat);
      base.position.y = h * 0.325;
      base.castShadow = true;
      base.receiveShadow = true;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.68, r * 0.82, h * 0.35, 8), mesaTopMat);
      cap.position.y = h * 0.82;
      cap.castShadow = true;
      m.add(base, cap);
      group.add(m);
      worldHitMeshes.push(base, cap);
    };

    // Interior canyon spires
    addMesaSpire(-46, -42, 5.2, 12);
    addMesaSpire(46, -42, 5.2, 13);
    addMesaSpire(-46, 44, 5.0, 11);
    addMesaSpire(46, 44, 5.0, 12.5);

    // Outer canyon cliff wall ring (natural horizon framing)
    for (let i = -76; i <= 76; i += 19) {
      addMesaSpire(i, -78, 8.2, 16 + (Math.abs(i) % 7));
      addMesaSpire(i, 78, 8.2, 15 + (Math.abs(i) % 6));
      addMesaSpire(-78, i, 8.0, 17 + (Math.abs(i) % 5));
      addMesaSpire(78, i, 8.0, 16 + (Math.abs(i) % 6));
    }

    // Desert Comms Antenna at (0, -36)
    const dTower = new THREE.Group();
    dTower.position.set(0, 0, -36);
    const dtBase = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.8, 5.4), damagedMat);
    dtBase.position.y = 1.4;
    const dtMast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 1.0, 15, 6), darkMetalMat);
    dtMast.position.y = 9.8;
    const dtBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 10), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
    dtBeacon.position.y = 17.6;
    dTower.add(dtBase, dtMast, dtBeacon);
    group.add(dTower);
    worldHitMeshes.push(dtBase);

    // Solar Panel Arrays & Rusted Convoy Wrecks
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x0c4a6e, roughness: 0.2, metalness: 0.78 });
    for (const [sx, sz] of [[-16, 12], [16, -10]]) {
      const sGroup = new THREE.Group();
      sGroup.position.set(sx, 0, sz);
      const stand = new THREE.Mesh(new THREE.BoxGeometry(6.6, 1.4, 4.0), darkMetalMat);
      stand.position.y = 0.7;
      const panel = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.18, 4.4), solarMat);
      panel.position.y = 2.0;
      panel.rotation.x = 0.32;
      sGroup.add(stand, panel);
      group.add(sGroup);
      worldHitMeshes.push(stand, panel);
    }
    addVehicle(0, 38, Math.PI / 2, 0x9a3412, true);

    addLightPost(-10, -14, 0, 0xf59e0b, true, 19);
    addLightPost(10, 14, Math.PI, 0xf59e0b, true, 19);
    addLightPost(-24, 16, Math.PI / 2, 0xfbbf24, true, 17);
    addLightPost(24, -16, -Math.PI / 2, 0xfbbf24, true, 17);
  } else if (mapId === 'snowbase') {
    // -----------------------------------------------------------------------
    // MAP 10: STASIUN KUTUB ARKTIK (Frostbite Research Base — 128m x 128m)
    // -----------------------------------------------------------------------
    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.22,
      metalness: 0.35,
      emissive: 0x0c4a6e,
      emissiveIntensity: 0.2,
    });
    const cryoGlowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.5,
      roughness: 0.18,
    });
    const snowMetalMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.45, metalness: 0.5 });

    // Cleared Ice Runway Strip
    const runway = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 124),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65, polygonOffset: true, polygonOffsetFactor: -1 }),
    );
    runway.rotation.x = -Math.PI / 2;
    runway.position.y = 0.03;
    group.add(runway);

    // Arctic Satellite Dish at (0, -36)
    const sat = new THREE.Group();
    sat.position.set(0, 0, -36);
    const sBase = new THREE.Mesh(new THREE.BoxGeometry(5.8, 3.0, 5.8), snowMetalMat);
    sBase.position.y = 1.5;
    const sMast = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.1, 12, 8), darkMetalMat);
    sMast.position.y = 8.8;
    const sDish = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.5, 16), snowMetalMat);
    sDish.rotation.x = Math.PI / 3;
    sDish.position.set(0, 15.2, 1.0);
    sat.add(sBase, sMast, sDish);
    group.add(sat);
    worldHitMeshes.push(sBase);

    // Glowing Cryo Containment Silos
    for (const [cx, cz] of [[-16, -2], [16, 4]]) {
      const cryo = new THREE.Group();
      cryo.position.set(cx, 0, cz);
      const hull = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.7, 6.2, 14), snowMetalMat);
      hull.position.y = 3.1;
      hull.castShadow = true;
      const core = new THREE.Mesh(new THREE.CylinderGeometry(2.62, 2.62, 1.2, 14), cryoGlowMat);
      core.position.y = 3.2;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(2.5, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), darkMetalMat);
      cap.position.y = 6.2;
      cryo.add(hull, core, cap);
      group.add(cryo);
      worldHitMeshes.push(hull);
    }

    // Glacial Ice Monoliths & Perimeter Icebergs
    const addIceberg = (ix: number, iz: number, r: number, h: number) => {
      const berg = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), iceMat);
      berg.position.set(ix, h * 0.48, iz);
      berg.rotation.y = (ix + iz) * 0.2;
      berg.castShadow = true;
      berg.receiveShadow = true;
      group.add(berg);
      worldHitMeshes.push(berg);
    };
    addIceberg(-46, -42, 5.4, 12);
    addIceberg(46, -42, 5.4, 13);
    addIceberg(-46, 44, 5.2, 11);
    addIceberg(46, 44, 5.2, 12);
    for (let i = -76; i <= 76; i += 19) {
      addIceberg(i, -78, 8.5, 17 + (Math.abs(i) % 6));
      addIceberg(i, 78, 8.5, 16 + (Math.abs(i) % 6));
      addIceberg(-78, i, 8.2, 18 + (Math.abs(i) % 5));
      addIceberg(78, i, 8.2, 16 + (Math.abs(i) % 6));
    }

    // Snowcat / Supply Wreck
    addVehicle(0, 36, Math.PI / 2, 0x0ea5e9, true);

    addLightPost(-10, -14, 0, 0x38bdf8, true, 20);
    addLightPost(10, 14, Math.PI, 0x38bdf8, true, 20);
    addLightPost(-24, 16, Math.PI / 2, 0xe0f2fe, true, 18);
    addLightPost(24, -16, -Math.PI / 2, 0xe0f2fe, true, 18);
  }

  // =========================================================================
  // 3D TRANSIT PORTAL GATE ("GERBANG LINTAS PETA") ON EVERY MAP
  // =========================================================================
  const portalRoot = new THREE.Group();
  portalRoot.position.set(layout.portalPos.x, 0, layout.portalPos.z);

  const portalPad = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.6, 0.24, 18),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.65 }),
  );
  portalPad.position.y = 0.12;
  portalPad.receiveShadow = true;

  const portalPadRing = new THREE.Mesh(
    new THREE.RingGeometry(2.6, 3.05, 24),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide }),
  );
  portalPadRing.rotation.x = -Math.PI / 2;
  portalPadRing.position.y = 0.26;

  const pylonL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 4.8, 0.8), darkMetalMat);
  pylonL.position.set(-2.35, 2.4, 0);
  pylonL.castShadow = true;
  const pylonR = pylonL.clone();
  pylonR.position.x = 2.35;

  const archTop = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.55, 0.9), darkMetalMat);
  archTop.position.set(0, 4.95, 0);
  const archStrip = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 0.2, 0.96),
    new THREE.MeshBasicMaterial({ color: 0xa855f7 }),
  );
  archStrip.position.set(0, 4.95, 0);

  const portalRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.75, 0.12, 12, 28),
    new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x22d3ee,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.6,
    }),
  );
  portalRing.position.set(0, 2.55, 0);

  const portalCore = new THREE.Mesh(
    new THREE.CircleGeometry(1.62, 24),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.26,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  portalCore.position.set(0, 2.55, 0);

  portalRoot.add(portalPad, portalPadRing, pylonL, pylonR, archTop, archStrip, portalRing, portalCore);
  group.add(portalRoot);

  // Explosive Red Fuel Barrels from shared mapData
  const barrelMat = new THREE.MeshStandardMaterial({
    color: 0xb91c1c,
    roughness: 0.45,
    metalness: 0.55,
  });
  const barrelStripeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0x78350f,
    emissiveIntensity: 0.6,
    roughness: 0.4,
  });

  layout.barrels.forEach((pt, index) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(pt.x, 0, pt.z);

    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 1.28, 14), barrelMat);
    drum.position.y = 0.64;
    drum.castShadow = true;
    drum.userData = { barrelId: index };
    bGroup.add(drum);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.475, 0.475, 0.24, 14), barrelStripeMat);
    band.position.y = 0.68;
    bGroup.add(band);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 10), darkMetalMat);
    cap.position.set(0.18, 1.3, 0);
    bGroup.add(cap);

    group.add(bGroup);
    worldHitMeshes.push(drum);

    barrels.push({
      id: index,
      mesh: bGroup,
      hitMesh: drum,
      position: new THREE.Vector3(pt.x, 0.65, pt.z),
      exploded: false,
      respawnTimer: 0,
    });
  });

  // Build all Driveable 3D Vehicles for this map
  layout.vehicles.forEach(createDriveableVehicle3D);

  return {
    mapId,
    halfSize,
    group,
    colliders,
    worldHitMeshes,
    barrels,
    flickerLights,
    vehicles,
    skyAtmosphere,
    spawnPoints: layout.spawnPoints.map((p) => new THREE.Vector3(p.x, 0, p.z)),
    pickupSpots: layout.pickupSpots.map((p) => new THREE.Vector3(p.x, 0, p.z)),
    helipadChopper,
    portalGate: {
      root: portalRoot,
      ring: portalRing,
      core: portalCore,
      pos: new THREE.Vector3(layout.portalPos.x, 0, layout.portalPos.z),
    },
  };
}
