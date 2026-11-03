import { defaultFilterVert, Filter, GlProgram, UniformGroup } from 'pixi.js'

// Matches ntch.design CRT glass params (their CRT_PARAMS / 100).
const CURVATURE = 0.25
const SCANLINES = 0.3
const SCANLINE_SIZE = 2
const CHROMA = 0.0575
const VIGNETTE = 0.6
const GRAIN = 0.06
const BEZEL_RADIUS = 0.045
/** Black pad around the glass as a fraction of the short side. */
const INSET = 0.06
/** Soft rim fade width in CSS px — alpha only, no spatial blur. */
const EDGE_SOFT = 48

const FRAGMENT = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform highp vec4 uInputSize;
uniform highp vec4 uInputClamp;
uniform highp vec4 uOutputFrame;
uniform float uTime;
uniform float uCurvature;
uniform float uScanlines;
uniform float uScanSize;
uniform float uChroma;
uniform float uVignette;
uniform float uGrain;
uniform float uBezelRadius;
uniform float uInset;
uniform float uEdgeSoft;

const float TAU = 6.28318530718;

float hash21(vec2 p) {
  vec3 h = fract(vec3(p.x, p.y, p.x) * 0.1031);
  h += dot(h, h.yzx + 33.33);
  return fract((h.x + h.y) * h.z);
}

float hash31(vec3 p) {
  vec3 h = fract(p * vec3(0.1031, 0.1030, 0.0973));
  h += vec3(dot(h, h.yzx + 33.33));
  return fract((h.x + h.y) * h.z);
}

vec2 toScreen(vec2 texCoord) {
  return texCoord * uInputSize.xy / uOutputFrame.zw;
}

vec2 toTex(vec2 screenUv) {
  return screenUv * uOutputFrame.zw * uInputSize.zw;
}

vec3 sampleRgb(vec2 screenUv) {
  vec2 uv = clamp(toTex(screenUv), uInputClamp.xy, uInputClamp.zw);
  return texture(uTexture, uv).rgb;
}

// Aspect-corrected barrel; fit keeps the warped glass filling the frame.
vec2 crtBarrel(vec2 uv, float curvature, float fit, vec2 aspect) {
  vec2 c = (uv * 2.0 - 1.0) * aspect;
  float r2 = dot(c, c);
  return (c * (1.0 + curvature * 0.35 * r2) * fit / aspect) * 0.5 + 0.5;
}

// Signed distance to the rounded glass: <0 inside, >0 outside (px).
float glassDist(vec2 uv, float radius, float inset) {
  vec2 res = uOutputFrame.zw;
  float r = radius * min(res.x, res.y);
  vec2 halfSize = res * (0.5 - inset) - r;
  vec2 p = abs(uv * res - res * 0.5) - halfSize;
  return length(max(p, 0.0)) - r;
}

// Soft rainbow fringe (ntch-style): fixed triangle taps, red out / blue in.
vec3 fringeSample(vec2 at, vec2 spread) {
  vec3 sum = vec3(0.0);
  vec3 weight = vec3(0.0);
  for (int i = 0; i < 5; i += 1) {
    float t = (float(i) - 2.0) * 0.4375;
    vec3 w = max(vec3(0.0), 1.0 - abs(2.0 * (vec3(t) - vec3(0.5, 0.0, -0.5))));
    vec3 tex = sampleRgb(clamp(at + spread * t, 0.0, 1.0));
    sum += tex * w;
    weight += w;
  }
  return sum / max(weight, vec3(1e-4));
}

