
if (typeof module != "undefined" && module.exports)
  module.exports = GAME_LEVELS;


function Level(plan) {
  this.width = plan[0].length;
  this.height = plan.length;
  this.grid = [];
  this.actors = [];

  for (var y = 0; y < this.height; y++) {
    var line = plan[y], gridLine = [];
    for (var x = 0; x < this.width; x++) {
      var ch = line[x], fieldType = null;
      var Actor = actorChars[ch];
      if (Actor)
        this.actors.push(new Actor(new Vector(x, y), ch));
      else if (ch == "x")
        fieldType = "wall";
      else if (ch =="!")
        fieldType = "ground";
      gridLine.push(fieldType);
    }
    this.grid.push(gridLine);
  }

  this.player = this.actors.filter(function(actor) {
    return actor.type == "player";
  })[0];
  this.status = this.finishDelay = null;
}

Level.prototype.isFinished = function() {
  return this.status != null && this.finishDelay < 0;
};

function Vector(x, y) {
  this.x = x; this.y = y;
}
Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y);
};
Vector.prototype.times = function(factor) {
  return new Vector(this.x * factor, this.y * factor);
};

var actorChars = {
  "@": Player,
  "o": Fish,
  "=": Shark, "|": Shark, "v": Shark,
  "s": Seaweed,
};

var score=0;
var lastScore=0;
var causeOfDeath;


function Player(pos) {
  this.pos = pos.plus(new Vector(0, -0.5));
  this.size = new Vector(0.8, 1.5);
  this.speed = new Vector(0, 0);
}
Player.prototype.type = "player";

function Shark(pos, ch) {
  this.pos = pos;
  this.size = new Vector(3, 2);
  if (ch == "=") {
    this.speed = new Vector(-4, 0);
  } else if (ch == "|") {
    this.speed = new Vector(0, 2);
  } else if (ch == "v") {
    this.speed = new Vector(0, 3);
    this.repeatPos = pos;
  }
}
Shark.prototype.type = "shark";

function Fish(pos, ch){
	this.pos=pos;
	this.size = new Vector(1,1);
	this.speed= new Vector(-2,0);
	this.repeatPos= pos;
}
Fish.prototype.type = "fish";

function Seaweed(pos) {
  this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
  this.size = new Vector(1, 1);
  this.wobble = .5 * Math.PI * 2;
}
Seaweed.prototype.type = "seaweed";


function elt(name, className) {
  var elt = document.createElement(name);
  if (className) elt.className = className;
  return elt;
}

function DOMDisplay(parent, level) {
  this.wrap = parent.appendChild(elt("div", "game"));
  this.level = level;

  this.wrap.appendChild(this.drawBackground());
  this.actorLayer = null;
  this.drawFrame();
}

var scale = 20;

DOMDisplay.prototype.drawBackground = function() {
  var table = elt("table", "background");
  table.style.width = this.level.width * scale + "px";
  this.level.grid.forEach(function(row) {
    var rowElt = table.appendChild(elt("tr"));
    rowElt.style.height = scale + "px";
    row.forEach(function(type) {
      rowElt.appendChild(elt("td", type));
    });
  });
  return table;
};

DOMDisplay.prototype.drawActors = function() {
  var wrap = elt("div");
  this.level.actors.forEach(function(actor) {
    var rect = wrap.appendChild(elt("div", "actor " +
                                           actor.type));
    rect.style.width = actor.size.x * scale + "px";
    rect.style.height = actor.size.y * scale + "px";
    rect.style.left = actor.pos.x * scale + "px";
    rect.style.top = actor.pos.y * scale + "px";
  });
  return wrap;
};

DOMDisplay.prototype.drawFrame = function() {
  if (this.actorLayer)
    this.wrap.removeChild(this.actorLayer);
  this.actorLayer = this.wrap.appendChild(this.drawActors());
  this.wrap.className = "game " + (this.level.status || "");
  this.scrollPlayerIntoView();
};

DOMDisplay.prototype.scrollPlayerIntoView = function() {
  var width = this.wrap.clientWidth;
  var height = this.wrap.clientHeight;
  var margin = width / 3;

  // The viewport
  var left = this.wrap.scrollLeft, right = left + width;
  var top = this.wrap.scrollTop, bottom = top + height;

  var player = this.level.player;
  var center = player.pos.plus(player.size.times(0.5))
                 .times(scale);

  if (center.x < left + margin)
    this.wrap.scrollLeft = center.x - margin;
  else if (center.x > right - margin)
    this.wrap.scrollLeft = center.x + margin - width;
  if (center.y < top + margin)
    this.wrap.scrollTop = center.y - margin;
  else if (center.y > bottom - margin)
    this.wrap.scrollTop = center.y + margin - height;
};

DOMDisplay.prototype.clear = function() {
  this.wrap.parentNode.removeChild(this.wrap);
};

