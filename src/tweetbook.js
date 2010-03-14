var tweetbook = {
    
    MONTHS : Array("January", "February", "March", "April", "May", "June", "July", "August",
        "September", "October", "November", "December"),
    
    NUMBER_SUFFIXES : Array("st", "nd", "rd", "th", "th", "th", "th", "th", "th", "th", 
        "th", "th", "th", "th", "th", "th", "th", "th", "th", "th", 
        "st", "nd", "rd", "th", "th", "th", "th", "th", "th", "th", "st"),
        
    PAGE_BREAK : "<div style=\"page-break-after:always;\" />",              
    
    formatDay : function(date) {
        return tweetbook.MONTHS[date.getMonth()] + " " + date.getDate() +
            tweetbook.NUMBER_SUFFIXES[date.getDate() - 1];  
    },
    
    fetchedTweets : Array(),
    
    formatTime : function(date) {
        var timeStr = "";
        if (date.getHours() < 10) {
            timeStr += "0";
        }                
        timeStr += date.getHours() + ":";        
        if (date.getMinutes() < 10) {
            timeStr += "0";
        }                
        timeStr += date.getMinutes();    
                                            
        return timeStr;  
    },                
    
    handleTweets : function() {                    
        var previousDate = null;
        var innerHtml = "";        
        for (var i = 0; i < tweetbook.fetchedTweets.length; i++) {
            var tweet = tweetbook.fetchedTweets[i];
            var date = new Date(tweet.created_at);
            
            if (previousDate === null || date.getFullYear() !== previousDate.getFullYear())              
                innerHtml += "<h2>" + date.getFullYear() + "</h2>";                            
            if (previousDate === null || date.getMonth() !== previousDate.getMonth()) {
                if (previousDate != null) {
                    innerHtml += tweetbook.PAGE_BREAK;    
                }                 
                innerHtml += "<h3>" + tweetbook.MONTHS[date.getMonth()] + "</h3>";
            }          
            if (previousDate === null || date.getDay() !== previousDate.getDay())
                innerHtml += "<h4>" + tweetbook.formatDay(date) + "</h4>";
                                        
            innerHtml += "<p class=\"tweetcontents\">" +
                    "<em>" + tweetbook.formatTime(date) + "</em> " + 
                    tweet.text + 
                "</p>";
            previousDate = date;
        }        
        $("#bookcontents").html(innerHtml);                   
    },
    
    fetchTweets : function(api) {        
        tweetbook.fetchTweetsFromPage(api, 16, 200, tweetbook.handleTweets);                   
    },
    
    fetchTweetsFromPage : function(api, page, tweetsPerPage, finishCallback) {        
        api.getJSON("https://api.twitter.com/1/statuses/user_timeline.json?callback=?", 
            { count : tweetsPerPage, page : page }, function(tweets) {
                for (var i = tweetsPerPage - 1; i >= 0; i--) {
                    if (tweets[i])
                        tweetbook.fetchedTweets.push(tweets[i]);                    
                }                
                if (page > 1) {
                    tweetbook.fetchTweetsFromPage(api, page - 1, tweetsPerPage, finishCallback);
                } else {
                    finishCallback();
                }                          
            });
    }
}


