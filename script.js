// Project started 9/27/2023

const cvs = document.getElementById("GameCanvas");
const ctx = cvs.getContext("2d");
var offset = cvs.getBoundingClientRect();
var player, mouseX, mouseY, score;
var moveChange = 0;
var timer2, timer3, timer4, timer5 = 0;
var allGameImages = [];
var isLoaded = false;
var isGameOver = false;
var isCountingUpScore = false;
var drawInterval, drawTimeout, gameOverListener;
//condition ? exprIfTrue : exprIfFalse

const cMath = {
  lerp: function( a, b, alpha ) {
   return a + alpha * ( b - a );
  },
  clamp: function(num, min, max) {
    return num <= min ? min : num >= max ? max : num
  },
  clampToCanvasX: function(num){
    return this.clamp(num, 0, cvs.width - player.width);
  },
  clampToCanvasY: function(num){
    return this.clamp( num, 0 , cvs.height - player.height)
  },
 intersects: function(a,b) {
    return !( b.x           > (a.x + a.width) || 
             (b.x + b.width) <  a.x           || 
              b.y           > (a.y + a.height) ||
             (b.y + b.height) <  a.y);
  },
  randomNumber: function(min, max) {
    return Math.random() * (max - min) + min;
  },
  objOOB: function(obj){
    return (
      obj.x < 0 ||
      obj.x > cvs.width ||
      obj.y < 0 ||
      obj.y > cvs.height
    ) ? true : false;
  }
};


