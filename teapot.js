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
		$("#tweetlengthbox").html(teapot.DEFAULT_LENGTH_MESSAGE);	
		$("#tweettextbox").bind("keyup click", teapot.handleTweetTextBoxChanged)	
		$.getJSON(teapot.PROTOCOL + "api.twitter.com/1/account/verify_credentials.json?callback=?", function(user){			
			teapot.currentUser = user;
			$("#waitmessage").ajaxStart(function(){ $("#waitmessage").show(); });
			$("#waitmessage").ajaxStop(function(){ $("#waitmessage").hide(); });						
			$("#waitmessage").ajaxError(function(event, request, options, thrownError){ 
				console.log(event, request, options, thrownError); 
			});			
			$("#username").html("You are " + user.screen_name + ".");					
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
	
	showFavorites : function() {
		$.getJSON(teapot.PROTOCOL + "api.twitter.com/1/favorites.json?count=200&callback=?", teapot.renderStatuses);
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
			$("#tweetlist").html($.map(statuses, function(status) {
				return teapot.formatTweet(new TweetWrapper(status, isSearchResult));
			}).join(""));					
		else  											
			$("#tweetlist").html(teapot.formatTweet(new TweetWrapper(statuses, isSearchResult)));
	},
	
	renderUserProfile : function(user) {
		var result;
		
		var mainDiv = $("<div>").attr("class", "userprofile");
		
		mainDiv.append($("<img>")
			.attr("src", user.profile_image_url)
			.attr("alt", "Profile image of " + user.screen_name)
		);
		mainDiv.append($("<h2>")
			.html(user.name + " (" + user.screen_name + ")")			
		);
		if (user.location)
			mainDiv.append($("<span>")
				.attr("class", "userlocation")
				.html(user.location + "<br />")
			);
		if (user.url)
			mainDiv.append($("<a>")
				.attr("href", user.url)
				.attr("target", "_blank")
				.html(user.url)
			);
		if (user["protected"])
			mainDiv.append($("<span>")				
				.html("This is a protected user.<br />")
			);
		mainDiv.append($("<p>")				
				.html(user.statuses_count + " tweets, " + 
					user.friends_count + " friends, " + 
					user.followers_count + " followers<br />"));
		if (user.description)
			mainDiv.append($("<p>")
				.attr("class", "description")
				.html(user.description)
			);			
				
		$("#tweetlist").html(($("<div>").append(mainDiv)).html());
	},
	
	renderRateLimitStatus : function(status) {
		$("#requestsremaining").html(status.remaining_hits + " API calls remaining.");
	},
	
	formatTweet : function(tweet) {		
		var result;		
		var dateTime = new Date(tweet.getCreatedAt());
		var isMyTweet = tweet.getUserScreenName() === teapot.currentUser.screen_name;		
		var authorClass = isMyTweet ? "mytweet" : "othertweet"; 		
		result = "<div class=\"tweetcontents " + authorClass +"\" id=\"_tweetcontents_" + tweet.getId() + "\">";
		result += "<a href=\"javascript:teapot.showUserProfile('" + tweet.getUserId() + "', '" + tweet.getUserScreenName() + "')\">"	
		result += "<img class=\"avatar\" src=\"" + tweet.getUserProfileImageUrl() + 
			"\" width=\"40\" height=\"40\" alt=\" Profile image of " + tweet.getUserScreenName() + "\"/>";
		result += "</a>"	 
		result += "<span class=\"tweetusername\">"
		result += "<a href='javascript:teapot.showUserTimeline(\"" + tweet.getUserId() + "\")'>"  + tweet.getUserScreenName() + "</a>"	
		result += "</span> ";
		result += "<span class='tweettext'>" + teapot.replaceRegexps(tweet.getText()) + "</span><br />";
		result += "<span class='tweetmeta'>" + teapot.formatDateTime(dateTime)  + " from " + tweet.getSource();
		if (tweet.getInReplyToStatusId() != null) {
			result += " in reply to <a href='javascript:teapot.showSingleTweet(\"" + tweet.getInReplyToStatusId() + "\")'>"  
				+ tweet.getInReplyToScreenName() + "</a>";
		}
		result += "</span><span class='tweetactions'>";
		if (!isMyTweet) {
			result += " | <a href='javascript:teapot.replyToTweet(\"" + tweet.getId() + "\", \"" + tweet.getUserScreenName() + "\")'>reply</a>"
			result += " | <a href='javascript:teapot.retweet(\"" + tweet.getId() + "\")'>retweet</a>";	
		}				
		result += " | <a href='javascript:teapot.fav(\"" + tweet.getId() + "\")'>fav</a>";
		if (isMyTweet) 
			result += " | <a href='javascript:teapot.deleteTweet(\"" + tweet.getId() + "\")'>delete</a>";		
		result += "</span></div>";
		return result;
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
		tweetText = tweetText.replace(/(@(\w+))/g, '@<a class="username" href="javascript:teapot.showUserTimelineByName(\'$2\')">$2</a>'); 
		tweetText = tweetText.replace(/(#\w+)/g, '<a class="hashtag" href="javascript:teapot.showHashTag(\'$1\')">$1</a>');	
		tweetText = tweetText.replace(/(https?:\/\/[\w.\/-~\-&]+)/g, '<a class="extlink" target="_blank" href="$1">$1</a>');
		return tweetText;
	},
	
	handleTweetTextBoxChanged : function(event) {
		var length = $("#tweettextbox").val().length;
		if (length > 140) {
			$("#tweettextbox").attr(teapot.INPUT_BOX_STYLES["too_long"]);
			$("#tweetbutton").attr({ disabled: true });
			$("#tweetlengthbox").html("You have too many characters in your tweet.")
		}
		else {
			$("#tweettextbox").attr(teapot.INPUT_BOX_STYLES[(length > 120) ? "long" : "normal"]);						
			$("#tweetbutton").attr({ disabled: false });
			$("#tweetlengthbox").html("You have " + (140 - length) + " characters remaining for your tweet.")
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
		$("<iframe>").attr("id", targetFrameId).attr("name", targetFrameId).attr("style", "display:none").appendTo($("#tweetboxcontainer"));
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
		$("#tweetlengthbox").html(teapot.DEFAULT_LENGTH_MESSAGE);
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
