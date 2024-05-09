uniform float time;
uniform float progress;
uniform sampler2D uTexture;
uniform sampler2D uTexture1;
uniform vec4 resolution;
varying vec2 vUv;
varying vec4 vPosition;
varying vec3 vViewPosition;
varying vec3 vNormal;

float PI = 3.141592653589793238;

void main() {
    vec3 normal = normalize((cross(dFdx(vViewPosition), dFdy(vViewPosition))));

    vec3 viewDir = normalize(vViewPosition);
    vec3 x = normalize(vec3(viewDir.z, 0.0, -viewDir.x));
    vec3 y = cross(viewDir, x);
    vec2 uv = vec2(dot(x, normal), dot(y, normal)) * 0.495 + 0.5;

    gl_FragColor = vec4(normal, 1.);
    gl_FragColor = vec4(uv, 0., 1.);

    vec4 color = texture2D(uTexture, uv);
    vec4 color1 = texture2D(uTexture1, uv);

    vec2 screenUV = gl_FragCoord.xy / resolution.xy;

    float divide = step(0.5, screenUV.x + (screenUV.y - 0.5) * 0.15);

    float fog = smoothstep(-1., 6., length(vViewPosition * vec3(2., 1., 1.)));

    vec4 finalColor = mix(color, color1, divide);
    gl_FragColor = finalColor;

    vec3 fogColor = mix(vec3(0.), vec3(1.), divide);

    finalColor = mix(finalColor, vec4(fogColor, 1.), fog);

    gl_FragColor = vec4(finalColor.rgb, 1.);

}