function GAMESTART(){

  var loader = new PxLoader(); 
  allGameImages[0] = loader.addImage('sprites/cat_image_alive.png'),
  allGameImages[1] = loader.addImage('sprites/cat_image_ded.png'),
  allGameImages[2] = loader.addImage('sprites/gunmouse.png'),
  allGameImages[3] = loader.addImage('sprites/mouse_awake_normal.png'),
  allGameImages[4] = loader.addImage('sprites/mouse_sleep.png'); 
  loader.addCompletionListener(function(){
    if(!isLoaded){
      isLoaded = true;
      player = new Player(100,100);
      enemyMouse = new ReincarnatingMouse(300,100, player);
      enemyMouse.initPhase();
    }  
  });
  loader.start(); 
  
  
}
/*
*
* BEGIN
* CLASS
* DECLARATIONS
*
*/
/*
Classes: Player, ReincarnatingMouse, Bullet
*/
function Player(x,y){ //cat
  this.health = 9;
  this.width = 40;
  this.height = 40;
  this.isDead = false;
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.getX = function(){return this.x;}
  this.getY = function(){return this.y;}
  if(isLoaded){
    this.sprite = allGameImages[0];
  }
  this.update = function(){
    this.sprite ? this.displaySprite() : ctx.fillRect(this.x, this.y, this.width, this.height);
    this.displayHealth();
    this.isDead = (this.health < 1) ? true : false;
  }
  this.displaySprite = function(){
    if(this.isDead){
      this.sprite = allGameImages[1];
    }else{
      this.sprite = allGameImages[0];
    }
    ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
  }
  this.displayHealth = function(){
    for(let i = 0; i < this.health; i++){
      ctx.fillStyle = "rgb(200, 0, 0)";
      ctx.fillRect(5 + (15*i), 10, 10, 10);
    }
  }
}
/*
*
* END
* OF
* PLAYER
*
*/
function ReincarnatingMouse(x,y, player){ //mouse
  this.width = 40;
  this.height = 40;
  this.x = x;
  this.y = y;
  if(player){this.playerData = [player.x, player.y];}
  if(isLoaded){this.sprite = allGameImages[3];}
  this.phase = 1;
  this.mX = cMath.randomNumber(-0.4,0.4);
  this.mY = cMath.randomNumber(-0.4,0.4);
  this.bullets = [];
  this.watchPlayer;
  this.spawnBulletIntervals;
  this.p10TrapActive = false;
  this.intervalMovement, this.intervalMovement2;
  this.spinnyData = { 
    dd: 6,
    angle: 0,
    cx: cvs.width/2,
    cy: cvs.height/2,
    radius: 150
  };

  this.update = function(){
    this.sprite ? this.displaySprite() : ctx.fillRect(this.x, this.y, this.width, this.height);
    //ctx.fillStyle = "rgb(150, 57, 36)";
    //ctx.fillRect(this.x, this.y, this.width, this.height);
    if(player){
      this.playerData = [player.x, player.y];
    }
    if(cMath.intersects(this, player) && !this.p10TrapActive){
      this.phase++;
      this.initPhase();
    }
    if(this.phase > 10){
      this.phase = 11;
      clearInterval(this.intervalMovement);
      clearInterval(this.intervalMovement2);
      this.intervalMovement = null;
      this.intervalMovement2 = null;
      this.bullets = [];
    }else{
      this.currentPhase();
    }
  }
  this.displaySprite = function(){
    if(this.phase == 1){
      this.sprite = allGameImages[4];
    }else if (this.phase >=2 && this.phase <= 4){
      this.sprite = allGameImages[3];
    }else if (this.phase >= 5 && this.phase <= 8 ){
      this.sprite = allGameImages[2];
    }
    ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
  }
  this.currentPhase = function(){
    console.log("nothing");
  }
  this.resetPosition = function(){
    this.x = cMath.randomNumber(0, cvs.width - this.width);
    this.y = cMath.randomNumber(0,cvs.height - this.height);
    if(cMath.intersects(this, player)){
      this.resetPosition();
    }
  }
  this.spawnBullet = function(targetX, targetY, speed){
    let tx = targetX;
    let ty = targetY;
    this.bullets.push(new Bullet(this.x, this.y, tx, ty, speed));
  }
  this.manageBullets = function(){
    //ALWAYS RUN INSIDE OF PHASE_FUNCTION PLEASE
    for(let i = 0; i < this.bullets.length; i++){
      if(this.bullets[i].done == true){
        this.bullets[i].x = -500;
        this.bullets[i].pop;
      }else{
        this.bullets[i].go();
      }
    }
  }
  this.initPhase = function(){
    switch(this.phase){
      case 1:
        //DESC: The mouse is still and quiet.
        console.log("phase 1");
        this.resetPosition();
        this.currentPhase = this.phaseOne;
        break;
      case 2:
        //DESC: The mouse moves a little.
        console.log("phase 2");
        this.resetPosition();
        this.currentPhase = this.phaseTwo;
        break;
      case 3:
        //DESC: The mouse moves a lot.
        console.log("phase 3");
        moveChange = 0;
        this.mX = cMath.randomNumber(-1,1);
        this.mY = cMath.randomNumber(-1,1);
        this.resetPosition();
        this.currentPhase = this.phaseThree;
        break;
      case 4:
        //DESC: The mouse runs.
        console.log("phase 4");
        this.resetPosition();
        this.watchPlayer = setInterval(calculateVxVy, 100);
        this.currentPhase = this.phaseFour;
        break;
      case 5:
        //DESC: The mouse is sick of your games and pulls out the nine.
        console.log("phase 5");
        this.resetPosition();
        clearInterval(this.watchPlayer);
        this.watchPlayer = null;
        this.currentPhase = this.phaseFive;
        break;
      case 6:
        //DESC: The mouse learns to fire off a couple slowly...
        console.log("phase 6");
        this.resetPosition();
        this.spawnBullet(player.getX(), player.getY(),0.01);
        this.currentPhase = this.phaseSix;
        break;
      case 7:
        //DESC: "NOW WE'RE ROLLIN AHAHAHAHAHA"
        console.log("phase 7");
        this.resetPosition();
        this.bullets = [];
        clearInterval(this.spawnBulletIntervals);
        this.spawnBulletIntervals = null;
        this.currentPhase = this.phaseSeven;
        break;
      case 8:
        //DESC: The mouse figures you can actually dodge a gun and is now running from you.
        // It also pulls out the shotty
        console.log("phase 8");
        this.resetPosition();
        this.bullets = [];
        clearInterval(this.spawnBulletIntervals);
        this.spawnBulletIntervals = null;
        this.watchPlayer = setInterval(calculateVxVy, 100);
        this.currentPhase = this.phaseEight;
        break;
      case 9:
        //DESC: The mouse learns teleportation!
        console.log("phase 9");
        this.resetPosition();
        this.bullets = [];
        clearInterval(this.watchPlayer);
        this.watchPlayer = null;
        this.currentPhase = this.phaseNine;
        break;
      case 10:
        console.log("phase 10");
        this.resetPosition();
        this.bullets = [];
        clearInterval(this.spawnBulletIntervals);
        this.spawnBulletIntervals = null;
        clearInterval(this.intervalMovement);
        this.intervalMovement = null;
        this.p10TrapActive = true;
        this.currentPhase = this.phaseTen;
        break;
    }
  }
  this.phaseOne = function(){console.log("nothing");}
  this.phaseTwo = function(){
    moveChange+=1;
    if(moveChange == 500){
      this.mX = cMath.randomNumber(-0.4,0.4);
      this.mY = cMath.randomNumber(-0.4,0.4);
      moveChange = 0;
    }
    this.x = cMath.clampToCanvasX( this.x + this.mX);
    this.y = cMath.clampToCanvasY( this.y + this.mY); 
  }
  this.phaseThree = function(){
    moveChange+=1;
    if(moveChange == 100){
      this.mX = cMath.randomNumber(-1,1);
      this.mY = cMath.randomNumber(-1,1);
      moveChange = 0;
    }
    this.x = cMath.clampToCanvasX( this.x + this.mX);
    this.y = cMath.clampToCanvasY( this.y + this.mY);    
  }
  this.phaseFour = function(){
    this.x = cMath.clampToCanvasX(this.x + Math.sign(player.vx) * 3);
    this.y = cMath.clampToCanvasY(this.y + Math.sign(player.vy) * 3);
  }
  this.phaseFive = function(){
    console.log("GUNMOUSE GUNMOUSE");
  }
  this.phaseSix = function(){
    if(!this.spawnBulletIntervals){
      var self = this;
      this.spawnBulletIntervals = setInterval(function(){self.spawnBullet(player.getX(), player.getY(),0.01)},2000);
    }
    if(this.spawnBulletIntervals && this.bullets.length > 0){
      this.manageBullets();
    }
  }
  this.phaseSeven = function(){
    this.phaseTwo();
    if(!this.spawnBulletIntervals){
      var self = this;
      this.spawnBulletIntervals = setInterval(function(){self.spawnBullet(player.getX(), player.getY(),0.005)},500);
    }
    if(this.spawnBulletIntervals && this.bullets.length > 0){
      this.manageBullets();
    }
  }
  this.phaseEight = function(){
    this.phaseFour();
    if(!this.spawnBulletIntervals){
      var self = this;
      this.spawnBulletIntervals = setInterval(function(){
        self.spawnBullet(player.getX(), player.getY(),0.005);
        self.spawnBullet(player.getX() + 50, player.getY() + 50,0.005);
        self.spawnBullet(player.getX() - 50, player.getY() - 50,0.005);
      },1000);
    }
    if(this.spawnBulletIntervals && this.bullets.length > 0){
      this.manageBullets();
    }
  }
  this.phaseNine = function(){
    if(!this.intervalMovement){
      var self = this;
      this.intervalMovement = setInterval(function(){self.resetPosition()},500);
    }
    if(!this.spawnBulletIntervals){
      var self = this;
      this.spawnBulletIntervals = setInterval(function(){self.spawnBullet(player.getX(), player.getY(),0.0025)},250);
    }
    if(this.spawnBulletIntervals && this.bullets.length > 0){
      this.manageBullets();
    }
  }
  this.phaseTen = function(){
    if(!this.p10TrapActive){
      if(!this.intervalMovement){
        let self = this;
        this.intervalMovement = setInterval(function(){self.spinRightRoundBaby();},10);
        this.intervalMovement2 = setInterval(function(){self.spinnyData.angle += cMath.randomNumber(-180,180);},500);
      }
      if(!this.spawnBulletIntervals){
        let self = this;
        this.spawnBulletIntervals = setInterval(function(){
          self.spawnBullet(0, cvs.height, 0.005);
          self.spawnBullet(0, 0 - cvs.height, 0.005);
          self.spawnBullet(cvs.width, 0, 0.005);
          self.spawnBullet(0 - cvs.width, 0, 0.005);
        },750);
        
      }
      if(this.spawnBulletIntervals && this.bullets.length > 0){
        this.manageBullets();
      }
    }else{
      this.x = cvs.width/2;
      this.y = cvs.height/2;
      if(cMath.intersects(this, player)){
        this.resetPosition();
        this.p10TrapActive = false;
      }
    }
  }
  this.spinRightRoundBaby = function(){
    //window.requestAnimationFrame(this.spinRightRoundBaby.bind(this));

    //Math loosely inspired by https://jsfiddle.net/rfqoyjuc/9/
    
    this.spinnyData.angle += Math.acos(1-Math.pow(this.spinnyData.dd/this.spinnyData.radius,2)/2);
    let newX = this.spinnyData.cx + this.spinnyData.radius * Math.cos(this.spinnyData.angle);
    let newY = this.spinnyData.cy + this.spinnyData.radius * Math.sin(this.spinnyData.angle);
    this.x = newX;
    this.y = newY;
    // draw the centerpoint (DEBUG ONLY)
    ctx.beginPath();
    ctx.arc(this.spinnyData.cx, this.spinnyData.cy, this.spinnyData.radius, 0, Math.PI * 2, false);
    ctx.closePath();
    ctx.stroke();
    
  }

}
/*
*
* END
* OF
* REINCARNATINGMOUSE
*
*/
function Bullet(x,y,targetX,targetY, speed){
  this.x = x;
  this.y = y;
  this.width = 8;
  this.height = 8;
  this.sX = x;
  this.sY = y;
  this.tX = targetX;
  this.tY = targetY;
  this.dirX = this.tX - this.sX;
  this.dirY = this.tY - this.sY;

  this.speed = speed;
  this.alpha = 0;
  this.done = false;
  if(!this.done){
    this.go = function(){
      ctx.fillStyle = "rgb(0,0,0)";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      this.x += this.speed * this.dirX;
      this.y += this.speed * this.dirY;
      if(cMath.objOOB(this)){
        this.done = true;
        console.log("OOB");
      }
      if(cMath.intersects(this, player)){
        player.health--;
        this.done = true;
        console.log("HITCHA!");
      }
    }
  }else{
    this.go = function(){
      console.log("DONEEeee");
    }
  }
}
/*
*
* END
* OF
* BULLET
*
*/
function mouseMovementHandler(e){
  if(player){
    player.x = cMath.clamp(e.clientX - offset.left, 0, cvs.width - player.width);
    player.y = cMath.clamp(e.clientY - offset.top, 0, cvs.height - player.height);
  }
}
function calculateVxVy(){
  const oldX = player.x;
  const oldY = player.y;
  setTimeout(() => {
    const newX = player.x;
    const newY = player.y;
    player.vx = newX - oldX;
    player.vy = newY - oldY;
  }, 20);
  
}
function draw(){
  if(!player || !enemyMouse){
    return;
  }
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  player.update();
  enemyMouse.update();
  score = (100 * (enemyMouse.phase - 1)) - (10 * (9 - player.health));
  ctx.font = '10px Arial';
  ctx.fillText(score, 300, 10);
  if(!isCountingUpScore){
    if(player.health <= 0){
      isCountingUpScore = true;
      drawTimeout = setTimeout(() => {
        ctx.font = '50px Arial';
        ctx.fillText("Yikes", 100, 200);
        clearInterval(drawInterval);
        gameOver();
        
      }, 250);
      return;
    } else if(enemyMouse.phase > 10){
      isCountingUpScore = true;
      let gameOverText = (player.health === 9) ? "PERFECT CHASE!" : "The chase is over!";

      drawTimeout = setTimeout(() => {
        ctx.font = '40px Arial';
        ctx.fillText(gameOverText, 10, 150);
        clearInterval(drawInterval);
        gameOver();
      }, 250);
      return;
    }
  }
}

function gameOver(){
  clearTimeout(drawTimeout);
  ctx.font = '20px Arial';
  ctx.fillText("Press any key to restart.", 100, 350);
  isGameOver = true;
}
/* 
*
*   ALL EVENT LISTENERS
*   GAME START AND BEGIN DRAW
*/

GAMESTART();
drawInterval = setInterval(draw, 10);
document.addEventListener("keydown", () => { if (isGameOver) location.reload(); }, false);
document.addEventListener("mousemove", mouseMovementHandler, false);
