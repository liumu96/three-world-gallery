uniform float time;
uniform float progress;
uniform sampler2D tDiffuse;
uniform sampler2D tPrev;
uniform vec4 resolution;
varying vec2 vUv;
varying vec4 vPosition;

float PI = 3.141592653589793238;

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u * u * (3.0 - 2.0 * u);

    float res = mix(mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x), mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
    return res * res;
}

float fbm(vec2 x, int numOctaves) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100);
	// Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < numOctaves; ++i) {
        v += a * noise(x);
        x = rot * x * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

float blendDarken(float base, float blend) {
    return min(blend, base);
}

vec3 blendDarken(vec3 base, vec3 blend) {
    return vec3(blendDarken(base.r, blend.r), blendDarken(base.g, blend.g), blendDarken(base.b, blend.b));
}

vec3 blendDarken(vec3 base, vec3 blend, float opacity) {
    return (blendDarken(base, blend) * opacity + base * (1.0 - opacity));
}

vec3 bgColor = vec3(1., 1., 1.);

vec3 hsl2rgb(float h, float s, float l) {
    float C = (1.0 - abs(2.0 * l - 1.0)) * s;
    float X = C * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
    float m = l - 0.5 * C;

    vec3 rgb;
    if (h < 1.0 / 6.0) {
        rgb = vec3(C, X, 0.0);
    } else if (h < 2.0 / 6.0) {
        rgb = vec3(X, C, 0.0);
    } else if (h < 3.0 / 6.0) {
        rgb = vec3(0.0, C, X);
    } else if (h < 4.0 / 6.0) {
        rgb = vec3(0.0, X, C);
    } else if (h < 5.0 / 6.0) {
        rgb = vec3(X, 0.0, C);
    } else {
        rgb = vec3(C, 0.0, X);
    }
    rgb += vec3(m);
    return rgb;
}

void main() {
    vec4 color = texture2D(tDiffuse, vUv); // mouse movement
    vec4 prev = texture2D(tPrev, vUv); /// prev frame

    vec2 aspect = vec2(1., resolution.y / resolution.x);

    vec2 disp = fbm(vUv * 22.0, 4) * aspect * 0.01;

    vec4 texel = texture2D(tPrev, vUv);
    vec4 texel2 = texture2D(tPrev, vec2(vUv.x + disp.x, vUv.y));
    vec4 texel3 = texture2D(tPrev, vec2(vUv.x - disp.x, vUv.y));
    vec4 texel4 = texture2D(tPrev, vec2(vUv.x, vUv.y + disp.y));
    vec4 texel5 = texture2D(tPrev, vec2(vUv.x, vUv.y - disp.y));

    vec3 floodColor = texel.rgb;
    floodColor = blendDarken(floodColor, texel2.rgb);
    floodColor = blendDarken(floodColor, texel3.rgb);
    floodColor = blendDarken(floodColor, texel4.rgb);
    floodColor = blendDarken(floodColor, texel5.rgb);

    vec3 gradient = hsl2rgb(fract(time * 0.1), 0.5, 0.5);
    vec3 lcolor = mix(vec3(1.), gradient, color.r);

    vec3 waterColor = blendDarken(prev.rgb, floodColor * (1. + 0.02), 0.7);

    vec3 finalColor = blendDarken(waterColor, lcolor, 1.);

    gl_FragColor = texel3;
    gl_FragColor = vec4(waterColor, 1.);
    gl_FragColor = vec4(color.rgb, 1.);
    gl_FragColor = vec4(gradient.rgb, 1.);
    gl_FragColor = vec4(finalColor.rgb, 1.);

    gl_FragColor = vec4(min(bgColor, finalColor * (1. + 0.01) + 0.001), 1.);
}