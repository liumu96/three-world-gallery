vec4 position = instanceMatrix[3];
float toCenter = length(position.xz) ;


// float mouseTrail = length(position.xz- uPos0.xy);
float mouseTrail = sdSegment(position.xz, uPos0, uPos1 );
mouseTrail = smoothstep(2.0, 5. * uConfig.z , mouseTrail)  ;

// Mouse Scale
transformed *= 1. + cubicOut(1.0-mouseTrail) * uConfig2.y;


// Instance Animation
float start = 0. + toCenter * 0.02;
float end = start+  (toCenter + 1.5) * 0.06;
float anim = (map(clamp(uAnimate, start,end) , start, end, 0., 1.));


transformed = rotate(transformed, vec3(0., 1., 1. ),uConfig2.x * (anim * 3.14+  uTime * uConfig.x + toCenter * 0.4 * uConfig.w) );

// Mouse Offset
transformed.y += (-1.0 * (1.-mouseTrail)) * uConfig2.z;

transformed.xyz *= cubicInOut(anim);
transformed.y += cubicInOut(1.-anim) * 1.;

transformed.y += sin(uTime * 2. * uConfig.x + toCenter * uConfig.y) * 0.1;

vec4 mvPosition = vec4( transformed, 1.0 );

#ifdef USE_INSTANCING

    mvPosition = instanceMatrix * mvPosition;

#endif

mvPosition = modelViewMatrix * mvPosition;

gl_Position = projectionMatrix * mvPosition;