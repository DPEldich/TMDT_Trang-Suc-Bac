export const HERO_BACKDROP_PHONE_BREAKPOINT_PX = 768;
export const HERO_BACKDROP_TIME_SCALE = 1.7;

const PHONE_MAX_DPR = 1;
const PHONE_BUFFER_SCALE = 0.78;
const PHONE_MAX_PIXELS = 360_000;
const PHONE_MIN_FRAME_INTERVAL_MS = 30;

const DESKTOP_MAX_DPR = 1.25;
const DESKTOP_BUFFER_SCALE = 1;
const DESKTOP_MAX_PIXELS = 1_150_000;
const DESKTOP_MIN_FRAME_INTERVAL_MS = 14;

const MAX_DELTA_SEC = 0.05;
const TIME_WRAP_SECONDS = 43200;

export type HeroBackdropRendererStatus = 'loading' | 'ready' | 'fallback';

export type HeroBackdropDataState =
  | 'reduced-motion'
  | 'fallback'
  | 'loading'
  | 'paused-auto'
  | 'active';

export interface HeroBackdropBufferInput {
  readonly cssWidth: number;
  readonly cssHeight: number;
  readonly devicePixelRatio: number;
}

export interface HeroBackdropBufferSpec {
  readonly width: number;
  readonly height: number;
  readonly cssWidth: number;
  readonly cssHeight: number;
  readonly isPhoneTier: boolean;
  readonly minFrameIntervalMs: number;
}

export interface HeroBackdropPlaybackInput {
  readonly prefersReducedMotion: boolean;
  readonly rendererStatus: HeroBackdropRendererStatus;
  readonly isInView: boolean;
  readonly isDocumentVisible: boolean;
}

export interface HeroBackdropPlaybackState {
  readonly canvasVisible: boolean;
  readonly shouldAnimate: boolean;
  readonly dataState: HeroBackdropDataState;
}

export function computeBackdropBufferSize({
  cssWidth,
  cssHeight,
  devicePixelRatio,
}: HeroBackdropBufferInput): HeroBackdropBufferSpec {
  const safeCssWidth = Number.isFinite(cssWidth) && cssWidth > 0 ? cssWidth : 0;
  const safeCssHeight = Number.isFinite(cssHeight) && cssHeight > 0 ? cssHeight : 0;
  const safeDpr =
    Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;

  const isPhoneTier = safeCssWidth > 0 && safeCssWidth < HERO_BACKDROP_PHONE_BREAKPOINT_PX;
  const maxDpr = isPhoneTier ? PHONE_MAX_DPR : DESKTOP_MAX_DPR;
  const bufferScale = isPhoneTier ? PHONE_BUFFER_SCALE : DESKTOP_BUFFER_SCALE;
  const maxPixels = isPhoneTier ? PHONE_MAX_PIXELS : DESKTOP_MAX_PIXELS;
  const minFrameIntervalMs = isPhoneTier
    ? PHONE_MIN_FRAME_INTERVAL_MS
    : DESKTOP_MIN_FRAME_INTERVAL_MS;

  if (safeCssWidth === 0 || safeCssHeight === 0) {
    return {
      width: 0,
      height: 0,
      cssWidth: 0,
      cssHeight: 0,
      isPhoneTier,
      minFrameIntervalMs,
    };
  }

  const effectiveScale = Math.min(safeDpr, maxDpr) * bufferScale;
  let width = Math.max(1, Math.round(safeCssWidth * effectiveScale));
  let height = Math.max(1, Math.round(safeCssHeight * effectiveScale));

  const pixelCount = width * height;
  if (pixelCount > maxPixels) {
    const downscale = Math.sqrt(maxPixels / pixelCount);
    width = Math.max(1, Math.round(width * downscale));
    height = Math.max(1, Math.round(height * downscale));
  }

  return {
    width,
    height,
    cssWidth: safeCssWidth,
    cssHeight: safeCssHeight,
    isPhoneTier,
    minFrameIntervalMs,
  };
}

