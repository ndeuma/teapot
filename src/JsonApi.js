"use strict";

/*global $: false, utils: false */
/*jslint browser: true, devel: true, undef: true, nomen: true, eqeqeq: true, strict: true, 
newcap: true, immed: true, maxlen: 100 */

function JsonApi(protocol, endpoint, searchEndpoint, errorCallback) {
        
    this.protocol = protocol;
    
    this.endpoint = endpoint;
    
    this.searchEndpoint = searchEndpoint;
    
    this.errorCallback = errorCallback;
    
    this.tweetCache = {};
    
    this.userProfileCache = {};
    
    this.RATE_LIMIT_STATUS_URL = function() {
        return this.protocol + this.endpoint + "/1/account/rate_limit_status.json?callback=?";
    };
        
    this.getJSON = function(url, data, callback) {        
        var api = this;        
        // Soft HTTP Error handling
        $.getJSON(url, utils.mergeHashes(data, { suppress_response_codes : true }), 
            function(result) {                
                if (result.error === "Could not authenticate you." ||
                result.error === "This method requires authentication.") {
                    $.getJSON(url, data, callback);
                } else if (result.error) {
                    $.event.trigger("ajaxStop");
                    api.errorCallback(result.error);
                } else {
                    callback(result);
                }                
            });
    };
    
    this.mapStatuses = function(statuses, func) {
        if (statuses.length !== undefined) {
            return $.map(statuses, func);
        } else {
            return Array(func(statuses));
        }
    };
    
    this.verifyCredentials = function(callback) {
        this.getJSON(this.protocol + this.endpoint + 
            "/1/account/verify_credentials.json?callback=?", {}, callback);
    };
    
    this.getTimeline = function(timelineType, userId, userName, callback) {
        var url = this.protocol + this.endpoint + "/1/statuses/" + timelineType + 
            "_timeline.json?callback=?";
        var data = { "count" : 200 };        
        if (userId) {
            data.user_id = userId;
        }
        if (userName) {
            data.screen_name = userName;
        }
        var api = this;
        this.getJSON(url, data, function(statuses) {
            api.mapStatuses(statuses, function(status) {
                api.tweetCache[status.id] = status;
            });
            callback(statuses);
        });                    
    };
    
    this.showPublicTimeline = function(callback) {
        this.getTimeline("public", null, null, callback);        
    };
    
    this.showHomeTimeline = function(callback) {        
        this.getTimeline("home", null, null, callback);                
    };
    
    this.showMyTimeline = function(callback) {
        this.getTimeline("user", null, null, callback);        
    };
    
    this.showUserTimeline = function(userId, callback) {                
        this.getTimeline("user", userId, null, callback);    
    };    
    
    this.showUserTimelineByName = function(userName, callback) {
        this.getTimeline("user", null, userName, callback);            
    };
    
    this.showSingleTweet = function (tweetId, callback) {
        var api = this;
        if (api.tweetCache[tweetId]) {
            callback(api.tweetCache[tweetId]);
        } else {
            this.getJSON(this.protocol + this.endpoint + "/1/statuses/show/" + tweetId + 
                ".json?callback=?", {}, function(data) {
                    api.tweetCache[tweetId] = data;
                    callback(api.tweetCache[tweetId]);
                });    
        }                                 
    };
    
    this.showMentions = function(callback) {
        this.getJSON(this.protocol + this.endpoint + "/1/statuses/mentions.json?callback=?", 
            { "count" : 200 }, callback);    
    };
    
    this.showFavorites = function(userId, callback) {
        var url = this.protocol + this.endpoint + "/1/favorites.json?callback=?";
        var data = { "count" : 200};
        if (userId) {
            data.id = userId;
        }                    
        this.getJSON(url, data, callback);        
    };
    
    this.showHashTag = function(hashTag, callback) {
        this.getJSON(this.protocol + this.searchEndpoint + "/search.json?callback=?",
            { "q" : hashTag }, 
            function(queryResponse) {
                return callback(queryResponse.results, true);
            });        
    };
    
    this.showUserProfile = function(userId, userName, currentUser, callback) {
        var api = this;
        if (api.userProfileCache[userId]) {
            callback(api.userProfileCache[userId].user, 
                            api.userProfileCache[userId].relation);
        } else {
            api.getJSON(api.protocol + api.endpoint + "/1/users/show.json?callback=?",
            { "user_id" : userId},                         
            function(user) {                
                api.getJSON(api.protocol + api.endpoint + "/1/friendships/show.json?callback=?",
                    { "source_id" : currentUser.id, "target_id" : userId},
                    function(relation) {                        
                        api.userProfileCache[userId] = {
                            user : user,
                            relation : relation  
                        };                         
                        callback(api.userProfileCache[userId].user, 
                            api.userProfileCache[userId].relation);                                               
                    });        
            });    
        }                        
    };
    
    this.retweet = function(tweetId, callback) {     
        this.sendPostRequest(this.protocol+ this.endpoint + "/1/statuses/retweet/" + 
            tweetId + ".xml", { }, callback);        
    };
    
    this.fav = function(tweetId, callback) {        
        this.sendPostRequest(this.protocol + this.endpoint + "/1/favorites/create/" + 
            tweetId + ".xml", { }, callback);                
    };
    
    this.deleteTweet = function(tweetId, callback) {
        var api = this;               
        this.sendPostRequest(this.protocol + this.endpoint + "/1/statuses/destroy/" + 
            tweetId + ".xml", { }, function() {
                api.tweetCache[tweetId] = null;
                callback();
            });
    };
    
    this.follow = function(userId, userName, callback) {
        var api = this;        
        this.sendPostRequest(this.protocol + this.endpoint + "/1/friendships/create/" + 
            userId + ".xml", { screen_name : userName }, function() {
                api.userProfileCache[userId] = null;
                callback();
            });
    };
    
    this.unfollow = function(userId, userName, callback) {
        var api = this;        
        this.sendPostRequest(this.protocol + this.endpoint + "/1/friendships/destroy/" + 
            userId + ".xml", { screen_name : userName }, function() {
                api.userProfileCache[userId] = null;
                callback();
            });
    };
    
    this.doSearch = function(searchTerm, callback) {                
        this.getJSON(this.protocol + this.searchEndpoint + "/search.json?callback=?",
            { "q" : searchTerm }, 
            callback);            
    };
    
    this.sendTweet = function(tweetText, replyToId, callback) {
        var url = this.protocol + this.endpoint + "/1/statuses/update.xml";
        var api = this;
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                api.sendPostRequest(url, {
                    "status" : tweetText, 
                    "in_reply_to_status_id" : replyToId,
                    "lat" : position.coords.latitude,
                    "long" : position.coords.longitude            
                }, callback);        
            });   
        } else {
            api.sendPostRequest(url, {
               "status" : tweetText, 
               "in_reply_to_status_id" : replyToId            
            }, callback);
        }                    
    };
    
    this.sendPostRequest = function(url, fields, postHandler) {
        // Set up the target frame that is receiving the response to the POST request
        var targetFrameId = utils.guid();
        $("<iframe>").attr("id", targetFrameId).attr("name", targetFrameId)
            .attr("style", "display:none")
            .appendTo($("#tweetboxcontainer"));
        $("#" + targetFrameId).bind("load", function(event) {
            // Remove the target frame that received the response to the POST request        
            $(event.target).remove();
            postHandler();
        });
                                                
        // Set up the form inside the post frame                                                
        var postForm = $("<form>")
            .attr("method", "post")
            .attr("action", url)
            .attr("target", targetFrameId);        
        for (var fieldName in fields) {            
            if (fieldName !== undefined && fields[fieldName] !== null) {
                postForm.prepend($("<input>").attr("type", "hidden").attr("name", fieldName)
                    .attr("value", fields[fieldName]));
            }
        }
        
        // Create a new post frame        
        $("#tweetpostframe").remove();
        $("<iframe id='tweetpostframe' name='tweetpostframe' style='display:none;'></iframe>")
            .appendTo($("#tweetboxcontainer"));
                
        // Write the contents to the post frame, triggering the submission of the form
        var postFrameDoc = $("#tweetpostframe")[0].contentWindow.document;        
        postFrameDoc.open();
        // We need a surrounding div because html() only writes the inner HTML.
        var frameContents = $("<div>")
            .prepend(postForm).html() + 
            "<script type=\"text/javascript\">" + 
            "window.onload = function(){ document.forms[0].submit(); };" + 
            "</script>";                        
        postFrameDoc.write(frameContents);                    
        postFrameDoc.close();        
        return false;            
    };
    
    this.showUsers = function(role, userId, userName, cursor, callback) {
        var url = this.protocol + this.endpoint + "/1/statuses/" + role + ".json?callback=?";
        var data = { 
            "user_id" : userId,
            "screen_name" : userName,
            "cursor" : cursor            
        };                                 
        this.getJSON(url, data, function(users) {
            callback(role, users);
        });
    };            
    
    this.updateRateLimitStatus = function(callback) {        
        this.getJSON(this.protocol + this.endpoint + "/1/account/rate_limit_status.json?callback=?",
            {}, callback);
    };
}