import { Vector2 } from "three";

/**
 * Dot screen shader
 * based on glfx.js sepia shader
 * https://github.com/evanw/glfx.js
 */

const CustomPost = {
  name: "CustomPost",

  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new Vector2(window.innerWidth, window.innerHeight) },
    tSize: { value: new Vector2(256, 256) },
    center: { value: new Vector2(0.5, 0.5) },
    angle: { value: 1.57 },
    scale: { value: 1.0 },
  },

  vertexShader: /* glsl */ `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

  fragmentShader: /* glsl */ `

		uniform vec2 center;
		uniform float angle;
		uniform float scale;
		uniform vec2 tSize;

		uniform sampler2D tDiffuse;
        uniform vec2 resolution;

		varying vec2 vUv;

		float pattern() {

			float s = sin( angle ), c = cos( angle );

			vec2 tex = vUv * tSize - center;
			vec2 point = vec2( c * tex.x - s * tex.y, s * tex.x + c * tex.y ) * scale;

			return ( sin( point.x ) * sin( point.y ) ) * 4.0;

		}


        float random(vec3 scale, float seed) {
            return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
        }

        float sat( float t ){
            return clamp( t, 0.0, 1.0 );
        }
        
        
        float linterp( float t ) {
            return sat( 1.0 - abs( 2.0*t - 1.0 ) );
        }
        
        float remap( float t, float a, float b ) {
            return sat( (t - a) / (b - a) );
        }
        
        vec3 spectrum_offset( float t ) {
            vec3 ret;
            float lo = step(t,0.5);
            float hi = 1.0-lo;
            float w = linterp( remap( t, 1.0/6.0, 5.0/6.0 ) );
            ret = vec3(lo,1.0,hi) * vec3(1.0-w, w, 1.0-w);
            
            return pow( ret, vec3(1.0/2.2) );
        }
        
        const int num_iter = 12;
        const float reci_num_iter_f = 1.0 / float(num_iter);

		void main() {

			vec4 color = texture2D( tDiffuse, vUv );

            vec2 screeRatio = vec2(resolution.x / resolution.y, 1.);
            
            vec3 sumcol = vec3(0.0);
            vec3 sumw = vec3(0.0);	

            float total = 0.0;

            vec2 blurOrigin = vec2(resolution.x / 2. + 50., resolution.y / 2.);
            float blurAmt = 0.0;

            vec2 toCenter = blurOrigin - vUv * resolution;
            float offset = random(vec3(12.9898, 78.233, 151.7182), 0.0);
            
            for ( int i=0; i<num_iter;++i ){
                float t = float(i) * reci_num_iter_f;
                float percent = (float(i) + offset) / float(num_iter);


                vec3 w = mix(spectrum_offset( t ), vec3(1.), 0.5);
                sumw += w;
                sumcol += w * texture2D( tDiffuse, vUv + toCenter * percent * blurAmt / resolution ).rgb;
            }
            gl_FragColor = vec4(sumcol.rgb / sumw, 1.0);


			// gl_FragColor = color;

		}`,
};

export { CustomPost };
