"use strict";

/*global $: false, window: false, utils: false, Tweet: false, TrimPath: false */
/*jslint browser: true, devel: true, undef: true, nomen: true, eqeqeq: true, strict: true, 
newcap: true, immed: true, maxlen: 100 */


var teapot = {
    
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
    
    api : null,
    
    currentTweetProperties : {
        replyToId : null
    },
    
    userTimeline : null,

    init : function(api) {
        teapot.api = api;
        $("#tweetlengthbox").html("140");    
        $("#tweettextbox").bind("keyup click change", teapot.handleTweetTextBoxChanged);
        teapot.api.verifyCredentials(function(user) {            
            teapot.currentUser = user;            
            $("#waitmessage").ajaxStart(function(){ $("#waitmessage").show(); });
            $("#waitmessage").ajaxStop(function(){ $("#waitmessage").hide(); });
            $("#waitmessage").ajaxError(function(event, request, options, thrownError){ 
                console.log(event, request, options, thrownError);
            });
            window.setInterval("teapot.api.updateRateLimitStatus(teapot.renderRateLimitStatus)", 
                600000);            
            $("#username").html(user.screen_name);                    
            teapot.showHomeTimeline();
            
            /*
            teapot.userTimeline = new PagedList(-1, $("#pagecontrols"),                 
                function(page) {
                    console.log("Fetching results for page " + page);
                    if (page >= 5) {
                        return null;
                    } else {
                        return "bla";    
                    }
                    
                },
                function(results) {
                    console.log("Rendering: " + results);
                });           
            teapot.userTimeline.refresh();
            */
        });                
    },
    
    showPublicTimeline : function() {        
        teapot.api.showPublicTimeline(teapot.renderStatuses);
        teapot.highlightTimelineMenuItem("#public_timeline");                
    },
    
    showHomeTimeline : function() {        
        teapot.api.showHomeTimeline(teapot.renderStatuses);            
        teapot.highlightTimelineMenuItem("#home_timeline");
    },
    
    showMyTimeline : function() {
        teapot.api.showUserTimeline(null, teapot.renderStatuses);
        teapot.highlightTimelineMenuItem("#my_timeline");
    },
    
    showAnyUserTimeline : function() {
        var userName = window.prompt("Enter a user name:", "");
        if (userName !== null) {
            teapot.api.showUserTimelineByName(userName, teapot.renderStatuses);
        }                                             
    },
    
    showUserTimeline : function(userId) {        
        teapot.api.showUserTimeline(userId, teapot.renderStatuses);        
        teapot.highlightTimelineMenuItem("#user_timeline");
    },    
    
    showUserTimelineByName : function(userName) {
        teapot.api.showUserTimelineByName(userName, teapot.renderStatuses);
        teapot.highlightTimelineMenuItem("#user_timeline");
    },
    
    showSingleTweet : function (tweetId) {
        teapot.api.showSingleTweet(tweetId, teapot.renderStatuses);        
        teapot.highlightTimelineMenuItem(null);
    },
    
    showMentions : function() {
        teapot.api.showMentions(teapot.renderStatuses);        
        teapot.highlightTimelineMenuItem("#mentions_timeline");
    },
    
    showFavorites : function(userId) {
        teapot.api.showFavorites(userId, teapot.renderStatuses);
        teapot.highlightTimelineMenuItem("#favorites_timeline");            
    },
    
    showHashTag : function(hashTag) {
        teapot.api.showHashTag(hashTag, function(queryResponse) {
            return teapot.renderStatuses(queryResponse, true);
        });        
        teapot.highlightTimelineMenuItem("#search_timeline");
    },
    
    showUserProfile : function(userId, userName) {
        teapot.api.showUserProfile(userId, userName, teapot.currentUser, function(user, relation) {
            $("#contentarea").html(TrimPath.parseDOMTemplate("template_user_profile").process({
                user : user,
                relation : relation.relationship
            }));
        });
        teapot.highlightTimelineMenuItem(null);    
    },
    
    replyToTweet : function(tweetId, userName) {
        teapot.currentTweetProperties.replyToId = tweetId;
        $("#tweettextbox").val("@" + userName + " ").focus();        
    },
    
    retweet : function(tweetId, userName) {        
        // TODO: Store original tweet text locally  instead of fetching it again
        teapot.api.showSingleTweet(tweetId, function(tweet) {            
            $("#tweettextbox").val("RT @" + userName + " " + tweet.text).focus();
            $("#tweettextbox").change();        
        });                        
    },
    
    fav : function(tweetId) {        
        teapot.api.fav(tweetId, function () {
            teapot.flashMessage("Favorite added!");
        });                    
    },
    
    deleteTweet : function(tweetId) {
        if (window.confirm("Delete this tweet?")) {
            teapot.api.deleteTweet(tweetId, function() {
                $("#_tweetcontents_" + tweetId).hide("fast");
                teapot.flashMessage("Tweet deleted");
            });
        }
    },
    
    follow : function(userId, userName) {
        teapot.api.follow(userId, userName, function () {
            teapot.flashMessage("You are now following " + userName);
        });        
    },
    
    unfollow : function(userId, userName) {
        teapot.api.unfollow(userId, userName, function () {
            teapot.flashMessage("You are no longer following " + userName);
        });        
    },
    
    doSearch : function() {        
        var searchTerm = window.prompt("Enter a search query:", "");
        if (searchTerm !== null) {
            teapot.api.doSearch(searchTerm, function(queryResponse) {
                if (queryResponse.results) {
                    teapot.renderStatuses(queryResponse.results, true);
                } else {
                    teapot.flashMessage("No tweets found.");
                }
            });            
            teapot.highlightTimelineMenuItem("#search_timeline");
        }    
    },
    
    showFriends : function(userId, userName, cursor) {
        teapot.api.showUsers("friends", userId, userName, cursor, teapot.renderUsers);
        teapot.highlightTimelineMenuItem(null);
    },
    
    showFollowers : function(userId, userName, cursor) {
        teapot.api.showUsers("followers", userId, userName, cursor, teapot.renderUsers);
        teapot.highlightTimelineMenuItem(null);
    },
    
    renderUsers : function(role, result) {
        var template = TrimPath.parseDOMTemplate("template_user");        
        $("#contentarea").html($.map(result.users, function(user) {
            return template.process(user);
        }).join(""));
    },
    
    renderStatuses : function(statuses, isSearchResult) {
        // statuses is a list of tweets
        if (statuses.length !== undefined) {
            $("#contentarea").html($.map(statuses, function(status) {                
                return teapot.formatTweet(new Tweet(status, isSearchResult));
            }).join(""));
        } else {
            $("#contentarea").html(teapot.formatTweet(new Tweet(statuses, isSearchResult)));
        }
        $(".itemcontents").mouseenter(function (event) {
            $(event.target).addClass("mouseover");
            $(event.target).children(".tweetactions").fadeIn("fast");
        });
        $(".itemcontents").mouseleave(function (event) {
            $(event.target).removeClass("mouseover");
            $(event.target).children(".tweetactions").fadeOut("fast");
        });            
    },
    
    renderRateLimitStatus : function(status) {
        $("#requestsremaining").html(status.remaining_hits + " API calls remaining.");
    },
    
    formatTweet : function(tweet) {                
        var dateTime = new Date(tweet.getCreatedAt());
        var isMyTweet = tweet.getUserScreenName() === teapot.currentUser.screen_name;        
        var authorClass = isMyTweet ? "mytweet" : "othertweet";
        
        var mainDiv = $("<div>")
            .addClass("itemcontents").addClass(authorClass)
            .attr("id", "_tweetcontents_" + tweet.getId())
            .append($("<a>")
                .attr("href", "javascript:teapot.showUserProfile('" + tweet.getUserId() + "', '" + 
                    tweet.getUserScreenName() + "')")
                .attr("title", "Show " + tweet.getUserScreenName() + "'s user profile")
                .append($("<img>")
                    .addClass("avatar")
                    .attr("src", tweet.getUserProfileImageUrl())
                    .attr("width", "40").attr("height", "40")
                    .attr("alt", "Profile image of " + tweet.getUserScreenName())))
            .append($("<span>")
                .addClass("tweetusername")
                .append($("<a>")
                    .attr("href", "javascript:teapot.showUserTimeline('" + tweet.getUserId() + "')")
                    .attr("title", "Show " + tweet.getUserScreenName() + "'s tweets")
                    .append(tweet.getUserScreenName()))
                .append(" "))
            .append($("<span>")
                .addClass("itemtext")
                .append(teapot.replaceRegexps(tweet.getText()))
                .append($("<br>")));
        
        var tweetMeta = $("<span>").addClass("smallitemtext")
            .append($("<a>")
                .attr("href", "javascript:teapot.showSingleTweet('" + tweet.getId() + "')")
                .append(teapot.formatDateTime(dateTime, true)))
            .append(" from ").append(tweet.getSource());        
        if (tweet.getInReplyToStatusId() !== null) {
            tweetMeta.append($("<a>").attr("href", "javascript:teapot.showSingleTweet('" +
            tweet.getInReplyToStatusId() +
            "')").append(" in reply to ").append(tweet.getInReplyToScreenName()));
        }
        tweetMeta.appendTo(mainDiv);                    

        var tweetActions = $("<span>").addClass("tweetactions");
        if (!isMyTweet) {
            tweetActions.append($("<a>").append($("<img>")
                .addClass("tweetactionicon")
                .attr("src", "icons/reply.gif")
                .attr("width", "12")
                .attr("height", "12")
                .attr("alt", "Reply")
                .attr("title", "Reply to this tweet"))
                .attr("href", "javascript:teapot.replyToTweet('" + tweet.getId() + "', '" + 
                    tweet.getUserScreenName() + "')"));
            tweetActions.append($("<a>")
                .append($("<img>")
                .addClass("tweetactionicon")
                .attr("src", "icons/rt.gif")
                .attr("width", "12")
                .attr("height", "12")
                .attr("alt", "Retweet")
                .attr("title", "Retweet this tweet"))
                .attr("href", "javascript:teapot.retweet('" + tweet.getId() + "', '" + 
                    tweet.getUserScreenName() + "')"));                    
        }
        tweetActions.append($("<a>").append($("<img>")
                .addClass("tweetactionicon")
                .attr("src", "icons/fav.gif")
                .attr("width", "12")
                .attr("height", "12")
                .attr("alt", "Favorite")
                .attr("title", "Add this tweet to your favorites"))
            .attr("href", "javascript:teapot.fav('" + tweet.getId() + "')"));
        if (isMyTweet) {
            tweetActions.append($("<a>").append($("<img>")
                .addClass("tweetactionicon")
                .attr("src", "icons/delete.gif")
                .attr("width", "12")
                .attr("height", "12")
                .attr("alt", "Delete")
                .attr("title", "Delete this tweet"))
                .attr("href", "javascript:teapot.deleteTweet('" + tweet.getId() + "')"));
        }
        tweetActions.appendTo(mainDiv);                    
                                                        
        return utils.outerHtml(mainDiv);
    },
    
    formatDateTime : function(date, includeTime) {
        // Unfortunately, jQuery can only format the date, not date and time.
        var timeStr = "";
        if (includeTime) {
            timeStr += ", ";
            if (date.getHours() < 10) {
                timeStr += "0";
            }                
            timeStr += date.getHours() + ":";        
            if (date.getMinutes() < 10) {
                timeStr += "0";
            }                
            timeStr += date.getMinutes();    
        }                                    
        return $.datepicker.formatDate("yy-mm-dd" + timeStr, date);
    },
    
    replaceRegexps : function(tweetText) {
        // Replace multiple CR, LF, tab characters by one space.
        tweetText = tweetText.replace(/[\n\r\t]+/g, " ");        
        // Hashtag at start of tweet
        tweetText = tweetText.replace(/^(#[\w\d]+)/g, teapot.hashtagLink("$1"));
        // Hashtag at end of tweet
        tweetText = tweetText.replace(/ (#[\w\d]+)/g, " " + teapot.hashtagLink("$1"));        
        tweetText = tweetText.replace(/^(@([\w\d]+))/g, teapot.userNameLink("$2"));             
        tweetText = tweetText.replace(/([^\w])@([\w\d]+)/g, "$1" + teapot.userNameLink("$2"));
        tweetText = tweetText.replace(/((https?|ftp):\/\/[\w\d.\/\-\?\[\]\*_&~#%\+=:{},]+)/g, 
            teapot.urlLink("$1"));
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
            $("#tweetlengthbox").html("Too long!");
        }
        else {
            $("#tweettextbox").removeClass("longtext");                        
            $("#tweetbutton").attr({ disabled: false });
            $("#tweetlengthbox").html(140 - length);
        }                    
    },
    
    sendTweet : function() {
        teapot.api.sendTweet($("#tweettextbox").val(), teapot.currentTweetProperties.replyToId, 
            teapot.handleTweetPosted);        
        return false;
    },
    
    handleTweetPosted : function(event) {                
        teapot.currentTweetProperties.replyToId = null;                
        $("#tweettextbox").val("");
        $("#tweettextbox").attr(teapot.INPUT_BOX_STYLES.normal);
        $("#tweetlengthbox").html("140");
        teapot.showHomeTimeline();
    },
    
    flashMessage : function(message) {
        $("#messagearea").html(message);
        $("#messagearea").show(1).delay(3000).hide(1);        
    },
    
    highlightTimelineMenuItem : function(id) {
        $("a[id$='_timeline']").removeClass("highlightedMenuItem");
        if (id) {
            $(id).addClass("highlightedMenuItem");
        }
    },
    
    showAbout : function() {
        alert("teapot (c) 2010, Niklas Deutschmann\n" +
            "teapot is written entirely in HTML, CSS and JavaScript and uses no server-side" + 
            "scripts or plugins. " +
            "So, no data is ever stored on www.niklas-deutschmann.de\n" +                    
            "Clear your browser login settings for logging in as a different user.\n\n" +
            "Tested in Firefox 3.5 and Chrome 5 beta.");
    },
    
    handleError : function(message) {
        teapot.flashMessage(message);
    }
};