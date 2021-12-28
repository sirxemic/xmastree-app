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

vec3 rgb2xyz(vec3 c) {
  vec3 tmp = vec3(
    (c.r > .04045) ? pow((c.r + .055) / 1.055, 2.4) : c.r / 12.92,
    (c.g > .04045) ? pow((c.g + .055) / 1.055, 2.4) : c.g / 12.92,
    (c.b > .04045) ? pow((c.b + .055) / 1.055, 2.4) : c.b / 12.92
  );
  mat3 mat = mat3(
    .4124, .3576, .1805,
    .2126, .7152, .0722,
    .0193, .1192, .9505
  );
  return 100. * tmp * mat;
}

vec3 xyz2lab(vec3 c) {
  vec3 n = c / vec3(95.047, 100., 108.883);
  vec3 v = vec3(
    (n.x > .008856) ? pow(n.x, 1./3.) : (7.787 * n.x) + (16. / 116.),
    (n.y > .008856) ? pow(n.y, 1./3.) : (7.787 * n.y) + (16. / 116.),
    (n.z > .008856) ? pow(n.z, 1./3.) : (7.787 * n.z) + (16. / 116.)
  );
  return vec3((116. * v.y) - 16., 500. * (v.x - v.y), 200. * (v.y - v.z));
}

vec3 rgb2lab(vec3 c) {
  vec3 lab = xyz2lab(rgb2xyz(c));
  return vec3(lab.x / 100., .5 + .5 * (lab.y / 127.), .5 + .5 * (lab.z / 127.));
}

vec3 lab2xyz(vec3 c) {
  float fy = (c.x + 16.) / 116.;
  float fx = c.y / 500. + fy;
  float fz = fy - c.z / 200.;

  return vec3(
     95.047 * ((fx > .206897) ? fx * fx * fx : (fx - 16. / 116.) / 7.787),
    100.000 * ((fy > .206897) ? fy * fy * fy : (fy - 16. / 116.) / 7.787),
    108.883 * ((fz > .206897) ? fz * fz * fz : (fz - 16. / 116.) / 7.787)
  );
}

vec3 xyz2rgb(vec3 c) {
  mat3 mat=mat3(
    3.2406, -1.5372, -0.4986,
    -0.9689, 1.8758, 0.0415,
    0.0557, -.2040, 1.0570
  );
  vec3 v = 0.01 * c * mat;
  vec3 r = vec3(
    (v.r > .0031308) ? ((1.055 * pow(v.r, (1. / 2.4))) - .055) : 12.92 * v.r,
    (v.g > .0031308) ? ((1.055 * pow(v.g, (1. / 2.4))) - .055) : 12.92 * v.g,
    (v.b > .0031308) ? ((1.055 * pow(v.b, (1. / 2.4))) - .055) : 12.92 * v.b
  );
  return r;
}
vec3 lab2rgb(vec3 c){
  return xyz2rgb(
    lab2xyz(
      vec3(
        100. * c.x,
        2. * 127. * (c.y - .5),
        2. * 127. * (c.z - .5)
      )
    )
  );
}

void main() {
  float lightness = texture2D(pointTexture, gl_PointCoord).r;
  vec3 color = clamp(vColor, vec3(0.0), vec3(1.0));
  color = rgb2lab(color);
  color.x *= 2.0 * lightness * lightness;
  color = lab2rgb(color);
  gl_FragColor = vec4(color, lightness);
}
`
