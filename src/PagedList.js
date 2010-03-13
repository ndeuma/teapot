function PagedList(numPages, controlsNode, fetchFunc, renderFunc) {
        
    this.INFINITE = -1;
    
    this.numPages = numPages;
    
    if (this.numPages === this.INFINITE) {        
        this.isInfinite = true;
    } else {
        this.isInfinite = false;
    }
       
    this.controlsNode = controlsNode;      
    
    this.fetchFunc = fetchFunc;
    
    this.renderFunc = renderFunc;
    
    this.currentPage = 0;
    
    this.pageCache = {};   
    
    this.pageForward = function() {        
        if (!this.isInfinite) {
            if (this.currentPage < this.numPages - 1) {
                this.updatePage(this.currentPage + 1);                        
                this.currentPage++;    
            } else {
                throw "Attempt to move past the last page";
            }                                       
        } else {
            if (this.updatePage(this.currentPage + 1)) {
                this.currentPage++;
            }
        }                        
    };
    
    this.pageBack = function() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.updatePage(this.currentPage);            
        } else {
            throw "Attempt to move past the first page";
        }
    };
    
    this.firstPage = function() {
        this.currentPage = 0;
        this.updatePage(this.currentPage);        
    };
    
    this.lastPage = function() {
        if (!this.isInfinite) {
            this.currentPage = this.numPages - 1;
            this.updatePage(this.numPages - 1);    
        } else {
            throw("Cannot go to last page on infinite list");
        }               
    };    
    
    this.updatePage = function(page) {
        var results = null;
        if (this.pageCache[page]) {            
            console.log("Getting cached results for page " + page);
            results = this.pageCache[page];
        } else {
            results = this.fetchFunc(page);
            if (this.isInfinite && results === null) {
                console.log("The end is reached on page " + (page - 1));
                this.isInfinite = false;
                this.numPages = page;
                return false;                                
            }
            this.pageCache[page] = results;
        }                
        renderFunc(results);            
        this.updateControls(page);
        return true;
    };
    
    this.refresh = function() {
        this.updatePage(this.currentPage);
    }
    
    this.updateControls = function(newCurrentPage) {        
        if (this.isInfinite) {
            controlsNode.html((newCurrentPage + 1));
        } else {
            controlsNode.html((newCurrentPage + 1) + "/" + this.numPages);    
        }        
    };    
}
