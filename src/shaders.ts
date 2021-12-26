export const vertexShader = `
varying vec3 vColor;
void main() {
  vColor = color;
  vec3 mPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  float d = dot(normalize(mPosition.xy), normalize(cameraPosition.xy));
  float sizeMultiplier = 250.0;
  if (d < 0.0) sizeMultiplier *= pow(2.0, d * 2.0);
  else if (d > 0.5) sizeMultiplier *= pow(2.0, (d - 0.5) * 2.0);
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_PointSize = ( sizeMultiplier / -mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;
}
`

export const fragmentShader = `
uniform sampler2D pointTexture;
varying vec3 vColor;

vec3 hsl2rgb(in vec3 c) {
    vec3 rgb = clamp( abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, 1.0 );
    return c.z + c.y * (rgb-0.5)*(1.0-abs(2.0*c.z-1.0));
}

vec3 rgb2hsl( in vec3 c ){
  float h = 0.0;
	float s = 0.0;
	float l = 0.0;
	float r = c.r;
	float g = c.g;
	float b = c.b;
	float cMin = min( r, min( g, b ) );
	float cMax = max( r, max( g, b ) );

	l = ( cMax + cMin ) / 2.0;
	if ( cMax > cMin ) {
		float cDelta = cMax - cMin;
		s = l < .0 ? cDelta / ( cMax + cMin ) : cDelta / ( 2.0 - ( cMax + cMin ) );
        
		if ( r == cMax ) {
			h = ( g - b ) / cDelta;
		} else if ( g == cMax ) {
			h = 2.0 + ( b - r ) / cDelta;
		} else {
			h = 4.0 + ( r - g ) / cDelta;
		}

		if ( h < 0.0) {
			h += 6.0;
		}
		h = h / 6.0;
	}
	return vec3( h, s, l );
}

void main() {
  float lightness = texture2D(pointTexture, gl_PointCoord).r;
  vec3 color = rgb2hsl(vColor);
  color.z *= 2.0 * lightness * lightness * lightness;
  color = hsl2rgb(color);
  gl_FragColor = vec4(color, 1.0);
}
`
