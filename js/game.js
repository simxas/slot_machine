//CONSTANTS=============
var IMAGE_HEIGHT = 155;
var IMAGE_TOP_MARGIN = 10;
var IMAGE_BOTTOM_MARGIN = 10;
var SLOT_SEPARATOR_HEIGHT = 2
var SLOT_HEIGHT = IMAGE_HEIGHT + IMAGE_TOP_MARGIN + IMAGE_BOTTOM_MARGIN + SLOT_SEPARATOR_HEIGHT;
var RUNTIME = 600;
var ITEM_COUNT = 6;
var OTHER_IMAGES_COUNT = 7;
var SLOT_SPEED = 40;

window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
        };
})();


function shuffleArray( array ) {

    for ( i = array.length - 1; i > 0; i-- ) {
	var j = parseInt( Math.random() * i )
	var tmp = array[i];
	array[i] = array[j]
	array[j] = tmp;
    }
}

function copyArray( array ) {
    var copy = [];
    for( var i = 0 ; i < array.length; i++ ) {
	copy.push( array[i] );
    }
    return copy;
}

// Images must be preloaded before they are used to draw into canvas
function preloadImages( images, asset_images, url, callback ) {
	function _preload( asset ) {
		asset.img = new Image();
		asset.img.src = url + asset.id+'.png';

		asset.img.addEventListener( "load", function() {
			_check();
		}, false );

		asset.img.addEventListener( "error", function( err ) {
			_check( err, asset.id );
		}, false );
	}

	var loadc = 0;
	function _check( err, id ) {
		if ( err ) {
			alert( 'Failed to load ' + id );
		}
		loadc++;
		if ( loadc == 13 ) {
			return callback()			
		} 
	}

	images.forEach( function( asset ) {
	_preload( asset );
	});

	asset_images.forEach( function( asset ) {
	_preload( asset );
	});
} // end of preloadImages


// AUDIO PART==========================================================

function _initWebAudio( AudioContext, format, audios, audio_url, callback ) {

    var context = new AudioContext();

    function _preload( asset ) {
        var request = new XMLHttpRequest();
        request.open( 'GET',  audio_url + asset.id + '.' + format, true );
        request.responseType = 'arraybuffer';

        request.onload = function() {
            context.decodeAudioData( request.response, function( buffer ) {

                asset.play = function() {
                    var source = context.createBufferSource();
                    source.buffer = buffer;
                    source.connect( context.destination );

                    source.noteOn ? source.noteOn( 0 ) : source.start( 0 );
                };
                asset.gain = context.createGain ? context.createGain() : context.createGainNode();
                asset.gain.connect( context.destination );
                asset.gain.gain.value = 0.5;

                _check();

            }, function( err ) {
                asset.play = function() {};
                _check( err, asset.id );
            });
        };
        request.onerror = function( err ) {
            asset.play = function() {};
            _check( err, asset.id );
        };
        // kick off load
        request.send();
    }
    var loadc = 0;
    function _check( err, id ) {
        if ( err ) {
            alert( 'Failed to load ' + id + '.' + format );
        }
        loadc++;
        if ( audios.length == loadc ) callback();
    }

    audios.forEach(function( asset ) {
        _preload( asset );
    });

}

function _initHTML5Audio( format, audios, audio_url, callback ) {

    function _preload( asset ) {
        asset.audio = new Audio( audio_url + asset.id + '.' + format );
        asset.audio.preload = 'auto';
        asset.audio.addEventListener( "loadeddata", function() {
            asset.play = function() {
                asset.audio.play();
            };
            asset.audio.volume = 0.6;

            _check();
        }, false );

        asset.audio.addEventListener( "error", function( err ) {
            asset.play = function() {}; // dummy

            _check( err, asset.id );
        }, false );

    }
    var loadc = 0;
    function _check( err, id ) {
        if ( err ) {
            alert( 'Failed to load ' + id + '.' + format );
        }
        loadc++;
        if ( audios.length == loadc ) callback();
    }

    audios.forEach(function( asset ) {
        _preload( asset );
    });
}

