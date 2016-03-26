var canvas,gl,program;

var models = {};
var coins = {};

var overlapMargin = 0.0002;
var screenVisible = 0;
var boundaryX = 0.64, boundaryY = 0.64;
var friction = 0.95;
var minSpeedLimit = 0.001;
var collisionOffset = 0.033;
var startBoundary = 0.5;
var mouseX=0, mouseY=0, mouseZ=0;
var gamePhase = 0;

var shootAngle = 0;
var shootPower = 2; //Default parameters

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

  canvas.addEventListener('mousedown', function(evt) {
    mouseClick(canvas, evt);
  }, false);
	
  canvas.addEventListener('mousemove', function(evt) {
    getMousePos(canvas, evt);
  }, false);

  gl = canvas.getContext("experimental-webgl");
	initViewport(gl, canvas);
	// setup a GLSL program
	program = createProgramFromScripts(gl,"2d-vertex-shader", "2d-fragment-shader");
	gl.useProgram(program);

  //Set this MVPMatrix before calling the makeModel function, this can be treated as the camera.
  //**Assuming individual objects won't have any rotation!! To do this store separate matrices for each object
  // which would give us the individual scaling/rotation of each object. 
  //MVPMatrix = makePerspective(180 * (3.14/180), 1, 0, 5000);
  makeModel('boardinner', 0, 0, 0, 1.5, 1.5, 0.03, 0, 0, 0, 'boardinner.data', 0);
  
  makeModel('boardouter1', 0, 0.75, 0, 1.6, 0.1, 0.15, 0, 0, 0, 'boardouter.data', 0);
  makeModel('boardouter2', 0, -0.75, 0, 1.6, 0.1, 0.15, 0, 0, 0, 'boardouter.data', 0);
  makeModel('boardouter3', -0.75, 0, 0, 0.1, 1.6, 0.15, 0, 0, 0,  'boardouter.data', 0);
  makeModel('boardouter4', 0.75, 0, 0, 0.1, 1.6, 0.15, 0, 0, 0, 'boardouter.data', 0);
  
  makeModel('boardline', 0, 0, -overlapMargin, 1.1, 1.1, 0.03, 0, 0, 0, 'boardouter.data', 0);
  makeModel('boardline2', 0, 0, -2*overlapMargin, 1.08, 1.08, 0.03, 0, 0, 0, 'boardinner.data', 0);
 
  makeModel('cylindercenter1', 0, 0, 0, 0.2, 0.2, 0.018, 0, 0, 0, 'cylinder.data', 0);
  makeModel('cylindercenter2', 0, 0, 0, 0.185, 0.185, 0.018+overlapMargin, 0, 0, 0, 'cylinderlight.data', 0);
  
  makeModel('cylinderside1', -0.506, -0.506, 0, 0.035, 0.035, 0.018, 0, 0, 0, 'cylinder.data', 0);
  makeModel('cylinderside2', -0.506, -0.506, 0, 0.025, 0.025, 0.018+overlapMargin, 0, 0, 0, 'cylinderlight.data', 0);
  makeModel('cylinderside3', 0.506, -0.506, 0, 0.035, 0.035, 0.018, 0, 0, 0, 'cylinder.data', 0);
  makeModel('cylinderside4', 0.506, -0.506, 0, 0.025, 0.025, 0.018+overlapMargin, 0, 0, 0, 'cylinderlight.data', 0);
  makeModel('cylinderside5', -0.506, 0.506, 0, 0.035, 0.035, 0.018, 0, 0, 0, 'cylinder.data', 0);
  makeModel('cylinderside6', -0.506, 0.506, 0, 0.025, 0.025, 0.018+overlapMargin, 0, 0, 0, 'cylinderlight.data', 0);
  makeModel('cylinderside7', 0.506, 0.506, 0, 0.035, 0.035, 0.018, 0, 0, 0, 'cylinder.data', 0);
  makeModel('cylinderside8', 0.506, 0.506, 0, 0.025, 0.025, 0.018+overlapMargin, 0, 0, 0, 'cylinderlight.data', 0);
  
  makeModel('goal1', -0.66, -0.66, 0, 0.055, 0.055, 0.018, 0, 0, 0, 'cylinder.data', 0);
  makeModel('goal2', 0.66, -0.66, 0, 0.055, 0.055, 0.018, 0, 0, 0, 'cylinder.data', 0);
  makeModel('goal3', -0.66, 0.66, 0, 0.055, 0.055, 0.018, 0, 0, 0, 'cylinder.data', 0);
  makeModel('goal4', 0.66, 0.66, 0, 0.055, 0.055, 0.018, 0, 0, 0, 'cylinder.data', 0);
  makeModel('goal1inner', -0.66, -0.66, 0, 0.05, 0.05, 0.018+overlapMargin, 0, 0, 0, 'cylindergrey.data', 0);
  makeModel('goal2inner', 0.66, -0.66, 0, 0.05, 0.05, 0.018+overlapMargin, 0, 0, 0, 'cylindergrey.data', 0);
  makeModel('goal3inner', -0.66, 0.66, 0, 0.05, 0.05, 0.018+overlapMargin, 0, 0, 0, 'cylindergrey.data', 0);
  makeModel('goal4inner', 0.66, 0.66, 0, 0.05, 0.05, 0.018+overlapMargin, 0, 0, 0, 'cylindergrey.data', 0);
  
  makeModel('striker', 0, -startBoundary, -0.03, 0.05, 0.05, 0.01, 0, 0, 0, 'cylindergrey.data', 1);

  var radius = 0.11;
  var angleOffset = 360/8; //6 is the number of coins to place

  makeModel('black1', radius*Math.cos(0 * angleOffset * (3.14/180)), radius*Math.sin(0 * angleOffset * (3.14/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinblack.data', 1);
  makeModel('white1', radius*Math.cos(1 * angleOffset * (3.14/180)), radius*Math.sin(1 * angleOffset * (3.14/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinwhite.data', 1);
  makeModel('black2', radius*Math.cos(2 * angleOffset * (3.14/180)), radius*Math.sin(2 * angleOffset * (3.14/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinblack.data', 1);
  makeModel('white2', radius*Math.cos(3 * angleOffset * (3.14/180)), radius*Math.sin(3 * angleOffset * (3.14/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinwhite.data', 1);
  makeModel('black3', radius*Math.cos(4 * angleOffset * (3.14/180)), radius*Math.sin(4 * angleOffset * (3.14/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinblack.data', 1);
  makeModel('white3', radius*Math.cos(5 * angleOffset * (3.14/180)), radius*Math.sin(5 * angleOffset * (3.14/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinwhite.data', 1);
  makeModel('black4', radius*Math.cos(6 * angleOffset * (3.14/180)), radius*Math.sin(6 * angleOffset * (3.14/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinblack.data', 1);
  makeModel('white4', radius*Math.cos(7 * angleOffset * (3.14/180)), radius*Math.sin(7 * angleOffset * (3.14/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinwhite.data', 1);
  makeModel('red', 0, 0, -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinred.data', 1);
  
  setInterval(drawScene, 15); //(1000/15) fps
}

function isCollidingX(coin1, coin2){
  //console.log(coin1['center'][0],coin2['center'][0]);
  //console.log(coin1['scale'][0],coin2['scale'][0]);
  if(coin1['center'][1]+coin1['scale'][1]/2 + collisionOffset >= coin2['center'][1]-coin2['scale'][1]/2 && coin1['center'][1]-coin1['scale'][1]/2 <= coin2['center'][1]+coin2['scale'][1]/2 + collisionOffset){
    if(coin1['center'][0]+coin1['scale'][0]/2 + collisionOffset >= coin2['center'][0]-coin2['scale'][0]/2 && coin1['center'][0]-coin1['scale'][0]/2 <= coin2['center'][0]+coin2['scale'][0]/2 + collisionOffset)
      return 1;
  }
  return 0;
}

function isCollidingY(coin1, coin2){
  if(coin1['center'][0]+coin1['scale'][0]/2 + collisionOffset >= coin2['center'][0]-coin2['scale'][0]/2 && coin1['center'][0]-coin1['scale'][0]/2 <= coin2['center'][0]+coin2['scale'][0]/2 + collisionOffset){
    if(coin1['center'][1]+coin1['scale'][1]/2 + collisionOffset >= coin2['center'][1]-coin2['scale'][1]/2 && coin1['center'][1]-coin1['scale'][1]/2 <= coin2['center'][1]+coin2['scale'][1]/2 + collisionOffset)
      return 1;
  }
  return 0; 
}

function checkCollisions(){
  for(var key1 in coins){
    for(var key2 in coins){
      if(key1 == key2 || key1 >= key2)
        continue;
      var coin1 = coins[key1];
      var coin2 = coins[key2];
      if(isCollidingX(coin1, coin2) || isCollidingY(coin1, coin2)){
        coin1['center'][0] -= coin1['speed'][0];
        coin2['center'][0] -= coin2['speed'][0];
        coin1['center'][1] -= coin1['speed'][1];
        coin2['center'][1] -= coin2['speed'][1];
        var speed1x = coin1['speed'][0];
        var speed1y = coin1['speed'][1];
        var speed2x = coin2['speed'][0];
        var speed2y = coin2['speed'][1];
        var slopecol = 10000000000; //Slope is infinity
        if (coin2['center'][0] != coin1['center'][0]){
          slopecol = (coin2['center'][1]-coin1['center'][1])/(coin2['center'][0]-coin1['center'][0]);
        }
        var slopeperp = 10000000000;
        if(slopecol != 0)
          slopeperp = -1/slopecol;
        var anglecolx = Math.atan(slopecol);
        var anglecoly = (90-anglecolx*(180/Math.PI))*(Math.PI/180);
        var angleperpx = Math.atan(slopeperp);
        var angleperpy = (90-angleperpx*(180/Math.PI))*(Math.PI/180);
        var speed1col = speed2y*Math.cos(anglecoly) + speed2x*Math.cos(anglecolx);
        var speed1perp = speed2y*Math.cos(angleperpy) + speed2x*Math.cos(angleperpx);
        var speed2col = speed1y*Math.cos(anglecoly) + speed1x*Math.cos(anglecolx);
        var speed2perp = speed1y*Math.cos(angleperpy) + speed1x*Math.cos(angleperpx);
        var speed1xnew = speed1col*Math.cos(anglecolx) + speed1perp*Math.cos(angleperpx);
        var speed1ynew = speed1col*Math.cos(anglecoly) + speed1perp*Math.cos(angleperpy);
        var speed2xnew = speed2col*Math.cos(anglecolx) + speed2perp*Math.cos(angleperpx);
        var speed2ynew = speed2col*Math.cos(anglecoly) + speed2perp*Math.cos(angleperpy);
        //console.log(anglecolx*(180/Math.PI),anglecoly*(180/Math.PI), angleperpx*(180/Math.PI), angleperpy*(180/Math.PI));
        //console.log('speed old',coin1['speed'][0],coin1['speed'][1], coin2['speed'][0], coin2['speed'][1]);
        //console.log('speeds',speed1xnew,speed1ynew, speed2xnew, speed2ynew);
        var own = 0.92;
        var other = 1 - own;
        coin1['speed'][0] = own*speed1xnew + other*speed2xnew;
        coin1['speed'][1] = own*speed1ynew + other*speed2ynew;
        coin2['speed'][0] = own*speed2xnew + other*speed1xnew;
        coin2['speed'][1] = own*speed2ynew + other*speed1ynew;
        coin1['center'][0] += speed1xnew;
        coin2['center'][0] += speed2xnew;
        coin1['center'][1] += speed1ynew;
        coin2['center'][1] += speed2ynew;
      }
      coins[key1] = coin1;
      coins[key2] = coin2;
    }
  }
}

function moveCoins(){
  for(var key in coins){
    var coin1 = coins[key];
    //console.log(coin1['speed'][0], coin1['speed'][1]);
    if (Math.abs(coin1['speed'][0]) <= minSpeedLimit){
      coin1['speed'][0] = 0;
    }
    if (Math.abs(coin1['speed'][1]) <= minSpeedLimit){
      coin1['speed'][1] = 0;
    }
    coin1['center'][0] += coin1['speed'][0];
    if (coin1['center'][0] >= boundaryX){
      coin1['center'][0] = boundaryX;
      coin1['speed'][0] *= -0.7;
    }
    checkCollisions();
    if (coin1['center'][0] <= -boundaryX){
      coin1['center'][0] = -boundaryX;
      coin1['speed'][0] *= -0.7;
    }
    checkCollisions();
    coin1['center'][1] += coin1['speed'][1];
    if (coin1['center'][1] >= boundaryY){
      coin1['center'][1] = boundaryY;
      coin1['speed'][1] *= -0.7;
    }
    checkCollisions();
    if (coin1['center'][1] <= -boundaryY){
      coin1['center'][1] = -boundaryY;
      coin1['speed'][1] *= -0.7;
    }
    checkCollisions();
    coin1['speed'][0] *= friction;
    coin1['speed'][1] *= friction;
    coins[key] = coin1;
  }
}

var temp = 0;

// 0 1 2 3        0 1 2 3
// 4 5 6 7        4 5 6 7
// 8 9 10 11      8 9 10 11
// 12 13 14 15    12 13 14 15
function matrixMultiply(mat1, mat2){
  return [
    mat1[0]*mat2[0]+mat1[1]*mat2[4]+mat1[2]*mat2[8]+mat1[3]*mat2[12],
    mat1[0]*mat2[1]+mat1[1]*mat2[5]+mat1[2]*mat2[9]+mat1[3]*mat2[13],
    mat1[0]*mat2[2]+mat1[1]*mat2[6]+mat1[2]*mat2[10]+mat1[3]*mat2[14],
    mat1[0]*mat2[3]+mat1[1]*mat2[7]+mat1[2]*mat2[11]+mat1[3]*mat2[15],
    mat1[4]*mat2[0]+mat1[5]*mat2[4]+mat1[6]*mat2[8]+mat1[7]*mat2[12],
    mat1[4]*mat2[1]+mat1[5]*mat2[5]+mat1[6]*mat2[9]+mat1[7]*mat2[13],
    mat1[4]*mat2[2]+mat1[5]*mat2[6]+mat1[6]*mat2[10]+mat1[7]*mat2[14],
    mat1[4]*mat2[3]+mat1[5]*mat2[7]+mat1[6]*mat2[11]+mat1[7]*mat2[15],
    mat1[8]*mat2[0]+mat1[9]*mat2[4]+mat1[10]*mat2[8]+mat1[11]*mat2[12],
    mat1[8]*mat2[1]+mat1[9]*mat2[5]+mat1[10]*mat2[9]+mat1[11]*mat2[13],
    mat1[8]*mat2[2]+mat1[9]*mat2[6]+mat1[10]*mat2[10]+mat1[11]*mat2[14],
    mat1[8]*mat2[3]+mat1[9]*mat2[7]+mat1[10]*mat2[11]+mat1[11]*mat2[15],
    mat1[12]*mat2[0]+mat1[13]*mat2[4]+mat1[14]*mat2[8]+mat1[15]*mat2[12],
    mat1[12]*mat2[1]+mat1[13]*mat2[5]+mat1[14]*mat2[9]+mat1[15]*mat2[13],
    mat1[12]*mat2[2]+mat1[13]*mat2[6]+mat1[14]*mat2[10]+mat1[15]*mat2[14],
    mat1[12]*mat2[3]+mat1[13]*mat2[7]+mat1[14]*mat2[11]+mat1[15]*mat2[15]
  ];
}

function matrixMultiply4x1(mat1, mat2){
  return [
    mat1[0]*mat2[0]+mat1[1]*mat2[1]+mat1[2]*mat2[2]+mat1[3]*mat1[3],
    mat1[4]*mat2[0]+mat1[5]*mat2[1]+mat1[6]*mat2[2]+mat1[7]*mat1[3],
    mat1[8]*mat2[0]+mat1[9]*mat2[1]+mat1[10]*mat2[2]+mat1[11]*mat1[3],
    mat1[12]*mat2[0]+mat1[13]*mat2[1]+mat1[14]*mat2[2]+mat1[15]*mat1[3]
  ];
}

var temp = 0.0;

function getCamera(){
  var cameraMatrix = makeScale(1, 1, 1);
  //cameraMatrix = makeScale(0.56, 0.56, 0.56);
  //cameraMatrix = matrixMultiply(cameraMatrix, makeXRotation(90 * (3.14/180)));
  //cameraMatrix = matrixMultiply(cameraMatrix, makeYRotation(temp * (3.14/180)));
  //cameraMatrix = matrixMultiply(cameraMatrix, makeXRotation(-40 * (3.14/180)));
  return cameraMatrix;
}

function drawScene(){
  screenVisible = 1;
  moveCoins();
  for(var key in models){
    var model = models[key];
    //console.log(model);
    temp += 0.05
    var cameraMatrix = getCamera();
    var MVPMatrix = matrixMultiply(cameraMatrix, makeZToWMatrix(0.9));
    createModel(model['name'], model['center'][0], model['center'][1], model['center'][2], model['scale'][0],  model['scale'][1],  model['scale'][2], model['speed'][0], model['speed'][1], model['speed'][2], model['filedata'], model['filename'], model['iscoin']);
  }
  for(var key in coins){
    var model = coins[key];
    //console.log(model);
    //temp += 0.05
    var cameraMatrix = getCamera();
    var MVPMatrix = matrixMultiply(cameraMatrix, makeZToWMatrix(0.9));
    createModel(model['name'], model['center'][0], model['center'][1], model['center'][2], model['scale'][0],  model['scale'][1],  model['scale'][2], model['speed'][0], model['speed'][1], model['speed'][2], model['filedata'], model['filename'], model['iscoin']);
  }
}

function mouseClick(canvas, evt){
  var striker = coins["striker"];
  var strikerPosOrig = striker['center'];
  var strikerScale = striker['scale'];
  var strikerPos = matrixMultiply4x1(getCamera(), [strikerPosOrig[0], strikerPosOrig[1], strikerPosOrig[2], 1]);
  var mousePos = [mouseX, mouseY];
  //console.log(strikerPos);
  //console.log(mousePos);
  if(gamePhase == 0){
    if(mousePos[0] >= strikerPos[0]-strikerScale[0] && mousePos[0] <= strikerPos[0]+strikerScale[0] && mousePos[1] >= strikerPos[1]-strikerScale[1] && mousePos[1] <= strikerPos[1]+strikerScale[1]){
      gamePhase = 1;
    }
  }
  else if(gamePhase == 1){
    var angle = 0;
    /*
       0
     -90 90
      180
    */
    angle = Math.atan2((mousePos[0]-strikerPos[0]),(mousePos[1]-strikerPos[1]));
    shootAngle = 90 - angle*180/3.1415; //So that right is forward
    shootPower = Math.sqrt(Math.abs(mousePos[0]-strikerPos[0])*Math.abs(mousePos[0]-strikerPos[0]) + 
      Math.abs(mousePos[1]-strikerPos[1])*Math.abs(mousePos[1]-strikerPos[1]))/(1.36/0.2);
    coins["striker"]["speed"][0] = shootPower*Math.cos(shootAngle*3.1415/180);
    coins["striker"]["speed"][1] = shootPower*Math.sin(shootAngle*3.1415/180);
    gamePhase = 0;
    //console.log(shootAngle);
  }
}

function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  var x = evt.clientX - rect.left;
  var y = evt.clientY - rect.top;
  //console.log(x, y);
  mouseX = (x-325)/325;
  mouseY = -(y-325)/325;
  mouseZ = -0.03;
}

function matrixInverse(a)
{
    var s0 = a[0] * a[5] - a[4] * a[1];
    var s1 = a[0] * a[6] - a[4] * a[2];
    var s2 = a[0] * a[7] - a[4] * a[3];
    var s3 = a[1] * a[6] - a[5] * a[2];
    var s4 = a[1] * a[7] - a[5] * a[3];
    var s5 = a[2] * a[7] - a[6] * a[3];

    var c5 = a[10] * a[15] - a[14] * a[11];
    var c4 = a[9] * a[15] - a[13] * a[11];
    var c3 = a[9] * a[14] - a[13] * a[10];
    var c2 = a[8] * a[15] - a[12] * a[11];
    var c1 = a[8] * a[14] - a[12] * a[10];
    var c0 = a[8] * a[13] - a[12] * a[9];

    //console.log(c5,s5,s4);

    // Should check for 0 determinant
    var invdet = 1.0 / (s0 * c5 - s1 * c4 + s2 * c3 + s3 * c2 - s4 * c1 + s5 * c0);

    var b = [[],[],[],[]];

    b[0] = ( a[5] * c5 - a[6] * c4 + a[7] * c3) * invdet;
    b[1] = (-a[1] * c5 + a[2] * c4 - a[3] * c3) * invdet;
    b[2] = ( a[13] * s5 - a[14] * s4 + a[15] * s3) * invdet;
    b[3] = (-a[9] * s5 + a[10] * s4 - a[11] * s3) * invdet;

    b[4] = (-a[4] * c5 + a[6] * c2 - a[7] * c1) * invdet;
    b[5] = ( a[0] * c5 - a[2] * c2 + a[3] * c1) * invdet;
    b[6] = (-a[12] * s5 + a[14] * s2 - a[15] * s1) * invdet;
    b[7] = ( a[8] * s5 - a[10] * s2 + a[11] * s1) * invdet;

    b[8] = ( a[4] * c4 - a[5] * c2 + a[7] * c0) * invdet;
    b[9] = (-a[0] * c4 + a[1] * c2 - a[3] * c0) * invdet;
    b[10] = ( a[12] * s4 - a[13] * s2 + a[15] * s0) * invdet;
    b[11] = (-a[8] * s4 + a[9] * s2 - a[11] * s0) * invdet;

    b[12] = (-a[4] * c3 + a[5] * c1 - a[6] * c0) * invdet;
    b[13] = ( a[0] * c3 - a[1] * c1 + a[2] * c0) * invdet;
    b[14] = (-a[12] * s3 + a[13] * s1 - a[14] * s0) * invdet;
    b[15] = ( a[8] * s3 - a[9] * s1 + a[10] * s0) * invdet;

    return b;
}

function makePerspective(fieldOfViewInRadians, aspect, near, far) {
  var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
  var rangeInv = 1.0 / (near - far);
 
  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ];
};

function makeZToWMatrix(fudgeFactor) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, fudgeFactor,
    0, 0, 0, 1,
  ];
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

function openFile(name, x_pos, y_pos, z_pos, x_scale, y_scale, z_scale, speed_x, speed_y, speed_z, filename, iscoin){
  var datastring;
  $.ajax({
    url : filename,
    dataType: "text",
    success : function (data) {
      datastring = data;
      createModel(name, x_pos, y_pos, z_pos, x_scale, y_scale, z_scale, speed_x, speed_y, speed_z, datastring, filename, iscoin);
    }
  });
}

function makeModel(name, x_pos, y_pos, z_pos, x_scale, y_scale, z_scale, speed_x, speed_y, speed_z, filename, iscoin){
  openFile(name, x_pos, y_pos, z_pos, x_scale, y_scale, z_scale, speed_x, speed_y, speed_z, filename, iscoin);
}

function createModel(name, x_pos, y_pos, z_pos, x_scale, y_scale, z_scale, speed_x, speed_y, speed_z, filedata, filename, iscoin) //Create object from blender
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
          cur_point['x']=parseFloat(words[1]);
          cur_point['y']=parseFloat(words[2]);
          cur_point['z']=parseFloat(words[3]);
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
          vertex_buffer_data.push(points[my_triangle['p1']]['x']*x_scale + x_pos);
          vertex_buffer_data.push(points[my_triangle['p1']]['y']*y_scale + y_pos);
          vertex_buffer_data.push(points[my_triangle['p1']]['z']*z_scale + z_pos);
          vertex_buffer_data.push(points[my_triangle['p2']]['x']*x_scale + x_pos);
          vertex_buffer_data.push(points[my_triangle['p2']]['y']*y_scale + y_pos);
          vertex_buffer_data.push(points[my_triangle['p2']]['z']*z_scale + z_pos);
          vertex_buffer_data.push(points[my_triangle['p3']]['x']*x_scale + x_pos);
          vertex_buffer_data.push(points[my_triangle['p3']]['y']*y_scale + y_pos);
          vertex_buffer_data.push(points[my_triangle['p3']]['z']*z_scale + z_pos);
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
    gl.uniformMatrix4fv(u_matrix, false, getCamera());

    //console.log(vertex_buffer_data);
    //console.log(vertex_buffer_data.length);

    // draw
    if (screenVisible == 1){
      gl.drawArrays(gl.TRIANGLES, 0, vertex_buffer_data.length/3);
    }
    var mymodel = {'center':[x_pos,y_pos,z_pos], 'scale':[x_scale,y_scale,z_scale], 'speed':[speed_x, speed_y, speed_z], 'name':name, 'filedata':filedata, 'filename':filename, 'iscoin':iscoin};
    if (!iscoin){
      models[name] = mymodel;
    }
    else{
      coins[name] = mymodel;
    }
}