var canvas,gl,program;
var textCtx, canvasText;

var models = {};
var coins = {};
var alive = {};

var gameInitialized = false;
var currentPlayer = 0;
var bonusTurn = false;

var p1blackScore = 0;
var p1whiteScore = 0;
var p1redScore = 0;

var p2blackScore = 0;
var p2whiteScore = 0;
var p2redScore = 0;

var p1Score = 100;
var p2Score = 100;

var redinPreviously = 0;
var timerInterval;

var overlapMargin = 0.0002;
var screenVisible = 0;
var boundaryX = 0.64, boundaryY = 0.64;
var friction = 0.95;
var minSpeedLimit = 0.001;
var collisionOffset = 0.033;
var spacingOffset = 0.005;
var startBoundary = 0.5;
var mouseX=0, mouseY=0, mouseZ=0;
var dottedLineAngle = 90;
var dottedLineVisible = 0;

var gamePhase = 0;
var replay = 0;
var previousCoins = {};
var cameraMode = 0;
var playerCanPlay = 1;
var controls = 0; //If 0 then mouse controls, if 1 then keyboard controls

var shootAngle = 0;
var shootPower = 0.2; //Default parameters

var temp = 0; //For the camera mode 2 rotation
var currentCoinFocus = 1;

var coincollideSound = new Audio('sounds/coincollide.mp3');
var coingoalSound = new Audio('sounds/finish.mp3');
var coinfailSound = new Audio('sounds/fail.wav');

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

function loadpreviouscoins(){
  for(var key in coins){
    //console.log('yobro');
    previousCoins[key] = {};
    previousCoins[key]['center'] = [];
    previousCoins[key]['speed'] = [];
    previousCoins[key]['center'][0] = coins[key]['center'][0];
    previousCoins[key]['center'][1] = coins[key]['center'][1];
    previousCoins[key]['center'][2] = coins[key]['center'][2];
    previousCoins[key]['speed'][0] = coins[key]['speed'][0];
    previousCoins[key]['speed'][1] = coins[key]['speed'][1];
    previousCoins[key]['speed'][2] = coins[key]['speed'][2];
  }
}

function loadcurrentcoins(){
  for(var key in coins){
    //console.log('yobro2');
    coins[key]['center'][0] = previousCoins[key]['center'][0];
    coins[key]['center'][1] = previousCoins[key]['center'][1];
    coins[key]['center'][2] = previousCoins[key]['center'][2];
    coins[key]['speed'][0] = previousCoins[key]['speed'][0];
    coins[key]['speed'][1] = previousCoins[key]['speed'][1];
    coins[key]['speed'][2] = previousCoins[key]['speed'][2];
  }
}

function setPowerbar(){
  var powerbar = document.getElementById('powerbarfill');
  var pixelsToFill = Math.floor((shootPower/0.2)*300);
  $('#powerbarfill').css("height", pixelsToFill);
  $('#powerbarfill').css("top", 550 - pixelsToFill); 
}

