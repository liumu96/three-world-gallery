// #extension GL_OES_standard_derivatives: enable

uniform float time;
uniform float progress;
uniform sampler2D texture1;
uniform vec4 resolution;
varying vec2 vUv;
varying vec4 vPosition;
varying float vOpacity;

float PI = 3.141592653589793238;

void main() {

    vec2 uv = vec2(gl_PointCoord.x, 1. - gl_PointCoord.y);
    vec2 cUV = 2. * uv - 1.;

    vec3 originalColor = vec3(4. / 255., 10. / 255., 20. / 255.);
    // originalColor = vec3((10. + vOpacity * 100.) / 255., (10. + vOpacity * 1000.) / 255., (20. + (1. - vOpacity * 1000.) * 100.) / 255.);

    vec4 color = vec4(0.08 / length(cUV));
    color.rgb = min(vec3(10.), color.rgb);

    color.rgb *= originalColor * 1200.;

    color *= vOpacity;

    color.a = min(1., color.a) * 10.;

    float disc = length(cUV);

    gl_FragColor = vec4(1. - disc, 0., 0., 1.) * vOpacity;
    gl_FragColor = vec4(color.rgb, color.a);
}