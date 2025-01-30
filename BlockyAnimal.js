'use strict';

// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
attribute vec4 a_Position;
uniform mat4 u_Matrix;
uniform mat4 u_GlobalRotateMatrix;
void main() {
  gl_Position = u_GlobalRotateMatrix * u_Matrix * a_Position;
}`;

// Fragment shader program
var FSHADER_SOURCE =`
precision mediump float;
uniform vec4 u_FragColor;
void main() {
  gl_FragColor = u_FragColor;
}`;

var a_Position, u_Matrix, u_FragColor, u_GlobalRotateMatrix;

/**
 * Get the canvas and gl context
 * @returns {[WebGLRenderingContext, HTMLCanvasElement]} gl context
 */
function setupWebGL(){
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // var gl = getWebGLContext(canvas);
  var gl = canvas.getContext("webgl", {preserveDrawingBuffer: false});
  if (!gl) {
    throw new Error('Failed to get the rendering context for WebGL');
  }

  return [gl, canvas];
}

/**
 * Compile the shader programs, attach the javascript variables to the GLSL variables
 * @param {WebGLRenderingContext} gl Rendering context
 * @param {string[]} attrs Attributes to locate
 * @param {string[]} unifs Uniforms to locate
 * @returns {[GLint[], WebGLUniformLocation[]]} attribute variables and uniform vairabl
 */
function connectVariablesToGLSL(gl, attrs, unifs){
  var out = [[], []];

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    throw new Error('Failed to intialize shaders.');
  }

  // Get the storage location of attributes
  for (var i = 0; i < attrs.length; i++){
    var attr = gl.getAttribLocation(gl.program, attrs[i]);
    if (attr < 0) {
      throw new Error(`Failed to get the storage location of attribute ${attrs[i]}`);
    }
    out[0].push(attr);
  }

  // Get the storage location of uniforms
  for (var i = 0; i < unifs.length; i++){
    var unif = gl.getUniformLocation(gl.program, unifs[i]);
    if (unif < 0) {
      throw new Error(`Failed to get the storage location of uniform ${unifs[i]}`);
    }
    out[1].push(unif);
  }

  return out;
}

/**
 * Clears canvas
 * @param {WebGLRenderingContext} gl 
 */
function clearCanvas(gl){
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

const globRotSlider = document.getElementById("Rotation");
const proxTXSlider = document.getElementById("proxTX");
const proxTYSlider = document.getElementById("proxTY");
const midTXSlider = document.getElementById("midTX");
const midTYSlider = document.getElementById("midTY");
const distTXSlider = document.getElementById("distTX");
const distTYSlider = document.getElementById("distTY");
const animToggleButton = document.getElementById("animToggle");
const frameTimeSpan = document.getElementById("frameTime");
const fpsSpan = document.getElementById("fps");

var g_time = 0;
var g_caTime = 10000000;
var hatHeight = 0;
var leftLegsRot = 0;
var rightLegsRot = 0;
function tick(gl) {
  var start_time = Date.now();

  const vel = 1;
  const speed = 100;
  if (g_caTime <= speed * (vel / 5)){
    proxTYSlider.valueAsNumber = 0;
    midTYSlider.valueAsNumber = 0;
    distTYSlider.valueAsNumber = 0;

    var t = g_caTime / speed;
    hatHeight = -5 * t * t + vel * t;
  } else {
    proxTYSlider.valueAsNumber = 45 * Math.sin(g_time / 30);
    midTYSlider.valueAsNumber = 20 * Math.sin(g_time / 30);
    distTYSlider.valueAsNumber = 10 * Math.sin(g_time / 30);
    leftLegsRot = 20 * Math.sin(g_time / 30);
    rightLegsRot = 20 * Math.cos(g_time / 30 + .5)
  }

  g_time += 1;
  g_caTime += 1;
  renderScene(gl);
  var frameTime = Date.now() - start_time;
  frameTimeSpan.innerHTML = frameTime;
}

function main() {


  var [gl, canvas] = setupWebGL();
  [[a_Position], [u_FragColor, u_Matrix, u_GlobalRotateMatrix]] = connectVariablesToGLSL(gl, 
    ["a_Position"], ["u_FragColor", "u_Matrix", "u_GlobalRotateMatrix"]);

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);


  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);


  var grm = new Matrix4();
  grm.rotate(90, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, grm.elements);
  
  globRotSlider.onmousemove = function(ev){
    if (ev.buttons != 1){
      return;
    }
    grm.setRotate(globRotSlider.valueAsNumber, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, grm.elements);
    renderScene(gl);
  }

  canvas.onmousemove = function(ev){
    if (ev.buttons != 1){
      return;
    }
    grm.rotate(-ev.movementX, 0, 1, 0);
    grm.rotate(-ev.movementY, 1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, grm.elements);
    renderScene(gl);
  }

  canvas.onmousedown = function(ev){
    if(!ev.shiftKey){
      return;
    }

    g_caTime = 0;
  }

  proxTXSlider.onmousemove = 
  proxTYSlider.onmousemove = 
  midTXSlider.onmousemove = 
  midTYSlider.onmousemove = 
  distTXSlider.onmousemove =
  distTYSlider.onmousemove = function(ev){
    if (ev.buttons != 1){
      return;
    }
    renderScene(gl);
  }

  proxTXSlider.valueAsNumber = -30;
  midTXSlider.valueAsNumber = -10;
  distTYSlider.valueAsNumber = -10;
  var animIntv = setInterval(() => tick(gl), 10);
  animToggleButton.onclick = function(){
    if (animIntv == null){
      animIntv = setInterval(() => tick(gl), 10);
    } else {
      clearInterval(animIntv);
      animIntv = null;
    }
  }


  var last_g_time = g_time;
  var last_measured = Date.now();
  setInterval(() => {
    var delta_g_time = g_time - last_g_time;
    var now = Date.now();
    var delta_real_time = now - last_measured;

    var mspf = delta_real_time / delta_g_time;

    fpsSpan.innerHTML = Math.round(1 / (mspf / 1000) * 10) / 10;
    last_g_time = g_time;
    last_measured = now;
  }, 500);
  

  // Clear <canvas>
  // clearCanvas(gl);

  // renderScene(gl);

}

function renderScene(gl){
  // Clear <canvas>
  clearCanvas(gl);

  const furLight = [255/255, 153/255, 20/255]
  const furDark = [173/255, 104/255, 14/255];
  const white = furLight;
  const black = [0, 0, 0];
  const nose = [235/255, 89/255, 121/255];

  // Proximal Tail
  var proximalTail = new Cube(new Matrix4(), furLight, [0.03, 0.03, 0.08]);
  proximalTail.matrix.translate(0.008, 0.025, 0.06);
  proximalTail.matrix.rotate(proxTYSlider.valueAsNumber, 0, 1, 0);
  proximalTail.matrix.rotate(proxTXSlider.valueAsNumber, 1, 0, 0);
  proximalTail.matrix.translate(0, 0, 0.08/2);
  
  // Mid Tail
  var midTail = new Cube(new Matrix4(), furDark, [0.025, 0.025, 0.085]);
  midTail.matrix.multiply(proximalTail.matrix);
  midTail.matrix.translate(0, 0, .13 - 0.085/2);
  midTail.matrix.rotate(midTYSlider.valueAsNumber, 0, 1, 0);
  midTail.matrix.rotate(midTXSlider.valueAsNumber, 1, 0, 0);
  midTail.matrix.translate(0, 0, 0.085/2);

  // Distal Tail
  var distalTail = new Cube(new Matrix4(), furLight, [0.02, 0.02, 0.09]);
  distalTail.matrix.multiply(midTail.matrix);
  distalTail.matrix.translate(0, 0, .14 - 0.09/2);
  distalTail.matrix.rotate(distTYSlider.valueAsNumber, 0, 1, 0);
  distalTail.matrix.rotate(distTXSlider.valueAsNumber, 1, 0, 0);
  distalTail.matrix.translate(0, 0, 0.09/2);
  
  
  // Head
  var head = new Cube(new Matrix4(), furLight, [0.13, 0.13, 0.13]);
  head.matrix.translate(0.0, 0.086, -0.627);
  head.matrix.rotate(0.0, 0.0, 0.0, -1.0);  
  

  // Left Ear
  var noseFacesColors = Array(8).fill(furDark);
  noseFacesColors[2] = nose;
  
  var leftEar = new Cube(new Matrix4(), noseFacesColors, [0.05, 0.05, 0.005]);
  leftEar.matrix.translate(-0.06, 0.196, -0.707);
  leftEar.matrix.rotate(54.17, 0.22, -0.54, -0.81);  
  
  // Left Eye
  var leftEye = new Cube(new Matrix4(), black, [0.01, 0.03, 0.0]);
  leftEye.matrix.translate(-0.064, 0.142, -0.763);
  leftEye.matrix.rotate(0.0, 0.0, 0.0, -1.0);

  // Left-Bottom Whisker
  var leftBottomWhisker = new Cube(new Matrix4(), black, [0.01, 0.04, 0.0]);
  leftBottomWhisker.matrix.translate(-0.124, 0.037, -0.763);
  leftBottomWhisker.matrix.rotate(73.32, 0.0, 0.0, -1.0);  

  // Left-Top Whisker
  var leftTopWhisker = new Cube(new Matrix4(), black, [0.01, 0.04, 0.0]);
  leftTopWhisker.matrix.translate(-0.124, 0.086, -0.763);
  leftTopWhisker.matrix.rotate(73.32, 0.0, 0.0, 1.0);
  
  // Nose Top
  var noseTop = new Cube(new Matrix4(), nose, [0.03, 0.01, 0.0]);
  noseTop.matrix.translate(0.0, 0.072, -0.765);
  noseTop.matrix.rotate(0.0, 0.0, 0.0, -1.0);

  // NoseBottom
  var nosebottom = new Cube(new Matrix4(), nose, [0.01, 0.01, 0.0]);
  nosebottom.matrix.translate(0.0, 0.049, -0.765);
  nosebottom.matrix.rotate(0.0, 0.0, 0.0, -1.0);  

  // Right Ear
  var rightEar = new Cube(new Matrix4(), noseFacesColors, [0.05, 0.05, 0.005]);
  rightEar.matrix.translate(0.06, 0.196, -0.707);
  rightEar.matrix.rotate(54.17, -0.22, 0.54, -0.81);  

  // Right Eye
  var rightEye = new Cube(new Matrix4(), black, [0.01, 0.03, 0.0]);
  rightEye.matrix.translate(0.064, 0.142, -0.763);
  rightEye.matrix.rotate(0.0, 0.0, 0.0, -1.0);
  
  // Right-Bottom Whisker
  var rightBottomWhisker = new Cube(new Matrix4(), black, [0.01, 0.04, 0.0]);
  rightBottomWhisker.matrix.translate(0.124, 0.037, -0.763);
  rightBottomWhisker.matrix.rotate(106.68, 0.0, 0.0, -1.0);

  // Right-Top Whisker
  var rightTopWhisker = new Cube(new Matrix4(), black, [0.01, 0.04, 0.0]);
  rightTopWhisker.matrix.translate(0.124, 0.086, -0.763);
  rightTopWhisker.matrix.rotate(106.69, 0.0, -0.0, 1.0);
  
  // Party Hat
  var partyHat = new Cone(new Matrix4(), [1, .3, .3], .08, .16);
  partyHat.matrix.translate(0.0, 0.2 + hatHeight, -0.6);


  // Body
  var body = new Cube(new Matrix4(), furLight, [0.12, 0.07, 0.26]);
  body.matrix.translate(0.0, -0.014, -0.238);
  body.matrix.rotate(0.0, 0.0, 0.0, -1.0);
  
  

  // Left-Back Leg
  var leftBackLeg = new Cube(new Matrix4(), furDark, [0.03, 0.1, 0.03]);
  leftBackLeg.matrix.translate(-0.086, -0.178, -0.015);
  leftBackLeg.matrix.translate(0, 0.07, 0.015);
  leftBackLeg.matrix.rotate(leftLegsRot, 1.0, 0.0, -0.0);
  leftBackLeg.matrix.translate(0, -0.07, -0.015);
  // Left-Back Toe
  var leftBackToe = new Cube(new Matrix4(leftBackLeg.matrix), white, [0.03, 0.02, 0.03]);
  leftBackToe.matrix.translate(0, -0.254 + .178, -0.040);
  

  // Left-Front Leg
  var leftFrontLeg = new Cube(new Matrix4(), furDark, [0.03, 0.1, 0.03]);
  leftFrontLeg.matrix.translate(-0.086, -0.178, -0.455);
  leftFrontLeg.matrix.translate(0, 0.07, 0.015);
  leftFrontLeg.matrix.rotate(leftLegsRot, 1.0, 0.0, -0.0);
  leftFrontLeg.matrix.translate(0, -0.07, -0.015);
  // Left-Front Toe
  var leftFrontToe = new Cube(new Matrix4(leftFrontLeg.matrix), white, [0.03, 0.02, 0.03]);
  leftFrontToe.matrix.translate(0, -0.254 + .178, -0.494 + .455);
  

  // Right-Front Leg
  var rightFrontLeg = new Cube(new Matrix4(), furDark, [0.03, 0.1, 0.03]);
  rightFrontLeg.matrix.translate(0.086, -0.178, -0.455);
  rightFrontLeg.matrix.translate(0, 0.07, 0.015);
  rightFrontLeg.matrix.rotate(rightLegsRot, 1.0, 0.0, -0.0);
  rightFrontLeg.matrix.translate(0, -0.07, -0.015);
  // Right-Front Toe
  var rightFrontToe = new Cube(new Matrix4(rightFrontLeg.matrix), white, [0.03, 0.02, 0.03]);
  rightFrontToe.matrix.translate(0, -0.254 + .178, -0.494 + .455);
  
  
  // Right-Back Leg
  var rightBackLeg = new Cube(new Matrix4(), furDark, [0.03, 0.1, 0.03]);
  rightBackLeg.matrix.translate(0.086, -0.178, -0.015);
  rightBackLeg.matrix.translate(0, 0.07, 0.015);
  rightBackLeg.matrix.rotate(rightLegsRot, 1.0, 0.0, -0.0);
  rightBackLeg.matrix.translate(0, -0.07, -0.015);
  // Right-Back Toe
  var rightBackToe = new Cube(new Matrix4(rightBackLeg.matrix), white, [0.03, 0.02, 0.03]);
  rightBackToe.matrix.translate(0, -0.254 + .178, -.040);
  
  
  proximalTail.render(gl, a_Position, u_FragColor, u_Matrix);
  midTail.render(gl, a_Position, u_FragColor, u_Matrix);
  distalTail.render(gl, a_Position, u_FragColor, u_Matrix);
  head.render(gl, a_Position, u_FragColor, u_Matrix);
  leftEar.render(gl, a_Position, u_FragColor, u_Matrix);
  leftEye.render(gl, a_Position, u_FragColor, u_Matrix);
  leftBottomWhisker.render(gl, a_Position, u_FragColor, u_Matrix);
  leftTopWhisker.render(gl, a_Position, u_FragColor, u_Matrix);
  noseTop.render(gl, a_Position, u_FragColor, u_Matrix);
  nosebottom.render(gl, a_Position, u_FragColor, u_Matrix);
  rightEar.render(gl, a_Position, u_FragColor, u_Matrix);
  rightEye.render(gl, a_Position, u_FragColor, u_Matrix);
  rightBottomWhisker.render(gl, a_Position, u_FragColor, u_Matrix);
  rightTopWhisker.render(gl, a_Position, u_FragColor, u_Matrix);
  body.render(gl, a_Position, u_FragColor, u_Matrix);
  leftBackLeg.render(gl, a_Position, u_FragColor, u_Matrix);
  leftFrontLeg.render(gl, a_Position, u_FragColor, u_Matrix);
  rightFrontToe.render(gl, a_Position, u_FragColor, u_Matrix);
  rightBackLeg.render(gl, a_Position, u_FragColor, u_Matrix);
  rightFrontLeg.render(gl, a_Position, u_FragColor, u_Matrix);
  leftFrontToe.render(gl, a_Position, u_FragColor, u_Matrix);
  leftBackToe.render(gl, a_Position, u_FragColor, u_Matrix);
  rightBackToe.render(gl, a_Position, u_FragColor, u_Matrix);
  partyHat.render(gl, a_Position, u_FragColor, u_Matrix);
  
}