// Initializes audio and loads audio files
function initAudio( audios, audio_url, callback ) {

    var format = 'mp3';
    var elem = document.createElement( 'audio' );
    if ( elem ) {
        if( !elem.canPlayType( audio_url + 'mpeg;' ) && elem.canPlayType( audio_url + 'ogg;' )) format = 'ogg';
    }

    var AudioContext = window.webkitAudioContext || window.mozAudioContext || window.MSAudioContext || window.AudioContext;

    if ( AudioContext ) {
        // Browser supports webaudio
        return _initWebAudio( AudioContext, format, audios, audio_url, callback );
    } else if ( elem ) {
        // HTML5 Audio
        return _initHTML5Audio( format, audios, audio_url, callback );
    } else {
        // audio not supported
        audios.forEach(function( item ) {
            item.play = function() {}; // dummy play
        });
        callback();
    }
}
// AUDIO PART==========================================================

function Main( retData ) {
	var game = new Game();

	var url = retData["urls"][0]["images"];
	var audio_url = retData["urls"][0]["audio"];

	game.click_play.className = "visible";
	game.cliked_play.className = "hidden";
	game.game_over.className = "hidden";
	game.state = 0;
	
	var items = [ 
		{id: 'SYM1'},
		{id: 'SYM3'},
		{id: 'SYM4'},
		{id: 'SYM5'},
		{id: 'SYM6'},
		{id: 'SYM7'}
	];

	var asset_images = [
		{id: 'BG'},
		{id: 'BG2'},
		{id: 'BG3'},
		{id: 'BTN_Spin'},
		{id: 'BTN_Spin_d'},
		{id: 'continue'},
		{id: 'new_arrow'}
	];

	// Audio file names
    var audios = [
        {id: 'roll'}, // Played on roll tart
        {id: 'slot'}, // Played when reel stops
        {id: 'win'},  // Played on win
        {id: 'nowin'}  // Played on game over
    ];

	var dom_elements = [
		game.container,
		game.top_overlay,
		game.game_over,
		game.click_play,
		game.cliked_play,
		game.click_continue,
		game.select
	];

	game.audios = audios;

	preloadImages( items, asset_images, url, function() {
		// images are preloaded

		initAudio( audios, audio_url, function() {

			game.loading.innerHTML = "<h1>GAME WAS LOADED</h1>";
	        game.start.disabled = false;
			// draws slots
			function _fill_canvas( canvas, items ) {
				ctx = canvas.getContext( '2d' );
				ctx.fillStyle = '#ddd';
				ctx.clearRect( 0, 0, canvas.width, canvas.height );

				for ( var i = 0 ; i < ITEM_COUNT ; i++ ) {
					var asset = items[i];
					ctx.save();
					ctx.drawImage( asset.img, 0, i * SLOT_HEIGHT + IMAGE_TOP_MARGIN );
					ctx.drawImage( asset.img, 0, ( i + ITEM_COUNT ) * SLOT_HEIGHT + IMAGE_TOP_MARGIN );
					ctx.restore();
				}
			}

			// load other images into page
			function _load_images( asset_images, dom_elements ) {
				for ( var i = 0 ; i < OTHER_IMAGES_COUNT ; i++ ) {
					var asset = asset_images[i];
					var element = dom_elements[i];

					element.style.backgroundImage = 'url('+ asset.img.src +')';
					if ( i == 3 ) {
						element.src = asset.img.src;
					}
					if ( i == 4 ) {
						element.src = asset.img.src;
					}
					if ( i == 5 ) {
						element.src = asset.img.src;
					}
				}
			}

			_load_images( asset_images, dom_elements );

			// Draw the canvases with shuffled arrays
			game.items1 = copyArray( items );
			shuffleArray( game.items1 );
			_fill_canvas( game.canvas1, game.items1 );
			game.items2 = copyArray( items );
			shuffleArray( game.items2 );
			_fill_canvas( game.canvas2, game.items2 );
			game.items3 = copyArray( items );
			shuffleArray( game.items3 );
			_fill_canvas( game.canvas3, game.items3 );

			game.loop();

		});// end of initAudio

	});//end of preloadImages

	game.click_play.addEventListener( 'click', function() {
		game.click_play.className = "hidden";
		game.cliked_play.className = "visible";

		game.audios[0].play();

		game.rungame();
	});

	game.click_continue.addEventListener( 'click', function() {
		// game = null;
		// Main(retData);
		location.reload();
	});
	
}//end of Main