function Initialize()
{

  canvasText = document.getElementById("text");
  textCtx = canvasText.getContext("2d");

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
  //MVPMatrix = makePerspective(180 * (Math.PI/180), 1, 0, 5000);
  makeModel('boardinner', 0, 0, 0, 1.5, 1.5, 0.03, 0, 0, 0, 'boardinner.data', 0);
  
  makeModel('boardouter1', 0, 0.75, 0, 1.6, 0.1, 0.15, 0, 0, 0, 'boardouter.data', 0);
  makeModel('boardouter2', 0, -0.75, 0, 1.6, 0.1, 0.15, 0, 0, 0, 'boardouter.data', 0);
  makeModel('boardouter3', -0.75, 0, 0, 0.1, 1.6, 0.15, 0, 0, 0,  'boardouter.data', 0);
  makeModel('boardouter4', 0.75, 0, 0, 0.1, 1.6, 0.15, 0, 0, 0, 'boardouter.data', 0);
  
  makeModel('dottedline', 0, 0, 0, 0.025, 0.01, 0.018+overlapMargin*6, 0, 0, 0, 'dottedline.data', 0);

  makeModel('boardline', 0, 0, -overlapMargin, 1.1, 1.1, 0.03, 0, 0, 0, 'boardouter.data', 0);
  makeModel('boardline2', 0, 0, -2*overlapMargin, 1.08, 1.08, 0.03, 0, 0, 0, 'boardinner.data', 0);
 
  makeModel('boardcenter', 0, 0, 0, 0.05, 0.05, 0.018+overlapMargin*4, 0, 0, 0, 'boardcenter.data', 0);
  makeModel('boardcenter1', 0, 0, 0, 0.03, 0.03, 0.018+overlapMargin*5, 0, 0, 0, 'cylinderdetailedlight.data', 0);

  makeModel('cylindercenter1', 0, 0, 0, 0.21, 0.21, 0.018, 0, 0, 0, 'cylinderdetailed.data', 0);
  makeModel('cylindercenter2', 0, 0, 0, 0.205, 0.205, 0.018+overlapMargin, 0, 0, 0, 'cylinderdetailedlight.data', 0);

  makeModel('cylindercenter3', 0, 0, 0, 0.2, 0.2, 0.018+2*overlapMargin, 0, 0, 0, 'cylinderdetailed.data', 0);
  makeModel('cylindercenter4', 0, 0, 0, 0.185, 0.185, 0.018+3*overlapMargin, 0, 0, 0, 'cylinderdetailedlight.data', 0);

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
  
  makeModel('striker', 0, -startBoundary, -0.03, 0.05, 0.05, 0.01, 0, 0, 0, 'striker.data', 1);

  var radius = 0.11;
  var angleOffset = 360/8; //6 is the number of coins to place

  makeModel('black1', radius*Math.cos(0 * angleOffset * (Math.PI/180)), radius*Math.sin(0 * angleOffset * (Math.PI/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinblack.data', 1);
  makeModel('white1', radius*Math.cos(1 * angleOffset * (Math.PI/180)), radius*Math.sin(1 * angleOffset * (Math.PI/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinwhite.data', 1);
  makeModel('black2', radius*Math.cos(2 * angleOffset * (Math.PI/180)), radius*Math.sin(2 * angleOffset * (Math.PI/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinblack.data', 1);
  makeModel('white2', radius*Math.cos(3 * angleOffset * (Math.PI/180)), radius*Math.sin(3 * angleOffset * (Math.PI/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinwhite.data', 1);
  makeModel('black3', radius*Math.cos(4 * angleOffset * (Math.PI/180)), radius*Math.sin(4 * angleOffset * (Math.PI/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinblack.data', 1);
  makeModel('white3', radius*Math.cos(5 * angleOffset * (Math.PI/180)), radius*Math.sin(5 * angleOffset * (Math.PI/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinwhite.data', 1);
  makeModel('black4', radius*Math.cos(6 * angleOffset * (Math.PI/180)), radius*Math.sin(6 * angleOffset * (Math.PI/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinblack.data', 1);
  makeModel('white4', radius*Math.cos(7 * angleOffset * (Math.PI/180)), radius*Math.sin(7 * angleOffset * (Math.PI/180)), -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinwhite.data', 1);
  makeModel('red', 0, 0, -0.03, 0.04, 0.04, 0.01, 0, 0, 0, 'coinred.data', 1);
  
  alive['red'] = true;
  alive['white1'] = true;
  alive['black1'] = true;
  alive['white2'] = true;
  alive['black2'] = true;
  alive['white3'] = true;
  alive['black3'] = true;
  alive['white4'] = true;
  alive['black4'] = true;

  setTimeout(loadpreviouscoins, 1000);
  setInterval(drawScene, 15); //(1000/15) fps
  timerInterval = setInterval(timer, 5000); //Reduce points every 5 seconds

  gameInitialized = true;

  document.addEventListener('keydown', function(event) {
    if(event.keyCode == 49) {
      cameraMode = 0;
      temp = 0;
    }
    else if(event.keyCode == 50){
      cameraMode = 1;
      temp = 0;
    }
    else if(event.keyCode == 51){
      cameraMode = 2;
      if(gamePhase != 1.5){
        controls = 1;
      }
      temp = 0;
    }
    else if(event.keyCode == 52){
      if(cameraMode != 3){
        currentCoinFocus = 1;
      }
      else{
        currentCoinFocus += 1;
        if(currentCoinFocus == 10){
          currentCoinFocus = 1;
        }
      }
      cameraMode = 3;
      if(gamePhase != 1.5){
        controls = 1;
      }
      temp = 0;
    }
    else if(event.keyCode == 57){ //Key '9'
      if(gamePhase != 1.5){
        controls = 0; //Enable mouse control
        dottedLineVisible = 0;
      }
      else{
        alert("Cannot switch controls during turn");
      }
    }
    else if(event.keyCode == 48){ //Key '0'
      controls = 1; //Enable keyboard control
      dottedLineVisible = 1;
    }
    else if(event.keyCode == 37) {
      if(controls == 1){
        if(gamePhase == 0){
          coins['striker']['center'][0] -= 0.05;
          coins['striker']['center'][0] = Math.min(0.5, Math.max(-0.5,coins['striker']['center'][0]));
          setDottedLine();
        }
        if(gamePhase == 1){
          shootAngle += 5;
          dottedLineAngle = shootAngle;
          setDottedLine();
        }
      }
    }
    else if(event.keyCode == 39) {
      if(controls == 1){
        if(gamePhase == 0){
          coins['striker']['center'][0] += 0.05;
          coins['striker']['center'][0] = Math.min(0.5, Math.max(-0.5,coins['striker']['center'][0]));
          setDottedLine();
        }
        if(gamePhase == 1){
          shootAngle -= 5;
          dottedLineAngle = shootAngle;
          setDottedLine();
        }
      }
    }
    else if(event.keyCode == 40) {
      if(controls == 1){
        if(gamePhase == 1.5){
          shootPower -= 0.01;
          shootPower = Math.max(shootPower, 0);
          setPowerbar();
        }
      }
    }
    else if(event.keyCode == 38) {
      if(controls == 1){
        if(gamePhase == 1.5){
          shootPower += 0.01;
          shootPower = Math.min(shootPower, 0.2);
          setPowerbar();
        }
      }
    }
    else if(event.keyCode == 13) {
      if(gamePhase == 0){
        gamePhase = 1;
        shootAngle = 90;
        dottedLineAngle = shootAngle;
        setDottedLine();
        shootPower = 0;
        setPowerbar();
      }
      else if(gamePhase == 1){
        var mousePos = [mouseX, mouseY];
        var strikerPos = coins['striker']['center'];
        if(controls == 0){
            var angle = 0;
            /*
               0
             -90 90
              180
            */
            angle = Math.atan2((mousePos[0]-strikerPos[0]),(mousePos[1]-strikerPos[1]));
            shootAngle = 90 - angle*180/Math.PI; //So that right is forward
            dottedLineAngle = shootAngle;
            setDottedLine();
            shootPower = Math.sqrt(Math.abs(mousePos[0]-strikerPos[0])*Math.abs(mousePos[0]-strikerPos[0]) + 
              Math.abs(mousePos[1]-strikerPos[1])*Math.abs(mousePos[1]-strikerPos[1]))/(1.36/0.15);
            setPowerbar();
            coins["striker"]["speed"][0] = shootPower*Math.cos(shootAngle*Math.PI/180);
            coins["striker"]["speed"][1] = shootPower*Math.sin(shootAngle*Math.PI/180);
            loadpreviouscoins();
            dottedLineVisible = 0;
            gamePhase = 2; //The turn is in progress
        }
        else{
          gamePhase = 1.5;
        }
      }
      else if(gamePhase == 1.5){
        coins["striker"]["speed"][0] = shootPower*Math.cos(shootAngle*Math.PI/180);
        coins["striker"]["speed"][1] = shootPower*Math.sin(shootAngle*Math.PI/180);
        loadpreviouscoins();
        dottedLineVisible = 0;
        gamePhase = 2;
      }
    }
  });
}

function setDottedLine(){
  var position = [coins['striker']['center'][0], coins['striker']['center'][1], 0, 1];
  models['dottedline']['center'][0] = position[0]*Math.cos((dottedLineAngle) * (3.14/180)) + position[1]*Math.sin((dottedLineAngle) * (3.14/180));
  models['dottedline']['center'][1] = -position[0]*Math.sin((dottedLineAngle) * (3.14/180)) + position[1]*Math.cos((dottedLineAngle) * (3.14/180));
  //console.log(dottedLineAngle);
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

function reactToCollision(ball1, ball2){
  var collisionision_angle = Math.atan2((ball2['center'][1] - ball1['center'][1]), (ball2['center'][0] - ball1['center'][0]));        
  var speed1 = Math.sqrt(ball1['speed'][0]*ball1['speed'][0]+ball1['speed'][1]*ball1['speed'][1]);
  var speed2 = Math.sqrt(ball2['speed'][0]*ball2['speed'][0]+ball2['speed'][1]*ball2['speed'][1]);

  var direction_1 = Math.atan2(ball1['speed'][1], ball1['speed'][0]);
  var direction_2 = Math.atan2(ball2['speed'][1], ball2['speed'][0]);
  var new_xspeed_1 = speed1 * Math.cos(direction_1 - collisionision_angle);
  var new_yspeed_1 = speed1 * Math.sin(direction_1 - collisionision_angle);
  var new_xspeed_2 = speed2 * Math.cos(direction_2 - collisionision_angle);
  var new_yspeed_2 = speed2 * Math.sin(direction_2 - collisionision_angle);

  var final_xspeed_1 = new_xspeed_2;
  var final_xspeed_2 = new_xspeed_1;
  var final_yspeed_1 = new_yspeed_1;
  var final_yspeed_2 = new_yspeed_2;

  var cosAngle = Math.cos(collisionision_angle);
  var sinAngle = Math.sin(collisionision_angle);
  ball1['speed'][0] = (cosAngle * final_xspeed_1 - sinAngle * final_yspeed_1)*0.9992;
  ball1['speed'][1] = (sinAngle * final_xspeed_1 + cosAngle * final_yspeed_1)*0.9992;
  ball2['speed'][0] = (cosAngle * final_xspeed_2 - sinAngle * final_yspeed_2)*0.9992;
  ball2['speed'][1] = (sinAngle * final_xspeed_2 + cosAngle * final_yspeed_2)*0.9992;

  if(Math.abs(ball1['speed'][0]) <= minSpeedLimit)
    ball1['speed'][0] = 0;
  if(Math.abs(ball1['speed'][1]) <= minSpeedLimit)
    ball1['speed'][1] = 0;
  if(Math.abs(ball2['speed'][0]) <= minSpeedLimit)
    ball2['speed'][0] = 0;
  if(Math.abs(ball2['speed'][1]) <= minSpeedLimit)
    ball2['speed'][1] = 0;

  //console.log(ball1['speed'],ball2['speed']);

  var pos1 = [ball1['center'][0], ball1['center'][1]];
  var pos2 = [ball2['center'][0], ball2['center'][1]];

  var posDiff = [pos1[0]-pos2[0],pos1[1]-pos2[1]];
  var d = Math.sqrt(posDiff[0]*posDiff[0]+posDiff[1]*posDiff[1]);

  // minimum translation distance to push balls apart after intersecting
  var mtd = [posDiff[0] * (((ball1['scale'][0] + ball2['scale'][0] + spacingOffset) - d) / d), posDiff[1] * (((ball1['scale'][1] + ball2['scale'][1] + spacingOffset) - d) / d)];

  // resolve intersection -
  // computing inverse mass quantities
  var im1 = 1;
  var im2 = 1;

  pos1[0] = pos1[0] + mtd[0] * (im1 / (im1 + im2));
  pos1[1] = pos1[1] + mtd[1] * (im1 / (im1 + im2));
  pos2[0] = pos2[0] - mtd[0] * (im2 / (im1 + im2));
  pos2[1] = pos2[1] - mtd[1] * (im2 / (im1 + im2));
  ball1['center'][0] = pos1[0];
  ball1['center'][1] = pos1[1];
  ball2['center'][0] = pos2[0];
  ball2['center'][1] = pos2[1];

  //console.log(ball1['center'],ball2['center']);

  coins[ball1['name']] = ball1;
  coins[ball2['name']] = ball2;
}

function checkCollisions(){
  for(var key1 in coins){
    for(var key2 in coins){
      if(key1 == key2 || key1 >= key2 || alive[key1]==false || alive[key2]==false)
        continue;
      var coin1 = coins[key1];
      var coin2 = coins[key2];
      if(isCollidingX(coin1, coin2) || isCollidingY(coin1, coin2)){
        //if(Math.abs(coin1['speed'][0])+Math.abs(coin1['speed'][1])+Math.abs(coin2['speed'][0])+Math.abs(coin2['speed'][1]) >= 0.05)
        //  playSound();
        reactToCollision(coin1, coin2);
      }
    }
  }
}

function allCoinsFrozen(){
  for(var key in coins){
    if (coins[key]['speed'][0] != 0 || coins[key]['speed'][1] != 0){
      return 0;
    } 
  }
  return 1;
}

function playSound(sound){
  if(sound == 'collide'){
    coincollideSound.play();
  }
  if(sound == 'goal'){
    coingoalSound.volume = 0.6;
    coingoalSound.play();
  }
  if(sound == 'fail'){
    coinfailSound.play();
  }
}

function getScores(){
  var placeOffset = 0.74;
  var doReplay = 0;
  for(var key in coins){
    if(alive[key]==false){
      continue;
    }
    if (Math.abs(coins[key]['center'][0]) >= 0.61 && Math.abs(coins[key]['center'][1]) >= 0.61){
      if(coins[key]['name'][0]=='b'){
        if(redinPreviously==1 || redinPreviously==2){
          if(currentPlayer == 1){
            if(replay == 2){
              p2redScore += 1;
              p2Score += 20;
            }
            var p1Coins = p1blackScore + p1whiteScore + p1redScore;
            var p2Coins = p2blackScore + p2whiteScore + p2redScore;
            coins['red']['center'][0] = placeOffset - p2Coins * 0.1;
            coins['red']['center'][1] = -placeOffset;
            coins['red']['center'][2] = -0.08;
            coins['red']['speed'][0] = 0;
            coins['red']['speed'][1] = 0;
            if(replay == 2)
              alive['red'] = false;
          }
        }
        if(currentPlayer==0){
          if(replay == 2){
            p1blackScore += 1;
            p1Score -= 20;
          }
          var p1Coins = p1blackScore + p1whiteScore + p1redScore;
          var p2Coins = p2blackScore + p2whiteScore + p2redScore;
          coins[key]['center'][0] = -placeOffset + p1Coins * 0.1;
          coins[key]['center'][1] = -placeOffset;
          coins[key]['center'][2] = -0.08;
          coins[key]['speed'][0] = 0;
          coins[key]['speed'][1] = 0;
          if(replay == 2)
            alive[key] = false;
        }
        else{
          if(replay == 2){
            p2blackScore += 1;
            p2Score += 5;
          }
          var p1Coins = p1blackScore + p1whiteScore + p1redScore;
          var p2Coins = p2blackScore + p2whiteScore + p2redScore;
          coins[key]['center'][0] = placeOffset - p2Coins * 0.1;
          coins[key]['center'][1] = -placeOffset;
          coins[key]['center'][2] = -0.08;
          coins[key]['speed'][0] = 0;
          coins[key]['speed'][1] = 0;
          if(replay == 2)
            alive[key] = false;
          bonusTurn = true;
        }
      }
      else if(coins[key]['name'][0]=='w'){
        if(redinPreviously==1 || redinPreviously==2){
          if(currentPlayer==0){
            if(replay == 2){
              p1redScore += 1;
              p1Score += 20;
            }
            var p1Coins = p1blackScore + p1whiteScore + p1redScore;
            var p2Coins = p2blackScore + p2whiteScore + p2redScore;
            coins['red']['center'][0] = -placeOffset + p2Coins * 0.1;
            coins['red']['center'][1] = -placeOffset;
            coins['red']['center'][2] = -0.08;
            coins['red']['speed'][0] = 0;
            coins['red']['speed'][1] = 0;
            if(replay == 2)
              alive['red'] = false;
          }
        }
        if(currentPlayer==0){
          if(replay == 2){
            p1whiteScore += 1;
            p1Score += 5;
          }
          var p1Coins = p1blackScore + p1whiteScore + p1redScore;
          var p2Coins = p2blackScore + p2whiteScore + p2redScore;
          coins[key]['center'][0] = -placeOffset + p1Coins * 0.1;
          coins[key]['center'][1] = -placeOffset;
          coins[key]['center'][2] = -0.08;
          coins[key]['speed'][0] = 0;
          coins[key]['speed'][1] = 0;
          if(replay == 2)
            alive[key] = false;
          bonusTurn = true;
        }
        else{
          if(replay == 2){
            p2whiteScore += 1;
            p2Score -= 20;
          }
          var p1Coins = p1blackScore + p1whiteScore + p1redScore;
          var p2Coins = p2blackScore + p2whiteScore + p2redScore;
          coins[key]['center'][0] = placeOffset - p2Coins * 0.1;
          coins[key]['center'][1] = -placeOffset;
          coins[key]['center'][2] = -0.08;
          coins[key]['speed'][0] = 0;
          coins[key]['speed'][1] = 0;
          if(replay == 2)
            alive[key] = false;
        }
      }
      else if(coins[key]['name'][0]=='r'){
        redinPreviously = 1;
        bonusTurn = true;
        coins[key]['center'][0] = 100;
        coins[key]['center'][1] = 100;
        if(replay == 2)
            alive['red'] = false;
        coins[key]['speed'][0] = 0;
        coins[key]['speed'][1] = 0;
      }
      else if(coins[key]['name'][0]=='s'){
        playSound('fail');
        if(currentPlayer==0){
          p1Score -= 5; //For the striker going into the hole
        }
        else{
          p2Score -= 5;
        }
        coins[key]['center'][0] = 0;
        coins[key]['center'][1] = -startBoundary;
        coins[key]['speed'][0] = 0;
        coins[key]['speed'][1] = 0;
        coins[key]['speed'][2] = 0;
      }
      if(coins[key]['name'][0] != 's'){
        playSound('goal');
      }
      if(coins[key]['name'][0]!='s')
        doReplay = 1;
    }
  }
  if(replay == 0 && doReplay == 1){
    replay = 1;
    //console.log('done');
  }
}

function moveCoins(){
  //console.log(currentPlayer);
  getScores();
  if(gamePhase == 0 && playerCanPlay && controls == 0 && replay!=2){
    var mousePos = [mouseX, mouseY];
    //console.log('hehehe');
    coins['striker']['center'][0] = Math.min(0.5, Math.max(-0.5,mousePos[0]));
    coins['striker']['center'][1] = -startBoundary;
    setDottedLine();
  }
  //Next turn
  if(gamePhase == 2 && allCoinsFrozen()==1){
    dottedLineAngle = 90;
    gamePhase = 0;
    if(controls == 1)
      dottedLineVisible = 1;
    coins['striker']['center'][0] = 0;
    coins['striker']['center'][1] = -startBoundary;
    setDottedLine();
    if(p1whiteScore + p1blackScore + p2whiteScore + p2blackScore == 8){
      screenVisible = 0;
      console.log('Game Over');
      $('#victory').css("display", 'initial');
    }
    clearInterval(timerInterval);
    timerInterval = setInterval(timer, 5000); //Reduce points every 5 seconds
    if(redinPreviously == 1){
      redinPreviously = 2;
    }
    else if(redinPreviously == 2){
      redinPreviously = 0;
      if(p1redScore == 0 && p2redScore == 0){
        coins['red']['center'][0] = 0;
        coins['red']['center'][1] = 0;
        alive['red'] = true;
      }
    }
    currentPlayer = 1 - currentPlayer;
    bonusTurn = false;
    if(replay == 1 || replay == 2){
      if(!bonusTurn){
        currentPlayer = 1 - currentPlayer;
      }
    }
    if(replay == 2){
      replay = 0;
      playerCanPlay = 1;
      console.log('replay done');
    }
    if(replay == 1){
      replay = 2;
      gamePhase = 2;
      playerCanPlay = 0;
      loadcurrentcoins();
      //console.log('hoho');
    }
  }
  for(var key in coins){
    if(alive[key] == false){
      //console.log("False");
      continue;
    }
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

function getCamera(isdottedline){
  var cameraMatrix = makeScale(1, 1, 1);
  if(isdottedline == true){
    cameraMatrix = matrixMultiply(cameraMatrix, makeZRotation(dottedLineAngle * (Math.PI/180)));
  }
  if(cameraMode == 0){
    playerCanPlay = 1;
    cameraMatrix = matrixMultiply(cameraMatrix, makeScale(0.9, 0.9, 0.9));
  }
  else if(cameraMode == 1){
    playerCanPlay = 1;
    cameraMatrix = matrixMultiply(cameraMatrix, makeScale(0.7, 0.7, 0.7));
    cameraMatrix = matrixMultiply(cameraMatrix, makeXRotation(50 * (Math.PI/180)));
  }
  else if(cameraMode == 2){
    temp += 0.02;
    playerCanPlay = 0;
    cameraMatrix = matrixMultiply(cameraMatrix, makeScale(0.58, 0.58, 0.58));
    cameraMatrix = matrixMultiply(cameraMatrix, makeXRotation(90 * (Math.PI/180)));
    cameraMatrix = matrixMultiply(cameraMatrix, makeYRotation(temp * (Math.PI/180)));
    cameraMatrix = matrixMultiply(cameraMatrix, makeXRotation(-40 * (Math.PI/180)));
  }
  else if(cameraMode == 3 && (Object.keys(coins).length == 10  || gameInitialized == true)){
    if(Object.keys(coins).length == 10){
      gameInitialized = true;
    }
    playerCanPlay = 0;
    cameraMatrix = matrixMultiply(cameraMatrix, makeScale(1.5, 1.5, 1.5));
    var striker = coins['striker'];
    var coin;
    if(currentCoinFocus == 1) {coin = coins['black1'];}
    if(currentCoinFocus == 2) {coin = coins['white1'];}
    if(currentCoinFocus == 3) {coin = coins['black2'];}
    if(currentCoinFocus == 4) {coin = coins['white2'];}
    if(currentCoinFocus == 5) {coin = coins['black3'];}
    if(currentCoinFocus == 6) {coin = coins['white3'];}
    if(currentCoinFocus == 7) {coin = coins['black4'];}
    if(currentCoinFocus == 8) {coin = coins['white4'];}
    if(currentCoinFocus == 9) {coin = coins['red'];}
    var angle = Math.atan2(coin['center'][1]-striker['center'][1], coin['center'][0]-striker['center'][0])*(180/Math.PI);
    cameraMatrix = matrixMultiply(cameraMatrix, makeTranslation(-coin['center'][0]-0.2*Math.cos((angle+90) * (Math.PI/180)),-coin['center'][1]-0.2*Math.sin((angle+90) * (Math.PI/180)),0));
    cameraMatrix = matrixMultiply(cameraMatrix, makeXRotation(90 * (Math.PI/180)));
    cameraMatrix = matrixMultiply(cameraMatrix, makeYRotation((angle+90) * (Math.PI/180)));
    cameraMatrix = matrixMultiply(cameraMatrix, makeXRotation(-40 * (Math.PI/180)));
  }
  cameraMatrix = matrixMultiply(cameraMatrix, makeZToWMatrix(0.9));
  return cameraMatrix;
}

function timer(){
  if(currentPlayer==0){
    p1Score -= 1;
  }
  else{
    p2Score -= 1;
  }
}

function drawScene(){
  textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);
  textCtx.font="35px Heading";
  textCtx.fillText("WebGL-Carrom", 200, 40);
  textCtx.font="18px Content";
  textCtx.fillText("Player 1", 80, 610);
  textCtx.fillText("Player 2", 505, 610);
  textCtx.font="30px Content";
  textCtx.fillText(p1Score.toString(), 85, 640);
  textCtx.fillText(p2Score.toString(), 513, 640);
  textCtx.fillText("Player-"+(currentPlayer+1).toString(), 270, 620);
  textCtx.font="18px Content";
  if(currentPlayer == 0)
    textCtx.fillText("(White)", 300, 640);
  else
    textCtx.fillText("(Black)", 300, 640);
  if(controls == 1){
    textCtx.fillText("Angle:", 590, 130);
    textCtx.fillText("Power:", 590, 170);
    textCtx.fillText((Math.round(shootPower*100)/100).toString(), 595, 190);
    textCtx.fillText((Math.round(shootAngle*100)/100).toString(), 600, 150);
  }
  //console.log(p1Score, p2Score);
  screenVisible = 1;
  moveCoins();
  for(var key in models){
    var model = models[key];
    //console.log(model);
    createModel(model['name'], model['center'][0], model['center'][1], model['center'][2], model['scale'][0],  model['scale'][1],  model['scale'][2], model['speed'][0], model['speed'][1], model['speed'][2], model['filedata'], model['filename'], model['iscoin']);
  }
  for(var key in coins){
    var model = coins[key];
    //console.log(model);
    createModel(model['name'], model['center'][0], model['center'][1], model['center'][2], model['scale'][0],  model['scale'][1],  model['scale'][2], model['speed'][0], model['speed'][1], model['speed'][2], model['filedata'], model['filename'], model['iscoin']);
  }
}

function mouseClick(canvas, evt){
  if(!playerCanPlay && controls == 0){
    return;
  }
  var striker = coins["striker"];
  var strikerPosOrig = striker['center'];
  var strikerScale = striker['scale'];
  var strikerPos = matrixMultiply4x1(getCamera(false), [strikerPosOrig[0], strikerPosOrig[1], strikerPosOrig[2], 1]);
  var mousePos = [mouseX, mouseY];
  //console.log(strikerPos);
  //console.log(mousePos);
  if(gamePhase == 0){
    gamePhase = 1;
  }
  else if(gamePhase == 1){
    var angle = 0;
    /*
       0
     -90 90
      180
    */
    angle = Math.atan2((mousePos[0]-strikerPos[0]),(mousePos[1]-strikerPos[1]));
    shootAngle = 90 - angle*180/Math.PI; //So that right is forward
    dottedLineAngle = shootAngle;
    setDottedLine();
    shootPower = Math.sqrt(Math.abs(mousePos[0]-strikerPos[0])*Math.abs(mousePos[0]-strikerPos[0]) + 
      Math.abs(mousePos[1]-strikerPos[1])*Math.abs(mousePos[1]-strikerPos[1]))/(1.36/0.15);
    setPowerbar();
    coins["striker"]["speed"][0] = shootPower*Math.cos(shootAngle*Math.PI/180);
    coins["striker"]["speed"][1] = shootPower*Math.sin(shootAngle*Math.PI/180);
    loadpreviouscoins();
    dottedLineVisible = 0;
    gamePhase = 2; //The turn is in progress
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

    /*if(filename=="cylinder.data"){
      var res = "";
      for(var vertex in vertex_buffer_data){
        res += vertex_buffer_data[vertex] + ", ";
      }
      console.log(res);
    }*/

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
    //matrix = matrixMultiply(matrix, makeYRotation(69 * (Math.PI/180)));
    if(name == 'dottedline'){
      gl.uniformMatrix4fv(u_matrix, false, getCamera(true));
    }
    else{
      gl.uniformMatrix4fv(u_matrix, false, getCamera(false));
    }
    //console.log(vertex_buffer_data);
    //console.log(vertex_buffer_data.length);

    // draw
    if (screenVisible == 1){
      if(name == 'dottedline'){
        if(dottedLineVisible == 1){
          gl.drawArrays(gl.TRIANGLES, 0, vertex_buffer_data.length/3);
        }
      }
      else{
        gl.drawArrays(gl.TRIANGLES, 0, vertex_buffer_data.length/3);
      }
    }
    var mymodel = {'center':[x_pos,y_pos,z_pos], 'scale':[x_scale,y_scale,z_scale], 'speed':[speed_x, speed_y, speed_z], 'name':name, 'filedata':filedata, 'filename':filename, 'iscoin':iscoin};
    if (!iscoin){
      models[name] = mymodel;
    }
    else{
      coins[name] = mymodel;
    }
}