function outerHtml(stuff) {
	return $("<div>").append(stuff).html();
}

function TweetWrapper(tweet, isSearchResult) {
	this.tweet = tweet;
	this.isSearchResult = isSearchResult;
	
	this.getCreatedAt = function() {
		return tweet.created_at;
	};
	
	this.getId = function() {
		return tweet.id;
	};
	
	this.getInReplyToScreenName = function() {
		return !isSearchResult ? tweet.in_reply_to_screen_name : null; 
	};
	
	this.getInReplyToStatusId = function() {
		return !isSearchResult ? tweet.in_reply_to_status_id : null; 
	};
	
	this.getUserProfileImageUrl = function() {
		return isSearchResult ? tweet.profile_image_url : tweet.user.profile_image_url;
	};
	
	this.getSource = function() {
		return isSearchResult ? this.unescapeHtml(tweet.source) : tweet.source;
	};
	
	this.getText = function() {
		return tweet.text;
	};
	
	this.getUserId = function() {
		return isSearchResult ? tweet.from_user_id : tweet.user.id;
	}		
	
	this.getUserScreenName = function() {
		return isSearchResult ? tweet.from_user : tweet.user.screen_name;
	};
	
	this.unescapeHtml = function(text) {
		var temp = document.createElement("div");
    	temp.innerHTML = text;
    	var result = temp.childNodes[0].nodeValue;
    	temp.removeChild(temp.firstChild)
    	return result;
	};
}