function Game() {
	this.canvas1 = document.getElementById( "canvas1" );
	this.canvas2 = document.getElementById( "canvas2" );
	this.canvas3 = document.getElementById( "canvas3" );

	// other DOM elements
	this.loading = document.getElementById( "loading" );
	this.start = document.getElementById( 'start' );
	this.top_overlay = document.getElementById( "top" );
	this.container = document.getElementById( "container" );
	this.click_play = document.getElementById( "click_play" );
	this.cliked_play = document.getElementById( "cliked_play" );
	this.game_over = document.getElementById( "game_over" );
	this.click_continue = document.getElementById( "click_continue" );
	this.select = document.getElementById( "selection" );
	this.money = document.getElementById( "money" );


	this.top1 = this.canvas1.getBoundingClientRect();
	this.pos1 = this.top1.top;
	this.top2 = this.canvas2.getBoundingClientRect();
	this.pos2 = this.top2.top;
	this.top3 = this.canvas3.getBoundingClientRect();
	this.pos3 = this.top3.top;

	// random place from item list
	this.randomPlace1;
	this.randomPlace2;
	this.randomPlace3;

	// results holding selected fruit
	this.result1;
	this.result2;
	this.result3;

	this.lastUpdate = new Date();

	this.total_money = 40;
	this.money.innerHTML = this.total_money;
}

Game.prototype.loop = function() {
    var that = this;
    that.running = true;
    ( function gameLoop() {
	that.update();
	that.draw();
	if ( that.running ) {
	    requestAnimFrame( gameLoop );
	}
    })();
}

Game.prototype.rungame = function(){
	this.state = 1;
	this.run = true;
	this.bugnas1 = true;
	this.bugnas2 = true;
	this.bugnas3 = true;
	this.lastUpdate = new Date();

	this.selected_fruit = this.select.options[this.select.selectedIndex].value;

	// Clear stop locations
    this.stopped1 = false;
    this.stopped2 = false;
    this.stopped3 = false;

	this.randomPlace1 = Math.floor( Math.random() * ( 5 - 1 + 1 ) ) + 1;
	this.result1 = this.items1[this.randomPlace1];
	

	this.randomPlace2 = Math.floor( Math.random() * ( 5 - 1 + 1 ) ) + 1;
	this.result2 = this.items2[this.randomPlace2];
	

	this.randomPlace3 = Math.floor( Math.random() * ( 5 - 1 + 1 ) ) + 1;
	this.result3 = this.items3[this.randomPlace3];

	this.total_money -= 10;
	this.money.className = "lost";
	setTimeout( function() {
		this.money.className = "win";
	}, 300 );
	this.money.innerHTML = this.total_money;
}

Game.prototype.draw = function(){
	// play button was clicked, fruits are spinning
	if ( this.run == true ) {

		if ( this.bugnas1 ) {
			this.canvas1.style.top = ( this.pos1 += SLOT_SPEED ) + "px";			
		}
		if ( this.bugnas2 ) {
			this.canvas2.style.top = ( this.pos2 += SLOT_SPEED ) + "px";			
		}
		if ( this.bugnas3 ) {
			this.canvas3.style.top = ( this.pos3 += SLOT_SPEED ) + "px";			
		}

	    if ( this.pos1 >= 0 ) {
	        this.pos1 = -1071;
	    }
	    if ( this.pos2 >= 0 ) {
	        this.pos2 = -1071;
	    }
	    if ( this.pos3 >= 0 ) {
	        this.pos3 = -1071;
	    }

		
	}
}

