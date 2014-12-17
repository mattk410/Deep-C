Parse.initialize("xt3QHvQY0V0puVDNU7iUyOqFtWr08B7nnU57bPY3", "3KPVmOTDZtlZSlJ3zL22OZGqqA53qioFNJk0aXOB");

var loginError = document.getElementById("login-error");
var signupError = document.getElementById("signup-error");
var login = document.getElementById("login-form");
var signup = document.getElementById("signup-form");
var gamePage = document.getElementById("game-page");
var welcomePage = document.getElementById("welcome-page");
var currentPage = "home";

function currentUser()
{
	if(Parse.User.current() != null)
		return true;
	else return false;
}   


var renderAchievements = function () {
    RadarChart.defaultConfig.radius = 2;
    var userAchievements = Parse.User.current().get("achievements"); 
    var createData = function (array,title) {
        var axes = [];
        array.forEach(function (element){
          axes.push({axis: element.name, value: element.value});
        });
        return [{className: title, axes: axes}];
      }
    var achievements = createData(userAchievements,"achievements");
    var chart = RadarChart.chart();
    var cfg = chart.config(); // retrieve default config
    var svg = d3.select('#radar').append('svg') 
                .attr('width', cfg.w)
                .attr('height', cfg.h + cfg.h / 4);
    svg.append('g').classed('single', 1).datum(achievements).call(chart);
    // many radars
    chart.config({w: cfg.w / 4, h: cfg.h / 4, axisText: false, levels: 0, circles: false});
    cfg = chart.config();
    function render() {
        var game = svg.selectAll('g.game').data(achievements);
        game.enter().append('g').classed('game', 1);
        game
          .attr('transform', function(d, i) { return 'translate('+(i * cfg.w)+','+ (cfg.h * 4) +')'; })
          .call(chart);
        setTimeout(render, 1000);
    }
    render();
    console.log("renderAchievements is called!");
}

function showGame() {
    $("#welcome-page").hide();  //hide the welcome page
    //signupError.style.visibility = "hidden"; //hide the error message
    $("#game-page").show();//show the game page and set it as block.  
    $("#status").hide();
    //runGame(GAME_LEVELS, CanvasDisplay);

}

function showHome() { 
    currentPage = "home";
    $("#welcome-page").show();  //show the welcome page
    //signupError.style.visibility = "hidden"; //hide the error message
    $("#game-page").hide(); //show the game page and set it as block.  
    $("#status").hide();
    $("canvas").hide();

}

function showStatus() {
    currentPage = "status";
    $("#welcome-page").hide();  //show the welcome page
    //signupError.style.visibility = "hidden"; //hide the error message
    $("#game-page").hide(); //show the game page and set it as block.  
    $("#status").show();
    $("canvas").hide();
    document.getElementById("welcome-userName").innerHTML = Parse.User.current().get("username") + "!";
    renderAchievements();
    console.log("Status shown!");
}

function createUser(username,password,email)

    {
		var user = new Parse.User();
		user.set("username", username);
		user.set("password", password);
		user.set("email", email);
        user.set("highscore", 0);
        user.set("achievements", [
            {name: "Appetiter",value: 0},
            {name: "Elder",value: 0},
            {name: "Rock!" , value: 0},
            {name: "Level", value: 0},
            {name: "Shark", value: 0}
            
        ]);
		user.signUp(null, {
		  success: function(user) {
              showStatus();
              currentPage = "status";
		  },
		  error: function(user, error) {
			signupError.innerHTML = error.message;
            signupError.style.visibility = "visible";
		  }
		});
    }

function loginUser(username, password){
  Parse.User.logIn(username, password, 
    {         
      success: function(user) 
      {
        showStatus();
          currentPage = "status";
      },
      error: function(user, error) 
      {
        loginError.innerHTML =error.message;   
        loginError.style.visibility = "visible";
      }
    });
}

$("#signup-button").click(function(){
var username = document.getElementById("signup-username").value;
var password = document.getElementById("signup-password").value;
var email = document.getElementById("signup-email").value;
createUser(username,password,email);
});

//for log in: 
$("#login-button").click(function(){
var username = document.getElementById("login-username").value;
var password = document.getElementById("login-password").value;
loginUser(username,password);
});



$("#goSignup").click(function() {
    /*signup.style.display = "inline";
    login.style.display = "none";
    loginError.style.visibility = "hidden";
    signupError.style.visibility = "hidden";*/
    $("#signup-form").show();
    $("#login-form").hide();
});

$("#goLogin").click(function() {
    /*login.style.display = "inline";
    signup.style.display = "none";
    signupError.style.visibility = "hidden";
    loginError.style.visibility = "hidden";*/
    $("#signup-form").hide();
    $("#login-form").show();
});

$("#start").click(function() {
    showGame();
});

$("#logout").click(function () {
    Parse.User.logOut();
    showHome();
   // $("#radar").hide();
    currentPage = "home";
    $("#radar").remove();
});

function saveHighScore (score) {
    var currentUser = Parse.User.current();
    if (score > currentUser.get("highscore"))
    {
        currentUser.set("highscore", score);
        currentUser.save(null, {
            success: function(score) {

            }, 
            error: function (error) {
                //alert(error.code + " " + error.message);
            }
        });
    }
}

function setAchieve (achieveName, value) {
    var currentUser = Parse.User.current();
    var achievements = currentUser.get("achievements");
    achievements.forEach(function(elt) {
        if (elt.name === achieveName)
            elt.value += value;
    }); 
    currentUser.save(null, {
            success: function() {

            }, 
            error: function (error) {
                //alert(error.code + " " + error.message);
            }
        });
}


if (currentUser) {showStatus();}
else showHome();
