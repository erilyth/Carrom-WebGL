var canvas,gl,program;

var rectangles = {};
var circles = {};

function compileShader(gl, shaderSource, shaderType) {
  // Create the shader object
  var shader = gl.createShader(shaderType);
 
  // Set the shader source code.
  gl.shaderSource(shader, shaderSource);
 
  // Compile the shader
  gl.compileShader(shader);
 
  // Check if it compiled
  var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    // Something went wrong during compilation; get the error
    throw "could not compile shader:" + gl.getShaderInfoLog(shader);
  }
 
  return shader;
}
////////////
function createShaderFromScriptTag(gl, scriptId, opt_shaderType) {
// look up the script tag by id.
		var shaderScript = document.getElementById(scriptId);
		if (!shaderScript) {
  		throw("*** Error: unknown script element" + scriptId);
		}

// extract the contents of the script tag.
		var shaderSource = shaderScript.text;

// If we didn't pass in a type, use the 'type' from
// the script tag.
		if (!opt_shaderType) {
  		if (shaderScript.type == "x-shader/x-vertex") {
    			opt_shaderType = gl.VERTEX_SHADER;
  		} 
  		else if (shaderScript.type == "x-shader/x-fragment") {
    			opt_shaderType = gl.FRAGMENT_SHADER;
  		}
  		else if (!opt_shaderType) {
    			throw("*** Error: shader type not set");
  		}
		}
		return compileShader(gl, shaderSource, opt_shaderType);
};
/////////////////
function createProgram(gl, vertexShader, fragmentShader) {
  // create a program.
  var program = gl.createProgram();
 
  // attach the shaders.
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
 
  // link the program.
  gl.linkProgram(program);
 
  // Check if it linked.
  var success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
      // something went wrong with the link
      throw ("program filed to link:" + gl.getProgramInfoLog (program));
  }
 
  return program;
};
//////////////////////////
function createProgramFromScripts(gl, vertexShaderId, fragmentShaderId) {
  var vertexShader = createShaderFromScriptTag(gl, vertexShaderId);
  var fragmentShader = createShaderFromScriptTag(gl, fragmentShaderId);
  return createProgram(gl, vertexShader, fragmentShader);
}

function Initialize()
{
	canvas = document.getElementById("canvas");

	gl = canvas.getContext("experimental-webgl");
	 
	// setup a GLSL program
	program = createProgramFromScripts(gl,"2d-vertex-shader", "2d-fragment-shader");
	gl.useProgram(program);

  var color = [
    254,  240,  195,  1.0
  ];
  drawRectangle('boardbase', {'x':0, 'y':0}, 2, 2, color);

  var color2 = [
    125, 125, 78, 1.0
  ];
  drawCircle('striker', {'x':0, 'y':0}, 0.1, color2, 50);
  setInterval(drawScene, 50);
}

function drawScene(){
  for(var key in rectangles){
    var rectangle = rectangles[key];
    drawRectangle(key, {'x':rectangle['center']['x'], 'y':rectangle['center']['y']}, rectangle['height'], rectangle['width'], rectangle['color']);
  }
  for(var key in circles){
    circles[key].center['x'] += 0.01;
    var circle = circles[key];
    drawCircle(key, {'x':circle['center']['x'], 'y':circle['center']['y']}, circle['radius'], circle['color'], 50);
  }
}

function drawRectangle(name, center, height, width, color){
  for (var i = 0; i < color.length; i++) {
    if (i%4 != 3){
      color[i] /= 255.0;
    }
  } 

  //Setup the color variable for the shader
  var vertexColor = gl.getAttribLocation(program, "a_color");
  var colors = [
    color[0], color[1], color[2], color[3],    // white
    color[0], color[1], color[2], color[3],    // white
    color[0], color[1], color[2], color[3],    // white
    color[0], color[1], color[2], color[3],    // white
    color[0], color[1], color[2], color[3],    // white
    color[0], color[1], color[2], color[3]    // white
  ];
  var colorbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(vertexColor);
  gl.vertexAttribPointer(vertexColor, 4, gl.FLOAT, false, 0, 0);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
   
  // Create a buffer and put a single clipspace rectangle in
  // it (2 triangles)
  //console.log(center.x - width/2, center.y - height/2);
  var vertices = [
    center.x - width/2, center.y - height/2,
    center.x + width/2, center.y - height/2,
    center.x - width/2, center.y + height/2,
    center.x + width/2, center.y - height/2,
    center.x + width/2, center.y + height/2,
    center.x - width/2, center.y + height/2
  ];
  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // draw
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  console.log(color);
  var object = {'color':[color[0]*255,color[1]*255,color[2]*255,color[3]], 'center':center, 'height':height, 'width':width};
  rectangles[name] = object;
}

function drawCircle(name, center, radius, color, triangles){

  color[0]/=255.0;
  color[1]/=255.0;
  color[2]/=255.0;

  var colors = [];

  for(var i=0; i<triangles*3; i++){
    colors.push(color[0]);
    colors.push(color[1]);
    colors.push(color[2]);
    colors.push(color[3]);
  }

  //Setup the color variable for the shader
  var vertexColor = gl.getAttribLocation(program, "a_color");
  var colorbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(vertexColor);
  gl.vertexAttribPointer(vertexColor, 4, gl.FLOAT, false, 0, 0);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position");
   
  // Create a buffer and put a single clipspace rectangle in
  // it (2 triangles)
  //console.log(center.x - width/2, center.y - height/2);
  
  var vertices = [];
  var angle=(2*3.1415/triangles);
  var current_angle = 0;

  for(var i=0; i<triangles; i++){
    vertices.push(center.x);
    vertices.push(center.y);
    vertices.push(center.x + radius*Math.cos(current_angle));
    vertices.push(center.y + radius*Math.sin(current_angle));
    vertices.push(center.x + radius*Math.cos(current_angle+angle));
    vertices.push(center.y + radius*Math.sin(current_angle+angle));
    current_angle += angle;
  }

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  // draw
  gl.drawArrays(gl.TRIANGLES, 0, 3*triangles);

  var object = {'color':[color[0]*255,color[1]*255,color[2]*255,color[3]], 'center':center, 'radius':radius};
  circles[name] = object;
}