Level.prototype.obstacleAt = function(pos, size) {
  var xStart = Math.floor(pos.x);
  var xEnd = Math.ceil(pos.x + size.x);
  var yStart = Math.floor(pos.y);
  var yEnd = Math.ceil(pos.y + size.y);

  if (xStart < 0 || xEnd > this.width || yStart < 0)
    return "wall";
  if (yEnd > this.height)
    return "shark";
  for (var y = yStart; y < yEnd; y++) {
    for (var x = xStart; x < xEnd; x++) {
      var fieldType = this.grid[y][x];
      if (fieldType) return fieldType;
    }
  }
};

Level.prototype.actorAt = function(actor) {
  for (var i = 0; i < this.actors.length; i++) {
    var other = this.actors[i];
    if (other != actor &&
        actor.pos.x + actor.size.x > other.pos.x &&
        actor.pos.x < other.pos.x + other.size.x &&
        actor.pos.y + actor.size.y > other.pos.y &&
        actor.pos.y < other.pos.y + other.size.y)
      return other;
  }
};

var maxStep = 0.05;

Level.prototype.animate = function(step, keys) {
  if (this.status != null)
    this.finishDelay -= step;

  while (step > 0) {
    var thisStep = Math.min(step, maxStep);
    this.actors.forEach(function(actor) {
      actor.act(thisStep, this, keys);
    }, this);
    step -= thisStep;
  }
};

Shark.prototype.act = function(step, level) {
  var newPos = this.pos.plus(this.speed.times(step));
  if (!level.obstacleAt(newPos, this.size))
    this.pos = newPos;
  else if (this.repeatPos)
    this.pos = this.repeatPos;
  else
    this.speed = this.speed.times(-1);
};

Fish.prototype.act = function(step, level){
 var newPos = this.pos.plus(this.speed.times(step));
  if (!level.obstacleAt(newPos, this.size))
    this.pos = newPos;
  else
    this.pos = this.repeatPos;
}

var wobbleSpeed = 4, wobbleDist = 0.5;

Seaweed.prototype.act = function(step) {
  this.wobble += step * wobbleSpeed;
  var wobblePos = Math.sin(this.wobble) * wobbleDist;
  this.pos = this.basePos.plus(new Vector(0, wobblePos));
};


var playerXSpeed = 12;
var gravity= 20;
var jumpSpeed= 6;

Player.prototype.move = function(step, level, keys) {
  this.speed.x = 0;
  this.speed.y += step * gravity;

  if (keys.left){
    this.speed.x -= playerXSpeed;
    this.speed.y = -jumpSpeed;
  }
  if (keys.right){
    this.speed.x += playerXSpeed;
    this.speed.y = -jumpSpeed;
  }

  var motion = new Vector(this.speed.x * step, this.speed.y * step);
  var newPos = this.pos.plus(motion);
  var obstacle = level.obstacleAt(newPos, this.size);
  if (obstacle)
    level.playerTouched(obstacle);
  else
    this.pos = newPos;
};


Player.prototype.act = function(step, level, keys) {
  this.move(step, level, keys);

  var otherActor = level.actorAt(this);
  if (otherActor)
    level.playerTouched(otherActor.type, otherActor);

  // Losing animation
  if (level.status == "lost") {
    this.pos.y += step;
    this.size.y -= step;
  }
};

Level.prototype.playerTouched = function(type, actor) {
  if ((type == "shark" || type == "ground") && this.status == null) {
    causeOfDeath= type;
    if(causeOfDeath=="shark")
      sharkDeaths++;
    else if(causeOfDeath=="ground")
        groundDeaths++;
    document.getElementById("death").innerHTML= "Last Cause of Death: " + causeOfDeath;
    this.status = "lost";
    this.finishDelay = 1;
  }


  else if (type == "fish") {
    this.actors = this.actors.filter(function(other) {
      return other != actor;
    });
    if (!this.actors.some(function(actor) {
      score += 100;
      fishEaten++;
      document.getElementById("score").innerHTML= "Score: " + score;
      return actor.type == "fish";
    })) {
    	if(this.status==null){
      this.status = "won";
      this.finishDelay = 1;
      }
    }
  }
};

var arrowCodes = {37: "left", 39: "right"};

function trackKeys(codes) {
  var pressed = Object.create(null);
  function handler(event) {
    if (codes.hasOwnProperty(event.keyCode)) {
      var down = event.type == "keydown";
      pressed[codes[event.keyCode]] = down;
      event.preventDefault();
    }
  }
  addEventListener("keydown", handler);
  addEventListener("keyup", handler);
  return pressed;
}