Game.prototype.update = function(){
	var now = new Date();
    var that = this;

    function _check_result( selected_fruit, first, second, third ) {

    	// check if all three are the same and no fruit selected
		if ( selected_fruit == "none" ) {
			if ( first.id == second.id && second.id == third.id ) {
				that.money.className = "won";
				that.total_money += 100;
				that.audios[2].play();
				that.money.innerHTML = that.total_money;
				setTimeout( function() {
					that.money.className = "win";
				}, 300 );
				that.state = 7;
			}
		}

		// if fruit was selected but you roll different three similar cards
		if ( selected_fruit != "none" ) {
			if ( first.id == second.id && second.id == third.id ) {
				that.money.className = "won";
				that.total_money += 100;
				that.audios[2].play();
				that.money.innerHTML = that.total_money;
				setTimeout( function() {
					that.money.className = "win";
				}, 300 );
				that.state = 7;
			}
		}

		// fruit was selected, two are the same
		if( selected_fruit != "none" ) {
			if ( selected_fruit == first.id && selected_fruit == second.id || selected_fruit == second.id && selected_fruit == third.id || selected_fruit == first.id && selected_fruit == third.id ) {
				that.money.className = "won";
				that.total_money += 50;
				that.audios[2].play();
				that.money.innerHTML = that.total_money;
				setTimeout( function() {
					that.money.className = "win";
				}, 300 );
				that.state = 7;
			}
		}

		// fruit was selected and all three are the same as selected fruit
		if( selected_fruit != "none" ) {
			if ( selected_fruit == first.id && selected_fruit == second.id && selected_fruit == third.id ) {
				that.money.className = "won";
				that.total_money += 200;
				that.audios[2].play();
				that.money.innerHTML = that.total_money;
				setTimeout( function() {
					that.money.className = "win";
				}, 300 );
				that.state = 7;
			}
		}

		// wild was selected and all three are the same
		if( selected_fruit == "SYM1" ) {
			if ( selected_fruit == first.id && selected_fruit == second.id && selected_fruit == third.id ) {
				that.money.className = "won";
				that.total_money += 500;
				that.audios[2].play();
				that.money.innerHTML = that.total_money;
				setTimeout( function() {
					that.money.className = "win";
				}, 300 );
				that.state = 7;
			}
		}

		if( that.total_money == 0 ) {
			that.audios[3].play();

			// showing "game over" screen
			setTimeout( function() {
				that.game_over.className = "visible";
			}, 300 );
			that.state = 0;
		}

    }

    function _check_slot( randomPlace, canvas ) {
    	if ( randomPlace == 1 ) {
				canvas.style.top = 20+'px';
				setTimeout( function() {
					canvas.style.top = 0+'px';
				}, 300 );
				return true;
		}
		if ( randomPlace == 2 ) {
				canvas.style.top = -157+'px';
				setTimeout( function() {
					canvas.style.top = -177+'px';
				}, 300 );
				return true;
		}
		if ( randomPlace == 3 ) {
				canvas.style.top = -334+'px';
				setTimeout( function() {
					canvas.style.top = -354+'px';
				}, 300 );
				return true;
		}
		if ( randomPlace == 4 ) {
				canvas.style.top = -511+'px';
				setTimeout( function() {
					canvas.style.top = -531+'px';
				}, 300 );
				return true;
		}
		if ( randomPlace == 5 ) {
				canvas.style.top = -688+'px';
				setTimeout( function() {
					canvas.style.top = -708+'px';
				}, 300 );
				return true;
		}
    }

	switch ( this.state ) {
	    case 1: // all slots spinning
		if ( now - this.lastUpdate > RUNTIME ) {
		    this.state = 2;
		    this.lastUpdate = now;
		}
		break;
	    case 2: // slot 1
	    if ( now - this.lastUpdate > RUNTIME ) {
			this.bugnas1 = false;
			this.audios[1].play();
			this.stopped1 = _check_slot( this.randomPlace1, this.canvas1 );
			if ( this.stopped1 ) {
			    this.state++;
			    this.lastUpdate = now;
			}
		}
		break;
	    case 3: // slot 1 stopped, slot 2
	    if ( now - this.lastUpdate > RUNTIME ) {
		    this.bugnas2 = false;
		    this.audios[1].play();
			this.stopped2 = _check_slot( this.randomPlace2, this.canvas2 );
			if ( this.stopped2 ) {
			    this.state++;		    
			    this.lastUpdate = now;
			}
		}
		break;
	    case 4: // slot 2 stopped, slot 3
	    if ( now - this.lastUpdate > RUNTIME ) {
		    this.bugnas3 = false;
		    this.audios[1].play();
			this.stopped3 = _check_slot( this.randomPlace3, this.canvas3 );
			if ( this.stopped3 ) {
			    this.state++;
			}
		}
		break;
	    case 5: // slots stopped 
	    	this.click_play.className = "visible";
			this.cliked_play.className = "hidden";
			this.state++;

			// DEBUG
			// =============================
			// this.result1.id = "SYM3";
			// this.result2.id = "SYM3";
			// this.result3.id = "SYM3";
			// this.selected_fruit = "SYM3";
			// =============================

			_check_result( this.selected_fruit, this.result1, this.result2, this.result3 );
		break;
	    default:
    }
} //end of Update

