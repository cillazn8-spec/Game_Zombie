import * as THREE from 'three';
import {
  CHARACTERS,
  CHARACTER_SKINS,
  CharacterId,
  CharacterSkinId,
  PickupType,
  resolveSkinForCharacter,
  WeaponId,
  ZombieAppearance,
  ZombieVariant,
} from '../types/game';

export interface PlayerRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  pelvisGroup: THREE.Group;
  spineGroup: THREE.Group;
  headGroup: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  elbowL: THREE.Group;
  elbowR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  kneeL: THREE.Group;
  kneeR: THREE.Group;
  footL: THREE.Group;
  footR: THREE.Group;
  hairSecondary?: THREE.Object3D;
  muzzlePoint: THREE.Object3D;
  muzzleFlash: THREE.Mesh;
  muzzleLight: THREE.PointLight;
  flashlightAnchor: THREE.Object3D;
  weaponGroups: Record<WeaponId, THREE.Group>;
  nameSprite?: THREE.Sprite;
}

export interface PlayerAnimInput {
  elapsed: number;
  walkPhase: number;
  speedRatio: number;
  localFwd: number;
  localRight: number;
  turnVel: number;
  isRunning: boolean;
  isCrouching: boolean;
  crouchBlend: number;
  isAirborne: boolean;
  velY: number;
  landingSquash: number;
  isDashing: boolean;
  aimBlend: number;
  camPitch: number;
  recoil: number;
  isReloading: boolean;
  reloadProgress: number;
  weaponId: WeaponId;
}

export interface ZombieRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headMesh: THREE.Mesh;
  baseHeadRot: { x: number; y: number; z: number };
  armL: THREE.Group;
  armR: THREE.Group;
  elbowL: THREE.Group;
  elbowR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  kneeL: THREE.Group;
  kneeR: THREE.Group;
  hpBarBg: THREE.Mesh;
  hpBarFill: THREE.Mesh;
  hitMeshes: THREE.Mesh[];
  materialsToFlash: THREE.MeshStandardMaterial[];
}

function createNameplateSprite(text: string, colorHex: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(7, 10, 16, 0.84)';
  ctx.fillRect(16, 12, 224, 40);
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 12, 224, 40);
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(text.slice(0, 14), 128, 32);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.5, 0.38, 1);
  sprite.position.set(0, 2.34, 0);
  return sprite;
}

interface PlayerSkinTextureSet {
  rpdVest: THREE.CanvasTexture;
  rpdUniform: THREE.CanvasTexture;
  leatherJacket: THREE.CanvasTexture;
  furCollar: THREE.CanvasTexture;
  starsVest: THREE.CanvasTexture;
  oliveTwill: THREE.CanvasTexture;
  ubcsRig: THREE.CanvasTexture;
  ubcsTee: THREE.CanvasTexture;
  starsBeretShirt: THREE.CanvasTexture;
  navyCargo: THREE.CanvasTexture;
  redLeather: THREE.CanvasTexture;
  rippedJeans: THREE.CanvasTexture;
  crimsonKnit: THREE.CanvasTexture;
  sheerTights: THREE.CanvasTexture;
}

let cachedPlayerSkinTextures: PlayerSkinTextureSet | null = null;

