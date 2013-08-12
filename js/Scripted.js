  /*
      
      
      
  Scripted
  Class for managing timeline cuepoint actions in JavaScript
  Designed to be used with CSS3 animations
  Compatible with both Zepto & jQuery
  
  Usage:
  Scripted uses a constructor so multiple instances can exist in a single page.
  
  var s1 = new Scripted({fps:18});
  s1.using('#test')
    .at('60 addClass show')
    .at('120 removeClass hide');
    
  s1.using(MyClass) // scope can be a selector or an object
    .at('60 callFunction myFunction');
  
  http://am13.com/scripted
  https://github.com/thedatalife/scripted
  Scripted library by Miles Ryan
 
  MIT license
  
  */
   var Scripted = function() {
     
     $.extend(this, Scripted.properties);
     
     // it is optional to pass arguments in the constructor (fps, totalTimeInSeconds, shouldRepeat)
     // only skip if you are using the setupTimer method
     // or passing options in through the loadScript method
     if(typeof arguments[0] !== "undefined" 
        && typeof arguments[1] !== "undefined") {

       var fps = arguments[0], 
         totalTimeInSeconds = arguments[1], 
         shouldRepeat = false;
       
       // shouldRepeat will default to false unless a third argument is passed
       if(typeof arguments[2] !== "undefined") {
         shouldRepeat = arguments[2];
       }
         
       this.setupTimer(fps, totalTimeInSeconds, shouldRepeat);
     }     
   }
   
   // default properties, don't change these
   Scripted.properties = {
     timer: null,
     isTimerRunning: false,
     fps: 60,
     delay: 18, // 60 fps is default
     totalTimeInSeconds: 10,
     totalTimeInFrames: 600,
     shouldRepeat: true,
     timestamp: 0,
     loopCounter: 0,
     currentTime: 0,
     currentFrame: 0,
     actions: {}
   };
   
   // the action methods are used by the cuepoint functions.
   // functionality can be added to Scripted by adding to this list.
   // during function execution, the anonomyous function uses the action string
   // to create a reference to the desired function and calls it
   // scope and value are passed to all action methods
   Scripted.actionMethods = {
     addClass: function(scope, value, currentFrame) {
       $(scope).addClass(value);
     },
     removeClass: function(scope, value, currentFrame) {
       $(scope).removeClass(value);
     },
     callFunction: function(scope, value, currentFrame) {
       var functionReference = $.proxy(scope[value], scope);
       functionReference(currentFrame);
     }
   };
   
   /* 
   Scripted prototype is broken out into three sections
   public methods, timing, actions
   the timing uses requestAnimationFrame combined with a time delta calculated every frame
   the frame loop is independant of the time loop and will be called with the millisecond counter
   reaches the threshold. In the event of a cpu holdup, the frameloop may not be exact but will catch up
   instantly the next time the timing loop fires.
   */
   
   Scripted.prototype = {
     // "public" functions
     setupTimer: function(fps, totalTimeInSeconds, shouldRepeat) {
      this.delay = this.delay = Number(1000 / fps).toPrecision(2);
      this.totalTimeInFrames = fps * totalTimeInSeconds;
      this.isTimerRunning = false;
      this.fps = fps;
      this.shouldRepeat = shouldRepeat;
      this.totalTimeInSeconds = totalTimeInSeconds;
      this.resetTimer();
     },
     startTimer: function() {
       this.isTimerRunning = true;
       this.timestamp = Date.now();
       this.timer = requestAnimationFrame($.proxy(this.timerLoop, this));
     },
     pauseTimer: function() {
       this.isTimerRunning = false;
     },
     stopTimer: function() {
       this.isTimerRunning = false;
     },
     
     using: function(scope) {
       this.scope = scope;
       
       return this;
     },
     at: function(script) {
       this.parseScript(script);
       
       return this;
     },
     every: function(script) {
       // todo: figure out how to have repeating events
     },
     loadScript: function(jsonScript) {
       this.parseJsonScript(jsonScript);
     },
     
     // "private" functions
     resetTimer: function() {
       this.loopCounter = 0;
       this.currentTime = 0;
       this.currentFrame = 0;
     },
     timerLoop: function() {
       
       // grab timestamp to calculate the time elapsed since last timeLoop call
       var timestamp = Date.now();
       var timeDelta = timestamp - this.timestamp;
       
       // increment counters by timedelta
       this.loopCounter += timeDelta;
       this.currentTime += timeDelta;
       
       // check if loopcounter has passed the length of one frame
       // the while loop allows the frameLoop to catch up if the loop counter is
       // more than twice the length of a frame. this also ensures no frames are skipped
       while(this.loopCounter > this.delay) {
         this.loopCounter -= this.delay;
         this.frameLoop();
       }
       
       if(this.isTimerRunning) {
         this.timestamp = timestamp;
         this.timer = requestAnimationFrame($.proxy(this.timerLoop, this));
       }
     },
     
     // because the frame loop never skips a frame, to check if an action should take place
     // all we need to do is construct the proper key string and check if it exists.
     frameLoop: function() {
       this.currentFrame ++;
       var key = "frame" + this.currentFrame;
       if(this.actions.hasOwnProperty(key)) {
         // every valid key is an array to allow for multiple actions on the same frame
         var functionCount = this.actions[key].length;
         for(var i = 0; i < functionCount; i++) {
           // each action is passed the actionMethods set of functions and the currentFrame
           this.actions[key][i](Scripted.actionMethods, this.currentFrame);
         }
       }
       
       // check to end
       if(this.currentFrame >= this.totalTimeInFrames) {
         if(this.shouldRepeat) {
           this.resetTimer();
         } else {
           this.resetTimer();
           this.isTimerRunning = false;
         }
       }
     },
     /*
      
     The script always comes in as "frame actionKey value"
     Anonmyous functions are created for each action and added to the actions array
     Each anonomyous function is extended with the actionMethods set of 
     
     */
     parseScript: function(script) {
                    
      var scriptArray = script.split(" ");
      
      var timeKey = "frame"+scriptArray[0],
          action = scriptArray[1],
          value = scriptArray[2],
          scope = this.scope;
      
      // check if an array exists at this key, otherwise, create it
      if(!this.actions.hasOwnProperty(timeKey)) {
        this.actions[timeKey] = [];
      }
      
      // create a simple anonmyous function that will be passed functionality when called
      this.actions[timeKey].push(function(methods, currentFrame) {
        // the methods variable will contain the Scripted.actionMethods set of methods
        methods[action](scope, value, currentFrame);
      });
     },
     
     parseJsonScript: function(script) {
       /*
       // this is the format to use for the json script, options are not necessary
         {
           "options": {"fps": 60, "length": 10, "shouldRepeat": true},
           "actions": [
              {
                "using": "#test",
                "at": [
                  "60 addClass show",
                  "120 removeClass show"
                ]
              }
           ]
         }
       */
      if(script.hasOwnProperty("options")) {
          console.log(script.options);
         this.setupTimer(script.options.fps, script.options.totalTimeInSeconds, script.options.shouldRepeat);
       }
       
       var actionCount = script.actions.length,
        i = 0,
        action = null;
       
       for(i = 0; i < actionCount; i++) {
        action = script.actions[i];
        this.using(action.using);
        for(a = 0; a < action.at.length; a++) {
          this.at(action.at[a]);
        }
       }
     }
   };

  
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
 
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
 
// MIT license
 
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());