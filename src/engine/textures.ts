import * as THREE from 'three';

export interface CityTextures {
  asphalt: THREE.CanvasTexture;
  asphaltBump: THREE.CanvasTexture;
  asphaltRoughness: THREE.CanvasTexture;
  sidewalk: THREE.CanvasTexture;
  buildingFacade: THREE.CanvasTexture;
  facadeBump: THREE.CanvasTexture;
  buildingDamaged: THREE.CanvasTexture;
  carMetal: THREE.CanvasTexture;
  bark: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  dustSprite: THREE.CanvasTexture;
  dispose: () => void;
}

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function configureTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  repeatX = 1,
  repeatY = 1,
  isColorData = true,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  if (isColorData) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export function createCityTextures(renderer: THREE.WebGLRenderer): CityTextures {
  const maxAniso = Math.min(16, renderer.capabilities.getMaxAnisotropy() || 1);

  // 1. HD 1024x1024 Cracked Wet Asphalt + Micro-Aggregate Bump + Specular Puddle Roughness
  const [asphaltCanvas, aCtx] = makeCanvas(1024, 1024);
  const [asphaltBumpCanvas, abCtx] = makeCanvas(1024, 1024);
  const [asphaltRoughCanvas, arCtx] = makeCanvas(1024, 1024);
  aCtx.fillStyle = '#1b1f27';
  aCtx.fillRect(0, 0, 1024, 1024);
  abCtx.fillStyle = '#808080';
  abCtx.fillRect(0, 0, 1024, 1024);
  arCtx.fillStyle = '#e6e6e6';
  arCtx.fillRect(0, 0, 1024, 1024);

  // Fine mineral asphalt aggregate noise
  for (let i = 0; i < 24000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const sz = i % 5 === 0 ? 3 : 2;
    const v = 18 + Math.floor(Math.random() * 32);
    aCtx.fillStyle = `rgb(${v},${v + 2},${v + 6})`;
    aCtx.fillRect(x, y, sz, sz);

    const bv = 88 + Math.floor(Math.random() * 84);
    abCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    abCtx.fillRect(x, y, sz, sz);
  }

  // Subtle asphalt tar repair seams
  aCtx.strokeStyle = 'rgba(10, 12, 16, 0.55)';
  aCtx.lineWidth = 4;
  for (let t = 0; t < 6; t++) {
    const y = 120 + t * 170 + (Math.random() - 0.5) * 35;
    aCtx.beginPath();
    aCtx.moveTo(0, y);
    aCtx.lineTo(1024, y + (Math.random() - 0.5) * 18);
    aCtx.stroke();
  }

  // Glossy rain puddles / damp oil spots (low roughness for crisp HDR light reflections)
  for (let p = 0; p < 22; p++) {
    const px = Math.random() * 1024;
    const py = Math.random() * 1024;
    const pr = 36 + Math.random() * 92;
    const grad = aCtx.createRadialGradient(px, py, 4, px, py, pr);
    grad.addColorStop(0, 'rgba(7, 11, 17, 0.58)');
    grad.addColorStop(0.7, 'rgba(11, 15, 22, 0.3)');
    grad.addColorStop(1, 'rgba(11, 15, 22, 0)');
    aCtx.fillStyle = grad;
    aCtx.beginPath();
    aCtx.arc(px, py, pr, 0, Math.PI * 2);
    aCtx.fill();

    abCtx.fillStyle = 'rgba(128, 128, 128, 0.55)';
    abCtx.beginPath();
    abCtx.arc(px, py, pr * 0.85, 0, Math.PI * 2);
    abCtx.fill();

    const rGrad = arCtx.createRadialGradient(px, py, 4, px, py, pr);
    rGrad.addColorStop(0, 'rgba(22, 22, 22, 0.98)');
    rGrad.addColorStop(0.62, 'rgba(56, 56, 56, 0.85)');
    rGrad.addColorStop(1, 'rgba(230, 230, 230, 0)');
    arCtx.fillStyle = rGrad;
    arCtx.beginPath();
    arCtx.arc(px, py, pr, 0, Math.PI * 2);
    arCtx.fill();
  }

  // Branching realistic fractures
  aCtx.strokeStyle = 'rgba(5, 7, 11, 0.88)';
  aCtx.lineWidth = 2.2;
  abCtx.strokeStyle = 'rgb(16, 16, 16)';
  abCtx.lineWidth = 3;
  for (let c = 0; c < 22; c++) {
    let cx = Math.random() * 1024;
    let cy = Math.random() * 1024;
    aCtx.beginPath();
    abCtx.beginPath();
    aCtx.moveTo(cx, cy);
    abCtx.moveTo(cx, cy);
    for (let s = 0; s < 10; s++) {
      cx += (Math.random() - 0.5) * 76;
      cy += (Math.random() - 0.5) * 76;
      aCtx.lineTo(cx, cy);
      abCtx.lineTo(cx, cy);
    }
    aCtx.stroke();
    abCtx.stroke();
  }
  const asphalt = configureTexture(asphaltCanvas, maxAniso, 18, 18, true);
  const asphaltBump = configureTexture(asphaltBumpCanvas, maxAniso, 18, 18, false);
  const asphaltRoughness = configureTexture(asphaltRoughCanvas, maxAniso, 18, 18, false);

  // 2. HD 512x512 Concrete Sidewalk Pavers with Beveled Grout & Weathering
  const [sideCanvas, sCtx] = makeCanvas(512, 512);
  sCtx.fillStyle = '#313742';
  sCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6500; i++) {
    const v = 38 + Math.floor(Math.random() * 28);
    sCtx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
    sCtx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }
  for (let g = 0; g <= 512; g += 128) {
    sCtx.strokeStyle = '#181c22';
    sCtx.lineWidth = 5;
    sCtx.beginPath();
    sCtx.moveTo(g, 0);
    sCtx.lineTo(g, 512);
    sCtx.stroke();
    sCtx.beginPath();
    sCtx.moveTo(0, g);
    sCtx.lineTo(512, g);
    sCtx.stroke();

    sCtx.strokeStyle = 'rgba(255,255,255,0.08)';
    sCtx.lineWidth = 2;
    sCtx.beginPath();
    sCtx.moveTo(g + 3, 0);
    sCtx.lineTo(g + 3, 512);
    sCtx.stroke();
    sCtx.beginPath();
    sCtx.moveTo(0, g + 3);
    sCtx.lineTo(512, g + 3);
    sCtx.stroke();
  }
  const sidewalk = configureTexture(sideCanvas, maxAniso, 4, 4, true);

  // 3. HD 1024x1024 Urban Building Facade + Recessed Architectural Bump Map
  const [bCanvas, bCtx] = makeCanvas(1024, 1024);
  const [fbCanvas, fbCtx] = makeCanvas(1024, 1024);
  bCtx.fillStyle = '#282e38';
  bCtx.fillRect(0, 0, 1024, 1024);
  fbCtx.fillStyle = '#bababa';
  fbCtx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 12000; i++) {
    const v = 30 + Math.floor(Math.random() * 28);
    bCtx.fillStyle = `rgb(${v},${v + 3},${v + 7})`;
    bCtx.fillRect(Math.random() * 1024, Math.random() * 1024, 3, 3);
  }

  // Subtle vertical rain & urban weathering streaks
  for (let s = 0; s < 36; s++) {
    const gx = Math.random() * 1024;
    const grad = bCtx.createLinearGradient(gx, 0, gx, 1024);
    grad.addColorStop(0, 'rgba(8, 11, 16, 0.52)');
    grad.addColorStop(1, 'rgba(8, 11, 16, 0.0)');
    bCtx.fillStyle = grad;
    bCtx.fillRect(gx, 0, 12 + Math.random() * 22, 1024);
  }

  // Floor cornice ledges & concrete expansion seams
  const cols = 4;
  const rows = 6;
  const cellW = 1024 / cols;
  const cellH = 1024 / rows;
  for (let r = 0; r <= rows; r++) {
    const y = r * cellH;
    bCtx.fillStyle = '#1b2029';
    bCtx.fillRect(0, y - 5, 1024, 10);
    bCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    bCtx.fillRect(0, y + 5, 1024, 3);
    fbCtx.fillStyle = '#efefef';
    fbCtx.fillRect(0, y - 5, 1024, 10);
  }

  // Detailed HD Windows with Sills, Glass Reflections & Interior Blinds
  const padX = 42;
  const padY = 30;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = c * cellW + padX;
      const wy = r * cellH + padY;
      const ww = cellW - padX * 2;
      const wh = cellH - padY * 2;

      // Outer window frame & bottom sill
      bCtx.fillStyle = '#131820';
      bCtx.fillRect(wx - 8, wy - 8, ww + 16, wh + 16);
      bCtx.fillStyle = '#3c4454';
      bCtx.fillRect(wx - 10, wy + wh + 4, ww + 20, 8);
      fbCtx.fillStyle = '#e4e4e4';
      fbCtx.fillRect(wx - 8, wy - 8, ww + 16, wh + 16);

      // Interior room illumination or dark reflective glass
      const roll = Math.random();
      const glassGrad = bCtx.createLinearGradient(wx, wy, wx + ww, wy + wh);
      if (roll < 0.16) {
        glassGrad.addColorStop(0, '#9a6b31');
        glassGrad.addColorStop(1, '#4c3216');
      } else if (roll < 0.25) {
        glassGrad.addColorStop(0, '#27596f');
        glassGrad.addColorStop(1, '#102938');
      } else {
        glassGrad.addColorStop(0, '#16202e');
        glassGrad.addColorStop(0.45, '#0d121a');
        glassGrad.addColorStop(1, '#080b11');
      }
      bCtx.fillStyle = glassGrad;
      bCtx.fillRect(wx, wy, ww, wh);
      fbCtx.fillStyle = '#303030';
      fbCtx.fillRect(wx, wy, ww, wh);

      // Diagonal glass specular reflection streak
      bCtx.fillStyle = 'rgba(200, 225, 255, 0.08)';
      bCtx.beginPath();
      bCtx.moveTo(wx + 8, wy);
      bCtx.lineTo(wx + 34, wy);
      bCtx.lineTo(wx + 10, wy + wh);
      bCtx.lineTo(wx, wy + wh);
      bCtx.closePath();
      bCtx.fill();

      // Horizontal blinds hint on upper third
      if (roll < 0.45) {
        bCtx.fillStyle = 'rgba(15, 20, 28, 0.35)';
        for (let bl = 0; bl < 4; bl++) {
          bCtx.fillRect(wx, wy + 6 + bl * 9, ww, 4);
        }
      }

      // Vertical & horizontal mullions
      bCtx.fillStyle = '#1d2430';
      bCtx.fillRect(wx + ww * 0.5 - 3, wy, 6, wh);
      bCtx.fillRect(wx, wy + wh * 0.42, ww, 4);
      fbCtx.fillStyle = '#a8a8a8';
      fbCtx.fillRect(wx + ww * 0.5 - 3, wy, 6, wh);
      fbCtx.fillRect(wx, wy + wh * 0.42, ww, 4);
    }
  }
  const buildingFacade = configureTexture(bCanvas, maxAniso, 1, 2, true);
  const facadeBump = configureTexture(fbCanvas, maxAniso, 1, 2, false);

  // 4. HD 512x512 Damaged Concrete Texture
  const [dCanvas, dCtx] = makeCanvas(512, 512);
  dCtx.fillStyle = '#363c47';
  dCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8000; i++) {
    const v = 36 + Math.floor(Math.random() * 38);
    dCtx.fillStyle = `rgb(${v},${v + 1},${v + 4})`;
    dCtx.fillRect(Math.random() * 512, Math.random() * 512, 3, 2);
  }
  dCtx.strokeStyle = 'rgba(12,15,20,0.85)';
  dCtx.lineWidth = 2.4;
  for (let i = 0; i < 20; i++) {
    dCtx.beginPath();
    let sx = Math.random() * 512;
    let sy = Math.random() * 512;
    dCtx.moveTo(sx, sy);
    for (let k = 0; k < 4; k++) {
      sx += (Math.random() - 0.5) * 65;
      sy += (Math.random() - 0.5) * 65;
      dCtx.lineTo(sx, sy);
    }
    dCtx.stroke();
  }
  const buildingDamaged = configureTexture(dCanvas, maxAniso, 1, 1, true);

  // 5. HD 512x512 Brushed / Weathered Car Metal Paint
  const [cCanvas, cCtx] = makeCanvas(512, 512);
  cCtx.fillStyle = '#4e5d73';
  cCtx.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 2) {
    const alpha = 0.02 + Math.random() * 0.04;
    cCtx.fillStyle = y % 4 === 0 ? `rgba(255,255,255,${alpha})` : `rgba(15,23,42,${alpha})`;
    cCtx.fillRect(0, y, 512, 1);
  }
  for (let i = 0; i < 90; i++) {
    cCtx.fillStyle = i % 3 === 0 ? 'rgba(15, 23, 42, 0.22)' : 'rgba(115, 62, 34, 0.24)';
    cCtx.beginPath();
    cCtx.arc(Math.random() * 512, Math.random() * 512, 6 + Math.random() * 22, 0, Math.PI * 2);
    cCtx.fill();
  }
  const carMetal = configureTexture(cCanvas, maxAniso, 1, 1, true);

  // 6. HD 256x512 Tree Bark
  const [tCanvas, tCtx] = makeCanvas(256, 512);
  tCtx.fillStyle = '#2d241e';
  tCtx.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 540; i++) {
    tCtx.fillStyle = i % 3 === 0 ? '#191410' : i % 3 === 1 ? '#3d3128' : '#241c17';
    tCtx.fillRect(Math.random() * 256, Math.random() * 512, 3 + Math.random() * 3, 24 + Math.random() * 44);
  }
  const bark = configureTexture(tCanvas, maxAniso, 1, 2, true);

  // 7. HD 256x256 Soft Radial Contact Shadow
  const [shCanvas, shCtx] = makeCanvas(256, 256);
  const rad = shCtx.createRadialGradient(128, 128, 16, 128, 128, 120);
  rad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
  rad.addColorStop(0.55, 'rgba(0, 0, 0, 0.34)');
  rad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');
  shCtx.fillStyle = rad;
  shCtx.fillRect(0, 0, 256, 256);
  const contactShadow = new THREE.CanvasTexture(shCanvas);
  contactShadow.colorSpace = THREE.SRGBColorSpace;

  // 8. Soft Ambient Dust / Ash Sprite
  const [dustCanvas, dustCtx] = makeCanvas(64, 64);
  const dRad = dustCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
  dRad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
  dRad.addColorStop(0.42, 'rgba(220, 232, 248, 0.45)');
  dRad.addColorStop(1, 'rgba(220, 232, 248, 0)');
  dustCtx.fillStyle = dRad;
  dustCtx.fillRect(0, 0, 64, 64);
  const dustSprite = new THREE.CanvasTexture(dustCanvas);
  dustSprite.colorSpace = THREE.SRGBColorSpace;

  return {
    asphalt,
    asphaltBump,
    asphaltRoughness,
    sidewalk,
    buildingFacade,
    facadeBump,
    buildingDamaged,
    carMetal,
    bark,
    contactShadow,
    dustSprite,
    dispose: () => {
      asphalt.dispose();
      asphaltBump.dispose();
      asphaltRoughness.dispose();
      sidewalk.dispose();
      buildingFacade.dispose();
      facadeBump.dispose();
      buildingDamaged.dispose();
      carMetal.dispose();
      bark.dispose();
      contactShadow.dispose();
      dustSprite.dispose();
    },
  };
}