var teapot = {

	PROTOCOL : "https://",
	
	RATE_LIMIT_STATUS_URL : "https://api.twitter.com/1/account/rate_limit_status.json?callback=?",
	
	INPUT_BOX_STYLES : {
		"too_long": {
			style: "border: 1px solid red; background-color:red; color:white;"
		},
		"long": {
			style: "border: 1px solid red;"
		},
		"normal" : { 
			style : "border: 1px solid black;"
		}
	},
	
	DEFAULT_LENGTH_MESSAGE : "You have 140 characters remaining for your tweet.",	
	
	currentUser : null,
	
	currentTweetProperties : {
		replyToId : null,
	},
	
	// From http://taiyolab.com/mbtweet
	r : function()
	{
		return (((1 + Math.random()) * 0x10000) | 1).toString(16).substring(1);
	},

	guid : function()
	{
		return (teapot.r() + teapot.r() + "-" + teapot.r() + "-" + teapot.r() + "-" + teapot.r() + "-" + teapot.r() + teapot.r() + teapot.r());
	},

	init : function() {
		$("#tweetlengthbox").html("140");	
		$("#tweettextbox").bind("keyup click", teapot.handleTweetTextBoxChanged)		
		$.getJSON(teapot.PROTOCOL + "api.twitter.com/1/account/verify_credentials.json?callback=?", function(user){			
			teapot.currentUser = user;
			$("#waitmessage").ajaxStart(function(){ $("#waitmessage").fadeIn("slow"); });
			$("#waitmessage").ajaxStop(function(){ $("#waitmessage").fadeOut("slow"); });						
			$("#waitmessage").ajaxError(function(event, request, options, thrownError){ 
				console.log(event, request, options, thrownError); 
			});			
			$("#username").html(user.screen_name);					
			teapot.showHomeTimeline();			
		});
	},
	
	getTimelineUrl : function (timelineType, userId, userName) {
		var result = teapot.PROTOCOL + "api.twitter.com/1/statuses/" + timelineType + "_timeline.json?count=200&callback=?";
		if (userId)
			result += "&user_id=" + userId
		if (userName)		
			result += "&screen_name=" + userName		
		return result;
	},
	
	showPublicTimeline : function() {
		$.getJSON(teapot.getTimelineUrl("public"), teapot.renderStatuses);
		$.getJSON(teapot.RATE_LIMIT_STATUS_URL, teapot.renderRateLimitStatus);	
	},
	
	showHomeTimeline : function() {		
		$.getJSON(teapot.getTimelineUrl("home"), teapot.renderStatuses);	
		$.getJSON(teapot.RATE_LIMIT_STATUS_URL, teapot.renderRateLimitStatus);
	},
	
	showMyTimeline : function() {
		teapot.showUserTimeline();
	},
	
	showAnyUserTimeline : function() {
		var userName = window.prompt("Enter a user name:", "");
		if (userName != null)
			teapot.showUserTimelineByName(userName);
	},
	
	showUserTimeline : function(userId) {		
		$.getJSON(teapot.getTimelineUrl("user", userId), teapot.renderStatuses);	
		$.getJSON(teapot.RATE_LIMIT_STATUS_URL, teapot.renderRateLimitStatus)
	},	
	
	showUserTimelineByName : function(userName) {
		$.getJSON(teapot.getTimelineUrl("user", null, userName), teapot.renderStatuses);	
		$.getJSON(teapot.RATE_LIMIT_STATUS_URL, teapot.renderRateLimitStatus)
	},
	
	showSingleTweet : function (tweetId) {
		$.getJSON(teapot.PROTOCOL + "api.twitter.com/1/statuses/show/" + tweetId + ".json?callback=?", teapot.renderStatuses);	
		$.getJSON(teapot.RATE_LIMIT_STATUS_URL, teapot.renderRateLimitStatus)
	},
	
	showMentions : function() {
		$.getJSON(teapot.PROTOCOL + "api.twitter.com/1/statuses/mentions.json?count=200&callback=?", teapot.renderStatuses);
		$.getJSON(teapot.RATE_LIMIT_STATUS_URL, teapot.renderRateLimitStatus)	
	},
	
	showFavorites : function(userId) {
		var url = teapot.PROTOCOL + "api.twitter.com/1/favorites.json?count=200&callback=?";
		if (userId)
			url += "&id=" + userId
		$.getJSON(url, teapot.renderStatuses);
		$.getJSON(teapot.RATE_LIMIT_STATUS_URL, teapot.renderRateLimitStatus)	
	},
	
	showHashTag : function(hashTag) {
		$.getJSON(teapot.PROTOCOL + "search.twitter.com/search.json?q=" + escape(hashTag) + "&callback=?", function(queryResponse) {
			return teapot.renderStatuses(queryResponse.results, true);
		});
		$.getJSON(teapot.RATE_LIMIT_STATUS_URL, teapot.renderRateLimitStatus)
	},
	
	showUserProfile : function(userId, userName) {
		$.getJSON(teapot.PROTOCOL + "api.twitter.com/1/users/show.json?user_id=" + userId + "&callback=?", teapot.renderUserProfile);
		$.getJSON(teapot.RATE_LIMIT_STATUS_URL, teapot.renderRateLimitStatus)	
	},
	
	replyToTweet : function(tweetId, userName) {
		teapot.currentTweetProperties.replyToId = tweetId;
		$("#tweettextbox").val("@" + userName + " ").focus();
	},
	
	retweet : function(tweetId) {
		if (window.confirm("Retweet to your followers?")) 
			teapot.sendPostRequest(teapot.PROTOCOL + "api.twitter.com/1/statuses/retweet/" + tweetId + ".xml", { }, teapot.handleTweetPosted);		
	},
	
	fav : function(tweetId) {		
		teapot.sendPostRequest(teapot.PROTOCOL + "api.twitter.com/1/favorites/create/" + tweetId + ".xml", { }, teapot.handleFav);				
	},
	
	deleteTweet : function(tweetId) {
		if (window.confirm("Delete this tweet?"))
			teapot.sendPostRequest(teapot.PROTOCOL + "api.twitter.com/1/statuses/destroy/" + tweetId + ".xml", { }, teapot.handleTweetPosted);
	},
	
	doSearch : function() {		
		var searchTerm = window.prompt("Enter a search query:", "");
		if (searchTerm != null) {
			$.getJSON(teapot.PROTOCOL + "search.twitter.com/search.json?q=" + escape(searchTerm) + "&callback=?", function(queryResponse) {
				if (queryResponse.results)
					teapot.renderStatuses(queryResponse.results, true);
				else
					alert("No tweets found.");
			});
			$.getJSON(teapot.RATE_LIMIT_STATUS_URL, teapot.renderRateLimitStatus)	
		}	
	},
	
	renderStatuses : function(statuses, isSearchResult) {
		// statuses is a list of tweets
		if (statuses.length != undefined) 			
			$("#tweetlist").html($.map(statuses, function(status){
				return teapot.formatTweet(new TweetWrapper(status, isSearchResult));
			}).join(""));					
		else 
			$("#tweetlist").html(teapot.formatTweet(new TweetWrapper(statuses, isSearchResult)));
		$(".tweetcontents").mouseenter(function (event) {
			$(event.target).children(".tweetactions").fadeIn("fast");
		});
		$(".tweetcontents").mouseleave(function (event) {
			$(event.target).children(".tweetactions").fadeOut("fast");
		});			
	},
	
	renderUserProfile : function(user) {
		var result;
		
		var mainDiv = $("<div>")
			.addClass("userprofile")
			.append($("<img>")
				.attr("src", user.profile_image_url)
				.attr("alt", "Profile image of " + user.screen_name))
			.append($("<h2>")	
				.append(user.name + " (" + user.screen_name + ")"));		
		if (user.location)
			mainDiv
				.append(user.location)				
				.append($("<br>"));
		if (user.url)
			mainDiv
				.append($("<a>")
					.attr("href", user.url)
					.attr("target", "_blank")
					.html(user.url))
				.append($("<br>"));
		if (user["protected"])
			mainDiv
				.append("This is a protected user.<br />")				
				.append($("<br>"));				
		mainDiv
			.append($("<table>")
				.addClass("userinfotable")
				.append($("<tr>")
					.append($("<td>")
						.append("Tweets"))
					.append($("<td>")
						.append($("<a>")
							.attr("href", "javascript:teapot.showUserTimeline('" + user.id + "')")						
							.append(user.statuses_count)))
				.append($("<tr>")
					.append($("<td>")
						.append("Friends"))
					.append($("<td>")	
						.append(user.friends_count)))								
				.append($("<tr>")
					.append($("<td>")
						.append("Followers"))
					.append($("<td>")	
						.append(user.followers_count)))
				.append($("<tr>")
					.append($("<td>")
						.append("Favorites"))
					.append($("<td>")
						.append($("<a>")
							.attr("href", "javascript:teapot.showFavorites('" + user.id + "')")						
							.append(user.favourites_count))))));										
			
		if (user.description)
			mainDiv
				.append($("<p>")
					.addClass("description")
					.append(user.description));			
						
		$("#tweetlist").html(outerHtml(mainDiv));
	},
	
	renderRateLimitStatus : function(status) {
		$("#requestsremaining").html(status.remaining_hits + " API calls remaining.");
	},
	
	formatTweet : function(tweet) {		
		var result;		
		var dateTime = new Date(tweet.getCreatedAt());
		var isMyTweet = tweet.getUserScreenName() === teapot.currentUser.screen_name;		
		var authorClass = isMyTweet ? "mytweet" : "othertweet";
		
		var mainDiv = $("<div>")
			.addClass("tweetcontents").addClass(authorClass)
			.attr("id", "_tweetcontents_" + tweet.getId())
			.append($("<a>")
				.attr("href", "javascript:teapot.showUserProfile('" + tweet.getUserId() + "', '" + tweet.getUserScreenName() + "')")
				.append($("<img>")
					.addClass("avatar")
					.attr("src", tweet.getUserProfileImageUrl())
					.attr("width", "40").attr("height", "40")
					.attr("alt", "Profile image of " + tweet.getUserScreenName())))
			.append($("<span>")
				.addClass("tweetusername")
				.append($("<a>")
					.attr("href", "javascript:teapot.showUserTimeline('" + tweet.getUserId() + "')")
					.append(tweet.getUserScreenName()))
				.append(" "))
			.append($("<span>")
				.addClass("tweettext")
				.append(teapot.replaceRegexps(tweet.getText()))
				.append($("<br>")));
		
		var tweetMeta = $("<span>").addClass("tweetmeta").append(teapot.formatDateTime(dateTime))
			.append(" from ").append(tweet.getSource());		
		if (tweet.getInReplyToStatusId() != null) 
			tweetMeta
				.append(" in reply to ")
				.append($("<a>")
					.attr("href", "javascript:teapot.showSingleTweet('" + 
						tweet.getInReplyToStatusId() + "')")
					.append(tweet.getInReplyToScreenName()));
		tweetMeta.appendTo(mainDiv);					

		var tweetActions = $("<span>").addClass("tweetactions");
		if (!isMyTweet) {
			tweetActions.append($("<a>").append($("<img>")
				.addClass("tweetactionicon")
				.attr("src", "reply.gif")
				.attr("width", "12")
				.attr("height", "12")
				.attr("alt", "Reply")
				.attr("title", "Reply to this tweet"))
				.attr("href", "javascript:teapot.replyToTweet('" + tweet.getId() + "', '" + 
					tweet.getUserScreenName() + "')"));
			tweetActions.append($("<a>")
				.append($("<img>")
				.addClass("tweetactionicon")
				.attr("src", "rt.gif")
				.attr("width", "12")
				.attr("height", "12")
				.attr("alt", "Retweet")
				.attr("title", "Retweet this tweet"))
				.attr("href", "javascript:teapot.retweet('" + tweet.getId() + "')"));					
		}
		tweetActions.append($("<a>").append($("<img>")
				.addClass("tweetactionicon")
				.attr("src", "fav.gif")
				.attr("width", "12")
				.attr("height", "12")
				.attr("alt", "Favorite")
				.attr("title", "Add this tweet to your favorites"))
			.attr("href", "javascript:teapot.fav('" + tweet.getId() + "')"));
		if (isMyTweet) {
			tweetActions.append(" | ").append($("<a>")
				.attr("href", "javascript:teapot.deleteTweet('" + tweet.getId() + "')")
				.append("delete"));
		}
		tweetActions.appendTo(mainDiv);					
														
		return outerHtml(mainDiv);
	},
	
	formatDateTime : function(date) {
		// Unfortunately, jQuery can only format the date, not date and time.
		var timeStr = "";
		if (date.getHours() < 10)
			timeStr += "0";
		timeStr += date.getHours() + ":";		
		if (date.getMinutes() < 10)
			timeStr += "0";
		timeStr += date.getMinutes();							
		return $.datepicker.formatDate("yy-mm-dd, " + timeStr, date);
	},
	
	replaceRegexps : function(tweetText) {
		// Hashtag at start of tweet
		tweetText = tweetText.replace(/^(#[\w\d]+)/g, teapot.hashtagLink("$1"));
		// Hashtag at end of tweet
		tweetText = tweetText.replace(/ (#[\w\d]+)/g, " " + teapot.hashtagLink("$1"));		
		tweetText = tweetText.replace(/(@([\w\d]+))/g, teapot.userNameLink("$2")); 			
		tweetText = tweetText.replace(/((https?|ftp):\/\/[\w\d.\/-~\-&#]+)/g, teapot.urlLink("$1"));
		return tweetText;
	},
	
	hashtagLink : function (hashtag) {
		return '<a class="hashtag" href="javascript:teapot.showHashTag(\'' + hashtag + '\')">' + 
			hashtag + '</a>';	
	},
	
	urlLink : function (url) {
		return '<a class="extlink" target="_blank" href="' + url + '">' + url + '</a>';	
	},
	
	userNameLink : function (userName) {
		return '@<a class="username" href="javascript:teapot.showUserTimelineByName(\'' + 
			userName + '\')">' + userName + '</a>';	
	},
	
	handleTweetTextBoxChanged : function(event) {
		var length = $("#tweettextbox").val().length;
		if (length > 140) {
			$("#tweettextbox").addClass("longtext");
			$("#tweetbutton").attr({ disabled: true });
			$("#tweetlengthbox").html("Too long!")
		}
		else {
			$("#tweettextbox").removeClass("longtext")						
			$("#tweetbutton").attr({ disabled: false });
			$("#tweetlengthbox").html(140 - length);
		}					
	},
	
	sendTweet : function() {
		teapot.sendPostRequest(teapot.PROTOCOL + "api.twitter.com/1/statuses/update.xml", {
			"status" : $("#tweettextbox").val(), 
			"in_reply_to_status_id" : teapot.currentTweetProperties.replyToId
		}, teapot.handleTweetPosted);	
		
		return false;
	},

	// From http://taiyolab.com/mbtweet	
	sendPostRequest : function(url, fields, postHandler) {
		// Set up the target frame that is receiving the response to the POST request
		var targetFrameId = teapot.guid();
		$("<iframe>").attr("id", targetFrameId).attr("name", targetFrameId)
			.attr("style", "display:none")
			.appendTo($("#tweetboxcontainer"));
		$("#" + targetFrameId).bind("load", postHandler);
												
		// Set up the form inside the post frame												
		var postForm = $("<form>")
			.attr("method", "post")
			.attr("action", url)
			.attr("target", targetFrameId);		
		for (var fieldName in fields) {			
			if (fieldName != undefined && fields[fieldName] != null)
				postForm.prepend($("<input>").attr("type", "hidden").attr("name", fieldName).attr("value", fields[fieldName])); 										
		}
		
		// Create a new post frame		
		$("#tweetpostframe").remove();
		$("<iframe id='tweetpostframe' name='tweetpostframe' style='display:none;'></iframe>").appendTo($("#tweetboxcontainer"));
				
		// Write the contents to the post frame, triggering the submission of the form				
		var postFrameDoc = $("#tweetpostframe")[0].contentWindow.document;		
		postFrameDoc.open();
		// We need a surrounding div because html() only writes the inner HTML.									
		var frameContents = $("<div>")
			.prepend(postForm).html() + 
			"<script type=\"text/javascript\">window.onload = function(){ document.forms[0].submit(); };</script>";						
		postFrameDoc.write(frameContents);					
		postFrameDoc.close();		
		return false;			
	},
	
	handleTweetPosted : function(event) {		
		// Remove the target frame that received the response to the POST request
		$(event.target).remove();
		teapot.currentTweetProperties.replyToId = null;				
		$("#tweettextbox").val("");
		$("#tweettextbox").attr(teapot.INPUT_BOX_STYLES["normal"]);
		$("#tweetlengthbox").html("140");
		teapot.showHomeTimeline();
	},
	
	handleFav : function(event) {
		$(event.target).remove();
		teapot.showFavorites();
	},
	
	showAbout : function() {
		alert("teapot (c) 2010, Niklas Deutschmann\n" +
			"teapot is written entirely in HTML, CSS and JavaScript and uses no server-side scripts or plugins. " +
			"So, no data is ever stored on www.niklas-deutschmann.de\n" +					
			"Clear your browser login settings for logging in as a different user.\n\n" +
			"Tested in Firefox 3.5 and Chrome 5 beta.");
	}
};

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