export function resolveBackdropPlaybackState({
  prefersReducedMotion,
  rendererStatus,
  isInView,
  isDocumentVisible,
}: HeroBackdropPlaybackInput): HeroBackdropPlaybackState {
  if (prefersReducedMotion) {
    return {
      canvasVisible: false,
      shouldAnimate: false,
      dataState: 'reduced-motion',
    };
  }

  if (rendererStatus === 'fallback') {
    return {
      canvasVisible: false,
      shouldAnimate: false,
      dataState: 'fallback',
    };
  }

  if (rendererStatus !== 'ready') {
    return {
      canvasVisible: false,
      shouldAnimate: false,
      dataState: 'loading',
    };
  }

  if (!isInView || !isDocumentVisible) {
    return {
      canvasVisible: true,
      shouldAnimate: false,
      dataState: 'paused-auto',
    };
  }

  return {
    canvasVisible: true,
    shouldAnimate: true,
    dataState: 'active',
  };
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uViewport;
uniform vec2 uTextureSize;
uniform float uTime;

varying vec2 vUv;

const mat2 ROT_A = mat2(0.80, -0.60, 0.60, 0.80);
const mat2 ROT_B = mat2(0.64, 0.77, -0.77, 0.64);

float hash21(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm2(vec2 p) {
  float v = 0.0;
  v += 0.62 * (valueNoise(p) - 0.5);
  p = ROT_A * p * 2.04 + vec2(3.7, 1.9);
  v += 0.38 * (valueNoise(p) - 0.5);
  return v;
}

vec2 coverUv(vec2 uv, vec2 viewport, vec2 texSize) {
  float viewAspect = viewport.x / max(viewport.y, 1.0);
  float texAspect = texSize.x / max(texSize.y, 1.0);
  vec2 scale = vec2(1.0);
  if (viewAspect > texAspect) {
    scale.y = texAspect / viewAspect;
  } else {
    scale.x = viewAspect / texAspect;
  }
  return (uv - 0.5) * scale * 0.93 + 0.5;
}

void main() {
  float viewAspect = uViewport.x / max(uViewport.y, 1.0);
  float texAspect = uTextureSize.x / max(uTextureSize.y, 1.0);
  vec2 p = (vUv - 0.5) * vec2(viewAspect, 1.0);
  float t = uTime;

  // 1. Slow in-place layered fluid current (zero-mean domain warp)
  vec2 flowCoord1 = p * 1.9 + vec2(t * 0.14, -t * 0.10);
  vec2 flowCoord2 = ROT_B * p * 2.7 + vec2(-t * 0.11, t * 0.13);

  float n1 = fbm2(flowCoord1);
  float n2 = fbm2(flowCoord2 + vec2(n1 * 0.95, -n1 * 0.75));
  float n3 = fbm2(p * 3.7 + vec2(n2 * 1.2 - t * 0.16, n1 * 1.1 + t * 0.12));

  vec2 swell = vec2(
    n1 * 0.65 + n2 * 0.55 + sin(p.y * 3.2 - t * 0.44 + n1 * 2.4) * 0.20,
    n2 * 0.60 - n1 * 0.50 + cos(p.x * 2.8 + t * 0.38 + n2 * 2.2) * 0.20
  );

  // 2. Flowing fine diagonal wave bands aligned with Background.png silk grain
  vec2 diagDir = normalize(vec2(0.56, -0.83));
  vec2 crossDir = vec2(diagDir.y, -diagDir.x);

  float along = dot(p, diagDir);
  float across = dot(p, crossDir);

  float bandPhase1 = along * 11.2 + across * 2.1 + n1 * 4.2 + n2 * 2.6 - t * 0.92;
  float bandPhase2 = along * 18.6 - across * 3.4 + n2 * 4.6 - n3 * 2.8 + t * 0.68;
  float bandPhase3 = along * 6.2 + n3 * 3.2 - t * 0.48;

  float wave1 = sin(bandPhase1);
  float wave2 = sin(bandPhase2);
  float wave3 = sin(bandPhase3);

  vec2 fineRipple = diagDir * (wave1 * 0.0072 + wave2 * 0.0038)
                  + crossDir * (wave3 * 0.0054);

  // 3. Dual-layer textured deformation of Background.png with stable cover sampling
  vec2 baseCover = coverUv(vUv, uViewport, uTextureSize);
  vec2 aspectGain = viewAspect < texAspect
    ? vec2(0.54, 1.0)
    : vec2(1.0, 0.84);

  vec2 dispPrimary = (swell * 0.036 + fineRipple) * aspectGain;
  vec2 dispVeil = (vec2(-swell.y, swell.x) * 0.026 - fineRipple * 1.35) * aspectGain;

  vec2 uvLayer1 = clamp(baseCover + dispPrimary, vec2(0.002), vec2(0.998));
  vec2 uvLayer2 = clamp(baseCover + dispVeil, vec2(0.002), vec2(0.998));

  vec3 tex1 = texture2D(uTexture, uvLayer1).rgb;
  vec3 tex2 = texture2D(uTexture, uvLayer2).rgb;

  float veilMix = 0.30 + 0.14 * (0.5 + 0.5 * wave3);
  vec3 blendedTex = mix(tex1, tex2, veilMix);

  // 4. Preserve blended source RGB (blue, cyan, and lavender fidelity)
  vec3 baseColor = blendedTex;
  vec3 color = baseColor;

  // 5. Fine moving wave bands & hue-friendly lighting relative to source RGB
  float crest1 = pow(max(0.0, 0.5 + 0.5 * wave1), 2.2);
  float crest2 = pow(max(0.0, 0.5 + 0.5 * wave2), 3.0);
  float ribbonLine = pow(
    max(0.0, 0.5 + 0.5 * sin(along * 14.8 + across * 2.4 + n1 * 4.6 - t * 0.96)),
    4.2
  );
  float trough = pow(max(0.0, 0.5 - 0.5 * wave1), 1.75) * (0.55 + 0.45 * (0.5 + 0.5 * wave3));
  float fineTrough = pow(max(0.0, 0.5 - 0.5 * wave2), 2.4);

  float causticWave = sin(along * 4.1 + across * 1.7 + n1 * 3.6 - t * 0.54);
  float causticRibbon = pow(max(0.0, 0.5 + 0.5 * causticWave), 3.2);

  // Keep well-lit center lower-contrast for dark text; fuller wave depth around the framing
  vec2 centerDelta = (vUv - vec2(0.5, 0.48)) * vec2(1.18, 1.46);
  float centerMask = 1.0 - smoothstep(0.08, 0.64, length(centerDelta));
  float peripheryDepth = mix(1.0, 0.24, centerMask);

  // Modest hue-preserving trough shadows derived from source RGB
  vec3 shadowTarget = mix(baseColor * 0.82, baseColor * baseColor, 0.45);
  float shadowWeight = clamp(
    (trough * 0.28 + fineTrough * 0.12) * peripheryDepth,
    0.0,
    0.32
  );
  color = mix(color, shadowTarget, shadowWeight);

  // Modest hue-friendly luminous crests & silk ribbon highlights
  vec3 highlightTarget = mix(sqrt(max(baseColor, vec3(0.0))), vec3(1.0), 0.18);
  float specular =
    (crest1 * 0.11 + crest2 * 0.09 + ribbonLine * 0.17 + causticRibbon * 0.14) *
    mix(1.0, 0.38, centerMask);
  color = mix(color, highlightTarget, clamp(specular, 0.0, 0.32));

  float texLumaDiff = dot(tex1 - tex2, vec3(0.333));
  float microSheen = smoothstep(0.005, 0.050, abs(texLumaDiff)) * mix(0.14, 0.04, centerMask);
  vec3 sheenTarget = mix(highlightTarget, vec3(1.0), 0.22);
  color = mix(color, sheenTarget, microSheen);

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

export interface HeroBackdropRendererOptions {
  readonly canvas: HTMLCanvasElement;
  readonly imageSrc: string;
  readonly fallbackWidth: number;
  readonly fallbackHeight: number;
  readonly onStatusChange: (status: HeroBackdropRendererStatus) => void;
}

export interface HeroBackdropRendererHandle {
  readonly resize: (cssWidth: number, cssHeight: number, devicePixelRatio: number) => void;
  readonly setAnimating: (shouldAnimate: boolean) => void;
  readonly dispose: () => void;
}

type WebGLContext = WebGLRenderingContext | WebGL2RenderingContext;

interface GlResources {
  readonly program: WebGLProgram;
  readonly vertexShader: WebGLShader;
  readonly fragmentShader: WebGLShader;
  readonly vertexBuffer: WebGLBuffer;
  readonly texture: WebGLTexture;
  readonly positionLocation: number;
  readonly textureUniform: WebGLUniformLocation | null;
  readonly viewportUniform: WebGLUniformLocation | null;
  readonly textureSizeUniform: WebGLUniformLocation | null;
  readonly timeUniform: WebGLUniformLocation | null;
}

function acquireWebGLContext(canvas: HTMLCanvasElement): WebGLContext | null {
  const attributes: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
  };

  try {
    const gl2 = canvas.getContext('webgl2', attributes);
    if (gl2) return gl2;
    const gl1 = canvas.getContext('webgl', attributes);
    if (gl1) return gl1;
    return null;
  } catch {
    return null;
  }
}

function compileShader(
  gl: WebGLContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createGlResources(gl: WebGLContext): GlResources | null {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  if (!vertexShader) return null;

  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
  if (!fragmentShader) {
    gl.deleteShader(vertexShader);
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  const positionLocation = gl.getAttribLocation(program, 'aPosition');
  if (positionLocation < 0) {
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  const vertexBuffer = gl.createBuffer();
  const texture = gl.createTexture();
  if (!vertexBuffer || !texture) {
    if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
    if (texture) gl.deleteTexture(texture);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return {
    program,
    vertexShader,
    fragmentShader,
    vertexBuffer,
    texture,
    positionLocation,
    textureUniform: gl.getUniformLocation(program, 'uTexture'),
    viewportUniform: gl.getUniformLocation(program, 'uViewport'),
    textureSizeUniform: gl.getUniformLocation(program, 'uTextureSize'),
    timeUniform: gl.getUniformLocation(program, 'uTime'),
  };
}

function uploadTextureImage(
  gl: WebGLContext,
  texture: WebGLTexture,
  image: HTMLImageElement
): boolean {
  try {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    return gl.getError() === gl.NO_ERROR;
  } catch {
    return false;
  }
}

export function createHeroBackdropRenderer({
  canvas,
  imageSrc,
  fallbackWidth,
  fallbackHeight,
  onStatusChange,
}: HeroBackdropRendererOptions): HeroBackdropRendererHandle {
  let disposed = false;
  let status: HeroBackdropRendererStatus = 'loading';
  let gl: WebGLContext | null = acquireWebGLContext(canvas);
  let resources: GlResources | null = null;
  let loadedImage: HTMLImageElement | null = null;
  let pendingImage: HTMLImageElement | null = null;
  let textureWidth = fallbackWidth > 0 ? fallbackWidth : 1672;
  let textureHeight = fallbackHeight > 0 ? fallbackHeight : 941;

  let bufferSpec: HeroBackdropBufferSpec = {
    width: 0,
    height: 0,
    cssWidth: 0,
    cssHeight: 0,
    isPhoneTier: false,
    minFrameIntervalMs: DESKTOP_MIN_FRAME_INTERVAL_MS,
  };

  let shouldAnimate = false;
  let rafId: number | null = null;
  let elapsedSec = 0;
  let lastTickMs: number | null = null;
  let lastDrawMs: number | null = null;

  const setStatus = (next: HeroBackdropRendererStatus) => {
    if (disposed || status === next) return;
    status = next;
    onStatusChange(next);
  };

  const stopLoop = () => {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTickMs = null;
    lastDrawMs = null;
  };

  const deleteResources = () => {
    if (!gl || !resources) {
      resources = null;
      return;
    }
    if (!gl.isContextLost()) {
      gl.deleteTexture(resources.texture);
      gl.deleteBuffer(resources.vertexBuffer);
      gl.deleteProgram(resources.program);
      gl.deleteShader(resources.vertexShader);
      gl.deleteShader(resources.fragmentShader);
    }
    resources = null;
  };

  const drawFrame = (): boolean => {
    if (
      disposed ||
      !gl ||
      !resources ||
      gl.isContextLost() ||
      bufferSpec.width <= 0 ||
      bufferSpec.height <= 0
    ) {
      return false;
    }

    gl.viewport(0, 0, bufferSpec.width, bufferSpec.height);
    gl.useProgram(resources.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, resources.vertexBuffer);
    gl.enableVertexAttribArray(resources.positionLocation);
    gl.vertexAttribPointer(resources.positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, resources.texture);
    if (resources.textureUniform !== null) {
      gl.uniform1i(resources.textureUniform, 0);
    }
    if (resources.viewportUniform !== null) {
      gl.uniform2f(
        resources.viewportUniform,
        bufferSpec.cssWidth,
        bufferSpec.cssHeight
      );
    }
    if (resources.textureSizeUniform !== null) {
      gl.uniform2f(resources.textureSizeUniform, textureWidth, textureHeight);
    }
    if (resources.timeUniform !== null) {
      gl.uniform1f(resources.timeUniform, elapsedSec);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return true;
  };

  const step = (nowMs: number) => {
    rafId = null;
    if (disposed || !shouldAnimate || status !== 'ready' || !gl || gl.isContextLost()) {
      lastTickMs = null;
      lastDrawMs = null;
      return;
    }

    if (lastTickMs !== null) {
      const dtSec = Math.min(MAX_DELTA_SEC, Math.max(0, (nowMs - lastTickMs) / 1000));
      elapsedSec = (elapsedSec + dtSec * HERO_BACKDROP_TIME_SCALE) % TIME_WRAP_SECONDS;
    }
    lastTickMs = nowMs;

    const shouldRenderThisTick =
      lastDrawMs === null || nowMs - lastDrawMs >= bufferSpec.minFrameIntervalMs;

    if (shouldRenderThisTick) {
      if (drawFrame()) {
        lastDrawMs = nowMs;
      }
    }

    if (!disposed && shouldAnimate && status === 'ready') {
      rafId = window.requestAnimationFrame(step);
    }
  };

  const syncLoop = () => {
    if (disposed || !shouldAnimate || status !== 'ready' || !gl || gl.isContextLost()) {
      stopLoop();
      return;
    }
    if (rafId === null) {
      lastTickMs = null;
      lastDrawMs = null;
      rafId = window.requestAnimationFrame(step);
    }
  };

  const hydratePipeline = (image: HTMLImageElement) => {
    if (disposed || !gl || gl.isContextLost()) {
      setStatus('fallback');
      return;
    }

    deleteResources();
    const created = createGlResources(gl);
    if (!created) {
      setStatus('fallback');
      return;
    }

    const uploaded = uploadTextureImage(gl, created.texture, image);
    if (!uploaded) {
      resources = created;
      deleteResources();
      setStatus('fallback');
      return;
    }

    resources = created;
    textureWidth = image.naturalWidth || textureWidth;
    textureHeight = image.naturalHeight || textureHeight;

    drawFrame();
    setStatus('ready');
    syncLoop();
  };

  const loadTextureImage = () => {
    if (disposed) return;

    if (loadedImage && loadedImage.complete && loadedImage.naturalWidth > 0) {
      hydratePipeline(loadedImage);
      return;
    }

    if (pendingImage) {
      pendingImage.onload = null;
      pendingImage.onerror = null;
      pendingImage = null;
    }

    const image = new Image();
    pendingImage = image;
    image.decoding = 'async';

    image.onload = () => {
      if (pendingImage === image) {
        pendingImage = null;
      }
      if (disposed) return;
      if (image.naturalWidth <= 0 || image.naturalHeight <= 0) {
        setStatus('fallback');
        return;
      }
      loadedImage = image;
      hydratePipeline(image);
    };

    image.onerror = () => {
      if (pendingImage === image) {
        pendingImage = null;
      }
      if (disposed) return;
      setStatus('fallback');
    };

    image.src = imageSrc;
  };

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    stopLoop();
    resources = null;
    setStatus('fallback');
  };

  const handleContextRestored = () => {
    if (disposed) return;
    gl = acquireWebGLContext(canvas);
    if (!gl || gl.isContextLost()) {
      setStatus('fallback');
      return;
    }
    loadTextureImage();
  };

  canvas.addEventListener('webglcontextlost', handleContextLost, false);
  canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

  if (!gl || gl.isContextLost()) {
    setStatus('fallback');
  } else {
    loadTextureImage();
  }

  return {
    resize(cssWidth: number, cssHeight: number, devicePixelRatio: number) {
      if (disposed) return;
      const next = computeBackdropBufferSize({
        cssWidth,
        cssHeight,
        devicePixelRatio,
      });
      const sizeChanged =
        next.width !== bufferSpec.width ||
        next.height !== bufferSpec.height ||
        next.cssWidth !== bufferSpec.cssWidth ||
        next.cssHeight !== bufferSpec.cssHeight;

      bufferSpec = next;

      if (next.width > 0 && next.height > 0) {
        if (canvas.width !== next.width) {
          canvas.width = next.width;
        }
        if (canvas.height !== next.height) {
          canvas.height = next.height;
        }
        // Re-draw immediately after resize so paused or initial state never shows a cleared buffer
        if (sizeChanged && status === 'ready') {
          drawFrame();
        }
      }
    },

    setAnimating(nextAnimating: boolean) {
      if (disposed) return;
      shouldAnimate = nextAnimating;
      syncLoop();
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      shouldAnimate = false;
      stopLoop();

      if (pendingImage) {
        pendingImage.onload = null;
        pendingImage.onerror = null;
        pendingImage = null;
      }

      canvas.removeEventListener('webglcontextlost', handleContextLost, false);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored, false);
      deleteResources();
      loadedImage = null;
      gl = null;
    },
  };
}