void main() {
  vec2 screenUv = toScreen(vTextureCoord);
  vec2 outDims = max(uOutputFrame.zw, vec2(1.0));

  vec2 aspectRaw = vec2(outDims.x / outDims.y, 1.0);
  vec2 aspect = aspectRaw / (length(aspectRaw) / 1.41421356237);
  float fit = 1.0 / (1.0 + 0.7 * uCurvature);

  vec2 uv = crtBarrel(screenUv, uCurvature, fit, aspect);

  float soft = max(uEdgeSoft, 1.0);
  float dist = glassDist(uv, uBezelRadius, uInset);
  // Soft rim fade only — sharp picture inside, alpha falloff at the bezel.
  float glass = 1.0 - smoothstep(-soft, soft * 0.25, dist);
  if (glass < 0.001 || uv.x < -0.02 || uv.x > 1.02 || uv.y < -0.02 || uv.y > 1.02) {
    finalColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  // Radial fringe — ntch falloff (d^2 + d^4) in pixel space so the center stays clean.
  vec2 fromCenter = uv - 0.5;
  vec2 fromCenterPx = fromCenter * outDims;
  float d2 = dot(fromCenterPx, fromCenterPx) / max(dot(outDims * 0.5, outDims * 0.5), 1.0);
  vec2 spread = fromCenter * uChroma * (d2 + d2 * d2);
  float reach = length(spread * outDims);

  vec3 color = reach < 0.5
    ? sampleRgb(clamp(uv, 0.0, 1.0))
    : fringeSample(uv, spread);

  // Light phosphor grain locked to scanline rows.
  float scanSize = max(uScanSize, 1.0);
  if (uGrain > 0.001) {
    float field = floor(uTime * 24.0);
    vec2 cell = vec2(floor(uv.x * outDims.x / 3.0), floor(uv.y * outDims.y / scanSize + 0.5));
    float white = hash31(vec3(cell, field));
    float hiss = hash21(vec2(cell.y, field * 1.7)) - 0.5;
    float snow = clamp(white + hiss * 0.35, 0.0, 1.0) * 0.8;
    color = mix(color, vec3(snow), uGrain * 0.28);
    color *= 1.0 + (white - 0.5) * uGrain * 0.18;
  }

  // Cosine scanlines, mean-normalized so the picture doesn't go muddy.
  float scanAmt = uScanlines * mix(0.6, 1.0, smoothstep(1.0, 2.5, scanSize));
  float py = uv.y * outDims.y;
  color *= (1.0 - scanAmt * 0.5 * (1.0 - cos(TAU * py / scanSize))) / max(1.0 - scanAmt * 0.5, 0.001);

  // Vignette along the curved glass.
  vec2 cc = (uv * 2.0 - 1.0) * aspect;
  float vigStrength = 3.0 * uVignette * uVignette * (0.35 + 0.65 * uVignette);
  float vigSpread = clamp(uVignette * uVignette * (0.6 + 0.4 * clamp(uCurvature, 0.0, 1.0)), 0.0, 1.0);
  color *= max(1.0 - vigStrength * smoothstep(mix(1.4, 0.0, vigSpread), 2.0, dot(cc, cc)), 0.0);

  // Soft highlight knee — scanline gain can push past white.
  vec3 excess = max(color - vec3(0.8), vec3(0.0));
  vec3 compressed = vec3(0.8) + 0.2 * (vec3(1.0) - exp(-excess / 0.2));
  color = mix(color, compressed, step(vec3(0.8), color));

  finalColor = vec4(clamp(color * glass, 0.0, 1.0), 1.0);
}
`

export function createCrtFilter() {
  const crtUniforms = new UniformGroup({
    uTime: { value: 0, type: 'f32' },
    uCurvature: { value: CURVATURE, type: 'f32' },
    uScanlines: { value: SCANLINES, type: 'f32' },
    uScanSize: { value: SCANLINE_SIZE, type: 'f32' },
    uChroma: { value: CHROMA, type: 'f32' },
    uVignette: { value: VIGNETTE, type: 'f32' },
    uGrain: { value: GRAIN, type: 'f32' },
    uBezelRadius: { value: BEZEL_RADIUS, type: 'f32' },
    uInset: { value: INSET, type: 'f32' },
    uEdgeSoft: { value: EDGE_SOFT, type: 'f32' },
  })

  const filter = new Filter({
    glProgram: GlProgram.from({
      vertex: defaultFilterVert,
      fragment: FRAGMENT,
      name: 'crt-filter-v13',
    }),
    resources: { crtUniforms },
    padding: 0,
  })

  const tick = (deltaMS: number) => {
    crtUniforms.uniforms.uTime += deltaMS * 0.001
  }

  return { filter, tick }
}
