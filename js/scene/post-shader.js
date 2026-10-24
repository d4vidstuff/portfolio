/**
 * Post-procesado: la escena se dibuja en baja resolución y este shader la pasa
 * a pantalla con viñeta, curva de contraste y dithering Bayer 4x4 (7 niveles por canal).
 */
export const postVertex =
  'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

export const postFragment = /* glsl */ `
    precision highp float;
    uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTime, uGrain, uCA, uFlash;
    varying vec2 vUv;
    float bayer2(vec2 a){ a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
    float bayer4(vec2 a){ return bayer2(0.5 * a) * 0.25 + bayer2(a); }
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main(){
      vec2 px = floor(vUv * uRes);
      vec2 uv = (px + 0.5) / uRes;
      vec2 d = uv - 0.5;
      vec2 off = d * uCA;
      vec3 col = vec3(texture2D(tDiffuse, uv + off).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv - off).b);
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col * vec3(0.82, 1.06, 0.9), col, smoothstep(0.04, 0.45, l));
      col += uFlash;
      float v = smoothstep(0.95, 0.22, length(d * vec2(1.0, 1.25)));
      col *= mix(0.1, 1.0, v);
      col = pow(max(col, 0.0), vec3(1.0 / 1.7));
      col = floor(col * 7.0 + bayer4(px)) / 7.0;
      col = pow(col, vec3(1.7));
      gl_FragColor = vec4(col, 1.0);
    }`;
