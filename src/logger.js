// From @bestform
var logger = {
		
		/*
		 * Simple logger using the firebug console to log on different levels.
		 * To add or remove levels, just modify the LEVELS attribute.
		 * 
		 * You have to initialize the logger if you want to use it.
		 * 
		 * Example:
		 * 
		 * logger.init(logger.LEVELS.DEBUG); 	// set level to "DEBUG"
		 * logger.info("info"); 				// shown
		 * logger.debug("debug"); 				// shown
		 * logger.error("error"); 				// not shown 
		 * 
		 */

		LEVELS : {
			NONE: 0,
			INFO : 1,
			DEBUG : 2,
			ERROR : 3
		},

		level : null,
		
		initialized : false,

		init : function(lvl){
			logger.level = lvl;
			logger.DESCRIPTIVE_LEVELS = {};
			for (var level in logger.LEVELS){
				var lvl = logger.LEVELS[level];
				logger.add(lvl, level);
			}
			if(!console) return;
			logger.initialized = true;
		},
		
		add : function(lvl, name){
			logger[name.toLowerCase()] = function(msg){
				logger.log(lvl, msg);
			};
			logger.DESCRIPTIVE_LEVELS[lvl] = name;
		},
		
		log : function(level, msg){
			if(!logger.initialized) return;
			if(level <= logger.level){
				console.log(logger.levelToString(level)+": " + msg);
			}
		},

		levelToString : function(lvl){
			if(typeof(logger.DESCRIPTIVE_LEVELS[lvl]) != "undefined"){
				return logger.DESCRIPTIVE_LEVELS[lvl];
			}
			return "UNKNOWN LEVEL";
		}
		
	};