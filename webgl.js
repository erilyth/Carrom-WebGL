var canvas,gl,program;

var models = {};

var viewMatrix = makeScale(1, 1, 1);

function initViewport(gl, canvas)
{
  gl.viewport(0, 0, canvas.width, canvas.height);
}

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
	initViewport(gl, canvas);
	// setup a GLSL program
	program = createProgramFromScripts(gl,"2d-vertex-shader", "2d-fragment-shader");
	gl.useProgram(program);

  viewMatrix = makeYRotation(0 * (3.14/180));
  makeModel('cube1', 0, 0, 0, 0.2, 0.2, 0.2, 'cube.data')

  setInterval(drawScene, 50);
}

var temp = 0;

function drawScene(){
  for(var key in models){
    var model = models[key];
    console.log(model);
    //temp += 0.01
    model['center'][0] += 0.01;
    viewMatrix = makeYRotation(temp);
    createModel('cubex', model['center'][0], model['center'][1], model['center'][2], model['scale'][0],  model['scale'][1],  model['scale'][2], model['filedata'], model['filename']);
  }
}

function makeTranslation(tx, ty, tz) {
  return [
     1,  0,  0,  0,
     0,  1,  0,  0,
     0,  0,  1,  0,
     tx, ty, tz, 1
  ];
}
 
function makeXRotation(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);
 
  return [
    1, 0, 0, 0,
    0, c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ];
};
 
function makeYRotation(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);
 
  return [
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ];
};
 
function makeZRotation(angleInRadians) {
  var c = Math.cos(angleInRadians);
  var s = Math.sin(angleInRadians);
 
  return [
     c, s, 0, 0,
    -s, c, 0, 0,
     0, 0, 1, 0,
     0, 0, 0, 1,
  ];
}
 
function makeScale(sx, sy, sz) {
  return [
    sx, 0,  0,  0,
    0, sy,  0,  0,
    0,  0, sz,  0,
    0,  0,  0,  1,
  ];
}

function openFile(name, x_pos, y_pos, z_pos, x_scale, y_scale, z_scale, filename){
  var datastring;
  $.ajax({
    url : filename,
    dataType: "text",
    success : function (data) {
      datastring = data;
      createModel(name, x_pos, y_pos, z_pos, x_scale, y_scale, z_scale, datastring, filename);
    }
  });
}

function makeModel(name, x_pos, y_pos, z_pos, x_scale, y_scale, z_scale, filename){
  openFile(name, x_pos, y_pos, z_pos, x_scale, y_scale, z_scale, filename);
}

function createModel(name, x_pos, y_pos, z_pos, x_scale, y_scale, z_scale, filedata, filename) //Create object from blender
{
    var vertex_buffer_data = [];
    var color_buffer_data = [];
    var points = [];
    var len=0;
    var line;
    var a,b,c;
    var start=0;
    var lines = filedata.split('\n');
    for (var j=0; j<lines.length; j++){
      var words = lines[j].split(' ');
      if(words[0] == "v"){
          var cur_point = {};
          cur_point['x']=parseFloat(words[1]) + x_pos;
          cur_point['y']=parseFloat(words[2]) + y_pos;
          cur_point['z']=parseFloat(words[3]) + z_pos;
          //console.log(words);
          points.push(cur_point);
      }
    }
    //console.log(points);
    var temp;
    var lines = filedata.split('\n');
    for (var jj=0; jj<lines.length; jj++){
      var words = lines[jj].split(' ');
      if(words[0] == "f"){
          var t = [];
          var linemod = lines[jj].substring(1);
          var j,ans=0,tt=0,state=0;
          for(j=0;j<linemod.length;j++){
              if(linemod[j]==' '){
                  ans=0;
                  state=1;
              }
              else if(linemod[j]=='/' && ans!=0 && state==1){
                  t.push(ans);
                  state=0;
              }
              else if(linemod[j]!='/'){
                  ans=ans*10+linemod.charCodeAt(j)-'0'.charCodeAt(0);
              }
          }
          t.push(ans);
          var my_triangle = {};
          my_triangle['p1'] = t[0]-1;
          my_triangle['p2'] = t[1]-1;
          my_triangle['p3'] = t[2]-1;
          vertex_buffer_data.push(points[my_triangle['p1']]['x']*x_scale);
          vertex_buffer_data.push(points[my_triangle['p1']]['y']*y_scale);
          vertex_buffer_data.push(points[my_triangle['p1']]['z']*z_scale);
          vertex_buffer_data.push(points[my_triangle['p2']]['x']*x_scale);
          vertex_buffer_data.push(points[my_triangle['p2']]['y']*y_scale);
          vertex_buffer_data.push(points[my_triangle['p2']]['z']*z_scale);
          vertex_buffer_data.push(points[my_triangle['p3']]['x']*x_scale);
          vertex_buffer_data.push(points[my_triangle['p3']]['y']*y_scale);
          vertex_buffer_data.push(points[my_triangle['p3']]['z']*z_scale);
      }
      if(words[0] == 'c'){
          var r1,g1,b1,r2,g2,b2,r3,g3,b3;
          r1 = words[1]; g1 = words[2]; b1 = words[3];
          r2 = words[4]; g2 = words[5]; b2 = words[6];
          r3 = words[7]; g3 = words[8]; b3 = words[9];      
          color_buffer_data.push(r1/255.0);
          color_buffer_data.push(g1/255.0);
          color_buffer_data.push(b1/255.0);
          color_buffer_data.push(1.0);
          color_buffer_data.push(r2/255.0);
          color_buffer_data.push(g2/255.0);
          color_buffer_data.push(b2/255.0);
          color_buffer_data.push(1.0);
          color_buffer_data.push(r3/255.0);
          color_buffer_data.push(g3/255.0);
          color_buffer_data.push(b3/255.0);
          color_buffer_data.push(1.0);
      }
    }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    var vertexColor = gl.getAttribLocation(program, "a_color");
    var colorbuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color_buffer_data), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(vertexColor);
    gl.vertexAttribPointer(vertexColor, 4, gl.FLOAT, false, 0, 0);

    var positionLocation = gl.getAttribLocation(program, "a_position");
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_buffer_data), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

    var u_matrix = gl.getUniformLocation(program, "u_matrix");
    //matrix = matrixMultiply(matrix, makeYRotation(69 * (3.14/180)));
    gl.uniformMatrix4fv(u_matrix, false, viewMatrix);

    //console.log(vertex_buffer_data);
    console.log(vertex_buffer_data.length);

    // draw
    gl.drawArrays(gl.TRIANGLES, 0, vertex_buffer_data.length/3);
    var mymodel = {'center':[x_pos,y_pos,z_pos], 'scale':[x_scale,y_scale,z_scale], 'name':name, 'filedata':filedata, 'filename':filename};
    models[name] = mymodel;
}