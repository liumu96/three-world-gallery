uniform sampler2D envMap;
uniform sampler2D backfaceMap;
uniform vec2 resolution;
uniform float ior;

varying vec3 worldNormal;
varying vec3 eyeVector;

// void main() {
// 	//water is 1.33 and diamond has an IOR of 2.42.
// 	float iorVal = ior;

// 	// get screen coordinates
// 	vec2 uv = gl_FragCoord.xy / resolution;

// 	vec3 normal = worldNormal;
// 	// calculate refraction and add to the screen coordinates
// 	vec3 refracted = refract(eyeVector, normal, 1.0/iorVal);
// 	uv += refracted.xy;
	
// 	// sample the background texture
// 	vec4 tex = texture2D(envMap, uv);

// 	vec4 outputTex = tex;
// 	gl_FragColor = vec4(outputTex.rgb, 1.0);
// }


void main() {
	//water is 1.33 and diamond has an IOR of 2.42.
	float iorVal = ior;
	
	// get screen coordinates
	vec2 uv = gl_FragCoord.xy / resolution;

	vec3 normal = worldNormal;
	// calculate refraction and add to the screen coordinates
	vec3 refracted = refract(eyeVector, normal, 1.0/ior);
	uv += refracted.xy;
	
	vec3 backfaceNormal = texture2D(backfaceMap, uv).rgb;

	float a = 0.33;
    normal = worldNormal * (1.0 - a) - backfaceNormal * a;

	gl_FragColor = vec4(normal, 1.0);
}