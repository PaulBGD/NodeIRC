var NwBuilder = require('node-webkit-builder');
var nw = new NwBuilder({
    files: './**/**', // use the glob format
    platforms: ['osx32', 'osx64', 'win32', 'win64', 'linux32', 'linux64']
});
nw.on('log',  function() {
    // logging is annoying, due to the thousands of lines. let's not
});

nw.build().then(function () {
    console.log('Finished compiling NodeIRC');
}).catch(function (error) {
    console.error(error);
});