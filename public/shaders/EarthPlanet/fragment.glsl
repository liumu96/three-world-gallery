uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;
varying vec2 vUv;
varying vec4 vPosition;

void main() {
    float dash = sin(vUv.x * 50. - time);
    if (dash < 0.)
        discard;
    gl_FragColor = vec4(vUv.x, 0.0, 0., 1.);
}