function makeSkinCanvasTex(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function addFabricGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  darkAlpha = 0.14,
  lightAlpha = 0.08,
  count = 900,
): void {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle =
      i % 2 === 0 ? `rgba(0,0,0,${darkAlpha})` : `rgba(255,255,255,${lightAlpha})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}

function getPlayerSkinTextures(): PlayerSkinTextureSet {
  if (cachedPlayerSkinTextures) return cachedPlayerSkinTextures;

  const rpdVest = makeSkinCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#182130';
    ctx.fillRect(0, 0, w, h);
    addFabricGrain(ctx, w, h, 0.18, 0.07, 1400);
    // MOLLE horizontal webbing
    ctx.fillStyle = '#101622';
    for (let y = 140; y < 236; y += 22) {
      ctx.fillRect(16, y, w - 32, 8);
    }
    // R.P.D. chest patch
    ctx.fillStyle = '#0c111a';
    ctx.fillRect(54, 48, 148, 56);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(54, 48, 148, 56);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('R.P.D.', 128, 77);
  });

  const rpdUniform = makeSkinCanvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1c2638';
    ctx.fillRect(0, 0, w, h);
    addFabricGrain(ctx, w, h, 0.15, 0.06, 700);
    ctx.fillStyle = 'rgba(10,14,22,0.45)';
    ctx.fillRect(w * 0.48, 0, 4, h);
  });

  const leatherJacket = makeSkinCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#16181d';
    ctx.fillRect(0, 0, w, h);
    addFabricGrain(ctx, w, h, 0.25, 0.12, 1600);
    // Subtle leather creases
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      const sx = Math.random() * w;
      const sy = Math.random() * h;
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 60, sy + (Math.random() - 0.5) * 40);
      ctx.stroke();
    }
    // Metallic zipper track
    ctx.fillStyle = '#64748b';
    ctx.fillRect(w * 0.49, 0, 3, h);
  });

  const furCollar = makeSkinCanvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#4a3d33';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1200; i++) {
      ctx.fillStyle =
        i % 3 === 0 ? '#2b221c' : i % 3 === 1 ? '#6e5c4d' : 'rgba(225,205,185,0.28)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 5);
    }
  });

  const starsVest = makeSkinCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#191c22';
    ctx.fillRect(0, 0, w, h);
    addFabricGrain(ctx, w, h, 0.2, 0.08, 1300);
    // Center zip
    ctx.fillStyle = '#0d0f13';
    ctx.fillRect(w * 0.48, 0, 8, h);
    // White chest insignia
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('R.P.D.', 34, 66);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('S.T.A.R.S.', 32, 88);
    // Utility pouches
    ctx.fillStyle = '#12151a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    for (const px of [28, 146]) {
      for (const py of [118, 178]) {
        ctx.fillRect(px, py, 82, 46);
        ctx.strokeRect(px, py, 82, 46);
      }
    }
  });

  const oliveTwill = makeSkinCanvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#3e5237';
    ctx.fillRect(0, 0, w, h);
    addFabricGrain(ctx, w, h, 0.16, 0.08, 800);
  });

  const ubcsRig = makeSkinCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#565c4b';
    ctx.fillRect(0, 0, w, h);
    addFabricGrain(ctx, w, h, 0.22, 0.1, 1400);
    // Grime & smudges
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = 'rgba(38, 32, 26, 0.28)';
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 8 + Math.random() * 14, 0, Math.PI * 2);
      ctx.fill();
    }
    // Triple chest mag pouches
    ctx.strokeStyle = '#2d3126';
    ctx.lineWidth = 3;
    for (const px of [24, 96, 168]) {
      ctx.fillStyle = '#4a503f';
      ctx.fillRect(px, 76, 62, 118);
      ctx.strokeRect(px, 76, 62, 118);
      ctx.fillStyle = '#6c6352';
      ctx.fillRect(px + 24, 128, 14, 34);
    }
  });

  const ubcsTee = makeSkinCanvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#202226';
    ctx.fillRect(0, 0, w, h);
    addFabricGrain(ctx, w, h, 0.2, 0.08, 700);
    ctx.fillStyle = 'rgba(95, 18, 22, 0.36)';
    ctx.beginPath();
    ctx.arc(36, 44, 14, 0, Math.PI * 2);
    ctx.fill();
  });

  const starsBeretShirt = makeSkinCanvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#7b8ea8';
    ctx.fillRect(0, 0, w, h);
    addFabricGrain(ctx, w, h, 0.12, 0.08, 700);
    // Subtle chest fold shading
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255,255,255,0.08)');
    grad.addColorStop(0.5, 'rgba(15,23,42,0.06)');
    grad.addColorStop(1, 'rgba(15,23,42,0.18)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });

  const navyCargo = makeSkinCanvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1b2436';
    ctx.fillRect(0, 0, w, h);
    addFabricGrain(ctx, w, h, 0.16, 0.06, 750);
  });

  const redLeather = makeSkinCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8b1e24';
    ctx.fillRect(0, 0, w, h);
    addFabricGrain(ctx, w, h, 0.22, 0.1, 1400);
    ctx.strokeStyle = 'rgba(40, 6, 10, 0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(w * 0.62, 34, 4, 170);
  });

  const rippedJeans = makeSkinCanvasTex(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#1c2c3f';
    ctx.fillRect(0, 0, w, h);
    addFabricGrain(ctx, w, h, 0.18, 0.08, 1100);
    // Frayed knee rip revealing skin underneath
    ctx.fillStyle = '#c89b7b';
    ctx.fillRect(36, 118, 56, 24);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    for (let y = 120; y < 142; y += 5) {
      ctx.beginPath();
      ctx.moveTo(34, y);
      ctx.lineTo(94, y);
      ctx.stroke();
    }
  });

  const crimsonKnit = makeSkinCanvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#6f1623';
    ctx.fillRect(0, 0, w, h);
    // Vertical ribbed knit lines
    for (let x = 0; x < w; x += 6) {
      ctx.fillStyle = x % 12 === 0 ? 'rgba(0,0,0,0.24)' : 'rgba(255,190,190,0.08)';
      ctx.fillRect(x, 0, 3, h);
    }
    addFabricGrain(ctx, w, h, 0.08, 0.05, 500);
  });

  const sheerTights = makeSkinCanvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#251e22';
    ctx.fillRect(0, 0, w, h);
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, 'rgba(12,10,14,0.65)');
    grad.addColorStop(0.5, 'rgba(95,78,72,0.25)');
    grad.addColorStop(1, 'rgba(12,10,14,0.65)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });

  cachedPlayerSkinTextures = {
    rpdVest,
    rpdUniform,
    leatherJacket,
    furCollar,
    starsVest,
    oliveTwill,
    ubcsRig,
    ubcsTee,
    starsBeretShirt,
    navyCargo,
    redLeather,
    rippedJeans,
    crimsonKnit,
    sheerTights,
  };
  return cachedPlayerSkinTextures;
}

function buildCompositeGun(
  weaponId: WeaponId,
  accentMat: THREE.Material,
  gunMetalMat: THREE.Material,
  gunHighlightMat: THREE.Material,
  gripMat: THREE.Material,
): THREE.Group {
  const g = new THREE.Group();
  const opticGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0xef4444,
    emissiveIntensity: 0.45,
    roughness: 0.15,
    metalness: 0.85,
  });

  if (weaponId === 'pistol') {
    const pGrip = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.14, 0.072), gripMat);
    pGrip.position.set(0, -0.06, -0.02);
    pGrip.rotation.x = 0.24;
    const pFrame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.29), gripMat);
    pFrame.position.set(0, 0.005, 0.07);
    const pSlide = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.056, 0.31), gunMetalMat);
    pSlide.position.set(0, 0.042, 0.075);
    const pBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.06, 8),
      gunHighlightMat,
    );
    pBarrel.rotation.x = Math.PI / 2;
    pBarrel.position.set(0, 0.04, 0.24);
    const pSight = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.016, 0.024), accentMat);
    pSight.position.set(0, 0.076, 0.21);
    const pTacLight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.09, 8),
      gunHighlightMat,
    );
    pTacLight.rotation.x = Math.PI / 2;
    pTacLight.position.set(0, -0.02, 0.17);
    g.add(pGrip, pFrame, pSlide, pBarrel, pSight, pTacLight);
  } else if (weaponId === 'smg') {
    const sBody = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.11, 0.44), gunMetalMat);
    sBody.position.set(0, 0.03, 0.12);
    const sGrip = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.13, 0.065), gripMat);
    sGrip.position.set(0, -0.06, -0.01);
    sGrip.rotation.x = 0.22;
    const sStock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.09, 0.18), gripMat);
    sStock.position.set(0, 0.02, -0.17);
    const sMag = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.23, 0.062), gunHighlightMat);
    sMag.position.set(0, -0.11, 0.16);
    sMag.rotation.x = -0.14;
    const sSuppressor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.22, 10),
      gunHighlightMat,
    );
    sSuppressor.rotation.x = Math.PI / 2;
    sSuppressor.position.set(0, 0.035, 0.42);
    const sOptic = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.045, 0.085), gripMat);
    sOptic.position.set(0, 0.105, 0.12);
    const sLens = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.015), opticGlassMat);
    sLens.position.set(0, 0.105, 0.165);
    g.add(sBody, sGrip, sStock, sMag, sSuppressor, sOptic, sLens);
  } else if (weaponId === 'shotgun') {
    const shReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.105, 0.44), gunMetalMat);
    shReceiver.position.set(0, 0.025, 0.08);
    const shStock = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.11, 0.25), gripMat);
    shStock.position.set(0, -0.01, -0.22);
    shStock.rotation.x = 0.08;
    const shBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.024, 0.58, 10),
      gunHighlightMat,
    );
    shBarrel.rotation.x = Math.PI / 2;
    shBarrel.position.set(0, 0.055, 0.46);
    const shTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.5, 10),
      gunMetalMat,
    );
    shTube.rotation.x = Math.PI / 2;
    shTube.position.set(0, 0.012, 0.42);
    const shPump = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.034, 0.24, 10),
      new THREE.MeshStandardMaterial({ color: 0x3b2416, roughness: 0.78 }),
    );
    shPump.rotation.x = Math.PI / 2;
    shPump.position.set(0, 0.008, 0.42);
    g.add(shReceiver, shStock, shBarrel, shTube, shPump);
  } else {
    // Realistic M4/Carbine style Assault Rifle (matching UBCS reference)
    const rReceiver = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.11, 0.42), gunMetalMat);
    rReceiver.position.set(0, 0.03, 0.1);
    const rGrip = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.13, 0.065), gripMat);
    rGrip.position.set(0, -0.065, -0.04);
    rGrip.rotation.x = 0.26;
    const rStock = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.12, 0.24), gripMat);
    rStock.position.set(0, 0.015, -0.21);
    const rHandguard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.34, 8),
      gripMat,
    );
    rHandguard.rotation.x = Math.PI / 2;
    rHandguard.position.set(0, 0.038, 0.42);
    const rBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.02, 0.28, 8),
      gunHighlightMat,
    );
    rBarrel.rotation.x = Math.PI / 2;
    rBarrel.position.set(0, 0.04, 0.65);
    const rMag = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.23, 0.075), gunHighlightMat);
    rMag.position.set(0, -0.105, 0.18);
    rMag.rotation.x = 0.24;
    const rHolo = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.055, 0.095), gunMetalMat);
    rHolo.position.set(0, 0.115, 0.12);
    const rLens = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.032, 0.016), opticGlassMat);
    rLens.position.set(0, 0.115, 0.17);
    g.add(rReceiver, rGrip, rStock, rHandguard, rBarrel, rMag, rHolo, rLens);
  }
  return g;
}

export function createPlayerModel(
  contactShadowTex: THREE.Texture,
  characterId: CharacterId = 'raka',
  accentOverride?: string,
  nameLabel?: string,
  skinIdOverride?: CharacterSkinId,
): PlayerRig {
  const charSpec = CHARACTERS[characterId] ?? CHARACTERS.raka;
  const skinId = resolveSkinForCharacter(characterId, skinIdOverride ?? charSpec.defaultSkin);
  const skinSpec = CHARACTER_SKINS[skinId];
  const isFemale = charSpec.gender === 'Female';
  const isHeavy = characterId === 'bima';
  const accentHex = accentOverride ?? skinSpec.accentColor ?? charSpec.accentColor;
  const tex = getPlayerSkinTextures();

  const root = new THREE.Group();

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.32, 1.32),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.58,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // Realistic base skin & hair tone tailored to selected skin
  const skinToneHex =
    skinId === 'leather_agent' || skinId === 'stars_beret' || skinId === 'crimson_spy'
      ? 0xdab092
      : skinId === 'red_biker'
        ? 0xd6a786
        : skinId === 'ubcs_merc'
          ? 0xc89572
          : charSpec.skinHex;
  const hairToneHex =
    skinId === 'leather_agent'
      ? 0x6e543a
      : skinId === 'crimson_spy'
        ? 0x111216
        : skinId === 'rpd_officer' || skinId === 'stars_alpha' || skinId === 'stars_beret'
          ? 0x3b2619
          : skinId === 'red_biker'
            ? 0x362217
            : 0x2a1f1a;

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinToneHex,
    roughness: 0.58,
    metalness: 0.03,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: hairToneHex,
    roughness: 0.78,
    metalness: 0.08,
  });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xedeff2, roughness: 0.25 });
  const irisMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2 });
  const lipMat = new THREE.MeshStandardMaterial({
    color: isFemale ? 0x9d4b50 : 0xa36d5d,
    roughness: 0.55,
  });

  // Per-skin outfit materials
  const leatherMat = new THREE.MeshStandardMaterial({
    color: 0x15171c,
    map: tex.leatherJacket,
    roughness: 0.42,
    metalness: 0.18,
  });
  const gloveMat = new THREE.MeshStandardMaterial({
    color: skinId === 'ubcs_merc' ? 0x4b4e57 : 0x14161b,
    roughness: 0.65,
    metalness: 0.12,
  });
  const beltMat = new THREE.MeshStandardMaterial({
    color: skinId === 'red_biker' ? 0x452b1a : skinId === 'stars_alpha' ? 0x5c5338 : 0x14171d,
    roughness: 0.62,
    metalness: 0.15,
  });
  const buckleMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.3,
    metalness: 0.85,
  });
  const gunMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1e242c,
    roughness: 0.28,
    metalness: 0.86,
  });
  const gunHighlightMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.36,
    metalness: 0.75,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(accentHex),
    roughness: 0.35,
    metalness: 0.5,
  });

  let torsoMat: THREE.MeshStandardMaterial;
  let vestMat: THREE.MeshStandardMaterial | null = null;
  let pantsMat: THREE.MeshStandardMaterial;
  let bootMat: THREE.MeshStandardMaterial;
  let sleeveUpperMat: THREE.MeshStandardMaterial;
  let sleeveForearmMat: THREE.MeshStandardMaterial;

  if (skinId === 'rpd_officer') {
    torsoMat = new THREE.MeshStandardMaterial({ map: tex.rpdUniform, roughness: 0.82, metalness: 0.06 });
    vestMat = new THREE.MeshStandardMaterial({ map: tex.rpdVest, roughness: 0.68, metalness: 0.15 });
    pantsMat = new THREE.MeshStandardMaterial({ map: tex.rpdUniform, color: 0x1d2638, roughness: 0.85 });
    bootMat = new THREE.MeshStandardMaterial({ color: 0x101216, roughness: 0.55, metalness: 0.18 });
    sleeveUpperMat = torsoMat;
    sleeveForearmMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.84 });
  } else if (skinId === 'leather_agent') {
    torsoMat = new THREE.MeshStandardMaterial({ color: 0x18253a, roughness: 0.76 });
    vestMat = leatherMat;
    pantsMat = new THREE.MeshStandardMaterial({ color: 0x16181e, roughness: 0.82, metalness: 0.08 });
    bootMat = new THREE.MeshStandardMaterial({ color: 0x0f1115, roughness: 0.44, metalness: 0.2 });
    sleeveUpperMat = leatherMat;
    sleeveForearmMat = leatherMat;
  } else if (skinId === 'stars_alpha') {
    torsoMat = new THREE.MeshStandardMaterial({ map: tex.oliveTwill, roughness: 0.84, metalness: 0.05 });
    vestMat = new THREE.MeshStandardMaterial({ map: tex.starsVest, roughness: 0.65, metalness: 0.14 });
    pantsMat = torsoMat;
    bootMat = new THREE.MeshStandardMaterial({ color: 0x121417, roughness: 0.58, metalness: 0.16 });
    sleeveUpperMat = torsoMat;
    sleeveForearmMat = skinMat;
  } else if (skinId === 'ubcs_merc') {
    torsoMat = new THREE.MeshStandardMaterial({ map: tex.ubcsTee, roughness: 0.88, metalness: 0.04 });
    vestMat = new THREE.MeshStandardMaterial({ map: tex.ubcsRig, roughness: 0.85, metalness: 0.08 });
    pantsMat = new THREE.MeshStandardMaterial({ color: 0x3b4234, roughness: 0.88, metalness: 0.05 });
    bootMat = new THREE.MeshStandardMaterial({ color: 0x161819, roughness: 0.65, metalness: 0.14 });
    sleeveUpperMat = torsoMat;
    sleeveForearmMat = skinMat;
  } else if (skinId === 'stars_beret') {
    torsoMat = new THREE.MeshStandardMaterial({ map: tex.starsBeretShirt, roughness: 0.78, metalness: 0.05 });
    vestMat = new THREE.MeshStandardMaterial({ color: 0x171b22, roughness: 0.52, metalness: 0.25 });
    pantsMat = new THREE.MeshStandardMaterial({ map: tex.navyCargo, roughness: 0.84, metalness: 0.06 });
    bootMat = new THREE.MeshStandardMaterial({ color: 0x101318, roughness: 0.5, metalness: 0.18 });
    sleeveUpperMat = torsoMat;
    sleeveForearmMat = skinMat;
  } else if (skinId === 'red_biker') {
    torsoMat = new THREE.MeshStandardMaterial({ color: 0x1e2226, roughness: 0.84 });
    vestMat = new THREE.MeshStandardMaterial({ map: tex.redLeather, roughness: 0.42, metalness: 0.16 });
    pantsMat = new THREE.MeshStandardMaterial({ map: tex.rippedJeans, roughness: 0.88, metalness: 0.04 });
    bootMat = new THREE.MeshStandardMaterial({ color: 0x422518, roughness: 0.56, metalness: 0.12 });
    sleeveUpperMat = vestMat;
    sleeveForearmMat = skinMat;
  } else {
    // crimson_spy
    torsoMat = new THREE.MeshStandardMaterial({ map: tex.crimsonKnit, roughness: 0.78, metalness: 0.04 });
    vestMat = null;
    pantsMat = new THREE.MeshStandardMaterial({ map: tex.sheerTights, roughness: 0.48, metalness: 0.1 });
    bootMat = new THREE.MeshStandardMaterial({ color: 0x111216, roughness: 0.34, metalness: 0.22 });
    sleeveUpperMat = torsoMat;
    sleeveForearmMat = torsoMat;
  }

  // Pelvis pivot at hip height (y = 0.88) for natural hip sway, drop, and pelvic counter-twist
  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.set(0, 0.88, 0);
  pelvisGroup.rotation.order = 'YXZ';
  bodyGroup.add(pelvisGroup);

  // Upper spine pivot at waist (y = 0.14 above pelvis = world 1.02)
  const spineGroup = new THREE.Group();
  spineGroup.position.set(0, 0.14, 0);
  spineGroup.rotation.order = 'YXZ';
  pelvisGroup.add(spineGroup);

  // Anatomical Proportions (Sculpted cylinders, rounded joint caps & tapers)
  const legScale = isFemale ? 0.86 : isHeavy ? 1.12 : 1.0;
  const legSpread = isFemale ? 0.115 : isHeavy ? 0.16 : 0.14;
  const thighRTop = 0.102 * legScale;
  const thighRBot = 0.08 * legScale;
  const shinRTop = 0.076 * legScale;
  const shinRBot = 0.058 * legScale;
  const soleMat = new THREE.MeshStandardMaterial({ color: 0x090a0d, roughness: 0.92 });

  const makeLeg = (
    xOffset: number,
    isLeft: boolean,
  ): { leg: THREE.Group; knee: THREE.Group; foot: THREE.Group } => {
    const legPivot = new THREE.Group();
    legPivot.position.set(xOffset, 0, 0);
    legPivot.rotation.order = 'YXZ';

    const hipCap = new THREE.Mesh(
      new THREE.SphereGeometry(thighRTop * 0.98, 10, 8),
      pantsMat,
    );
    legPivot.add(hipCap);

    const thigh = new THREE.Mesh(
      new THREE.CylinderGeometry(thighRTop, thighRBot, 0.42, 12),
      pantsMat,
    );
    thigh.position.y = -0.21;
    thigh.castShadow = true;
    legPivot.add(thigh);

    // Thigh holster(s)
    const addHolsterOnLeg =
      skinId === 'red_biker' ||
      (!isLeft && skinId !== 'crimson_spy') ||
      (isLeft && skinId === 'crimson_spy');
    if (addHolsterOnLeg) {
      const sideSign = isLeft ? -1 : 1;
      const strap1 = new THREE.Mesh(
        new THREE.CylinderGeometry(thighRTop * 0.98, thighRTop * 0.96, 0.03, 12),
        beltMat,
      );
      strap1.position.y = -0.14;
      const strap2 = strap1.clone();
      strap2.position.y = -0.24;
      const holster = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.19, 0.095), beltMat);
      holster.position.set(sideSign * (thighRTop + 0.015), -0.19, 0.01);
      legPivot.add(strap1, strap2, holster);
    }

    // Rounded knee joint cap so deep bends stay seamless
    const kneeCap = new THREE.Mesh(
      new THREE.SphereGeometry(thighRBot * 1.02, 10, 8),
      skinId === 'crimson_spy' || skinId === 'leather_agent' ? bootMat : pantsMat,
    );
    kneeCap.position.y = -0.42;
    legPivot.add(kneeCap);

    // Articulated Knee Pivot (bends backward with positive rotation.x)
    const kneePivot = new THREE.Group();
    kneePivot.position.set(0, -0.42, 0);
    legPivot.add(kneePivot);

    // Knee pad (RPD & UBCS)
    if (skinId === 'rpd_officer' || skinId === 'ubcs_merc') {
      const kneePad = new THREE.Mesh(
        new THREE.CylinderGeometry(thighRBot * 1.1, shinRTop * 1.1, 0.11, 10),
        leatherMat,
      );
      kneePad.position.set(0, -0.01, 0.022);
      kneePivot.add(kneePad);
    }

    const isKneeBoot = skinId === 'crimson_spy' || skinId === 'leather_agent';
    if (isKneeBoot) {
      const shinTop = new THREE.Mesh(
        new THREE.CylinderGeometry(shinRTop, shinRBot * 1.08, 0.36, 12),
        bootMat,
      );
      shinTop.position.y = -0.18;
      shinTop.castShadow = true;
      kneePivot.add(shinTop);
    } else {
      const shin = new THREE.Mesh(
        new THREE.CylinderGeometry(shinRTop, shinRBot, 0.24, 12),
        pantsMat,
      );
      shin.position.y = -0.12;
      shin.castShadow = true;
      kneePivot.add(shin);

      const bootCuff = new THREE.Mesh(
        new THREE.CylinderGeometry(shinRBot * 1.18, shinRBot * 1.08, 0.15, 10),
        bootMat,
      );
      bootCuff.position.y = -0.28;
      bootCuff.castShadow = true;
      kneePivot.add(bootCuff);
    }

    const ankleCap = new THREE.Mesh(
      new THREE.SphereGeometry(shinRBot * 1.04, 8, 8),
      bootMat,
    );
    ankleCap.position.y = -0.36;
    kneePivot.add(ankleCap);

    // Articulated Ankle / Foot Pivot
    const footPivot = new THREE.Group();
    footPivot.position.set(0, -0.38, 0);
    kneePivot.add(footPivot);

    const bootFoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.115 * legScale, 0.092, 0.22),
      bootMat,
    );
    bootFoot.position.set(0, -0.022, 0.042);
    bootFoot.castShadow = true;
    const bootToe = new THREE.Mesh(
      new THREE.BoxGeometry(0.106 * legScale, 0.064, 0.072),
      bootMat,
    );
    bootToe.position.set(0, -0.036, 0.155);
    bootToe.castShadow = true;
    const bootSole = new THREE.Mesh(
      new THREE.BoxGeometry(0.124 * legScale, 0.032, 0.275),
      soleMat,
    );
    bootSole.position.set(0, -0.064, 0.056);
    footPivot.add(bootFoot, bootToe, bootSole);

    return { leg: legPivot, knee: kneePivot, foot: footPivot };
  };

  const leftLegBuilt = makeLeg(-legSpread, true);
  const rightLegBuilt = makeLeg(legSpread, false);
  const legL = leftLegBuilt.leg;
  const legR = rightLegBuilt.leg;
  const kneeL = leftLegBuilt.knee;
  const kneeR = rightLegBuilt.knee;
  const footL = leftLegBuilt.foot;
  const footR = rightLegBuilt.foot;
  pelvisGroup.add(legL, legR);

  // Pelvis / Hips (plus fitted sweater dress skirt for crimson_spy)
  const hipRTop = isFemale ? 0.165 : isHeavy ? 0.22 : 0.195;
  const hipRBot = isFemale ? 0.195 : isHeavy ? 0.23 : 0.205;
  const pelvis = new THREE.Mesh(
    new THREE.CylinderGeometry(hipRTop, hipRBot, 0.2, 12),
    skinId === 'crimson_spy' ? torsoMat : pantsMat,
  );
  pelvis.scale.set(1.12, 1, 0.72);
  pelvis.position.y = 0.07;
  pelvis.castShadow = true;
  pelvisGroup.add(pelvis);

  if (skinId === 'crimson_spy') {
    const dressSkirt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.165, 0.215, 0.28, 14),
      torsoMat,
    );
    dressSkirt.scale.set(1.08, 1, 0.74);
    dressSkirt.position.y = -0.01;
    dressSkirt.castShadow = true;
    pelvisGroup.add(dressSkirt);
  }

  // Tactical Utility Belt & Pouches (attached to pelvisGroup)
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(hipRTop + 0.014, hipRTop + 0.016, 0.065, 14),
    beltMat,
  );
  belt.scale.set(1.13, 1, 0.74);
  belt.position.set(0, 0.14, 0);
  if (skinId === 'crimson_spy') belt.rotation.z = -0.06;
  pelvisGroup.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.055, 0.028), buckleMat);
  buckle.position.set(0, 0.14, hipRTop * 0.75 + 0.01);
  pelvisGroup.add(buckle);

  if (skinId === 'rpd_officer' || skinId === 'stars_beret' || skinId === 'ubcs_merc') {
    const pouchL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.07), beltMat);
    pouchL.position.set(-hipRTop * 1.02, 0.12, 0.05);
    const pouchR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.07), beltMat);
    pouchR.position.set(hipRTop * 1.02, 0.12, -0.04);
    pelvisGroup.add(pouchL, pouchR);
  }

  // Sculpted Torso (Chest & Waist Taper — inside spineGroup, offset by -1.02)
  const chestRTop = isFemale ? 0.185 : isHeavy ? 0.265 : 0.23;
  const waistRBot = isFemale ? 0.145 : isHeavy ? 0.22 : 0.185;
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(chestRTop, waistRBot, 0.52, 14),
    torsoMat,
  );
  torso.scale.set(1.12, 1, 0.68);
  torso.position.y = 0.27;
  torso.castShadow = true;
  spineGroup.add(torso);

  // Skin-specific Torso Outerwear & Details
  if (skinId === 'rpd_officer' || skinId === 'stars_alpha' || skinId === 'ubcs_merc') {
    const vest = new THREE.Mesh(
      new THREE.CylinderGeometry(chestRTop + 0.022, waistRBot + 0.022, 0.44, 12),
      vestMat!,
    );
    vest.scale.set(1.13, 1, 0.74);
    vest.position.y = 0.29;
    vest.castShadow = true;
    spineGroup.add(vest);

    if (skinId === 'ubcs_merc') {
      for (const px of [-0.11, 0, 0.11]) {
        const magPouch = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.15, 0.055), vestMat!);
        magPouch.position.set(px, 0.26, chestRTop * 0.74 + 0.025);
        spineGroup.add(magPouch);
      }
    }
  } else if (skinId === 'leather_agent' || skinId === 'red_biker') {
    const jacketBack = new THREE.Mesh(
      new THREE.CylinderGeometry(
        chestRTop + 0.018,
        waistRBot + 0.02,
        0.48,
        12,
        1,
        false,
        Math.PI * 0.55,
        Math.PI * 1.9,
      ),
      vestMat!,
    );
    jacketBack.scale.set(1.14, 1, 0.74);
    jacketBack.position.y = 0.28;
    jacketBack.castShadow = true;
    spineGroup.add(jacketBack);

    const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.38, 0.05), vestMat!);
    lapelL.position.set(-0.11, 0.31, chestRTop * 0.68);
    lapelL.rotation.z = -0.14;
    const lapelR = lapelL.clone();
    lapelR.position.x = 0.11;
    lapelR.rotation.z = 0.14;
    spineGroup.add(lapelL, lapelR);

    if (skinId === 'leather_agent') {
      const furMat = new THREE.MeshStandardMaterial({ map: tex.furCollar, roughness: 0.95 });
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.145, 0.045, 8, 16, Math.PI * 1.45),
        furMat,
      );
      collar.rotation.x = Math.PI / 2 + 0.25;
      collar.rotation.z = Math.PI * 0.78;
      collar.position.set(0, 0.52, 0.01);
      spineGroup.add(collar);
    } else {
      const pendant = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.036, 0.01), buckleMat);
      pendant.position.set(0, 0.41, chestRTop * 0.69);
      spineGroup.add(pendant);
    }
  } else if (skinId === 'stars_beret') {
    const padL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.16), vestMat!);
    padL.position.set(-0.19, 0.51, 0);
    padL.rotation.z = 0.22;
    const padR = padL.clone();
    padR.position.x = 0.19;
    padR.rotation.z = -0.22;
    const strapH = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.27), vestMat!);
    strapH.position.set(0, 0.22, 0);
    spineGroup.add(padL, padR, strapH);
  } else if (skinId === 'crimson_spy') {
    const turtle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.072, 0.082, 0.1, 12),
      torsoMat,
    );
    turtle.position.y = 0.56;
    const harnessStrapL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.26), leatherMat);
    harnessStrapL.position.set(-0.11, 0.4, 0);
    const harnessStrapR = harnessStrapL.clone();
    harnessStrapR.position.x = 0.11;
    const harnessFront = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.025), leatherMat);
    harnessFront.position.set(0, 0.43, chestRTop * 0.68);
    const armHolster = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.15, 0.08), leatherMat);
    armHolster.position.set(-0.19, 0.3, 0.04);
    spineGroup.add(turtle, harnessStrapL, harnessStrapR, harnessFront, armHolster);
  }

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.068, 0.12, 10), skinMat);
  neck.position.y = 0.55;
  spineGroup.add(neck);

  // Realistic Sculpted Head & Face
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.6, 0);
  headGroup.rotation.order = 'YXZ';
  spineGroup.add(headGroup);

  const headW = isFemale ? 0.92 : 1.0;
  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.128, 16, 14), skinMat);
  cranium.scale.set(0.92 * headW, 1.12, 0.98);
  cranium.position.set(0, 0.145, 0);
  cranium.castShadow = true;
  headGroup.add(cranium);

  const jaw = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095 * headW, 0.065 * headW, 0.09, 10),
    skinMat,
  );
  jaw.position.set(0, 0.065, 0.02);
  headGroup.add(jaw);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.042, 0.03), skinMat);
  nose.position.set(0, 0.125, 0.125);
  nose.rotation.x = -0.2;
  headGroup.add(nose);

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.012, 0.015), lipMat);
  mouth.position.set(0, 0.078, 0.112);
  headGroup.add(mouth);

  for (const ex of [-0.042, 0.042]) {
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), eyeWhiteMat);
    sclera.scale.set(1.25, 0.75, 0.6);
    sclera.position.set(ex, 0.155, 0.112);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), irisMat);
    pupil.position.set(ex, 0.155, 0.12);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.01, 0.016), hairMat);
    brow.position.set(ex, 0.178, 0.115);
    brow.rotation.z = ex < 0 ? -0.08 : 0.08;
    headGroup.add(sclera, pupil, brow);
  }

  // Skin-Matched Hairstyles & Headgear
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.134, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hairMat,
  );
  hairCap.scale.set(0.95 * headW, 1.12, 1.02);
  hairCap.position.set(0, 0.15, -0.01);
  hairCap.castShadow = true;
  headGroup.add(hairCap);

  let hairSecondary: THREE.Object3D | undefined;

  if (skinId === 'rpd_officer' || skinId === 'leather_agent') {
    const bangL = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.085, 0.08), hairMat);
    bangL.position.set(-0.048, 0.215, 0.095);
    bangL.rotation.set(0.28, 0.18, 0.35);
    const bangR = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.085, 0.08), hairMat);
    bangR.position.set(0.048, 0.215, 0.095);
    bangR.rotation.set(0.28, -0.18, -0.35);
    const nape = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.11, 0.08), hairMat);
    nape.position.set(0, 0.11, -0.1);
    headGroup.add(bangL, bangR, nape);
  } else if (skinId === 'stars_alpha') {
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.075, 0.18), hairMat);
    crest.position.set(0, 0.275, 0.02);
    crest.rotation.x = -0.18;
    headGroup.add(crest);
  } else if (skinId === 'ubcs_merc') {
    const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.09, 0.12), hairMat);
    fringe.position.set(0, 0.225, 0.07);
    fringe.rotation.x = 0.22;
    const shaggyBack = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.16, 0.12), hairMat);
    shaggyBack.position.set(0, 0.12, -0.095);
    const earpiece = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 8), leatherMat);
    earpiece.rotation.z = Math.PI / 2;
    earpiece.position.set(-0.125, 0.13, 0);
    const micBoom = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.11), gunMetalMat);
    micBoom.position.set(-0.1, 0.08, 0.07);
    micBoom.rotation.y = 0.35;
    headGroup.add(fringe, shaggyBack, earpiece, micBoom);
  } else if (skinId === 'stars_beret') {
    const bobBack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.11), hairMat);
    bobBack.position.set(0, 0.12, -0.09);
    const beretMat = new THREE.MeshStandardMaterial({ color: 0x16243d, roughness: 0.8 });
    const beret = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.135, 0.075, 16), beretMat);
    beret.position.set(0.015, 0.275, 0);
    beret.rotation.set(-0.08, 0, -0.22);
    const goldEmblem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.015, 8),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.85 }),
    );
    goldEmblem.rotation.x = Math.PI / 2;
    goldEmblem.position.set(0.01, 0.265, 0.14);
    headGroup.add(bobBack, beret, goldEmblem);
    hairSecondary = bobBack;
  } else if (skinId === 'red_biker') {
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.09), hairMat);
    hairBack.position.set(0, 0.13, -0.095);
    const ponytailPivot = new THREE.Group();
    ponytailPivot.position.set(0, 0.16, -0.13);
    const ponytail = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.022, 0.28, 8), hairMat);
    ponytail.position.set(0, -0.12, -0.05);
    ponytail.rotation.x = 0.35;
    ponytailPivot.add(ponytail);
    headGroup.add(hairBack, ponytailPivot);
    hairSecondary = ponytailPivot;
  } else if (skinId === 'crimson_spy') {
    const bobL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.18, 0.16), hairMat);
    bobL.position.set(-0.108, 0.14, -0.01);
    const bobR = bobL.clone();
    bobR.position.x = 0.108;
    const bobBack = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.19, 0.11), hairMat);
    bobBack.position.set(0, 0.13, -0.095);
    const sleekBang = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.065, 0.055), hairMat);
    sleekBang.position.set(-0.02, 0.225, 0.098);
    sleekBang.rotation.set(0.2, 0, 0.22);
    headGroup.add(bobL, bobR, bobBack, sleekBang);
    hairSecondary = bobBack;
  }

  // Articulated Arms (Shoulder -> Bicep -> Elbow -> Forearm -> Hand)
  const armX = isFemale ? 0.245 : isHeavy ? 0.345 : 0.305;
  const armScale = isFemale ? 0.82 : isHeavy ? 1.14 : 1.0;
  const upperR = 0.062 * armScale;
  const foreR = 0.05 * armScale;
  const handMat = skinId === 'red_biker' ? skinMat : gloveMat;

  const armL = new THREE.Group();
  armL.position.set(-armX, 0.46, 0);
  armL.rotation.order = 'YXZ';
  spineGroup.add(armL);

  const shoulderL = new THREE.Mesh(
    new THREE.SphereGeometry(upperR * 1.18, 10, 10),
    sleeveUpperMat,
  );
  const bicepL = new THREE.Mesh(
    new THREE.CylinderGeometry(upperR, upperR * 0.88, 0.26, 10),
    sleeveUpperMat,
  );
  bicepL.position.y = -0.13;
  bicepL.castShadow = true;
  const elbowCapL = new THREE.Mesh(
    new THREE.SphereGeometry(foreR * 1.08, 9, 8),
    sleeveForearmMat,
  );
  elbowCapL.position.y = -0.26;
  armL.add(shoulderL, bicepL, elbowCapL);

  const elbowL = new THREE.Group();
  elbowL.position.set(0, -0.26, 0);
  armL.add(elbowL);

  const forearmL = new THREE.Mesh(
    new THREE.CylinderGeometry(foreR, foreR * 0.84, 0.24, 10),
    sleeveForearmMat,
  );
  forearmL.position.set(0, -0.12, 0);
  forearmL.castShadow = true;
  const handL = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.095, 0.085), handMat);
  handL.position.set(0, -0.25, 0.01);
  elbowL.add(forearmL, handL);

  const armR = new THREE.Group();
  armR.position.set(armX, 0.46, 0);
  armR.rotation.order = 'YXZ';
  spineGroup.add(armR);

  const shoulderR = new THREE.Mesh(
    new THREE.SphereGeometry(upperR * 1.18, 10, 10),
    sleeveUpperMat,
  );
  const bicepR = new THREE.Mesh(
    new THREE.CylinderGeometry(upperR, upperR * 0.88, 0.26, 10),
    sleeveUpperMat,
  );
  bicepR.position.y = -0.13;
  bicepR.castShadow = true;
  const elbowCapR = new THREE.Mesh(
    new THREE.SphereGeometry(foreR * 1.08, 9, 8),
    sleeveForearmMat,
  );
  elbowCapR.position.y = -0.26;
  armR.add(shoulderR, bicepR, elbowCapR);

  const elbowR = new THREE.Group();
  elbowR.position.set(0, -0.26, 0);
  armR.add(elbowR);

  const forearmR = new THREE.Mesh(
    new THREE.CylinderGeometry(foreR, foreR * 0.84, 0.24, 10),
    sleeveForearmMat,
  );
  forearmR.position.set(0, -0.12, 0);
  forearmR.castShadow = true;
  const handR = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.088, 0.095), handMat);
  handR.position.set(0, -0.25, 0.01);
  elbowR.add(forearmR, handR);

  // Weapon mount aligned with forearm (+Z forward when armR.x + elbowR.x == -PI/2)
  const weaponMount = new THREE.Group();
  weaponMount.position.set(0, -0.27, 0.045);
  weaponMount.rotation.x = Math.PI / 2;
  elbowR.add(weaponMount);

  // Default tactical combat ready pose
  armR.rotation.set(-0.62, -0.14, 0);
  elbowR.rotation.x = -0.95;

  const pistolGroup = buildCompositeGun('pistol', accentMat, gunMetalMat, gunHighlightMat, beltMat);
  const smgGroup = buildCompositeGun('smg', accentMat, gunMetalMat, gunHighlightMat, beltMat);
  const shotgunGroup = buildCompositeGun('shotgun', accentMat, gunMetalMat, gunHighlightMat, beltMat);
  const rifleGroup = buildCompositeGun('rifle', accentMat, gunMetalMat, gunHighlightMat, beltMat);
  smgGroup.visible = false;
  shotgunGroup.visible = false;
  rifleGroup.visible = false;

  weaponMount.add(pistolGroup, smgGroup, shotgunGroup, rifleGroup);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.04, 0.28);
  weaponMount.add(muzzlePoint);

  const muzzleMat = new THREE.MeshBasicMaterial({
    color: 0xffd166,
    transparent: true,
    opacity: 0.95,
  });
  const muzzleFlash = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), muzzleMat);
  muzzleFlash.scale.set(0.75, 0.75, 1.8);
  muzzleFlash.position.copy(muzzlePoint.position);
  muzzleFlash.visible = false;
  weaponMount.add(muzzleFlash);

  const muzzleLight = new THREE.PointLight(0xffb703, 0, 10, 2);
  muzzleLight.position.copy(muzzlePoint.position);
  weaponMount.add(muzzleLight);

  const flashlightAnchor = new THREE.Object3D();
  flashlightAnchor.position.set(0, 0.3, 0.24);
  spineGroup.add(flashlightAnchor);

  let nameSprite: THREE.Sprite | undefined;
  if (nameLabel) {
    nameSprite = createNameplateSprite(nameLabel, accentHex);
    root.add(nameSprite);
  }

  return {
    root,
    bodyGroup,
    pelvisGroup,
    spineGroup,
    headGroup,
    armL,
    armR,
    elbowL,
    elbowR,
    legL,
    legR,
    kneeL,
    kneeR,
    footL,
    footR,
    hairSecondary,
    muzzlePoint,
    muzzleFlash,
    muzzleLight,
    flashlightAnchor,
    weaponGroups: {
      pistol: pistolGroup,
      smg: smgGroup,
      shotgun: shotgunGroup,
      rifle: rifleGroup,
    },
    nameSprite,
  };
}

/**
 * HD Biomechanical Procedural Animator for Survivor PlayerRig (local, remote co-op, & intro hero).
 * Drives articulated pelvis/spine counter-twist, knee/ankle stride cycles, strafe footwork,
 * landing impact squash, two-handed weapon cradling, tactical sprint carry, and reload gestures.
 */
export function animatePlayerRig(rig: PlayerRig, inp: PlayerAnimInput, dt: number): void {
  const damp = (curr: number, target: number, lambda: number) =>
    THREE.MathUtils.damp(curr, target, lambda, dt);

  const moveW = THREE.MathUtils.clamp(inp.speedRatio * 1.35, 0, 1);
  const sprintW = inp.isRunning && !inp.isCrouching ? THREE.MathUtils.clamp((inp.speedRatio - 0.52) / 0.48, 0, 1) : 0;
  const dashW = inp.isDashing ? 1 : 0;
  const crouchW = inp.crouchBlend;
  const squash = inp.landingSquash;
  const phase = inp.walkPhase;
  const breath = Math.sin(inp.elapsed * 2.15);
  const idleSway = Math.sin(inp.elapsed * 1.15);

  const isTwoHanded = inp.weaponId !== 'pistol';
  const tacticalSprintCarry =
    Math.max(sprintW, dashW) * (1 - inp.aimBlend) * (inp.recoil > 0.08 ? 0 : 1) * (inp.isReloading ? 0 : 1);

  // 1. Pelvis / Hip Root Motion (vertical double-frequency stride bob, weight shift, hip roll & twist)
  const strideBob = inp.isAirborne
    ? 0
    : -Math.cos(phase * 2) * (0.022 + sprintW * 0.036 + dashW * 0.02) * moveW * (1 - crouchW * 0.55);
  const targetPelvisY =
    0.88 - crouchW * 0.27 - squash * 0.14 + strideBob + breath * 0.008 * (1 - moveW);
  const targetPelvisX =
    (Math.sin(phase) * (0.026 + sprintW * 0.014) * moveW + idleSway * 0.012 * (1 - moveW)) *
    (inp.isAirborne ? 0.2 : 1);
  const strafeHipYaw =
    THREE.MathUtils.clamp(inp.localRight * (inp.localFwd >= -0.15 ? 0.24 : -0.22), -0.28, 0.28) * moveW;
  const stridePelvisYaw = Math.sin(phase) * (0.09 + sprintW * 0.09) * moveW * (inp.isAirborne ? 0 : 1);
  const targetPelvisYaw = stridePelvisYaw + strafeHipYaw;
  const targetPelvisRoll =
    -Math.sin(phase) * (0.045 + sprintW * 0.04) * moveW * (inp.isAirborne ? 0 : 1) -
    inp.localRight * 0.065 * moveW;
  const targetPelvisPitch = crouchW * 0.12 + squash * 0.09;

  rig.pelvisGroup.position.y = damp(rig.pelvisGroup.position.y, targetPelvisY, 16);
  rig.pelvisGroup.position.x = damp(rig.pelvisGroup.position.x, targetPelvisX, 14);
  rig.pelvisGroup.rotation.y = damp(rig.pelvisGroup.rotation.y, targetPelvisYaw, 15);
  rig.pelvisGroup.rotation.z = damp(rig.pelvisGroup.rotation.z, targetPelvisRoll, 15);
  rig.pelvisGroup.rotation.x = damp(rig.pelvisGroup.rotation.x, targetPelvisPitch, 15);

  // 2. Spine / Upper Torso (counter-rotation against hips, sprint lean, turn bank, recoil kickback)
  const forwardLean =
    inp.localFwd * (0.07 + sprintW * 0.17) * moveW +
    dashW * 0.28 +
    crouchW * 0.24 +
    squash * 0.16 +
    inp.camPitch * 0.18 -
    inp.recoil * 0.1 +
    breath * 0.016 * (1 - moveW * 0.5);
  const turnLead = THREE.MathUtils.clamp(inp.turnVel * 0.032, -0.16, 0.16);
  const combatStanceYaw = -0.1 * (1 - tacticalSprintCarry) + inp.aimBlend * -0.08;
  const targetSpineYaw = -targetPelvisYaw * 0.85 + combatStanceYaw + turnLead;
  const targetSpineRoll =
    -inp.localRight * (0.075 + sprintW * 0.05) * moveW -
    THREE.MathUtils.clamp(inp.turnVel * 0.022, -0.1, 0.1) +
    Math.sin(phase) * 0.028 * sprintW;

  rig.spineGroup.rotation.x = damp(rig.spineGroup.rotation.x, forwardLean, 16);
  rig.spineGroup.rotation.y = damp(rig.spineGroup.rotation.y, targetSpineYaw, 16);
  rig.spineGroup.rotation.z = damp(rig.spineGroup.rotation.z, targetSpineRoll, 15);
  rig.spineGroup.scale.y = 1 + breath * 0.012;

  // 3. Head Stabilization & Look Tracking
  const idleLookYaw = Math.sin(inp.elapsed * 0.72) * 0.065 * (1 - moveW) * (1 - inp.aimBlend);
  const targetHeadX = -forwardLean * 0.62 + inp.camPitch * 0.42;
  const targetHeadY =
    -targetSpineYaw * 0.65 + THREE.MathUtils.clamp(inp.turnVel * 0.06, -0.28, 0.28) + idleLookYaw;
  const targetHeadZ = -targetSpineRoll * 0.55;

  rig.headGroup.rotation.x = damp(rig.headGroup.rotation.x, targetHeadX, 16);
  rig.headGroup.rotation.y = damp(rig.headGroup.rotation.y, targetHeadY, 16);
  rig.headGroup.rotation.z = damp(rig.headGroup.rotation.z, targetHeadZ, 15);

  if (rig.hairSecondary) {
    const hairBounce =
      0.06 +
      sprintW * 0.28 +
      dashW * 0.35 +
      Math.max(0, -strideBob * 4.5) +
      squash * 0.32 +
      (inp.isAirborne ? THREE.MathUtils.clamp(-inp.velY * 0.04, -0.25, 0.45) : 0);
    rig.hairSecondary.rotation.x = damp(rig.hairSecondary.rotation.x, hairBounce, 11);
    rig.hairSecondary.rotation.z = damp(
      rig.hairSecondary.rotation.z,
      -inp.localRight * 0.16 * moveW - Math.sin(phase) * 0.08 * moveW,
      10,
    );
  }

  // 4. Articulated Legs (Hip + Knee + Ankle biomechanical stride, crouch, jump & landing)
  let legLX = 0;
  let legRX = 0;
  let legLZ = 0.035;
  let legRZ = -0.035;
  let kneeLX = 0.08;
  let kneeRX = 0.08;
  let footLX = -0.04;
  let footRX = -0.04;

  if (inp.isAirborne) {
    const rising = inp.velY > 0.6;
    if (rising) {
      // Dynamic ascending jump pose: front knee tucked high, rear leg driving off
      legLX = -0.78;
      kneeLX = 1.22;
      footLX = 0.32;
      legRX = 0.36;
      kneeRX = 0.42;
      footRX = 0.45;
    } else {
      // Descending brace pose preparing for touchdown
      legLX = -0.46;
      kneeLX = 0.72;
      footLX = -0.18;
      legRX = -0.2;
      kneeRX = 0.56;
      footRX = -0.12;
    }
  } else {
    const computeLeg = (p: number, sideSign: number) => {
      const s = Math.sin(p); // +1 = leg swinging back, -1 = leg swinging forward
      const c = Math.cos(p); // +1 = swinging forward through mid-pass (knee lifts!)
      const strideAmp = dashW > 0.5 ? 0.92 : 0.46 + sprintW * 0.36 - crouchW * 0.16;
      // Forward stride reaches slightly higher than back extension
      const hipMove = (s < 0 ? s * 1.12 : s * 0.92) * strideAmp * moveW;
      // Knee bends sharply during forward swing recovery (c > 0), flexes lightly on foot plant
      const swingKnee = Math.max(0, c) * (0.68 + sprintW * 0.52 + dashW * 0.25);
      const stanceKnee = (0.14 + Math.max(0, -s) * 0.12) * (0.65 + sprintW * 0.35);
      const kneeMove = (swingKnee + stanceKnee) * moveW;

      // Ankle dorsiflexes on heel-strike (s < 0), pushes off behind (s > 0)
      const footMove =
        (s > 0.1 ? s * (0.34 + sprintW * 0.2) : s * 0.22 - Math.max(0, c) * 0.18) * moveW;

      // Idle combat stagger (natural grounded readiness)
      const idleHip = (sideSign < 0 ? -0.09 : 0.11) * (1 - moveW);
      const idleKnee = (sideSign < 0 ? 0.14 : 0.13) * (1 - moveW);
      const idleFoot = -(idleHip + idleKnee) * 0.75 * (1 - moveW);

      const crouchHip = -0.76 * crouchW + (sideSign < 0 ? -0.08 : 0.1) * crouchW * (1 - moveW);
      const crouchKnee = 1.24 * crouchW;
      const squashHip = -0.42 * squash;
      const squashKnee = 0.78 * squash;

      const finalHip = hipMove + idleHip + crouchHip + squashHip;
      const finalKnee = Math.max(0.05, kneeMove + idleKnee + crouchKnee + squashKnee);
      const finalFoot =
        footMove + idleFoot - (crouchHip + crouchKnee) * 0.55 - (squashHip + squashKnee) * 0.45;

      // Lateral step flare when strafing
      const strafeSpread =
        sideSign * (0.04 + crouchW * 0.05) +
        s * 0.14 * Math.abs(inp.localRight) * moveW;

      return { hip: finalHip, knee: finalKnee, foot: finalFoot, spread: strafeSpread };
    };

    const L = computeLeg(phase, -1);
    const R = computeLeg(phase + Math.PI, 1);
    legLX = L.hip;
    kneeLX = L.knee;
    footLX = L.foot;
    legLZ = L.spread;
    legRX = R.hip;
    kneeRX = R.knee;
    footRX = R.foot;
    legRZ = R.spread;
  }

  const legDamp = inp.isAirborne ? 13 : 18;
  rig.legL.rotation.x = damp(rig.legL.rotation.x, legLX, legDamp);
  rig.legR.rotation.x = damp(rig.legR.rotation.x, legRX, legDamp);
  rig.legL.rotation.z = damp(rig.legL.rotation.z, legLZ, 14);
  rig.legR.rotation.z = damp(rig.legR.rotation.z, legRZ, 14);
  rig.kneeL.rotation.x = damp(rig.kneeL.rotation.x, kneeLX, legDamp);
  rig.kneeR.rotation.x = damp(rig.kneeR.rotation.x, kneeRX, legDamp);
  rig.footL.rotation.x = damp(rig.footL.rotation.x, footLX, legDamp);
  rig.footR.rotation.x = damp(rig.footR.rotation.x, footRX, legDamp);

  // 5. Articulated Right Weapon Arm + Elbow (combat aim, tactical sprint carry, recoil & reload)
  let armRX = -0.62 + inp.camPitch * 0.56 - inp.recoil * 0.34 + breath * 0.02;
  let armRY = -0.14 - inp.aimBlend * 0.06;
  let armRZ = 0.04;
  let elbowRX = -0.95 - inp.recoil * 0.16;

  if (inp.isReloading) {
    const rSin = Math.sin(inp.reloadProgress * Math.PI);
    armRX = -0.58 - rSin * 0.18;
    armRY = -0.14 - rSin * 0.32;
    armRZ = -rSin * 0.24;
    elbowRX = -0.95 - rSin * 0.22;
  } else if (tacticalSprintCarry > 0.05) {
    const carrySwing = Math.sin(phase) * 0.18 * tacticalSprintCarry;
    armRX = THREE.MathUtils.lerp(armRX, -0.3 + carrySwing, tacticalSprintCarry);
    armRY = THREE.MathUtils.lerp(armRY, -0.48, tacticalSprintCarry);
    armRZ = THREE.MathUtils.lerp(armRZ, 0.12, tacticalSprintCarry);
    elbowRX = THREE.MathUtils.lerp(elbowRX, -1.16, tacticalSprintCarry);
  } else if (moveW > 0.05) {
    // Subtle weapon carriage rhythm while walking/aiming
    const aimSteadiness = 1 - inp.aimBlend * 0.65;
    armRX += Math.sin(phase * 2) * 0.032 * moveW * aimSteadiness;
    armRY += Math.cos(phase) * 0.035 * moveW * aimSteadiness;
  }

  rig.armR.rotation.x = damp(rig.armR.rotation.x, armRX, 20);
  rig.armR.rotation.y = damp(rig.armR.rotation.y, armRY, 18);
  rig.armR.rotation.z = damp(rig.armR.rotation.z, armRZ, 18);
  rig.elbowR.rotation.x = damp(rig.elbowR.rotation.x, elbowRX, 20);

  // 6. Articulated Left Support Arm + Elbow (2-hand weapon support, reload mag swap, or sprint pump)
  let armLX = -0.12;
  let armLY = 0.06;
  let armLZ = -0.08;
  let elbowLX = -0.35;

  if (inp.isReloading) {
    // Stage 1: dip left hand to belt mag pouch -> Stage 2: bring mag up to weapon receiver
    const p = inp.reloadProgress;
    if (p < 0.38) {
      const t = p / 0.38;
      armLX = THREE.MathUtils.lerp(-0.52, 0.14, t);
      armLY = THREE.MathUtils.lerp(0.42, 0.18, t);
      armLZ = -0.05;
      elbowLX = THREE.MathUtils.lerp(-0.92, -0.58, t);
    } else if (p < 0.78) {
      const t = (p - 0.38) / 0.4;
      armLX = THREE.MathUtils.lerp(0.14, -0.76, t);
      armLY = THREE.MathUtils.lerp(0.18, 0.56, t);
      armLZ = 0.08;
      elbowLX = THREE.MathUtils.lerp(-0.58, -1.12, t);
    } else {
      const t = (p - 0.78) / 0.22;
      armLX = THREE.MathUtils.lerp(-0.76, -0.62, t);
      armLY = THREE.MathUtils.lerp(0.56, 0.46, t);
      armLZ = 0.05;
      elbowLX = THREE.MathUtils.lerp(-1.12, -0.92, t);
    }
  } else if (inp.isAirborne && inp.aimBlend < 0.3) {
    armLX = -0.52;
    armLY = -0.14;
    armLZ = -0.32;
    elbowLX = -0.68;
  } else {
    // Two-handed support grip weight: full on rifles/SMG/shotgun or when aiming pistol
    const supportW =
      (isTwoHanded ? 1 : inp.aimBlend) * (1 - tacticalSprintCarry * 0.85);
    // Athletic counter-swing (opposite left leg = in-phase with right leg)
    const swingAmp = dashW > 0.5 ? 0.92 : 0.42 + sprintW * 0.45;
    const freeArmX =
      -0.1 - Math.sin(phase) * swingAmp * moveW + (inp.isDashing ? 0.35 : 0);
    const freeElbowX =
      -0.34 - Math.max(0, Math.sin(phase)) * (0.48 + sprintW * 0.45) * moveW - sprintW * 0.32;
    const freeArmY = 0.08 + sprintW * 0.18;
    const freeArmZ = -0.1 - sprintW * 0.08;

    const gripArmX = -0.64 + inp.camPitch * 0.5 - inp.recoil * 0.24 + breath * 0.018;
    const gripArmY = isTwoHanded ? 0.5 : 0.58;
    const gripArmZ = 0.1;
    const gripElbowX = isTwoHanded ? -0.92 : -1.04;

    armLX = THREE.MathUtils.lerp(freeArmX, gripArmX, supportW);
    armLY = THREE.MathUtils.lerp(freeArmY, gripArmY, supportW);
    armLZ = THREE.MathUtils.lerp(freeArmZ, gripArmZ, supportW);
    elbowLX = THREE.MathUtils.lerp(freeElbowX, gripElbowX, supportW);
  }

  rig.armL.rotation.x = damp(rig.armL.rotation.x, armLX, 18);
  rig.armL.rotation.y = damp(rig.armL.rotation.y, armLY, 18);
  rig.armL.rotation.z = damp(rig.armL.rotation.z, armLZ, 18);
  rig.elbowL.rotation.x = damp(rig.elbowL.rotation.x, elbowLX, 18);
}

export function setPlayerWeaponModel(rig: PlayerRig, weaponId: WeaponId): void {
  rig.weaponGroups.pistol.visible = weaponId === 'pistol';
  rig.weaponGroups.smg.visible = weaponId === 'smg';
  rig.weaponGroups.shotgun.visible = weaponId === 'shotgun';
  rig.weaponGroups.rifle.visible = weaponId === 'rifle';

  const zOffset =
    weaponId === 'rifle' ? 0.78 : weaponId === 'shotgun' ? 0.75 : weaponId === 'smg' ? 0.52 : 0.28;
  rig.muzzlePoint.position.set(0, 0.04, zOffset);
  rig.muzzleFlash.position.copy(rig.muzzlePoint.position);
  rig.muzzleLight.position.copy(rig.muzzlePoint.position);
}

export interface FirstPersonRig {
  root: THREE.Group;
  pivot: THREE.Group;
  weaponHolder: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  muzzlePoint: THREE.Object3D;
  muzzleFlash: THREE.Mesh;
  muzzleLight: THREE.PointLight;
  weaponGroups: Record<WeaponId, THREE.Group>;
}

export function createFirstPersonViewModel(
  characterId: CharacterId = 'raka',
  skinIdOverride?: CharacterSkinId,
): FirstPersonRig {
  const charSpec = CHARACTERS[characterId] ?? CHARACTERS.raka;
  const skinId = resolveSkinForCharacter(characterId, skinIdOverride ?? charSpec.defaultSkin);
  const skinSpec = CHARACTER_SKINS[skinId];
  const isFemale = charSpec.gender === 'Female';
  const tex = getPlayerSkinTextures();

  const skinToneHex =
    skinId === 'leather_agent' || skinId === 'stars_beret' || skinId === 'crimson_spy'
      ? 0xdab092
      : skinId === 'red_biker'
        ? 0xd6a786
        : skinId === 'ubcs_merc'
          ? 0xc89572
          : charSpec.skinHex;

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinToneHex,
    roughness: 0.56,
    metalness: 0.03,
  });
  const gloveMat = new THREE.MeshStandardMaterial({
    color: skinId === 'ubcs_merc' ? 0x4b4e57 : 0x14161b,
    roughness: 0.62,
    metalness: 0.14,
  });

  let sleeveMat: THREE.MeshStandardMaterial;
  if (skinId === 'rpd_officer') {
    sleeveMat = new THREE.MeshStandardMaterial({ color: 0x3b485c, roughness: 0.8 });
  } else if (skinId === 'leather_agent') {
    sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x15171c,
      map: tex.leatherJacket,
      roughness: 0.4,
      metalness: 0.2,
    });
  } else if (skinId === 'red_biker') {
    sleeveMat = new THREE.MeshStandardMaterial({
      map: tex.redLeather,
      roughness: 0.42,
      metalness: 0.16,
    });
  } else if (skinId === 'crimson_spy') {
    sleeveMat = new THREE.MeshStandardMaterial({
      map: tex.crimsonKnit,
      roughness: 0.78,
      metalness: 0.04,
    });
  } else {
    sleeveMat = skinMat;
  }

  const gunMetalMat = new THREE.MeshStandardMaterial({
    color: 0x1f2630,
    roughness: 0.26,
    metalness: 0.88,
  });
  const gunHighlightMat = new THREE.MeshStandardMaterial({
    color: 0x4b586b,
    roughness: 0.34,
    metalness: 0.78,
  });
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0x14171d,
    roughness: 0.65,
    metalness: 0.15,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skinSpec.accentColor ?? charSpec.accentColor),
    roughness: 0.32,
    metalness: 0.55,
  });

  const root = new THREE.Group();
  const pivot = new THREE.Group();
  root.add(pivot);

  // Orient weaponHolder along -Z (forward in Three.js camera space)
  const weaponHolder = new THREE.Group();
  weaponHolder.rotation.y = Math.PI;
  pivot.add(weaponHolder);

  const pistolGroup = buildCompositeGun('pistol', accentMat, gunMetalMat, gunHighlightMat, gripMat);
  const smgGroup = buildCompositeGun('smg', accentMat, gunMetalMat, gunHighlightMat, gripMat);
  const shotgunGroup = buildCompositeGun('shotgun', accentMat, gunMetalMat, gunHighlightMat, gripMat);
  const rifleGroup = buildCompositeGun('rifle', accentMat, gunMetalMat, gunHighlightMat, gripMat);

  smgGroup.visible = false;
  shotgunGroup.visible = false;
  rifleGroup.visible = false;
  weaponHolder.add(pistolGroup, smgGroup, shotgunGroup, rifleGroup);

  const armRadius = isFemale ? 0.036 : 0.044;

  // Right forearm & glove gripping rear pistol grip
  const armR = new THREE.Group();
  const sleeveR = new THREE.Mesh(
    new THREE.CylinderGeometry(armRadius * 0.92, armRadius * 1.15, 0.34, 10),
    sleeveMat,
  );
  sleeveR.rotation.x = Math.PI / 2;
  sleeveR.position.set(0.035, -0.095, 0.19);
  sleeveR.rotation.z = -0.18;
  sleeveR.rotation.y = 0.12;
  const gloveR = new THREE.Mesh(
    new THREE.BoxGeometry(armRadius * 1.9, armRadius * 1.7, 0.1),
    gloveMat,
  );
  gloveR.position.set(0, -0.068, 0.03);
  armR.add(sleeveR, gloveR);
  pivot.add(armR);

  // Left forearm & support hand (supports handguard on 2-handed weapons or cups grip on pistol)
  const armL = new THREE.Group();
  const sleeveL = new THREE.Mesh(
    new THREE.CylinderGeometry(armRadius * 0.9, armRadius * 1.12, 0.36, 10),
    sleeveMat,
  );
  sleeveL.rotation.x = Math.PI / 2;
  sleeveL.position.set(-0.145, -0.105, 0.02);
  sleeveL.rotation.y = -0.52;
  sleeveL.rotation.z = 0.22;
  const gloveL = new THREE.Mesh(
    new THREE.BoxGeometry(armRadius * 1.85, armRadius * 1.65, 0.095),
    gloveMat,
  );
  gloveL.position.set(-0.022, -0.025, -0.18);
  armL.add(sleeveL, gloveL);
  pivot.add(armL);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.04, 0.28);
  weaponHolder.add(muzzlePoint);

  const muzzleFlash = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.11, 0),
    new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    }),
  );
  muzzleFlash.scale.set(0.65, 0.65, 1.5);
  muzzleFlash.position.copy(muzzlePoint.position);
  muzzleFlash.visible = false;
  weaponHolder.add(muzzleFlash);

  const muzzleLight = new THREE.PointLight(0xffb703, 0, 12, 2);
  muzzleLight.position.copy(muzzlePoint.position);
  weaponHolder.add(muzzleLight);

  return {
    root,
    pivot,
    weaponHolder,
    armL,
    armR,
    muzzlePoint,
    muzzleFlash,
    muzzleLight,
    weaponGroups: {
      pistol: pistolGroup,
      smg: smgGroup,
      shotgun: shotgunGroup,
      rifle: rifleGroup,
    },
  };
}

export function setFirstPersonWeapon(rig: FirstPersonRig, weaponId: WeaponId): void {
  rig.weaponGroups.pistol.visible = weaponId === 'pistol';
  rig.weaponGroups.smg.visible = weaponId === 'smg';
  rig.weaponGroups.shotgun.visible = weaponId === 'shotgun';
  rig.weaponGroups.rifle.visible = weaponId === 'rifle';

  const zOffset =
    weaponId === 'rifle' ? 0.78 : weaponId === 'shotgun' ? 0.75 : weaponId === 'smg' ? 0.52 : 0.28;
  rig.muzzlePoint.position.set(0, 0.04, zOffset);
  rig.muzzleFlash.position.copy(rig.muzzlePoint.position);
  rig.muzzleLight.position.copy(rig.muzzlePoint.position);

  // Position left support hand on barrel shroud for long guns, or cupped at grip for pistol
  if (weaponId === 'pistol') {
    rig.armL.position.set(0.02, -0.035, 0.16);
    rig.armL.rotation.set(0.08, -0.22, 0);
  } else {
    rig.armL.position.set(0, 0, -0.14);
    rig.armL.rotation.set(0, 0, 0);
  }
}

interface ZombieTextureSet {
  fleshBump: THREE.CanvasTexture;
  leatherBump: THREE.CanvasTexture;
  officerSkin: THREE.CanvasTexture;
  officerShirt: THREE.CanvasTexture;
  officerPants: THREE.CanvasTexture;
  ribSkin: THREE.CanvasTexture;
  ribJacket: THREE.CanvasTexture;
  ribCavity: THREE.CanvasTexture;
  ribPants: THREE.CanvasTexture;
  spikedSkin: THREE.CanvasTexture;
  mutantSkin: THREE.CanvasTexture;
  tyrantSkin: THREE.CanvasTexture;
  tyrantCoat: THREE.CanvasTexture;
  bioweaponFlesh: THREE.CanvasTexture;
  bioweaponMutant: THREE.CanvasTexture;
  ladySkin: THREE.CanvasTexture;
  ladyDress: THREE.CanvasTexture;
}

let cachedZombieTextures: ZombieTextureSet | null = null;

function makeZombieTex(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  isDataMap = false,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = isDataMap ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function getZombieTextures(): ZombieTextureSet {
  if (cachedZombieTextures) return cachedZombieTextures;

  const fleshBump = makeZombieTex(
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 650; i++) {
        const v = Math.random() > 0.5 ? 165 : 95;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      ctx.strokeStyle = 'rgb(195,195,195)';
      ctx.lineWidth = 1.6;
      for (let v = 0; v < 14; v++) {
        let vx = Math.random() * w;
        let vy = Math.random() * h;
        ctx.beginPath();
        ctx.moveTo(vx, vy);
        for (let s = 0; s < 4; s++) {
          vx += (Math.random() - 0.5) * 26;
          vy += (Math.random() - 0.5) * 26;
          ctx.lineTo(vx, vy);
        }
        ctx.stroke();
      }
    },
    true,
  );

  const leatherBump = makeZombieTex(
    128,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#7c7c7c';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgb(142,142,142)';
      ctx.lineWidth = 2;
      for (let i = -h; i < w + h; i += 6) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + h, h);
        ctx.stroke();
      }
      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(40,40,40,0.4)' : 'rgba(200,200,200,0.25)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    },
    true,
  );

  const officerSkin = makeZombieTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#7b8373';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 450; i++) {
      ctx.fillStyle = i % 3 === 0 ? 'rgba(35,38,30,0.38)' : 'rgba(145,152,135,0.22)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
    ctx.fillStyle = 'rgba(110, 20, 22, 0.55)';
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 4 + Math.random() * 8, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const officerShirt = makeZombieTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#2b323d';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 650; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(15,18,24,0.32)' : 'rgba(80,92,108,0.2)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
    ctx.fillStyle = '#181c22';
    ctx.fillRect(w * 0.47, 0, 6, h);
    ctx.fillStyle = 'rgba(105, 18, 22, 0.72)';
    ctx.beginPath();
    ctx.ellipse(w * 0.48, h * 0.25, 22, 26, 0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  const officerPants = makeZombieTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1f242c';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 550; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(10,12,16,0.38)' : 'rgba(65,72,84,0.22)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 4, 3);
    }
  });

  const ribSkin = makeZombieTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#a39988';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = i % 3 === 0 ? 'rgba(60,42,36,0.32)' : 'rgba(200,188,168,0.22)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
    ctx.fillStyle = 'rgba(95, 25, 24, 0.52)';
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, 3 + Math.random() * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const ribJacket = makeZombieTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#3b4140';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 580; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(20,22,22,0.35)' : 'rgba(95,102,96,0.2)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 4);
    }
  });

  const ribCavity = makeZombieTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#360b0f';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 240; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(128,16,22,0.5)' : 'rgba(25,5,8,0.55)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 6, 4);
    }
  });

  const ribPants = makeZombieTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#342d28';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 520; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(18,14,12,0.4)' : 'rgba(84,72,62,0.24)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 4, 3);
    }
  });

  const spikedSkin = makeZombieTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#2b2227';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 450; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(15,10,14,0.45)' : 'rgba(72,54,60,0.28)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
    ctx.strokeStyle = 'rgba(135, 18, 28, 0.75)';
    ctx.lineWidth = 2;
    for (let v = 0; v < 16; v++) {
      let vx = Math.random() * w;
      let vy = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      for (let s = 0; s < 5; s++) {
        vx += (Math.random() - 0.5) * 32;
        vy += (Math.random() - 0.5) * 32;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }
  });

  const mutantSkin = makeZombieTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#9aa1a5';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 540; i++) {
      ctx.fillStyle = i % 3 === 0 ? 'rgba(65,68,74,0.32)' : 'rgba(195,200,204,0.25)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 4, 3);
    }
    ctx.strokeStyle = 'rgba(54, 48, 56, 0.5)';
    ctx.lineWidth = 1.5;
    for (let c = 0; c < 18; c++) {
      const sx = Math.random() * w;
      const sy = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 36, sy + (Math.random() - 0.5) * 20);
      ctx.stroke();
    }
  });

  const tyrantSkin = makeZombieTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#757d84';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(38,44,50,0.36)' : 'rgba(155,165,175,0.22)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
    // Scar lines across cheeks
    ctx.strokeStyle = 'rgba(42,46,52,0.65)';
    ctx.lineWidth = 1.5;
    for (let s = 0; s < 10; s++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (Math.random() - 0.5) * 20, y + 12);
      ctx.stroke();
    }
  });

  const tyrantCoat = makeZombieTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#181a1d';
    ctx.fillRect(0, 0, w, h);
    // Heavy carbon-kevlar / textured leather diagonal twill
    ctx.strokeStyle = 'rgba(42, 46, 54, 0.52)';
    ctx.lineWidth = 2;
    for (let i = -h; i < w + h; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.stroke();
    }
    addFabricGrain(ctx, w, h, 0.25, 0.1, 1600);
    // Trenchcoat double-breasted seam & buttons
    ctx.fillStyle = '#0d0e11';
    ctx.fillRect(w * 0.58, 0, 5, h);
    ctx.fillStyle = '#2e333c';
    for (const by of [55, 110, 165]) {
      ctx.beginPath();
      ctx.arc(w * 0.42, by, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const bioweaponFlesh = makeZombieTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#9b8d8a';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 450; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(55,34,36,0.34)' : 'rgba(195,180,176,0.22)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
    ctx.strokeStyle = 'rgba(92, 16, 24, 0.65)';
    ctx.lineWidth = 1.6;
    for (let v = 0; v < 12; v++) {
      const sx = Math.random() * w;
      const sy = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 30, sy + (Math.random() - 0.5) * 30);
      ctx.stroke();
    }
  });

  const bioweaponMutant = makeZombieTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#241819';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1200; i++) {
      ctx.fillStyle = i % 3 === 0 ? 'rgba(12,8,9,0.55)' : 'rgba(72,38,34,0.32)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 4, 4);
    }
    ctx.strokeStyle = 'rgba(148, 28, 30, 0.72)';
    ctx.lineWidth = 2.2;
    for (let v = 0; v < 20; v++) {
      let vx = Math.random() * w;
      let vy = Math.random() * h;
      ctx.beginPath();
      ctx.moveTo(vx, vy);
      for (let s = 0; s < 5; s++) {
        vx += (Math.random() - 0.5) * 34;
        vy += (Math.random() - 0.5) * 34;
        ctx.lineTo(vx, vy);
      }
      ctx.stroke();
    }
  });

  const ladySkin = makeZombieTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#cfd4da';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 240; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(155,162,172,0.18)' : 'rgba(242,245,250,0.22)';
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
    }
  });

  const ladyDress = makeZombieTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#bdb8aa';
    ctx.fillRect(0, 0, w, h);
    // Vertical silk dress pleats
    for (let x = 0; x < w; x += 12) {
      ctx.fillStyle = x % 24 === 0 ? 'rgba(42,38,32,0.22)' : 'rgba(255,252,244,0.2)';
      ctx.fillRect(x, 0, 5, h);
    }
    // Weathered grime toward hem
    const hemGrad = ctx.createLinearGradient(0, h * 0.55, 0, h);
    hemGrad.addColorStop(0, 'rgba(35,32,26,0)');
    hemGrad.addColorStop(1, 'rgba(35,32,26,0.48)');
    ctx.fillStyle = hemGrad;
    ctx.fillRect(0, 0, w, h);
  });

  cachedZombieTextures = {
    fleshBump,
    leatherBump,
    officerSkin,
    officerShirt,
    officerPants,
    ribSkin,
    ribJacket,
    ribCavity,
    ribPants,
    spikedSkin,
    mutantSkin,
    tyrantSkin,
    tyrantCoat,
    bioweaponFlesh,
    bioweaponMutant,
    ladySkin,
    ladyDress,
  };
  return cachedZombieTextures;
}

export function disposeZombieRig(rig: ZombieRig): void {
  rig.root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const m = obj as THREE.Mesh;
      m.geometry?.dispose();
      if (Array.isArray(m.material)) {
        m.material.forEach((mat) => mat.dispose());
      } else {
        m.material?.dispose();
      }
    }
  });
}

export function createZombieModel(
  variant: ZombieVariant,
  contactShadowTex: THREE.Texture,
  appearance: ZombieAppearance = 'officer',
): ZombieRig {
  const tex = getZombieTextures();
  const root = new THREE.Group();

  const scale =
    appearance === 'boss_lady'
      ? 1.56
      : appearance === 'boss_tyrant'
        ? 1.46
        : appearance === 'boss_bioweapon'
          ? 1.42
          : appearance === 'mutant'
            ? 1.34
            : appearance === 'spiked'
              ? 1.06
              : appearance === 'officer'
                ? 1.04
                : variant === 'brute'
                  ? 1.28
                  : variant === 'boss'
                    ? 1.45
                    : 1.02;

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.32 * scale, 1.32 * scale),
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: variant === 'boss' ? 0.68 : 0.55,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  const bodyGroup = new THREE.Group();
  bodyGroup.scale.setScalar(scale);
  root.add(bodyGroup);

  const hitMeshes: THREE.Mesh[] = [];
  const materialsToFlash: THREE.MeshStandardMaterial[] = [];

  const registerHit = (mesh: THREE.Mesh, part: 'body' | 'head') => {
    mesh.userData = { part };
    mesh.castShadow = true;
    hitMeshes.push(mesh);
  };

  let headMesh: THREE.Mesh;
  let legL: THREE.Group;
  let legR: THREE.Group;
  let kneeL: THREE.Group;
  let kneeR: THREE.Group;
  let armL: THREE.Group;
  let armR: THREE.Group;
  let elbowL: THREE.Group;
  let elbowR: THREE.Group;

  if (appearance === 'officer') {
    // 1. REALISTIC POLICE OFFICER ZOMBIE (zombie3_b81417a0.jpeg)
    const skinMat = new THREE.MeshStandardMaterial({
      map: tex.officerSkin,
      bumpMap: tex.fleshBump,
      bumpScale: 0.024,
      roughness: 0.82,
      metalness: 0.05,
    });
    const shirtMat = new THREE.MeshStandardMaterial({
      map: tex.officerShirt,
      bumpMap: tex.leatherBump,
      bumpScale: 0.015,
      roughness: 0.88,
      metalness: 0.06,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      map: tex.officerPants,
      bumpMap: tex.leatherBump,
      bumpScale: 0.016,
      roughness: 0.9,
      metalness: 0.05,
    });
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x111318,
      roughness: 0.55,
      metalness: 0.25,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xcab065,
      roughness: 0.28,
      metalness: 0.85,
    });
    const toothMat = new THREE.MeshStandardMaterial({
      color: 0xd4c6a5,
      roughness: 0.5,
      metalness: 0.05,
    });
    const socketMat = new THREE.MeshStandardMaterial({ color: 0x0b0a0c, roughness: 0.95 });
    const eyePinMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    });
    materialsToFlash.push(skinMat, shirtMat, pantsMat);

    const makeOfficerLeg = (x: number, tornKnee: boolean): { leg: THREE.Group; knee: THREE.Group } => {
      const leg = new THREE.Group();
      leg.position.set(x, 0.86, 0);

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.086, 0.42, 10), pantsMat);
      thigh.position.y = -0.21;
      registerHit(thigh, 'body');
      leg.add(thigh);

      const cargoPocket = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.18, 0.14), pantsMat);
      cargoPocket.position.set(x < 0 ? -0.098 : 0.098, -0.22, 0);
      leg.add(cargoPocket);

      const knee = new THREE.Group();
      knee.position.set(0, -0.42, 0);
      leg.add(knee);

      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.064, 0.34, 10), pantsMat);
      shin.position.y = -0.15;
      registerHit(shin, 'body');
      knee.add(shin);

      if (tornKnee) {
        const kneeSkin = new THREE.Mesh(new THREE.SphereGeometry(0.072, 8, 8), skinMat);
        kneeSkin.position.set(0, -0.01, 0.025);
        knee.add(kneeSkin);
      }

      const bootCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.068, 0.14, 10), leatherMat);
      bootCuff.position.y = -0.29;
      const bootFoot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.25), leatherMat);
      bootFoot.position.set(0, -0.39, 0.045);
      bootFoot.castShadow = true;
      knee.add(bootCuff, bootFoot);

      return { leg, knee };
    };

    const oLegL = makeOfficerLeg(-0.14, true);
    const oLegR = makeOfficerLeg(0.14, false);
    legL = oLegL.leg;
    kneeL = oLegL.knee;
    legR = oLegR.leg;
    kneeR = oLegR.knee;
    bodyGroup.add(legL, legR);

    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.2, 0.2, 12), pantsMat);
    pelvis.scale.set(1.12, 1, 0.72);
    pelvis.position.y = 0.93;
    bodyGroup.add(pelvis);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.19, 0.56, 12), shirtMat);
    torso.scale.set(1.14, 1, 0.7);
    torso.position.set(0, 1.24, 0.03);
    torso.rotation.x = 0.14;
    registerHit(torso, 'body');
    bodyGroup.add(torso);

    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.075, 12), leatherMat);
    belt.scale.set(1.14, 1, 0.73);
    belt.position.set(0, 0.97, 0.01);
    bodyGroup.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.03), brassMat);
    buckle.position.set(0, 0.97, 0.16);
    bodyGroup.add(buckle);

    const chestBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.02, 6), brassMat);
    chestBadge.rotation.x = Math.PI / 2;
    chestBadge.position.set(0.125, 1.34, 0.178);
    bodyGroup.add(chestBadge);

    const collarL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.075, 0.16), shirtMat);
    collarL.position.set(-0.09, 1.5, 0.09);
    collarL.rotation.z = 0.28;
    const collarR = collarL.clone();
    collarR.position.x = 0.09;
    collarR.rotation.z = -0.28;
    bodyGroup.add(collarL, collarR);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.075, 0.12, 10), skinMat);
    neck.position.set(0.01, 1.56, 0.07);
    neck.rotation.z = 0.18;
    bodyGroup.add(neck);

    // Sculpted Tilted Officer Cranium + Jaw + Police Cap
    headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.138, 14, 12), skinMat);
    headMesh.scale.set(0.92, 1.12, 1.0);
    headMesh.position.set(0.02, 1.71, 0.12);
    headMesh.rotation.set(0.12, 0, 0.24);
    registerHit(headMesh, 'head');
    bodyGroup.add(headMesh);

    const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.096, 0.068, 0.1, 10), skinMat);
    jaw.position.set(0, -0.09, 0.03);
    headMesh.add(jaw);

    const socketL = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), socketMat);
    socketL.scale.set(1.15, 0.85, 0.5);
    socketL.position.set(-0.048, 0.02, 0.122);
    const socketR = socketL.clone();
    socketR.position.x = 0.048;
    headMesh.add(socketL, socketR);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 6), eyePinMat);
    eyeL.position.set(-0.048, 0.02, 0.134);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.048;
    headMesh.add(eyeL, eyeR);

    const mouthCav = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.045, 0.04), socketMat);
    mouthCav.position.set(0, -0.085, 0.105);
    const teethRow = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.022, 0.025), toothMat);
    teethRow.position.set(0, -0.078, 0.118);
    headMesh.add(mouthCav, teethRow);

    const capCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.142, 0.12, 12), shirtMat);
    capCrown.position.set(0, 0.155, -0.01);
    capCrown.rotation.x = -0.16;
    const capBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.165, 0.022, 12, 1, false, -0.9, 1.8), leatherMat);
    capBrim.position.set(0, 0.1, 0.04);
    capBrim.rotation.x = 0.18;
    const capBadge = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.018, 6), brassMat);
    capBadge.rotation.x = Math.PI / 2;
    capBadge.position.set(0, 0.15, 0.15);
    headMesh.add(capCrown, capBrim, capBadge);

    const makeOfficerArm = (x: number, hasPatch: boolean): { arm: THREE.Group; elbow: THREE.Group } => {
      const arm = new THREE.Group();
      arm.position.set(x, 1.44, 0.05);

      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.082, 8, 8), shirtMat);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.064, 0.28, 10), shirtMat);
      sleeve.position.set(0, -0.02, 0.14);
      sleeve.rotation.x = Math.PI / 2 - 0.15;
      registerHit(sleeve, 'body');
      arm.add(shoulder, sleeve);

      if (hasPatch) {
        const patch = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.06), brassMat);
        patch.position.set(x < 0 ? -0.074 : 0.074, 0, 0.14);
        arm.add(patch);
      }

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.04, 0.27);
      arm.add(elbow);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.045, 0.34, 10), skinMat);
      forearm.position.set(0, -0.02, 0.16);
      forearm.rotation.x = Math.PI / 2 - 0.08;
      registerHit(forearm, 'body');
      elbow.add(forearm);

      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.095, 0.1), skinMat);
      hand.position.set(0, -0.04, 0.34);
      elbow.add(hand);

      return { arm, elbow };
    };

    const oArmL = makeOfficerArm(-0.3, true);
    const oArmR = makeOfficerArm(0.3, false);
    armL = oArmL.arm;
    elbowL = oArmL.elbow;
    armR = oArmR.arm;
    elbowR = oArmR.elbow;
    bodyGroup.add(armL, armR);
  } else if (appearance === 'ribcage') {
    // 2. REALISTIC EXPOSED RIBCAGE ZOMBIE (zombie_60452499.jpeg)
    const skinMat = new THREE.MeshStandardMaterial({
      map: tex.ribSkin,
      bumpMap: tex.fleshBump,
      bumpScale: 0.028,
      roughness: 0.8,
      metalness: 0.04,
    });
    const jacketMat = new THREE.MeshStandardMaterial({
      map: tex.ribJacket,
      bumpMap: tex.leatherBump,
      bumpScale: 0.018,
      roughness: 0.9,
      metalness: 0.04,
    });
    const cavityMat = new THREE.MeshStandardMaterial({
      map: tex.ribCavity,
      bumpMap: tex.fleshBump,
      bumpScale: 0.032,
      roughness: 0.48,
      metalness: 0.08,
    });
    const boneMat = new THREE.MeshStandardMaterial({
      color: 0xd9cfb8,
      roughness: 0.46,
      metalness: 0.08,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      map: tex.ribPants,
      roughness: 0.9,
      metalness: 0.04,
    });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.72, metalness: 0.15 });
    const eyeRedMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 2.0,
      roughness: 0.2,
    });
    const eyeYellowMat = new THREE.MeshStandardMaterial({
      color: 0xd9f99d,
      emissive: 0xa3e635,
      emissiveIntensity: 1.9,
      roughness: 0.2,
    });
    materialsToFlash.push(skinMat, jacketMat, cavityMat, pantsMat);

    const makeRibLeg = (x: number): { leg: THREE.Group; knee: THREE.Group } => {
      const leg = new THREE.Group();
      leg.position.set(x, 0.86, 0);

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.088, 0.42, 10), pantsMat);
      thigh.position.y = -0.21;
      registerHit(thigh, 'body');
      leg.add(thigh);

      const knee = new THREE.Group();
      knee.position.set(0, -0.42, 0);
      leg.add(knee);

      const kneeTear = new THREE.Mesh(new THREE.SphereGeometry(0.072, 8, 8), cavityMat);
      kneeTear.position.set(0, -0.01, 0.022);
      knee.add(kneeTear);

      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.068, 0.34, 10), pantsMat);
      shin.position.y = -0.15;
      registerHit(shin, 'body');
      knee.add(shin);

      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.13, 0.25), bootMat);
      boot.position.set(0, -0.36, 0.04);
      boot.castShadow = true;
      knee.add(boot);

      return { leg, knee };
    };

    const rLegL = makeRibLeg(-0.14);
    const rLegR = makeRibLeg(0.14);
    legL = rLegL.leg;
    kneeL = rLegL.knee;
    legR = rLegR.leg;
    kneeR = rLegR.knee;
    bodyGroup.add(legL, legR);

    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.195, 0.2, 10), pantsMat);
    pelvis.scale.set(1.12, 1, 0.72);
    pelvis.position.y = 0.93;
    bodyGroup.add(pelvis);

    const torsoCore = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.175, 0.54, 12), cavityMat);
    torsoCore.scale.set(1.1, 1, 0.65);
    torsoCore.position.set(0, 1.23, 0.02);
    torsoCore.rotation.x = 0.14;
    registerHit(torsoCore, 'body');
    bodyGroup.add(torsoCore);

    const jacketBack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.235, 0.205, 0.58, 12, 1, false, Math.PI * 0.55, Math.PI * 1.9),
      jacketMat,
    );
    jacketBack.scale.set(1.14, 1, 0.74);
    jacketBack.position.set(0, 1.24, 0.02);
    jacketBack.rotation.x = 0.14;
    bodyGroup.add(jacketBack);

    const flapL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.54, 0.08), jacketMat);
    flapL.position.set(-0.17, 1.23, 0.12);
    flapL.rotation.set(0.14, 0.25, 0);
    const flapR = flapL.clone();
    flapR.position.x = 0.17;
    flapR.rotation.y = -0.25;
    bodyGroup.add(flapL, flapR);

    const sternum = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.018, 0.34, 8), boneMat);
    sternum.position.set(0, 1.26, 0.155);
    sternum.rotation.x = 0.14;
    bodyGroup.add(sternum);

    for (let r = 0; r < 4; r++) {
      const ry = 1.38 - r * 0.075;
      const rz = 0.14 + (3 - r) * 0.008;
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(0.115 - r * 0.006, 0.016, 6, 12, Math.PI * 0.9),
        boneMat,
      );
      rib.position.set(0, ry, rz - 0.05);
      rib.rotation.set(Math.PI / 2 + 0.14, 0, Math.PI * 0.05);
      bodyGroup.add(rib);
    }

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.072, 0.12, 10), skinMat);
    neck.position.set(0, 1.56, 0.08);
    bodyGroup.add(neck);

    // Sculpted Bald Skull Head with Asymmetrical Red/Yellow Eyes & Gaping Jaw
    headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.142, 14, 12), skinMat);
    headMesh.scale.set(0.92, 1.14, 1.0);
    headMesh.position.set(0, 1.71, 0.13);
    headMesh.rotation.set(0.08, 0, -0.08);
    registerHit(headMesh, 'head');
    bodyGroup.add(headMesh);

    const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.064, 0.1, 10), skinMat);
    jaw.position.set(0, -0.095, 0.03);
    headMesh.add(jaw);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeRedMat);
    eyeL.position.set(-0.05, 0.02, 0.128);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeYellowMat);
    eyeR.position.set(0.05, 0.02, 0.128);
    headMesh.add(eyeL, eyeR);

    const mouthCav = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.075, 0.06), cavityMat);
    mouthCav.position.set(0, -0.085, 0.105);
    const teethTop = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.03), boneMat);
    teethTop.position.set(0, -0.055, 0.122);
    const teethBot = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.02, 0.03), boneMat);
    teethBot.position.set(0, -0.11, 0.122);
    headMesh.add(mouthCav, teethTop, teethBot);

    const makeRibArm = (x: number): { arm: THREE.Group; elbow: THREE.Group } => {
      const arm = new THREE.Group();
      arm.position.set(x, 1.43, 0.05);

      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.078, 8, 8), jacketMat);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.06, 0.3, 10), jacketMat);
      upper.position.set(0, -0.02, 0.15);
      upper.rotation.x = Math.PI / 2 - 0.15;
      registerHit(upper, 'body');
      arm.add(shoulder, upper);

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.04, 0.29);
      arm.add(elbow);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.04, 0.34, 10), skinMat);
      forearm.position.set(0, -0.02, 0.16);
      forearm.rotation.x = Math.PI / 2 - 0.08;
      registerHit(forearm, 'body');
      elbow.add(forearm);

      const claw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, 0.11), boneMat);
      claw.position.set(0, -0.05, 0.35);
      elbow.add(claw);

      return { arm, elbow };
    };

    const rArmL = makeRibArm(-0.3);
    const rArmR = makeRibArm(0.3);
    armL = rArmL.arm;
    elbowL = rArmL.elbow;
    armR = rArmR.arm;
    elbowR = rArmR.elbow;
    bodyGroup.add(armL, armR);
  } else if (appearance === 'spiked') {
    // 3. REALISTIC SPIKED MUTANT ZOMBIE (zombie1_bde209ed.jpeg)
    const skinMat = new THREE.MeshStandardMaterial({
      map: tex.spikedSkin,
      bumpMap: tex.fleshBump,
      bumpScale: 0.035,
      roughness: 0.52,
      metalness: 0.14,
    });
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0xc2bcb0,
      roughness: 0.32,
      metalness: 0.48,
    });
    const mawMat = new THREE.MeshStandardMaterial({ color: 0x220508, roughness: 0.65 });
    const clawMat = new THREE.MeshStandardMaterial({
      color: 0xd1ccb8,
      roughness: 0.36,
      metalness: 0.25,
    });
    materialsToFlash.push(skinMat);

    const addSpike = (
      parent: THREE.Object3D,
      x: number,
      y: number,
      z: number,
      rx: number,
      ry: number,
      rz: number,
      len = 0.22,
      rad = 0.024,
    ) => {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(rad, len, 6), spikeMat);
      sp.position.set(x, y, z);
      sp.rotation.set(rx, ry, rz);
      parent.add(sp);
    };

    const makeSpikedLeg = (x: number): { leg: THREE.Group; knee: THREE.Group } => {
      const leg = new THREE.Group();
      leg.position.set(x, 0.86, 0);

      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.088, 0.44, 10), skinMat);
      upper.position.y = -0.22;
      registerHit(upper, 'body');
      leg.add(upper);

      const side = x < 0 ? -1 : 1;
      addSpike(leg, side * 0.12, -0.2, 0.02, 0, 0, -side * 1.2, 0.2);

      const knee = new THREE.Group();
      knee.position.set(0, -0.43, 0);
      leg.add(knee);

      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.086, 0.066, 0.4, 10), skinMat);
      lower.position.y = -0.19;
      registerHit(lower, 'body');
      knee.add(lower);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.135, 0.09, 0.24), skinMat);
      foot.position.set(0, -0.38, 0.05);
      knee.add(foot);

      addSpike(knee, side * 0.1, -0.15, -0.05, -0.3, 0, -side * 1.1, 0.22);
      addSpike(knee, 0, -0.33, -0.1, -1.2, 0, 0, 0.18);

      return { leg, knee };
    };

    const sLegL = makeSpikedLeg(-0.145);
    const sLegR = makeSpikedLeg(0.145);
    legL = sLegL.leg;
    kneeL = sLegL.knee;
    legR = sLegR.leg;
    kneeR = sLegR.knee;
    bodyGroup.add(legL, legR);

    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.19, 0.18, 10), skinMat);
    pelvis.scale.set(1.1, 1, 0.72);
    pelvis.position.y = 0.93;
    bodyGroup.add(pelvis);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.175, 0.56, 12), skinMat);
    torso.scale.set(1.12, 1, 0.68);
    torso.position.set(0, 1.24, 0.03);
    torso.rotation.x = 0.16;
    registerHit(torso, 'body');
    bodyGroup.add(torso);

    addSpike(torso, -0.15, 0.15, 0.16, 1.1, 0, 0.4, 0.24);
    addSpike(torso, 0.14, 0.08, 0.16, 1.2, 0, -0.35, 0.24);
    addSpike(torso, -0.08, -0.12, 0.15, 1.3, 0, 0.2, 0.22);
    addSpike(torso, 0.16, 0.22, -0.14, -1.1, 0, -0.3, 0.26);
    addSpike(torso, -0.16, 0.2, -0.14, -1.1, 0, 0.3, 0.26);
    addSpike(torso, 0.24, 0.12, 0, 0, 0, -1.3, 0.22);
    addSpike(torso, -0.24, 0.05, 0, 0, 0, 1.3, 0.22);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.088, 0.14, 10), skinMat);
    neck.position.set(0, 1.56, 0.07);
    bodyGroup.add(neck);

    headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 12), skinMat);
    headMesh.scale.set(0.92, 1.15, 1.0);
    headMesh.position.set(0, 1.71, 0.14);
    headMesh.rotation.x = -0.2;
    registerHit(headMesh, 'head');
    bodyGroup.add(headMesh);

    const maw = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.08, 8), mawMat);
    maw.rotation.x = Math.PI / 2;
    maw.position.set(0, -0.03, 0.135);
    headMesh.add(maw);

    for (let t = 0; t < 6; t++) {
      const ang = (t / 6) * Math.PI * 2;
      addSpike(
        headMesh,
        Math.cos(ang) * 0.052,
        -0.03 + Math.sin(ang) * 0.052,
        0.155,
        Math.PI / 2,
        0,
        0,
        0.06,
        0.012,
      );
    }

    addSpike(headMesh, 0, 0.21, 0, 0, 0, 0, 0.2);
    addSpike(headMesh, -0.13, 0.13, 0.03, 0.2, 0, 0.85, 0.19);
    addSpike(headMesh, 0.13, 0.13, 0.03, 0.2, 0, -0.85, 0.19);
    addSpike(headMesh, 0, 0.11, -0.14, -1.1, 0, 0, 0.2);
    addSpike(headMesh, -0.12, -0.04, 0.08, 0.4, 0, 1.1, 0.17);
    addSpike(headMesh, 0.12, -0.04, 0.08, 0.4, 0, -1.1, 0.17);

    const makeSpikedArm = (x: number): { arm: THREE.Group; elbow: THREE.Group } => {
      const arm = new THREE.Group();
      arm.position.set(x, 1.44, 0.05);

      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), skinMat);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.064, 0.34, 10), skinMat);
      upper.position.set(0, -0.02, 0.16);
      upper.rotation.x = Math.PI / 2 - 0.15;
      registerHit(upper, 'body');
      arm.add(shoulder, upper);

      const side = x < 0 ? -1 : 1;
      addSpike(arm, side * 0.08, 0.04, 0.16, 0.2, 0, -side * 1.1, 0.2);

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.04, 0.31);
      arm.add(elbow);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.05, 0.34, 10), skinMat);
      forearm.position.set(0, -0.02, 0.16);
      forearm.rotation.x = Math.PI / 2 - 0.08;
      registerHit(forearm, 'body');
      elbow.add(forearm);

      addSpike(elbow, side * 0.07, 0, 0.07, 0.3, 0, -side * 1.0, 0.2);
      addSpike(elbow, 0, 0.08, 0.19, -0.4, 0, 0, 0.18);

      for (let c = 0; c < 4; c++) {
        const claw = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.24, 5), clawMat);
        claw.position.set((c - 1.5) * 0.032, -0.05, 0.43);
        claw.rotation.x = Math.PI / 2 + 0.22;
        elbow.add(claw);
      }

      return { arm, elbow };
    };

    const sArmL = makeSpikedArm(-0.3);
    const sArmR = makeSpikedArm(0.3);
    armL = sArmL.arm;
    elbowL = sArmL.elbow;
    armR = sArmR.arm;
    elbowR = sArmR.elbow;
    bodyGroup.add(armL, armR);
  } else if (appearance === 'mutant') {
    // 4. REALISTIC PALE GLOWING-EYE MUTANT BRUTE (zombie2_db8ea1c7.jpeg)
    const skinMat = new THREE.MeshStandardMaterial({
      map: tex.mutantSkin,
      bumpMap: tex.fleshBump,
      bumpScale: 0.032,
      roughness: 0.68,
      metalness: 0.08,
    });
    const mawMat = new THREE.MeshStandardMaterial({ color: 0x380a10, roughness: 0.65 });
    const fangMat = new THREE.MeshStandardMaterial({ color: 0xcfc7b8, roughness: 0.45 });
    const clawMat = new THREE.MeshStandardMaterial({ color: 0x3b3d42, roughness: 0.45, metalness: 0.2 });
    const eyeGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff8c1a,
      emissive: 0xff5e00,
      emissiveIntensity: 2.8,
      roughness: 0.15,
    });
    materialsToFlash.push(skinMat);

    const makeMutantLeg = (x: number): { leg: THREE.Group; knee: THREE.Group } => {
      const leg = new THREE.Group();
      leg.position.set(x, 0.84, 0);

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.125, 0.44, 12), skinMat);
      thigh.position.y = -0.22;
      registerHit(thigh, 'body');
      leg.add(thigh);

      const knee = new THREE.Group();
      knee.position.set(0, -0.43, 0);
      leg.add(knee);

      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.088, 0.4, 12), skinMat);
      calf.position.y = -0.19;
      registerHit(calf, 'body');
      knee.add(calf);

      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.1, 0.26), skinMat);
      foot.position.set(0, -0.37, 0.05);
      foot.castShadow = true;
      knee.add(foot);

      return { leg, knee };
    };

    const mLegL = makeMutantLeg(-0.185);
    const mLegR = makeMutantLeg(0.185);
    legL = mLegL.leg;
    kneeL = mLegL.knee;
    legR = mLegR.leg;
    kneeR = mLegR.knee;
    bodyGroup.add(legL, legR);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.27, 0.6, 12), skinMat);
    torso.scale.set(1.14, 1, 0.72);
    torso.position.set(0, 1.2, 0.03);
    torso.rotation.x = 0.12;
    registerHit(torso, 'body');
    bodyGroup.add(torso);

    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), skinMat);
    belly.scale.set(1.12, 0.95, 0.86);
    belly.position.set(0, 1.04, 0.11);
    bodyGroup.add(belly);

    const chestPec = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 10), skinMat);
    chestPec.scale.set(1.2, 0.72, 0.85);
    chestPec.position.set(0, 1.36, 0.09);
    bodyGroup.add(chestPec);

    const neckHunch = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.22, 10), skinMat);
    neckHunch.position.set(0, 1.54, 0.06);
    neckHunch.rotation.x = 0.25;
    bodyGroup.add(neckHunch);

    headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.185, 14, 12), skinMat);
    headMesh.scale.set(0.95, 1.12, 1.0);
    headMesh.position.set(0, 1.71, 0.14);
    registerHit(headMesh, 'head');
    bodyGroup.add(headMesh);

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), eyeGlowMat);
    eyeL.position.set(-0.066, 0.03, 0.172);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.066;
    headMesh.add(eyeL, eyeR);

    const maw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.09), mawMat);
    maw.position.set(0, -0.07, 0.145);
    headMesh.add(maw);

    for (let f = -2; f <= 2; f++) {
      const fangTop = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.055, 4), fangMat);
      fangTop.position.set(f * 0.031, -0.04, 0.182);
      fangTop.rotation.x = Math.PI;
      const fangBot = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 4), fangMat);
      fangBot.position.set(f * 0.029, -0.1, 0.178);
      headMesh.add(fangTop, fangBot);
    }

    const makeMutantArm = (x: number): { arm: THREE.Group; elbow: THREE.Group } => {
      const arm = new THREE.Group();
      arm.position.set(x, 1.44, 0.06);

      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 10), skinMat);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.095, 0.4, 10), skinMat);
      upper.position.set(0, -0.02, 0.18);
      upper.rotation.x = Math.PI / 2 - 0.15;
      registerHit(upper, 'body');
      arm.add(shoulder, upper);

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.05, 0.33);
      arm.add(elbow);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.075, 0.4, 10), skinMat);
      forearm.position.set(0, -0.02, 0.17);
      forearm.rotation.x = Math.PI / 2 - 0.08;
      registerHit(forearm, 'body');
      elbow.add(forearm);

      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.125, 0.145), skinMat);
      hand.position.set(0, -0.05, 0.37);
      elbow.add(hand);

      for (let c = -1; c <= 1; c++) {
        const talon = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.16, 5), clawMat);
        talon.position.set(c * 0.04, -0.06, 0.47);
        talon.rotation.x = Math.PI / 2 + 0.25;
        elbow.add(talon);
      }

      return { arm, elbow };
    };

    const mArmL = makeMutantArm(-0.39);
    const mArmR = makeMutantArm(0.39);
    armL = mArmL.arm;
    elbowL = mArmL.elbow;
    armR = mArmR.arm;
    elbowR = mArmR.elbow;
    bodyGroup.add(armL, armR);
  } else if (appearance === 'boss_tyrant') {
    // 5. BOSS TYRANT IN HEAVY TRENCHCOAT (zombie_bos1_65cc1254.jpeg)
    const skinMat = new THREE.MeshStandardMaterial({
      map: tex.tyrantSkin,
      bumpMap: tex.fleshBump,
      bumpScale: 0.028,
      roughness: 0.65,
      metalness: 0.08,
    });
    const coatMat = new THREE.MeshStandardMaterial({
      map: tex.tyrantCoat,
      bumpMap: tex.leatherBump,
      bumpScale: 0.025,
      roughness: 0.42,
      metalness: 0.24,
    });
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x101216,
      roughness: 0.45,
      metalness: 0.28,
    });
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.28,
      metalness: 0.85,
    });
    const paleEyeMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      emissive: 0x94a3b8,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });
    materialsToFlash.push(skinMat, coatMat);

    const makeTyrantLeg = (x: number): { leg: THREE.Group; knee: THREE.Group } => {
      const leg = new THREE.Group();
      leg.position.set(x, 0.86, 0);

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.105, 0.42, 10), leatherMat);
      thigh.position.y = -0.21;
      registerHit(thigh, 'body');
      leg.add(thigh);

      const knee = new THREE.Group();
      knee.position.set(0, -0.42, 0);
      leg.add(knee);

      const bootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.082, 0.36, 10), leatherMat);
      bootShaft.position.y = -0.15;
      registerHit(bootShaft, 'body');
      const bootFoot = new THREE.Mesh(new THREE.BoxGeometry(0.155, 0.11, 0.28), leatherMat);
      bootFoot.position.set(0, -0.39, 0.05);
      bootFoot.castShadow = true;
      knee.add(bootShaft, bootFoot);
      return { leg, knee };
    };

    const tLegL = makeTyrantLeg(-0.165);
    const tLegR = makeTyrantLeg(0.165);
    legL = tLegL.leg;
    kneeL = tLegL.knee;
    legR = tLegR.leg;
    kneeR = tLegR.knee;
    bodyGroup.add(legL, legR);

    // Towering Broad Trenchcoat Torso + Long Coat Skirt
    const coatLower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.245, 0.31, 0.68, 14, 1, false, -Math.PI * 0.82, Math.PI * 1.64),
      coatMat,
    );
    coatLower.scale.set(1.16, 1, 0.78);
    coatLower.position.set(0, 0.66, 0);
    coatLower.rotation.y = Math.PI;
    coatLower.castShadow = true;
    bodyGroup.add(coatLower);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.295, 0.245, 0.62, 14), coatMat);
    torso.scale.set(1.18, 1, 0.74);
    torso.position.set(0, 1.29, 0.01);
    registerHit(torso, 'body');
    bodyGroup.add(torso);

    // Popped Wide Trenchcoat Collar
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.175, 0.15, 0.15, 14, 1, true, Math.PI * 0.25, Math.PI * 1.5),
      coatMat,
    );
    collar.position.set(0, 1.62, -0.01);
    collar.rotation.y = Math.PI;
    bodyGroup.add(collar);

    // Heavy Tactical Waist Belt, Shotgun Shell Loops & Side Pouches
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.258, 0.26, 0.085, 14), leatherMat);
    belt.scale.set(1.18, 1, 0.76);
    belt.position.set(0, 1.0, 0.01);
    bodyGroup.add(belt);

    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.075, 0.035), steelMat);
    buckle.position.set(0, 1.0, 0.2);
    bodyGroup.add(buckle);

    const frontPouch = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.06), leatherMat);
    frontPouch.position.set(0.12, 0.96, 0.19);
    const sidePouch = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, 0.13), leatherMat);
    sidePouch.position.set(0.28, 0.96, 0.02);
    bodyGroup.add(frontPouch, sidePouch);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.105, 0.14, 10), skinMat);
    neck.position.set(0, 1.62, 0.02);
    bodyGroup.add(neck);

    // Stern Bald Tyrant Skull with Temple Clamp
    headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.152, 14, 12), skinMat);
    headMesh.scale.set(0.95, 1.14, 1.0);
    headMesh.position.set(0, 1.77, 0.05);
    registerHit(headMesh, 'head');
    bodyGroup.add(headMesh);

    const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.085, 0.1, 10), skinMat);
    jaw.position.set(0, -0.095, 0.025);
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.032, 0.05), skinMat);
    brow.position.set(0, 0.055, 0.128);
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), paleEyeMat);
    eyeL.position.set(-0.048, 0.025, 0.138);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.048;
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.014, 0.02), leatherMat);
    mouth.position.set(0, -0.075, 0.13);
    const templeBolt = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.03, 0.04), steelMat);
    templeBolt.position.set(0.138, 0.055, 0.03);
    headMesh.add(jaw, brow, eyeL, eyeR, mouth, templeBolt);

    const makeTyrantArm = (x: number): { arm: THREE.Group; elbow: THREE.Group } => {
      const arm = new THREE.Group();
      arm.position.set(x, 1.5, 0.02);

      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 10), coatMat);
      const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.096, 0.085, 0.34, 10), coatMat);
      bicep.position.set(0, -0.04, 0.16);
      bicep.rotation.x = Math.PI / 2 - 0.25;
      registerHit(bicep, 'body');
      arm.add(shoulder, bicep);

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.07, 0.3);
      arm.add(elbow);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.34, 10), coatMat);
      forearm.position.set(0, -0.03, 0.15);
      forearm.rotation.x = Math.PI / 2 - 0.1;
      registerHit(forearm, 'body');

      const fist = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.115, 0.135), leatherMat);
      fist.position.set(0, -0.05, 0.34);
      elbow.add(forearm, fist);
      return { arm, elbow };
    };

    const tArmL = makeTyrantArm(-0.37);
    const tArmR = makeTyrantArm(0.37);
    armL = tArmL.arm;
    elbowL = tArmL.elbow;
    armR = tArmR.arm;
    elbowR = tArmR.elbow;
    bodyGroup.add(armL, armR);
  } else if (appearance === 'boss_bioweapon') {
    // 6. BOSS MUTATED GIANT ARM BIOWEAPON (zombie_bos_2_e264b743.jpeg)
    const fleshMat = new THREE.MeshStandardMaterial({
      map: tex.bioweaponFlesh,
      bumpMap: tex.fleshBump,
      bumpScale: 0.028,
      roughness: 0.68,
      metalness: 0.05,
    });
    const mutMat = new THREE.MeshStandardMaterial({
      map: tex.bioweaponMutant,
      bumpMap: tex.fleshBump,
      bumpScale: 0.042,
      roughness: 0.48,
      metalness: 0.16,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x16171b,
      bumpMap: tex.leatherBump,
      bumpScale: 0.02,
      roughness: 0.6,
      metalness: 0.2,
    });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xc8b074, roughness: 0.72 });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.85 });
    const eyeGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff5a1f,
      emissive: 0xff3b00,
      emissiveIntensity: 2.6,
      roughness: 0.15,
    });
    materialsToFlash.push(fleshMat, mutMat);

    const makeBioLeg = (x: number): { leg: THREE.Group; knee: THREE.Group } => {
      const leg = new THREE.Group();
      leg.position.set(x, 0.86, 0);

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.44, 10), pantsMat);
      thigh.position.y = -0.22;
      registerHit(thigh, 'body');
      leg.add(thigh);

      const knee = new THREE.Group();
      knee.position.set(0, -0.42, 0);
      leg.add(knee);

      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.078, 0.36, 10), pantsMat);
      shin.position.y = -0.16;
      registerHit(shin, 'body');
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.11, 0.26), pantsMat);
      boot.position.set(0, -0.39, 0.05);
      boot.castShadow = true;
      knee.add(shin, boot);
      return { leg, knee };
    };

    const bLegL = makeBioLeg(-0.16);
    const bLegR = makeBioLeg(0.16);
    legL = bLegL.leg;
    kneeL = bLegL.knee;
    legR = bLegR.leg;
    kneeR = bLegR.knee;
    bodyGroup.add(legL, legR);

    const pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.215, 0.2, 12), pantsMat);
    pelvis.scale.set(1.14, 1, 0.72);
    pelvis.position.y = 0.93;
    const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.055, 0.03), steelMat);
    beltBuckle.position.set(0, 1.0, 0.17);
    bodyGroup.add(pelvis, beltBuckle);

    // Muscular Torso (Pale scarred right half + Dark biomass spreading over left half)
    const torsoRight = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.205, 0.58, 12), fleshMat);
    torsoRight.scale.set(1.16, 1, 0.7);
    torsoRight.position.set(0, 1.27, 0.01);
    registerHit(torsoRight, 'body');
    bodyGroup.add(torsoRight);

    const mutChestMass = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 10), mutMat);
    mutChestMass.scale.set(1.15, 1.25, 0.82);
    mutChestMass.position.set(0.16, 1.38, 0.03);
    registerHit(mutChestMass, 'body');
    bodyGroup.add(mutChestMass);

    // Massive Towering Shoulder Spikes on Mutated Side (+ small spike on right trap)
    const addBioSpike = (
      parent: THREE.Object3D,
      x: number,
      y: number,
      z: number,
      rx: number,
      rz: number,
      len: number,
      rad: number,
    ) => {
      const sp = new THREE.Mesh(new THREE.ConeGeometry(rad, len, 6), mutMat);
      sp.position.set(x, y, z);
      sp.rotation.set(rx, 0, rz);
      parent.add(sp);
    };

    addBioSpike(bodyGroup, 0.22, 1.78, -0.02, -0.05, -0.22, 0.56, 0.075);
    addBioSpike(bodyGroup, 0.34, 1.68, 0.0, 0.05, -0.48, 0.44, 0.065);
    addBioSpike(bodyGroup, 0.42, 1.54, -0.03, -0.1, -0.78, 0.32, 0.055);
    addBioSpike(bodyGroup, -0.26, 1.58, -0.04, -0.15, 0.45, 0.26, 0.042);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.092, 0.13, 10), fleshMat);
    neck.position.set(0, 1.59, 0.03);
    bodyGroup.add(neck);

    // Blonde Slicked-Back Hair Head with Glowing Orange Eyes
    headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 12), fleshMat);
    headMesh.scale.set(0.94, 1.13, 1.0);
    headMesh.position.set(0, 1.74, 0.06);
    registerHit(headMesh, 'head');
    bodyGroup.add(headMesh);

    const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.098, 0.072, 0.095, 10), fleshMat);
    jaw.position.set(0, -0.09, 0.025);
    const slickHair = new THREE.Mesh(new THREE.BoxGeometry(0.195, 0.085, 0.22), hairMat);
    slickHair.position.set(0, 0.145, -0.01);
    slickHair.rotation.x = -0.16;
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), eyeGlowMat);
    eyeL.position.set(-0.046, 0.028, 0.134);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.046;
    headMesh.add(jaw, slickHair, eyeL, eyeR);

    // Right Arm (Human muscle upper, dark mutated claw forearm)
    armL = new THREE.Group();
    armL.position.set(-0.34, 1.48, 0.02);
    const rShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.092, 10, 10), fleshMat);
    const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.072, 0.32, 10), fleshMat);
    rUpper.position.set(0, -0.02, 0.15);
    rUpper.rotation.x = Math.PI / 2 - 0.18;
    registerHit(rUpper, 'body');
    armL.add(rShoulder, rUpper);

    elbowL = new THREE.Group();
    elbowL.position.set(0, -0.05, 0.29);
    armL.add(elbowL);
    const rFore = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.056, 0.34, 10), mutMat);
    rFore.position.set(0, -0.02, 0.15);
    rFore.rotation.x = Math.PI / 2 - 0.08;
    const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.11), mutMat);
    rHand.position.set(0, -0.04, 0.33);
    registerHit(rFore, 'body');
    elbowL.add(rFore, rHand);
    for (let c = -1; c <= 1; c++) {
      const talon = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.14, 5), mutMat);
      talon.position.set(c * 0.032, -0.05, 0.43);
      talon.rotation.x = Math.PI / 2 + 0.25;
      elbowL.add(talon);
    }

    // Left Arm: ENORMOUS Mutated Monster Claw Arm (armR is +X side in local rig!)
    armR = new THREE.Group();
    armR.position.set(0.38, 1.46, 0.02);
    const gShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.165, 10, 10), mutMat);
    const gUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.125, 0.44, 10), mutMat);
    gUpper.position.set(0.04, -0.04, 0.2);
    gUpper.rotation.x = Math.PI / 2 - 0.22;
    registerHit(gUpper, 'body');
    armR.add(gShoulder, gUpper);

    elbowR = new THREE.Group();
    elbowR.position.set(0.05, -0.09, 0.39);
    armR.add(elbowR);
    const gFore = new THREE.Mesh(new THREE.CylinderGeometry(0.155, 0.12, 0.5, 10), mutMat);
    gFore.position.set(0.01, -0.03, 0.23);
    gFore.rotation.x = Math.PI / 2 - 0.08;
    const gHand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.22), mutMat);
    gHand.position.set(0.01, -0.06, 0.51);
    registerHit(gFore, 'body');
    elbowR.add(gFore, gHand);
    addBioSpike(elbowR, 0.11, 0.05, 0.09, 0.2, -0.9, 0.24, 0.045);
    addBioSpike(elbowR, 0.09, 0.01, 0.29, 0.3, -0.8, 0.22, 0.04);
    for (let c = -1; c <= 1; c++) {
      const giantClaw = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.36, 5), mutMat);
      giantClaw.position.set(0.01 + c * 0.065, -0.08, 0.75);
      giantClaw.rotation.x = Math.PI / 2 + 0.28;
      elbowR.add(giantClaw);
    }

    bodyGroup.add(armL, armR);
  } else {
    // 7. BOSS TALL ARISTOCRAT LADY IN WHITE DRESS & BLACK HAT (zombiebos3_0f4a8117.jpeg)
    const skinMat = new THREE.MeshStandardMaterial({
      map: tex.ladySkin,
      roughness: 0.48,
      metalness: 0.04,
    });
    const dressMat = new THREE.MeshStandardMaterial({
      map: tex.ladyDress,
      roughness: 0.74,
      metalness: 0.05,
    });
    const hatGloveMat = new THREE.MeshStandardMaterial({
      color: 0x111216,
      roughness: 0.56,
      metalness: 0.18,
    });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x161417, roughness: 0.72 });
    const lipMat = new THREE.MeshStandardMaterial({ color: 0x7f101e, roughness: 0.38 });
    const silverMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.22,
      metalness: 0.85,
    });
    materialsToFlash.push(skinMat, dressMat);

    const makeLadyLeg = (x: number): { leg: THREE.Group; knee: THREE.Group } => {
      const leg = new THREE.Group();
      leg.position.set(x, 0.84, 0);
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.06, 0.36, 10), dressMat);
      thigh.position.y = -0.18;
      leg.add(thigh);

      const knee = new THREE.Group();
      knee.position.set(0, -0.36, 0);
      leg.add(knee);

      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.045, 0.38, 10), dressMat);
      calf.position.y = -0.19;
      const heel = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.21), hatGloveMat);
      heel.position.set(0, -0.42, 0.04);
      knee.add(calf, heel);
      return { leg, knee };
    };

    const lLegL = makeLadyLeg(-0.11);
    const lLegR = makeLadyLeg(0.11);
    legL = lLegL.leg;
    kneeL = lLegL.knee;
    legR = lLegR.leg;
    kneeR = lLegR.knee;
    bodyGroup.add(legL, legR);

    // Sweeping Floor-Length Vintage Pleated Dress Skirt + Fitted Bodice
    const gownSkirt = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.32, 0.96, 16), dressMat);
    gownSkirt.scale.set(1.08, 1, 0.85);
    gownSkirt.position.set(0, 0.5, 0);
    gownSkirt.castShadow = true;
    registerHit(gownSkirt, 'body');
    bodyGroup.add(gownSkirt);

    const bodice = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.145, 0.48, 14), dressMat);
    bodice.scale.set(1.12, 1, 0.68);
    bodice.position.set(0, 1.24, 0);
    registerHit(bodice, 'body');
    bodyGroup.add(bodice);

    // Exposed Pale Decolletage Chest + Pearl Necklace + Black Rose Brooch
    const chestSkin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.14, 12), skinMat);
    chestSkin.scale.set(1.15, 1, 0.68);
    chestSkin.position.set(0, 1.49, 0.01);
    const necklace = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.013, 6, 14), silverMat);
    necklace.rotation.x = Math.PI / 2 + 0.22;
    necklace.position.set(0, 1.54, 0.04);
    const brooch = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), hatGloveMat);
    brooch.scale.set(1, 1, 0.55);
    brooch.position.set(0.11, 1.44, 0.125);
    bodyGroup.add(chestSkin, necklace, brooch);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.058, 0.14, 10), skinMat);
    neck.position.set(0, 1.59, 0.01);
    bodyGroup.add(neck);

    // Alabaster Pale Aristocrat Head + Dark Crimson Lips + Wavy Bob + Wide Tilted Black Hat
    headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.122, 14, 12), skinMat);
    headMesh.scale.set(0.9, 1.15, 0.98);
    headMesh.position.set(0, 1.74, 0.02);
    registerHit(headMesh, 'head');
    bodyGroup.add(headMesh);

    const jaw = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.052, 0.085, 10), skinMat);
    jaw.position.set(0, -0.075, 0.02);
    const eyeShadowL = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), hatGloveMat);
    eyeShadowL.position.set(-0.04, 0.02, 0.112);
    const eyeShadowR = eyeShadowL.clone();
    eyeShadowR.position.x = 0.04;
    const lipstick = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.014, 0.016), lipMat);
    lipstick.position.set(0, -0.06, 0.106);
    const wavyHair = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.15, 0.14), hairMat);
    wavyHair.position.set(0, 0.0, -0.06);
    headMesh.add(jaw, eyeShadowL, eyeShadowR, lipstick, wavyHair);

    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.115, 0);
    hatGroup.rotation.set(-0.08, 0, -0.22);
    const hatCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.128, 0.085, 16), hatGloveMat);
    hatCrown.position.y = 0.04;
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.36, 0.018, 20), hatGloveMat);
    hatGroup.add(hatCrown, hatBrim);
    headMesh.add(hatGroup);

    const makeLadyArm = (x: number, holdWand: boolean): { arm: THREE.Group; elbow: THREE.Group } => {
      const arm = new THREE.Group();
      arm.position.set(x, 1.46, 0.01);

      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.068, 8, 8), dressMat);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.048, 0.3, 10), dressMat);
      upper.position.set(0, -0.02, 0.14);
      upper.rotation.x = Math.PI / 2 - 0.2;
      registerHit(upper, 'body');
      arm.add(shoulder, upper);

      const elbow = new THREE.Group();
      elbow.position.set(0, -0.04, 0.27);
      arm.add(elbow);

      const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.036, 0.32, 10), hatGloveMat);
      forearm.position.set(0, -0.02, 0.15);
      forearm.rotation.x = Math.PI / 2 - 0.08;
      registerHit(forearm, 'body');

      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.075, 0.095), hatGloveMat);
      hand.position.set(0, -0.04, 0.32);
      elbow.add(forearm, hand);

      if (holdWand) {
        const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.34, 6), hatGloveMat);
        holder.rotation.z = -0.35;
        holder.position.set(0.06, -0.02, 0.38);
        elbow.add(holder);
      }

      return { arm, elbow };
    };

    const lArmL = makeLadyArm(-0.245, false);
    const lArmR = makeLadyArm(0.245, true);
    armL = lArmL.arm;
    elbowL = lArmL.elbow;
    armR = lArmR.arm;
    elbowR = lArmR.elbow;
    bodyGroup.add(armL, armR);
  }

  const isBoss = variant === 'boss';
  const hpBarW = isBoss ? 1.15 : 0.75;
  const hpBarBg = new THREE.Mesh(
    new THREE.PlaneGeometry(hpBarW, isBoss ? 0.115 : 0.09),
    new THREE.MeshBasicMaterial({
      color: isBoss ? 0x451a03 : 0x090d14,
      side: THREE.DoubleSide,
    }),
  );
  hpBarBg.position.set(0, 2.24 * scale, 0);
  hpBarBg.visible = isBoss;
  root.add(hpBarBg);

  const hpBarFill = new THREE.Mesh(
    new THREE.PlaneGeometry(hpBarW - 0.04, isBoss ? 0.075 : 0.055),
    new THREE.MeshBasicMaterial({
      color: isBoss ? 0xdc2626 : 0xef4444,
      side: THREE.DoubleSide,
    }),
  );
  hpBarFill.position.z = 0.01;
  hpBarBg.add(hpBarFill);

  return {
    root,
    bodyGroup,
    headMesh,
    baseHeadRot: {
      x: headMesh.rotation.x,
      y: headMesh.rotation.y,
      z: headMesh.rotation.z,
    },
    armL,
    armR,
    elbowL,
    elbowR,
    legL,
    legR,
    kneeL,
    kneeR,
    hpBarBg,
    hpBarFill,
    hitMeshes,
    materialsToFlash,
  };
}

export function createPickupModel(type: PickupType): THREE.Group {
  const group = new THREE.Group();

  if (type === 'medkit') {
    const caseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.42, 0.42),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.35, metalness: 0.25 }),
    );
    caseMesh.position.y = 0.45;
    caseMesh.castShadow = true;
    group.add(caseMesh);

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.08, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.6 }),
    );
    handle.position.y = 0.7;
    group.add(handle);

    const crossMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.5,
      roughness: 0.25,
    });
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.44), crossMat);
    crossH.position.y = 0.45;
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.44), crossMat);
    crossV.position.y = 0.45;
    group.add(crossH, crossV);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.52, 24),
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    group.add(ring);
  } else if (type === 'ammo') {
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(0.64, 0.38, 0.44),
      new THREE.MeshStandardMaterial({ color: 0x364332, roughness: 0.55, metalness: 0.4 }),
    );
    crate.position.y = 0.42;
    crate.castShadow = true;
    group.add(crate);

    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.08, 0.48),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.65 }),
    );
    lid.position.y = 0.62;
    group.add(lid);

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, 0.09, 0.46),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 1.3,
        roughness: 0.3,
      }),
    );
    stripe.position.y = 0.43;
    group.add(stripe);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.52, 24),
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    group.add(ring);
  } else {
    // Dropped 3D Weapon Model with glowing tactical ring!
    const wId: WeaponId =
      type === 'weapon_smg' ? 'smg' : type === 'weapon_shotgun' ? 'shotgun' : 'rifle';
    const glowHex = wId === 'smg' ? 0x38bdf8 : wId === 'shotgun' ? 0xf97316 : 0x10b981;

    const glowMat = new THREE.MeshStandardMaterial({
      color: glowHex,
      emissive: glowHex,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });
    const gunMetal = new THREE.MeshStandardMaterial({
      color: 0x1e242c,
      roughness: 0.25,
      metalness: 0.88,
    });
    const gunHighlight = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.35,
      metalness: 0.75,
    });
    const gripMat = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.85 });

    const gunModel = buildCompositeGun(wId, glowMat, gunMetal, gunHighlight, gripMat);
    gunModel.scale.setScalar(1.65);
    gunModel.position.set(0, 0.55, -0.2);
    gunModel.rotation.y = Math.PI / 4;
    group.add(gunModel);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.64, 24),
      new THREE.MeshBasicMaterial({
        color: glowHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.78,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    group.add(ring);
  }

  return group;
}
