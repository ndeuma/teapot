function Tweet(tweet, isSearchResult) {
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