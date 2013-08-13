  Scripted
  ========
  
  Class for managing timeline cuepoint actions in JavaScript
  Designed to be used with CSS3 animations
  Compatible with both Zepto & jQuery
  
  Usage:
  ======
  
  Scripted uses a constructor so multiple instances can exist in a single page.
  
  var scripted = new Scripted(60, 4, true); // 60fps, 4 seconds, repeating
  scripted.using('#test')
    .at('1 addClass show')
    .at('2 removeClass hide');
    
  scripted.using(MyClass) // scope can be a selector or an object
    .at('1 callFunction myFunction');

  
  Please visit http://am13.com/scripted for more examples.
  
  https://github.com/thedatalife/scripted
  Scripted library by Miles Ryan
 
  MIT license
