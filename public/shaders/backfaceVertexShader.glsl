varying vec3 eyeVector;
varying vec3 worldNormal;

void main() {
	vec4 worldPosition = modelMatrix * vec4(position, 1.0);
	eyeVector = normalize(worldPosition.xyz - cameraPosition);
	worldNormal = normalize(modelViewMatrix * vec4(normal, 0.0)).xyz;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// varying vec3 vUv; 

// void main() {
//   vUv = position; 

//   vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
//   gl_Position = projectionMatrix * modelViewPosition; 
// }