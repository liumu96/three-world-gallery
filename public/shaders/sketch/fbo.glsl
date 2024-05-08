uniform float time;
uniform float progress;
uniform sampler2D tDiffuse;
uniform vec4 resolution;
varying vec2 vUv;
varying vec4 vPosition;

float PI = 3.141592653589793238;

void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    gl_FragColor = vec4(vUv, 0.0, 1.);
    gl_FragColor = color * 0.3;
}