function runAnimation(frameFunc) {
  var lastTime = null;
  function frame(time) {
    var stop = false;
    if (lastTime != null) {
      var timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if (!stop)
      requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

var arrows = trackKeys(arrowCodes);

function runLevel(level, Display, andThen) {
    var display = new Display(document.body, level);
    var running = "yes";
    init_timer();
    function handleKey(event) {
      if (event.keyCode == 27) {
        if (running == "no") {
          running = "yes";
          runAnimation(animation);
        } else if (running == "pausing") {
          running = "yes";
        } else if (running == "yes") {
          running = "pausing";
        }
      }
    }
    addEventListener("keydown", handleKey);
    var arrows = trackKeys(arrowCodes);

    function animation(step) {
      if (running == "pausing") {
        running = "no";
    	display.clear();
    	display.drawFrame();
        return false;
      }

      level.animate(step, arrows);
      display.drawFrame(step);
      if (level.isFinished()) {
        display.clear();
        // Here we remove all our event handlers
        removeEventListener("keydown", handleKey);
        arrows.unregister(); // (see change to trackKeys below)
        if (andThen)
          andThen(level.status);
        return false;
      }
    }
    runAnimation(animation);
  }

    function trackKeys(codes) {
    var pressed = Object.create(null);
    function handler(event) {
      if (codes.hasOwnProperty(event.keyCode)) {
        var state = event.type == "keydown";
        pressed[codes[event.keyCode]] = state;
        event.preventDefault();
      }
    }
    addEventListener("keydown", handler);
    addEventListener("keyup", handler);

    // This is new -- it allows runLevel to clean up its handlers
    pressed.unregister = function() {
      removeEventListener("keydown", handler);
      removeEventListener("keyup", handler);
    };
    // End of new code
    return pressed;
  }



function runGame(plans, Display) {
  function startLevel(n) {
    checkAchievements();
    runLevel(new Level(plans[n]), Display, function(status) {
      if (status == "lost"){
        score=lastScore;
        document.getElementById("score").innerHTML= "Score: " + score;
        startLevel(n);
      }
      else if (n < plans.length - 1){
        score += 500;
        lastScore=score;
        document.getElementById("score").innerHTML= "Score: " + score;
        startLevel(n + 1);
      }
      else
        console.log("You win!");
        clear_timer();
    });
  }
  startLevel(0);
}

//Level Time Counter
var timer;
var elapsed;

function init_timer() {
  elapsed = 0;
  tick();
}

function tick() {
  elapsed++;
  document.getElementById('time').innerHTML = "Time Elapsed: "+elapsed+"s";
  score-= 3;
  document.getElementById("score").innerHTML= "Score: " + score;
  timer = setTimeout('tick()', 1000);
}

function clear_timer() {
  clearTimeout(timer);
}


//Achievements
var fishEaten = 0;
var sharkDeaths =0;
var groundDeaths =0;

var myAchievements=[
  //Shark
  {name:"Shark Attack", type:"s", value: 10, text:"Get eaten by sharks 10 times", earned: false},
  {name:"Shark Bait", type:"s", value: 25, text:"Get eaten by sharks 25 times", earned: false},
  {name:"Shark Week", type:"s", value: 50, text:"Get eaten by 50 sharks", earned: false},
  //Ground
  {name:"Sink or Swim", type:"g", value: 20, text:"Touch the ground 20 times", earned: false},
  {name:"Bottom Feeder", type:"g", value: 25, text:"Touch the ground 25 times", earned: false},
  //Fish
  {name:"Feeding Frenzy", type:"f", value: 100, text:"Eat a total of 100 fish", earned: false},
  {name:"Snack Time", type:"f", value: 15, text:"Eat a total of 15 fish", earned: false},
  {name:"Buffet", type:"f", value: 50, text:"Eat a total of 50 fish", earned: false},
  {name:"Dinner", type:"f", value: 25, text:"Eat a total of 25 fish", earned: false},
  //Time
  {name:"Sea Slug", type:"t", value: 180, text:"Spend at least 180 seconds on a level", earned: false},
  {name:"Sea Snail", type:"t", value: 120, text:"Spend at least 120 seconds on a level", earned: false},
  {name:"Fast Food", type:"t", value: 15, text:"Finish a level in under 60 seconds", earned: false}
];

function checkAchievements(){
  console.log("CA called");
  console.log("G: "+ groundDeaths +", S: "+sharkDeaths + ", F: "+fishEaten);
  for(var i=0; i<myAchievements.length; i++){
    if(!myAchievements[i].earned){
      if(myAchievements[i].type=="s"){
        if(sharkDeaths >= myAchievements[i].value){
          myAchievements[i].earned=true;
          console.log("Earned: "+myAchievements[i].name+"- "+ myAchievements[i].text);
        }
      }

      if(myAchievements[i].type=="g"){
        if(groundDeaths >= myAchievements[i].value){
          myAchievements[i].earned=true;
          console.log("Earned: "+myAchievements[i].name+"- "+ myAchievements[i].text);
        }
      }

      if(myAchievements[i].type=="f"){
        if(fishEaten >= myAchievements[i].value){
          myAchievements[i].earned=true;
          console.log("Earned: "+myAchievements[i].name+"- "+ myAchievements[i].text);
        }
      }
    }
  }
}
