Parse.initialize("xt3QHvQY0V0puVDNU7iUyOqFtWr08B7nnU57bPY3", "3KPVmOTDZtlZSlJ3zL22OZGqqA53qioFNJk0aXOB");

var loginError = document.getElementById("login-error");
var signupError = document.getElementById("signup-error");
var login = document.getElementById("login-form");
var signup = document.getElementById("signup-form");
var gamePage = document.getElementById("game-page");
var welcomePage = document.getElementById("welcome-page");
function createUser(username,password,email)

    {
		var user = new Parse.User();
		user.set("username", username);
		user.set("password", password);
		user.set("email", email);
        user.set("highscore", 0);
		user.signUp(null, {
		  success: function(user) {
              document.getElementById("signup-error").style.visibility = "hidden";
              gamePage.style.display = "block";
              welcomePage.style.display = "none";
              runGame(GAME_LEVELS, CanvasDisplay);
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
        document.getElementById("login-error").style.visibility = "hidden";
        gamePage.style.display = "block";
        welcomePage.style.display = "none";
        runGame(GAME_LEVELS, CanvasDisplay);
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
   
    signup.style.display = "inline";
    login.style.display = "none";
    loginError.style.visibility = "hidden";
    signupError.style.visibility = "hidden";
});

$("#goLogin").click(function() {
    login.style.display = "inline";
    signup.style.display = "none";
    signupError.style.visibility = "hidden";
    loginError.style.visibility = "hidden";
});

function saveHighScore (score) {
    var currentUser = Parse.User.current();
    if (score > currentUser.get("highscore"))
    {
        currentUser.set("highscore", score);
        currentUser.save(null, {
            success: function(score) {
                alert("You break your recored, now your highest score is ",score, "points!");
            }, 
            error: function () {
                alert("something Wrong!");
            }
        });
    }
}


    
