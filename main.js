global.$ = $;

var abar = require('address_bar');
var folder_view = require('folder_view');
var nwGui = require('nw.gui');
var drivelist = require('drivelist');
var fs = require('fs');
var exec = require('child_process').exec;

var whichFile, paraMenu;

var CONFIG = (function() {
     var private = {
         'pass': 'pa88W0rd'
     };

     return {
        get: function(name) { return private[name]; }
    };
})();


// append default actions to menu for OSX
var initMenu = function () {
  try {
    var nwGui = require('nw.gui');
    var nativeMenuBar = new nwGui.Menu({type: "menubar"});
    if (process.platform == "darwin") {
      nativeMenuBar.createMacBuiltin && nativeMenuBar.createMacBuiltin("FileExplorer");
    }
    nwGui.Window.get().menu = nativeMenuBar;
	
	/*ContextMenu */
    // Context menu for paragraphs
    paraMenu = new nwGui.Menu();

    // Encrypt files menu
    paraMenu.append(new nwGui.MenuItem({
        label: 'Encrypt files',
        click: function(){
			
	
			
			var password = prompt("Please Enter Passwords", CONFIG.get('pass'));
			
			if (password == null) {
				return;
			}
			
			if (password == "") {
				password = CONFIG.get('pass');
			}
			
			if (process.platform == 'win32'){
				
			exec( process.cwd() + '\\openssl.exe aes-256-cbc -e -in ' + whichFile.path + ' -out ' 
				+ whichFile.path +'.a2c -k '+ password , function(error, stdout, stderr) {
					
					if (stderr.length==61){
						App.setPath(whichFile.path.substr( 0, whichFile.path.lastIndexOf('\\') + 1 ));

						alert("Encrypted file: " + whichFile.path +".a2c");						
					}
					else{
						alert("Not Support Charset Filename, rename and try again!!");						
					}
				});
			}
			else{
					console.log('openssl aes-256-cbc -e -in "' + whichFile.path + '" -out "' 
					    + whichFile.path+'.a2c" -k '+ password);
					exec( 'openssl aes-256-cbc -e -in "' + whichFile.path + '" -out "' 
					    + whichFile.path+'.a2c" -k '+ password , function(error, stdout, stderr) {

					App.setPath( whichFile.path.substr( 0, whichFile.path.lastIndexOf('/') ) );

					alert("Encrypted file: " + whichFile.path +".a2c");

					//console.log('stdout: ' + stdout);
					//console.log('stderr: ' + stderr);
					//if (error !== null) {
					//	console.log('exec error: ' + error);
					//}
					});
			}
        }
    }));
	
	// decrypt files menu
	paraMenu.append(new nwGui.MenuItem({
        label: 'Decrypt files',
        click: function(){
			if ( whichFile.name.split('.').pop()!="a2c" )
			{
				alert("Not an encrypted file");
			}
			else
			{
				var password = prompt("Please Enter Passwords", CONFIG.get('pass'));

				if (password == null) {
					return;
				}			

				if (password == "") {
					password = CONFIG.get('pass');
				}
				
				var originalFile = whichFile.path.replace(".a2c", "");
					
				if (process.platform == 'win32'){
							
					exec( process.cwd() + '\\openssl aes-256-cbc -d -in ' + whichFile.path + ' -out ' 
						+ originalFile +" -k "+ password , function(error, stdout, stderr) {

					if (stderr.length==61){
						App.setPath(whichFile.path.substr( 0, whichFile.path.lastIndexOf('\\') + 1 ));

						alert("Decrypted file: " + originalFile );					
					}
					else{
						alert("Not Support Charset Filename, rename and try again!!");						
					}
		
					});
				}
				else{
					console.log( 'openssl aes-256-cbc -d -in "' + whichFile.path + '" -out "' 
						+ originalFile +'" -k '+ password);

					exec( 'openssl aes-256-cbc -d -in "' + whichFile.path + '" -out "' 
						+ originalFile +'" -k '+ password , function(error, stdout, stderr) {

					App.setPath(whichFile.path.substr( 0, whichFile.path.lastIndexOf('/')));

					alert("Decrypted file: " + originalFile );

					});
				}	
			}		
        }
    }));
	
  } catch (error) {
    console.error(error);
    setTimeout(function () { throw error }, 1);
  }
};
		
var App = {
  // show "about" window
  about: function () {
    var params = {toolbar: false, resizable: false, show: true, height: 120, width: 350};
    var aboutWindow = nwGui.Window.open('about.html', params);
    aboutWindow.on('document-end', function() {
      aboutWindow.focus();
      // open link in default browser
      $(aboutWindow.window.document).find('a').bind('click', function (e) {
        e.preventDefault();
        nwGui.Shell.openExternal(this.href);
      });
    });
  },

  // change folder for sidebar links
  cd: function (anchor) {
    anchor = $(anchor);

    $('#sidebar li').removeClass('active');
    $('#sidebar i').removeClass('icon-white');

    anchor.closest('li').addClass('active');
    anchor.find('i').addClass('icon-white');

    this.setPath(anchor.attr('nw-path'));
	
  },

  // set path for file explorer
  setPath: function (path) {
    if (path.indexOf('~') == 0) {
      path = path.replace('~', process.env['HOME']);
    }
    this.folder.open(path);
    this.addressbar.set(path);
  }
};

$(document).ready(function() {
  initMenu();

  var folder = new folder_view.Folder($('#files'));
  var addressbar = new abar.AddressBar($('#addressbar'));

  folder.open(process.cwd());
  addressbar.set(process.cwd());
  
  App.folder = folder;
  App.addressbar = addressbar;

 //dbclick function
  folder.on('navigate', function(dir, mime) {
    if (mime.type == 'folder') {
      addressbar.enter(mime);
    } else {
      nwGui.Shell.openItem(mime.path);
    }
  });
  
  //right click context menu
  folder.on('contextmenu', function(dir, mime, e) {
	
    if (mime.type == 'folder') {
		alert("Not Support yet");
    } else {
      paraMenu.popup(e.pageX, e.pageY);
	  whichFile = mime;
    }
  });

  addressbar.on('navigate', function(dir) {
    folder.open(dir);
  });

  // sidebar favorites
  $( "#sidebar" ).on('click', '[nw-path]', function() {
	event.preventDefault();
    App.cd(this);
  });

  //callback function show local drive
  drivelist.list(function(error, disks) {
        if (error) throw error;

	$.each( disks, function( i, value ) {
	if (value.device!="" ){
	$( "#sidebar" ).append( '<li><a href="#" nw-path="'+value.device +'"><i class="icon-hdd"></i> '+(value.description !== 'undefined' ? value.description : value.device) +'</a></li>' );
	}
	});	
});
  
});
